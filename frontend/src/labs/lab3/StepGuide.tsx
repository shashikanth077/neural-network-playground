import { useCallback, useState } from "react";
import { renderRich, useR, useTx } from "./rich";
import type { StepSlotProps } from "../types";
import { GUIDES } from "./content/guides";

const TASKS_KEY = "ailab-lab3-guide-tasks";
const QUIZ_KEY = "ailab-lab3-guide-quiz";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* storage unavailable or corrupt */ }
  return fallback;
}
function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

type TaskStore = Record<string, number[]>;
type QuizStore = Record<string, { best: number; total: number }>;

/** Read-only snapshot of the guide state, for tests and summaries. */
export const readGuideState = () => ({ tasks: load<TaskStore>(TASKS_KEY, {}), quiz: load<QuizStore>(QUIZ_KEY, {}) });

const H2 = "text-xs font-semibold uppercase tracking-wider text-brand";

/** Goal, why it matters, key words and a tick-off task list: shown ABOVE the step's demos. */
export function GuideIntro({ stepId }: StepSlotProps) {
  const r = useR();
  const tx = useTx();
  const g = GUIDES[stepId];
  const [ticked, setTicked] = useState<number[]>(() => load<TaskStore>(TASKS_KEY, {})[stepId] ?? []);
  const toggle = useCallback((i: number) => {
    setTicked((cur) => {
      const next = cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i];
      save(TASKS_KEY, { ...load<TaskStore>(TASKS_KEY, {}), [stepId]: next });
      return next;
    });
  }, [stepId]);
  if (!g) return null;
  const k = (s: string) => `lab3.g.${stepId}.${s}`;

  return (
    <section aria-labelledby="guide-goal-h" className="card mb-5 space-y-4 border-l-4 border-l-brand p-4 sm:p-5" data-testid="guide-intro">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h2 id="guide-goal-h" className={H2}>{tx("lab3.ui.goal")}</h2>
          <p className="mt-1 text-sm font-medium leading-relaxed">{r(k("goal"))}</p>
          <h2 className={`${H2} mt-3`}>{tx("lab3.ui.fit")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">{r(k("fit"))}</p>
        </div>
        <div>
          <h2 className={H2}>{tx("lab3.ui.keywords")}</h2>
          <dl className="mt-1.5 flex flex-wrap gap-2">
            {g.keywords.map((_, i) => (
              <div key={i} className="min-w-0 rounded-xl border border-line bg-raised/60 px-2.5 py-1.5">
                <dt className="text-sm font-semibold">{tx(k(`kw${i}.t`))}</dt>
                <dd className="max-w-[16rem] text-xs leading-snug text-muted">{tx(k(`kw${i}.d`))}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div>
        <h2 className={H2}>
          {tx("lab3.ui.todo")}{" "}
          <span className="ml-1 font-mono normal-case text-muted" aria-label={tx("lab3.ui.todoCount", { a: ticked.length, b: g.tasks.length })}>
            {ticked.length}/{g.tasks.length}
          </span>
        </h2>
        <ul className="mt-1.5 space-y-1.5">
          {g.tasks.map((_, i) => (
            <li key={i}>
              <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug">
                <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-brand" checked={ticked.includes(i)} onChange={() => toggle(i)} />
                <span className={ticked.includes(i) ? "text-muted line-through decoration-ok/60" : ""}>{r(k(`do${i}`))}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Quiz, takeaways and common mistakes: shown AFTER the step's demos. */
export function GuideOutro({ stepId }: StepSlotProps) {
  const r = useR();
  const tx = useTx();
  const g = GUIDES[stepId];
  const [answers, setAnswers] = useState<(number | null)[]>(() => (g ? g.questions.map(() => null) : []));
  const [best, setBest] = useState<{ best: number; total: number } | undefined>(() => load<QuizStore>(QUIZ_KEY, {})[stepId]);
  if (!g) return null;
  const k = (s: string) => `lab3.g.${stepId}.${s}`;
  const total = g.questions.length;
  const answered = answers.filter((a) => a !== null).length;
  const score = answers.filter((a, i) => a === g.questions[i].correct).length;
  const finished = answered === total;

  const pick = (qi: number, oi: number) => {
    if (answers[qi] !== null) return;
    const next = answers.slice();
    next[qi] = oi;
    setAnswers(next);
    if (next.every((a) => a !== null)) {
      const s = next.filter((a, i) => a === g.questions[i].correct).length;
      const store = load<QuizStore>(QUIZ_KEY, {});
      const prev = store[stepId];
      const merged = { best: Math.max(s, prev?.best ?? 0), total };
      save(QUIZ_KEY, { ...store, [stepId]: merged });
      setBest(merged);
    }
  };

  return (
    <div className="mt-8 space-y-4" data-testid="guide-outro">
      <section aria-labelledby="guide-quiz-h" className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="guide-quiz-h" className="text-base font-semibold tracking-tight">{tx("lab3.ui.check")}</h2>
          <p className="text-xs text-muted" data-testid="quiz-best">
            {best ? tx("lab3.ui.best", { a: best.best, b: best.total }) : tx("lab3.ui.noBest")}
          </p>
        </div>
        <ol className="mt-3 space-y-5">
          {g.questions.map((q, qi) => {
            const chosen = answers[qi];
            const right = chosen === q.correct;
            return (
              <li key={qi}>
                <p id={`q-${stepId}-${qi}`} className="text-sm font-semibold leading-snug">
                  <span className="mr-1.5 font-mono text-xs text-muted">{qi + 1}.</span>
                  {r(k(`q${qi}.q`))}
                </p>
                <div role="radiogroup" aria-labelledby={`q-${stepId}-${qi}`} className="mt-2 grid gap-1.5">
                  {q.options.map((_, oi) => {
                    const isChosen = chosen === oi;
                    const reveal = chosen !== null;
                    const tone = !reveal
                      ? "border-line bg-surface hover:bg-raised"
                      : oi === q.correct
                        ? "border-ok bg-ok/10"
                        : isChosen
                          ? "border-bad bg-bad/10"
                          : "border-line bg-surface opacity-70";
                    return (
                      <button
                        key={oi}
                        type="button"
                        role="radio"
                        aria-checked={isChosen}
                        aria-disabled={reveal}
                        onClick={() => pick(qi, oi)}
                        className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-left text-sm leading-snug transition ${tone}`}
                      >
                        <span aria-hidden className="mt-px font-mono text-xs text-muted">{String.fromCharCode(65 + oi)}</span>
                        <span className="min-w-0 flex-1">{r(k(`q${qi}.o${oi}`))}</span>
                        {reveal && oi === q.correct && <span aria-hidden className="text-ok">✓</span>}
                        {reveal && isChosen && oi !== q.correct && <span aria-hidden className="text-bad">✗</span>}
                      </button>
                    );
                  })}
                </div>
                {chosen !== null && (
                  <div role="status" className={`mt-2 rounded-xl border px-3 py-2 text-sm leading-relaxed ${right ? "border-ok/50 bg-ok/5" : "border-bad/50 bg-bad/5"}`}>
                    <b className={right ? "text-ok" : "text-bad"}>{right ? tx("lab3.ui.correct") : tx("lab3.ui.wrong")}</b>{" "}
                    <span className="text-muted">{r(k(`q${qi}.e`))}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold" aria-live="polite">
            {finished ? tx("lab3.ui.score", { a: score, b: total }) : tx("lab3.ui.progressQ", { a: answered, b: total })}
          </p>
          {finished && (
            <button type="button" className="btn-ghost !py-1 !text-xs" onClick={() => setAnswers(g.questions.map(() => null))}>
              {tx("lab3.ui.retry")}
            </button>
          )}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section aria-labelledby="guide-take-h" className="card p-4 sm:p-5">
          <h2 id="guide-take-h" className="text-base font-semibold tracking-tight">{tx("lab3.ui.takeaways")}</h2>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed">
            {g.takeaways.map((_, i) => (
              <li key={i} className="flex gap-2"><span aria-hidden className="text-ok">✓</span><span>{renderRich(tx(k(`take${i}`)))}</span></li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="guide-mist-h" className="card p-4 sm:p-5">
          <h2 id="guide-mist-h" className="text-base font-semibold tracking-tight">{tx("lab3.ui.mistakes")}</h2>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed">
            {g.mistakes.map((_, i) => (
              <li key={i} className="flex gap-2"><span aria-hidden className="text-c-amber">⚠</span><span>{renderRich(tx(k(`mist${i}`)))}</span></li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
