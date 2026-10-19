import { useEffect, useMemo, useRef, useState } from "react";
import { useIsDark } from "../../../hooks/useTheme";
import { Callout, canvasColor, col, Controls, Demo, f2, Legend, Out, Slider } from "../../ui";
import { GENDER_LABELS, HEIGHTS, WEIGHTS } from "../data";
import { featureStats, gradients, minMax, netParamsOf, predictRaw, sgdStep, SmallNet, type NetParams } from "../math";
import { useT, useRich } from "../rich";
import { Calc, NumInput, ScrollTable, td, th } from "../widgets";

const h = minMax(HEIGHTS);
const w = minMax(WEIGHTS);
const X: number[][] = [];
const Y: number[] = [];
const IDX: number[] = [];
GENDER_LABELS.forEach((g, i) => {
  if (g === null) return;
  X.push([h[i], w[i]]);
  Y.push(g);
  IDX.push(i + 1);
});
const NAME5 = [h[4], w[4]];
const HS = featureStats(HEIGHTS);
const WS = featureStats(WEIGHTS);

/** A SmallNet carrying the given parameters (and a copy of the loss history). */
function withParams(p: NetParams, history: number[]): SmallNet {
  const n = new SmallNet(0);
  const q = netParamsOf(p);
  n.w1 = q.w1; n.b1 = q.b1; n.w2 = q.w2; n.b2 = q.b2;
  n.lossHistory = [...history];
  return n;
}

function Trainer() {
  const t = useT();
  const r = useRich();
  const dark = useIsDark();
  const [lrExp, setLrExp] = useState(-0.3);
  const [epExp, setEpExp] = useState(2.7);
  const [seed, setSeed] = useState(7);
  const [net, setNet] = useState(() => new SmallNet(7));
  const [trained, setTrained] = useState(false);
  const [pickIdx, setPickIdx] = useState(0);
  const [one, setOne] = useState<{ idx: number; before: NetParams; after: NetParams; lr: number; lossB: number; lossA: number; outB: number; outA: number; grads: ReturnType<typeof gradients> } | null>(null);
  const [height, setHeight] = useState(172);
  const [weight, setWeight] = useState(63);
  const canvas = useRef<HTMLCanvasElement>(null);
  const lr = 10 ** lrExp;
  const epochs = Math.round(10 ** epExp);

  const train = () => {
    const n = new SmallNet(seed);
    n.train(X, Y, lr, epochs);
    setNet(n);
    setTrained(true);
    setOne(null);
  };
  const restart = () => {
    const s = Math.floor(Math.random() * 1e6);
    setSeed(s);
    setNet(new SmallNet(s));
    setTrained(false);
    setOne(null);
  };
  const doOne = () => {
    const before = netParamsOf(net);
    const { params, grads } = sgdStep(before, X[pickIdx], Y[pickIdx], lr);
    const after = gradients(params, X[pickIdx], Y[pickIdx]);
    setOne({ idx: pickIdx, before, after: params, lr, lossB: grads.loss, lossA: after.loss, outB: grads.out, outA: after.out, grads });
    setNet(withParams(params, net.lossHistory));
  };

  useEffect(() => {
    const cv = canvas.current;
    const c = cv?.getContext("2d");
    if (!cv || !c) return;
    const W = cv.width;
    const H = cv.height;
    const img = c.createImageData(W, H);
    const female = [59, 130, 246];
    const male = [245, 158, 11];
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const o = net.forward([px / (W - 1), 1 - py / (H - 1)]).out;
        const k = (py * W + px) * 4;
        img.data[k] = female[0] * (1 - o) + male[0] * o;
        img.data[k + 1] = female[1] * (1 - o) + male[1] * o;
        img.data[k + 2] = female[2] * (1 - o) + male[2] * o;
        img.data[k + 3] = dark ? 150 : 120;
      }
    }
    c.fillStyle = dark ? "#181c30" : "#ffffff";
    c.fillRect(0, 0, W, H);
    c.putImageData(img, 0, 0);
    const P = (x: number[]) => [x[0] * (W - 1), (1 - x[1]) * (H - 1)];
    X.forEach((x, i) => {
      const [p, q] = P(x);
      c.beginPath();
      c.arc(p, q, 6, 0, 7);
      c.fillStyle = Y[i] ? "#b45309" : "#1d4ed8";
      c.fill();
      c.lineWidth = i === pickIdx ? 4 : 2;
      c.strokeStyle = i === pickIdx ? (dark ? "#fff" : "#111") : "#fff";
      c.stroke();
    });
    const [sx, sy] = P(NAME5);
    c.fillStyle = dark ? "#fff" : "#111";
    c.strokeStyle = dark ? "#111" : "#fff";
    c.lineWidth = 2;
    c.beginPath();
    for (let k = 0; k < 10; k++) {
      const rr = k % 2 ? 6 : 14;
      const a = (Math.PI * k) / 5 - Math.PI / 2;
      c.lineTo(sx + rr * Math.cos(a), sy + rr * Math.sin(a));
    }
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = canvasColor("muted");
    c.font = "12px system-ui";
    c.fillText(t("lab1.tr.canvasW"), 6, 14);
    c.fillText(t("lab1.tr.canvasH"), W - 62, H - 6);
  }, [net, dark, pickIdx, t]);

  const hist = net.lossHistory;
  const mx = Math.max(0.3, ...hist);
  const o5 = net.forward(NAME5).out;
  const acc = net.accuracy(X, Y);
  const path = hist.map((l, i) => `${i ? "L" : "M"}${40 + (i / Math.max(hist.length - 1, 1)) * 370},${290 - (l / mx) * 250}`).join("");
  const pred = Number.isFinite(height) && Number.isFinite(weight) ? predictRaw(netParamsOf(net), height, weight, HS, WS) : null;
  const outside = !!pred && (height < HS.min || height > HS.max || weight < WS.min || weight > WS.max);
  const names = [`${t("lab1.net.svg.height")}→h1`, `${t("lab1.net.svg.weight")}→h1`, `${t("lab1.net.svg.height")}→h2`, `${t("lab1.net.svg.weight")}→h2`, "bias h1", "bias h2", "h1→out", "h2→out", "bias out"];
  const flat = (p: NetParams) => [p.w1[0][0], p.w1[1][0], p.w1[0][1], p.w1[1][1], p.b1[0], p.b1[1], p.w2[0], p.w2[1], p.b2];
  const flatG = (g: ReturnType<typeof gradients>) => [g.gw1[0][0], g.gw1[1][0], g.gw1[0][1], g.gw1[1][1], g.gb1[0], g.gb1[1], g.gw2[0], g.gw2[1], g.gb2];

  return (
    <>
      <Demo title={t("lab1.tr.title")}>
        <Controls>
          <Slider id="tr-lr" label={t("lab1.tr.lr")} min={-2} max={0.35} step={0.05} value={lrExp} onChange={setLrExp} format={() => f2(lr, 3)} />
          <Slider id="tr-ep" label={t("lab1.tr.epochs")} min={0} max={3.4} step={0.05} value={epExp} onChange={setEpExp} format={() => String(epochs)} />
          <button className="btn-primary" onClick={train}>{t("lab1.tr.train")}</button>
          <button className="btn-ghost" onClick={restart}>{t("lab1.tr.restart")}</button>
        </Controls>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <canvas ref={canvas} width={280} height={214} className="w-full rounded-xl border border-line" role="img" aria-label={t("lab1.tr.canvasAria")} />
            <Legend items={[{ color: "#3b82f6", label: t("lab1.tr.leg.f") }, { color: "#f59e0b", label: t("lab1.tr.leg.m") }, { color: col("muted"), label: t("lab1.tr.leg.k") }]} />
          </div>
          <svg viewBox="0 0 420 320" className="w-full" role="img" aria-label={t("lab1.tr.lossAria")}>
            <text x="14" y="18" fontSize="12" style={{ fill: col("muted") }}>{t("lab1.tr.lossTitle")}</text>
            <g style={{ stroke: col("line") }}><line x1="40" y1="30" x2="40" y2="290" /><line x1="40" y1="290" x2="410" y2="290" /></g>
            {hist.length ? (
              <>
                <path d={path} fill="none" strokeWidth="2.5" style={{ stroke: col("brand") }} />
                <text x="36" y="40" textAnchor="end" fontSize="11" style={{ fill: col("muted") }}>{f2(mx, 2)}</text>
                <text x="36" y="290" textAnchor="end" fontSize="11" style={{ fill: col("muted") }}>0</text>
                <text x="410" y="306" textAnchor="end" fontSize="11" style={{ fill: col("muted") }}>{t("lab1.tr.epochsAxis", undefined, { n: hist.length })}</text>
              </>
            ) : (
              <text x="225" y="160" textAnchor="middle" fontSize="13" style={{ fill: col("muted") }}>{t("lab1.tr.pressTrain")}</text>
            )}
          </svg>
        </div>
        <Out>
          {trained ? "" : t("lab1.tr.untrained")}
          {r("lab1.tr.out", { o: f2(o5, 4), c: o5 > 0.5 ? t("lab1.net.tr.male") : t("lab1.net.tr.female"), acc: f2(acc * 100, 0) })}
          {hist.length ? r("lab1.tr.final", { l: f2(hist[hist.length - 1], 5) }) : null}
        </Out>
        <Callout title={t("lab1.tr.lookTitle")}>{t("lab1.tr.look")}</Callout>
      </Demo>

      <Demo title={t("lab1.tr.pred.title")}>
        <p className="text-sm text-muted">{r("lab1.tr.pred.intro")}</p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <NumInput id="tr-ph" label={t("lab1.tr.pred.h")} value={height} onChange={setHeight} min={100} max={230} className="w-32" />
          <NumInput id="tr-pw" label={t("lab1.tr.pred.w")} value={weight} onChange={setWeight} min={30} max={200} className="w-32" />
          <button className="btn-ghost !text-xs" onClick={() => { setHeight(158); setWeight(54); }}>{t("lab1.tr.pred.name5")}</button>
        </div>
        {pred ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm" role="status">
              {r("lab1.tr.pred.result", { x1: f2(pred.x[0], 3), x2: f2(pred.x[1], 3), p: f2(pred.pMale, 4), c: pred.label === "male" ? t("lab1.net.tr.male") : t("lab1.net.tr.female") })}
            </p>
            <div className="flex h-5 overflow-hidden rounded-full border border-line text-[11px] font-semibold text-white" role="img" aria-label={`${t("lab1.tr.pred.pf")} ${f2(pred.pFemale * 100, 1)}%, ${t("lab1.tr.pred.pm")} ${f2(pred.pMale * 100, 1)}%`}>
              <div className="grid place-items-center bg-[#3b82f6]" style={{ width: `${pred.pFemale * 100}%` }}>{pred.pFemale > 0.18 ? `${f2(pred.pFemale * 100, 0)}%` : ""}</div>
              <div className="grid place-items-center bg-[#d97706]" style={{ width: `${pred.pMale * 100}%` }}>{pred.pMale > 0.18 ? `${f2(pred.pMale * 100, 0)}%` : ""}</div>
            </div>
            <p className="text-xs text-muted">{t("lab1.tr.pred.pf")} {f2(pred.pFemale * 100, 1)}% · {t("lab1.tr.pred.pm")} {f2(pred.pMale * 100, 1)}%</p>
            {!trained && <p className="text-sm text-c-amber">{t("lab1.tr.pred.untrained")}</p>}
            {outside && <p className="text-sm text-c-amber">{t("lab1.tr.pred.outside")}</p>}
          </div>
        ) : <p className="mt-3 text-sm text-bad">{t("lab1.tr.pred.invalid")}</p>}
      </Demo>

      <Demo title={t("lab1.tr.one.title")}>
        <p className="text-sm text-muted">{r("lab1.tr.one.intro")}</p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="tr-one" className="label">{t("lab1.net.tr.patient")}</label>
            <select id="tr-one" className="field !py-1" value={pickIdx} onChange={(e) => setPickIdx(Number(e.target.value))}>
              {IDX.map((n, i) => <option key={n} value={i}>#{n} · {HEIGHTS[n - 1]} cm, {WEIGHTS[n - 1]} kg · {Y[i] ? t("lab1.net.tr.male") : t("lab1.net.tr.female")}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={doOne}>{t("lab1.tr.one.btn")}</button>
        </div>
        {one ? (
          <div className="mt-3 space-y-2">
            <ScrollTable label={t("lab1.tr.one.tableLabel")}>
              <table className="w-full text-sm">
                <thead><tr><th scope="col" className={th}>{t("lab1.tr.one.param")}</th><th scope="col" className={th}>{t("lab1.tr.one.before")}</th><th scope="col" className={th}>{t("lab1.tr.one.grad")}</th><th scope="col" className={th}>{t("lab1.tr.one.after")}</th></tr></thead>
                <tbody>
                  {flat(one.before).map((v, i) => (
                    <tr key={i}>
                      <td className={td}>{names[i]}</td>
                      <td className={`${td} font-mono`}>{f2(v, 4)}</td>
                      <td className={`${td} font-mono`}>{f2(flatG(one.grads)[i], 4)}</td>
                      <td className={`${td} font-mono font-semibold`}>{f2(flat(one.after)[i], 4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollTable>
            <Calc>{`new = old − lr · gradient   (lr = ${f2(one.lr, 3)})`}</Calc>
            <p className="text-sm" role="status">{r("lab1.tr.one.loss", { a: f2(one.lossB, 5), b: f2(one.lossA, 5), oa: f2(one.outB, 4), ob: f2(one.outA, 4), y: Y[one.idx] })}</p>
          </div>
        ) : <p className="mt-3 text-sm text-muted">{t("lab1.tr.one.none")}</p>}
      </Demo>
    </>
  );
}

function Hill() {
  const t = useT();
  const r = useRich();
  const [lr, setLr] = useState(0.2);
  const pts = useMemo(() => {
    let wv = 4;
    const p = [wv];
    for (let i = 0; i < 10; i++) {
      wv -= lr * 2 * wv;
      p.push(wv);
    }
    return p;
  }, [lr]);
  const X = (v: number) => 360 + v * 60;
  const Y = (l: number) => 210 - Math.min(l, 16) * 12;
  const curve = Array.from({ length: 101 }, (_, i) => {
    const v = -5 + i * 0.1;
    return `${i ? "L" : "M"}${X(v)},${Y(v * v)}`;
  }).join("");
  const last = pts[pts.length - 1];
  return (
    <Demo title={t("lab1.tr.hill.title")}>
      <p className="text-sm text-muted">{t("lab1.tr.hill.intro")}</p>
      <div className="mt-3"><Controls><Slider id="hl-lr" label={t("lab1.tr.lr")} min={0.02} max={1.1} step={0.01} value={lr} onChange={setLr} format={(v) => f2(v, 2)} /></Controls></div>
      <svg viewBox="0 0 720 230" className="w-full" role="img" aria-label={t("lab1.tr.hill.aria")}>
        <path d={curve} fill="none" strokeWidth="2" style={{ stroke: col("muted") }} />
        <line x1="30" x2="690" y1="212" y2="212" style={{ stroke: col("line") }} />
        {pts.map((p, i) => {
          if (Math.abs(p) > 5.3) return null;
          const prev = pts[i - 1];
          return (
            <g key={i}>
              {i > 0 && Math.abs(prev) <= 5.3 && <line x1={X(prev)} y1={Y(prev * prev)} x2={X(p)} y2={Y(p * p)} opacity=".6" style={{ stroke: col("bad") }} />}
              <circle cx={X(p)} cy={Y(p * p)} r={i === 0 ? 8 : 5} style={{ fill: i === 0 ? col("ok") : col("bad") }} />
            </g>
          );
        })}
      </svg>
      <Out>
        {Math.abs(last) > 4.5 ? r("lab1.tr.hill.div", { w: f2(last, 1) })
          : Math.abs(last) < 0.05 ? r("lab1.tr.hill.conv", { w: f2(last, 4) })
          : r("lab1.tr.hill.slow", { w: f2(last, 2) })}
      </Out>
      <p className="mt-3 text-xs font-semibold text-muted">{t("lab1.tr.hill.calc")}</p>
      <div className="mt-1 space-y-1.5">
        {[1, 2, 3].map((i) => (
          <Calc key={i}>{`w${i} = w${i - 1} − lr·2·w${i - 1} = ${f2(pts[i - 1], 3)} − ${f2(lr, 2)}·2·${f2(pts[i - 1], 3)} = ${f2(pts[i], 3)}`}</Calc>
        ))}
      </div>
    </Demo>
  );
}

export default function Train() {
  const t = useT();
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("lab1.tr.intro")}</p>
      <Trainer />
      <Hill />
    </div>
  );
}
