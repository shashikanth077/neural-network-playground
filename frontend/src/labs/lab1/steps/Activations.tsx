import { useState } from "react";
import { Callout, col, Controls, Demo, f2, Grid, Out, Seg, Slider } from "../../ui";
import { ACTIVATIONS, chainGradient, type ActivationName } from "../math";
import { useT, useRich } from "../rich";
import { Calc, sci } from "../widgets";

const NAMES: ActivationName[] = ["sigmoid", "tanh", "relu"];
const NAME_OPTS = NAMES.map((n) => ({ value: n, label: n }));

function OneNeuron() {
  const t = useT();
  const r = useRich();
  const [name, setName] = useState<ActivationName>("sigmoid");
  const [wv, setWv] = useState(1);
  const [bv, setBv] = useState(0);
  const [x0, setX0] = useState(1);
  const { f, d } = ACTIVATIONS[name];
  const z = wv * x0 + bv;
  const X = (x: number) => 40 + ((x + 4) / 8) * 640;
  const Y = (y: number) => 120 - y * 40;
  const curve = Array.from({ length: 161 }, (_, i) => { const x = -4 + i * 0.05; return `${i ? "L" : "M"}${X(x)},${Y(Math.max(-1.6, Math.min(3, f(wv * x + bv))))}`; }).join("");
  return (
    <Demo title={t("lab1.ac.one.title")}>
      <p className="text-sm text-muted">{t("lab1.ac.one.intro")}</p>
      <div className="mt-3">
        <Controls>
          <Seg label={t("lab1.ac.act")} value={name} onChange={setName} options={NAME_OPTS} />
          <Slider id="an-w" label={t("lab1.ac.one.w")} min={-3} max={3} step={0.1} value={wv} onChange={setWv} format={(v) => f2(v, 1)} />
          <Slider id="an-b" label={t("lab1.ac.one.b")} min={-3} max={3} step={0.1} value={bv} onChange={setBv} format={(v) => f2(v, 1)} />
          <Slider id="an-x" label={t("lab1.ac.x")} min={-4} max={4} step={0.1} value={x0} onChange={setX0} format={(v) => f2(v, 1)} />
        </Controls>
      </div>
      <svg viewBox="0 0 720 200" className="w-full" role="img" aria-label={t("lab1.ac.one.aria")}>
        <line x1="40" x2="680" y1={Y(0)} y2={Y(0)} style={{ stroke: col("line") }} />
        <line x1={X(0)} x2={X(0)} y1="10" y2="190" style={{ stroke: col("line") }} />
        <path d={curve} fill="none" strokeWidth="3" style={{ stroke: col("brand") }} />
        <circle cx={X(x0)} cy={Y(Math.max(-1.6, Math.min(3, f(z))))} r="7" style={{ fill: col("c-amber") }} />
        <text x="676" y="14" textAnchor="end" fontSize="12" style={{ fill: col("muted") }}>y = {name}(w·x + b)</text>
      </svg>
      <div className="mt-2 space-y-1.5">
        <Calc>{`z = w·x + b = ${f2(wv, 1)}·${f2(x0, 1)} + ${f2(bv, 1)} = ${f2(z, 3)}`}</Calc>
        <Calc>{`y = ${name}(z) = ${name}(${f2(z, 3)}) = ${f2(f(z), 4)}`}</Calc>
        <Calc>{`∂y/∂w = f′(z)·x = ${f2(d(z), 4)}·${f2(x0, 1)} = ${f2(d(z) * x0, 4)}      ∂y/∂b = f′(z) = ${f2(d(z), 4)}`}</Calc>
      </div>
      {d(z) < 0.02 && <p className="mt-2 text-sm text-c-amber">{r("lab1.ac.one.dead")}</p>}
    </Demo>
  );
}

function Vanish() {
  const t = useT();
  const r = useRich();
  const [n, setN] = useState(10);
  const [x, setX] = useState(0);
  const rows = NAMES.map((a) => ({ a, d: ACTIVATIONS[a].d(x), c: chainGradient(a, x, n) }));
  return (
    <Demo title={t("lab1.ac.van.title")}>
      <p className="text-sm text-muted">{t("lab1.ac.van.intro")}</p>
      <div className="mt-3">
        <Controls>
          <Slider id="va-n" label={t("lab1.ac.van.layers")} min={1} max={20} step={1} value={n} onChange={setN} />
          <Slider id="va-x" label={t("lab1.ac.x")} min={-3} max={3} step={0.1} value={x} onChange={setX} format={(v) => f2(v, 1)} />
        </Controls>
      </div>
      <ul className="space-y-2" aria-label={t("lab1.ac.van.listLabel")}>
        {rows.map((row) => {
          const width = row.c <= 0 ? 0 : Math.max(0, Math.min(100, 100 + (Math.log10(row.c) * 100) / 12));
          return (
            <li key={row.a} className="text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <b>{row.a}</b>
                <span className="font-mono text-xs">f′({f2(x, 1)}) = {f2(row.d, 4)} → f′^{n} = <b className="text-sm">{sci(row.c, 2)}</b></span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-raised" role="img" aria-label={`${row.a}: ${sci(row.c, 2)}`}>
                <div className="h-full rounded-full bg-brand" style={{ width: `${width}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-muted">{t("lab1.ac.van.scale")}</p>
      <Callout title={t("lab1.ac.van.noteTitle")}>{r("lab1.ac.van.note")}</Callout>
    </Demo>
  );
}

const CHOICES = ["relu", "sigmoid", "tanh", "softmax", "linear"] as const;
const ANSWERS: (typeof CHOICES[number])[] = ["relu", "sigmoid", "softmax", "tanh", "linear"];

function Challenge() {
  const t = useT();
  const [picked, setPicked] = useState<(string | null)[]>(ANSWERS.map(() => null));
  const score = picked.filter((p, i) => p === ANSWERS[i]).length;
  const done = picked.every((p) => p !== null);
  return (
    <Demo title={t("lab1.ac.ch.title")}>
      <p className="text-sm text-muted">{t("lab1.ac.ch.intro")}</p>
      <ol className="mt-3 space-y-4">
        {ANSWERS.map((ans, i) => {
          const p = picked[i];
          return (
            <li key={i}>
              <p id={`ac-q${i}`} className="text-sm font-semibold"><span className="mr-1.5 font-mono text-xs text-muted">{i + 1}.</span>{t(`lab1.ac.ch.s${i}.q`)}</p>
              <div role="radiogroup" aria-labelledby={`ac-q${i}`} className="mt-1.5 flex flex-wrap gap-1.5">
                {CHOICES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={p === c}
                    disabled={p !== null}
                    onClick={() => setPicked((cur) => cur.map((x, k) => (k === i ? c : x)))}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                      p === null ? "border-line bg-surface hover:bg-raised" : c === ans ? "border-ok bg-ok/10" : p === c ? "border-bad bg-bad/10" : "border-line bg-surface opacity-60"
                    }`}
                  >
                    {c === "linear" ? t("lab1.ac.ch.linear") : c}
                  </button>
                ))}
              </div>
              {p !== null && (
                <p className="mt-1.5 text-sm" role="status">
                  <b className={p === ans ? "text-ok" : "text-bad"}>{p === ans ? t("lab1.ui.correct") : t("lab1.ui.wrong")}</b>{" "}
                  <span className="text-muted">{t(`lab1.ac.ch.s${i}.e`)}</span>
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <p className="text-sm font-semibold" aria-live="polite">{done ? t("lab1.ac.ch.score", undefined, { a: score, b: ANSWERS.length }) : t("lab1.ui.progressQ", undefined, { a: picked.filter((x) => x !== null).length, b: ANSWERS.length })}</p>
        {done && <button className="btn-ghost !py-1 !text-xs" onClick={() => setPicked(ANSWERS.map(() => null))}>{t("lab1.ui.retry")}</button>}
      </div>
    </Demo>
  );
}

export default function Activations() {
  const t = useT();
  const r = useRich();
  const [name, setName] = useState<ActivationName>("sigmoid");
  const [x0, setX0] = useState(1);
  const { f, d } = ACTIVATIONS[name];
  const X = (x: number) => 40 + ((x + 6) / 12) * 640;
  const Y = (y: number) => 130 - y * 38;
  const path = (fn: (x: number) => number) => Array.from({ length: 241 }, (_, i) => { const x = -6 + i * 0.05; return `${i ? "L" : "M"}${X(x)},${Y(fn(x))}`; }).join("");

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{t("lab1.ac.intro")}</p>
      <Demo title={t("lab1.ac.demo.title")}>
        <Controls>
          <Seg label={t("lab1.ac.act")} value={name} onChange={setName} options={NAME_OPTS} />
          <Slider id="ac-x" label={t("lab1.ac.x")} min={-6} max={6} step={0.1} value={x0} onChange={setX0} format={(v) => f2(v, 1)} />
        </Controls>
        <svg viewBox="0 0 720 260" className="w-full" role="img" aria-label={t("lab1.ac.demo.aria", undefined, { name })}>
          <line x1="40" x2="680" y1={Y(0)} y2={Y(0)} style={{ stroke: col("line") }} />
          <line x1={X(0)} x2={X(0)} y1="20" y2="240" style={{ stroke: col("line") }} />
          {[-1, 1, 2, 3].map((v) => <text key={v} x={X(0) - 6} y={Y(v) + 4} textAnchor="end" fontSize="11" style={{ fill: col("muted") }}>{v}</text>)}
          <path d={path(d)} fill="none" strokeWidth="2" strokeDasharray="5 4" style={{ stroke: col("c-amber") }} />
          <path d={path(f)} fill="none" strokeWidth="3" style={{ stroke: col("brand") }} />
          <circle cx={X(x0)} cy={Y(f(x0))} r="7" style={{ fill: col("brand") }} />
          <circle cx={X(x0)} cy={Y(d(x0))} r="6" style={{ fill: col("c-amber") }} />
          <text x="690" y={Y(f(6)) - 6} textAnchor="end" fontSize="12" style={{ fill: col("brand") }}>f(x)</text>
          <text x="690" y={Y(d(6)) + 16} textAnchor="end" fontSize="12" style={{ fill: col("c-amber") }}>{t("lab1.ac.demo.grad")}</text>
        </svg>
        <Out>
          f({f2(x0, 1)}) = <b>{f2(f(x0), 4)}</b> · {t("lab1.ac.demo.gradient")} = <b>{f2(d(x0), 4)}</b>{" "}
          {d(x0) < 0.02 ? t("lab1.ac.demo.dead") : ""}
        </Out>
        <div className="mt-4">
          <Grid cols={3}>
            <div><b>sigmoid</b><p className="text-sm text-muted">{r("lab1.ac.demo.sig")}</p></div>
            <div><b>tanh</b><p className="text-sm text-muted">{t("lab1.ac.demo.tanh")}</p></div>
            <div><b>relu</b><p className="text-sm text-muted">{t("lab1.ac.demo.relu")}</p></div>
          </Grid>
        </div>
        <Callout tone="warn" title={t("lab1.ac.demo.ruleTitle")}>{t("lab1.ac.demo.rule")}</Callout>
      </Demo>
      <OneNeuron />
      <Vanish />
      <Challenge />
    </div>
  );
}
