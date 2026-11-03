import { CURVE, MODELS, SUBSETS } from "./data";
import { byTag } from "../../labs/lab3/expMath";
import { BarList, FAM_COLOR, FAM_KEY, FamilyLegend, pct } from "../../labs/lab3/experiment/shared";
import { useTx } from "../../labs/lab3/rich";
import { OriginalFigure } from "./ui";

const sorted = MODELS.slice().sort((a, b) => b.accuracy - a.accuracy);

/** Fig. 3: test accuracy of all models, coloured by family (native, from the Lab 3 data module). */
export function Fig3() {
  const tx = useTx();
  return (
    <div>
      <BarList
        label={tx("tp.f3.alt")}
        min={70}
        max={95}
        rows={sorted.map((m) => ({ key: m.tag, label: m.name, value: m.accuracy * 100, text: `${pct(m.accuracy, 1)} %`, color: FAM_COLOR[m.family] }))}
      />
      <FamilyLegend />
      <p className="mt-2 text-xs leading-relaxed text-muted">{tx("tp.f3.note")}</p>
      <OriginalFigure src="/transformers/fig3-accuracy.png" alt={tx("tp.f3.orig")} width={1100} height={580} />
    </div>
  );
}

const W = 440, H = 360, L = 46, R = 14, T = 12, B = 44;

/** Fig. 4: accuracy against inference latency, bubble area proportional to the number of parameters. */
export function Fig4() {
  const tx = useTx();
  const lx0 = Math.log10(0.03), lx1 = Math.log10(200);
  const xs = (ms: number) => L + ((Math.log10(ms) - lx0) / (lx1 - lx0)) * (W - L - R);
  const y0 = 74, y1 = 94;
  const ys = (a: number) => T + (1 - (a * 100 - y0) / (y1 - y0)) * (H - T - B);
  const maxP = Math.max(...MODELS.map((m) => m.params));
  const rad = (p: number) => Math.max(3.5, 22 * Math.sqrt(p / maxP));
  type Pos = "left" | "right" | "above" | "below";
  const label: Record<string, { pos: Pos; text?: string }> = {
    pt_distilbert_sst2: { pos: "left" },
    ft_distilbert_8000: { pos: "left" },
    pt_twitter_roberta: { pos: "left" },
    "ft_bert-small_8000": { pos: "left" },
    "ft_bert-tiny_8000": { pos: "right" },
    zs_nli_distilroberta: { pos: "left" },
    bilstm: { pos: "below" },
    tfidf_svm: { pos: "above", text: "TF-IDF NB / LR / SVM" },
  };
  const place = (m: (typeof MODELS)[number], pos: Pos) => {
    const r = rad(m.params), x = xs(m.latencyMs), y = ys(m.accuracy);
    if (pos === "left") return { x: x - r - 6, y: y + 4, anchor: "end" as const };
    if (pos === "right") return { x: x + r + 6, y: y + 4, anchor: "start" as const };
    if (pos === "above") return { x: x - 4, y: y - r - 8, anchor: "start" as const };
    return { x, y: y + r + 15, anchor: "middle" as const };
  };
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={tx("tp.f4.alt")} className="mx-auto block h-auto w-full max-w-[560px]" data-testid="f4-chart">
        {[75, 80, 85, 90].map((a) => (
          <g key={a}>
            <line x1={L} x2={W - R} y1={ys(a / 100)} y2={ys(a / 100)} stroke="rgb(var(--line))" />
            <text x={L - 6} y={ys(a / 100) + 4} textAnchor="end" fontSize="11" fill="rgb(var(--muted))">{a}</text>
          </g>
        ))}
        {[0.05, 0.1, 1, 10, 100].map((ms) => (
          <g key={ms}>
            <line x1={xs(ms)} x2={xs(ms)} y1={T} y2={H - B} stroke="rgb(var(--line))" />
            <text x={xs(ms)} y={H - B + 15} textAnchor="middle" fontSize="11" fill="rgb(var(--muted))">{ms}</text>
          </g>
        ))}
        <text x={(L + W - R) / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="rgb(var(--muted))">{tx("tp.f4.x")}</text>
        <text transform={`translate(12 ${(T + H - B) / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" fill="rgb(var(--muted))">{tx("tp.f4.y")}</text>
        {MODELS.map((m) => (
          <circle key={m.tag} cx={xs(m.latencyMs)} cy={ys(m.accuracy)} r={rad(m.params)} fill={FAM_COLOR[m.family]} fillOpacity="0.55" stroke={FAM_COLOR[m.family]} strokeWidth="1.5">
            <title>{`${m.name}: ${pct(m.accuracy, 1)} %, ${m.latencyMs < 1 ? m.latencyMs.toFixed(3) : m.latencyMs.toFixed(1)} ms`}</title>
          </circle>
        ))}
        {MODELS.map((m) => {
          const l = label[m.tag];
          if (!l) return null;
          const p = place(m, l.pos);
          return <text key={m.tag} x={p.x} y={p.y} textAnchor={p.anchor} fontSize="11" fontWeight="600" fill="rgb(var(--ink))">{l.text ?? m.short}</text>;
        })}
      </svg>
      <FamilyLegend />
      <p className="mt-2 text-xs leading-relaxed text-muted">{tx("tp.f4.note")}</p>
      <OriginalFigure src="/transformers/fig4-latency.png" alt={tx("tp.f4.orig")} width={1100} height={611} />
    </div>
  );
}

/** Fig. 5: learning curves of BERT-small and TF-IDF + logistic regression on the same subsets. */
export function Fig5() {
  const tx = useTx();
  const x0 = Math.log(500), x1 = Math.log(8000), y0 = 56, y1 = 90;
  const xs = (n: number) => L + ((Math.log(n) - x0) / (x1 - x0)) * (W - L - R - 8);
  const ys = (a: number) => T + (1 - (a * 100 - y0) / (y1 - y0)) * (H - T - B);
  const path = (pts: { n: number; accuracy: number }[]) => pts.map((p, i) => `${i ? "L" : "M"}${xs(p.n).toFixed(1)} ${ys(p.accuracy).toFixed(1)}`).join(" ");
  const svm = byTag("tfidf_svm").accuracy;
  const BS = "rgb(var(--ok))", LR = "rgb(var(--pos))";
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={tx("tp.f5.alt")} className="mx-auto block h-auto w-full max-w-[560px]" data-testid="f5-chart">
        {[60, 65, 70, 75, 80, 85, 90].map((a) => (
          <g key={a}>
            <line x1={L} x2={W - R} y1={ys(a / 100)} y2={ys(a / 100)} stroke="rgb(var(--line))" />
            <text x={L - 6} y={ys(a / 100) + 4} textAnchor="end" fontSize="11" fill="rgb(var(--muted))">{a}</text>
          </g>
        ))}
        {CURVE["bert-small"].map((p) => (
          <g key={p.n}>
            <line x1={xs(p.n)} x2={xs(p.n)} y1={T} y2={H - B} stroke="rgb(var(--line))" />
            <text x={xs(p.n)} y={H - B + 15} textAnchor="middle" fontSize="11" fill="rgb(var(--muted))">{p.n}</text>
          </g>
        ))}
        <text x={(L + W - R) / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="rgb(var(--muted))">{tx("tp.f5.x")}</text>
        <text transform={`translate(12 ${(T + H - B) / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" fill="rgb(var(--muted))">{tx("tp.f5.y")}</text>
        <line x1={L} x2={W - R} y1={ys(svm)} y2={ys(svm)} stroke="rgb(var(--c-amber))" strokeWidth="1.5" strokeDasharray="6 4" />
        <text x={L + 6} y={ys(svm) - 6} textAnchor="start" fontSize="11" fill="rgb(var(--c-amber))">{tx("tp.f5.svm", { acc: pct(svm, 1) })}</text>
        <path d={path(CURVE["tfidf-lr"])} fill="none" stroke={LR} strokeWidth="2.5" />
        <path d={path(CURVE["bert-small"])} fill="none" stroke={BS} strokeWidth="2.5" />
        {CURVE["tfidf-lr"].map((p) => <circle key={p.n} cx={xs(p.n)} cy={ys(p.accuracy)} r="4.5" fill={LR} stroke="rgb(var(--surface))" strokeWidth="1.5" />)}
        {CURVE["bert-small"].map((p) => <circle key={p.n} cx={xs(p.n)} cy={ys(p.accuracy)} r="4.5" fill={BS} stroke="rgb(var(--surface))" strokeWidth="1.5" />)}
        <text x={xs(500) + 10} y={ys(CURVE["bert-small"][0].accuracy) + 20} fontSize="12" fontWeight="600" fill={BS}>BERT-small</text>
        <text x={xs(500) + 10} y={ys(CURVE["tfidf-lr"][0].accuracy) + 4} fontSize="12" fontWeight="600" fill={LR}>TF-IDF + LR</text>
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted" aria-label={tx("lab3.e.x.legend")}>
        <li className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: BS }} />BERT-small</li>
        <li className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: LR }} />TF-IDF + LR</li>
        <li className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: "rgb(var(--c-amber))" }} />{tx("tp.f5.svmLegend")}</li>
      </ul>
      <p className="mt-2 text-xs leading-relaxed text-muted">{tx("tp.f5.note")}</p>
      <OriginalFigure src="/transformers/fig5-curves.png" alt={tx("tp.f5.orig")} width={1100} height={618} />
    </div>
  );
}

/** Fig. 6: accuracy on all sentences and on the negation and contrast subsets, one group of three bars per model. */
export function Fig6() {
  const tx = useTx();
  const rows = MODELS.slice().sort((a, b) => b.accuracy - a.accuracy);
  const metric = ["all", "negation", "contrast"] as const;
  const colour = { all: "rgb(var(--muted))", negation: "rgb(var(--neg))", contrast: "rgb(var(--c-purple))" } as const;
  const lo = 60, hi = 95;
  return (
    <div>
      <ul className="space-y-2.5" aria-label={tx("tp.f6.alt")} data-testid="f6-chart">
        {rows.map((m) => (
          <li key={m.tag} className="grid items-center gap-x-3 gap-y-1 sm:grid-cols-[13rem_1fr]">
            <span className="min-w-0 truncate text-sm sm:text-right" title={m.name}>{m.name}</span>
            <span className="space-y-0.5">
              {metric.map((k) => {
                const v = SUBSETS[m.tag][k] * 100;
                return (
                  <span key={k} className="grid grid-cols-[5.4rem_1fr_2.6rem] items-center gap-2 text-xs">
                    <span className="truncate text-muted" title={tx(`tp.f6.${k}`)}>{tx(`tp.f6.${k}`)}</span>
                    <span className="h-3 overflow-hidden rounded bg-raised" aria-hidden><span className="block h-full rounded" style={{ width: `${Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100))}%`, background: colour[k] }} /></span>
                    <span className="text-right font-mono">{v.toFixed(1)}</span>
                  </span>
                );
              })}
            </span>
          </li>
        ))}
      </ul>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted" aria-label={tx("lab3.e.x.legend")}>
        {metric.map((k) => <li key={k} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: colour[k] }} />{tx(`tp.f6.${k}`)}</li>)}
      </ul>
      <p className="mt-2 text-xs leading-relaxed text-muted">{tx("tp.f6.note")}</p>
      <OriginalFigure src="/transformers/fig6-subsets.png" alt={tx("tp.f6.orig")} width={1100} height={794} />
    </div>
  );
}

/** Fig. 7: the recorded attention picture of the paper, with the Jain and Wallace caution. */
export function Fig7() {
  const tx = useTx();
  return (
    <div>
      <img src="/lab3/attention-fig7.png" alt={tx("tp.f7.alt")} width={1400} height={1200} loading="lazy" className="mx-auto h-auto w-full max-w-xl rounded-xl border border-line bg-white" />
      <p className="mt-2 rounded-lg border border-c-amber/60 bg-raised/50 px-3 py-1.5 text-xs leading-relaxed text-c-amber">{tx("tp.f7.caution")}</p>
    </div>
  );
}

export { FAM_COLOR, FAM_KEY };
