import { useCallback, useState } from "react";
import { useT } from "../i18n";

export const HELP_STORAGE_KEY = "ailab.playground.help";

/** Explanations are on by default; the choice is remembered (storage can be blocked, so every access is guarded). */
export function useHelpToggle(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(HELP_STORAGE_KEY) !== "off";
    } catch {
      return true;
    }
  });
  const set = useCallback((v: boolean) => {
    setOn(v);
    try {
      localStorage.setItem(HELP_STORAGE_KEY, v ? "on" : "off");
    } catch { /* ignore */ }
  }, []);
  return [on, set];
}

/** The six steps of the workflow, each pointing at the section (page id) where it happens. */
export const GUIDE_STEPS = [
  { id: "data", target: "section-data" },
  { id: "design", target: "section-design" },
  { id: "train", target: "section-train" },
  { id: "read", target: "section-charts" },
  { id: "eval", target: "section-eval" },
  { id: "validate", target: "section-cv" },
] as const;

/** Scrolls to a section and moves keyboard focus to its heading so screen-reader users land there too. */
export function goToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView?.({ behavior: reduce ? "auto" : "smooth", block: "start" });
  const heading = el.querySelector<HTMLElement>("h1, h2");
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
}

interface Props {
  enabled: boolean;
  onToggle: (on: boolean) => void;
}

export function PlaygroundGuide({ enabled, onToggle }: Props) {
  const t = useT();
  return (
    <section className="card p-4" aria-labelledby="guide-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id="guide-title" className="card-title">{t("pg.guide.title")}</h2>
          {enabled && <p className="mt-1 text-xs text-muted">{t("pg.guide.intro")}</p>}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onToggle(!enabled)}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium hover:bg-raised"
        >
          <span>{t("pg.help.toggle")}: <b>{enabled ? t("pg.help.on") : t("pg.help.off")}</b></span>
          <span aria-hidden className={`relative h-4 w-7 rounded-full transition ${enabled ? "bg-brand" : "bg-line"}`}>
            <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${enabled ? "left-3.5" : "left-0.5"}`} />
          </span>
        </button>
      </div>
      {enabled && (
        <ol className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3" aria-label={t("pg.guide.title")}>
          {GUIDE_STEPS.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                data-step={s.id}
                onClick={() => goToSection(s.target)}
                className="flex h-full w-full items-start gap-3 rounded-xl border border-line p-3 text-left transition hover:border-brand hover:bg-brand/5"
              >
                <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">{i + 1}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{t(`pg.guide.step.${s.id}.title`)}</span>
                  <span className="mt-0.5 block text-xs text-muted">{t(`pg.guide.step.${s.id}.text`)}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
