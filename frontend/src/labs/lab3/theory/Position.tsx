import { useMemo, useState } from "react";
import { Callout, Demo, Seg, Slider } from "../../ui";
import { useR, useTx } from "../rich";
import { attention, dot, sinusoidalPE, toyEmbeddings, addMat } from "../transformerMath";
import { DemoHead, fmtInt, Heat, lin, n2, P } from "./shared";

const MAXLEN = 64;

function SimChart({ values, pos, label }: { values: number[]; pos: number; label: string }) {
  const W = 420;
  const H = 150;
  const n = values.length;
  const x = (i: number) => lin(i, 0, Math.max(1, n - 1), 28, W - 8);
  const y = (v: number) => lin(v, -0.5, 1, H - 20, 10);
  const path = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={label}>
      <line x1="28" x2={W - 8} y1={y(0)} y2={y(0)} style={{ stroke: "rgb(var(--line))" }} />
      <text x="2" y={y(1) + 4} fontSize="9" style={{ fill: "rgb(var(--muted))" }}>1</text>
      <text x="2" y={y(0) + 3} fontSize="9" style={{ fill: "rgb(var(--muted))" }}>0</text>
      <path d={path} fill="none" strokeWidth="2" style={{ stroke: "rgb(var(--brand))" }} />
      <circle cx={x(pos)} cy={y(values[pos] ?? 0)} r="4" style={{ fill: "rgb(var(--neg))" }} />
    </svg>
  );
}

export default function Position() {
  const r = useR();
  const tx = useTx();
  const [n, setN] = useState(32);
  const [d, setD] = useState(64);
  const [pos, setPos] = useState(5);
  const [dim, setDim] = useState(6);
  const [withPos, setWithPos] = useState<"no" | "yes">("no");

  const pe = useMemo(() => sinusoidalPE(n, d), [n, d]);
  const p = Math.min(pos, n - 1);
  const k = Math.min(dim, d - 1);
  const i2 = k - (k % 2);
  const angle = p / Math.pow(10000, i2 / d);
  const wavelength = 2 * Math.PI * Math.pow(10000, i2 / d);
  const sim = useMemo(() => pe.map((row) => dot(pe[p], row) / (d / 2)), [pe, p, d]);

  // permutation demo: "dog bites man" against "man bites dog", self-attention with Q = K = V = X (no learned projections)
  const demo = useMemo(() => {
    const words = ["dog", "bites", "man"];
    const E = toyEmbeddings(words, 8, 11);
    const P8 = sinusoidalPE(3, 8);
    const rowOf = (order: number[], usePos: boolean) => {
      const X0 = order.map((i) => E[i]);
      const X = usePos ? addMat(X0, P8) : X0;
      const out = attention(X, X, X).output;
      return out[order.indexOf(1)];
    };
    const a = [0, 1, 2];
    const b = [2, 1, 0];
    const maxDiff = (u: number[], v: number[]) => Math.max(...u.map((x, i) => Math.abs(x - v[i])));
    const no = [rowOf(a, false), rowOf(b, false)];
    const yes = [rowOf(a, true), rowOf(b, true)];
    return { no, yes, dNo: maxDiff(no[0], no[1]), dYes: maxDiff(yes[0], yes[1]) };
  }, []);
  const shown = withPos === "no" ? demo.no : demo.yes;

  return (
    <div className="space-y-5">
      <P k="lab3.t.po.lead" />

      <Demo>
        <DemoHead title={tx("lab3.t.po.perm.title")} tags={["recomputed", "toy"]} />
        <P k="lab3.t.po.perm.hint" />
        <div className="my-3">
          <Seg<"no" | "yes">
            label={tx("lab3.t.po.perm.mode")}
            value={withPos}
            onChange={setWithPos}
            options={[{ value: "no", label: tx("lab3.t.po.perm.no") }, { value: "yes", label: tx("lab3.t.po.perm.yes") }]}
          />
        </div>
        <div className="grid gap-2 font-mono text-xs sm:grid-cols-2" aria-live="polite" data-testid="po-perm">
          {[["dog bites man", shown[0]], ["man bites dog", shown[1]]].map(([s, v]) => (
            <div key={s as string} className="min-w-0 rounded-xl border border-line bg-raised/60 p-2">
              <p className="font-sans text-sm font-semibold">{s as string}</p>
              <p className="mt-1 break-words text-muted">{tx("lab3.t.po.perm.out")}</p>
              <p className="break-words">[{(v as number[]).map((x) => n2(x, 3)).join(", ")}]</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-sm" aria-live="polite">{r(withPos === "no" ? "lab3.t.po.perm.res.no" : "lab3.t.po.perm.res.yes", { diff: (withPos === "no" ? demo.dNo : demo.dYes).toExponential(1) })}</p>
      </Demo>

      <Demo>
        <DemoHead title={tx("lab3.t.po.heat.title")} tags={["recomputed"]} />
        <div className="rounded-lg border border-line bg-raised/60 p-2 text-center font-mono text-xs leading-relaxed sm:text-sm">
          PE(pos, 2i) = sin(pos / 10000<sup>2i/d</sup>) &nbsp; PE(pos, 2i+1) = cos(pos / 10000<sup>2i/d</sup>)
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3">
          <Slider id="po-n" label={tx("lab3.t.po.n")} min={4} max={MAXLEN} step={1} value={n} onChange={setN} />
          <Slider id="po-d" label={tx("lab3.t.po.d")} min={8} max={128} step={8} value={d} onChange={setD} />
          <Slider id="po-pos" label={tx("lab3.t.po.pos")} min={0} max={n - 1} step={1} value={p} onChange={setPos} />
          <Slider id="po-dim" label={tx("lab3.t.po.dim")} min={0} max={d - 1} step={1} value={k} onChange={setDim} />
        </div>
        <div className="mt-3">
          <p className="mb-1 text-xs text-muted">{r("lab3.t.po.axes", { n, d })}</p>
          <Heat
            values={pe}
            signed
            showValues={false}
            cell="h-[7px] w-[7px] min-w-0 !p-0"
            label={tx("lab3.t.po.heat.title")}
            onCell={(i, j) => { setPos(i); setDim(j); }}
            activeCell={[p, k]}
          />
        </div>
        <div className="mt-3 rounded-xl border border-line bg-raised/70 px-3 py-2 text-sm leading-relaxed" role="status" aria-live="polite" data-testid="po-readout">
          <p className="font-mono">PE({p}, {k}) = {k % 2 === 0 ? "sin" : "cos"}({p} / 10000^({i2}/{d})) = {k % 2 === 0 ? "sin" : "cos"}({angle.toFixed(4)}) = <b>{n2(pe[p][k], 4)}</b></p>
          <p className="mt-1 text-muted">{r("lab3.t.po.wave", { w: wavelength < 1000 ? wavelength.toFixed(1) : fmtInt(wavelength) })}</p>
        </div>
        <p className="mt-2 text-xs text-muted">{r("lab3.t.po.max", { m: MAXLEN })}</p>
      </Demo>

      <Demo>
        <DemoHead title={tx("lab3.t.po.sim.title")} tags={["recomputed"]} />
        <P k="lab3.t.po.sim.hint" />
        <SimChart values={sim} pos={p} label={tx("lab3.t.po.sim.title")} />
        <p className="text-xs text-muted">{r("lab3.t.po.sim.note", { p })}</p>
      </Demo>

      <Demo>
        <DemoHead title={tx("lab3.t.po.learn.title")} tags={["paper", "recomputed"]} />
        <P k="lab3.t.po.learn.hint" />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="py-1.5 font-medium">{tx("lab3.t.po.learn.col0")}</th>
                <th className="font-medium">{tx("lab3.t.po.learn.col1")}</th>
                <th className="font-medium">{tx("lab3.t.po.learn.col2")}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line/60 align-top">
                <td className="py-1.5 font-medium">{tx("lab3.t.po.learn.sin")}</td>
                <td className="text-muted">{tx("lab3.t.po.learn.sin.how")}</td>
                <td className="font-mono">0</td>
              </tr>
              <tr className="align-top">
                <td className="py-1.5 font-medium">{tx("lab3.t.po.learn.lrn")}</td>
                <td className="text-muted">{tx("lab3.t.po.learn.lrn.how")}</td>
                <td className="font-mono">{[128, 512, 768].map((dd) => `512 × ${dd} = ${fmtInt(512 * dd)}`).map((s, i) => <span key={i} className="block">{s}</span>)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Callout title={tx("lab3.t.po.sum.title")}>{r("lab3.t.po.sum.body")}</Callout>
      </Demo>
    </div>
  );
}
