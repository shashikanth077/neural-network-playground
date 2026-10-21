import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AREAS } from "../concepts/areas";
import { isHandsOn } from "../concepts/links";
import { CONCEPTS, coverageOf, type Coverage } from "../concepts/registry";
import type { Level } from "../concepts/types";
import { useT } from "../i18n";

export const COVERAGE_STYLE: Record<Coverage, string> = {
  live: "!border-ok/40 !bg-ok/10 !text-ok",
  reference: "!border-c-amber/40 !bg-c-amber/10 !text-c-amber",
  planned: "",
};
const LEVELS: Level[] = ["beginner", "intermediate", "advanced"];
const COVS: Coverage[] = ["live", "reference", "planned"];

function Pills<T extends string>({ label, value, onChange, options }: { label: string; value: T | "all"; onChange: (v: T | "all") => void; options: { v: T | "all"; text: string }[] }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-xl border border-line bg-raised/60 p-1">
      {options.map((o) => (
        <button key={o.v} role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${value === o.v ? "bg-surface text-brand shadow-sm" : "text-muted hover:text-ink"}`}>{o.text}</button>
      ))}
    </div>
  );
}

export function ConceptsHub() {
  const t = useT();
  const [q, setQ] = useState("");
  const [area, setArea] = useState<string>("all");
  const [level, setLevel] = useState<Level | "all">("all");
  const [cov, setCov] = useState<Coverage | "all">("all");

  const shown = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    return CONCEPTS.filter((c) =>
      (area === "all" || c.area === area) && (level === "all" || c.level === level) && (cov === "all" || coverageOf(c) === cov) &&
      terms.every((w) => `${c.title} ${c.summary} ${c.id} ${t(`concept.${c.id}.title`, c.title)} ${t(`concept.${c.id}.summary`, c.summary)}`.toLowerCase().includes(w)));
  }, [q, area, level, cov, t]);

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-12">
      <p className="font-mono text-sm text-brand">{t("cc.eyebrow")}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{t("cc.title")}</h1>
      <p className="mt-2 max-w-3xl text-muted">{t("cc.intro")}</p>
      <Link to="/coverage" className="mt-2 inline-block text-sm font-semibold text-brand hover:underline">{t("cc.coverageLink")}</Link>

      <div className="mt-6 space-y-3">
        <label htmlFor="concept-search" className="sr-only">{t("cc.search")}</label>
        <input id="concept-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("cc.searchPh")}
          className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand" />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Pills label={t("cc.filter.area")} value={area} onChange={setArea}
            options={[{ v: "all", text: t("cc.all") }, ...AREAS.map((a) => ({ v: a.id as string, text: `${a.glyph} ${t(`area.${a.id}.title`, a.title)}` }))]} />
          <Pills label={t("cc.filter.level")} value={level} onChange={setLevel}
            options={[{ v: "all", text: t("cc.all") }, ...LEVELS.map((l) => ({ v: l, text: t(`cc.level.${l}`) }))]} />
          <Pills label={t("cc.filter.coverage")} value={cov} onChange={setCov}
            options={[{ v: "all", text: t("cc.all") }, ...COVS.map((c) => ({ v: c, text: t(`cc.cov.${c}`) }))]} />
        </div>
        <p className="text-xs text-muted" role="status">{t("cc.count", undefined, { a: shown.length, b: CONCEPTS.length })}</p>
      </div>

      {shown.length === 0 && <p className="card mt-6 p-6 text-center text-sm text-muted">{t("cc.none")}</p>}
      {AREAS.map((a) => {
        const list = shown.filter((c) => c.area === a.id);
        if (!list.length) return null;
        return (
          <section key={a.id} className="mt-8" aria-labelledby={`area-${a.id}`}>
            <h2 id={`area-${a.id}`} className="flex items-center gap-2 text-lg font-bold tracking-tight"><span aria-hidden>{a.glyph}</span>{t(`area.${a.id}.title`, a.title)}</h2>
            <p className="text-sm text-muted">{t(`area.${a.id}.blurb`, a.blurb)}</p>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => {
                const k = coverageOf(c);
                const n = c.evidence.filter(isHandsOn).length;
                return (
                  <li key={c.id}>
                    <Link to={`/concepts/${c.id}`} className={`card block h-full p-4 transition hover:-translate-y-0.5 hover:border-brand/50 ${k === "planned" ? "border-dashed opacity-80" : ""}`}>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`chip ${COVERAGE_STYLE[k]}`}>{t(`cc.cov.${k}`)}</span>
                        <span className="chip">{t(`cc.level.${c.level}`)}</span>
                      </div>
                      <h3 className="mt-2 font-semibold leading-snug tracking-tight">{t(`concept.${c.id}.title`, c.title)}</h3>
                      <p className="mt-1 text-sm text-muted">{t(`concept.${c.id}.summary`, c.summary)}</p>
                      {n > 0 && <p className="mt-2 text-xs text-muted">{n === 1 ? t("cc.example") : t("cc.examples", undefined, { n })}</p>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
