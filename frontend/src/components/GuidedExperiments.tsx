import { useState } from "react";
import type { Playground } from "../hooks/usePlayground";
import { useT } from "../i18n";
import { EXPERIMENTS, type Experiment, type ExperimentVariant } from "../lib/experiments";
import type { Preset } from "../lib/presets";
import { goToSection } from "./PlaygroundGuide";
import { Rich, SectionHelp } from "./SectionHelp";

/** Builds the preset that "Apply" hands to the Playground (dataset + config, then training is reset). */
export function experimentPreset(exp: Experiment, v: ExperimentVariant, title: string): Preset {
  return {
    id: `exp-${exp.id}`,
    title,
    summary: "",
    dataset: v.dataset ?? exp.dataset,
    config: { ...exp.config, ...v.config },
    observe: [],
  };
}

export function GuidedExperiments({ pg }: { pg: Playground }) {
  const t = useT();
  const [id, setId] = useState(EXPERIMENTS[0].id);
  const [applied, setApplied] = useState<string | null>(null); // "<experiment>:<variant>"
  const exp = EXPERIMENTS.find((e) => e.id === id)!;
  const many = exp.variants.length > 1;
  const title = t(`pg.exp.${exp.id}.title`);

  const apply = (v: ExperimentVariant) => {
    void pg.applyPreset(experimentPreset(exp, v, title));
    setApplied(`${exp.id}:${v.id}`);
  };

  return (
    <section className="card p-4 sm:p-5" aria-labelledby="exp-title" id="section-experiments">
      <h2 id="exp-title" className="text-lg font-bold tracking-tight">{t("pg.exp.title")}</h2>
      <p className="mt-1 text-sm text-muted">{t("pg.exp.intro")}</p>
      <SectionHelp id="experiments" className="mt-3" />
      <div className="mt-4 grid gap-4 lg:grid-cols-[250px_1fr]">
        <nav aria-label={t("pg.exp.list")} className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {EXPERIMENTS.map((e, i) => (
            <button
              key={e.id}
              type="button"
              data-experiment={e.id}
              onClick={() => setId(e.id)}
              aria-current={e.id === id ? "true" : undefined}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-left text-sm transition ${e.id === id ? "bg-brand/10 font-semibold text-brand" : "text-muted hover:bg-raised hover:text-ink"}`}
            >
              <span className="mr-1.5 font-mono text-xs">{i + 1}.</span>{t(`pg.exp.${e.id}.title`)}
            </button>
          ))}
        </nav>

        <article className="min-w-0" aria-labelledby="exp-current">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id="exp-current" className="text-base font-semibold">{title}</h3>
            <span className="chip !border-brand/30 !text-brand"><span aria-hidden className="mr-1">▤</span>{t(`pg.exp.${exp.id}.lecture`)}</span>
          </div>
          <div className="mt-3 space-y-3 text-sm">
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("pg.exp.goal")}</h4>
              <p className="mt-0.5 leading-relaxed">{t(`pg.exp.${exp.id}.goal`)}</p>
            </div>
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("pg.exp.setup")}</h4>
              <p className="mt-0.5 leading-relaxed text-muted">{t(`pg.exp.${exp.id}.setup`)}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label={t("pg.exp.applyGroup")}>
            {exp.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                data-variant={v.id}
                className="btn-primary !py-1.5 !text-xs"
                onClick={() => apply(v)}
              >
                {many ? t("pg.exp.applyVariant", undefined, { v: t(`pg.exp.${exp.id}.v.${v.id}`) }) : t("pg.exp.apply")}
              </button>
            ))}
          </div>
          <p className="mt-2 min-h-[1.25rem] text-xs text-muted" role="status" aria-live="polite">
            {applied?.startsWith(`${exp.id}:`) && (
              <>
                {t("pg.exp.applied")}{" "}
                <button type="button" className="font-medium text-brand underline underline-offset-2" onClick={() => goToSection(exp.readIn)}>
                  {t("pg.exp.goRead")}
                </button>
              </>
            )}
          </p>

          <div className="mt-3 space-y-3 text-sm">
            <div className="rounded-xl bg-raised/70 p-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("pg.exp.watch")}</h4>
              <p className="mt-0.5 leading-relaxed"><Rich text={t(`pg.exp.${exp.id}.watch`)} /></p>
            </div>
            <div className="rounded-xl border border-brand/30 bg-brand/5 p-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-brand">{t("pg.exp.expect")}</h4>
              <p className="mt-0.5 leading-relaxed"><Rich text={t(`pg.exp.${exp.id}.expect`)} /></p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">{t("pg.exp.seedNote")}</p>
        </article>
      </div>
    </section>
  );
}
