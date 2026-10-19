import { useEffect, useRef, useState } from "react";
import { useIsDark } from "../../../hooks/useTheme";
import { Callout, canvasColor, col, Controls, Demo, f2, Grid, Legend, Out, Seg, Slider } from "../../ui";
import { optimizerPaths, stepsToLoss, type OptName } from "../math";
import { useT, useRich } from "../rich";
import { ScrollTable, sci, td, th } from "../widgets";

const NAMES: Record<OptName, string> = { sgd: "SGD", rms: "RMSprop", adam: "Adam" };
const COLOR: Record<OptName, string> = { sgd: "bad", rms: "ok", adam: "pos" };
const OPTS: OptName[] = ["sgd", "rms", "adam"];
const LRS = [0.01, 0.05, 0.1, 0.3];
const TARGET = 0.01;
const BUDGET = 40;

interface Attempt { opt: OptName; lr: number; at: number; loss: number; ok: boolean; len: number }

function Challenge() {
  const t = useT();
  const r = useRich();
  const [opt, setOpt] = useState<OptName>("sgd");
  const [lr, setLr] = useState("0.1");
  const [tries, setTries] = useState<Attempt[]>([]);
  const [reveal, setReveal] = useState(false);
  const last = tries[0];
  const run = () => {
    const res = optimizerPaths(Number(lr), BUDGET)[opt];
    setTries((cur) => [{ opt, lr: Number(lr), at: stepsToLoss(res, TARGET), loss: res.loss, ok: res.ok, len: res.path.length - 1 }, ...cur].slice(0, 8));
  };
  return (
    <Demo title={t("lab1.op.ch.title")}>
      <p className="text-sm text-muted">{t("lab1.op.ch.intro")}</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <Seg label={t("lab1.op.ch.opt")} value={opt} onChange={setOpt} options={OPTS.map((o) => ({ value: o, label: NAMES[o] }))} />
        <Seg label={t("lab1.op.ch.lr")} value={lr} onChange={setLr} options={LRS.map((v) => ({ value: String(v), label: String(v) }))} />
        <button className="btn-primary" onClick={run}>{t("lab1.op.ch.run")}</button>
      </div>
      {last && (
        <p className="mt-3 text-sm" role="status">
          <b>{NAMES[last.opt]}, lr {last.lr}:</b>{" "}
          {last.at >= 0
            ? <span className="text-ok">{r("lab1.op.ch.ok", { n: last.at, l: sci(last.loss, 2) })}</span>
            : !last.ok
              ? <span className="text-bad">{r("lab1.op.ch.boom", { n: last.len, o: NAMES[last.opt] })}</span>
              : <span className="text-c-amber">{r("lab1.op.ch.fail", { l: sci(last.loss, 2) })}</span>}
        </p>
      )}
      {tries.length > 1 && (
        <div className="mt-2">
          <p className="text-xs font-semibold text-muted">{t("lab1.op.ch.history")}</p>
          <ul className="mt-1 flex flex-wrap gap-1.5 text-xs">
            {tries.slice(1).map((a, i) => (
              <li key={i} className={`rounded-full border px-2.5 py-0.5 ${a.at >= 0 ? "border-ok text-ok" : "border-line text-muted"}`}>{NAMES[a.opt]} · {a.lr} · {a.at >= 0 ? `✓ ${a.at}` : a.ok ? "✗" : "💥"}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-3">
        <button className="btn-ghost !text-xs" aria-expanded={reveal} onClick={() => setReveal((x) => !x)}>{reveal ? t("lab1.op.ch.hide") : t("lab1.op.ch.reveal")}</button>
      </div>
      {reveal && (
        <div className="mt-2 space-y-2">
          <ScrollTable label={t("lab1.op.ch.tableLabel")}>
            <table className="w-full text-sm">
              <thead><tr><th scope="col" className={th}> </th>{LRS.map((v) => <th key={v} scope="col" className={th}>lr {v}</th>)}</tr></thead>
              <tbody>
                {OPTS.map((o) => (
                  <tr key={o}>
                    <th scope="row" className={`${td} text-left font-semibold`}>{NAMES[o]}</th>
                    {LRS.map((v) => {
                      const res = optimizerPaths(v, BUDGET)[o];
                      const at = stepsToLoss(res, TARGET);
                      return <td key={v} className={`${td} font-mono ${at >= 0 ? "bg-ok/10 font-semibold text-ok" : !res.ok ? "text-bad" : "text-muted"}`}>{at >= 0 ? `✓ ${at}` : !res.ok ? "💥" : "✗"}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <p className="text-xs text-muted">{t("lab1.op.ch.legend")}</p>
          <p className="text-sm text-muted">{t("lab1.op.ch.note")}</p>
        </div>
      )}
    </Demo>
  );
}

export default function Optimizers() {
  const t = useT();
  const dark = useIsDark();
  const [lrExp, setLrExp] = useState(-1.3);
  const [steps, setSteps] = useState(40);
  const [playing, setPlaying] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const lr = 10 ** lrExp;
  const runs = optimizerPaths(lr, steps);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setSteps((s) => {
      if (s >= 80) { setPlaying(false); return s; }
      return s + 1;
    }), 70);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    const cv = canvas.current;
    const c = cv?.getContext("2d");
    if (!cv || !c) return;
    const W = cv.width;
    const H = cv.height;
    c.clearRect(0, 0, W, H);
    const X = (x: number) => ((x + 5) / 10) * W;
    const Y = (y: number) => H / 2 - (y / 2) * (H / 2) * 0.98;
    c.strokeStyle = canvasColor("line");
    c.lineWidth = 1.5;
    [0.5, 2, 5, 10, 16].forEach((L) => {
      c.beginPath();
      c.ellipse(X(0), Y(0), Math.sqrt(2 * L) * (W / 10), Math.sqrt((2 * L) / 10) * (H / 4) * 0.98, 0, 0, 7);
      c.stroke();
    });
    (Object.keys(runs) as OptName[]).forEach((k) => {
      const color = canvasColor(COLOR[k]);
      c.strokeStyle = color;
      c.fillStyle = color;
      c.lineWidth = 2.5;
      c.beginPath();
      let started = false;
      runs[k].path.forEach((p) => {
        if (Math.abs(p[0]) > 5 || Math.abs(p[1]) > 2.2) return;
        if (!started) { c.moveTo(X(p[0]), Y(p[1])); started = true; } else c.lineTo(X(p[0]), Y(p[1]));
      });
      c.stroke();
      const e = runs[k].path[runs[k].path.length - 1];
      if (Math.abs(e[0]) <= 5 && Math.abs(e[1]) <= 2.2) { c.beginPath(); c.arc(X(e[0]), Y(e[1]), 6, 0, 7); c.fill(); }
    });
    c.fillStyle = canvasColor("ink");
    c.beginPath(); c.arc(X(-4.2), Y(1.5), 7, 0, 7); c.fill();
    c.strokeStyle = canvasColor("ink");
    c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(X(0) - 8, Y(0)); c.lineTo(X(0) + 8, Y(0)); c.moveTo(X(0), Y(0) - 8); c.lineTo(X(0), Y(0) + 8); c.stroke();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lrExp, steps, dark]);

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{t("lab1.op.intro")}</p>
      <Demo title={t("lab1.op.demo.title")}>
        <Controls>
          <Slider id="op-lr" label={t("lab1.op.lr")} min={-2.3} max={-0.2} step={0.05} value={lrExp} onChange={setLrExp} format={() => f2(lr, 3)} />
          <Slider id="op-n" label={t("lab1.op.steps")} min={1} max={80} step={1} value={steps} onChange={(v) => { setPlaying(false); setSteps(v); }} />
          <button className="btn-primary" onClick={() => { setSteps(1); setPlaying(true); }}>{t("lab1.op.animate")}</button>
        </Controls>
        <canvas ref={canvas} width={900} height={360} className="w-full rounded-xl border border-line" role="img" aria-label={t("lab1.op.aria")} />
        <Legend items={[{ color: col("bad"), label: "SGD" }, { color: col("ok"), label: "RMSprop" }, { color: col("pos"), label: "Adam" }, { color: col("ink"), label: t("lab1.op.leg") }]} />
        <Out>
          {(Object.keys(runs) as OptName[]).map((k, i) => (
            <span key={k}>
              {i > 0 && " · "}
              <b style={{ color: col(COLOR[k]) }}>{NAMES[k]}</b>:{" "}
              {runs[k].ok ? t("lab1.op.loss", undefined, { v: runs[k].loss < 1e-4 ? runs[k].loss.toExponential(1) : f2(runs[k].loss, 4) }) : <b>{t("lab1.op.diverged")}</b>}
            </span>
          ))}
        </Out>
        <div className="mt-4">
          <Grid cols={3}>
            <div><b>SGD</b><p className="text-sm text-muted">{t("lab1.op.sgd")}</p></div>
            <div><b>RMSprop</b><p className="text-sm text-muted">{t("lab1.op.rms")}</p></div>
            <div><b>Adam</b><p className="text-sm text-muted">{t("lab1.op.adam")}</p></div>
          </Grid>
        </div>
        <Callout title={t("lab1.op.cmpTitle")}>{t("lab1.op.cmp")}</Callout>
      </Demo>
      <Challenge />
    </div>
  );
}
