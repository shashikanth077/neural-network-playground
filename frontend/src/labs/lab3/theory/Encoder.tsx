import { useMemo, useState } from "react";
import { Callout, Demo, Seg, Slider } from "../../ui";
import { RECORDED } from "../data/theoryRecorded";
import { useR, useTx } from "../rich";
import {
  attentionParams, BERT_SMALL, BERT_TINY, DISTILBERT, erf, ffn, ffnParams, gelu, geluTanh, layerNorm, paramBreakdown, paramTotal, randMat, relu, type EncoderConfig,
} from "../transformerMath";
import { Bar, DemoHead, fmtInt, Heat, lin, n2, NumCell, P } from "./shared";

const PRESETS: Record<string, EncoderConfig> = {
  tiny: BERT_TINY, small: BERT_SMALL, distil: DISTILBERT,
  base: { ...DISTILBERT, layers: 12, tokenTypes: true },
};
const REAL_NAME: Record<string, string> = { tiny: "BERT-tiny", small: "BERT-small", distil: "DistilBERT" };
const BLOCKS = ["emb", "attn", "norm1", "ffn", "norm2", "head"] as const;
type Blk = (typeof BLOCKS)[number];

function GeluPlot({ x }: { x: number }) {
  const W = 440;
  const H = 190;
  const xs = Array.from({ length: 161 }, (_, i) => -4 + i * 0.05);
  const px = (v: number) => lin(v, -4, 4, 26, W - 8);
  const py = (v: number) => lin(v, -1, 4, H - 16, 8);
  const path = (f: (v: number) => number) => xs.map((v, i) => `${i ? "L" : "M"}${px(v).toFixed(1)},${py(f(v)).toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="ReLU, GELU, GELU tanh">
      <line x1="26" x2={W - 8} y1={py(0)} y2={py(0)} style={{ stroke: "rgb(var(--line))" }} />
      <line x1={px(0)} x2={px(0)} y1="8" y2={H - 16} style={{ stroke: "rgb(var(--line))" }} />
      <path d={path(relu)} fill="none" strokeWidth="1.5" strokeDasharray="4 3" style={{ stroke: "rgb(var(--muted))" }} />
      <path d={path(gelu)} fill="none" strokeWidth="2.5" style={{ stroke: "rgb(var(--brand))" }} />
      <path d={path(geluTanh)} fill="none" strokeWidth="1.5" style={{ stroke: "rgb(var(--neg))" }} />
      <line x1={px(x)} x2={px(x)} y1="8" y2={H - 16} strokeDasharray="2 3" style={{ stroke: "rgb(var(--ink) / 0.5)" }} />
      <text x="2" y={py(4) + 8} fontSize="9" style={{ fill: "rgb(var(--muted))" }}>4</text>
      <text x="2" y={py(0) + 3} fontSize="9" style={{ fill: "rgb(var(--muted))" }}>0</text>
      <text x={px(-4)} y={H - 3} fontSize="9" style={{ fill: "rgb(var(--muted))" }}>-4</text>
      <text x={px(4) - 8} y={H - 3} fontSize="9" style={{ fill: "rgb(var(--muted))" }}>4</text>
    </svg>
  );
}

function Activation() {
  const r = useR();
  const tx = useTx();
  const [x, setX] = useState(-1);
  const diff = useMemo(() => {
    let best = 0;
    let at = 0;
    for (let v = -6; v <= 6; v += 0.01) {
      const d = Math.abs(gelu(v) - geluTanh(v));
      if (d > best) { best = d; at = v; }
    }
    return { best, at };
  }, []);
  return (
    <Demo>
      <DemoHead title={tx("lab3.t.en.gelu.title")} tags={["recomputed"]} />
      <P k="lab3.t.en.gelu.hint" />
      <div className="mt-2 rounded-lg border border-line bg-raised/60 p-2 text-center font-mono text-xs sm:text-sm">GELU(x) = x · Φ(x) = ½ · x · (1 + erf(x / √2))</div>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div>
          <GeluPlot x={x} />
          <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <li><span className="mr-1 inline-block h-2 w-4 rounded-full bg-brand align-middle" />GELU (erf)</li>
            <li><span className="mr-1 inline-block h-2 w-4 rounded-full bg-neg align-middle" />GELU (tanh)</li>
            <li><span className="mr-1 inline-block h-0.5 w-4 bg-muted align-middle" />ReLU</li>
          </ul>
        </div>
        <div className="space-y-3">
          <Slider id="en-x" label="x" min={-4} max={4} step={0.05} value={x} onChange={setX} format={(v) => v.toFixed(2)} />
          <div className="rounded-xl border border-line bg-raised/70 px-3 py-2 font-mono text-sm leading-relaxed" role="status" aria-live="polite" data-testid="en-gelu">
            <p>erf({n2(x / Math.SQRT2, 3)}) = {erf(x / Math.SQRT2).toFixed(6)}</p>
            <p>GELU<sub>erf</sub>({n2(x)}) = <b>{gelu(x).toFixed(6)}</b></p>
            <p>GELU<sub>tanh</sub>({n2(x)}) = {geluTanh(x).toFixed(6)}</p>
            <p>ReLU({n2(x)}) = {relu(x).toFixed(6)}</p>
            <p className="text-muted">Δ = {(gelu(x) - geluTanh(x)).toExponential(2)}</p>
          </div>
          <p className="text-xs text-muted">{r("lab3.t.en.gelu.diff", { m: diff.best.toExponential(2), at: diff.at.toFixed(2) })}</p>
        </div>
      </div>
    </Demo>
  );
}

const D = 4;
const FF = 16;
const W1 = randMat(D, FF, 31, 0.8);
const W2 = randMat(FF, D, 32, 0.5);
const B1 = Array.from({ length: FF }, () => 0);
const B2 = Array.from({ length: D }, () => 0);

function Walk() {
  const r = useR();
  const tx = useTx();
  const [x, setX] = useState([1, -0.5, 2, 0.5]);
  const [resid, setResid] = useState<"yes" | "no">("yes");
  const [gamma, setGamma] = useState(1);
  const [beta, setBeta] = useState(0);
  const f = useMemo(() => ffn(x, W1, B1, W2, B2), [x]);
  const sum = useMemo(() => (resid === "yes" ? x.map((v, i) => v + f.output[i]) : f.output), [x, f, resid]);
  const out = useMemo(() => layerNorm(sum, sum.map(() => gamma), sum.map(() => beta)), [sum, gamma, beta]);
  const mean = out.reduce((a, b) => a + b, 0) / D;
  const vr = out.reduce((a, b) => a + (b - mean) ** 2, 0) / D;
  const row = (v: number[]) => (
    <span className="font-mono text-xs">[{v.map((a) => n2(a, 2)).join(", ")}]</span>
  );
  return (
    <Demo>
      <DemoHead title={tx("lab3.t.en.walk.title")} tags={["toy", "recomputed"]} />
      <P k="lab3.t.en.walk.hint" vars={{ d: D, ff: FF }} />
      <div className="mt-2 rounded-lg border border-line bg-raised/60 p-2 text-center font-mono text-xs leading-relaxed sm:text-sm">
        FFN(x) = GELU(x·W<sub>1</sub> + b<sub>1</sub>)·W<sub>2</sub> + b<sub>2</sub> &nbsp; H″ = LayerNorm(H′ + FFN(H′))
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3">
        <div>
          <p className="mb-1 text-xs font-medium text-muted">{tx("lab3.t.en.walk.x")}</p>
          <div className="flex gap-1.5">
            {x.map((v, i) => <NumCell key={i} label={`x${i + 1}`} value={v} onChange={(a) => setX(x.map((b, j) => (j === i ? a : b)))} />)}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-muted">{tx("lab3.t.en.walk.resid")}</p>
          <Seg<"yes" | "no"> label={tx("lab3.t.en.walk.resid")} value={resid} onChange={setResid} options={[{ value: "yes", label: tx("lab3.t.en.walk.yes") }, { value: "no", label: tx("lab3.t.en.walk.no") }]} />
        </div>
        <Slider id="en-g" label="γ (gamma)" min={0.2} max={3} step={0.1} value={gamma} onChange={setGamma} format={(v) => v.toFixed(1)} />
        <Slider id="en-b" label="β (beta)" min={-2} max={2} step={0.1} value={beta} onChange={setBeta} format={(v) => v.toFixed(1)} />
      </div>
      <div className="mt-4 space-y-3" aria-live="polite" data-testid="en-walk">
        <div>
          <p className="text-xs font-semibold text-muted">{tx("lab3.t.en.walk.hidden", { ff: FF })}</p>
          <Heat values={[f.hidden]} signed max={2} showValues={false} cell="h-6 w-6 min-w-0" label={tx("lab3.t.en.walk.hidden", { ff: FF })} />
        </div>
        <div>
          <p className="text-xs font-semibold text-muted">{tx("lab3.t.en.walk.act")}</p>
          <Heat values={[f.activated]} signed max={2} showValues={false} cell="h-6 w-6 min-w-0" label={tx("lab3.t.en.walk.act")} />
        </div>
        <dl className="grid gap-1 text-sm sm:grid-cols-[14rem_1fr]">
          <dt className="text-muted">{tx("lab3.t.en.walk.ffnOut")}</dt><dd>{row(f.output)}</dd>
          <dt className="text-muted">{resid === "yes" ? tx("lab3.t.en.walk.sum") : tx("lab3.t.en.walk.noSum")}</dt><dd>{row(sum)}</dd>
          <dt className="text-muted">{tx("lab3.t.en.walk.ln")}</dt><dd><b>{row(out)}</b></dd>
        </dl>
        <p className="text-sm">{r("lab3.t.en.walk.stats", { m: n2(mean, 3), v: n2(vr, 3) })}</p>
      </div>
    </Demo>
  );
}

function Counter({ cfg, setCfg, preset, setPreset }: { cfg: EncoderConfig; setCfg: (c: EncoderConfig) => void; preset: string; setPreset: (p: string) => void }) {
  const r = useR();
  const tx = useTx();
  const parts = useMemo(() => paramBreakdown(cfg), [cfg]);
  const total = parts.reduce((s, p) => s + p.count, 0);
  const max = Math.max(...parts.map((p) => p.count));
  const set = (patch: Partial<EncoderConfig>) => { setCfg({ ...cfg, ...patch }); setPreset("custom"); };
  const num = (id: string, key: keyof EncoderConfig, label: string) => (
    <label key={id} className="block text-xs font-medium text-muted" htmlFor={id}>
      {label}
      <input id={id} type="number" min={1} className="field mt-1 font-mono" value={cfg[key] as number} onChange={(e) => set({ [key]: Math.max(1, Math.round(Number(e.target.value) || 1)) })} />
    </label>
  );
  const real = REAL_NAME[preset] ? RECORDED.models.find((m) => m.name.startsWith(REAL_NAME[preset]) && m.name.includes("fine-tuned"))?.params : undefined;
  const formula: Record<string, string> = {
    word: `V · d = ${fmtInt(cfg.vocab)} · ${cfg.d}`, pos: `P · d = ${cfg.maxPositions} · ${cfg.d}`, type: `2 · d = 2 · ${cfg.d}`, embLn: `2d = ${2 * cfg.d}`,
    attn: `L · 4(d² + d) = ${cfg.layers} · ${fmtInt(attentionParams(cfg.d))}`, ln1: `L · 2d = ${cfg.layers} · ${2 * cfg.d}`,
    ffn: `L · (2·d·ff + ff + d) = ${cfg.layers} · ${fmtInt(ffnParams(cfg.d, cfg.ff))}`, ln2: `L · 2d = ${cfg.layers} · ${2 * cfg.d}`,
    dense: `d² + d = ${fmtInt(cfg.d * cfg.d + cfg.d)}`, cls: `C · d + C = ${cfg.classes} · ${cfg.d} + ${cfg.classes}`,
  };
  return (
    <Demo>
      <DemoHead title={tx("lab3.t.en.cnt.title")} tags={["recomputed", "paper"]} />
      <P k="lab3.t.en.cnt.hint" />
      <div className="mt-3">
        <Seg<string>
          label={tx("lab3.t.en.cnt.preset")}
          value={preset}
          onChange={(p) => { setPreset(p); if (PRESETS[p]) setCfg(PRESETS[p]); }}
          options={[
            { value: "tiny", label: "BERT-tiny" }, { value: "small", label: "BERT-small" }, { value: "distil", label: "DistilBERT" },
            { value: "base", label: "BERT-base" }, { value: "custom", label: tx("lab3.t.en.cnt.custom") },
          ]}
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {num("cn-v", "vocab", tx("lab3.t.en.cnt.v"))}
        {num("cn-d", "d", "d")}
        {num("cn-l", "layers", tx("lab3.t.en.cnt.l"))}
        {num("cn-h", "heads", "h")}
        {num("cn-ff", "ff", "ff")}
        {num("cn-p", "maxPositions", tx("lab3.t.en.cnt.p"))}
        {num("cn-c", "classes", tx("lab3.t.en.cnt.c"))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-brand" checked={cfg.tokenTypes} onChange={(e) => set({ tokenTypes: e.target.checked })} />{tx("lab3.t.en.cnt.type")}</label>
        <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-brand" checked={cfg.headDense} onChange={(e) => set({ headDense: e.target.checked })} />{tx("lab3.t.en.cnt.dense")}</label>
      </div>
      {cfg.d % cfg.heads !== 0 && <p role="alert" className="mt-2 rounded-lg border border-c-amber bg-c-amber/10 px-3 py-1.5 text-sm">{r("lab3.t.en.cnt.warn", { d: cfg.d, h: cfg.heads })}</p>}
      <div className="mt-4 space-y-1.5" data-testid="en-parts">
        {parts.map((p) => (
          <div key={p.id}>
            <Bar label={tx(`lab3.t.en.part.${p.id}`)} value={p.count} max={max} text={fmtInt(p.count)} tone={p.id === "word" ? "bg-c-amber" : "bg-brand"} />
            <p className="ml-0 pl-0 font-mono text-[10px] text-muted sm:ml-[10.5rem]">{formula[p.id]} · {((p.count / total) * 100).toFixed(1)} %</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-line bg-raised/70 px-3 py-2" role="status" aria-live="polite" data-testid="en-total">
        <p className="text-sm">{tx("lab3.t.en.cnt.total")}: <b className="font-mono text-lg" data-testid="en-total-n">{fmtInt(total)}</b></p>
        {real !== undefined && total === real && <p className="mt-1 text-sm text-ok">✓ {r("lab3.t.en.cnt.match", { n: fmtInt(real) })}</p>}
        {preset === "base" && <p className="mt-1 text-xs text-muted">{r("lab3.t.en.cnt.base", { n: fmtInt(total) })}</p>}
        <p className="mt-1 text-xs text-muted">{r("lab3.t.en.cnt.emb", { p: Math.round((parts[0].count / total) * 100) })}</p>
      </div>
      <p className="mt-2 text-xs text-muted">{r("lab3.t.en.cnt.note")}</p>
    </Demo>
  );
}

export default function Encoder() {
  const r = useR();
  const tx = useTx();
  const [cfg, setCfg] = useState<EncoderConfig>(BERT_TINY);
  const [preset, setPreset] = useState("tiny");
  const [blk, setBlk] = useState<Blk>("attn");
  const total = paramTotal(cfg);
  const info: Record<Blk, number> = {
    emb: paramBreakdown(cfg).filter((p) => ["word", "pos", "type", "embLn"].includes(p.id)).reduce((s, p) => s + p.count, 0),
    attn: cfg.layers * attentionParams(cfg.d),
    norm1: cfg.layers * 2 * cfg.d,
    ffn: cfg.layers * ffnParams(cfg.d, cfg.ff),
    norm2: cfg.layers * 2 * cfg.d,
    head: paramBreakdown(cfg).filter((p) => ["dense", "cls"].includes(p.id)).reduce((s, p) => s + p.count, 0),
  };
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <P k="lab3.t.en.lead" />
        <div className="rounded-lg border border-line bg-raised/60 p-2 text-center font-mono text-xs leading-relaxed sm:text-sm">
          H′ = LayerNorm(H + MultiHead(H)) &nbsp; H″ = LayerNorm(H′ + FFN(H′)) &nbsp; LayerNorm(x) = γ ⊙ (x − μ) / √(σ² + ε) + β
        </div>
      </div>

      <Demo>
        <DemoHead title={tx("lab3.t.en.blk.title")} tags={["paper", "recomputed"]} />
        <P k="lab3.t.en.blk.hint" vars={{ name: preset === "custom" ? tx("lab3.t.en.cnt.custom") : preset === "base" ? "BERT-base" : REAL_NAME[preset] }} />
        <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,16rem)_1fr]">
          <ol className="flex flex-col gap-1.5" aria-label={tx("lab3.t.en.blk.title")}>
            {BLOCKS.map((b, i) => (
              <li key={b} className="flex flex-col items-stretch">
                <button
                  type="button"
                  aria-pressed={blk === b}
                  onClick={() => setBlk(b)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${blk === b ? "border-brand bg-brand/10 text-brand" : "border-line bg-raised/50 hover:bg-raised"} ${b === "norm1" || b === "norm2" ? "border-dashed" : ""}`}
                >
                  {tx(`lab3.t.en.blk.${b}`)}
                  {(b === "attn" || b === "norm1" || b === "ffn" || b === "norm2") && <span className="ml-1 font-mono text-[11px] text-muted">× {cfg.layers}</span>}
                </button>
                {i < BLOCKS.length - 1 && <span aria-hidden className="text-center text-xs text-muted">↓</span>}
              </li>
            ))}
          </ol>
          <div className="rounded-xl border border-line bg-raised/60 p-3" role="status" aria-live="polite" data-testid="en-blk">
            <p className="text-sm font-semibold">{tx(`lab3.t.en.blk.${blk}`)}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{r(`lab3.t.en.blk.${blk}.d`)}</p>
            <p className="mt-2 text-sm">{r("lab3.t.en.blk.params", { n: fmtInt(info[blk]), p: ((info[blk] / total) * 100).toFixed(1) })}</p>
          </div>
        </div>
      </Demo>

      <Activation />
      <Walk />
      <Counter cfg={cfg} setCfg={setCfg} preset={preset} setPreset={setPreset} />
      <Callout title={tx("lab3.t.en.tip.title")}>{r("lab3.t.en.tip.body")}</Callout>
    </div>
  );
}
