import type { AreaId, Concept } from "../concepts/types";

/** Minimal shape the layout needs, so it works for any registry content (and for tests). */
export type LayoutConcept = Pick<Concept, "id" | "needs"> & { area: AreaId | string };

export interface MapNode { id: string; area: string; depth: number; column: number; x: number; y: number }
export interface MapEdge { from: string; to: string }
export interface MapLayout {
  width: number;
  height: number;
  radius: number;
  nodes: MapNode[];
  edges: MapEdge[];
  /** One column per area that has concepts, left to right. */
  columns: { area: string; x: number; width: number }[];
}

export interface LayoutOptions {
  width?: number;
  radius?: number;
  /** Minimum centre-to-centre distance between two nodes in the same row of a column. */
  minGap?: number;
  rowGap?: number;
  subRowGap?: number;
  top?: number;
  bottom?: number;
}

const round = (n: number) => Math.round(n * 100) / 100;
const byIdAsc = (p: string, q: string) => (p < q ? -1 : p > q ? 1 : 0);

/**
 * Deterministic layered layout for the concept map: one column per area (in the order given),
 * one layer per prerequisite depth (longest chain of `needs`). Nodes that share an area and depth
 * are spread across the column, wrapping into sub-rows when the column is narrow.
 * The result depends only on the data, never on input order or randomness.
 */
export function layoutConceptMap(concepts: LayoutConcept[], areas: { id: string }[], opts: LayoutOptions = {}): MapLayout {
  const width = opts.width ?? 1200;
  const radius = opts.radius ?? 9;
  const minGap = opts.minGap ?? radius * 5;
  const rowGap = opts.rowGap ?? 60;
  const subRowGap = opts.subRowGap ?? radius * 3.4;
  const top = opts.top ?? 58;
  const bottom = opts.bottom ?? 34;

  const byId = new Map(concepts.map((c) => [c.id, c]));
  const depthMemo = new Map<string, number>();
  const depthOf = (id: string, seen: Set<string> = new Set()): number => {
    const known = depthMemo.get(id);
    if (known !== undefined) return known;
    if (seen.has(id)) return 0; // cycle guard: registry tests forbid cycles, the layout must still terminate
    seen.add(id);
    const c = byId.get(id);
    const d = c ? c.needs.filter((n) => byId.has(n)).reduce((m, n) => Math.max(m, depthOf(n, seen) + 1), 0) : 0;
    seen.delete(id);
    depthMemo.set(id, d);
    return d;
  };

  const usedAreas = areas.filter((a) => concepts.some((c) => c.area === a.id));
  const colW = width / Math.max(1, usedAreas.length);
  const perRow = Math.max(1, Math.floor(colW / minGap));
  const maxDepth = concepts.reduce((m, c) => Math.max(m, depthOf(c.id)), 0);

  // cell = (area, depth), sorted by id so the result does not depend on registry order
  const cell = (area: string, depth: number) =>
    concepts.filter((c) => c.area === area && depthOf(c.id) === depth).map((c) => c.id).sort(byIdAsc);

  // each depth layer is as tall as its fullest cell
  const subRows: number[] = [];
  for (let d = 0; d <= maxDepth; d++) {
    subRows.push(Math.max(1, ...usedAreas.map((a) => Math.ceil(cell(a.id, d).length / perRow))));
  }
  const layerTop: number[] = [];
  let y = top;
  for (let d = 0; d <= maxDepth; d++) {
    layerTop.push(y);
    y += (subRows[d] - 1) * subRowGap + rowGap;
  }
  const height = y - rowGap + bottom;

  const nodes: MapNode[] = [];
  usedAreas.forEach((a, column) => {
    const x0 = column * colW;
    for (let d = 0; d <= maxDepth; d++) {
      const ids = cell(a.id, d);
      for (let r = 0; r * perRow < ids.length; r++) {
        const row = ids.slice(r * perRow, (r + 1) * perRow);
        const step = colW / Math.max(row.length, 1);
        row.forEach((id, i) => {
          nodes.push({ id, area: a.id, depth: d, column, x: round(x0 + step * (i + 0.5)), y: round(layerTop[d] + r * subRowGap) });
        });
      }
    }
  });
  nodes.sort((p, q) => byIdAsc(p.id, q.id));

  const edges: MapEdge[] = [];
  for (const c of [...concepts].sort((p, q) => byIdAsc(p.id, q.id))) {
    for (const n of [...c.needs].sort(byIdAsc)) if (byId.has(n)) edges.push({ from: n, to: c.id });
  }
  return {
    width, height: round(height), radius, nodes, edges,
    columns: usedAreas.map((a, i) => ({ area: a.id, x: round(i * colW), width: round(colW) })),
  };
}
