import { useState } from "react";
import { Link } from "react-router-dom";
import { useT } from "./rich";
import type { StepSlotProps } from "../types";

/** The nine stages of the whole lab. Every lab step belongs to exactly one stage. */
export const STAGES: { id: string; steps: string[]; link: string }[] = [
  { id: "raw", steps: ["big-picture", "real-world"], link: "big-picture" },
  { id: "missing", steps: ["missing-values"], link: "missing-values" },
  { id: "anomalies", steps: ["anomalies"], link: "anomalies" },
  { id: "scaling", steps: ["scaling"], link: "scaling" },
  { id: "network", steps: ["network"], link: "network" },
  { id: "train", steps: ["train"], link: "train" },
  { id: "mnist", steps: ["mnist"], link: "mnist" },
  { id: "tune", steps: ["activations", "optimizers"], link: "activations" },
  { id: "results", steps: ["results", "checklist", "defense"], link: "results" },
];

export const stageOf = (stepId: string) => STAGES.findIndex((s) => s.steps.includes(stepId));

const KEY = "ailab-lab1-map-compact";
const readCompact = () => {
  try {
    const v = localStorage.getItem(KEY);
    if (v !== null) return v === "1";
  } catch { /* storage unavailable */ }
  return typeof window !== "undefined" && window.innerWidth < 640;
};

/** Clickable end-to-end diagram: raw data → … → results, with the input and output of every stage. */
export function PipelineMap({ stepId, done }: StepSlotProps) {
  const t = useT();
  const [compact, setCompact] = useState(readCompact);
  const current = stageOf(stepId);
  const toggle = () => setCompact((c) => {
    try { localStorage.setItem(KEY, c ? "0" : "1"); } catch { /* ignore */ }
    return !c;
  });

  return (
    <nav aria-label={t("lab1.pm.label")} className="card mb-5 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight">{t("lab1.pm.title")}</h2>
        <button type="button" className="btn-ghost !px-2.5 !py-1 !text-xs" aria-expanded={!compact} onClick={toggle}>
          {compact ? t("lab1.pm.show") : t("lab1.pm.hide")}
        </button>
      </div>
      <p className="mt-0.5 text-xs text-muted">{t("lab1.pm.hint")}</p>
      <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {STAGES.map((s, i) => {
          const active = i === current;
          const complete = s.steps.every((id) => done.includes(id));
          const showIo = !compact || active;
          return (
            <li key={s.id} className="min-w-0">
              <Link
                to={`/labs/lab1/${active ? stepId : s.link}`}
                aria-current={active ? "step" : undefined}
                data-stage={s.id}
                className={`flex h-full min-w-0 gap-2.5 rounded-xl border p-2.5 text-left transition ${
                  active ? "border-brand bg-brand/10 ring-1 ring-brand" : complete ? "border-ok/50 bg-ok/5 hover:bg-ok/10" : "border-line bg-raised/50 hover:bg-raised"
                }`}
              >
                <span
                  aria-hidden
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-semibold ${
                    complete ? "border-ok bg-ok text-white dark:text-bg" : active ? "border-brand text-brand" : "border-line text-muted"
                  }`}
                >
                  {complete ? "✓" : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-semibold leading-snug ${active ? "text-brand" : ""}`}>
                    {t(`lab1.pm.${s.id}.title`)}
                    {complete && <span className="sr-only"> ({t("lab1.pm.done")})</span>}
                    {active && <span className="sr-only"> ({t("lab1.pm.here")})</span>}
                  </span>
                  {showIo && (
                    <span className="mt-0.5 block text-xs leading-snug text-muted">
                      <b className="font-semibold text-ink">{t("lab1.pm.in")}</b> {t(`lab1.pm.${s.id}.in`)}{" "}
                      <span aria-hidden>→</span> <b className="font-semibold text-ink">{t("lab1.pm.out")}</b> {t(`lab1.pm.${s.id}.out`)}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
