import { useState } from "react";
import { Callout, Controls, Out } from "../labs/ui";
import { accuracyHalfWidth, attentionCost, binaryMetrics, convOut, convParams, denseParams, gruParams, inferenceSeconds, lstmParams, mcnemarExact, megabytes32, rnnParams, samePad, sentencesPerPoint, sentencesPerSecond, stepsPerEpoch, transformerParams, type EncoderConfig } from "./calc";
import { MEASURED } from "./measured";

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

const nf = (n: number, digits = 0) => n.toLocaleString("en", { maximumFractionDigits: digits });

const PRESETS: { id: string; label: string; cfg: EncoderConfig; heads: number }[] = [
  { id: "tiny", label: "BERT-tiny (L2, d128)", cfg: { vocab: 30522, d: 128, layers: 2, ff: 512, typeVocab: 2, classes: 2 }, heads: 2 },
  { id: "small", label: "BERT-small (L4, d512)", cfg: { vocab: 30522, d: 512, layers: 4, ff: 2048, typeVocab: 2, classes: 2 }, heads: 8 },
  { id: "distil", label: "DistilBERT (L6, d768)", cfg: { vocab: 30522, d: 768, layers: 6, ff: 3072, typeVocab: 0, classes: 2 }, heads: 12 },
  { id: "base", label: "BERT-base (L12, d768), no classifier", cfg: { vocab: 30522, d: 768, layers: 12, ff: 3072, typeVocab: 2, classes: 0 }, heads: 12 },
];

/** Parameter counter for a BERT-style encoder with a classification head (tested against the project's real model sizes). */
export function ParamCalculator() {
  const [preset, setPreset] = useState("tiny");
  const [cfg, setCfg] = useState<EncoderConfig>(PRESETS[0].cfg);
  const [h, setH] = useState(PRESETS[0].heads);
  const pick = (id: string) => {
    setPreset(id);
    const p = PRESETS.find((x) => x.id === id);
    if (p) { setCfg(p.cfg); setH(p.heads); }
  };
  const upd = (k: keyof EncoderConfig) => (v: number) => { setPreset("custom"); setCfg({ ...cfg, [k]: v }); };
  const r = transformerParams(cfg);
  const dk = cfg.d / h;
  return (
    <Card title="Transformer encoder parameter counter">
      <Controls>
        <div>
          <label htmlFor="tp-preset" className="label">Preset</label>
          <select id="tp-preset" className="field" value={preset} onChange={(e) => pick(e.target.value)}>
            {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            <option value="custom">Custom</option>
          </select>
        </div>
        <N id="tp-v" label="Vocabulary V" v={cfg.vocab} set={upd("vocab")} max={1000000} />
        <N id="tp-d" label="Hidden size d" v={cfg.d} set={upd("d")} max={20000} />
        <N id="tp-l" label="Layers L" v={cfg.layers} set={upd("layers")} max={200} />
        <N id="tp-ff" label="FFN size" v={cfg.ff} set={upd("ff")} max={100000} />
        <N id="tp-h" label="Heads h" v={h} set={(v) => { setPreset("custom"); setH(v); }} max={256} />
        <N id="tp-c" label="Classes (0 = none)" v={cfg.classes ?? 2} set={upd("classes")} min={0} max={1000} />
        <N id="tp-t" label="Token-type table" v={cfg.typeVocab ?? 2} set={upd("typeVocab")} min={0} max={8} />
      </Controls>
      <Out>
        <div data-testid="param-total">Total = <b>{nf(r.total)}</b> parameters ≈ {nf(megabytes32(r.total), 1)} MB at 32 bit</div>
        <div className="mt-1 text-muted">
          embeddings {nf(r.embeddings)} + {cfg.layers} × per-layer {nf(r.perLayer)} (attention {nf(r.attention)} + feed-forward {nf(r.feedForward)} + layer norms {nf(r.layerNorms)}) + head {nf(r.head)}
        </div>
        <div className="mt-1 text-muted">
          {cfg.d % h === 0 ? <>d_k = d / h = {nf(dk)} per head. The head count h does not change the total.</> : <>d is not divisible by h = {h}: real models need d / h to be an integer.</>}
        </div>
      </Out>
    </Card>
  );
}

/** What one self-attention layer costs as the sequence grows. */
export function AttentionCostCalculator() {
  const [n, setN] = useState(64), [d, setD] = useState(768), [h, setH] = useState(12);
  const c = attentionCost(n, d, h);
  return (
    <Card title="Self-attention cost of one layer">
      <Controls><N id="ac-n" label="Sequence length n" v={n} set={setN} max={1000000} /><N id="ac-d" label="Hidden size d" v={d} set={setD} max={20000} /><N id="ac-h" label="Heads h" v={h} set={setH} max={256} /></Controls>
      <Out>
        <div>Attention weights: h·n² = <b data-testid="attn-entries">{nf(c.scoreEntries)}</b> numbers ({nf((h * n * n * 4) / 1e6, 2)} MB at 32 bit per sequence)</div>
        <div className="mt-1">Q·Kᵀ and A·V: 2·n²·d = <b>{nf(c.attentionMults)}</b> multiply-adds · projections 4·n·d² = <b>{nf(c.projectionMults)}</b> · recurrent layer ~ n·d² = <b>{nf(c.recurrentMults)}</b></div>
        <div className="mt-1 text-muted">n²d / nd² = n / d = {nf(c.ratio, 3)}: {n < d ? "n < d, so the quadratic term is the smaller one." : "n ≥ d, so the quadratic term dominates."}</div>
      </Out>
    </Card>
  );
}

/** Latency × sentences using the project's measured CPU latencies. */
export function LatencyCalculator() {
  const [idx, setIdx] = useState(MEASURED.findIndex((m) => m.name.startsWith("DistilBERT fine-tuned")));
  const [count, setCount] = useState(872);
  const m = MEASURED[idx];
  const s = inferenceSeconds(m.latMs, count);
  return (
    <Card title="Latency × sentences (measured CPU latency)">
      <Controls>
        <div>
          <label htmlFor="lat-model" className="label">Model</label>
          <select id="lat-model" className="field" value={idx} onChange={(e) => setIdx(Number(e.target.value))}>
            {MEASURED.map((x, i) => <option key={x.name} value={i}>{x.name}</option>)}
          </select>
        </div>
        <N id="lat-n" label="Sentences" v={count} set={setCount} max={1000000000} />
      </Controls>
      <Out>
        <span data-testid="lat-out">{m.latMs} ms × {nf(count)} = <b>{nf(s, 1)} s</b> ({nf(s / 60, 1)} min, {nf(s / 3600, 2)} h)</span> · {nf(sentencesPerSecond(m.latMs), 1)} sentences per second
        <div className="mt-1 text-muted">Measured in the project (SST-2, CPU laptop, batches of 32). A GPU or a different CPU changes the numbers; the ratios between models are the useful part.</div>
      </Out>
    </Card>
  );
}

/** Exact McNemar test from the two discordant counts, plus the test-set-size rule of thumb. */
export function McNemarCalculator() {
  const [b, setB] = useState(48), [c, setC] = useState(28), [n, setN] = useState(872), [acc, setAcc] = useState(83);
  const p = mcnemarExact(b, c);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
      <Card title="Exact McNemar test">
        <Controls><N id="mc-b" label="b: only A correct" v={b} set={setB} min={0} /><N id="mc-c" label="c: only B correct" v={c} set={setC} min={0} /></Controls>
        <Out>
          <span data-testid="mcnemar-p">p = <b>{p < 0.001 ? p.toExponential(2) : p.toFixed(3)}</b></span> → {p < 0.05 ? "significant at 0.05: the models differ." : "not significant at 0.05: no reliable difference."}
          <div className="mt-1 text-muted">Under the null b ~ Binomial(b + c, 0.5); two-sided exact test. Default: the project's fine-tuned DistilBERT against the best model (p = 0.029).</div>
        </Out>
      </Card>
      <Card title="How big is one point?">
        <Controls><N id="ts-n" label="Test sentences" v={n} set={setN} max={10000000} /><N id="ts-acc" label="Accuracy (%)" v={acc} set={setAcc} max={99} /></Controls>
        <Out>1 point = <b>{nf(sentencesPerPoint(n), 1)}</b> sentences · normal-approximation 95 % interval ≈ ± <b>{nf(accuracyHalfWidth(acc / 100, n), 1)}</b> points</Out>
      </Card>
    </div>
  );
}

/** Precision, recall and F1 from a binary confusion matrix. */
export function PRFCalculator() {
  const [tp, setTp] = useState(40), [fp, setFp] = useState(10), [fn, setFn] = useState(20), [tn, setTn] = useState(30);
  const m = binaryMetrics(tp, fp, fn, tn);
  const pct = (x: number) => nf(x * 100, 1) + " %";
  return (
    <Card title="Precision, recall and F1 from a confusion matrix">
      <Controls><N id="prf-tp" label="TP" v={tp} set={setTp} min={0} /><N id="prf-fp" label="FP" v={fp} set={setFp} min={0} /><N id="prf-fn" label="FN" v={fn} set={setFn} min={0} /><N id="prf-tn" label="TN" v={tn} set={setTn} min={0} /></Controls>
      <Out><span data-testid="prf-out">Accuracy <b>{pct(m.accuracy)}</b> · precision <b>{pct(m.precision)}</b> · recall <b>{pct(m.recall)}</b> · F1 <b>{pct(m.f1)}</b></span> (positive class; macro F1 averages this with the negative class)</Out>
    </Card>
  );
}
