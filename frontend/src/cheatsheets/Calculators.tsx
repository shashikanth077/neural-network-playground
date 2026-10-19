import { useState } from "react";
import { Callout, Controls, Out } from "../labs/ui";
import { convOut, convParams, denseParams, gruParams, lstmParams, rnnParams, samePad, stepsPerEpoch } from "./calc";

const N = ({ id, label, v, set, min = 1, max = 100000 }: { id: string; label: string; v: number; set: (n: number) => void; min?: number; max?: number }) => (
  <div>
    <label htmlFor={id} className="label">{label}</label>
    <input id={id} type="number" min={min} max={max} className="field w-28" value={v} onChange={(e) => set(Math.min(max, Math.max(min, Math.floor(Number(e.target.value) || min))))} />
  </div>
);
const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-line p-3"><h4 className="mb-2 text-sm font-semibold">{title}</h4>{children}</div>
);

export function Calculators() {
  const [nIn, setIn] = useState(784), [units, setUnits] = useState(100);
  const [w, setW] = useState(28), [f, setF] = useState(3), [s, setS] = useState(1), [p, setP] = useState(1);
  const [cin, setCin] = useState(1), [filters, setFilters] = useState(32);
  const [d, setD] = useState(128), [h, setH] = useState(64);
  const [n, setN] = useState(48000), [b, setB] = useState(32);
  const out = convOut(w, f, s, p);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Dense layer parameters">
        <Controls><N id="c-in" label="Inputs" v={nIn} set={setIn} /><N id="c-units" label="Neurons" v={units} set={setUnits} /></Controls>
        <Out>({nIn} + 1) × {units} = <b>{denseParams(nIn, units).toLocaleString("en")}</b> parameters (the +1 is the bias)</Out>
      </Card>
      <Card title="Updates per epoch">
        <Controls><N id="c-n" label="Training samples" v={n} set={setN} /><N id="c-b" label="Batch size" v={b} set={setB} /></Controls>
        <Out>⌈{n} / {Math.min(b, n)}⌉ = <b>{stepsPerEpoch(n, b).toLocaleString("en")}</b> weight updates per epoch</Out>
      </Card>
      <Card title="Convolution / pooling output size">
        <Controls><N id="c-w" label="Input size W" v={w} set={setW} /><N id="c-f" label="Kernel F" v={f} set={setF} /><N id="c-s" label="Stride S" v={s} set={setS} /><N id="c-p" label="Padding P" v={p} set={setP} min={0} /></Controls>
        <Out>⌊({w} − {f} + 2·{p}) / {s}⌋ + 1 = <b>{out}</b>{out === 0 && " (kernel is larger than the padded input)"} · “same” padding for F = {f} is P = {samePad(f)}</Out>
      </Card>
      <Card title="Conv2D layer parameters">
        <Controls><N id="c-k" label="Kernel F" v={f} set={setF} /><N id="c-cin" label="Input channels" v={cin} set={setCin} /><N id="c-fil" label="Filters" v={filters} set={setFilters} /></Controls>
        <Out>{filters} × ({f}·{f}·{cin} + 1) = <b>{convParams(f, cin, filters).toLocaleString("en")}</b> parameters</Out>
      </Card>
      <div className="md:col-span-2">
        <Card title="Recurrent layer parameters (Keras conventions)">
          <Controls><N id="r-d" label="Input features d" v={d} set={setD} /><N id="r-h" label="Units h" v={h} set={setH} /></Controls>
          <Out>
            SimpleRNN: h(d+h)+h = <b>{rnnParams(d, h).toLocaleString("en")}</b> · LSTM: 4[h(d+h)+h] = <b>{lstmParams(d, h).toLocaleString("en")}</b> · GRU (reset_after): 3[h(d+h)+2h] = <b>{gruParams(d, h).toLocaleString("en")}</b>
          </Out>
          <Callout title="Why these formulas">LSTM has four weight blocks (forget, input, candidate, output), GRU three (reset, update, candidate). PyTorch stores two bias vectors per block, so its LSTM has 4h more parameters than Keras; its GRU matches Keras' default.</Callout>
        </Card>
      </div>
    </div>
  );
}
