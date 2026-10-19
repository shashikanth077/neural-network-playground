import { useMemo, useState } from "react";
import { gruParams, lstmParams, rnnParams } from "../cheatsheets/calc";
import { makeWeights, unroll, type CellKind } from "../explorers/rnn";

const KINDS: { id: CellKind; label: string; blurb: string }[] = [
  { id: "rnn", label: "SimpleRNN", blurb: "h_t = tanh(W x_t + U h_{t-1} + b). One state, rewritten every step, so early inputs fade." },
  { id: "lstm", label: "LSTM", blurb: "Gates decide what to forget, write and show. The cell state c_t carries information with little change." },
  { id: "gru", label: "GRU", blurb: "Reset and update gates, one state. h_t = (1 − z) ⊙ h_{t-1} + z ⊙ h̃_t." },
];

const fmt = (v: number) => v.toFixed(2);

/** Bar from -1..1 (centre line) or 0..1 for gates. */
function Bar({ v, gate }: { v: number; gate?: boolean }) {
  const pct = gate ? v * 100 : Math.abs(v) * 50;
  return (
    <span className="relative inline-block h-3 w-16 overflow-hidden rounded bg-raised align-middle" aria-hidden>
      <span
        className="absolute top-0 h-full"
        style={{ background: `rgb(var(${v < 0 ? "--bad" : "--brand"}))`, width: `${pct}%`, left: gate || v >= 0 ? (gate ? 0 : "50%") : `${50 - pct}%` }}
      />
    </span>
  );
}

export function RecurrentExplorer() {
  const [kind, setKind] = useState<CellKind>("lstm");
  const [units, setUnits] = useState(3);
  const [xs, setXs] = useState<number[]>([1, 0, 0, 0, 0]);
  const [seed, setSeed] = useState(7);

  const weights = useMemo(() => makeWeights(kind, 1, units, seed), [kind, units, seed]);
  const trace = useMemo(() => unroll(kind, weights, xs.map((x) => [x]), units), [kind, weights, xs, units]);
  const params = { rnn: rnnParams(1, units), lstm: lstmParams(1, units), gru: gruParams(1, units) }[kind];
  const info = KINDS.find((k) => k.id === kind)!;

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10">
      <p className="font-mono text-sm text-brand">AI Lab · Tool · Deep Learning</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Recurrent Cell Explorer</h1>
      <p className="mt-2 max-w-3xl text-muted">
        Feed a short sequence through a SimpleRNN, LSTM or GRU cell with fixed random weights and watch the state and the gates at every step.
        Try a single 1 followed by zeros: how long does each cell remember it? Runs in your browser; the RNN and LSTM maths is checked against PyTorch.
      </p>

      <section className="card mt-6 p-5" aria-label="Controls">
        <div role="tablist" aria-label="Cell type" className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <button key={k.id} role="tab" aria-selected={kind === k.id} onClick={() => setKind(k.id)} className={kind === k.id ? "btn-primary" : "btn-ghost"}>{k.label}</button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">{info.blurb}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Units: {units}</span>
            <input type="range" min={1} max={5} value={units} onChange={(e) => setUnits(Number(e.target.value))} className="w-full" aria-label="Units" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Sequence length: {xs.length}</span>
            <input
              type="range" min={2} max={8} value={xs.length} aria-label="Sequence length"
              onChange={(e) => { const n = Number(e.target.value); setXs((x) => Array.from({ length: n }, (_, i) => x[i] ?? 0)); }}
              className="w-full"
            />
          </label>
          <div className="flex items-end gap-2">
            <button className="btn-ghost" onClick={() => setSeed((s) => s + 1)}>New random weights</button>
            <button className="btn-ghost" onClick={() => setXs((x) => x.map((_, i) => (i === 0 ? 1 : 0)))}>Reset input</button>
          </div>
        </div>
        <p className="mt-3 text-sm" data-testid="param-count">
          Trainable parameters with 1 input and {units} unit{units > 1 ? "s" : ""}: <span className="font-mono font-semibold">{params}</span>
          <span className="text-muted"> ({kind === "rnn" ? "units·(inputs+units)+units" : kind === "lstm" ? "4 × (units·(inputs+units)+units)" : "3 × (units·(inputs+units)+2·units), Keras reset_after"})</span>
        </p>
      </section>

      <section className="card mt-6 overflow-x-auto p-5" aria-labelledby="trace-h">
        <h2 id="trace-h" className="text-lg font-bold tracking-tight">Step by step</h2>
        <table className="mt-3 w-full min-w-[34rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="py-1.5">t</th><th>Input x</th><th>Hidden state h</th>
              {kind === "lstm" && <th>Cell state c</th>}
              {kind !== "rnn" && <th>Gates (avg over units)</th>}
            </tr>
          </thead>
          <tbody>
            {trace.steps.map((s, t) => (
              <tr key={t} className="border-b border-line/60 align-top">
                <td className="py-2 font-mono">{t + 1}</td>
                <td>
                  <input type="number" step={0.5} value={xs[t]} aria-label={`Input at step ${t + 1}`}
                    onChange={(e) => setXs((x) => x.map((v, i) => (i === t ? Number(e.target.value) || 0 : v)))}
                    className="w-16 rounded border border-line bg-surface px-1.5 py-0.5 font-mono" />
                </td>
                <td>{s.h.map((v, i) => <div key={i} className="font-mono text-xs"><Bar v={v} /> {fmt(v)}</div>)}</td>
                {kind === "lstm" && <td>{s.c!.map((v, i) => <div key={i} className="font-mono text-xs">{fmt(v)}</div>)}</td>}
                {kind !== "rnn" && (
                  <td>
                    {Object.entries(s.gates).map(([name, vals]) => {
                      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                      const isGate = name !== "candidate";
                      return (
                        <div key={name} className="font-mono text-xs"><span className="inline-block w-20 text-muted">{name}</span><Bar v={avg} gate={isGate && name !== "candidate"} /> {fmt(avg)}</div>
                      );
                    })}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-muted">Gate values are between 0 (closed) and 1 (open). Hidden and candidate values are between −1 and 1.</p>
      </section>
    </main>
  );
}
