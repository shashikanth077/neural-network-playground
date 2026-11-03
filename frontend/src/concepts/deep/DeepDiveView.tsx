import { Suspense, useCallback, useState } from "react";
import { useLang, useT } from "../../i18n";
import { renderRich } from "../../labs/lab3/rich";
import type { DeepDive, DeepQuestion, T3 } from "./types";

/** Pick the current language from a [en, kn, lt] triple. */
export function usePick() {
  const { lang } = useLang();
  return useCallback((t: T3) => t[lang === "kn" ? 1 : lang === "lt" ? 2 : 0] || t[0], [lang]);
}

const H2 = "text-lg font-bold tracking-tight";

function Quiz({ quiz }: { quiz: DeepQuestion[] }) {
  const pick = usePick();
  const t = useT();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const score = quiz.filter((q, i) => answers[i] === q.correct).length;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted" role="status">{t("cc.deep.score", undefined, { a: score, b: quiz.length, n: Object.keys(answers).length })}</p>
      {quiz.map((q, i) => {
        const chosen = answers[i];
        return (
          <fieldset key={i} className="card p-4">
            <legend className="px-1 text-sm font-semibold">{i + 1}. {renderRich(pick(q.q))}</legend>
            <div className="mt-2 grid gap-2">
              {q.options.map((o, j) => {
                const picked = chosen === j;
                const state = chosen === undefined ? "" : j === q.correct ? "border-ok bg-ok/10" : picked ? "border-bad bg-bad/10" : "";
                return (
                  <button key={j} type="button" aria-pressed={picked} onClick={() => setAnswers((a) => ({ ...a, [i]: j }))}
                    className={`rounded-xl border border-line px-3 py-2 text-left text-sm transition hover:border-brand/50 ${state}`}>
                    {String.fromCharCode(65 + j)}. {renderRich(pick(o))}
                  </button>
                );
              })}
            </div>
            {chosen !== undefined && (
              <p className={`mt-2 text-sm ${chosen === q.correct ? "text-ok" : "text-bad"}`} aria-live="polite">
                <b>{chosen === q.correct ? t("cc.deep.right") : t("cc.deep.wrong")}</b> {renderRich(pick(q.why))}
              </p>
            )}
          </fieldset>
        );
      })}
      {Object.keys(answers).length > 0 && <button type="button" className="btn-ghost" onClick={() => setAnswers({})}>{t("cc.deep.retry")}</button>}
    </div>
  );
}

/** Renders a deep dive: story, analogy, worked example, live lab, code, real-world uses, mistakes, quiz. */
export function DeepDiveView({ deep }: { deep: DeepDive }) {
  const pick = usePick();
  const t = useT();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(deep.code!.source); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  };
  const nav = [
    ["deep-story", t("cc.deep.story")],
    deep.worked && ["deep-worked", t("cc.deep.worked")],
    deep.Lab && ["deep-lab", t("cc.deep.lab")],
    deep.code && ["deep-code", t("cc.deep.code")],
    ["deep-uses", t("cc.deep.uses")],
    ["deep-mistakes", t("cc.deep.mistakes")],
    ["deep-quiz", t("cc.deep.quiz")],
  ].filter(Boolean) as [string, string][];

  return (
    <div className="mt-8 space-y-8" data-testid="deep-dive">
      <nav aria-label={t("cc.deep.lesson")} className="flex flex-wrap gap-1.5">
        <span className="mr-1 self-center text-xs font-semibold uppercase tracking-wider text-muted">{t("cc.deep.lesson")}</span>
        {nav.map(([id, label]) => <a key={id} href={`#${id}`} className="chip hover:border-brand/50 hover:text-brand">{label}</a>)}
      </nav>

      <section id="deep-story" aria-labelledby="deep-story-h" className="card scroll-mt-24 border-l-4 border-l-brand p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">{t("cc.deep.story")}</p>
        <h2 id="deep-story-h" className={`${H2} mt-1`}>{pick(deep.story.title)}</h2>
        {deep.story.body.map((p, i) => <p key={i} className="mt-2 leading-relaxed">{renderRich(pick(p))}</p>)}
        {deep.analogy && (
          <p className="mt-3 rounded-xl bg-raised/70 p-3 text-sm"><b>{t("cc.deep.analogy")}</b> {renderRich(pick(deep.analogy))}</p>
        )}
      </section>

      {deep.worked && (
        <section id="deep-worked" aria-labelledby="deep-worked-h" className="scroll-mt-24">
          <h2 id="deep-worked-h" className={H2}>{t("cc.deep.worked")} · {pick(deep.worked.title)}</h2>
          <p className="mt-1 text-sm text-muted">{renderRich(pick(deep.worked.intro))}</p>
          <ol className="mt-3 space-y-2">
            {deep.worked.steps.map((s, i) => (
              <li key={i} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3">
                <span aria-hidden className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 font-mono font-bold text-brand">{i + 1}</span>
                <div className="card min-w-0 p-3">
                  <p className="font-semibold">{pick(s.title)}</p>
                  <p className="mt-0.5 text-sm text-muted">{renderRich(pick(s.body))}</p>
                  {s.calc && <pre className="mt-2 overflow-x-auto rounded-lg bg-raised px-3 py-2 font-mono text-[13px]">{s.calc}</pre>}
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-3 rounded-xl border border-ok/40 bg-ok/10 p-3 text-sm">{renderRich(pick(deep.worked.result))}</p>
        </section>
      )}

      {deep.Lab && (
        <section id="deep-lab" aria-labelledby="deep-lab-h" className="scroll-mt-24">
          <h2 id="deep-lab-h" className={H2}>{t("cc.deep.lab")}{deep.labTitle ? ` · ${pick(deep.labTitle)}` : ""}</h2>
          <div className="mt-3">
            <Suspense fallback={<p className="text-sm text-muted">…</p>}><deep.Lab /></Suspense>
          </div>
        </section>
      )}

      {deep.code && (
        <section id="deep-code" aria-labelledby="deep-code-h" className="scroll-mt-24">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="deep-code-h" className={H2}>{t("cc.deep.code")} · {pick(deep.code.title)}</h2>
            <button type="button" className="btn-ghost !py-1 text-xs" onClick={copy}>{copied ? t("cc.deep.copied") : t("cc.deep.copy")}</button>
          </div>
          <pre className="mt-2 overflow-x-auto rounded-2xl bg-[#12213d] p-4 font-mono text-[12.5px] leading-relaxed text-[#d8eaff]"><code>{deep.code.source}</code></pre>
          {deep.code.output && (
            <>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted">{t("cc.deep.output")}</p>
              <pre className="mt-1 overflow-x-auto rounded-xl bg-raised p-3 font-mono text-[12.5px]">{deep.code.output}</pre>
            </>
          )}
        </section>
      )}

      <section id="deep-uses" aria-labelledby="deep-uses-h" className="scroll-mt-24">
        <h2 id="deep-uses-h" className={H2}>{t("cc.deep.uses")}</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {deep.uses.map((u, i) => (
            <li key={i} className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">{pick(u.domain)}</p>
              <p className="mt-1 text-sm leading-relaxed">{renderRich(pick(u.example))}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="deep-mistakes" aria-labelledby="deep-mistakes-h" className="scroll-mt-24">
        <h2 id="deep-mistakes-h" className={H2}>{t("cc.deep.mistakes")}</h2>
        <ul className="mt-3 space-y-2">
          {deep.mistakes.map((m, i) => (
            <li key={i} className="rounded-xl border border-line border-l-4 border-l-c-amber bg-raised/50 p-3 text-sm">{renderRich(pick(m))}</li>
          ))}
        </ul>
      </section>

      <section id="deep-quiz" aria-labelledby="deep-quiz-h" className="scroll-mt-24">
        <h2 id="deep-quiz-h" className={H2}>{t("cc.deep.quiz")}</h2>
        <div className="mt-3"><Quiz quiz={deep.quiz} /></div>
      </section>

      {deep.sources && <p className="text-xs text-muted">{t("cc.deep.sources")} {pick(deep.sources)}</p>}
    </div>
  );
}
