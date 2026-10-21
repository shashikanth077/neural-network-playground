import { useEffect, useState } from "react";
import { Demo } from "../../ui";
import { useR, useTx } from "../rich";

const KEY = "ailab-lab3-checklist";

/** Four groups of three concepts: rows lab3.e.ck.g<g>.t and lab3.e.ck.g<g>.i<i>.a / .b */
const GROUPS = [0, 1, 2, 3];
const ITEMS = [0, 1, 2];
const TOTAL = GROUPS.length * ITEMS.length;

export default function Checklist() {
  const r = useR();
  const tx = useTx();
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try { setTicked(JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { /* start empty */ }
  }, []);
  const toggle = (k: string, v: boolean) => {
    setTicked((t) => {
      const next = { ...t, [k]: v };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };
  const n = Object.values(ticked).filter(Boolean).length;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{r("lab3.e.ck.lead")}</p>
      <Demo>
        <p className="font-semibold" aria-live="polite" data-testid="ck-count">{tx("lab3.e.ck.count", { n, total: TOTAL })}</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-raised" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={n} aria-label={tx("lab3.e.ck.progress")}>
          <div className="h-full rounded-full bg-ok transition-[width]" style={{ width: `${(n / TOTAL) * 100}%` }} />
        </div>
      </Demo>
      <div className="grid gap-4 md:grid-cols-2 [&>*]:min-w-0">
        {GROUPS.map((g) => (
          <Demo key={g} title={tx(`lab3.e.ck.g${g}.t`)}>
            <ul className="space-y-2">
              {ITEMS.map((i) => {
                const k = `g${g}i${i}`;
                return (
                  <li key={k}>
                    <label className="flex cursor-pointer items-start gap-2.5">
                      <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-brand" checked={!!ticked[k]} onChange={(e) => toggle(k, e.target.checked)} />
                      <span className="text-sm">{tx(`lab3.e.ck.g${g}.i${i}.a`)}<small className="block text-xs text-muted">{tx(`lab3.e.ck.g${g}.i${i}.b`)}</small></span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </Demo>
        ))}
      </div>
    </div>
  );
}
