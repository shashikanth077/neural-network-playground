import { useState } from "react";
import { Callout, Demo, f2 } from "../../ui";
import { embedValues, hashId, oneHotOnes, wordsOf } from "../math";
import { useR, useTx } from "../rich";

const DEFAULT = "this movie was wonderful and the acting was great";

export default function TextEncoding() {
  const r = useR();
  const tx = useTx();
  const [text, setText] = useState(DEFAULT);
  const words = wordsOf(text);
  const ids = words.map(hashId);
  const ones = oneHotOnes(ids);
  const bucket = new Set(ids.map((v) => Math.floor(v / 100)));

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{r("lab2.txt.lead")}</p>
      <Demo title={tx("lab2.txt.title")}>
        <label className="block text-xs font-medium text-muted" htmlFor="txt-input">{tx("lab2.txt.input")}</label>
        <input id="txt-input" value={text} onChange={(e) => setText(e.target.value)} className="field mt-1 w-full text-sm" />

        <h3 className="mt-5 text-sm font-semibold">{tx("lab2.txt.numbers")}</h3>
        <div className="mt-2 flex flex-wrap gap-2" data-testid="word-numbers">
          {words.length === 0 && <span className="text-sm text-muted">{tx("lab2.txt.none")}</span>}
          {words.map((w, i) => (
            <span key={i} className="rounded-full border border-line bg-raised px-2.5 py-0.5 font-mono text-xs">
              {w} → {ids[i]}
            </span>
          ))}
        </div>

        <h3 className="mt-5 text-sm font-semibold">{tx("lab2.txt.onehot")}</h3>
        <p className="mt-1 text-sm text-muted" role="status">
          {tx("lab2.txt.onehotText", { ones, zeros: (10000 - ones).toLocaleString("en-US") })}
        </p>
        <div className="mt-2 flex h-3.5 max-w-xl overflow-hidden rounded border border-line" aria-hidden>
          {Array.from({ length: 100 }, (_, i) => (
            <div key={i} className="flex-1" style={{ background: bucket.has(i) ? "rgb(var(--accent))" : "transparent" }} />
          ))}
        </div>

        <h3 className="mt-5 text-sm font-semibold">{tx("lab2.txt.embed")}</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr>
                {["lab2.txt.pos", "lab2.txt.word", "lab2.txt.number", "lab2.txt.vector"].map((h) => (
                  <th key={h} scope="col" className="border-b border-line px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">{tx(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {words.map((w, i) => (
                <tr key={i}>
                  <td className="border-b border-line px-2 py-1.5">{i + 1}</td>
                  <td className="border-b border-line px-2 py-1.5">{w}</td>
                  <td className="border-b border-line px-2 py-1.5 font-mono">{ids[i]}</td>
                  <td className="border-b border-line px-2 py-1.5 font-mono">[{embedValues(ids[i]).map((v) => f2(v)).join(", ")}]</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">{tx("lab2.txt.shape", { n: words.length })}</p>
      </Demo>
      <Callout title={tx("lab2.txt.why.title")}>{r("lab2.txt.why.body")}</Callout>
    </div>
  );
}
