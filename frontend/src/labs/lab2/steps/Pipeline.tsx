import { useState } from "react";
import { Callout, Demo, Out } from "../../ui";
import { useR, useTx } from "../rich";

/** The ten blocks of the lab, in the order of the script (keys: lab2.pipe.f<i>.t / .d). */
const FLOW = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function Pipeline() {
  const r = useR();
  const tx = useTx();
  const [sel, setSel] = useState(0);
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{r("lab2.pipe.lead")}</p>
      <Demo title={tx("lab2.pipe.title")}>
        <p className="mb-3 text-sm text-muted">{r("lab2.pipe.hint")}</p>
        <div role="group" aria-label={tx("lab2.pipe.title")} className="flex flex-wrap gap-2">
          {FLOW.map((i) => (
            <button
              key={i}
              type="button"
              aria-pressed={sel === i}
              onClick={() => setSel(i)}
              className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                sel === i ? "border-brand bg-brand/10 text-brand" : "border-line bg-surface text-muted hover:text-ink"
              }`}
            >
              <b className="block">{i + 1}. {tx(`lab2.pipe.f${i}.t`)}</b>
            </button>
          ))}
        </div>
        <Out>{r(`lab2.pipe.f${sel}.d`)}</Out>
      </Demo>
      <Callout title={tx("lab2.pipe.why.title")}>{r("lab2.pipe.why.body")}</Callout>
    </div>
  );
}
