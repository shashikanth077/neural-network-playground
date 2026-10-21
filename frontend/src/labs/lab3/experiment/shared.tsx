import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MODELS, type Family, type ModelRec } from "../data/expModels";
import { useTx } from "../rich";

/** Family colours: the paper's blue / orange / green, taken from the theme tokens so light and dark both work. */
export const FAM_COLOR: Record<Family, string> = {
  classical: "rgb(var(--pos))",
  recurrent: "rgb(var(--neg))",
  transformer: "rgb(var(--ok))",
};
export const FAM_KEY: Record<Family, string> = {
  classical: "lab3.e.x.fam.classical",
  recurrent: "lab3.e.x.fam.recurrent",
  transformer: "lab3.e.x.fam.transformer",
};

export const pct = (v: number, d = 1) => (v * 100).toFixed(d);
export const pct2 = (v: number) => `${(v * 100).toFixed(2)} %`;
/** 1,974,786 -> "1 974 786": the thin-space grouping the other labs use. */
export const fmtInt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
export const fmtMs = (ms: number) => (ms < 1 ? ms.toFixed(3) : ms < 10 ? ms.toFixed(2) : ms.toFixed(1));
export const fmtParams = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2)} M` : `${(n / 1e3).toFixed(0)} k`);

/** Legend of the three model families. */
export function FamilyLegend() {
  const tx = useTx();
  return (
    <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted" aria-label={tx("lab3.e.x.legend")}>
      {(Object.keys(FAM_COLOR) as Family[]).map((f) => (
        <li key={f} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: FAM_COLOR[f] }} />
          {tx(FAM_KEY[f])}
        </li>
      ))}
    </ul>
  );
}

/** Loads the 872-sentence table (a separate chunk) the first time a step needs it. */
export function usePreds() {
  const [data, setData] = useState<typeof import("../data/expPreds") | null>(null);
  useEffect(() => {
    let live = true;
    import("../data/expPreds").then((m) => { if (live) setData(m); });
    return () => { live = false; };
  }, []);
  return data;
}

export function Loading() {
  const tx = useTx();
  return <p role="status" className="rounded-xl border border-line bg-raised/60 px-3 py-2 text-sm text-muted">{tx("lab3.e.x.loading")}</p>;
}

/** Horizontal bar list: label, a bar on a track, the value. Plain HTML so it wraps well on a phone. */
export function BarList({ rows, min, max, label }: {
  rows: { key: string; label: ReactNode; value: number; text: string; color: string; sub?: ReactNode }[];
  min: number; max: number; label: string;
}) {
  return (
    <ul className="space-y-1.5" aria-label={label}>
      {rows.map((r) => (
        <li key={r.key} className="grid items-center gap-x-3 gap-y-0.5 sm:grid-cols-[13rem_1fr_4.5rem]">
          <span className="min-w-0 truncate text-sm sm:text-right" title={typeof r.label === "string" ? r.label : undefined}>{r.label}</span>
          <span className="h-4 overflow-hidden rounded bg-raised" aria-hidden>
            <span className="block h-full rounded" style={{ width: `${Math.max(0, Math.min(100, ((r.value - min) / (max - min)) * 100))}%`, background: r.color }} />
          </span>
          <span className="font-mono text-sm sm:text-right">{r.text}</span>
          {r.sub && <span className="text-xs text-muted sm:col-span-3">{r.sub}</span>}
        </li>
      ))}
    </ul>
  );
}

export interface Col<T> {
  id: string;
  label: string;
  /** Sort value; strings sort alphabetically, numbers numerically. */
  value: (r: T) => number | string;
  render?: (r: T) => ReactNode;
  align?: "left" | "right";
}

/** A table whose every column header sorts it (click again to reverse). */
export function SortTable<T>({ rows, cols, rowKey, initial, label, rowClass }: {
  rows: T[]; cols: Col<T>[]; rowKey: (r: T) => string; initial: { id: string; dir: 1 | -1 }; label: string; rowClass?: (r: T) => string;
}) {
  const [sort, setSort] = useState(initial);
  const sorted = useMemo(() => {
    const col = cols.find((c) => c.id === sort.id) ?? cols[0];
    return rows.slice().sort((a, b) => {
      const x = col.value(a), y = col.value(b);
      const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return c * sort.dir;
    });
  }, [rows, cols, sort]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-xs sm:text-sm" aria-label={label}>
        <thead>
          <tr>
            {cols.map((c) => {
              const on = sort.id === c.id;
              return (
                <th key={c.id} scope="col" aria-sort={on ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className={`border-b border-line px-2 py-1.5 font-semibold ${c.align === "right" ? "text-right" : "text-left"}`}>
                  <button
                    type="button"
                    data-sort={c.id}
                    onClick={() => setSort(on ? { id: c.id, dir: (sort.dir * -1) as 1 | -1 } : { id: c.id, dir: typeof c.value(rows[0]) === "number" ? -1 : 1 })}
                    className={`inline-flex items-center gap-1 whitespace-nowrap uppercase tracking-wide ${on ? "text-brand" : "text-muted"} hover:text-ink`}
                  >
                    {c.label}
                    <span aria-hidden className="text-[10px]">{on ? (sort.dir === 1 ? "▲" : "▼") : "↕"}</span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={rowKey(r)} className={rowClass?.(r) ?? ""}>
              {cols.map((c) => (
                <td key={c.id} className={`border-b border-line px-2 py-1.5 ${c.align === "right" ? "text-right font-mono" : ""}`}>{c.render ? c.render(r) : String(c.value(r))}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const FamilyDot = ({ family }: { family: Family }) => (
  <span aria-hidden className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-baseline" style={{ background: FAM_COLOR[family] }} />
);

export const modelList: ModelRec[] = MODELS;

/** A select of the ten models. */
export function ModelSelect({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (tag: string) => void }) {
  return (
    <div className="min-w-[200px] flex-1">
      <label htmlFor={id} className="block text-xs font-medium text-muted">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-surface px-2.5 py-2 text-sm">
        {MODELS.map((m) => <option key={m.tag} value={m.tag}>{m.name}</option>)}
      </select>
    </div>
  );
}

/** Small labelled number or text input. */
export function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="min-w-[160px] flex-1">
      <label htmlFor={id} className="block text-xs font-medium text-muted">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
export const INPUT = "w-full rounded-lg border border-line bg-surface px-2.5 py-2 text-sm";
