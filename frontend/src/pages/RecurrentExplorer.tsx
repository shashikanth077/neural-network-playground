import { useMemo, useState } from "react";
import { gruParams, lstmParams, rnnParams } from "../cheatsheets/calc";
import { useT } from "../i18n";
import { makeWeights, unroll, type CellKind } from "../explorers/rnn";

const KINDS: { id: CellKind; label: string }[] = [
  { id: "rnn", label: "SimpleRNN" },
  { id: "lstm", label: "LSTM" },
  { id: "gru", label: "GRU" },
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
  const t = useT();
  const [kind, setKind] = useState<CellKind>("lstm");
  const [units, setUnits] = useState(3);
  const [xs, setXs] = useState<number[]>([1, 0, 0, 0, 0]);
  const [seed, setSeed] = useState(7);

  const weights = useMemo(() => makeWeights(kind, 1, units, seed), [kind, units, seed]);
  const trace = useMemo(() => unroll(kind, weights, xs.map((x) => [x]), units), [kind, weights, xs, units]);
  const params = { rnn: rnnParams(1, units), lstm: lstmParams(1, units), gru: gruParams(1, units) }[kind];

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10">
      <p className="font-mono text-sm text-brand">{t("ex.eyebrow")}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{t("rc.title")}</h1>
      <p className="mt-2 max-w-3xl text-muted">
        {t("rc.intro")}
      </p>

      <section className="card mt-6 p-5" aria-label={t("ex.controls")}>
        <div role="tablist" aria-label={t("rc.cellType")} className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <button key={k.id} role="tab" aria-selected={kind === k.id} onClick={() => setKind(k.id)} className={kind === k.id ? "btn-primary" : "btn-ghost"}>{k.label}</button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">{t(`rc.blurb.${kind}`)}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">{t("rc.units", undefined, { n: units })}</span>
            <input type="range" min={1} max={5} value={units} onChange={(e) => setUnits(Number(e.target.value))} className="w-full" aria-label={t("rc.unitsLabel")} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">{t("rc.seqLen", undefined, { n: xs.length })}</span>
            <input
              type="range" min={2} max={8} value={xs.length} aria-label={t("rc.seqLenLabel")}
              onChange={(e) => { const n = Number(e.target.value); setXs((x) => Array.from({ length: n }, (_, i) => x[i] ?? 0)); }}
              className="w-full"
            />
          </label>
          <div className="flex items-end gap-2">
            <button className="btn-ghost" onClick={() => setSeed((s) => s + 1)}>{t("rc.newWeights")}</button>
            <button className="btn-ghost" onClick={() => setXs((x) => x.map((_, i) => (i === 0 ? 1 : 0)))}>{t("rc.resetInput")}</button>
          </div>
        </div>
        <p className="mt-3 text-sm" data-testid="param-count">
          {t("rc.params", undefined, { n: units })} <span className="font-mono font-semibold">{params}</span>
          <span className="text-muted"> ({kind === "rnn" ? "units·(inputs+units)+units" : kind === "lstm" ? "4 × (units·(inputs+units)+units)" : "3 × (units·(inputs+units)+2·units), Keras reset_after"})</span>
        </p>
      </section>

      <section className="card mt-6 overflow-x-auto p-5" aria-labelledby="trace-h">
        <h2 id="trace-h" className="text-lg font-bold tracking-tight">{t("rc.step.title")}</h2>
        <table className="mt-3 w-full min-w-[34rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="py-1.5">t</th><th>{t("rc.col.input")}</th><th>{t("rc.col.hidden")}</th>
              {kind === "lstm" && <th>{t("rc.col.cell")}</th>}
              {kind !== "rnn" && <th>{t("rc.col.gates")}</th>}
            </tr>
          </thead>
          <tbody>
            {trace.steps.map((s, ti) => (
              <tr key={ti} className="border-b border-line/60 align-top">
                <td className="py-2 font-mono">{ti + 1}</td>
                <td>
                  <input type="number" step={0.5} value={xs[ti]} aria-label={t("rc.inputAt", undefined, { n: ti + 1 })}
                    onChange={(e) => setXs((x) => x.map((v, i) => (i === ti ? Number(e.target.value) || 0 : v)))}
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
                        <div key={name} className="font-mono text-xs"><span className="inline-block w-20 text-muted">{t(`rc.gate.${name}`, name)}</span><Bar v={avg} gate={isGate && name !== "candidate"} /> {fmt(avg)}</div>
                      );
                    })}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-muted">{t("rc.note")}</p>
      </section>
    </main>
  );
}
