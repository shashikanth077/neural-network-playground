import { useState } from "react";
import type { Playground } from "../hooks/usePlayground";
import { TOPICS, type LearnCtx } from "./learning";
import { Tex } from "./Tex";

export function LearningCenter({ pg }: { pg: Playground }) {
  const [id, setId] = useState(TOPICS[0].id);
  const topic = TOPICS.find((t) => t.id === id)!;
  const ctx: LearnCtx = { config: pg.config, session: pg.session, history: pg.history, params: pg.params };

  return (
    <section id="learn" className="card p-4 sm:p-5" aria-labelledby="learn-title">
      <h2 id="learn-title" className="text-lg font-bold tracking-tight">Learning Center</h2>
      <p className="mt-1 text-sm text-muted">Concepts, formulas and live numbers from the experiment above.</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-[250px_1fr]">
        <nav aria-label="Topics" className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {TOPICS.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setId(t.id)}
              aria-current={t.id === id ? "true" : undefined}
              className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm transition ${
                t.id === id ? "bg-brand/10 font-semibold text-brand" : "text-muted hover:bg-raised hover:text-ink"
              }`}
            >
              <span className="mr-2 font-mono text-xs opacity-60">{String(i + 1).padStart(2, "0")}</span>
              {t.title}
            </button>
          ))}
        </nav>
        <article className="min-w-0" aria-live="polite">
          <h3 className="text-base font-semibold">{topic.title}</h3>
          <p className="mt-2 text-sm leading-relaxed">{topic.plain}</p>
          {topic.formulas?.map((f, i) => (
            <div key={i} className="mt-3 rounded-xl bg-raised/70 p-3">
              <Tex block>{f.tex}</Tex>
              <dl className="mt-1 grid gap-x-6 gap-y-0.5 text-xs text-muted sm:grid-cols-2">
                {f.vars.map(([k, v]) => (
                  <div key={k} className="flex gap-2"><dt className="shrink-0"><Tex>{k}</Tex></dt><dd>{v}</dd></div>
                ))}
              </dl>
            </div>
          ))}
          <div className="mt-3 rounded-xl border border-brand/30 bg-brand/5 p-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">In your experiment</p>
            <div className="mt-1">{topic.experiment(ctx)}</div>
          </div>
          {topic.widget && <div className="mt-3">{topic.widget(ctx)}</div>}
        </article>
      </div>
    </section>
  );
}
