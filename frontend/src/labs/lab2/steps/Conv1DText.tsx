import { useState } from "react";
import { Callout, Controls, Demo, Slider } from "../../ui";
import { conv1dWindows, REVIEWS } from "../math";
import { useR, useTx } from "../rich";

export default function Conv1DText() {
  const r = useR();
  const tx = useTx();
  const [k, setK] = useState(3);
  const [rev, setRev] = useState(0);
  const words = REVIEWS[rev];
  const outv = conv1dWindows(words, k);
  const best = Math.max(...outv);
  const bestIdx = outv.indexOf(best);

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{r("lab2.c1.lead")}</p>
      <Demo title={tx("lab2.c1.title")}>
        <Controls>
          <Slider id="c1-k" label={tx("lab2.c1.k")} min={2} max={3} step={1} value={k} onChange={setK} />
          <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs font-medium text-muted">
            {tx("lab2.c1.review")}
            <select className="field !py-1.5 text-sm" value={rev} onChange={(e) => setRev(Number(e.target.value))}>
              {REVIEWS.map((w, i) => <option key={i} value={i}>{w.join(" ")}</option>)}
            </select>
          </label>
        </Controls>
        <div className="flex flex-wrap gap-1.5" aria-label={tx("lab2.c1.words")}>
          {words.map((w, i) => (
            <span key={i} className="rounded-full border border-line bg-raised px-2.5 py-0.5 text-sm">{w}</span>
          ))}
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[340px] text-sm">
            <thead>
              <tr>
                {["lab2.c1.window", "lab2.c1.wordsCol", "lab2.c1.out"].map((h) => (
                  <th key={h} scope="col" className="border-b border-line px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">{tx(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {outv.map((v, i) => (
                <tr key={i} className={i === bestIdx ? "bg-ok/10 font-semibold" : ""}>
                  <td className="border-b border-line px-2 py-1.5">{i + 1}</td>
                  <td className="border-b border-line px-2 py-1.5">{words.slice(i, i + k).join(" ")}</td>
                  <td className="border-b border-line px-2 py-1.5 font-mono">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm" role="status">{tx("lab2.c1.globalMax", { max: best })}</p>
      </Demo>
      <Callout title={tx("lab2.c1.toy.title")}>{r("lab2.c1.toy.body")}</Callout>
    </div>
  );
}
