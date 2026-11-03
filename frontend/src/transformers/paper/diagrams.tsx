import { useState, type ReactNode } from "react";
import { useR, useTx } from "../../labs/lab3/rich";
import { OriginalFigure } from "./ui";

/** Theme tokens used by the diagrams: every colour is a CSS variable, so light, dark and print all work. */
export type Tone = "classical" | "recurrent" | "transformer" | "curve" | "attention" | "neutral" | "brand" | "orange";
const TONE: Record<Tone, string> = { classical: "pos", recurrent: "neg", transformer: "ok", curve: "c-purple", attention: "c-amber", neutral: "muted", brand: "brand", orange: "neg" };

export interface DNode { id: string; x: number; y: number; w: number; h: number; tone: Tone; lines: string[]; bold?: boolean }

const ink = { fill: "rgb(var(--ink))" };
const stroke = (tone: Tone) => `rgb(var(--${TONE[tone]}))`;
const fill = (tone: Tone) => (tone === "neutral" ? "rgb(var(--raised))" : `rgb(var(--${TONE[tone]}) / 0.16)`);

/** One clickable node (an SVG group with a button role, reachable with the keyboard). */
function Node({ n, sel, onPick, label }: { n: DNode; sel: boolean; onPick: (id: string) => void; label: string }) {
  const lh = 15;
  const y0 = n.y + n.h / 2 - ((n.lines.length - 1) * lh) / 2 + 4;
  return (
    <g
      role="button"
      tabIndex={0}
      aria-pressed={sel}
      aria-label={label}
      className="tp-node cursor-pointer outline-none"
      data-node={n.id}
      onClick={() => onPick(n.id)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(n.id); } }}
    >
      <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={9} fill={fill(n.tone)} stroke={stroke(n.tone)} strokeWidth={sel ? 3 : 1.6} />
      {n.lines.map((l, i) => (
        <text key={i} x={n.x + n.w / 2} y={y0 + i * lh} textAnchor="middle" fontSize={i === 0 ? 12.5 : 11.5} fontWeight={n.bold || i === 0 ? 600 : 400} style={ink}>{l}</text>
      ))}
    </g>
  );
}

/** Arrow-head marker shared by the diagrams. */
function Defs({ id }: { id: string }) {
  return (
    <defs>
      <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="rgb(var(--muted))" /></marker>
      <marker id={`${id}-o`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="rgb(var(--neg))" /></marker>
    </defs>
  );
}
const ARROW = { stroke: "rgb(var(--muted))", strokeWidth: 1.6, fill: "none" } as const;

export interface DDetail { id: string; titleKey: string; bodyKey: string; to?: { hash: string; labelKey: string }[] }

/** A diagram plus the panel that explains the node you picked. */
function Diagram({ vb, nodes, children, alt, desc, details, marker, original }: {
  vb: [number, number]; nodes: DNode[]; children: ReactNode; alt: string; desc: string; details: DDetail[]; marker: string;
  original: { src: string; alt: string; w: number; h: number };
}) {
  const tx = useTx();
  const r = useR();
  const [sel, setSel] = useState(details[0].id);
  const d = details.find((x) => x.id === sel) ?? details[0];
  return (
    <div>
      <svg viewBox={`0 0 ${vb[0]} ${vb[1]}`} role="group" aria-label={alt} className="mx-auto block h-auto w-full max-w-[460px]" fontFamily="Inter, ui-sans-serif, system-ui, sans-serif">
        <title>{alt}</title>
        <desc>{desc}</desc>
        <Defs id={marker} />
        {children}
        {nodes.map((n) => <Node key={n.id} n={n} sel={n.id === sel} onPick={setSel} label={`${n.lines.join(", ")}: ${tx("tp.ui.nodeHint")}`} />)}
      </svg>
      <p className="tp-noprint mt-1 text-center text-xs text-muted">{tx("tp.ui.nodeHint")}</p>
      <div className="mt-2 rounded-xl border border-line bg-raised/60 p-3 text-sm" role="status" aria-live="polite" data-testid="diagram-detail">
        <p className="font-semibold">{tx(d.titleKey)}</p>
        <p className="mt-1 leading-relaxed text-muted">{r(d.bodyKey)}</p>
        {d.to && (
          <p className="tp-noprint mt-2 flex flex-wrap gap-2">
            {d.to.map((l) => <a key={l.hash} href={`#${l.hash}`} className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs font-medium text-brand hover:bg-raised">{tx(l.labelKey)} →</a>)}
          </p>
        )}
      </div>
      <OriginalFigure src={original.src} alt={original.alt} width={original.w} height={original.h} />
    </div>
  );
}

const arrow = (d: string, m: string, k?: string) => <path key={k ?? d} d={d} {...ARROW} markerEnd={`url(#${m})`} />;

/** Fig. 1: the pipeline of Python modules, redrawn. */
export function Fig1() {
  const tx = useTx();
  const m = "f1a";
  const L = (id: string) => tx(`tp.f1.n.${id}`).split("\n");
  const X = 44, W = 244;
  const nodes: DNode[] = [
    { id: "hub", x: X, y: 6, w: W, h: 40, tone: "neutral", lines: L("hub") },
    { id: "s01", x: X, y: 64, w: W, h: 44, tone: "classical", lines: ["01_prepare_data.py", ...L("s01")] },
    { id: "s02", x: X, y: 130, w: W, h: 48, tone: "classical", lines: ["02_classical_baselines.py", ...L("s02")] },
    { id: "s03", x: X, y: 194, w: W, h: 48, tone: "recurrent", lines: ["03_bilstm.py", ...L("s03")] },
    { id: "s04", x: X, y: 258, w: W, h: 48, tone: "transformer", lines: ["04_finetune_transformer.py", ...L("s04")] },
    { id: "s05", x: X, y: 322, w: W, h: 48, tone: "transformer", lines: ["05_pretrained_transformers.py", ...L("s05")] },
    { id: "s06", x: X, y: 386, w: W, h: 48, tone: "curve", lines: ["06_learning_curve_classical.py", ...L("s06")] },
    { id: "s07", x: X, y: 452, w: W, h: 48, tone: "attention", lines: ["07_attention_visualisation.py", ...L("s07")] },
    { id: "json", x: X, y: 520, w: W, h: 58, tone: "neutral", lines: L("json") },
    { id: "s08", x: X, y: 596, w: W, h: 48, tone: "classical", lines: ["08_report.py", ...L("s08")] },
    { id: "paper", x: X, y: 668, w: W, h: 38, tone: "transformer", lines: L("paper"), bold: true },
  ];
  const mid = (id: string) => { const n = nodes.find((q) => q.id === id)!; return n.y + n.h / 2; };
  const feeders = ["s02", "s03", "s04", "s05", "s06"];
  const details: DDetail[] = [
    { id: "hub", titleKey: "tp.f1.n.hub.t", bodyKey: "tp.f1.d.hub", to: [{ hash: "dataset", labelKey: "tp.f1.to.dataset" }] },
    { id: "s01", titleKey: "tp.f1.t.s01", bodyKey: "tp.f1.d.s01", to: [{ hash: "dataset", labelKey: "tp.f1.to.dataset" }] },
    { id: "s02", titleKey: "tp.f1.t.s02", bodyKey: "tp.f1.d.s02", to: [{ hash: "math", labelKey: "tp.f1.to.math" }, { hash: "competitors", labelKey: "tp.f1.to.competitors" }] },
    { id: "s03", titleKey: "tp.f1.t.s03", bodyKey: "tp.f1.d.s03", to: [{ hash: "math-lstm", labelKey: "tp.f1.to.lstm" }] },
    { id: "s04", titleKey: "tp.f1.t.s04", bodyKey: "tp.f1.d.s04", to: [{ hash: "architecture", labelKey: "tp.f1.to.arch" }, { hash: "math-finetune", labelKey: "tp.f1.to.finetune" }] },
    { id: "s05", titleKey: "tp.f1.t.s05", bodyKey: "tp.f1.d.s05", to: [{ hash: "results-ready", labelKey: "tp.f1.to.ready" }] },
    { id: "s06", titleKey: "tp.f1.t.s06", bodyKey: "tp.f1.d.s06", to: [{ hash: "results-data", labelKey: "tp.f1.to.data" }] },
    { id: "s07", titleKey: "tp.f1.t.s07", bodyKey: "tp.f1.d.s07", to: [{ hash: "results-errors", labelKey: "tp.f1.to.errors" }] },
    { id: "json", titleKey: "tp.f1.t.json", bodyKey: "tp.f1.d.json", to: [{ hash: "program", labelKey: "tp.f1.to.program" }] },
    { id: "s08", titleKey: "tp.f1.t.s08", bodyKey: "tp.f1.d.s08", to: [{ hash: "results-overall", labelKey: "tp.f1.to.overall" }] },
    { id: "paper", titleKey: "tp.f1.t.paper", bodyKey: "tp.f1.d.paper", to: [{ hash: "conclusions", labelKey: "tp.f1.to.concl" }] },
  ];
  return (
    <Diagram
      vb={[334, 712]} nodes={nodes} marker={m} details={details} alt={tx("tp.f1.alt")} desc={tx("tp.f1.desc")}
      original={{ src: "/transformers/fig1-program.png", alt: tx("tp.f1.orig"), w: 1100, h: 665 }}
    >
      {arrow(`M${X + W / 2} 46 V62`, m)}
      <path d={`M${X} 86 H22 V${mid("s06")}`} {...ARROW} />
      {feeders.map((f) => arrow(`M22 ${mid(f)} H${X - 2}`, m, `in-${f}`))}
      {feeders.map((f) => <path key={`out-${f}`} d={`M${X + W} ${mid(f)} H306`} {...ARROW} />)}
      {arrow(`M306 ${mid("s02")} V${mid("json")} H${X + W + 2}`, m, "rail")}
      {arrow(`M${X + W / 2} 578 V594`, m, "j8")}
      {arrow(`M${X + W / 2} 644 V666`, m, "8p")}
      <path d={`M${X + W} ${mid("s07")} H326 V${mid("paper")} H${X + W + 2}`} {...ARROW} strokeDasharray="5 4" markerEnd={`url(#${m})`} />
    </Diagram>
  );
}

/** Fig. 2: the encoder with the classification head, redrawn. */
export function Fig2() {
  const tx = useTx();
  const m = "f2a";
  const L = (id: string) => tx(`tp.f2.n.${id}`).split("\n");
  const X = 56, W = 244;
  const nodes: DNode[] = [
    { id: "out", x: X, y: 6, w: W, h: 36, tone: "transformer", lines: L("out"), bold: true },
    { id: "head", x: X, y: 62, w: W, h: 42, tone: "classical", lines: L("head") },
    { id: "ctx", x: X, y: 124, w: W, h: 40, tone: "neutral", lines: L("ctx") },
    { id: "an2", x: X + 8, y: 198, w: W - 16, h: 34, tone: "orange", lines: L("an") },
    { id: "ffn", x: X + 8, y: 252, w: W - 16, h: 50, tone: "transformer", lines: L("ffn") },
    { id: "an1", x: X + 8, y: 322, w: W - 16, h: 34, tone: "orange", lines: L("an") },
    { id: "mha", x: X + 8, y: 376, w: W - 16, h: 50, tone: "transformer", lines: L("mha") },
    { id: "emb", x: X, y: 470, w: W, h: 40, tone: "classical", lines: L("emb") },
    { id: "inp", x: X, y: 530, w: W, h: 46, tone: "neutral", lines: L("inp") },
  ];
  const cx = X + W / 2;
  const details: DDetail[] = [
    { id: "inp", titleKey: "tp.f2.t.inp", bodyKey: "tp.f2.d.inp", to: [{ hash: "arch-tokens", labelKey: "tp.f2.to.tokens" }] },
    { id: "emb", titleKey: "tp.f2.t.emb", bodyKey: "tp.f2.d.emb", to: [{ hash: "arch-position", labelKey: "tp.f2.to.position" }, { hash: "eq-1", labelKey: "tp.f2.to.eq1" }] },
    { id: "mha", titleKey: "tp.f2.t.mha", bodyKey: "tp.f2.d.mha", to: [{ hash: "arch-attention", labelKey: "tp.f2.to.attention" }, { hash: "arch-heads", labelKey: "tp.f2.to.heads" }] },
    { id: "an1", titleKey: "tp.f2.t.an", bodyKey: "tp.f2.d.an", to: [{ hash: "arch-ffn", labelKey: "tp.f2.to.ffn" }, { hash: "eq-7", labelKey: "tp.f2.to.eq7" }] },
    { id: "ffn", titleKey: "tp.f2.t.ffn", bodyKey: "tp.f2.d.ffn", to: [{ hash: "arch-ffn", labelKey: "tp.f2.to.ffn" }, { hash: "eq-6", labelKey: "tp.f2.to.eq6" }] },
    { id: "an2", titleKey: "tp.f2.t.an", bodyKey: "tp.f2.d.an", to: [{ hash: "arch-ffn", labelKey: "tp.f2.to.ffn" }, { hash: "eq-8", labelKey: "tp.f2.to.eq8" }] },
    { id: "ctx", titleKey: "tp.f2.t.ctx", bodyKey: "tp.f2.d.ctx", to: [{ hash: "math-finetune", labelKey: "tp.f2.to.finetune" }] },
    { id: "head", titleKey: "tp.f2.t.head", bodyKey: "tp.f2.d.head", to: [{ hash: "math-finetune", labelKey: "tp.f2.to.finetune" }, { hash: "eq-10", labelKey: "tp.f2.to.eq10" }] },
    { id: "out", titleKey: "tp.f2.t.out", bodyKey: "tp.f2.d.out", to: [{ hash: "math-finetune", labelKey: "tp.f2.to.finetune" }, { hash: "eq-11", labelKey: "tp.f2.to.eq11" }] },
  ];
  const up = (y1: number, y2: number, k: string) => arrow(`M${cx} ${y1} V${y2}`, m, k);
  return (
    <Diagram
      vb={[340, 590]} nodes={nodes} marker={m} details={details} alt={tx("tp.f2.alt")} desc={tx("tp.f2.desc")}
      original={{ src: "/transformers/fig2-encoder.png", alt: tx("tp.f2.orig"), w: 1100, h: 1312 }}
    >
      <rect x="12" y="180" width="316" height="262" rx="14" fill="none" stroke="rgb(var(--pos))" strokeWidth="1.8" strokeDasharray="7 5" />
      <text x="322" y="436" textAnchor="end" fontSize="12.5" fontWeight="700" style={{ fill: "rgb(var(--pos))" }}>{tx("tp.f2.layers")}</text>
      {up(530, 512, "a1")}
      {up(470, 428, "a2")}
      {up(376, 358, "a3")}
      {up(322, 304, "a4")}
      {up(252, 234, "a5")}
      {up(198, 166, "a6")}
      {up(124, 106, "a7")}
      {up(62, 44, "a8")}
      <path d="M36 436 V339 H62" {...ARROW} stroke="rgb(var(--neg))" markerEnd={`url(#${m}-o)`} />
      <path d="M36 312 V215 H62" {...ARROW} stroke="rgb(var(--neg))" markerEnd={`url(#${m}-o)`} />
      <text transform="translate(28 388) rotate(-90)" textAnchor="middle" fontSize="10.5" style={{ fill: "rgb(var(--neg))" }}>{tx("tp.f2.residual")}</text>
      <text transform="translate(28 264) rotate(-90)" textAnchor="middle" fontSize="10.5" style={{ fill: "rgb(var(--neg))" }}>{tx("tp.f2.residual")}</text>
    </Diagram>
  );
}
