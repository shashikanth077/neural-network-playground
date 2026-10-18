import { memo, useMemo, useRef, useState } from "react";
import { activationFill } from "../lib/colors";
import { fmt } from "../lib/format";
import type { ModelConfig, ModelParameters } from "../types";

interface Props {
  config: ModelConfig;
  params: ModelParameters | null;
  activations: number[][] | null;
  status: string | null;
}

const W = 760;
const H = 380;
const PAD_X = 60;
const PAD_Y = 34;

interface Geometry {
  sizes: number[];
  xs: number[];
  ys: (l: number, i: number) => number;
  r: number;
}

function geometry(sizes: number[]): Geometry {
  const xs = sizes.map((_, l) => PAD_X + (l * (W - 2 * PAD_X)) / Math.max(1, sizes.length - 1));
  const maxN = Math.max(...sizes);
  const r = Math.max(4, Math.min(15, (H - 2 * PAD_Y) / maxN / 2.3));
  const ys = (l: number, i: number) => {
    const n = sizes[l];
    const span = H - 2 * PAD_Y;
    return n === 1 ? H / 2 : PAD_Y + (i * span) / (n - 1);
  };
  return { sizes, xs, ys, r };
}

const Connections = memo(function Connections({ geo, params }: { geo: Geometry; params: ModelParameters | null }) {
  const lines = useMemo(() => {
    const out: JSX.Element[] = [];
    const maxAbs = params ? Math.max(1e-9, ...params.layers.flatMap((L) => L.weights.flat().map(Math.abs))) : 1;
    for (let l = 0; l < geo.sizes.length - 1; l++) {
      for (let i = 0; i < geo.sizes[l]; i++) {
        for (let j = 0; j < geo.sizes[l + 1]; j++) {
          const w = params?.layers[l]?.weights[i]?.[j];
          const mag = w === undefined ? 0 : Math.abs(w) / maxAbs;
          out.push(
            <line
              key={`${l}-${i}-${j}`}
              data-l={l} data-i={i} data-j={j}
              x1={geo.xs[l]} y1={geo.ys(l, i)} x2={geo.xs[l + 1]} y2={geo.ys(l + 1, j)}
              strokeDasharray={w !== undefined && w < 0 ? "5 3" : undefined}
              strokeWidth={w === undefined ? 0.8 : 0.5 + 4.5 * mag}
              strokeOpacity={w === undefined ? 0.6 : 0.25 + 0.65 * Math.sqrt(mag)}
              strokeLinecap="round"
              style={{
                pointerEvents: "stroke",
                stroke: w === undefined ? "rgb(var(--line))" : w >= 0 ? "rgb(var(--pos))" : "rgb(var(--neg))",
              }}
            />,
          );
        }
      }
    }
    return out;
  }, [geo, params]);
  return <g>{lines}</g>;
});

interface Tip { x: number; y: number; lines: string[] }

/** SVG diagram of the live network. Edge style / thickness come from the trained weights. */
function NetworkGraphImpl({ config, params, activations, status }: Props) {
  const configSizes = useMemo(() => [2, ...config.hidden_layers, 1], [config.hidden_layers]);
  const matches =
    params !== null && params.layer_sizes.length === configSizes.length && params.layer_sizes.every((n, i) => n === configSizes[i]);
  const p = matches ? params : null;
  const geo = useMemo(() => geometry(configSizes), [configSizes]);
  const [tip, setTip] = useState<Tip | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  const acts = p && activations && activations.length === configSizes.length ? activations : null;
  const scales = useMemo(() => (acts ? acts.map((a) => Math.max(1e-6, ...a.map(Math.abs))) : []), [acts]);

  const show = (e: React.MouseEvent<SVGGElement | SVGSVGElement>, lines: string[]) => {
    const r = wrap.current?.getBoundingClientRect();
    if (r) setTip({ x: e.clientX - r.left, y: e.clientY - r.top, lines });
  };
  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const t = e.target as SVGElement;
    if (t.dataset.node) {
      const [l, i] = t.dataset.node.split("-").map(Number);
      const kind = l === 0 ? "Input" : l === configSizes.length - 1 ? "Output" : `Hidden layer ${l}`;
      const lines = [`${kind} · neuron ${i + 1}`];
      if (l > 0 && p) lines.push(`bias: ${fmt(p.layers[l - 1].biases[i])}`);
      if (acts) lines.push(`activation: ${fmt(acts[l][i])}`);
      show(e, lines);
    } else if (t.dataset.l !== undefined && p) {
      const l = +t.dataset.l!, i = +t.dataset.i!, j = +t.dataset.j!;
      show(e, [`Weight L${l}[${i + 1}] → L${l + 1}[${j + 1}]`, `w = ${fmt(p.layers[l].weights[i][j])}`]);
    } else setTip(null);
  };

  const label = (l: number) =>
    l === 0 ? "Input (x, y)" : l === configSizes.length - 1 ? "Output σ" : `Hidden ${l} · ${config.activation}`;

  return (
    <div ref={wrap} className="relative">
      <svg
        viewBox={`0 0 ${W} ${H + 24}`}
        role="img"
        aria-label={`Network diagram with layer sizes ${configSizes.join(", ")}`}
        className="w-full"
        onMouseMove={onMove}
        onMouseLeave={() => setTip(null)}
      >
        <Connections geo={geo} params={p} />
        {configSizes.map((n, l) =>
          Array.from({ length: n }, (_, i) => (
            <circle
              key={`${l}-${i}`}
              data-node={`${l}-${i}`}
              cx={geo.xs[l]} cy={geo.ys(l, i)} r={geo.r}
              style={{ fill: acts ? activationFill(acts[l][i], scales[l]) : "rgb(var(--raised))", stroke: "rgb(var(--ink))" }}
              strokeOpacity={0.55} strokeWidth={1.2}
            />
          )),
        )}
        {configSizes.map((_, l) => (
          <text key={l} x={geo.xs[l]} y={H + 16} textAnchor="middle" className="fill-muted" fontSize="12">
            {label(l)}
          </text>
        ))}
        {!p && (
          <text x={W / 2} y={16} textAnchor="middle" className="fill-muted" fontSize="12">
            {status ? "Loading model parameters…" : "Structure preview. Create a valid model to see real weights."}
          </text>
        )}
      </svg>
      {tip && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-card"
          style={{ left: Math.min(tip.x + 12, (wrap.current?.clientWidth ?? 600) - 190), top: tip.y + 12 }}
        >
          {tip.lines.map((t, i) => (
            <div key={i} className={i === 0 ? "font-semibold" : "font-mono text-muted"}>{t}</div>
          ))}
        </div>
      )}
    </div>
  );
}
export const NetworkGraphView = memo(NetworkGraphImpl);

export function NetworkLegend() {
  const item = "inline-flex items-center gap-1.5";
  return (
    <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted" aria-label="Legend">
      <li className={item}>
        <svg width="28" height="8" aria-hidden><line x1="0" y1="4" x2="28" y2="4" style={{ stroke: "rgb(var(--pos))" }} strokeWidth="3" /></svg>
        positive weight (solid)
      </li>
      <li className={item}>
        <svg width="28" height="8" aria-hidden><line x1="0" y1="4" x2="28" y2="4" style={{ stroke: "rgb(var(--neg))" }} strokeWidth="3" strokeDasharray="5 3" /></svg>
        negative weight (dashed)
      </li>
      <li className={item}>
        <svg width="40" height="10" aria-hidden><line x1="0" y1="2" x2="40" y2="2" style={{ stroke: "rgb(var(--ink))" }} strokeWidth=".8" /><line x1="0" y1="7" x2="40" y2="7" style={{ stroke: "rgb(var(--ink))" }} strokeWidth="4" /></svg>
        thicker = larger |weight|
      </li>
      <li className={item}>
        <span className="h-3 w-24 rounded" style={{ background: "linear-gradient(90deg, rgb(234 88 12), rgb(226 232 240), rgb(37 99 235))" }} aria-hidden />
        node: negative → 0 → positive activation
      </li>
    </ul>
  );
}
