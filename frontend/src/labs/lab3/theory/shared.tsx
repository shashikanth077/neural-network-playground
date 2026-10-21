import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useT } from "../../../i18n";
import { useR, useTx } from "../rich";
import type { RecordedAttention } from "../data/theoryAttention";
import { decodeAttention } from "../transformerMath";

/** Paragraph from a translated key (with inline markup). */
export function P({ k, vars, className = "" }: { k: string; vars?: Record<string, string | number>; className?: string }) {
  const r = useR();
  return <p className={`text-sm leading-relaxed text-muted ${className}`}>{r(k, vars)}</p>;
}

const TAGS = {
  recorded: { key: "lab3.t.tag.recorded", cls: "border-ok/60 bg-ok/10 text-ok" },
  recomputed: { key: "lab3.t.tag.recomputed", cls: "border-brand/60 bg-brand/10 text-brand" },
  toy: { key: "lab3.t.tag.toy", cls: "border-c-amber/70 bg-c-amber/10 text-c-amber" },
  paper: { key: "lab3.t.tag.paper", cls: "border-line bg-raised text-muted" },
  bert: { key: "lab3.t.tag.bert", cls: "border-line bg-raised text-muted" },
} as const;

/** Honesty label on every demo: recorded from a real run, recomputed live from a formula, a toy example, or where a fact comes from. */
export function Tag({ kind }: { kind: keyof typeof TAGS }) {
  const tx = useTx();
  const t = TAGS[kind];
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-tight ${t.cls}`}>{tx(t.key)}</span>;
}

/** Title row of a demo: heading plus its honesty tag(s). */
export function DemoHead({ title, tags }: { title: string; tags: (keyof typeof TAGS)[] }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      {tags.map((t) => <Tag key={t} kind={t} />)}
    </div>
  );
}

/** Link chip to another step of this lab. */
export function StepLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link to={`/labs/lab3/${to}`} className="inline-flex items-center rounded-full border border-line bg-raised px-2.5 py-1 text-xs font-medium text-brand hover:bg-surface">{children} →</Link>;
}

/** Plain-text numeric input for editable matrices. Empty or invalid text counts as 0. */
export function NumCell({ value, onChange, label, step = 0.1 }: { value: number; onChange: (v: number) => void; label: string; step?: number }) {
  return (
    <input
      type="number"
      step={step}
      aria-label={label}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => { const v = parseFloat(e.target.value); onChange(Number.isFinite(v) ? v : 0); }}
      className="field !w-[4.2rem] !px-1.5 !py-1 text-center font-mono text-xs"
    />
  );
}

export const n2 = (v: number, d = 2) => (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d);
export const fmtInt = (v: number) => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

/** Heat-map table. `signed` uses brand for positive and orange for negative values; otherwise 0..max on the brand colour. */
export function Heat({
  values, rowLabels, colLabels, max = 1, signed = false, showValues = true, digits = 2, cell = "h-8 min-w-[2.2rem]", label, onCell, onRow, activeRow, activeCell, small = false,
}: {
  values: number[][]; rowLabels?: string[]; colLabels?: string[]; max?: number; signed?: boolean; showValues?: boolean; digits?: number; cell?: string; label: string;
  onCell?: (i: number, j: number) => void; onRow?: (i: number) => void; activeRow?: number | null; activeCell?: [number, number] | null; small?: boolean;
}) {
  const bg = (v: number) => {
    const a = Math.min(1, Math.abs(v) / max);
    return signed && v < 0 ? `rgb(var(--neg) / ${(a * 0.9).toFixed(3)})` : `rgb(var(--brand) / ${(a * 0.9).toFixed(3)})`;
  };
  return (
    <div className="max-w-full overflow-x-auto" role="group" aria-label={label}>
      <table className="border-separate border-spacing-px text-center font-mono text-[11px]">
        {colLabels && (
          <thead>
            <tr>
              {rowLabels && <th />}
              {colLabels.map((c, j) => <th key={j} scope="col" className={`px-1 font-medium text-muted ${small ? "max-w-[3rem] truncate" : ""}`}>{c}</th>)}
            </tr>
          </thead>
        )}
        <tbody>
          {values.map((row, i) => (
            <tr key={i}>
              {rowLabels && (
                <th scope="row" className={`whitespace-nowrap pr-1.5 text-right font-medium ${activeRow === i ? "text-brand" : "text-muted"}`}>
                  {onRow ? <button type="button" onClick={() => onRow(i)} className="underline decoration-dotted underline-offset-2" aria-label={rowLabels[i]}>{rowLabels[i]}</button> : rowLabels[i]}
                </th>
              )}
              {row.map((v, j) => {
                const a = Math.min(1, Math.abs(v) / max);
                const active = activeCell && activeCell[0] === i && activeCell[1] === j;
                const content = showValues ? n2(v, digits) : "";
                return (
                  <td
                    key={j}
                    title={`${n2(v, 3)}`}
                    onClick={onCell ? () => onCell(i, j) : undefined}
                    style={{ background: bg(v) }}
                    className={`${cell} rounded-sm px-0.5 ${a > 0.55 ? "text-white" : "text-ink"} ${onCell ? "cursor-pointer" : ""} ${active || activeRow === i ? "outline outline-2 outline-ink/60" : ""}`}
                  >
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Horizontal bar with a label and a value (width = value / max). */
export function Bar({ label, value, max, text, tone = "bg-brand" }: { label: ReactNode; value: number; max: number; text: string; tone?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-28 shrink-0 truncate text-muted sm:w-40">{label}</span>
      <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-raised" role="img" aria-label={`${typeof label === "string" ? label : ""}: ${text}`}>
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(0.5, Math.min(100, (value / max) * 100))}%` }} />
      </div>
      <b className="w-24 shrink-0 text-right font-mono text-xs sm:w-28">{text}</b>
    </div>
  );
}

/** Loads the recorded DistilBERT attention maps lazily (a separate chunk of about 200 KB) and decodes one set. */
export function useRecordedAttention() {
  const [sets, setSets] = useState<RecordedAttention[] | null>(null);
  useEffect(() => {
    let alive = true;
    void import("../data/theoryAttention").then((m) => { if (alive) setSets(m.RECORDED_ATTENTION); });
    return () => { alive = false; };
  }, []);
  return sets;
}

export function decodeSet(s: RecordedAttention) {
  return decodeAttention(s.att, s.layers, s.heads, s.tokens.length);
}

/** SVG line chart helper: maps data to a viewBox. */
export const lin = (v: number, a: number, b: number, c: number, d: number) => c + ((v - a) / (b - a || 1)) * (d - c);

/** Pretty large numbers: 4.4 M, 175 B. */
export function human(v: number): string {
  if (v >= 1e9) return `${+(v / 1e9).toFixed(v >= 1e10 ? 0 : 1)} B`;
  if (v >= 1e6) return `${+(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)} M`;
  if (v >= 1e3) return `${+(v / 1e3).toFixed(v >= 1e4 ? 0 : 1)} k`;
  return String(Math.round(v));
}

const FALLBACK_TITLES: Record<string, string> = {
  results: "Results of the ten models", cost: "Cost: time, latency and size", efficiency: "Data efficiency",
  readymade: "Ready-made and zero-shot models", errors: "Negation, contrast and the sentence lab", baselines: "The classical and recurrent baselines",
};
/** Title of a Lab 3 step in the current language (English from the registry if the translation is not loaded yet). */
export function useStepTitle() {
  const t = useT();
  return (id: string) => t(`step.lab3.${id}.title`, FALLBACK_TITLES[id] ?? id);
}
