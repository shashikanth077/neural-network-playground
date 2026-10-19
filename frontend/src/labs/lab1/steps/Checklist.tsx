import { useT } from "../rich";
import { useEffect, useState } from "react";
import { Demo } from "../../ui";
import { ROADMAP } from "../data";

const KEY = "ailab-lab1-checklist";
const TOTAL = ROADMAP.reduce((n, [, items]) => n + items.length, 0);

export default function Checklist() {
  const t = useT();
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try { setTicked(JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { /* start empty */ }
  }, []);
  const toggle = (k: string, v: boolean) => {
    setTicked((c) => {
      const next = { ...c, [k]: v };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };
  const n = Object.values(ticked).filter(Boolean).length;
  let id = 0;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("lab1.chk.intro")}</p>
      <Demo>
        <p className="font-semibold" aria-live="polite">{t("lab1.chk.count", undefined, { a: n, b: TOTAL })}</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-raised" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={n} aria-label={t("lab1.chk.bar")}>
          <div className="h-full rounded-full bg-ok transition-[width]" style={{ width: `${(n / TOTAL) * 100}%` }} />
        </div>
      </Demo>
      <div className="grid gap-4 md:grid-cols-2">
        {ROADMAP.map(([title, items], gi) => (
          <Demo key={title} title={t(`lab1.road.g${gi}.t`, title)}>
            <ul className="space-y-2">
              {items.map(([a, b], ii) => {
                const k = `c${id++}`;
                return (
                  <li key={k}>
                    <label className="flex cursor-pointer items-start gap-2.5">
                      <input type="checkbox" className="mt-1 h-4 w-4 accent-brand" checked={!!ticked[k]} onChange={(e) => toggle(k, e.target.checked)} />
                      <span className="text-sm">{t(`lab1.road.g${gi}.i${ii}.a`, a)}<small className="block text-xs text-muted">{t(`lab1.road.g${gi}.i${ii}.b`, b)}</small></span>
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
