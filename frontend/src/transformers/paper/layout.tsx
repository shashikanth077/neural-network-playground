import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Link } from "react-router-dom";
import { Seg } from "../../labs/ui";
import { useTx } from "../../labs/lab3/rich";
import { fmtInt } from "../../labs/lab3/experiment/shared";
import { OUTLINE, type SectionId } from "./data";
import { keyResults } from "./keyResults";
import { REFERENCES } from "./refs";
import type { View } from "./ui";

export const REPO_URL = "https://github.com/shashikanth077/Transformers-NLP";

/** The sticky navigation bar of the app: the outline and the anchors sit below it. */
function useNavOffset(root: RefObject<HTMLElement>, barRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const apply = () => {
      const el = root.current;
      if (!el) return;
      const nav = document.querySelector("header.sticky") as HTMLElement | null;
      const navH = nav ? nav.offsetHeight : 56;
      const bar = barRef.current;
      const barH = bar && bar.offsetParent !== null ? bar.offsetHeight : 0;
      el.style.setProperty("--nav-h", `${navH}px`);
      el.style.setProperty("--anchor-off", `${navH + barH + 14}px`);
    };
    apply();
    window.addEventListener("resize", apply);
    const id = window.setTimeout(apply, 300);
    return () => { window.removeEventListener("resize", apply); window.clearTimeout(id); };
  }, [root, barRef]);
}

/** Which section is being read: the last one whose top has passed the anchor offset. */
function useActiveSection(): SectionId {
  const [active, setActive] = useState<SectionId>("intro");
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const root = document.getElementById("tp-root");
      const anchor = root ? parseFloat(root.style.getPropertyValue("--anchor-off")) || 120 : 120;
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
      let cur = els[0]?.dataset.section as SectionId | undefined;
      for (const el of els) if (el.getBoundingClientRect().top <= anchor + 24) cur = el.dataset.section as SectionId;
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4 && els.length) cur = els[els.length - 1].dataset.section as SectionId;
      if (cur) setActive(cur);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return active;
}

/** Thin bar at the top of the window: how far through the document you are. Hidden in print. */
function ReadingProgress() {
  const tx = useTx();
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (bar.current) { bar.current.style.width = `${(p * 100).toFixed(1)}%`; bar.current.parentElement?.setAttribute("aria-valuenow", String(Math.round(p * 100))); }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return (
    <div className="tp-progress tp-noprint fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent" role="progressbar" aria-label={tx("tp.ui.progress")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} data-testid="tp-progress">
      <div ref={bar} className="h-full bg-brand" style={{ width: "0%" }} />
    </div>
  );
}

function OutlineList({ active, onPick }: { active: SectionId; onPick?: () => void }) {
  const tx = useTx();
  let lastChapter = -1;
  return (
    <ol className="space-y-0.5 text-sm">
      {OUTLINE.map((o) => {
        const head = o.chapter >= 2 && o.chapter !== lastChapter;
        lastChapter = o.chapter;
        return (
          <li key={o.id}>
            {head && <p className="mb-1 mt-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{tx(`tp.chapter.${o.chapter}`)}</p>}
            <a
              href={`#${o.id}`}
              onClick={onPick}
              aria-current={active === o.id ? "location" : undefined}
              data-outline={o.id}
              className={`flex gap-2 rounded-lg px-2 py-1 leading-snug transition ${active === o.id ? "bg-brand/10 font-semibold text-brand" : "text-muted hover:bg-raised hover:text-ink"}`}
            >
              <span className="w-7 shrink-0 font-mono text-xs leading-5 opacity-80">{o.num}</span>
              <span className="min-w-0">{tx(`tp.sec.${o.id}`)}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

/** Outline: a sticky column on wide screens, a collapsible bar under the app bar on phones. */
export function Outline({ barRef }: { barRef: RefObject<HTMLDivElement> }) {
  const tx = useTx();
  const active = useActiveSection();
  const [open, setOpen] = useState(false);
  const cur = OUTLINE.find((o) => o.id === active)!;
  return (
    <>
      <div ref={barRef} className="tp-outline tp-noprint sticky top-[var(--nav-h,56px)] z-20 -mx-4 border-b border-line bg-bg/95 px-4 py-1.5 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden" data-testid="tp-outline-bar" data-active={active}>
        <button type="button" className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={open} aria-controls="tp-outline-panel" onClick={() => setOpen((o) => !o)}>
          <span className="min-w-0">
            <span className="block text-[11px] uppercase tracking-wider text-muted">{tx("tp.ui.contents")}</span>
            <span className="block truncate text-sm font-semibold"><span className="font-mono text-brand">{cur.num}</span> {tx(`tp.sec.${cur.id}`)}</span>
          </span>
          <span aria-hidden className="text-muted">{open ? "▴" : "▾"}</span>
        </button>
        {open && (
          <div id="tp-outline-panel" className="card mt-2 max-h-[60vh] overflow-y-auto p-2">
            <OutlineList active={active} onPick={() => setOpen(false)} />
          </div>
        )}
      </div>
      <aside className="tp-outline tp-noprint hidden lg:block" aria-label={tx("tp.ui.contents")}>
        <nav aria-label={tx("tp.ui.contents")} className="sticky top-[calc(var(--nav-h,56px)+1rem)] max-h-[calc(100vh-var(--nav-h,56px)-2rem)] overflow-y-auto pr-2" data-testid="tp-outline" data-active={active}>
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{tx("tp.ui.contents")}</p>
          <OutlineList active={active} />
        </nav>
      </aside>
    </>
  );
}

export { ReadingProgress, useNavOffset };

/** The two view modes of the page. */
export function ViewSwitch({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const tx = useTx();
  return (
    <div className="tp-noprint flex flex-wrap items-center gap-3">
      <Seg<View>
        label={tx("tp.ui.view")}
        value={view}
        onChange={onChange}
        options={[{ value: "read", label: tx("tp.ui.viewRead") }, { value: "demos", label: tx("tp.ui.viewDemos") }]}
      />
      <button type="button" className="btn-ghost !py-1.5 !text-xs" onClick={() => window.print()}>🖨 {tx("tp.ui.print")}</button>
    </div>
  );
}

function Tile({ value, label, tone, testid }: { value: string; label: string; tone: string; testid: string }) {
  return (
    <div className="card min-w-0 p-3">
      <p className={`font-mono text-2xl font-bold tracking-tight sm:text-3xl ${tone}`} data-testid={testid}>{value}</p>
      <p className="mt-1 text-xs leading-snug text-muted">{label}</p>
    </div>
  );
}

/** The five headline numbers, computed from the Lab 3 data modules. */
export function KeyStrip() {
  const tx = useTx();
  const k = useMemo(keyResults, []);
  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5" data-testid="tp-keystrip" aria-label={tx("tp.key.title")} role="group">
        <Tile testid="key-ft" value={`${k.bestFineTuned.toFixed(1)} %`} label={tx("tp.key.ft")} tone="text-ok" />
        <Tile testid="key-classical" value={`${k.bestClassical.toFixed(1)} %`} label={tx("tp.key.classical")} tone="text-pos" />
        <Tile testid="key-ready" value={`${k.bestReady.toFixed(1)} %`} label={tx("tp.key.ready")} tone="text-brand" />
        <Tile testid="key-gain" value={`+${k.gain500.toFixed(1)}`} label={tx("tp.key.gain")} tone="text-c-purple" />
        <Tile testid="key-slow" value={`×${fmtInt(k.slowdown)}`} label={tx("tp.key.slow")} tone="text-neg" />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted" data-testid="tp-recorded">{tx("tp.key.recorded")}</p>
    </div>
  );
}

/** The four action buttons of the header. */
export function HeaderButtons() {
  const tx = useTx();
  return (
    <div className="tp-noprint mt-4 flex flex-wrap gap-2">
      <Link to="/tools/transformers/slides" className="btn-primary" data-testid="btn-slides">▶ {tx("tp.btn.slides")}</Link>
      <Link to="/labs/lab3" className="btn-ghost" data-testid="btn-lab">🧪 {tx("tp.btn.lab")}</Link>
      <Link to="/cheatsheets/transformers" className="btn-ghost" data-testid="btn-sheet">📄 {tx("tp.btn.sheet")}</Link>
      <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost" data-testid="btn-code">{"</>"} {tx("tp.btn.code")} ↗</a>
    </div>
  );
}

const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** All references of the paper, in the paper's order, with a filter. The bibliographic text stays in English. */
export function References() {
  const tx = useTx();
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const f = fold(q.trim());
    return REFERENCES.map((r, i) => ({ r, i })).filter(({ r }) => !f || fold(r).includes(f));
  }, [q]);
  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value), []);
  return (
    <div>
      <div className="tp-noprint flex flex-wrap items-center gap-3">
        <label htmlFor="tp-ref-filter" className="sr-only">{tx("tp.ref.filter")}</label>
        <input id="tp-ref-filter" type="search" value={q} onChange={onChange} placeholder={tx("tp.ref.filter")} className="field max-w-sm" data-testid="tp-ref-filter" />
        <span className="text-xs text-muted" role="status" data-testid="tp-ref-count">{tx("tp.ref.count", { a: shown.length, b: REFERENCES.length })}</span>
      </div>
      <p className="mt-2 text-xs text-muted">{tx("tp.ref.note")}</p>
      <ol className="mt-3 space-y-2 text-sm leading-relaxed" data-testid="tp-refs">
        {shown.map(({ r, i }) => (
          <li key={i} id={`ref-${i + 1}`} lang="en" className="grid grid-cols-[2rem_1fr] gap-x-1 break-words">
            <span className="text-right font-mono text-xs leading-6 text-muted">{i + 1}.</span>
            <span className="min-w-0 [overflow-wrap:anywhere]">{r}</span>
          </li>
        ))}
      </ol>
      {shown.length === 0 && <p className="mt-2 text-sm text-muted">{tx("tp.ref.none")}</p>}
    </div>
  );
}

