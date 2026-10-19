import { useState, type ReactNode } from "react";
import { Tex } from "../components/Tex";

export const T = ({ children }: { children: string }) => <Tex>{children}</Tex>;

export function Table({ head, rows, wide }: { head: string[]; rows: ReactNode[][]; wide?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-sm ${wide ? "min-w-[760px]" : "min-w-[480px]"}`}>
        <thead>
          <tr>{head.map((h) => <th key={h} scope="col" className="border-b border-line px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="align-top">
              {r.map((c, j) => <td key={j} className={`border-b border-line px-2 py-2 ${j === 0 ? "font-medium" : ""}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Code({ children, label }: { children: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard may be blocked */
    }
  };
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-xl border border-line bg-raised p-3 pr-16 font-mono text-[12.5px] leading-relaxed" aria-label={label}>{children}</pre>
      <button onClick={copy} className="btn-ghost absolute right-2 top-2 !px-2 !py-0.5 !text-[11px] print:hidden">{copied ? "Copied" : "Copy"}</button>
    </div>
  );
}

export const Note = ({ children }: { children: ReactNode }) => (
  <p className="mt-2 rounded-lg border-l-4 border-brand bg-raised/60 px-3 py-2 text-sm text-muted">{children}</p>
);

export const Sub = ({ children }: { children: ReactNode }) => <h4 className="mb-1 mt-4 text-sm font-semibold first:mt-0">{children}</h4>;
