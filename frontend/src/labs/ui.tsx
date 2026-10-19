import type { ReactNode } from "react";
import { useT } from "../i18n";

/** Shared building blocks for lab demos. Colours come from the theme tokens, so light/dark just work. */
export const col = (name: string, alpha?: number) =>
  alpha === undefined ? `rgb(var(--${name}))` : `rgb(var(--${name}) / ${alpha})`;

/** Resolve a theme token to a concrete colour string for <canvas>, which cannot read CSS variables. */
export function canvasColor(name: string, alpha = 1): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim().replace(/\s+/g, ", ");
  return `rgba(${v || "120, 120, 120"}, ${alpha})`;
}

export function Demo({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`card p-4 sm:p-5 ${className}`}>
      {title && <h3 className="text-base font-semibold tracking-tight">{title}</h3>}
      <div className={title ? "mt-3" : ""}>{children}</div>
    </div>
  );
}

const TONES = {
  info: { bar: "border-brand", icon: "💡", title: "text-brand" },
  warn: { bar: "border-c-amber", icon: "⚠️", title: "text-c-amber" },
  good: { bar: "border-ok", icon: "✅", title: "text-ok" },
} as const;

export function Callout({ tone = "info", title, children }: { tone?: keyof typeof TONES; title: string; children: ReactNode }) {
  const t = TONES[tone];
  return (
    <aside className={`mt-4 rounded-xl border border-line border-l-4 ${t.bar} bg-raised/60 p-3 text-sm`}>
      <p className={`font-semibold ${t.title}`}>
        <span aria-hidden className="mr-1.5">{t.icon}</span>
        {title}
      </p>
      <div className="mt-1 leading-relaxed text-muted">{children}</div>
    </aside>
  );
}

export function Out({ children }: { children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" className="mt-3 rounded-xl border border-line bg-raised/70 px-3 py-2 text-sm leading-relaxed">
      {children}
    </div>
  );
}

export function Formula({ children }: { children: ReactNode }) {
  return <code className="inline-block rounded-lg border border-line bg-raised px-2.5 py-1 font-mono text-[13px]">{children}</code>;
}

export function Seg<T extends string>({
  label, value, onChange, options,
}: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-xl border border-line bg-raised/60 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            value === o.value ? "bg-surface text-brand shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Slider({
  id, label, min, max, step, value, onChange, format,
}: { id: string; label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  return (
    <div className="min-w-[180px] flex-1">
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-xs font-medium text-muted">
        <span>{label}</span>
        <output htmlFor={id} className="font-mono text-sm text-ink">{format ? format(value) : value}</output>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-brand" />
    </div>
  );
}

export function Controls({ children }: { children: ReactNode }) {
  return <div className="mb-3 flex flex-wrap items-end gap-x-5 gap-y-3">{children}</div>;
}

export function Legend({ items }: { items: { color: string; label: string }[] }) {
  const t = useT();
  return (
    <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted" aria-label={t("lab1.ui.legend")}>
      {items.map((i) => (
        <li key={i.label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

export function Grid({ cols = 2, children }: { cols?: 2 | 3; children: ReactNode }) {
  return <div className={`grid gap-4 [&>*]:min-w-0 ${cols === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>{children}</div>;
}

export function Concept({ term, children }: { term: string; children: ReactNode }) {
  const t = useT();
  return (
    <p className="text-sm leading-relaxed text-muted">
      <b className="text-ink">{t("lab1.ui.concept")} {term}</b> {children}
    </p>
  );
}

export const f2 = (v: number, d = 2) => Number(v).toFixed(d);
