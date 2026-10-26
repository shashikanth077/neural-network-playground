import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTx } from "../../labs/lab3/rich";
import { Slide, useSlideTitle } from "./Slides";
import { PRESENTER_NAME, SLIDES, SLIDE_COUNT, TARGET_MAX, TARGET_MIN, TOTAL_BUDGET } from "./model";
import { clock, slideStatus, totalStatus, type Rehearsal } from "./timing";

export const BTN = "ts-btn inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm font-medium text-ink hover:bg-raised disabled:opacity-40";
export const BTN_ON = "ts-btn inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand bg-brand/10 px-2.5 py-1.5 text-sm font-semibold text-brand hover:bg-brand/15";

/** Presenter name chip (Shashikanth / Shaeed). */
export function Chip({ n }: { n: number }) {
  const m = SLIDES[n - 1];
  const tone = m.presenter === "shashikanth" ? "border-pos/50 bg-pos/10 text-pos" : "border-neg/50 bg-neg/10 text-neg";
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${tone}`} data-presenter={m.presenter}>{PRESENTER_NAME[m.presenter]}</span>;
}

// ---------------------------------------------------------------------------------------------------- modal
/** A dialog with a close button, focus moved into it and restored afterwards, Tab kept inside. Esc is handled by the page. */
export function Modal({ label, onClose, children, wide = false }: { label: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const tx = useTx();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const first = el?.querySelector<HTMLElement>("[data-autofocus]") ?? el?.querySelector<HTMLElement>("button, a[href]");
    first?.focus();
    return () => { try { prev?.focus(); } catch { /* element may be gone */ } };
  }, []);
  const trap = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !ref.current) return;
    const f = Array.from(ref.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input, [tabindex]:not([tabindex='-1'])"));
    if (f.length === 0) return;
    const a = document.activeElement;
    if (e.shiftKey && a === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && a === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  };
  return (
    <div className="ts-screen fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-3 sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={label} onKeyDown={trap} className={`max-h-full w-full overflow-auto rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5 ${wide ? "max-w-[1100px]" : "max-w-md"}`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight">{label}</h2>
          <button type="button" onClick={onClose} className={BTN}>{tx("ts.ui.close")}</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------- overview grid
export function OverviewGrid({ current, onPick, onClose }: { current: number; onPick: (i: number) => void; onClose: () => void }) {
  const tx = useTx();
  const title = useSlideTitle();
  return (
    <Modal label={tx("ts.ui.overviewTitle")} onClose={onClose} wide>
      <p className="mb-3 text-sm text-muted">{tx("ts.ui.overviewHint")}</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" data-testid="ts-overview">
        {SLIDES.map((m, i) => (
          <li key={m.n}>
            <button
              type="button"
              data-thumb-btn={m.n}
              data-autofocus={i === current ? "" : undefined}
              aria-current={i === current ? "true" : undefined}
              aria-label={tx("ts.ui.slideLabel", { n: m.n, total: SLIDE_COUNT, title: title(m.n) })}
              onClick={() => onPick(i)}
              className={`ts-thumb block w-full rounded-xl border p-1.5 text-left hover:bg-raised ${i === current ? "border-brand ring-2 ring-brand/40" : "border-line"}`}
            >
              <span className="ts-stage block pointer-events-none"><Slide n={m.n} mode="thumb" /></span>
              <span className="mt-1.5 flex gap-1.5 px-1 text-xs"><b className="font-mono text-brand">{m.n}</b><span className="line-clamp-2">{title(m.n)}</span></span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

// ---------------------------------------------------------------------------------------------------- help
const KEYS: [string[], string][] = [
  [["→", "↓", "PageDown", "Space"], "ts.ui.next"],
  [["←", "↑", "PageUp"], "ts.ui.prev"],
  [["Home"], "ts.ui.k.first"],
  [["End"], "ts.ui.k.last"],
  [["G"], "ts.ui.overview"],
  [["F"], "ts.ui.fullscreen"],
  [["N"], "ts.ui.speakerNotes"],
  [["P"], "ts.ui.presenter"],
  [["T"], "ts.ui.k.timer"],
  [["?"], "ts.ui.help"],
  [["Esc"], "ts.ui.k.esc"],
];

export function HelpDialog({ onClose }: { onClose: () => void }) {
  const tx = useTx();
  return (
    <Modal label={tx("ts.ui.help")} onClose={onClose}>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm" data-testid="ts-help">
        {KEYS.map(([keys, k]) => (
          <div key={k} className="contents">
            <dt className="flex flex-wrap gap-1">{keys.map((x) => <kbd key={x} className="rounded border border-line bg-raised px-1.5 py-0.5 font-mono text-xs">{x}</kbd>)}</dt>
            <dd className="text-muted">{tx(k)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-muted">{tx("ts.ui.k.swipe")}</p>
    </Modal>
  );
}

// ---------------------------------------------------------------------------------------------------- timer
const STATUS_TONE = { ok: "text-ok", near: "text-c-amber", over: "text-bad" } as const;

export function TimerBlock({ r, idx, big = false }: { r: Rehearsal; idx: number; big?: boolean }) {
  const tx = useTx();
  const title = useSlideTitle();
  const meta = SLIDES[idx];
  const used = r.perSlide[idx];
  const st = slideStatus(used, meta.budget);
  const tot = totalStatus(r.total);
  const overBy = used - meta.budget;
  const [announce, setAnnounce] = useState("");
  const wasOver = useRef(false);
  useEffect(() => {
    const over = st === "over";
    if (over && !wasOver.current && r.running) setAnnounce(tx("ts.ui.t.announceOver"));
    if (!over) setAnnounce("");
    wasOver.current = over;
  }, [st, r.running, tx]);
  return (
    <section aria-label={tx("ts.ui.timer")} className="rounded-xl border border-line bg-raised/50 p-3" data-testid="ts-timer">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">{tx("ts.ui.timer")}</h3>
        <span className="text-xs text-muted">{tx("ts.ui.t.planTotal", { t: clock(TOTAL_BUDGET) })}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2">
        <div>
          <div className="text-xs text-muted">{tx("ts.ui.t.total")}</div>
          <div className={`font-mono font-bold tabular-nums ${big ? "text-4xl" : "text-2xl"} ${tot === "beyond" ? "text-bad" : tot === "within" ? "text-ok" : ""}`} data-testid="ts-timer-total">{clock(r.total)}</div>
        </div>
        <div>
          <div className="text-xs text-muted">{tx("ts.ui.t.thisSlide")}</div>
          <div className={`font-mono font-bold tabular-nums ${big ? "text-4xl" : "text-2xl"} ${STATUS_TONE[st]}`} data-testid="ts-timer-slide">
            {clock(used)} <span className="text-sm font-medium text-muted">{tx("ts.ui.t.of", { t: clock(meta.budget) })}</span>
          </div>
        </div>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className={`h-full rounded-full ${st === "over" ? "bg-bad" : st === "near" ? "bg-c-amber" : "bg-ok"}`} style={{ width: `${Math.min(100, (used / meta.budget) * 100)}%` }} />
      </div>
      <p className={`mt-1.5 text-sm font-medium ${STATUS_TONE[st]}`} data-testid="ts-timer-status" data-status={st}>
        {st === "over" ? `⚠ ${tx("ts.ui.t.over", { t: clock(overBy) })}` : st === "near" ? tx("ts.ui.t.near") : tx("ts.ui.t.ok")}
      </p>
      <p className={`text-xs ${tot === "beyond" ? "font-semibold text-bad" : "text-muted"}`} data-testid="ts-timer-target" data-status={tot}>
        {tx(`ts.ui.t.${tot}`)} ({clock(TARGET_MIN)}–{clock(TARGET_MAX)})
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={r.toggle} className={r.running ? BTN_ON : BTN} data-testid="ts-timer-toggle">{r.running ? tx("ts.ui.t.pause") : tx("ts.ui.t.start")}</button>
        <button type="button" onClick={r.reset} className={BTN} data-testid="ts-timer-reset">{tx("ts.ui.t.reset")}</button>
      </div>
      <div role="status" aria-live="polite" className="sr-only">{announce}</div>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-muted">{tx("ts.ui.t.perSlide")}</summary>
        <table className="mt-1 w-full text-xs">
          <thead>
            <tr className="text-left text-muted"><th className="py-0.5 font-medium">{tx("ts.ui.t.colSlide")}</th><th className="text-right font-medium">{tx("ts.ui.t.colPlan")}</th><th className="text-right font-medium">{tx("ts.ui.t.colUsed")}</th></tr>
          </thead>
          <tbody>
            {SLIDES.map((m, i) => {
              const s = slideStatus(r.perSlide[i], m.budget);
              return (
                <tr key={m.n} className={i === idx ? "bg-brand/10" : ""}>
                  <td className="truncate py-0.5 pr-2" title={title(m.n)}>{m.n}</td>
                  <td className="text-right font-mono">{clock(m.budget)}</td>
                  <td className={`text-right font-mono ${r.perSlide[i] > 0 ? STATUS_TONE[s] : "text-muted"}`}>{clock(r.perSlide[i])}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>
    </section>
  );
}

// ---------------------------------------------------------------------------------------------------- speaker notes
export function NotesText({ n, className = "", tid }: { n: number; className?: string; tid?: string }) {
  const tx = useTx();
  return <p className={`leading-relaxed ${className}`} data-testid={tid ?? `ts-notes-${n}`}>{tx(`ts.s${n}.notes`)}</p>;
}

export function NotesPanel({ idx, r }: { idx: number; r: Rehearsal }) {
  const tx = useTx();
  const title = useSlideTitle();
  const m = SLIDES[idx];
  return (
    <aside aria-label={tx("ts.ui.speakerNotes")} className="ts-screen space-y-3" data-testid="ts-notes-panel">
      <div className="card p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold">{tx("ts.ui.speakerNotes")}</h2>
          <Chip n={m.n} />
          <span className="text-xs text-muted">{tx("ts.ui.budget", { s: m.budget })}</span>
        </div>
        <NotesText n={m.n} className="mt-2 text-sm" />
      </div>
      <TimerBlock r={r} idx={idx} />
      <details className="card p-3 text-sm sm:p-4">
        <summary className="cursor-pointer font-semibold">{tx("ts.ui.allNotes")}</summary>
        <ol className="mt-2 space-y-3">
          {SLIDES.map((s) => (
            <li key={s.n} className={s.n === m.n ? "rounded-lg bg-brand/10 p-2" : "p-2"}>
              <div className="flex flex-wrap items-center gap-2 text-xs"><b className="font-mono">{s.n}</b><span className="font-medium">{title(s.n)}</span><Chip n={s.n} /></div>
              <NotesText n={s.n} className="mt-1 text-xs text-muted" tid={`ts-allnotes-${s.n}`} />
            </li>
          ))}
        </ol>
      </details>
    </aside>
  );
}

// ---------------------------------------------------------------------------------------------------- presenter view
export function PresenterView({ idx, r, children }: { idx: number; r: Rehearsal; children: ReactNode }) {
  const tx = useTx();
  const title = useSlideTitle();
  const m = SLIDES[idx];
  const next = idx + 1 < SLIDE_COUNT ? SLIDES[idx + 1] : null;
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]" data-testid="ts-presenter">
      <div className="min-w-0">{children}</div>
      <div className="min-w-0 space-y-3">
        <section aria-label={tx("ts.ui.next")} className="card p-3">
          <h2 className="mb-2 text-sm font-semibold">{tx("ts.ui.next")}{next ? `: ${title(next.n)}` : ""}</h2>
          {next ? <div className="ts-stage pointer-events-none" data-testid="ts-next-preview"><Slide n={next.n} mode="thumb" /></div> : <p className="rounded-lg bg-raised p-6 text-center text-sm text-muted" data-testid="ts-next-preview">{tx("ts.ui.endSlide")}</p>}
        </section>
        <section aria-label={tx("ts.ui.speakerNotes")} className="card p-3 sm:p-4" data-testid="ts-presenter-notes">
          <div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold">{tx("ts.ui.speakerNotes")}</h2><Chip n={m.n} /><span className="text-xs text-muted">{tx("ts.ui.budget", { s: m.budget })}</span></div>
          <NotesText n={m.n} className="mt-2 text-base" />
        </section>
        <TimerBlock r={r} idx={idx} big />
      </div>
    </div>
  );
}
