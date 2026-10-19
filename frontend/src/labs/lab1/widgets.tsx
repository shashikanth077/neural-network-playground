import type { ReactNode } from "react";

/** Small shared controls for the Lab 1 hands-on widgets. */

export function NumInput({
  id, label, value, onChange, min, max, step = 1, className = "", hideLabel = false,
}: { id: string; label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; className?: string; hideLabel?: boolean }) {
  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "label"}>{label}</label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        className="field !py-1 font-mono text-sm"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = e.target.value === "" ? NaN : Number(e.target.value);
          onChange(v);
        }}
      />
    </div>
  );
}

export function Flag({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={`inline-block min-w-[2.2rem] rounded-md px-1.5 py-0.5 text-center text-xs font-semibold ${on ? "bg-bad/15 text-bad" : "bg-raised text-muted"}`}
      role="img"
      aria-label={label}
    >
      {on ? "⚑" : "·"}
    </span>
  );
}

export function ScrollTable({ children, label, maxH }: { children: ReactNode; label: string; maxH?: string }) {
  return (
    <div className={`overflow-auto rounded-xl border border-line ${maxH ?? ""}`} role="region" aria-label={label} tabIndex={0}>
      {children}
    </div>
  );
}

export const th = "sticky top-0 border-b border-line bg-surface px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted";
export const td = "border-b border-line px-2 py-1 text-sm";

/** A small calculation line: monospace, wraps on narrow screens. */
export function Calc({ children }: { children: ReactNode }) {
  return <p className="whitespace-pre-wrap break-words rounded-lg border border-line bg-raised/70 px-3 py-2 font-mono text-[13px] leading-relaxed">{children}</p>;
}

export const sci = (v: number, d = 2) => (v !== 0 && (Math.abs(v) < 1e-3 || Math.abs(v) >= 1e6) ? v.toExponential(d) : String(Number(v.toFixed(d + 2))));
