import { useEffect, useMemo, useRef, useState } from "react";
import { Callout, col, Controls, Demo, f2, Grid, Out, Seg, Slider } from "../../ui";
import { DIGIT } from "../digit";
import { mlpForward, paramCount, randomMlp, softmax } from "../math";
import { useT, useRich } from "../rich";
import { Calc } from "../widgets";

const BASE_LOGITS = [-1, -1, 0, -1, -2, -1, -2, 4, 0, 1];
const K = 12;

function PixelViewer() {
  const t = useT();
  const r = useRich();
  const cv = useRef<HTMLCanvasElement>(null);
  const strip = useRef<HTMLCanvasElement>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cell, setCell] = useState<{ r: number; q: number } | null>(null);
  const [thr, setThr] = useState(0);
  const shade = (v: number) => (v > thr ? v : 0);
  const above = DIGIT.filter((v) => v > thr).length;

  useEffect(() => {
    const c = cv.current?.getContext("2d");
    if (c) for (let rr = 0; rr < 28; rr++) for (let q = 0; q < 28; q++) {
      const v = shade(DIGIT[rr * 28 + q]);
      c.fillStyle = `rgb(${v},${v},${v})`;
      c.fillRect(q * K, rr * K, K, K);
    }
    const s = strip.current?.getContext("2d");
    if (s) {
      for (let i = 0; i < 784; i++) { const v = shade(DIGIT[i]); s.fillStyle = `rgb(${v},${v},${v})`; s.fillRect(i, 0, 1, 30); }
      s.fillStyle = "rgba(255,80,80,.5)";
      for (let rr = 1; rr < 28; rr++) s.fillRect(rr * 28, 0, 1, 30);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thr]);

  useEffect(() => {
    const c = cv.current?.getContext("2d");
    if (!c || !cell) return;
    c.save();
    c.strokeStyle = "#ef4444";
    c.lineWidth = 2;
    c.strokeRect(cell.q * K + 1, cell.r * K + 1, 10, 10);
    c.restore();
    return () => {
      const v = shade(DIGIT[cell.r * 28 + cell.q]);
      c.fillStyle = `rgb(${v},${v},${v})`;
      c.fillRect(cell.q * K, cell.r * K, K, K);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cell, thr]);

  const show = (rr: number, q: number) => {
    const v = DIGIT[rr * 28 + q];
    setCell({ r: rr, q });
    setInfo(t("lab1.mn.px.info", undefined, { r: rr, q, v, s: f2(v / 255, 3), i: rr * 28 + q }));
  };
  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    const q = Math.floor(((e.clientX - b.left) / b.width) * 28);
    const rr = Math.floor(((e.clientY - b.top) / b.height) * 28);
    if (q < 0 || q > 27 || rr < 0 || rr > 27) return;
    show(rr, q);
  };
  const onKey = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const d: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const m = d[e.key];
    if (!m) return;
    e.preventDefault();
    const base = cell ?? { r: 14, q: 14 };
    show(Math.max(0, Math.min(27, base.r + m[0])), Math.max(0, Math.min(27, base.q + m[1])));
  };

  return (
    <Demo title={t("lab1.mn.px.title")}>
      <Grid>
        <div>
          <canvas ref={cv} width={336} height={336} tabIndex={0} onMouseMove={onMove} onKeyDown={onKey} onMouseLeave={() => { setCell(null); setInfo(null); }}
            className="w-full max-w-[336px] cursor-crosshair rounded-lg border border-line [image-rendering:pixelated]" role="img" aria-label={t("lab1.mn.px.aria")} />
          <Out>{info ?? t("lab1.mn.px.hint")}</Out>
          <div className="mt-3">
            <Controls>
              <Slider id="mn-thr" label={t("lab1.mn.px.thr")} min={0} max={254} step={1} value={thr} onChange={setThr} />
            </Controls>
            <p className="text-sm text-muted">{t("lab1.mn.px.count", undefined, { n: above, t: thr })}</p>
          </div>
        </div>
        <div>
          <h4 className="font-semibold">{t("lab1.mn.px.s2")}</h4>
          <p className="mt-1 text-sm">{r("lab1.mn.px.s2text")}</p>
          <canvas ref={strip} width={784} height={30} className="mt-2 w-full rounded border border-line" role="img" aria-label={t("lab1.mn.px.stripAria")} />
          <p className="mb-4 mt-1 text-xs text-muted">{t("lab1.mn.px.stripNote")}</p>
          <h4 className="font-semibold">{t("lab1.mn.px.s3")}</h4>
          <p className="mt-1 text-sm">{r("lab1.mn.px.s3text")}</p>
        </div>
      </Grid>
    </Demo>
  );
}

const LAYERS: [number, string][] = [[784, "input"], [512, "relu"], [256, "relu"], [128, "relu"], [64, "relu"], [10, "softmax"]];

function Architecture() {
  const t = useT();
  const r = useRich();
  const xs = LAYERS.map((_, i) => 80 + i * 148);
  const show = (n: number) => Math.min(n === 784 ? 9 : n > 100 ? 7 : n > 20 ? 6 : n, 10);
  const pos = LAYERS.map(([n], i) => Array.from({ length: show(n) }, (_, j) => [xs[i], 150 + (j - (show(n) - 1) / 2) * 24] as const));
  const colors = ["c-teal", "brand", "brand", "brand", "brand", "c-purple"];
  const params = [401920, 131328, 32896, 8256, 650];
  return (
    <Demo title={t("lab1.mn.arch.title")}>
      <div className="overflow-x-auto">
        <svg viewBox="0 0 900 300" className="min-w-[640px] w-full" role="img" aria-label={t("lab1.mn.arch.aria")}>
          {pos.slice(0, -1).map((layer, i) => layer.map((a, ai) => pos[i + 1].map((b, bi) => (
            <line key={`${i}-${ai}-${bi}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} style={{ stroke: col("line") }} />
          ))))}
          {pos.map((layer, i) => layer.map(([x, y], j) => <circle key={`${i}-${j}`} cx={x} cy={y} r="8" style={{ fill: col(colors[i]) }} />))}
          {LAYERS.map(([n, a], i) => (
            <g key={i} textAnchor="middle">
              <text x={xs[i]} y="26" fontSize="15" fontWeight="700" style={{ fill: col("ink") }}>{n}</text>
              <text x={xs[i]} y="46" fontSize="12" style={{ fill: col("muted") }}>{a}</text>
              <text x={xs[i]} y="285" fontSize="12" style={{ fill: col("muted") }}>{i === 0 ? t("lab1.mn.arch.pixels") : i === 5 ? t("lab1.mn.arch.digits") : t("lab1.mn.arch.hidden", undefined, { n: i })}</text>
              {i > 0 && i < 5 && <text x={xs[i]} y="66" fontSize="11" style={{ fill: col("muted") }}>…</text>}
            </g>
          ))}
        </svg>
      </div>
      <p className="text-sm text-muted">
        {r("lab1.mn.arch.text", { list: params.map((p) => p.toLocaleString("en")).join(" + "), total: params.reduce((a, b) => a + b, 0).toLocaleString("en") })}
      </p>
    </Demo>
  );
}

const SIZES = [16, 32, 64, 128, 256, 512, 1024];

function ParamCalc() {
  const t = useT();
  const r = useRich();
  const [hidden, setHidden] = useState([512, 256, 128, 64]);
  const sizes = [784, ...hidden, 10];
  const rows = sizes.slice(1).map((n, i) => ({ a: sizes[i], b: n, p: sizes[i] * n + n }));
  const total = paramCount(sizes);
  return (
    <Demo title={t("lab1.mn.pc.title")}>
      <p className="text-sm text-muted">{r("lab1.mn.pc.intro")}</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        {hidden.map((n, i) => (
          <div key={i}>
            <label htmlFor={`pc-${i}`} className="label">{t("lab1.mn.pc.layer", undefined, { n: i + 1 })}</label>
            <select id={`pc-${i}`} className="field !py-1" value={n} onChange={(e) => setHidden((h) => h.map((x, k) => (k === i ? Number(e.target.value) : x)))}>
              {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        ))}
        <button className="btn-ghost !text-xs" disabled={hidden.length >= 5} onClick={() => setHidden((h) => [...h, 64])}>{t("lab1.mn.pc.add")}</button>
        <button className="btn-ghost !text-xs" disabled={hidden.length <= 0} onClick={() => setHidden((h) => h.slice(0, -1))}>{t("lab1.mn.pc.remove")}</button>
      </div>
      <div className="mt-3 space-y-1.5">
        {rows.map((x, i) => <Calc key={i}>{`${x.a} × ${x.b} + ${x.b} = ${x.p.toLocaleString("en")}`}</Calc>)}
      </div>
      <p className="mt-2 text-sm" role="status">{r("lab1.mn.pc.total", { arch: sizes.join("-"), n: total.toLocaleString("en") })}</p>
    </Demo>
  );
}

function SoftmaxCalc() {
  const t = useT();
  const r = useRich();
  const [logits, setLogits] = useState(BASE_LOGITS);
  const [truth, setTruth] = useState(7);
  const p = softmax(logits);
  const top = p.indexOf(Math.max(...p));
  return (
    <Demo title={t("lab1.mn.sm.title")}>
      <p className="text-sm text-muted">{r("lab1.mn.sm.intro")}</p>
      <div className="mt-3"><Controls>
        <div>
          <label htmlFor="sm-true" className="label">{t("lab1.mn.sm.true")}</label>
          <select id="sm-true" className="field w-24" value={truth} onChange={(e) => setTruth(Number(e.target.value))}>
            {Array.from({ length: 10 }, (_, i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <button className="btn-ghost" onClick={() => setLogits(BASE_LOGITS)}>{t("lab1.mn.sm.reset")}</button>
      </Controls></div>
      <Grid>
        <div className="space-y-1">
          {logits.map((v, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <label htmlFor={`sm-${i}`} className="w-14 shrink-0 text-muted">logit {i}</label>
              <input id={`sm-${i}`} type="range" min={-5} max={8} step={0.1} value={v} className="min-w-0 flex-1 accent-brand"
                onChange={(e) => setLogits((l) => l.map((x, j) => (j === i ? Number(e.target.value) : x)))} />
              <output className="w-9 text-right font-mono">{f2(v, 1)}</output>
            </div>
          ))}
        </div>
        <svg viewBox="0 0 360 250" className="w-full" role="img" aria-label={t("lab1.mn.sm.aria")}>
          {p.map((v, i) => (
            <g key={i}>
              <text x="14" y={22 + i * 23} fontSize="12" style={{ fill: col("muted") }}>{i}</text>
              <rect x="30" y={10 + i * 23} width={Math.max(1, v * 290)} height="15" rx="4" opacity={i === truth ? 1 : 0.6} style={{ fill: i === truth ? col("ok") : col("brand") }} />
              <text x={34 + v * 290} y={22 + i * 23} fontSize="11" style={{ fill: col("ink") }}>{f2(v * 100, 1)}%</text>
            </g>
          ))}
        </svg>
      </Grid>
      <Out>
        {r("lab1.mn.sm.out", { s: f2(p.reduce((a, b) => a + b, 0), 3), top, v: top === truth ? t("lab1.mn.sm.right") : t("lab1.mn.sm.wrong"), p: f2(p[truth], 4), l: f2(-Math.log(p[truth]), 4) })}
      </Out>
      <Callout title={t("lab1.mn.sm.accTitle")}>{t("lab1.mn.sm.acc")}</Callout>
    </Demo>
  );
}

const LAB_ARCH = [784, 512, 256, 128, 64, 10];

function DrawDigit() {
  const t = useT();
  const r = useRich();
  const cv = useRef<HTMLCanvasElement>(null);
  const strip = useRef<HTMLCanvasElement>(null);
  const [pix, setPix] = useState<number[]>(() => new Array(784).fill(0));
  const [brush, setBrush] = useState<"1" | "2">("1");
  const [run, setRun] = useState(false);
  const [seed, setSeed] = useState(1);
  const drawing = useRef(false);
  const S = 10;

  useEffect(() => {
    const c = cv.current?.getContext("2d");
    if (c) for (let rr = 0; rr < 28; rr++) for (let q = 0; q < 28; q++) {
      const v = pix[rr * 28 + q];
      c.fillStyle = `rgb(${v},${v},${v})`;
      c.fillRect(q * S, rr * S, S, S);
    }
    const s = strip.current?.getContext("2d");
    if (s) for (let i = 0; i < 784; i++) { const v = pix[i]; s.fillStyle = `rgb(${v},${v},${v})`; s.fillRect(i, 0, 1, 24); }
  }, [pix]);

  const paint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    const q0 = ((e.clientX - b.left) / b.width) * 28 - 0.5;
    const r0 = ((e.clientY - b.top) / b.height) * 28 - 0.5;
    const rad = brush === "1" ? 1.2 : 2;
    setPix((cur) => {
      const next = cur.slice();
      for (let rr = Math.max(0, Math.floor(r0 - rad)); rr <= Math.min(27, Math.ceil(r0 + rad)); rr++) {
        for (let q = Math.max(0, Math.floor(q0 - rad)); q <= Math.min(27, Math.ceil(q0 + rad)); q++) {
          const d = Math.hypot(rr - r0, q - q0);
          if (d <= rad) next[rr * 28 + q] = Math.min(255, Math.max(next[rr * 28 + q], Math.round(255 * (1 - (d / (rad + 0.6))))));
        }
      }
      return next;
    });
  };

  const ink = pix.filter((v) => v > 0).length;
  const bright = pix.filter((v) => v > 127).length;
  const rowsOn = pix.reduce<number[]>((a, v, i) => (v > 0 ? [...a, Math.floor(i / 28)] : a), []);
  const colsOn = pix.reduce<number[]>((a, v, i) => (v > 0 ? [...a, i % 28] : a), []);
  const layers = useMemo(() => (run ? randomMlp(LAB_ARCH, seed) : null), [run, seed]);
  const out = useMemo(() => (layers ? mlpForward(layers, pix.map((v) => v / 255)) : null), [layers, pix]);

  return (
    <Demo title={t("lab1.mn.draw.title")}>
      <p className="text-sm text-muted">{r("lab1.mn.draw.intro")}</p>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div>
          <canvas
            ref={cv}
            width={28 * S}
            height={28 * S}
            aria-label={t("lab1.mn.draw.aria")}
            role="img"
            className="aspect-square w-full max-w-[280px] cursor-crosshair touch-none rounded-lg border border-line [image-rendering:pixelated]"
            onPointerDown={(e) => { drawing.current = true; e.currentTarget.setPointerCapture(e.pointerId); paint(e); }}
            onPointerMove={(e) => { if (drawing.current) paint(e); }}
            onPointerUp={() => { drawing.current = false; }}
            onPointerCancel={() => { drawing.current = false; }}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Seg label={t("lab1.mn.draw.brush")} value={brush} onChange={setBrush} options={[{ value: "1", label: t("lab1.mn.draw.thin") }, { value: "2", label: t("lab1.mn.draw.thick") }]} />
            <button className="btn-ghost !text-xs" onClick={() => setPix(new Array(784).fill(0))}>{t("lab1.mn.draw.clear")}</button>
            <button className="btn-ghost !text-xs" onClick={() => setPix(DIGIT.slice())}>{t("lab1.mn.draw.load")}</button>
          </div>
        </div>
        <div className="min-w-0 space-y-2">
          <ul className="grid gap-1.5 text-sm" role="status" aria-label={t("lab1.mn.draw.statsLabel")}>
            <li>{t("lab1.mn.draw.ink", undefined, { a: ink, b: bright })}</li>
            <li>{ink ? t("lab1.mn.draw.box", undefined, { r1: Math.min(...rowsOn), r2: Math.max(...rowsOn), c1: Math.min(...colsOn), c2: Math.max(...colsOn) }) : t("lab1.mn.draw.empty")}</li>
            <li>{t("lab1.mn.draw.mean", undefined, { m: f2(pix.reduce((a, b) => a + b, 0) / 784 / 255, 4) })}</li>
          </ul>
          <canvas ref={strip} width={784} height={24} className="w-full rounded border border-line" role="img" aria-label={t("lab1.mn.px.stripAria")} />
          <p className="text-xs text-muted">{t("lab1.mn.draw.vec")}</p>
          <details>
            <summary className="cursor-pointer text-sm font-semibold">{t("lab1.mn.draw.nums")}</summary>
            <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-line bg-raised p-2 font-mono text-[11px]">{`[${pix.join(", ")}]`}</pre>
          </details>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-c-amber/50 bg-c-amber/5 p-3">
        <h4 className="text-sm font-semibold">{t("lab1.mn.draw.netTitle")}</h4>
        <p className="mt-1 text-sm leading-relaxed">{r("lab1.mn.draw.honest")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button className="btn-primary !text-xs" onClick={() => setRun((x) => !x)}>{run ? t("lab1.mn.draw.hideNet") : t("lab1.mn.draw.runNet")}</button>
          {run && <button className="btn-ghost !text-xs" onClick={() => setSeed((s) => s + 1)}>{t("lab1.mn.draw.newW")}</button>}
        </div>
        {run && out && (
          <div className="mt-3 space-y-2">
            <svg viewBox="0 0 360 250" className="w-full max-w-md" role="img" aria-label={t("lab1.mn.sm.aria")}>
              {out.probs.map((v, i) => (
                <g key={i}>
                  <text x="14" y={22 + i * 23} fontSize="12" style={{ fill: col("muted") }}>{i}</text>
                  <rect x="30" y={10 + i * 23} width={Math.max(1, v * 290)} height="15" rx="4" opacity=".7" style={{ fill: col("c-amber") }} />
                  <text x={34 + v * 290} y={22 + i * 23} fontSize="11" style={{ fill: col("ink") }}>{f2(v * 100, 1)}%</text>
                </g>
              ))}
            </svg>
            <p className="text-sm" role="status">{r("lab1.mn.draw.result", { top: out.probs.indexOf(Math.max(...out.probs)), p: f2(Math.max(...out.probs) * 100, 1), seed })}</p>
            <p className="text-xs text-muted">
              {t("lab1.mn.draw.active", undefined, { a: out.acts.slice(1, -1).map((l) => l.filter((v) => v > 0).length + "/" + l.length).join(", ") })}
            </p>
          </div>
        )}
      </div>
    </Demo>
  );
}

function Split() {
  const t = useT();
  const r = useRich();
  return (
    <Demo title={t("lab1.mn.split.title")}>
      <svg viewBox="0 0 900 120" className="w-full" role="img" aria-label={t("lab1.mn.split.aria")}>
        <rect x="10" y="20" width="620" height="40" rx="6" opacity=".9" style={{ fill: col("pos") }} />
        <rect x="10" y="20" width="496" height="40" rx="6" opacity=".95" style={{ fill: col("c-teal") }} />
        <rect x="640" y="20" width="250" height="40" rx="6" style={{ fill: col("c-amber") }} />
        <g fontSize="13" fontWeight="700" textAnchor="middle" fill="#fff">
          <text x="258" y="45">{t("lab1.mn.split.train")}</text><text x="568" y="45">{t("lab1.mn.split.val")}</text><text x="765" y="45">{t("lab1.mn.split.test")}</text>
        </g>
        <g fontSize="13" style={{ fill: col("muted") }}>
          <text x="10" y="90">{t("lab1.mn.split.fit")}</text>
          <text x="568" y="90" textAnchor="middle">{t("lab1.mn.split.tune1")}</text><text x="568" y="108" textAnchor="middle">{t("lab1.mn.split.tune2")}</text>
          <text x="765" y="90" textAnchor="middle">{t("lab1.mn.split.final1")}</text><text x="765" y="108" textAnchor="middle">{t("lab1.mn.split.final2")}</text>
        </g>
      </svg>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div>
          <svg viewBox="0 0 420 260" className="w-full" role="img" aria-label={t("lab1.mn.split.sketchAria")}>
            <g style={{ stroke: col("line") }}><line x1="40" y1="220" x2="400" y2="220" /><line x1="40" y1="20" x2="40" y2="220" /></g>
            <path d="M40,40 C80,150 140,190 400,210" fill="none" strokeWidth="3" style={{ stroke: col("c-teal") }} />
            <path d="M40,60 C80,130 120,150 160,150 C220,150 300,160 400,190" fill="none" strokeWidth="3" style={{ stroke: col("bad") }} />
            <line x1="160" y1="20" x2="160" y2="220" strokeDasharray="5 4" style={{ stroke: col("c-amber") }} />
            <text x="166" y="36" fontSize="12" style={{ fill: col("muted") }}>{t("lab1.mn.split.best")}</text>
            <text x="250" y="184" fontSize="13" style={{ fill: col("c-teal") }}>{t("lab1.mn.split.trainLoss")}</text>
            <text x="230" y="136" fontSize="13" style={{ fill: col("bad") }}>{t("lab1.mn.split.valLoss")}</text>
            <text x="220" y="245" textAnchor="middle" fontSize="12" style={{ fill: col("muted") }}>{t("lab1.mn.split.epochs")}</text>
          </svg>
          <p className="text-sm text-muted">{r("lab1.mn.split.over")}</p>
        </div>
        <div>
          <img src="/labs/lab1/learning-curves.png" alt={t("lab1.mn.split.imgAlt")} className="w-full rounded-xl border border-line bg-white" loading="lazy" />
          <p className="mt-1 text-sm text-muted">{t("lab1.mn.split.imgCap")}</p>
        </div>
      </div>
    </Demo>
  );
}

export default function Mnist() {
  const t = useT();
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{t("lab1.mn.intro")}</p>
      <PixelViewer />
      <Architecture />
      <ParamCalc />
      <SoftmaxCalc />
      <DrawDigit />
      <Split />
    </div>
  );
}
