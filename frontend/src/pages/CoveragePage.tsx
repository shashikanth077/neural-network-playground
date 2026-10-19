import { Link } from "react-router-dom";
import { AREAS } from "../concepts/areas";
import { CONCEPTS, coverageOf } from "../concepts/registry";
import type { Evidence } from "../concepts/types";
import { useT } from "../i18n";
import { COVERAGE_STYLE } from "./ConceptsHub";

const KINDS: Evidence["kind"][] = ["learn", "playground", "experiment", "lab", "tool", "page", "sheet"];

export function CoveragePage() {
  const t = useT();
  const total = CONCEPTS.length;
  const count = (k: ReturnType<typeof coverageOf>) => CONCEPTS.filter((c) => coverageOf(c) === k).length;
  const planned = CONCEPTS.filter((c) => coverageOf(c) === "planned");

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-12">
      <p className="font-mono text-sm text-brand">{t("cov.eyebrow")}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{t("cov.title")}</h1>
      <p className="mt-2 max-w-3xl text-muted">{t("cov.intro")}</p>
      <p className="mt-3 text-sm font-semibold" data-testid="coverage-summary">{t("cov.summary", undefined, { live: count("live"), ref: count("reference"), planned: count("planned"), total })}</p>

      <h2 className="mt-8 text-lg font-bold tracking-tight">{t("cov.byArea")}</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {AREAS.map((a) => {
          const list = CONCEPTS.filter((c) => c.area === a.id);
          const live = list.filter((c) => coverageOf(c) === "live").length;
          const pct = list.length ? Math.round((live / list.length) * 100) : 0;
          return (
            <li key={a.id} className="card p-4">
              <p className="font-semibold"><span aria-hidden>{a.glyph}</span> {t(`area.${a.id}.title`, a.title)}</p>
              <p className="mt-1 font-mono text-sm">{live}/{list.length}</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-raised" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={t(`area.${a.id}.title`, a.title)}>
                <div className="h-full rounded-full bg-ok" style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="card mt-8 overflow-x-auto p-2">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="p-2">{t("cov.concept")}</th>
              {KINDS.map((k) => <th key={k} className="p-2 text-center">{t(`cc.kind.${k}`)}</th>)}
              <th className="p-2">{t("cov.status")}</th>
            </tr>
          </thead>
          <tbody>
            {AREAS.map((a) => (
              <FragmentRows key={a.id} areaId={a.id} />
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-bold tracking-tight">{t("cov.gaps")}</h2>
      <ul className="mt-3 grid gap-3 md:grid-cols-2">
        {planned.map((c) => (
          <li key={c.id} className="card border-dashed p-4">
            <Link to={`/concepts/${c.id}`} className="font-semibold hover:text-brand">{t(`concept.${c.id}.title`, c.title)}</Link>
            <p className="mt-1 text-sm text-muted">{t(`concept.${c.id}.plan`, c.plan ?? "")}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}

function FragmentRows({ areaId }: { areaId: string }) {
  const t = useT();
  const list = CONCEPTS.filter((c) => c.area === areaId);
  const area = AREAS.find((a) => a.id === areaId)!;
  return (
    <>
      <tr className="bg-raised/50"><th colSpan={KINDS.length + 2} className="p-2 text-xs font-semibold uppercase tracking-wider text-muted">{area.glyph} {t(`area.${area.id}.title`, area.title)}</th></tr>
      {list.map((c) => {
        const k = coverageOf(c);
        return (
          <tr key={c.id} className="border-b border-line/60">
            <td className="p-2"><Link to={`/concepts/${c.id}`} className="font-medium hover:text-brand">{t(`concept.${c.id}.title`, c.title)}</Link></td>
            {KINDS.map((kind) => {
              const n = c.evidence.filter((e) => e.kind === kind).length;
              return <td key={kind} className="p-2 text-center font-mono" aria-label={`${t(`cc.kind.${kind}`)}: ${n}`}>{n ? <span className="text-ok">{n}</span> : <span className="text-muted/50">·</span>}</td>;
            })}
            <td className="p-2"><span className={`chip ${COVERAGE_STYLE[k]}`}>{t(`cc.cov.${k}`)}</span></td>
          </tr>
        );
      })}
    </>
  );
}
