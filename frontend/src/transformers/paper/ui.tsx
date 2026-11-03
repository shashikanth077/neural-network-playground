import { createContext, Suspense, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Tex } from "../../components/Tex";
import { lab3 } from "../../labs/lab3";
import { useR, useTx } from "../../labs/lab3/rich";
import { eq } from "./formulas";

/** "demos" shows the live Lab 3 widgets, "read" is the plain document. */
export type View = "demos" | "read";
export const ViewCtx = createContext<View>("demos");
export const useView = () => useContext(ViewCtx);

/** Paper paragraph from a translated key (with the inline markup of `rich.tsx`). */
export function Para({ k, vars, className = "" }: { k: string; vars?: Record<string, string | number>; className?: string }) {
  const r = useR();
  return <p className={`tp-p leading-[1.75] text-ink/90 ${className}`}>{r(k, vars)}</p>;
}

/** Bulleted or numbered list from translated keys. */
export function Items({ keys, ordered = false, label, prefix }: { keys: string[]; ordered?: boolean; label?: string; prefix?: string }) {
  const r = useR();
  const L = ordered ? "ol" : "ul";
  return (
    <L aria-label={label} className={`my-3 space-y-1.5 pl-6 leading-[1.7] text-ink/90 ${ordered ? "list-decimal" : "list-disc"} marker:text-brand`}>
      {keys.map((k, i) => <li key={k} id={prefix ? `${prefix}${i + 1}` : undefined}>{r(k)}</li>)}
    </L>
  );
}

/** "§2.6" chip: where the text comes from in the paper. */
export function SecChip({ n, className = "" }: { n: string; className?: string }) {
  const tx = useTx();
  return <span className={`chip shrink-0 font-mono !text-[11px] ${className}`} title={tx("tp.ui.paperSec", { n })}>§{n}</span>;
}

/** The "In plain words" box for beginners. */
export function Plain({ children, k }: { children?: ReactNode; k?: string }) {
  const tx = useTx();
  const r = useR();
  return (
    <aside className="tp-plain my-4 rounded-xl border border-line border-l-4 border-l-c-teal bg-raised/60 p-3.5 text-sm" aria-label={tx("tp.ui.plain")}>
      <p className="font-semibold text-c-teal"><span aria-hidden className="mr-1.5">💬</span>{tx("tp.ui.plain")}</p>
      <div className="mt-1 leading-relaxed text-muted">{k ? r(k) : children}</div>
    </aside>
  );
}

/** A small note (recorded / recomputed / redrawn). */
export function Note({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "ok" | "brand" | "amber" }) {
  const c = { muted: "border-line text-muted", ok: "border-ok/50 text-ok", brand: "border-brand/50 text-brand", amber: "border-c-amber/60 text-c-amber" }[tone];
  return <p className={`my-2 rounded-lg border bg-raised/50 px-3 py-1.5 text-xs leading-relaxed ${c}`}>{children}</p>;
}

/** Anchor link plus a copy-link button next to a heading. */
function AnchorTools({ id }: { id: string }) {
  const tx = useTx();
  const [done, setDone] = useState(false);
  const copy = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    try {
      void navigator.clipboard?.writeText(url).then(() => { setDone(true); setTimeout(() => setDone(false), 1600); }, () => undefined);
    } catch { /* clipboard blocked */ }
  }, [id]);
  return (
    <span className="tp-noprint ml-2 inline-flex items-center gap-1 align-middle text-sm font-normal">
      <a href={`#${id}`} className="rounded px-1 text-muted hover:text-brand" aria-label={tx("tp.ui.anchor")} title={tx("tp.ui.anchor")}>#</a>
      <button type="button" onClick={copy} className="rounded px-1 text-xs text-muted hover:text-brand" aria-label={tx("tp.ui.copy")} title={tx("tp.ui.copy")}>
        {done ? "✓ " + tx("tp.ui.copied") : "⧉"}
      </button>
    </span>
  );
}

const HEAD_CLS: Record<2 | 3 | 4, string> = {
  2: "mt-0 text-2xl font-extrabold tracking-tight sm:text-3xl",
  3: "text-xl font-bold tracking-tight sm:text-2xl",
  4: "text-base font-semibold tracking-tight sm:text-lg",
};

/** Heading with the paper's number, a "§" chip and anchor tools. The id goes on the heading itself, except for `top` headings, whose section element carries the id. */
export function Heading({ id, level, num, title, chip = true, top = false }: { id: string; level: 2 | 3 | 4; num?: string; title: string; chip?: boolean; top?: boolean }) {
  const Tag = `h${level}` as "h2";
  return (
    <Tag id={top ? undefined : id} className={`tp-heading scroll-mt-[var(--anchor-off,8rem)] break-words ${HEAD_CLS[level]}`}>
      {num && <span className="mr-2 font-mono text-brand">{num}</span>}
      {title}
      {num && chip && level < 4 && <SecChip n={num} className="ml-2 align-middle" />}
      <AnchorTools id={id} />
    </Tag>
  );
}

/** A top-level section: `data-section` is what the outline and the scroll-spy follow. */
export function Section({ id, children }: { id: string; children: ReactNode }) {
  return <section id={id} data-section={id} className="tp-section scroll-mt-[var(--anchor-off,8rem)] border-t border-line pt-8 first:border-t-0 first:pt-0">{children}</section>;
}

/** Block equation with the paper's number. */
export function Eq({ n }: { n: number }) {
  const e = eq(n);
  return (
    <div className="tp-eq my-3 flex scroll-mt-[var(--anchor-off,8rem)] items-center gap-3 rounded-lg bg-raised/40 px-3 py-1" id={`eq-${n}`} data-eq={n}>
      <div className="min-w-0 flex-1 overflow-x-auto"><Tex block>{e.tex}</Tex></div>
      <span className="shrink-0 font-mono text-sm text-muted">({n})</span>
    </div>
  );
}

/** Figure with its numbered caption. */
export function Figure({ n, caption, children, wide = false }: { n: number; caption: string; children: ReactNode; wide?: boolean }) {
  const tx = useTx();
  return (
    <figure id={`fig-${n}`} data-figure={n} className="tp-figure my-5 scroll-mt-[var(--anchor-off,8rem)] break-inside-avoid">
      <div className={`card min-w-0 overflow-hidden p-3 sm:p-4 ${wide ? "" : "mx-auto max-w-3xl"}`}>{children}</div>
      <figcaption className="mx-auto mt-2 max-w-3xl text-center text-sm text-muted"><b className="text-ink">{tx("tp.ui.fig", { n })}</b> {caption}</figcaption>
    </figure>
  );
}

/** Table caption title above a table. */
export function TableBox({ n, caption, children }: { n: number; caption: string; children: ReactNode }) {
  const tx = useTx();
  return (
    <div id={`table-${n}`} data-table={n} className="tp-table my-5 scroll-mt-[var(--anchor-off,8rem)] break-inside-avoid">
      <p className="mb-1.5 text-sm text-muted"><b className="text-ink">{tx("tp.ui.table", { n })}</b> {caption}</p>
      <div className="card overflow-hidden p-1.5 sm:p-2">{children}</div>
    </div>
  );
}

/** Static table with translated headers and arbitrary cells. */
export function DataTable({ head, rows, label, numeric = [], minW = 520 }: { head: string[]; rows: ReactNode[][]; label: string; numeric?: number[]; minW?: number }) {
  return (
    <div className="max-w-full overflow-x-auto">
      <table className="w-full text-xs sm:text-sm" style={{ minWidth: minW }} aria-label={label}>
        <thead>
          <tr>{head.map((h, i) => <th key={i} scope="col" className={`border-b border-line px-2 py-1.5 font-semibold text-muted ${numeric.includes(i) ? "text-right" : "text-left"}`}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="align-top">
              {r.map((c, j) => <td key={j} className={`border-b border-line px-2 py-1.5 ${numeric.includes(j) ? "text-right font-mono" : ""}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Original PNG of a figure of the paper, behind a toggle (hidden in print: the native version is printed). */
export function OriginalFigure({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
  const tx = useTx();
  const [open, setOpen] = useState(false);
  return (
    <div className="tp-noprint mt-3 border-t border-line pt-2 text-center">
      <button type="button" className="text-xs font-medium text-brand hover:underline" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? tx("tp.ui.origHide") : tx("tp.ui.origShow")}
      </button>
      {open && (
        <div className="mt-2">
          <img src={src} alt={alt} width={width} height={height} loading="lazy" className="mx-auto h-auto max-w-full rounded-lg border border-line bg-white" />
          <p className="mt-1 text-xs text-muted">{tx("tp.ui.origNote")}</p>
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  const tx = useTx();
  return (
    <div role="status" aria-label={tx("tp.ui.loading")} className="animate-pulse space-y-3 p-4" data-testid="tp-skeleton">
      <div className="h-4 w-1/3 rounded bg-raised" />
      <div className="h-36 rounded-xl bg-raised" />
      <div className="h-4 w-2/3 rounded bg-raised" />
    </div>
  );
}

/**
 * A live Lab 3 step embedded in the page. It is mounted lazily: only when it has been scrolled near (IntersectionObserver),
 * and never in the plain "Read" view or in print. `data-mounted` tells the tests (and the capture script) whether it is live.
 */
export function LiveStep({ stepId, hint }: { stepId: string; hint?: string }) {
  const view = useView();
  const tx = useTx();
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const step = lab3.steps.find((s) => s.id === stepId);

  useEffect(() => {
    if (view !== "demos" || mounted) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setMounted(true); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setMounted(true); io.disconnect(); }
    }, { rootMargin: "500px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [view, mounted]);

  if (!step) return null;
  const Step = step.Component;
  const title = tx(`step.lab3.${stepId}.title`);
  const link = (
    <Link to={`/labs/lab3/${stepId}`} className="inline-flex items-center rounded-full border border-line bg-raised px-3 py-1 text-xs font-medium text-brand hover:bg-surface" data-testid={`step-link-${stepId}`}>
      {tx("tp.ui.openStep")}
    </Link>
  );
  if (view === "read") {
    return (
      <p className="tp-noprint my-3 text-sm text-muted" data-testid={`live-${stepId}`} data-mounted="false">
        <span aria-hidden>🧪 </span>{tx("tp.ui.demoAvail", { title })} {link}
      </p>
    );
  }
  return (
    <>
      <div ref={ref} className="tp-noprint tp-live -mx-3 my-5 min-w-0 max-w-full rounded-2xl border border-brand/30 bg-bg/40 sm:mx-0" data-testid={`live-${stepId}`} data-mounted={mounted ? "true" : "false"}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
          <p className="min-w-0 text-sm font-semibold"><span className="mr-1.5 rounded bg-brand/15 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand">{tx("tp.ui.live")}</span>{title}</p>
          {link}
        </div>
        {hint && <p className="px-3 pt-2 text-xs leading-relaxed text-muted">{hint}</p>}
        <div className="min-w-0 max-w-full p-1.5 sm:p-4">
          {mounted ? <Suspense fallback={<Skeleton />}><Step /></Suspense> : <Skeleton />}
        </div>
      </div>
      <p className="tp-printonly hidden text-xs text-muted">{tx("tp.ui.printDemo", { title, path: `/labs/lab3/${stepId}` })}</p>
    </>
  );
}

/** Link to a step without embedding it (used when the same step already appears nearby). */
export function StepChip({ stepId }: { stepId: string }) {
  const tx = useTx();
  return (
    <Link to={`/labs/lab3/${stepId}`} className="tp-noprint inline-flex items-center rounded-full border border-line bg-raised px-3 py-1 text-xs font-medium text-brand hover:bg-surface">
      {tx(`step.lab3.${stepId}.title`)} · {tx("tp.ui.openStep")}
    </Link>
  );
}
