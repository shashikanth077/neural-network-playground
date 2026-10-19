import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AREAS } from "../concepts/areas";
import { CONCEPTS, coverageOf, type Coverage } from "../concepts/registry";
import type { Area, Concept } from "../concepts/types";
import { useT } from "../i18n";
import { areaToken, tokenColor } from "./areaColors";
import { layoutConceptMap } from "./layout";
import { useMediaQuery, usePrefersReducedMotion } from "./useMedia";

interface Props { concepts?: Concept[]; areas?: Area[] }

/** Wide screens get the full map; below this width a grouped list is easier to read and tap. */
const WIDE = "(min-width: 820px)";

function CoverageGlyph({ cov, token }: { cov: Coverage; token: string }) {
  const c = tokenColor(token);
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="shrink-0">
      <circle cx="7" cy="7" r="5" style={cov === "live" ? { fill: c, stroke: c } : cov === "reference" ? { fill: tokenColor(token, 0.35), stroke: c } : { fill: "none", stroke: tokenColor(token, 0.8) }}
        strokeWidth="1.6" strokeDasharray={cov === "planned" ? "2.5 2" : undefined} />
    </svg>
  );
}

/** The live concept map: nodes are the registry's concepts, edges are prerequisites. Never hard-codes a concept or area. */
export function ConceptMap({ concepts = CONCEPTS, areas = AREAS }: Props) {
  const t = useT();
  const reduced = usePrefersReducedMotion();
  const wide = useMediaQuery(WIDE, true);
  const [hover, setHover] = useState<string | null>(null);
  const [areaFocus, setAreaFocus] = useState<string | null>(null);

  const usedAreas = useMemo(() => areas.filter((a) => concepts.some((c) => c.area === a.id)), [areas, concepts]);
  const layout = useMemo(() => layoutConceptMap(concepts, usedAreas), [concepts, usedAreas]);
  const byId = useMemo(() => new Map(concepts.map((c) => [c.id, c])), [concepts]);
  const pos = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout]);
  const token = (areaId: string) => areaToken(areaId, usedAreas.findIndex((a) => a.id === areaId));
  const title = (c: Concept) => t(`concept.${c.id}.title`, c.title);
  const areaTitle = (a: Area) => t(`area.${a.id}.title`, a.title);
  const covLabel = (c: Concept) => t(`cc.cov.${coverageOf(c)}`);

  // concepts connected to the hovered/focused one stay bright
  const linked = useMemo(() => {
    const s = new Set<string>();
    if (hover) {
      s.add(hover);
      for (const e of layout.edges) { if (e.from === hover) s.add(e.to); if (e.to === hover) s.add(e.from); }
    }
    return s;
  }, [hover, layout.edges]);

  const nodeOpacity = (id: string, area: string, cov: Coverage) => {
    const base = cov === "planned" ? 0.75 : 1;
    if (hover) return linked.has(id) ? 1 : 0.22;
    if (areaFocus) return area === areaFocus ? 1 : 0.2;
    return base;
  };

  const tip = hover ? pos.get(hover) : undefined;
  const tipConcept = hover ? byId.get(hover) : undefined;

  const header = (
    <div className="max-w-2xl">
      <h2 id="map-title" className="text-2xl font-bold tracking-tight sm:text-3xl">{t("homev2.map.title")}</h2>
      <p className="mt-1.5 text-sm text-muted sm:text-base">{t("homev2.map.sub")}</p>
    </div>
  );

  if (!wide) {
    return (
      <section aria-labelledby="map-title" className="cm-panel" data-testid="concept-map" data-layout="list">
        {header}
        <p className="mt-2 text-xs text-muted">{t("homev2.map.mobile")}</p>
        <div className="mt-4 space-y-4">
          {usedAreas.map((a) => (
            <div key={a.id}>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: tokenColor(token(a.id)) }} />
                <span aria-hidden>{a.glyph}</span>
                {areaTitle(a)}
                <span className="font-normal text-muted">· {t("homev2.map.count", undefined, { n: concepts.filter((c) => c.area === a.id).length })}</span>
              </h3>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {concepts.filter((c) => c.area === a.id).map((c) => {
                  const cov = coverageOf(c);
                  return (
                    <li key={c.id}>
                      <Link to={`/concepts/${c.id}`} data-concept={c.id}
                        className={`inline-flex items-center gap-1.5 rounded-full border bg-surface px-2.5 py-1 text-xs font-medium ${cov === "planned" ? "border-dashed text-muted" : ""}`}
                        style={{ borderColor: tokenColor(token(a.id), cov === "planned" ? 0.6 : 0.9) }}>
                        <CoverageGlyph cov={cov} token={token(a.id)} />
                        {title(c)}
                        <span className="sr-only">, {covLabel(c)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const r = layout.radius;
  const tipLeft = tip ? Math.min(86, Math.max(14, (tip.x / layout.width) * 100)) : 0;
  const tipBelow = tip ? tip.y < 110 : false;

  return (
    <section aria-labelledby="map-title" className="cm-panel" data-testid="concept-map" data-layout="map" data-motion={reduced ? "off" : "on"}>
      {header}
      <a href="#after-concept-map" className="sr-only focus:not-sr-only focus:mt-2 focus:inline-block focus:rounded-md focus:bg-surface focus:px-3 focus:py-1.5 focus:text-sm focus:font-semibold focus:text-brand">
        {t("homev2.map.skip")}
      </a>

      <div className="relative mt-5">
        <svg viewBox={`0 0 ${layout.width} ${layout.height}`} className="block h-auto w-full" role="group"
          aria-label={t("homev2.map.alt", undefined, { n: concepts.length, a: usedAreas.length })}>
          {layout.columns.map((col) => {
            const a = usedAreas.find((x) => x.id === col.area)!;
            const tk = token(col.area);
            return (
              <g key={col.area} aria-hidden>
                <rect x={col.x + 4} y={6} width={col.width - 8} height={layout.height - 12} rx={16}
                  style={{ fill: tokenColor(tk, areaFocus === col.area ? 0.14 : 0.05), stroke: tokenColor(tk, areaFocus === col.area ? 0.55 : 0.2) }} />
                <text x={col.x + col.width / 2} y={34} textAnchor="middle" fontSize="22">{a.glyph}</text>
              </g>
            );
          })}

          <g aria-hidden fill="none">
            {layout.edges.map((e) => {
              const p = pos.get(e.from)!; const q = pos.get(e.to)!;
              const my = (p.y + q.y) / 2;
              const hot = hover ? e.from === hover || e.to === hover : false;
              const dim = hover ? !hot : areaFocus ? !(p.area === areaFocus || q.area === areaFocus) : false;
              const planned = coverageOf(byId.get(e.to)!) === "planned" || coverageOf(byId.get(e.from)!) === "planned";
              return (
                <path key={`${e.from}>${e.to}`} d={`M${p.x} ${p.y} C${p.x} ${my} ${q.x} ${my} ${q.x} ${q.y}`} data-edge={`${e.from}>${e.to}`}
                  strokeWidth={hot ? 2.2 : 1.3} strokeDasharray={planned ? "4 4" : undefined}
                  style={{ stroke: hot ? tokenColor(token(q.area)) : "rgb(var(--muted))", opacity: hot ? 0.95 : dim ? 0.06 : planned ? 0.22 : 0.32 }} />
              );
            })}
          </g>

          {layout.nodes.map((n, i) => {
            const c = byId.get(n.id)!;
            const cov = coverageOf(c);
            const tk = token(n.area);
            const color = tokenColor(tk);
            return (
              <Link key={n.id} to={`/concepts/${n.id}`} className="cm-node" data-concept={n.id} data-coverage={cov}
                aria-label={`${title(c)}, ${areaTitle(usedAreas.find((a) => a.id === n.area)!)}, ${covLabel(c)}`}
                onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover((h) => (h === n.id ? null : h))}
                onFocus={() => setHover(n.id)} onBlur={() => setHover((h) => (h === n.id ? null : h))}
                style={{ opacity: nodeOpacity(n.id, n.area, cov) }}>
                <circle cx={n.x} cy={n.y} r={r + 8} fill="transparent" />
                <circle className="cm-ring" cx={n.x} cy={n.y} r={r + 5} fill="none" strokeWidth="2.5" style={{ stroke: "rgb(var(--ink))" }} />
                {!reduced && cov === "live" && (
                  <circle className="cm-halo" cx={n.x} cy={n.y} r={r} style={{ fill: tokenColor(tk, 0.35), animationDelay: `${(i % 11) * 0.35}s` }} />
                )}
                <circle cx={n.x} cy={n.y} r={r} strokeWidth={cov === "planned" ? 2 : 1.8} strokeDasharray={cov === "planned" ? "3.2 2.6" : undefined}
                  style={cov === "live" ? { fill: color, stroke: color } : cov === "reference" ? { fill: tokenColor(tk, 0.3), stroke: color } : { fill: "rgb(var(--surface))", stroke: tokenColor(tk, 0.85) }} />
              </Link>
            );
          })}
        </svg>

        {tip && tipConcept && (
          <div aria-hidden data-testid="map-tooltip"
            className="pointer-events-none absolute z-10 w-max max-w-[16rem] rounded-xl border border-line bg-surface px-3 py-2 text-left shadow-card"
            style={{ left: `${tipLeft}%`, top: `${(tip.y / layout.height) * 100}%`, transform: tipBelow ? `translate(-50%, ${r + 14}px)` : `translate(-50%, calc(-100% - ${r + 12}px))` }}>
            <p className="text-sm font-semibold leading-snug">{title(tipConcept)}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
              <CoverageGlyph cov={coverageOf(tipConcept)} token={token(tipConcept.area)} />
              {covLabel(tipConcept)} · {t(`cc.level.${tipConcept.level}`)}
              {tipConcept.needs.length > 0 && <> · {t("homev2.map.needs", undefined, { n: tipConcept.needs.length })}</>}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 text-xs sm:flex-row sm:items-start sm:justify-between">
        <div role="group" aria-label={t("homev2.map.legend.areas")} className="flex flex-wrap gap-1.5">
          {usedAreas.map((a) => (
            <button key={a.id} type="button" aria-pressed={areaFocus === a.id}
              onClick={() => setAreaFocus((f) => (f === a.id ? null : a.id))}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium transition hover:bg-raised ${areaFocus === a.id ? "bg-raised" : "bg-surface"}`}
              style={{ borderColor: tokenColor(token(a.id), areaFocus === a.id ? 0.95 : 0.45) }}>
              <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: tokenColor(token(a.id)) }} />
              {areaTitle(a)}
            </button>
          ))}
        </div>
        <ul aria-label={t("homev2.map.legend.status")} className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-muted">
          {(["live", "reference", "planned"] as Coverage[]).map((k) => (
            <li key={k} className="inline-flex items-center gap-1.5"><CoverageGlyph cov={k} token="ink" />{t(`cc.cov.${k}`)}</li>
          ))}
        </ul>
      </div>
      <div id="after-concept-map" tabIndex={-1} />
    </section>
  );
}
