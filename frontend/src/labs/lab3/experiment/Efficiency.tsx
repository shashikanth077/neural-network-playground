import { useState } from "react";
import { Callout, Demo, Slider } from "../../ui";
import { CURVE, LC_TIME } from "../data/expModels";
import { byTag, curveAt, fmtDuration, labelsToReach, lcTrainSeconds } from "../expMath";
import { useR, useTx } from "../rich";
import { fmtInt, pct } from "./shared";

const W = 680, H = 360, L = 52, R = 24, T = 16, B = 44;
const X0 = Math.log(500), X1 = Math.log(8000), Y0 = 56, Y1 = 92;
const xs = (n: number) => L + ((Math.log(n) - X0) / (X1 - X0)) * (W - L - R);
const ys = (a: number) => T + (1 - (a * 100 - Y0) / (Y1 - Y0)) * (H - T - B);
const POS = "rgb(var(--ok))", LR = "rgb(var(--pos))";
const path = (pts: { n: number; accuracy: number }[]) => pts.map((p, i) => `${i ? "L" : "M"}${xs(p.n).toFixed(1)} ${ys(p.accuracy).toFixed(1)}`).join(" ");
/** Slider position 0..100 -> labelled sentences 500..8000 (log scale, like the chart axis). */
const sliderToN = (v: number) => Math.round(500 * Math.pow(16, v / 100));
const nToSlider = (n: number) => (Math.log(n / 500) / Math.log(16)) * 100;

export default function Efficiency() {
  const r = useR();
  const tx = useTx();
  const [v, setV] = useState(nToSlider(2000));
  const n = sliderToN(v);
  const bert = curveAt("bert-small", n), lr = curveAt("tfidf-lr", n);
  const measured = CURVE["bert-small"].some((p) => p.n === n);
  const svm = byTag("tfidf_svm");
  const need = labelsToReach("bert-small", svm.accuracy);
  const gain = (k: number) => ((curveAt("bert-small", k) - curveAt("tfidf-lr", k)) * 100).toFixed(1);
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{r("lab3.e.ef.lead")}</p>
      <Demo title={tx("lab3.e.ef.chart.title")}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={tx("lab3.e.ef.chart.alt")} className="w-full" data-testid="ef-chart">
          {[60, 65, 70, 75, 80, 85, 90].map((a) => (
            <g key={a}>
              <line x1={L} x2={W - R} y1={ys(a / 100)} y2={ys(a / 100)} stroke="rgb(var(--line))" />
              <text x={L - 8} y={ys(a / 100) + 4} textAnchor="end" fontSize="11" fill="rgb(var(--muted))">{a}</text>
            </g>
          ))}
          {CURVE["bert-small"].map((p) => (
            <g key={p.n}>
              <line x1={xs(p.n)} x2={xs(p.n)} y1={T} y2={H - B} stroke="rgb(var(--line))" />
              <text x={xs(p.n)} y={H - B + 16} textAnchor="middle" fontSize="11" fill="rgb(var(--muted))">{fmtInt(p.n)}</text>
            </g>
          ))}
          <text x={(L + W - R) / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="rgb(var(--muted))">{tx("lab3.e.ef.chart.x")}</text>
          <text transform={`translate(14 ${(T + H - B) / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" fill="rgb(var(--muted))">{tx("lab3.e.ef.chart.y")}</text>
          <line x1={L} x2={W - R} y1={ys(svm.accuracy)} y2={ys(svm.accuracy)} stroke="rgb(var(--c-amber))" strokeWidth="1.5" strokeDasharray="6 4" />
          <text x={W - R - 4} y={ys(svm.accuracy) - 6} textAnchor="end" fontSize="11" fill="rgb(var(--c-amber))">{tx("lab3.e.ef.chart.svm", { acc: pct(svm.accuracy) })}</text>
          <path d={path(CURVE["tfidf-lr"])} fill="none" stroke={LR} strokeWidth="2.5" />
          <path d={path(CURVE["bert-small"])} fill="none" stroke={POS} strokeWidth="2.5" />
          {CURVE["tfidf-lr"].map((p) => <circle key={p.n} cx={xs(p.n)} cy={ys(p.accuracy)} r="4.5" fill={LR} stroke="rgb(var(--surface))" strokeWidth="1.5" />)}
          {CURVE["bert-small"].map((p) => <circle key={p.n} cx={xs(p.n)} cy={ys(p.accuracy)} r="4.5" fill={POS} stroke="rgb(var(--surface))" strokeWidth="1.5" />)}
          <line x1={xs(n)} x2={xs(n)} y1={T} y2={H - B} stroke="rgb(var(--brand))" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx={xs(n)} cy={ys(bert)} r="6" fill="none" stroke="rgb(var(--brand))" strokeWidth="2.5" />
          <circle cx={xs(n)} cy={ys(lr)} r="6" fill="none" stroke="rgb(var(--brand))" strokeWidth="2.5" />
          <text x={xs(8000) - 8} y={ys(CURVE["bert-small"][4].accuracy) - 10} textAnchor="end" fontSize="12" fontWeight="600" fill={POS}>BERT-small</text>
          <text x={xs(8000) - 8} y={ys(CURVE["tfidf-lr"][4].accuracy) + 20} textAnchor="end" fontSize="12" fontWeight="600" fill={LR}>TF-IDF + LR</text>
        </svg>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted" aria-label={tx("lab3.e.x.legend")}>
          <li className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: POS }} />BERT-small ({tx("lab3.e.ef.ft")})</li>
          <li className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: LR }} />TF-IDF + {tx("lab3.e.ef.lr")}</li>
          <li className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 bg-c-amber" />{tx("lab3.e.ef.svmLegend")}</li>
        </ul>
      </Demo>

      <Demo title={tx("lab3.e.ef.slider.title")}>
        <Slider id="ef-n" label={tx("lab3.e.ef.slider.label")} min={0} max={100} step={0.5} value={v} onChange={setV} format={() => fmtInt(n)} />
        <div role="status" aria-live="polite" className="mt-3 grid gap-2 rounded-xl border border-line bg-raised/70 p-3 text-sm sm:grid-cols-4" data-testid="ef-out">
          <p><span className="block text-xs text-muted">BERT-small</span><b className="font-mono text-base" data-testid="ef-bert">{pct(bert, 1)} %</b></p>
          <p><span className="block text-xs text-muted">TF-IDF + {tx("lab3.e.ef.lr")}</span><b className="font-mono text-base" data-testid="ef-lr">{pct(lr, 1)} %</b></p>
          <p><span className="block text-xs text-muted">{tx("lab3.e.ef.diff")}</span><b className="font-mono text-base text-ok" data-testid="ef-diff">+{((bert - lr) * 100).toFixed(1)} {tx("lab3.e.ef.pp")}</b></p>
          <p><span className="block text-xs text-muted">{tx("lab3.e.ef.time")}</span><b className="font-mono text-base">{fmtDuration(lcTrainSeconds(n))}</b></p>
        </div>
        <p className="mt-2 text-xs text-muted" data-testid="ef-basis">{tx(measured ? "lab3.e.ef.measured" : "lab3.e.ef.interp")}</p>
      </Demo>

      <Demo title={tx("lab3.e.ef.table.title")}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] text-sm" aria-label={tx("lab3.e.ef.table.title")} data-testid="ef-table">
            <thead>
              <tr className="text-left text-muted">
                <th scope="col" className="border-b border-line px-2 py-1.5 text-right">{tx("lab3.e.ef.table.n")}</th>
                <th scope="col" className="border-b border-line px-2 py-1.5 text-right">BERT-small</th>
                <th scope="col" className="border-b border-line px-2 py-1.5 text-right">TF-IDF + {tx("lab3.e.ef.lr")}</th>
                <th scope="col" className="border-b border-line px-2 py-1.5 text-right">{tx("lab3.e.ef.diff")}</th>
                <th scope="col" className="border-b border-line px-2 py-1.5 text-right">{tx("lab3.e.ef.table.time")}</th>
              </tr>
            </thead>
            <tbody>
              {CURVE["bert-small"].map((p, i) => (
                <tr key={p.n}>
                  <td className="border-b border-line px-2 py-1.5 text-right font-mono">{fmtInt(p.n)}</td>
                  <td className="border-b border-line px-2 py-1.5 text-right font-mono">{pct(p.accuracy, 2)}</td>
                  <td className="border-b border-line px-2 py-1.5 text-right font-mono">{pct(CURVE["tfidf-lr"][i].accuracy, 2)}</td>
                  <td className="border-b border-line px-2 py-1.5 text-right font-mono">+{((p.accuracy - CURVE["tfidf-lr"][i].accuracy) * 100).toFixed(1)}</td>
                  <td className="border-b border-line px-2 py-1.5 text-right font-mono">{fmtDuration(LC_TIME[i].trainSeconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Demo>

      <Demo title={tx("lab3.e.ef.find.title")}>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
          <li>{r("lab3.e.ef.find.0", { g500: gain(500), a: pct(curveAt("bert-small", 500)), b: pct(curveAt("tfidf-lr", 500)) })}</li>
          <li>{r("lab3.e.ef.find.1", { g4: gain(4000), g8: gain(8000) })}</li>
          <li>{r("lab3.e.ef.find.2", { bert: pct(curveAt("bert-small", 4000)), svm: pct(svm.accuracy), x: Math.round(svm.trainSize / 4000) })}</li>
          <li>{r("lab3.e.ef.find.3", { gap: ((byTag("ft_distilbert_8000").accuracy - svm.accuracy) * 100).toFixed(1) })}</li>
          {need && <li>{r("lab3.e.ef.find.4", { n: fmtInt(Math.round(need / 100) * 100) })}</li>}
        </ul>
      </Demo>
      <Callout tone="warn" title={tx("lab3.e.ef.caveat.title")}>{r("lab3.e.ef.caveat.body")}</Callout>
    </div>
  );
}
