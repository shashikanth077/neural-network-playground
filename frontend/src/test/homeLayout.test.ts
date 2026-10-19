import { describe, expect, it } from "vitest";
import { AREAS } from "../concepts/areas";
import { CONCEPTS } from "../concepts/registry";
import { layoutConceptMap, type LayoutConcept } from "../home/layout";

const minDistance = (pts: { x: number; y: number }[]) => {
  let min = Infinity;
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) min = Math.min(min, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y));
  return min;
};

describe("concept map layout", () => {
  const layout = layoutConceptMap(CONCEPTS, AREAS);

  it("places every concept exactly once and every prerequisite as an edge", () => {
    expect(layout.nodes.map((n) => n.id).sort()).toEqual(CONCEPTS.map((c) => c.id).sort());
    const edges = CONCEPTS.reduce((n, c) => n + c.needs.length, 0);
    expect(layout.edges).toHaveLength(edges);
  });

  it("is deterministic and independent of registry order", () => {
    expect(layoutConceptMap(CONCEPTS, AREAS)).toEqual(layout);
    expect(layoutConceptMap([...CONCEPTS].reverse(), AREAS)).toEqual(layout);
  });

  it("keeps nodes apart (no overlaps) and inside the canvas", () => {
    expect(minDistance(layout.nodes)).toBeGreaterThanOrEqual(layout.radius * 3);
    for (const n of layout.nodes) {
      expect(n.x).toBeGreaterThan(layout.radius);
      expect(n.x).toBeLessThan(layout.width - layout.radius);
      expect(n.y).toBeGreaterThan(layout.radius);
      expect(n.y).toBeLessThan(layout.height - layout.radius);
    }
  });

  it("puts a concept in its area's column and below everything it needs", () => {
    const at = new Map(layout.nodes.map((n) => [n.id, n]));
    const cols = new Map(layout.columns.map((c) => [c.area, c]));
    for (const c of CONCEPTS) {
      const n = at.get(c.id)!;
      const col = cols.get(c.area)!;
      expect(n.x).toBeGreaterThanOrEqual(col.x);
      expect(n.x).toBeLessThanOrEqual(col.x + col.width);
      for (const need of c.needs) expect(n.y).toBeGreaterThan(at.get(need)!.y);
    }
  });

  it("scales to a much larger registry with more areas, and survives a cycle", () => {
    const areas = Array.from({ length: 12 }, (_, i) => ({ id: `a${i}` }));
    const big: LayoutConcept[] = Array.from({ length: 150 }, (_, i) => ({
      id: `c${String(i).padStart(3, "0")}`, area: `a${i % 12}`, needs: i >= 12 ? [`c${String(i - 12).padStart(3, "0")}`] : [],
    }));
    const l = layoutConceptMap(big, areas);
    expect(l.nodes).toHaveLength(150);
    expect(minDistance(l.nodes)).toBeGreaterThanOrEqual(l.radius * 3);

    const cyc = layoutConceptMap([{ id: "x", area: "a0", needs: ["y"] }, { id: "y", area: "a0", needs: ["x"] }], areas);
    expect(cyc.nodes).toHaveLength(2);
  });

  it("handles an empty registry", () => {
    const l = layoutConceptMap([], AREAS);
    expect(l.nodes).toEqual([]);
  });
});
