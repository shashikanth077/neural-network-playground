import { useMemo, useState } from "react";
import { Callout, Demo, Seg } from "../../ui";
import { useR, useTx } from "../rich";
import { attention, meanMaps, randomScores, saturation, scoreSpread, softmax, type Mat } from "../transformerMath";
import { Bar, DemoHead, decodeSet, Heat, NumCell, P, useRecordedAttention } from "./shared";

const DEF_Q: Mat = [[1, 0], [0.5, 1], [-1, 0.5]];
const DEF_K: Mat = [[1, 1], [0, 2], [-1, 0]];
const DEF_V: Mat = [[1, 0], [0, 1], [3, -1]];
const DKS = [2, 4, 8, 16, 32, 64, 128, 256, 512];
const NAMES = ["t1", "t2", "t3"];

function MatEdit({ name, m, set }: { name: string; m: Mat; set: (m: Mat) => void }) {
  return (
    <div>
      <p className="mb-1 text-center font-mono text-sm font-bold text-brand">{name}</p>
      <table className="mx-auto border-separate border-spacing-1">
        <tbody>
          {m.map((row, i) => (
            <tr key={i}>
              <th scope="row" className="pr-1 text-right font-mono text-[11px] font-medium text-muted">{NAMES[i]}</th>
              {row.map((v, j) => (
                <td key={j}><NumCell label={`${name} ${NAMES[i]}, ${j + 1}`} value={v} onChange={(x) => set(m.map((r, a) => r.map((y, b) => (a === i && b === j ? x : y))))} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Editable() {
  const r = useR();
  const tx = useTx();
  const [Q, setQ] = useState<Mat>(DEF_Q);
  const [K, setK] = useState<Mat>(DEF_K);
  const [V, setV] = useState<Mat>(DEF_V);
  const [scaled, setScaled] = useState<"yes" | "no">("yes");
  const res = useMemo(() => attention(Q, K, V, scaled === "yes"), [Q, K, V, scaled]);
  const reset = () => { setQ(DEF_Q); setK(DEF_K); setV(DEF_V); };
  const maxRaw = Math.max(1, ...res.scores.flat().map(Math.abs));
  return (
    <Demo>
      <DemoHead title={tx("lab3.t.at.edit.title")} tags={["toy", "recomputed"]} />
      <P k="lab3.t.at.edit.hint" />
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        <MatEdit name="Q" m={Q} set={setQ} />
        <MatEdit name="K" m={K} set={setK} />
        <MatEdit name="V" m={V} set={setV} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Seg<"yes" | "no">
          label={tx("lab3.t.at.edit.scale")}
          value={scaled}
          onChange={setScaled}
          options={[{ value: "yes", label: tx("lab3.t.at.edit.scaleYes") }, { value: "no", label: tx("lab3.t.at.edit.scaleNo") }]}
        />
        <button type="button" className="btn-ghost !py-1.5 !text-sm" onClick={reset}>{tx("lab3.t.sh.reset")}</button>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div>
          <p className="mb-1 text-xs font-semibold text-muted">{tx("lab3.t.at.edit.scores", { f: scaled === "yes" ? "Q·Kᵀ / √2" : "Q·Kᵀ" })}</p>
          <Heat values={res.scores} rowLabels={NAMES} colLabels={NAMES} signed max={maxRaw} label={tx("lab3.t.at.edit.scores", { f: "" })} cell="h-8 w-12" />
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-muted">{tx("lab3.t.at.edit.weights")}</p>
          <Heat values={res.weights} rowLabels={NAMES} colLabels={NAMES} label={tx("lab3.t.at.edit.weights")} cell="h-8 w-12" />
          <p className="mt-1 font-mono text-[11px] text-muted">{tx("lab3.t.at.edit.rowsum")}: {res.weights.map((w) => w.reduce((a, b) => a + b, 0).toFixed(2)).join(" · ")}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-muted">{tx("lab3.t.at.edit.out")}</p>
          <Heat values={res.output} rowLabels={NAMES} colLabels={["1", "2"]} signed max={Math.max(1, ...res.output.flat().map(Math.abs))} label={tx("lab3.t.at.edit.out")} cell="h-8 w-14" />
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed" aria-live="polite">{r("lab3.t.at.edit.read", { t: NAMES[res.weights[0].indexOf(Math.max(...res.weights[0]))], w: Math.round(Math.max(...res.weights[0]) * 100) })}</p>
    </Demo>
  );
}

function Scaling() {
  const r = useR();
  const tx = useTx();
  const [ix, setIx] = useState(5);
  const [seed, setSeed] = useState(3);
  const dk = DKS[ix];
  const n = 8;
  const raw = useMemo(() => randomScores(dk, n, seed), [dk, seed]);
  const sc = useMemo(() => softmax(raw.map((v) => v / Math.sqrt(dk))), [raw, dk]);
  const un = useMemo(() => softmax(raw), [raw]);
  const sat = useMemo(() => saturation(dk, n, seed), [dk, seed]);
  const spread = useMemo(() => scoreSpread(dk, seed), [dk, seed]);
  return (
    <Demo>
      <DemoHead title={tx("lab3.t.at.sat.title")} tags={["recomputed", "toy"]} />
      <P k="lab3.t.at.sat.hint" />
      <div className="mt-3 flex flex-wrap items-end gap-4">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="sat-dk" className="flex items-baseline justify-between text-xs font-medium text-muted">
            <span>d<sub>k</sub></span><output htmlFor="sat-dk" className="font-mono text-sm text-ink">{dk}</output>
          </label>
          <input id="sat-dk" type="range" min={0} max={DKS.length - 1} step={1} value={ix} onChange={(e) => setIx(Number(e.target.value))} className="mt-1 w-full accent-brand" aria-valuetext={String(dk)} />
        </div>
        <button type="button" className="btn-ghost !py-1.5 !text-sm" onClick={() => setSeed((s) => s + 1)}>{tx("lab3.t.sh.newDraw")}</button>
      </div>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted">{tx("lab3.t.at.sat.without")}</p>
          {un.map((v, i) => <Bar key={i} label={`k${i + 1}`} value={v} max={1} text={(v * 100).toFixed(1) + " %"} tone="bg-bad" />)}
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted">{tx("lab3.t.at.sat.with")}</p>
          {sc.map((v, i) => <Bar key={i} label={`k${i + 1}`} value={v} max={1} text={(v * 100).toFixed(1) + " %"} tone="bg-ok" />)}
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed" aria-live="polite" data-testid="at-sat">
        {r("lab3.t.at.sat.read", { dk, sd: spread.toFixed(1), root: Math.sqrt(dk).toFixed(1), un: (sat.unscaled * 100).toFixed(0), sc: (sat.scaled * 100).toFixed(0) })}
      </p>
      <p className="mt-1 text-xs text-muted">{r("lab3.t.at.sat.note")}</p>
    </Demo>
  );
}

function Real() {
  const r = useR();
  const tx = useTx();
  const sets = useRecordedAttention();
  const [id, setId] = useState("paper");
  const [layer, setLayer] = useState(5);
  const [head, setHead] = useState<number | "mean">("mean");
  const [row, setRow] = useState(5);
  const set = sets?.find((s) => s.id === id) ?? sets?.[0];
  const dec = useMemo(() => (set ? decodeSet(set) : null), [set]);
  if (!sets || !set || !dec) return <Demo><p className="text-sm text-muted">{tx("lab3.t.sh.loading")}</p></Demo>;
  const n = set.tokens.length;
  const map = head === "mean" ? meanMaps(dec[layer]) : dec[layer][head];
  const ri = Math.min(row, n - 1);
  const top = map[ri].map((v, j) => ({ j, v })).sort((a, b) => b.v - a.v).slice(0, 3);
  const received = set.tokens.map((_, j) => map.reduce((s, rr) => s + rr[j], 0) / n);
  const recTop = received.map((v, j) => ({ j, v })).sort((a, b) => b.v - a.v).slice(0, 2);
  const showVals = n <= 13;
  return (
    <Demo>
      <DemoHead title={tx("lab3.t.at.real.title")} tags={["recorded"]} />
      <P k="lab3.t.at.real.hint" vars={{ model: set.model }} />
      <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="at-sent" className="text-xs font-medium text-muted">{tx("lab3.t.at.real.sentence")}</label>
          <select id="at-sent" className="field mt-1" value={set.id} onChange={(e) => { setId(e.target.value); setRow(5); }}>
            {sets.map((s) => <option key={s.id} value={s.id}>{s.text}</option>)}
          </select>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">{tx("lab3.t.at.real.layer")}</p>
          <Seg<string>
            label={tx("lab3.t.at.real.layer")}
            value={String(layer)}
            onChange={(v) => setLayer(Number(v))}
            options={Array.from({ length: set.layers }, (_, i) => ({ value: String(i), label: String(i + 1) }))}
          />
        </div>
        <div>
          <label htmlFor="at-head" className="text-xs font-medium text-muted">{tx("lab3.t.at.real.head")}</label>
          <select id="at-head" className="field mt-1 !w-auto" value={String(head)} onChange={(e) => setHead(e.target.value === "mean" ? "mean" : Number(e.target.value))}>
            <option value="mean">{tx("lab3.t.at.real.mean")}</option>
            {Array.from({ length: set.heads }, (_, h) => <option key={h} value={h}>{h + 1}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-3">
        <Heat
          values={map}
          rowLabels={set.tokens}
          colLabels={set.tokens}
          showValues={showVals}
          digits={2}
          cell="h-7 w-9 text-[10px]"
          label={tx("lab3.t.at.real.title")}
          onRow={setRow}
          onCell={(i) => setRow(i)}
          activeRow={ri}
          small
        />
      </div>
      <div className="mt-3 rounded-xl border border-line bg-raised/70 px-3 py-2 text-sm leading-relaxed" role="status" aria-live="polite" data-testid="at-real">
        <p>{r("lab3.t.at.real.row", { tok: set.tokens[ri], a: set.tokens[top[0].j], pa: Math.round(top[0].v * 100), b: set.tokens[top[1].j], pb: Math.round(top[1].v * 100), c: set.tokens[top[2].j], pc: Math.round(top[2].v * 100) })}</p>
        <p className="mt-1 text-muted">{r("lab3.t.at.real.sink", { a: set.tokens[recTop[0].j], pa: Math.round(recTop[0].v * 100), b: set.tokens[recTop[1].j], pb: Math.round(recTop[1].v * 100) })}</p>
        <p className="mt-1 text-muted">{set.pPos !== null ? r("lab3.t.at.real.pred", { p: set.pPos.toFixed(4) }) : r("lab3.t.at.real.nopred")}</p>
      </div>
      <Callout tone="warn" title={tx("lab3.t.at.real.caution.title")}>{r("lab3.t.at.real.caution")}</Callout>
    </Demo>
  );
}

export default function Attention() {
  const r = useR();
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <P k="lab3.t.at.lead1" />
        <div className="rounded-lg border border-line bg-raised/60 p-2 text-center font-mono text-xs leading-relaxed sm:text-sm">Attention(Q, K, V) = softmax( Q·Kᵀ / √d<sub>k</sub> ) · V</div>
        <p className="text-sm leading-relaxed text-muted">{r("lab3.t.at.lead2")}</p>
      </div>
      <Editable />
      <Scaling />
      <Real />
    </div>
  );
}
