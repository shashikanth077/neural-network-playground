import { useMemo, useState } from "react";
import { Callout, Demo, f2, Seg } from "../../ui";
import { RNN_INPUTS, RNN_WORDS, runCell } from "../math";
import { useR, useTx } from "../rich";

const W = 420;
const H = 200;
const GATE_NAMES: Record<string, string> = {
  f: "lab2.rnn.gate.f", i: "lab2.rnn.gate.i", o: "lab2.rnn.gate.o", g: "lab2.rnn.gate.g",
  z: "lab2.rnn.gate.z", r: "lab2.rnn.gate.r", n: "lab2.rnn.gate.n",
};
const EQ = {
  LSTM: "f = sigmoid(wf·[x,h] + bf)      forget: keep how much of old c\ni = sigmoid(wi·[x,h] + bi)      input: write how much new info\ng = tanh(wg·[x,h] + bg)         candidate memory\nc = f*c_old + i*g               new cell state\no = sigmoid(wo·[x,h] + bo)      output gate\nh = o*tanh(c)                   new hidden state",
  GRU: "z = sigmoid(wz·[x,h] + bz)      update gate\nr = sigmoid(wr·[x,h] + br)      reset gate\nn = tanh(wn·x + un·(r*h_old))   candidate\nh = (1-z)*n + z*h_old           new hidden state (no separate c)",
} as const;

export default function RnnCell() {
  const r = useR();
  const tx = useTx();
  const [kind, setKind] = useState<"LSTM" | "GRU">("LSTM");
  const [t, setT] = useState(0);
  const run = useMemo(() => runCell(kind), [kind]);
  const shown = run.slice(0, t);
  const last = shown.at(-1);
  const h = last?.state.h ?? 0;
  const c = last?.state.c ?? 0;
  const reset = (k: "LSTM" | "GRU") => { setKind(k); setT(0); };
  const X = (i: number) => 20 + (i * (W - 40)) / (RNN_INPUTS.length - 1);
  const Y = (v: number) => H / 2 - (v * (H / 2 - 15)) / 1.5;
  const line = (key: "h" | "c") => shown.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(p.state[key]).toFixed(1)}`).join("");

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{r("lab2.rnn.lead")}</p>
      <Demo title={tx("lab2.rnn.title")}>
        <div className="flex flex-wrap items-center gap-3">
          <Seg<"LSTM" | "GRU">
            label={tx("lab2.rnn.cell")}
            value={kind}
            onChange={reset}
            options={[{ value: "LSTM", label: "LSTM" }, { value: "GRU", label: "GRU" }]}
          />
          <button type="button" className="btn-primary !py-1.5 !text-sm" onClick={() => setT((x) => Math.min(RNN_INPUTS.length, x + 1))} disabled={t >= RNN_INPUTS.length}>
            {tx("lab2.rnn.next")}
          </button>
          <button type="button" className="btn-ghost !py-1.5 !text-sm" onClick={() => setT(0)}>{tx("lab2.rnn.reset")}</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5" aria-label={tx("lab2.rnn.sequence")}>
          {RNN_INPUTS.map((x, i) => (
            <span
              key={i}
              aria-current={i === t - 1 ? "step" : undefined}
              className={`rounded-full border px-2.5 py-0.5 font-mono text-xs ${i === t - 1 ? "border-brand bg-brand/10 text-brand" : "border-line bg-raised text-muted"}`}
            >
              {RNN_WORDS[i]} (x={x})
            </span>
          ))}
        </div>

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div className="space-y-2" aria-live="polite">
            {last ? (
              Object.entries(last.gates).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 text-sm">
                  <span className="w-36 shrink-0 text-muted">{tx(GATE_NAMES[k])}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-raised" role="img" aria-label={`${tx(GATE_NAMES[k])}: ${f2(v)}`}>
                    <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, Math.abs(v) * 100)}%` }} />
                  </div>
                  <b className="w-12 text-right font-mono">{f2(v)}</b>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">{tx("lab2.rnn.pressNext")}</p>
            )}
            <p className="flex justify-between text-sm"><span className="text-muted">{tx("lab2.rnn.hidden")}</span><b className="font-mono">{h.toFixed(3)}</b></p>
            {kind === "LSTM" && <p className="flex justify-between text-sm"><span className="text-muted">{tx("lab2.rnn.cellState")}</span><b className="font-mono">{c.toFixed(3)}</b></p>}
          </div>
          <div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={tx("lab2.rnn.plotLabel")}>
              <line x1="0" x2={W} y1={H / 2} y2={H / 2} style={{ stroke: "rgb(var(--line))" }} />
              {shown.length > 0 && <path d={line("h")} fill="none" strokeWidth="2" style={{ stroke: "rgb(var(--accent))" }} />}
              {kind === "LSTM" && shown.length > 0 && <path d={line("c")} fill="none" strokeWidth="2" style={{ stroke: "rgb(var(--accent2))" }} />}
              {shown.map((p, i) => (
                <circle key={i} cx={X(i)} cy={Y(p.state.h)} r="3" style={{ fill: "rgb(var(--accent))" }} />
              ))}
            </svg>
            <p className="mt-1 text-xs text-muted">{kind === "LSTM" ? tx("lab2.rnn.legendLstm") : tx("lab2.rnn.legendGru")}</p>
          </div>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-line bg-raised/70 p-3 font-mono text-xs leading-relaxed">{EQ[kind]}</pre>
      </Demo>
      <Callout title={tx("lab2.rnn.toy.title")}>{r("lab2.rnn.toy.body")}</Callout>
    </div>
  );
}
