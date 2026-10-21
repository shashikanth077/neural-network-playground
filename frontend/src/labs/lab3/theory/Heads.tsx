import { useMemo, useState } from "react";
import { Demo, Seg } from "../../ui";
import { useR, useTx } from "../rich";
import { BERT_SMALL, BERT_TINY, DISTILBERT, multiHead, paramTotal, toyEmbeddings, toyMultiHeadWeights, type Mat } from "../transformerMath";
import { Bar, DemoHead, decodeSet, Heat, fmtInt, n2, P, useRecordedAttention } from "./shared";

const WORDS = ["not", "good", "but", "great"];
const D = 8;
const HEAD_COLORS = ["--brand", "--c-teal", "--c-amber", "--c-purple", "--neg", "--ok", "--pos", "--bad"];

function Toy() {
  const r = useR();
  const tx = useTx();
  const [h, setH] = useState(2);
  const [tok, setTok] = useState(1);
  const dk = D / h;
  const H = useMemo(() => toyEmbeddings(WORDS, D, 5), []);
  const w = useMemo(() => toyMultiHeadWeights(D, h, 21), [h]);
  const res = useMemo(() => multiHead(H, w.heads, w.Wo), [H, w]);
  return (
    <Demo>
      <DemoHead title={tx("lab3.t.hd.toy.title")} tags={["toy", "recomputed"]} />
      <P k="lab3.t.hd.toy.hint" />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div>
          <p className="mb-1 text-xs font-medium text-muted">{tx("lab3.t.hd.toy.h")}</p>
          <Seg<string>
            label={tx("lab3.t.hd.toy.h")}
            value={String(h)}
            onChange={(v) => setH(Number(v))}
            options={[1, 2, 4, 8].map((x) => ({ value: String(x), label: String(x) }))}
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-muted">{tx("lab3.t.hd.toy.token")}</p>
          <Seg<string> label={tx("lab3.t.hd.toy.token")} value={String(tok)} onChange={(v) => setTok(Number(v))} options={WORDS.map((x, i) => ({ value: String(i), label: x }))} />
        </div>
      </div>
      <p className="mt-3 rounded-lg border border-line bg-raised/60 p-2 text-center font-mono text-sm" aria-live="polite" data-testid="hd-eq">{tx("lab3.t.hd.toy.eq", { d: D, h, dk })}</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {res.heads.map((hd, i) => (
          <div key={i} className="min-w-0 rounded-xl border border-line p-2" style={{ borderTopColor: `rgb(var(${HEAD_COLORS[i]}))`, borderTopWidth: 4 }}>
            <p className="mb-1 text-xs font-semibold">{tx("lab3.t.hd.toy.head", { i: i + 1 })}</p>
            <Heat values={hd.weights} rowLabels={WORDS} colLabels={WORDS} cell="h-6 w-7 text-[10px]" digits={1} label={tx("lab3.t.hd.toy.head", { i: i + 1 })} small />
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <p className="text-xs font-semibold text-muted">{tx("lab3.t.hd.toy.concat", { t: WORDS[tok], d: D })}</p>
        <div className="flex flex-wrap items-center gap-1 font-mono text-xs" aria-live="polite" data-testid="hd-concat">
          {res.heads.map((hd, i) => (
            <span key={i} className="inline-flex rounded-lg border px-1.5 py-1" style={{ borderColor: `rgb(var(${HEAD_COLORS[i]}))` }}>
              {hd.output[tok].map((v) => n2(v, 2)).join(" ")}
            </span>
          ))}
        </div>
        <p className="text-xs font-semibold text-muted">{tx("lab3.t.hd.toy.wo", { d: D })}</p>
        <p className="break-words font-mono text-xs" data-testid="hd-out">[{res.output[tok].map((v) => n2(v, 2)).join(", ")}]</p>
      </div>
      <p className="mt-3 text-xs text-muted">{r("lab3.t.hd.toy.note")}</p>
    </Demo>
  );
}

const CATS = ["self", "prev", "next", "sink"] as const;

function headStats(map: Mat, tokens: string[]) {
  const n = map.length;
  const isSink = (j: number) => ["[CLS]", "[SEP]", ",", ".", "!", "?"].includes(tokens[j]);
  const out = { self: 0, prev: 0, next: 0, sink: 0 };
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const v = map[i][j] / n;
    if (i === j) out.self += v;
    if (j === i - 1) out.prev += v;
    if (j === i + 1) out.next += v;
    if (isSink(j)) out.sink += v;
  }
  return out;
}

function MiniMap({ map }: { map: Mat }) {
  const n = map.length;
  const c = 5;
  return (
    <svg viewBox={`0 0 ${n * c} ${n * c}`} className="block w-full" aria-hidden>
      {map.map((row, i) => row.map((v, j) => <rect key={`${i}-${j}`} x={j * c} y={i * c} width={c} height={c} style={{ fill: "rgb(var(--brand))", opacity: Math.min(1, v * 1.1) }} />))}
    </svg>
  );
}

function Real() {
  const r = useR();
  const tx = useTx();
  const sets = useRecordedAttention();
  const [id, setId] = useState("paper");
  const [layer, setLayer] = useState(5);
  const [head, setHead] = useState(0);
  const set = sets?.find((s) => s.id === id) ?? sets?.[0];
  const dec = useMemo(() => (set ? decodeSet(set) : null), [set]);
  if (!sets || !set || !dec) return <Demo><p className="text-sm text-muted">{tx("lab3.t.sh.loading")}</p></Demo>;
  const maps = dec[layer];
  const st = headStats(maps[head], set.tokens);
  const dominant = CATS.reduce((a, b) => (st[a] >= st[b] ? a : b));
  return (
    <Demo>
      <DemoHead title={tx("lab3.t.hd.real.title")} tags={["recorded", "recomputed"]} />
      <P k="lab3.t.hd.real.hint" vars={{ model: set.model }} />
      <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="hd-sent" className="text-xs font-medium text-muted">{tx("lab3.t.at.real.sentence")}</label>
          <select id="hd-sent" className="field mt-1" value={set.id} onChange={(e) => setId(e.target.value)}>
            {sets.map((s) => <option key={s.id} value={s.id}>{s.text}</option>)}
          </select>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">{tx("lab3.t.at.real.layer")}</p>
          <Seg<string> label={tx("lab3.t.at.real.layer")} value={String(layer)} onChange={(v) => setLayer(Number(v))} options={Array.from({ length: set.layers }, (_, i) => ({ value: String(i), label: String(i + 1) }))} />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6" role="group" aria-label={tx("lab3.t.hd.real.title")}>
        {maps.map((m, h) => (
          <button
            key={h}
            type="button"
            aria-pressed={h === head}
            aria-label={tx("lab3.t.hd.real.pick", { h: h + 1 })}
            onClick={() => setHead(h)}
            className={`min-w-0 rounded-lg border p-1.5 text-left transition ${h === head ? "border-brand ring-2 ring-brand/40" : "border-line hover:bg-raised"}`}
          >
            <MiniMap map={m} />
            <span className="mt-1 block text-center text-[11px] font-medium text-muted">{tx("lab3.t.hd.toy.head", { i: h + 1 })}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-line bg-raised/70 p-3" role="status" aria-live="polite" data-testid="hd-stat">
        <p className="mb-2 text-sm font-semibold">{tx("lab3.t.hd.real.stat", { l: layer + 1, h: head + 1 })}</p>
        <div className="space-y-1.5">
          {CATS.map((c) => <Bar key={c} label={tx(`lab3.t.hd.cat.${c}`)} value={st[c]} max={1} text={`${(st[c] * 100).toFixed(0)} %`} tone={c === dominant ? "bg-brand" : "bg-line"} />)}
        </div>
        <p className="mt-2 text-sm">{r("lab3.t.hd.real.dom", { what: tx(`lab3.t.hd.cat.${dominant}`) })}</p>
      </div>
      <p className="mt-2 text-xs text-muted">{r("lab3.t.hd.real.note")}</p>
    </Demo>
  );
}

export default function Heads() {
  const tx = useTx();
  const r = useR();
  const rows = [["BERT-tiny", BERT_TINY], ["BERT-small", BERT_SMALL], ["DistilBERT", DISTILBERT]] as const;
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <P k="lab3.t.hd.lead" />
        <div className="rounded-lg border border-line bg-raised/60 p-2 text-center font-mono text-xs leading-relaxed sm:text-sm">head<sub>i</sub> = Attention(H·W<sub>Q</sub><sup>i</sup>, H·W<sub>K</sub><sup>i</sup>, H·W<sub>V</sub><sup>i</sup>) &nbsp; MultiHead(H) = Concat(head<sub>1</sub>, …, head<sub>h</sub>)·W<sub>O</sub></div>
      </div>
      <Toy />
      <Real />
      <Demo>
        <DemoHead title={tx("lab3.t.hd.dk.title")} tags={["paper", "recomputed"]} />
        <P k="lab3.t.hd.dk.hint" />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[26rem] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="py-1.5 font-medium">{tx("lab3.t.tk.size.model")}</th>
                <th className="text-right font-medium">d</th>
                <th className="text-right font-medium">h</th>
                <th className="text-right font-medium">d<sub>k</sub> = d / h</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([name, c]) => (
                <tr key={name} className="border-b border-line/60">
                  <td className="py-1.5 font-medium">{name}</td>
                  <td className="text-right font-mono">{c.d}</td>
                  <td className="text-right font-mono">{c.heads}</td>
                  <td className="text-right font-mono font-semibold">{c.d / c.heads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm" aria-live="polite">{r("lab3.t.hd.dk.params", { a: fmtInt(paramTotal(BERT_SMALL)), b: fmtInt(paramTotal({ ...BERT_SMALL, heads: 4 })) })}</p>
      </Demo>
    </div>
  );
}
