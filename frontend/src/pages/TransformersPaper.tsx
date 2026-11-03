import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useT } from "../i18n";
import { HeaderButtons, KeyStrip, Outline, ReadingProgress, ViewSwitch, useNavOffset } from "../transformers/paper/layout";
import { ChapterHead, SecCompetitors, SecCriteria, SecDataset, SecIntro, SecProblem, SecProgram, SecReview } from "../transformers/paper/secFront";
import { SecArchitecture, SecMath, SecProtocol } from "../transformers/paper/secMethod";
import { SecConclusions, SecCost, SecData, SecErrors, SecImplementation, SecOverall, SecPrev, SecReady, SecReferences } from "../transformers/paper/secResults";
import { TEAM } from "../transformers/paper/tables";
import { ViewCtx, type View } from "../transformers/paper/ui";

const VIEW_KEY = "ailab.tpaper.view";

function initialView(): View {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === "read" || v === "demos") return v;
  } catch { /* storage may be unavailable */ }
  return "demos";
}

/**
 * Scroll to the element named by the URL fragment (the router does not do it for us) and keep it in place while the page settles:
 * live demos that mount above the target push it down, so the position is corrected for a few seconds unless the reader has
 * started to scroll, press a key or click.
 */
function useHashScroll() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    let stop = false;
    const stopNow = () => { stop = true; };
    const events = ["wheel", "touchstart", "keydown", "mousedown"] as const;
    events.forEach((e) => window.addEventListener(e, stopNow, { passive: true, once: true }));
    const align = () => {
      const el = document.getElementById(id);
      if (!el || stop) return;
      const want = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
      if (Math.abs(el.getBoundingClientRect().top - want) > 6) el.scrollIntoView({ block: "start", behavior: "instant" as ScrollBehavior });
    };
    const raf = requestAnimationFrame(align);
    const timer = window.setInterval(align, 250);
    const end = window.setTimeout(() => window.clearInterval(timer), 8000);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(timer);
      window.clearTimeout(end);
      events.forEach((e) => window.removeEventListener(e, stopNow));
    };
  }, [hash]);
}

/** The project paper as one page: header, outline, the paper's sections with live Lab 3 widgets, tables, figures, formulas, references. */
export function TransformersPaper() {
  const t = useT();
  const [view, setView] = useState<View>(initialView);
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  useNavOffset(root, bar);
  useHashScroll();

  useEffect(() => {
    document.title = `${t("tp.h.title")} · AI Lab`;
    return () => { document.title = "AI Lab"; };
  }, [t]);

  const change = (v: View) => {
    setView(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch { /* ignore */ }
  };

  return (
    <ViewCtx.Provider value={view}>
      <ReadingProgress />
      <div id="tp-root" ref={root} className="tp-root mx-auto max-w-[1240px] px-4 pb-16 pt-6 sm:px-6" data-view={view}>
        <div className="tp-hero card overflow-hidden p-5 sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand sm:text-xs">
            {t("tp.h.univ")} · {t("tp.h.faculty")} · {t("tp.h.dept")} · {t("tp.h.type")}
          </p>
          <h1 className="mt-3 max-w-4xl text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl" data-testid="tp-title">{t("tp.h.title")}</h1>
          <p className="mt-4 text-sm text-muted">
            <span className="mr-2 text-[11px] font-semibold uppercase tracking-wider">{t("tp.h.authors")}</span>
            <b className="text-ink" data-testid="tp-authors">{TEAM.map((m) => m.name).join(" · ")}</b>
          </p>
          <p className="mt-1 text-sm text-muted">{t("tp.h.program")}</p>
          <HeaderButtons />
          <div className="mt-5"><KeyStrip /></div>
          <p className="mt-4 max-w-4xl text-sm leading-relaxed text-muted">{t("tp.h.about")}</p>
          <p className="mt-2 max-w-4xl text-xs leading-relaxed text-muted" data-testid="tp-lang-note">{t("tp.ui.langNote")}</p>
          <div className="mt-4"><ViewSwitch view={view} onChange={change} /></div>
        </div>

        <div className="tp-grid mt-6 lg:grid lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8">
          <Outline barRef={bar} />
          <article className="tp-article mt-6 min-w-0 space-y-10 lg:mt-0" data-testid="tp-article">
            <SecIntro />
            <SecReview />
            <ChapterHead n={2} />
            <SecProblem />
            <SecDataset />
            <SecCompetitors />
            <SecCriteria />
            <SecProgram />
            <SecArchitecture />
            <SecMath />
            <SecProtocol />
            <ChapterHead n={3} />
            <SecImplementation />
            <SecOverall />
            <SecCost />
            <SecData />
            <SecReady />
            <SecErrors />
            <SecPrev />
            <SecConclusions />
            <SecReferences />
          </article>
        </div>
      </div>
    </ViewCtx.Provider>
  );
}
