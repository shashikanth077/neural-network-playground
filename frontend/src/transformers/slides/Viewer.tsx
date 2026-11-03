import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTx } from "../../labs/lab3/rich";
import { BTN, BTN_ON, Chip, HelpDialog, NotesPanel, NotesText, OverviewGrid, PresenterView } from "./Panels";
import { Slide, useSlideTitle } from "./Slides";
import { SLIDES, SLIDE_COUNT, TOTAL_BUDGET } from "./model";
import { useRehearsal } from "./timing";
import "./slides.css";

/** `#slide-5` -> 4 (0-based), anything else -> null. */
export function parseHash(hash: string): number | null {
  const m = /^#slide-(\d{1,3})$/.exec(hash);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= SLIDE_COUNT ? n - 1 : null;
}

const clamp = (i: number) => Math.max(0, Math.min(SLIDE_COUNT - 1, i));

function writeHash(i: number) {
  try { window.history.replaceState(window.history.state, "", `#slide-${i + 1}`); } catch { /* ignore: the hash is only a convenience */ }
}

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
};

export function Viewer() {
  const tx = useTx();
  const title = useSlideTitle();
  const [idx, setIdx] = useState(() => parseHash(window.location.hash) ?? 0);
  const [overview, setOverview] = useState(false);
  const [help, setHelp] = useState(false);
  const [notes, setNotes] = useState(false);
  const [presenter, setPresenter] = useState(false);
  const [printNotes, setPrintNotes] = useState(false);
  const [full, setFull] = useState(false);
  const [fake, setFake] = useState(false);
  const [dir, setDir] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const rehearsal = useRehearsal(idx);
  const { toggle: toggleTimer } = rehearsal;

  const go = useCallback((i: number) => {
    const c = clamp(i);
    setIdx((cur) => { if (cur !== c) setDir(c > cur ? 1 : -1); return c; });
    writeHash(c);
  }, []);

  // keep the idx in step with the hash when the address is edited or followed
  useEffect(() => {
    const onHash = () => { const i = parseHash(window.location.hash); if (i !== null) setIdx(i); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // print setup: a body class for the print stylesheet and the landscape page size, only while this page is open
  useEffect(() => {
    document.body.classList.add("ts-page");
    const st = document.createElement("style");
    st.textContent = "@page { size: A4 landscape; margin: 8mm; }";
    document.head.appendChild(st);
    return () => { document.body.classList.remove("ts-page"); st.remove(); };
  }, []);

  useEffect(() => {
    const sync = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFull = useCallback(async () => {
    try {
      if (document.fullscreenElement) { await document.exitFullscreen(); return; }
      if (fake) { setFake(false); return; }
      const el = rootRef.current;
      if (el && typeof el.requestFullscreen === "function") { await el.requestFullscreen(); return; }
      throw new Error("Fullscreen API not available");
    } catch {
      setFake((f) => !f); // fall back to a page-filling layout
    }
  }, [fake]);

  const doPrint = useCallback(() => { try { window.print(); } catch { /* printing may be blocked */ } }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      const k = e.key;
      const dialog = overview || help;
      const onControl = (e.target as HTMLElement | null)?.closest?.("button, a[href], summary") != null;
      const nav = (to: number) => { e.preventDefault(); if (!dialog) go(to); };
      switch (k) {
        case "ArrowRight": case "ArrowDown": case "PageDown": nav(idx + 1); break;
        case "ArrowLeft": case "ArrowUp": case "PageUp": nav(idx - 1); break;
        case " ": case "Spacebar": if (!onControl) nav(idx + 1); break;
        case "Home": nav(0); break;
        case "End": nav(SLIDE_COUNT - 1); break;
        case "Escape":
          if (help) setHelp(false);
          else if (overview) setOverview(false);
          else if (presenter) setPresenter(false);
          else if (fake) setFake(false);
          break;
        default: {
          const c = k.toLowerCase();
          if (c === "g") { e.preventDefault(); setHelp(false); setOverview((o) => !o); }
          else if (c === "?") { e.preventDefault(); setOverview(false); setHelp((h) => !h); }
          else if (dialog) return;
          else if (c === "f") { e.preventDefault(); void toggleFull(); }
          else if (c === "n") { e.preventDefault(); setNotes((v) => !v); }
          else if (c === "p") { e.preventDefault(); setPresenter((v) => !v); }
          else if (c === "t") { e.preventDefault(); toggleTimer(); }
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, overview, help, presenter, fake, go, toggleFull, toggleTimer]);

  const onTouchStart = (e: React.TouchEvent) => { const t = e.touches[0]; touch.current = t ? { x: t.clientX, y: t.clientY } : null; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current; touch.current = null;
    const t = e.changedTouches[0];
    if (!s || !t) return;
    const dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > 1.5 * Math.abs(dy)) go(idx + (dx < 0 ? 1 : -1));
  };

  const m = SLIDES[idx];
  const label = tx("ts.ui.slideLabel", { n: m.n, total: SLIDE_COUNT, title: title(m.n) });
  const isFull = full || fake;

  const stage = (
    <div className="ts-stagebox" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="ts-stage ts-main" key={idx}>
        <div className={dir === 0 ? "" : "ts-anim"}><Slide n={m.n} mode="main" /></div>
      </div>
    </div>
  );

  const controls = (
    <div className="mt-3 flex items-center gap-2 sm:gap-3">
      <button type="button" onClick={() => go(idx - 1)} disabled={idx === 0} className={BTN} aria-label={tx("ts.ui.prev")} data-testid="ts-prev">
        <span aria-hidden>←</span><span className="hidden sm:inline">{tx("ts.ui.prev")}</span>
      </button>
      <div className="min-w-0 flex-1">
        <div role="progressbar" aria-label={tx("ts.ui.progress")} aria-valuemin={1} aria-valuemax={SLIDE_COUNT} aria-valuenow={m.n} aria-valuetext={tx("ts.ui.counter", { n: m.n, total: SLIDE_COUNT })} className="h-2 overflow-hidden rounded-full bg-line" data-testid="ts-progress">
          <div className="ts-progress-fill h-full rounded-full bg-brand transition-[width] duration-200" style={{ width: `${(m.n / SLIDE_COUNT) * 100}%` }} />
        </div>
      </div>
      <span className="whitespace-nowrap font-mono text-sm tabular-nums" aria-label={tx("ts.ui.counter", { n: m.n, total: SLIDE_COUNT })} data-testid="ts-counter">{m.n} / {SLIDE_COUNT}</span>
      <button type="button" onClick={() => go(idx + 1)} disabled={idx === SLIDE_COUNT - 1} className={BTN} aria-label={tx("ts.ui.next")} data-testid="ts-next">
        <span className="hidden sm:inline">{tx("ts.ui.next")}</span><span aria-hidden>→</span>
      </button>
    </div>
  );

  return (
    <div ref={rootRef} className={`ts-root ${isFull ? "ts-isfull" : ""} ${fake ? "ts-fakefull" : ""} ${printNotes ? "ts-with-notes" : ""}`} data-testid="ts-root">
      <main className="ts-screen ts-wrap mx-auto max-w-[1100px] px-4 py-5 sm:py-6" aria-label={tx("ts.ui.region")}>
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight">{tx("ts.ui.heading")}</h1>
            <p className="mt-0.5 text-sm text-muted">{tx("ts.ui.sub", { n: SLIDE_COUNT, min: Math.round(TOTAL_BUDGET / 60) })}</p>
          </div>
          <Link to="/tools/transformers" className="ts-focus text-sm font-semibold text-brand hover:underline">{tx("ts.ui.readPaper")}</Link>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2" role="toolbar" aria-label={tx("ts.ui.region")}>
          <button type="button" onClick={() => setOverview(true)} className={BTN} aria-keyshortcuts="G" data-testid="ts-btn-overview">{tx("ts.ui.overview")}<kbd aria-hidden className="ts-kbd">G</kbd></button>
          <button type="button" onClick={() => setNotes((v) => !v)} className={notes ? BTN_ON : BTN} aria-pressed={notes} aria-keyshortcuts="N" data-testid="ts-btn-notes">{tx("ts.ui.notes")}<kbd aria-hidden className="ts-kbd">N</kbd></button>
          <button type="button" onClick={() => setPresenter((v) => !v)} className={presenter ? BTN_ON : BTN} aria-pressed={presenter} aria-keyshortcuts="P" data-testid="ts-btn-presenter">{presenter ? tx("ts.ui.exitPresenter") : tx("ts.ui.presenter")}<kbd aria-hidden className="ts-kbd">P</kbd></button>
          <button type="button" onClick={() => void toggleFull()} className={isFull ? BTN_ON : BTN} aria-pressed={isFull} aria-keyshortcuts="F" data-testid="ts-btn-fullscreen">{isFull ? tx("ts.ui.exitFullscreen") : tx("ts.ui.fullscreen")}<kbd aria-hidden className="ts-kbd">F</kbd></button>
          <button type="button" onClick={doPrint} className={BTN} data-testid="ts-btn-print">{tx("ts.ui.print")}</button>
          <label className="inline-flex items-center gap-1.5 text-xs text-muted">
            <input type="checkbox" checked={printNotes} onChange={(e) => setPrintNotes(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--brand))]" data-testid="ts-print-notes-toggle" />
            {tx("ts.ui.printNotes")}
          </label>
          <button type="button" onClick={() => { setOverview(false); setHelp(true); }} className={`${BTN} ml-auto`} aria-label={tx("ts.ui.help")} aria-keyshortcuts="?" data-testid="ts-btn-help"><span aria-hidden>?</span></button>
        </div>

        <div className="mt-4">
          {presenter ? (
            <PresenterView idx={idx} r={rehearsal}>{stage}{controls}</PresenterView>
          ) : (
            <div className={`grid gap-4 ${notes ? "lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]" : ""}`}>
              <div className="min-w-0">{stage}{controls}</div>
              {notes && <NotesPanel idx={idx} r={rehearsal} />}
            </div>
          )}
        </div>

        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-testid="ts-live">{label}</div>
        {overview && <OverviewGrid current={idx} onPick={(i) => { go(i); setOverview(false); }} onClose={() => setOverview(false)} />}
        {help && <HelpDialog onClose={() => setHelp(false)} />}
      </main>

      <div className="ts-printdeck" aria-hidden="true" data-testid="ts-printdeck">
        {SLIDES.map((s) => (
          <div key={s.n} className="ts-print-page">
            <div className="ts-stage"><Slide n={s.n} mode="print" /></div>
            <div className="ts-print-notes"><b>{s.n}. {title(s.n)}</b> · <Chip n={s.n} /> <NotesText n={s.n} className="inline" tid={`ts-print-notes-${s.n}`} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
