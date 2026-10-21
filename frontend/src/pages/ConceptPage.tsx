import { Link, useParams } from "react-router-dom";
import { getArea } from "../concepts/areas";
import { evidenceHref, isHandsOn } from "../concepts/links";
import { CONCEPTS, coverageOf, getConcept } from "../concepts/registry";
import type { Evidence } from "../concepts/types";
import { useMeta, useT } from "../i18n";
import { COVERAGE_STYLE } from "./ConceptsHub";
import { TOOLS } from "../lib/features";
import { getLab } from "../labs/registry";

function useEvidenceLabel() {
  const t = useT();
  const m = useMeta();
  return (e: Evidence): { title: string; kind: string } => {
    const kind = t(`cc.kind.${e.kind}`);
    switch (e.kind) {
      case "lab": {
        const lab = getLab(e.lab)!;
        const step = lab.steps.find((s) => s.id === e.step)!;
        return { kind, title: `${t("lab.labN", undefined, { n: lab.number })} · ${m.stepTitle(lab.id, step)}` };
      }
      case "tool": return { kind, title: m.toolTitle(TOOLS.find((x) => x.id === e.id)!) };
      case "playground": return { kind, title: e.note };
      case "learn": return { kind, title: t(`pg.lc.${e.topic}.title`, e.topic) };
      case "experiment": return { kind, title: t(`pg.exp.${e.id}.title`, e.id) };
      case "page": return { kind, title: e.title };
      case "sheet": return { kind, title: `${t("nav.cheatsheets")} · ${e.section}` };
    }
  };
}

function ConceptLink({ id }: { id: string }) {
  const t = useT();
  const c = getConcept(id)!;
  return (
    <Link to={`/concepts/${c.id}`} className="block rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium hover:border-brand/50 hover:text-brand">
      {t(`concept.${c.id}.title`, c.title)}
    </Link>
  );
}

export function ConceptPage() {
  const { conceptId } = useParams();
  const c = getConcept(conceptId);
  const t = useT();
  const label = useEvidenceLabel();
  if (!c) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">{t("cc.notFound")}</h1>
        <Link to="/concepts" className="btn-primary mt-6 inline-block">{t("cc.back")}</Link>
      </main>
    );
  }
  const area = getArea(c.area);
  const k = coverageOf(c);
  const unlocks = CONCEPTS.filter((x) => x.needs.includes(c.id));

  return (
    <main className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 sm:py-10">
      <Link to="/concepts" className="text-sm text-brand hover:underline">{t("cc.back")}</Link>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="chip">{area.glyph} {t(`area.${area.id}.title`, area.title)}</span>
        <span className="chip">{t(`cc.level.${c.level}`)}</span>
        <span className={`chip ${COVERAGE_STYLE[k]}`}>{t(`cc.cov.${k}`)}</span>
      </div>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{t(`concept.${c.id}.title`, c.title)}</h1>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="card p-5" aria-labelledby="c-what"><h2 id="c-what" className="text-sm font-semibold uppercase tracking-wide text-brand">{t("cc.what")}</h2>
          <p className="mt-2 leading-relaxed">{t(`concept.${c.id}.summary`, c.summary)}</p></section>
        <section className="card p-5" aria-labelledby="c-why"><h2 id="c-why" className="text-sm font-semibold uppercase tracking-wide text-brand">{t("cc.why")}</h2>
          <p className="mt-2 leading-relaxed">{t(`concept.${c.id}.why`, c.why)}</p></section>
      </div>

      {k === "planned" ? (
        <section className="card mt-4 border-dashed p-5" aria-labelledby="c-plan">
          <h2 id="c-plan" className="text-sm font-semibold uppercase tracking-wide text-brand">{t("cc.planned.title")}</h2>
          <p className="mt-2 leading-relaxed">{t(`concept.${c.id}.plan`, c.plan ?? "")}</p>
        </section>
      ) : (
        <>
          <section className="card mt-4 border-brand/30 bg-brand/5 p-5" aria-labelledby="c-try">
            <h2 id="c-try" className="text-sm font-semibold uppercase tracking-wide text-brand">{t("cc.try")}</h2>
            <p className="mt-2 leading-relaxed">{t(`concept.${c.id}.try`, c.tryIt)}</p>
          </section>
          <section className="mt-6" aria-labelledby="c-where">
            <h2 id="c-where" className="text-lg font-bold tracking-tight">{t("cc.where")}</h2>
            <ul className="mt-3 space-y-2">
              {[...c.evidence].sort((a, b) => Number(isHandsOn(b)) - Number(isHandsOn(a))).map((e, i) => {
                const l = label(e);
                return (
                  <li key={i}>
                    <Link to={evidenceHref(e)} className="card flex items-center justify-between gap-3 p-3 transition hover:border-brand/50">
                      <span className="min-w-0">
                        <span className="block text-xs text-muted">{l.kind} · {isHandsOn(e) ? t("cc.handsOn") : t("cc.refOnly")}</span>
                        <span className="block truncate font-medium">{l.title}</span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-brand">{t("cc.open")} →</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <section aria-labelledby="c-needs">
          <h2 id="c-needs" className="text-sm font-semibold uppercase tracking-wide text-muted">{t("cc.needs")}</h2>
          <div className="mt-2 space-y-2">{c.needs.length ? c.needs.map((n) => <ConceptLink key={n} id={n} />) : <p className="text-sm text-muted">{t("cc.none.needs")}</p>}</div>
        </section>
        <section aria-labelledby="c-unlocks">
          <h2 id="c-unlocks" className="text-sm font-semibold uppercase tracking-wide text-muted">{t("cc.unlocks")}</h2>
          <div className="mt-2 space-y-2">{unlocks.length ? unlocks.map((u) => <ConceptLink key={u.id} id={u.id} />) : <p className="text-sm text-muted">{t("cc.none.unlocks")}</p>}</div>
        </section>
      </div>
    </main>
  );
}
