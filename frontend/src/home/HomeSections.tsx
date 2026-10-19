import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AREAS } from "../concepts/areas";
import { CONCEPTS, coverageOf, getConcept, type Coverage } from "../concepts/registry";
import type { Level } from "../concepts/types";
import { SHEETS } from "../cheatsheets/registry";
import { useMeta, useT } from "../i18n";
import { DOMAINS, getDomain } from "../labs/domains";
import { labMinutes, LABS, liveLabs } from "../labs/registry";
import { TOOLS } from "../lib/features";
import { areaToken, tokenColor } from "./areaColors";
import { continueItems } from "./continue";
import { PATHS } from "./paths";

const LEVEL_ORDER: Level[] = ["beginner", "intermediate", "advanced"];
const COV_CLASS: Record<Coverage, string> = {
  live: "border-ok/50 bg-ok/10",
  reference: "border-c-amber/50 bg-c-amber/10",
  planned: "border-dashed border-line bg-transparent text-muted",
};
const countCov = (k: Coverage) => CONCEPTS.filter((c) => coverageOf(c) === k).length;

function SectionHead({ id, title, sub, action }: { id: string; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div className="max-w-2xl">
        <h2 id={id} className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        {sub && <p className="mt-1.5 text-sm text-muted sm:text-base">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/** Learn / Practise / Build / Reference / Track, with live counts from the registries. */
export function LayerCards() {
  const t = useT();
  const sheetsLive = SHEETS.filter((s) => s.status === "live").length;
  const labsLive = liveLabs().length;
  const layers = [
    { key: "learn", to: "/concepts", glyph: "🧭", title: t("nav.concepts", "Concepts"), n: CONCEPTS.length, desc: t("homev2.layer.concepts.desc", undefined, { n: CONCEPTS.length, a: AREAS.filter((a) => CONCEPTS.some((c) => c.area === a.id)).length }), tone: "brand" },
    { key: "practise", to: "/labs", glyph: "🧪", title: t("nav.labs"), n: labsLive, desc: t("homev2.layer.labs.desc", undefined, { n: labsLive, p: LABS.length - labsLive }), tone: "c-teal" },
    { key: "build", to: "/tools", glyph: "🛠️", title: t("nav.tools"), n: TOOLS.length, desc: t("homev2.layer.tools.desc", undefined, { n: TOOLS.length }), tone: "c-purple" },
    { key: "reference", to: "/cheatsheets", glyph: "📌", title: t("nav.cheatsheets"), n: sheetsLive, desc: t("homev2.layer.sheets.desc", undefined, { n: sheetsLive, p: SHEETS.length - sheetsLive }), tone: "c-amber" },
    { key: "track", to: "/runs", glyph: "📈", title: t("homev2.layer.runs.title"), n: null, desc: t("homev2.layer.runs.desc"), tone: "pos" },
  ];
  return (
    <section aria-labelledby="layers-title" className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16">
      <SectionHead id="layers-title" title={t("homev2.layers.title")} sub={t("homev2.layers.sub")} />
      <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {layers.map((l) => (
          <li key={l.key}>
            <Link to={l.to} className="card group relative block h-full overflow-hidden p-5 transition hover:-translate-y-0.5 hover:border-brand/50">
              <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: tokenColor(l.tone) }} />
              <p className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider" style={{ color: tokenColor(l.tone) }}>
                {t(`homev2.layer.${l.key}`)}
                <span aria-hidden className="text-lg normal-case">{l.glyph}</span>
              </p>
              <h3 className="mt-3 flex items-baseline gap-2 text-xl font-bold tracking-tight">
                {l.title}
                {l.n !== null && <span className="font-mono text-base font-semibold text-muted" data-testid={`layer-count-${l.key}`}>{l.n}</span>}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{l.desc}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-brand group-hover:underline">{l.key === "track" ? t("homev2.layer.runs.link") : t("homev2.layer.open")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Resume the last lab step, or suggest where to start. */
export function ContinueCard() {
  const t = useT();
  const m = useMeta();
  // read once on mount: progress only changes inside labs, and returning here remounts this page
  const [items] = useState(() => continueItems(LABS));
  const first = liveLabs()[0];

  if (items.length === 0) {
    return (
      <section aria-labelledby="start-title" className="mx-auto max-w-[1200px] px-4 pt-12 sm:px-6">
        <div className="card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6" data-testid="start-here">
          <div className="max-w-2xl">
            <h2 id="start-title" className="text-lg font-bold tracking-tight">{t("homev2.start.title")}</h2>
            <p className="mt-1 text-sm text-muted">{t("homev2.start.text")}</p>
          </div>
          {first && <Link to={`/labs/${first.id}`} className="btn-primary !px-5 !py-2.5">{t("homev2.start.button")}</Link>}
        </div>
      </section>
    );
  }
  return (
    <section aria-labelledby="continue-title" className="mx-auto max-w-[1200px] px-4 pt-12 sm:px-6">
      <h2 id="continue-title" className="text-lg font-bold tracking-tight">{t("homev2.continue.title")}</h2>
      <ul className="mt-3 grid gap-4 md:grid-cols-2">
        {items.map(({ lab, stepId, done, total, percent }) => {
          const step = lab.steps.find((s) => s.id === stepId)!;
          return (
            <li key={lab.id} className="card flex flex-wrap items-center justify-between gap-4 p-5" data-testid="continue-card">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("home.guidedLab", undefined, { n: lab.number })}</p>
                <h3 className="mt-1 font-semibold leading-snug tracking-tight">{m.labTitle(lab)}</h3>
                <p className="mt-1 text-sm text-muted">{t("homev2.continue.last", undefined, { step: m.stepTitle(lab.id, step) })}</p>
                <div className="mt-3 flex items-center gap-3">
                  <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={t("homev2.continue.progress", undefined, { done, total })} className="h-1.5 w-full max-w-[14rem] overflow-hidden rounded-full bg-raised">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="shrink-0 text-xs text-muted">{t("homev2.continue.progress", undefined, { done, total })}</span>
                </div>
              </div>
              <Link to={`/labs/${lab.id}/${stepId}`} className="btn-primary !px-5 !py-2.5">{t("homev2.continue.button")}</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Curated paths from `home/paths.ts`, shown as ordered concept chips. */
export function LearningPaths() {
  const t = useT();
  return (
    <section aria-labelledby="paths-title" className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16">
      <SectionHead id="paths-title" title={t("homev2.paths.title")} sub={t("homev2.paths.sub")} />
      <ul className="mt-7 grid gap-5 lg:grid-cols-3">
        {PATHS.map((p) => {
          const cs = p.concepts.map((id) => getConcept(id)).filter((c): c is NonNullable<typeof c> => !!c);
          const liveN = cs.filter((c) => coverageOf(c) === "live").length;
          const lv = cs.map((c) => LEVEL_ORDER.indexOf(c.level));
          const from = LEVEL_ORDER[Math.min(...lv)];
          const to = LEVEL_ORDER[Math.max(...lv)];
          return (
            <li key={p.id} className="card flex flex-col p-5 sm:p-6" data-testid="learning-path">
              <h3 className="text-lg font-bold tracking-tight">{t(`homev2.path.${p.id}.title`)}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{t(`homev2.path.${p.id}.blurb`)}</p>
              <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                <span className="chip">{t("homev2.paths.count", undefined, { n: cs.length })}</span>
                <span>{from === to ? t(`cc.level.${from}`) : t("homev2.paths.levels", undefined, { from: t(`cc.level.${from}`), to: t(`cc.level.${to}`) })}</span>
              </p>
              <ol className="mt-4 flex flex-1 flex-wrap content-start gap-2">
                {cs.map((c, i) => (
                  <li key={c.id}>
                    <Link to={`/concepts/${c.id}`} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition hover:border-brand ${COV_CLASS[coverageOf(c)]}`}>
                      <span aria-hidden className="font-mono text-[10px] text-muted">{i + 1}</span>
                      {t(`concept.${c.id}.title`, c.title)}
                    </Link>
                  </li>
                ))}
              </ol>
              <div className="mt-5">
                <div aria-hidden className="flex gap-1">
                  {cs.map((c) => <span key={c.id} className="h-1.5 flex-1 rounded-full" style={{ background: coverageOf(c) === "live" ? "rgb(var(--ok))" : coverageOf(c) === "reference" ? "rgb(var(--c-amber))" : "rgb(var(--line))" }} />)}
                </div>
                <p className="mt-2 text-xs text-muted">{t("homev2.paths.live", undefined, { n: liveN, total: cs.length })}</p>
                {cs[0] && <Link to={`/concepts/${cs[0].id}`} className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">{t("homev2.paths.start", undefined, { title: t(`concept.${cs[0].id}.title`, cs[0].title) })}</Link>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Live coverage numbers and the planned concepts. */
export function CoverageStrip() {
  const t = useT();
  const total = CONCEPTS.length;
  const stats: { k: Coverage; n: number; color: string }[] = [
    { k: "live", n: countCov("live"), color: "rgb(var(--ok))" },
    { k: "reference", n: countCov("reference"), color: "rgb(var(--c-amber))" },
    { k: "planned", n: countCov("planned"), color: "rgb(var(--muted) / .45)" },
  ];
  const planned = CONCEPTS.filter((c) => coverageOf(c) === "planned");
  return (
    <section aria-labelledby="coverage-title" className="border-y border-line bg-surface/60">
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16">
        <SectionHead id="coverage-title" title={t("homev2.coverage.title")} sub={t("homev2.coverage.sub")}
          action={<Link to="/coverage" className="text-sm font-semibold text-brand hover:underline">{t("homev2.coverage.link")}</Link>} />
        <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <ul className="grid grid-cols-3 gap-3" data-testid="coverage-numbers">
              {stats.map((s) => (
                <li key={s.k}>
                  <Link to="/coverage" className="card block h-full p-4 transition hover:border-brand/50">
                    <span className="block font-mono text-3xl font-bold tracking-tight" data-testid={`coverage-${s.k}`}>{s.n}</span>
                    <span className="mt-1 block text-xs text-muted sm:text-sm">{t(`homev2.coverage.${s.k}`)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div role="img" aria-label={t("homev2.coverage.bar", undefined, { live: stats[0].n, ref: stats[1].n, planned: stats[2].n, total })} className="mt-4 flex h-3 overflow-hidden rounded-full bg-raised">
              {stats.map((s) => <span key={s.k} style={{ width: `${(s.n / Math.max(total, 1)) * 100}%`, background: s.color }} />)}
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight">{t("homev2.next.title")}</h3>
            <p className="mt-1 text-sm text-muted">{t("homev2.next.sub")}</p>
            {planned.length === 0 ? <p className="mt-3 text-sm text-muted">{t("homev2.next.none")}</p> : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {planned.map((c) => (
                  <li key={c.id}>
                    <Link to={`/concepts/${c.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-muted transition hover:border-brand hover:text-ink">
                      <span aria-hidden className="h-2 w-2 rounded-full border border-dashed" style={{ borderColor: tokenColor(areaToken(c.area, AREAS.findIndex((a) => a.id === c.area))) }} />
                      {t(`concept.${c.id}.title`, c.title)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function DomainChip({ id }: { id: Parameters<typeof getDomain>[0] }) {
  const m = useMeta();
  const d = getDomain(id);
  return <span className={`chip !border-transparent ${d.tint} ${d.text}`}>{d.glyph} {m.domainName(d)}</span>;
}

/** Labs (available and planned) and tools from their registries. Domain is a tag, not the organiser. */
export function LabsAndTools() {
  const t = useT();
  const m = useMeta();
  const live = liveLabs();
  const planned = LABS.filter((l) => l.status === "planned");
  return (
    <section aria-labelledby="work-title" className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16">
      <SectionHead id="work-title" title={t("homev2.work.title")} sub={t("homev2.work.sub")}
        action={<Link to="/labs" className="text-sm font-semibold text-brand hover:underline">{t("homev2.work.allLabs")}</Link>} />
      <ul className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {live.map((lab) => (
          <li key={lab.id}>
            <Link to={`/labs/${lab.id}`} className="card block h-full p-5 transition hover:-translate-y-0.5 hover:border-brand/50">
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip !border-ok/40 !bg-ok/10 !text-ok">{t("home.guidedLab", undefined, { n: lab.number })}</span>
                <DomainChip id={lab.domain} />
              </div>
              <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight">{m.labTitle(lab)}</h3>
              {lab.course && <p className="text-xs text-muted">{lab.course}</p>}
              <p className="mt-2 text-sm text-muted">{m.labSubtitle(lab)}</p>
              <p className="mt-3 text-xs text-muted">{t("home.stepsMin", undefined, { n: lab.steps.length, m: labMinutes(lab) })}</p>
              <span className="mt-3 inline-block text-sm font-semibold text-brand">{t("home.startLab")}</span>
            </Link>
          </li>
        ))}
        {TOOLS.map((x) => (
          <li key={x.id}>
            <Link to={x.path} className="card block h-full p-5 transition hover:-translate-y-0.5 hover:border-brand/50">
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip !border-brand/40 !bg-brand/10 !text-brand">{t("home.tool")}</span>
                <DomainChip id={x.domain} />
              </div>
              <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight">{m.toolTitle(x)}</h3>
              <p className="mt-2 text-sm text-muted">{m.toolTagline(x)}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">{x.tags.map((g) => <span key={g} className="chip">{g}</span>)}</div>
              <span className="mt-3 inline-block text-sm font-semibold text-brand">{t("home.launch")}</span>
            </Link>
          </li>
        ))}
      </ul>

      {planned.length > 0 && (
        <>
          <h3 className="mt-10 text-base font-bold tracking-tight">{t("homev2.work.planned")}</h3>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {planned.map((lab) => (
              <li key={lab.id} className="card border-dashed bg-transparent p-5 opacity-85">
                <div className="flex flex-wrap items-center gap-2"><span className="chip">{t("home.labPlanned", undefined, { n: lab.number })}</span><DomainChip id={lab.domain} /></div>
                <h4 className="mt-3 font-semibold leading-snug tracking-tight">{m.labTitle(lab)}</h4>
                <p className="mt-1.5 text-sm text-muted">{m.labSubtitle(lab)}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-8 flex flex-wrap items-center gap-2 text-sm text-muted">
        <span>{t("homev2.work.filter")}</span>
        {DOMAINS.map((d) => (
          <Link key={d.id} to={`/labs?domain=${d.id}`} className={`chip !border-transparent ${d.tint} ${d.text} hover:underline`}>{d.glyph} {m.domainName(d)}</Link>
        ))}
      </p>
    </section>
  );
}
