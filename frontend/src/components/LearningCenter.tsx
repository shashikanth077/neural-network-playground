import { useMemo, useState } from "react";
import { useEvaluation } from "../hooks/useEvaluation";
import type { Playground } from "../hooks/usePlayground";
import { useT } from "../i18n";
import { TOPICS, useTopicNames, type LearnCtx } from "./learning";
import { Tex } from "./Tex";

export function LearningCenter({ pg }: { pg: Playground }) {
  const t = useT();
  const names = useTopicNames();
  const [id, setId] = useState(TOPICS[0].id);
  const topic = TOPICS.find((x) => x.id === id)!;
  const hasVal = (pg.session?.n_val ?? 0) > 0;
  const { data: evaluation } = useEvaluation(pg.session?.session_id ?? null, pg.session?.epoch ?? 0, pg.status, hasVal ? "val" : "train", 0.5);
  const ctx: LearnCtx = { config: pg.config, session: pg.session, history: pg.history, params: pg.params, evaluation };
  const groups = useMemo(() => [...new Set(TOPICS.map((t) => t.group))], []);

  return (
    <section id="learn" className="card p-4 sm:p-5" aria-labelledby="learn-title">
      <h2 id="learn-title" className="text-lg font-bold tracking-tight">{t("pg.lc.title")}</h2>
      <p className="mt-1 text-sm text-muted">{t("pg.lc.intro")}</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-[250px_1fr]">
        <nav aria-label={t("pg.lc.topics")} className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {groups.map((g) => (
            <div key={g} className="flex shrink-0 gap-1.5 lg:flex-col lg:gap-0">
              <p className="hidden px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted lg:block">{t(`pg.lc.group.${g}`)}</p>
              {TOPICS.filter((x) => x.group === g).map((tp) => (
                <button key={tp.id} onClick={() => setId(tp.id)} aria-current={tp.id === id ? "true" : undefined}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-left text-sm transition ${tp.id === id ? "bg-brand/10 font-semibold text-brand" : "text-muted hover:bg-raised hover:text-ink"}`}>
                  {t(`pg.lc.${tp.id}.title`)}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <article className="min-w-0" aria-live="polite">
          <h3 className="text-base font-semibold">{t(`pg.lc.${topic.id}.title`)}</h3>
          <p className="mt-2 text-sm leading-relaxed">{t(`pg.lc.${topic.id}.plain`)}</p>
          {topic.formulas?.map((f, i) => (
            <div key={i} className="mt-3 rounded-xl bg-raised/70 p-3">
              <Tex block>{f.tex}</Tex>
              <dl className="mt-1 grid gap-x-6 gap-y-0.5 text-xs text-muted sm:grid-cols-2">
                {f.vars.map((k, j) => (
                  <div key={k + j} className="flex gap-2"><dt className="shrink-0"><Tex>{k}</Tex></dt><dd>{t(`pg.lc.${topic.id}.f${i}.v${j}`)}</dd></div>
                ))}
              </dl>
            </div>
          ))}
          <div className="mt-3 rounded-xl border border-brand/30 bg-brand/5 p-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">{t("pg.lc.inYours")}</p>
            <div className="mt-1">{topic.experiment(ctx, t, names)}</div>
          </div>
          {topic.widget && <div className="mt-3">{topic.widget(ctx)}</div>}
        </article>
      </div>
    </section>
  );
}
