import { useMemo, useState } from "react";
import { Callout, Demo, Seg, Slider } from "../../ui";
import { useR, useTx } from "../rich";
import { adamwStep, classify, clipNorm, crossEntropy, HPARAMS, lrAt, maskTokens, totalSteps, type AdamState } from "../transformerMath";
import { Bar, DemoHead, fmtInt, lin, n2, NumCell, P } from "./shared";

/** The 13 DistilBERT tokens of the paper's example sentence (recorded tokenisation). */
export const PAPER_TOKENS = ["[CLS]", "the", "plot", "was", "not", "good", ",", "but", "the", "acting", "was", "brilliant", "[SEP]"];
const RANDOM_POOL = ["movie", "run", "blue", "film", "and", "never", "tea", "slow"];

function Mlm() {
  const r = useR();
  const tx = useTx();
  const [seed, setSeed] = useState(4);
  const [rate, setRate] = useState(15);
  const [p, setP] = useState(0.4);
  const res = useMemo(() => maskTokens(PAPER_TOKENS, RANDOM_POOL, seed, rate / 100), [seed, rate]);
  const k = res.selected.length;
  const counts = { mask: 0, random: 0, keep: 0 };
  for (const i of res.selected) counts[res.action[i]]++;
  const tone = { mask: "border-brand bg-brand/15", random: "border-c-amber bg-c-amber/15", keep: "border-ok bg-ok/15" } as const;
  return (
    <Demo>
      <DemoHead title={tx("lab3.t.tr.mlm.title")} tags={["paper", "bert", "toy"]} />
      <P k="lab3.t.tr.mlm.hint" />
      <div className="mt-2 rounded-lg border border-line bg-raised/60 p-2 text-center font-mono text-xs sm:text-sm">L<sub>MLM</sub> = − Σ<sub>t∈M</sub> log P(w<sub>t</sub> | x<sub>∖M</sub>)</div>
      <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3">
        <Slider id="tr-rate" label={tx("lab3.t.tr.mlm.rate")} min={5} max={40} step={1} value={rate} onChange={setRate} format={(v) => `${v} %`} />
        <button type="button" className="btn-ghost !py-1.5 !text-sm" onClick={() => setSeed((s) => s + 1)}>{tx("lab3.t.sh.newDraw")}</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5" aria-live="polite" data-testid="tr-mlm">
        {PAPER_TOKENS.map((t, i) => {
          const a = res.action[i];
          return (
            <span key={i} className={`rounded-md border px-2 py-0.5 text-center font-mono text-sm ${a ? tone[a] : "border-line bg-raised"}`}>
              {res.input[i]}
              <span className="block text-[10px] text-muted">{a ? `${tx(`lab3.t.tr.mlm.a.${a}`)} · ${t}` : " "}</span>
            </span>
          );
        })}
      </div>
      <p className="mt-2 text-sm" aria-live="polite">{r("lab3.t.tr.mlm.read", { k, n: PAPER_TOKENS.length - 2, m: counts.mask, r: counts.random, s: counts.keep })}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
        <Slider id="tr-p" label={tx("lab3.t.tr.mlm.p")} min={0.05} max={1} step={0.05} value={p} onChange={setP} format={(v) => v.toFixed(2)} />
        <p className="self-end rounded-xl border border-line bg-raised/70 px-3 py-1.5 font-mono text-sm" role="status" aria-live="polite" data-testid="tr-mlm-loss">L = −{k} · ln({p.toFixed(2)}) = <b>{(-k * Math.log(p)).toFixed(3)}</b></p>
      </div>
      <p className="mt-2 text-xs text-muted">{r("lab3.t.tr.mlm.source")}</p>
    </Demo>
  );
}

const W_CLS = [[0.2, -0.4, 0.5, 0.1], [-0.3, 0.6, -0.2, 0.4]];
const B_CLS = [0.05, -0.05];

function ClsHead() {
  const r = useR();
  const tx = useTx();
  const [h, setH] = useState([0.8, -0.2, 0.6, 0.1]);
  const [y, setY] = useState<"1" | "0">("1");
  const res = useMemo(() => classify(h, W_CLS, B_CLS), [h]);
  const yi = Number(y);
  const loss = crossEntropy(res.probs, yi);
  const grad = res.probs.map((p, c) => p - (c === yi ? 1 : 0));
  return (
    <Demo>
      <DemoHead title={tx("lab3.t.tr.cls.title")} tags={["paper", "toy", "recomputed"]} />
      <P k="lab3.t.tr.cls.hint" />
      <div className="mt-2 rounded-lg border border-line bg-raised/60 p-2 text-center font-mono text-xs leading-relaxed sm:text-sm">P(y | x) = softmax(W·h<sub>CLS</sub> + b) &nbsp; L<sub>CE</sub> = − (1/N) Σ log P(y<sub>i</sub> | x<sub>i</sub>)</div>
      <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3">
        <div>
          <p className="mb-1 text-xs font-medium text-muted">h<sub>CLS</sub></p>
          <div className="flex gap-1.5">{h.map((v, i) => <NumCell key={i} label={`h${i + 1}`} value={v} onChange={(a) => setH(h.map((b, j) => (j === i ? a : b)))} />)}</div>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-muted">{tx("lab3.t.tr.cls.label")}</p>
          <Seg<"1" | "0"> label={tx("lab3.t.tr.cls.label")} value={y} onChange={setY} options={[{ value: "1", label: tx("lab3.t.tr.cls.pos") }, { value: "0", label: tx("lab3.t.tr.cls.neg") }]} />
        </div>
      </div>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5 text-sm">
          <p className="font-mono text-xs text-muted">{tx("lab3.t.tr.cls.W")}: [{W_CLS.map((row) => `[${row.join(", ")}]`).join(", ")}], b = [{B_CLS.join(", ")}]</p>
          <p className="font-mono text-xs">{tx("lab3.t.tr.cls.logits")} = [{res.logits.map((v) => n2(v, 3)).join(", ")}]</p>
          <Bar label={tx("lab3.t.tr.cls.neg")} value={res.probs[0]} max={1} text={`${(res.probs[0] * 100).toFixed(1)} %`} tone="bg-neg" />
          <Bar label={tx("lab3.t.tr.cls.pos")} value={res.probs[1]} max={1} text={`${(res.probs[1] * 100).toFixed(1)} %`} tone="bg-pos" />
        </div>
        <div className="rounded-xl border border-line bg-raised/70 p-3 text-sm" role="status" aria-live="polite" data-testid="tr-cls">
          <p>{tx("lab3.t.tr.cls.ce")} = −ln P(y) = −ln({res.probs[yi].toFixed(4)}) = <b className="font-mono">{loss.toFixed(4)}</b></p>
          <p className="mt-1 font-mono text-xs">{tx("lab3.t.tr.cls.grad")} = p − onehot(y) = [{grad.map((v) => n2(v, 3)).join(", ")}]</p>
          <p className="mt-2 leading-relaxed text-muted">{loss > 1.5 ? r("lab3.t.tr.cls.bad") : loss < 0.2 ? r("lab3.t.tr.cls.good") : r("lab3.t.tr.cls.mid")}</p>
        </div>
      </div>
    </Demo>
  );
}

function Adam() {
  const r = useR();
  const tx = useTx();
  const [g, setG] = useState([0.5, -0.2, 0.3, 0.1, 0.4]);
  const [lr, setLr] = useState(0.1);
  const [wd, setWd] = useState(0.01);
  const [cg, setCg] = useState([3, 4]);
  const rows = useMemo(() => {
    let theta = 1;
    let st: AdamState = { m: 0, v: 0, t: 0 };
    return g.map((gi) => {
      const o = adamwStep(theta, gi, st, lr, wd);
      theta = o.theta;
      st = o.state;
      return { g: gi, m: o.state.m, v: o.state.v, mh: o.mhat, vh: o.vhat, theta: o.theta };
    });
  }, [g, lr, wd]);
  const clip = clipNorm(cg, 1);
  return (
    <Demo>
      <DemoHead title={tx("lab3.t.tr.adam.title")} tags={["paper", "toy", "recomputed"]} />
      <P k="lab3.t.tr.adam.hint" />
      <div className="mt-2 rounded-lg border border-line bg-raised/60 p-2 text-center font-mono text-xs leading-relaxed sm:text-sm">
        m<sub>t</sub> = β<sub>1</sub>m<sub>t−1</sub> + (1−β<sub>1</sub>)g<sub>t</sub> &nbsp; v<sub>t</sub> = β<sub>2</sub>v<sub>t−1</sub> + (1−β<sub>2</sub>)g<sub>t</sub>² &nbsp; θ<sub>t</sub> = θ<sub>t−1</sub> − η<sub>t</sub>( m̂<sub>t</sub> / (√v̂<sub>t</sub> + ε) + λθ<sub>t−1</sub> )
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3">
        <div>
          <p className="mb-1 text-xs font-medium text-muted">{tx("lab3.t.tr.adam.g")}</p>
          <div className="flex flex-wrap gap-1.5">{g.map((v, i) => <NumCell key={i} label={`g${i + 1}`} value={v} onChange={(a) => setG(g.map((b, j) => (j === i ? a : b)))} />)}</div>
        </div>
        <Slider id="tr-lr" label="η" min={0.01} max={0.5} step={0.01} value={lr} onChange={setLr} format={(v) => v.toFixed(2)} />
        <Slider id="tr-wd" label="λ" min={0} max={0.5} step={0.01} value={wd} onChange={setWd} format={(v) => v.toFixed(2)} />
      </div>
      <div className="mt-3 overflow-x-auto" data-testid="tr-adam">
        <table className="w-full min-w-[30rem] text-right font-mono text-xs">
          <thead>
            <tr className="border-b border-line text-muted">
              {["t", "g", "m", "v", "m̂", "v̂", "θ"].map((c) => <th key={c} className="px-2 py-1 font-medium">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((o, i) => (
              <tr key={i} className="border-b border-line/50">
                <td className="px-2 py-1">{i + 1}</td>
                {[o.g, o.m, o.v, o.mh, o.vh, o.theta].map((v, j) => <td key={j} className={`px-2 py-1 ${j === 5 ? "font-bold text-brand" : ""}`}>{n2(v, 4)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">{r("lab3.t.tr.adam.note")}</p>
      <div className="mt-4 border-t border-line pt-3">
        <p className="text-sm font-semibold">{tx("lab3.t.tr.clip.title")}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {cg.map((v, i) => <NumCell key={i} label={`gradient ${i + 1}`} value={v} onChange={(a) => setCg(cg.map((b, j) => (j === i ? a : b)))} />)}
        </div>
        <p className="mt-2 text-sm" role="status" aria-live="polite" data-testid="tr-clip">{r("lab3.t.tr.clip.read", { norm: clip.norm.toFixed(3), scale: clip.scale.toFixed(3), out: `[${clip.g.map((v) => n2(v, 3)).join(", ")}]` })}</p>
      </div>
    </Demo>
  );
}

function Schedule() {
  const r = useR();
  const tx = useTx();
  const [mi, setMi] = useState(2);
  const [warm, setWarm] = useState(10);
  const [step, setStep] = useState(40);
  const h = HPARAMS[mi];
  const total = totalSteps(h.examples, h.batch, h.epochs);
  const warmSteps = Math.max(1, Math.round((total * warm) / 100));
  const s = Math.min(step, total);
  const W = 460;
  const H = 190;
  const xs = Array.from({ length: total + 1 }, (_, i) => i);
  const px = (v: number) => lin(v, 0, total, 40, W - 10);
  const py = (v: number) => lin(v, 0, h.peak * 1.1, H - 24, 10);
  const path = xs.filter((_, i) => i % Math.max(1, Math.floor(total / 250)) === 0 || i === total).map((v, i) => `${i ? "L" : "M"}${px(v).toFixed(1)},${py(lrAt(v, total, h.peak, warm / 100)).toFixed(1)}`).join("");
  const lr = lrAt(s, total, h.peak, warm / 100);
  return (
    <Demo>
      <DemoHead title={tx("lab3.t.tr.sch.title")} tags={["paper", "recomputed"]} />
      <P k="lab3.t.tr.sch.hint" />
      <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3">
        <div>
          <p className="mb-1 text-xs font-medium text-muted">{tx("lab3.t.tr.sch.model")}</p>
          <Seg<string> label={tx("lab3.t.tr.sch.model")} value={String(mi)} onChange={(v) => { setMi(Number(v)); setStep(40); }} options={HPARAMS.map((x, i) => ({ value: String(i), label: x.model }))} />
        </div>
        <Slider id="tr-warm" label={tx("lab3.t.tr.sch.warm")} min={0} max={30} step={1} value={warm} onChange={setWarm} format={(v) => `${v} %`} />
        <Slider id="tr-step" label={tx("lab3.t.tr.sch.step")} min={0} max={total} step={1} value={s} onChange={setStep} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label={tx("lab3.t.tr.sch.title")}>
        <line x1="40" x2={W - 10} y1={py(0)} y2={py(0)} style={{ stroke: "rgb(var(--line))" }} />
        <line x1="40" x2="40" y1="10" y2={py(0)} style={{ stroke: "rgb(var(--line))" }} />
        <line x1={px(warmSteps)} x2={px(warmSteps)} y1="10" y2={py(0)} strokeDasharray="3 3" style={{ stroke: "rgb(var(--c-amber))" }} />
        <path d={path} fill="none" strokeWidth="2.5" style={{ stroke: "rgb(var(--brand))" }} />
        <circle cx={px(s)} cy={py(lr)} r="4.5" style={{ fill: "rgb(var(--neg))" }} />
        <text x="36" y={py(h.peak) + 3} fontSize="9" textAnchor="end" style={{ fill: "rgb(var(--muted))" }}>{h.peak.toExponential(0)}</text>
        <text x="36" y={py(0) + 3} fontSize="9" textAnchor="end" style={{ fill: "rgb(var(--muted))" }}>0</text>
        <text x={px(total)} y={H - 6} fontSize="9" textAnchor="end" style={{ fill: "rgb(var(--muted))" }}>{total}</text>
        <text x={W / 2} y={H - 6} fontSize="9" textAnchor="middle" style={{ fill: "rgb(var(--muted))" }}>{tx("lab3.t.tr.sch.axis")}</text>
      </svg>
      <p className="mt-2 rounded-xl border border-line bg-raised/70 px-3 py-2 text-sm" role="status" aria-live="polite" data-testid="tr-sch">
        {r("lab3.t.tr.sch.read", { s, lr: lr.toExponential(2), phase: s < warmSteps ? tx("lab3.t.tr.sch.phase.warm") : tx("lab3.t.tr.sch.phase.decay") })}
      </p>
      <p className="mt-2 text-xs text-muted">{r("lab3.t.tr.sch.derived", { ex: fmtInt(h.examples), b: h.batch, spe: Math.ceil(h.examples / h.batch), e: h.epochs, total, w: warmSteps })}</p>
    </Demo>
  );
}

export default function Training() {
  const r = useR();
  const tx = useTx();
  const rows: [string, (h: (typeof HPARAMS)[number]) => string][] = [
    ["lab3.t.tr.hp.arch", (h) => `${h.layers} / ${h.d} / ${h.heads}`],
    ["lab3.t.tr.hp.examples", (h) => fmtInt(h.examples)],
    ["lab3.t.tr.hp.epochs", (h) => String(h.epochs)],
    ["lab3.t.tr.hp.lr", (h) => { const [m, e] = h.peak.toExponential(0).split("e"); return `${m}·10${e.replace("-", "⁻").replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)])}`; }],
    ["lab3.t.tr.hp.batch", (h) => `${h.batch} / ${h.maxLen}`],
    ["lab3.t.tr.hp.warm", () => "10 % / linear"],
    ["lab3.t.tr.hp.wd", () => "0.01 / 1.0"],
  ];
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <P k="lab3.t.tr.lead1" />
        <P k="lab3.t.tr.lead2" />
      </div>
      <Mlm />
      <ClsHead />
      <Adam />
      <Schedule />
      <Demo>
        <DemoHead title={tx("lab3.t.tr.hp.title")} tags={["paper"]} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-sm" data-testid="tr-hp">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="py-1.5 font-medium">{tx("lab3.t.tr.hp.name")}</th>
                {HPARAMS.map((h) => <th key={h.model} className="text-right font-medium">{h.model}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map(([k, f]) => (
                <tr key={k} className="border-b border-line/60">
                  <td className="py-1.5 text-muted">{tx(k)}</td>
                  {HPARAMS.map((h) => <td key={h.model} className="text-right font-mono">{f(h)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">{r("lab3.t.tr.hp.note")}</p>
        <Callout title={tx("lab3.t.tr.tip.title")}>{r("lab3.t.tr.tip.body")}</Callout>
      </Demo>
    </div>
  );
}
