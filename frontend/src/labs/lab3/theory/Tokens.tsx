import { useMemo, useState } from "react";
import { Demo } from "../../ui";
import { RECORDED } from "../data/theoryRecorded";
import { useR, useTx } from "../rich";
import { BERT_SMALL, BERT_TINY, DISTILBERT, paramBreakdown, paramTotal, TOY_VOCAB, tokenizeToy, toyEmbeddings } from "../transformerMath";
import { DemoHead, fmtInt, Heat, P } from "./shared";

const SPECIAL = ["[PAD]", "[UNK]", "[CLS]", "[SEP]"];
const D = 4;
const MODELS = [["BERT-tiny", BERT_TINY], ["BERT-small", BERT_SMALL], ["DistilBERT", DISTILBERT]] as const;

export default function Tokens() {
  const r = useR();
  const tx = useTx();
  const [word, setWord] = useState(0);
  const [text, setText] = useState("The plot was not unwatchable, but the acting was brilliant!");
  const [seed, setSeed] = useState(7);
  const toks = useMemo(() => tokenizeToy(text, TOY_VOCAB), [text]);
  const idOf = (t: string) => { const i = SPECIAL.indexOf(t); return i >= 0 ? i : TOY_VOCAB.indexOf(t) + SPECIAL.length; };
  const emb = useMemo(() => toyEmbeddings(toks, D, seed), [toks, seed]);
  const rec = RECORDED.tokenisation[word];
  const unk = toks.filter((t) => t === "[UNK]").length;

  return (
    <div className="space-y-5">
      <P k="lab3.t.tk.lead" />

      <Demo>
        <DemoHead title={tx("lab3.t.tk.rec.title")} tags={["recorded"]} />
        <P k="lab3.t.tk.rec.hint" />
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={tx("lab3.t.tk.rec.title")}>
          {RECORDED.tokenisation.map((w, i) => (
            <button key={w.word} type="button" aria-pressed={i === word} onClick={() => setWord(i)} className={`rounded-lg border px-2.5 py-1 font-mono text-sm ${i === word ? "border-brand bg-brand/10 text-brand" : "border-line bg-raised/60"}`}>{w.word}</button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-live="polite" data-testid="tk-rec">
          <span className="font-mono text-sm text-muted">{rec.word} →</span>
          {rec.pieces.map((p, i) => <span key={i} className="rounded-md border border-brand/50 bg-brand/10 px-2 py-0.5 font-mono text-sm">{p}</span>)}
          <span className="text-xs text-muted">({tx("lab3.t.tk.rec.count", { n: rec.pieces.length })})</span>
        </div>
        <p className="mt-2 text-xs text-muted">{r("lab3.t.tk.rec.note")}</p>
      </Demo>

      <Demo>
        <DemoHead title={tx("lab3.t.tk.toy.title")} tags={["toy", "recomputed"]} />
        <P k="lab3.t.tk.toy.hint" />
        <label className="mt-3 block text-xs font-medium text-muted" htmlFor="tk-text">{tx("lab3.t.tk.toy.input")}</label>
        <input id="tk-text" className="field mt-1 font-mono" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="mt-3 flex flex-wrap gap-1.5" aria-live="polite" data-testid="tk-toy">
          {toks.map((t, i) => {
            const special = t === "[CLS]" || t === "[SEP]";
            const bad = t === "[UNK]";
            return (
              <span key={i} className={`rounded-md border px-2 py-0.5 text-center font-mono text-sm ${bad ? "border-c-amber bg-c-amber/10" : special ? "border-ok/60 bg-ok/10" : t.startsWith("##") ? "border-brand/50 bg-brand/10" : "border-line bg-raised"}`}>
                {t}<span className="block text-[10px] text-muted">id {idOf(t)}</span>
              </span>
            );
          })}
        </div>
        <p className="mt-2 text-sm" aria-live="polite">{r("lab3.t.tk.toy.stats", { n: toks.length, u: unk })}</p>
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer text-brand">{tx("lab3.t.tk.toy.vocab", { n: TOY_VOCAB.length + SPECIAL.length })}</summary>
          <p className="mt-1 break-words font-mono text-xs text-muted">{[...SPECIAL, ...TOY_VOCAB].join("  ")}</p>
        </details>
        <p className="mt-2 text-xs text-muted">{r("lab3.t.tk.toy.note")}</p>
      </Demo>

      <Demo>
        <DemoHead title={tx("lab3.t.tk.emb.title")} tags={["toy", "recomputed"]} />
        <P k="lab3.t.tk.emb.hint" />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" className="btn-ghost !py-1.5 !text-sm" onClick={() => setSeed((s) => s + 1)}>{tx("lab3.t.sh.newDraw")}</button>
          <span className="font-mono text-xs text-muted">{r("lab3.t.tk.emb.shape", { n: toks.length, d: D })}</span>
        </div>
        <div className="mt-3">
          <Heat values={emb} rowLabels={toks} colLabels={Array.from({ length: D }, (_, i) => `d${i + 1}`)} signed digits={2} label={tx("lab3.t.tk.emb.title")} cell="h-7 w-12" />
        </div>
        <p className="mt-2 text-xs text-muted">{r("lab3.t.tk.emb.note")}</p>
      </Demo>

      <Demo>
        <DemoHead title={tx("lab3.t.tk.size.title")} tags={["recomputed"]} />
        <P k="lab3.t.tk.size.hint" />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[26rem] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="py-1.5 font-medium">{tx("lab3.t.tk.size.model")}</th>
                <th className="text-right font-medium">V × d</th>
                <th className="text-right font-medium">{tx("lab3.t.tk.size.table")}</th>
                <th className="text-right font-medium">{tx("lab3.t.tk.size.share")}</th>
              </tr>
            </thead>
            <tbody>
              {MODELS.map(([name, c]) => {
                const word = paramBreakdown(c).find((p) => p.id === "word")!.count;
                return (
                  <tr key={name} className="border-b border-line/60">
                    <td className="py-1.5 font-medium">{name}</td>
                    <td className="text-right font-mono text-xs">{fmtInt(c.vocab)} × {c.d}</td>
                    <td className="text-right font-mono">{fmtInt(word)}</td>
                    <td className="text-right font-mono font-semibold">{((word / paramTotal(c)) * 100).toFixed(1)} %</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Demo>
    </div>
  );
}
