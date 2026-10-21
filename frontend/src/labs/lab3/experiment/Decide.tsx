import { useMemo, useState } from "react";
import { Callout, Demo } from "../../ui";
import { byTag, fmtDuration, rankModels, recommend, type DecideInput } from "../expMath";
import { useR, useTx } from "../rich";
import { FamilyDot, fmtMs, INPUT, pct } from "./shared";

const LABELS = [0, 500, 1000, 2000, 4000, 8000, 65349];
const LATENCY = [0.1, 1, 20, 50, 200];
const TRAIN = [0, 10, 60, 180, 600];
const SCENARIOS: { id: string; v: DecideInput }[] = [
  { id: "reviews", v: { publicInDomain: true, publicRelated: true, labels: 0, maxLatencyMs: 200, maxTrainMinutes: 0, english: true } },
  { id: "tickets", v: { publicInDomain: false, publicRelated: false, labels: 4000, maxLatencyMs: 50, maxTrainMinutes: 180, english: true } },
  { id: "newTopic", v: { publicInDomain: false, publicRelated: false, labels: 0, maxLatencyMs: 200, maxTrainMinutes: 0, english: true } },
  { id: "stream", v: { publicInDomain: false, publicRelated: false, labels: 65349, maxLatencyMs: 0.1, maxTrainMinutes: 60, english: true } },
  { id: "lt", v: { publicInDomain: false, publicRelated: false, labels: 2000, maxLatencyMs: 200, maxTrainMinutes: 180, english: false } },
];
const STEPS = [1, 2, 3, 4] as const;

export default function Decide() {
  const r = useR();
  const tx = useTx();
  const [inp, setInp] = useState<DecideInput>({ publicInDomain: false, publicRelated: false, labels: 8000, maxLatencyMs: 200, maxTrainMinutes: 180, english: true });
  const set = <K extends keyof DecideInput>(k: K, v: DecideInput[K]) => setInp((x) => ({ ...x, [k]: v }));
  const rec = useMemo(() => recommend(inp), [inp]);
  const ranked = useMemo(() => rankModels(inp), [inp]);
  const fit = ranked.filter((x) => x.ok), out = ranked.filter((x) => !x.ok);
  const model = rec.tag ? byTag(rec.tag) : null;
  const box = "flex cursor-pointer items-start gap-2.5 text-sm leading-snug";
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{r("lab3.e.dec.lead")}</p>
      <Demo title={tx("lab3.e.dec.q.title")}>
        <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label={tx("lab3.e.dec.scn.title")}>
          {SCENARIOS.map((s) => (
            <button key={s.id} type="button" className="chip hover:bg-surface" onClick={() => setInp(s.v)} title={tx(`lab3.e.dec.scn.${s.id}.d`)}>{tx(`lab3.e.dec.scn.${s.id}`)}</button>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <fieldset className="space-y-2.5">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">{tx("lab3.e.dec.q1")}</legend>
            <label className={box}><input type="checkbox" data-testid="dec-in" className="mt-0.5 h-4 w-4 shrink-0 accent-brand" checked={inp.publicInDomain} onChange={(e) => set("publicInDomain", e.target.checked)} /><span>{tx("lab3.e.dec.q1a")}</span></label>
            <label className={box}><input type="checkbox" data-testid="dec-rel" className="mt-0.5 h-4 w-4 shrink-0 accent-brand" checked={inp.publicRelated} onChange={(e) => set("publicRelated", e.target.checked)} /><span>{tx("lab3.e.dec.q1b")}</span></label>
          </fieldset>
          <div>
            <label htmlFor="dec-labels" className="block text-xs font-semibold uppercase tracking-wide text-brand">{tx("lab3.e.dec.q2")}</label>
            <select id="dec-labels" data-testid="dec-labels" value={inp.labels} onChange={(e) => set("labels", Number(e.target.value))} className={`${INPUT} mt-1`}>
              {LABELS.map((n) => <option key={n} value={n}>{n === 0 ? tx("lab3.e.dec.none") : n === 65349 ? `65 349 (${tx("lab3.e.dec.all")})` : n.toLocaleString("en-US").replace(",", " ")}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="dec-lat" className="block text-xs font-semibold uppercase tracking-wide text-brand">{tx("lab3.e.dec.q3")}</label>
            <select id="dec-lat" data-testid="dec-lat" value={inp.maxLatencyMs} onChange={(e) => set("maxLatencyMs", Number(e.target.value))} className={`${INPUT} mt-1`}>
              {LATENCY.map((n) => <option key={n} value={n}>{tx(`lab3.e.dec.lat.${n === 0.1 ? "0" : n === 1 ? "1" : n === 20 ? "2" : n === 50 ? "3" : "4"}`)}</option>)}
            </select>
            <label htmlFor="dec-train" className="mt-3 block text-xs font-semibold uppercase tracking-wide text-brand">{tx("lab3.e.dec.q3b")}</label>
            <select id="dec-train" data-testid="dec-train" value={inp.maxTrainMinutes} onChange={(e) => set("maxTrainMinutes", Number(e.target.value))} className={`${INPUT} mt-1`}>
              {TRAIN.map((n) => <option key={n} value={n}>{n === 0 ? tx("lab3.e.dec.noTrain") : n < 60 ? `${n} min` : `${n / 60} h`}</option>)}
            </select>
          </div>
          <fieldset className="space-y-2.5">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">{tx("lab3.e.dec.q4")}</legend>
            <label className={box}><input type="checkbox" data-testid="dec-en" className="mt-0.5 h-4 w-4 shrink-0 accent-brand" checked={inp.english} onChange={(e) => set("english", e.target.checked)} /><span>{tx("lab3.e.dec.q4a")}</span></label>
          </fieldset>
        </div>
      </Demo>

      <div role="status" aria-live="polite" className="card border-l-4 border-l-brand p-4 sm:p-5" data-testid="dec-out" data-step={rec.step} data-model={rec.tag ?? ""}>
        {model ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">{tx("lab3.e.dec.rec", { n: rec.step })}</p>
            <p className="mt-1 text-lg font-semibold"><FamilyDot family={model.family} />{model.name}</p>
            <p className="mt-1 text-sm leading-relaxed">{r(`lab3.e.dec.rule.${rec.step}`, { acc: pct(model.accuracy), lat: fmtMs(model.latencyMs), n: model.trainSize.toLocaleString("en-US") })}</p>
          </>
        ) : <p className="text-sm leading-relaxed">{r("lab3.e.dec.nothing")}</p>}
      </div>

      {!inp.english && <Callout tone="warn" title={tx("lab3.e.dec.lt.title")}>{r("lab3.e.dec.lt.body")}</Callout>}

      <Demo title={tx("lab3.e.dec.rules.title")}>
        <ol className="space-y-2.5">
          {STEPS.map((n) => (
            <li key={n} className={`flex gap-3 rounded-xl border px-3 py-2 text-sm leading-relaxed ${rec.step === n ? "border-brand bg-brand/5" : "border-line"}`} aria-current={rec.step === n ? "true" : undefined}>
              <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line text-xs font-semibold">{n}</span>
              <span><b>{tx(`lab3.e.dec.step.${n}`)}</b> <span className="text-muted">{r(`lab3.e.dec.why.${n}`)}</span></span>
            </li>
          ))}
        </ol>
      </Demo>

      <Demo title={tx("lab3.e.dec.rank.title")}>
        <p className="text-sm text-muted">{tx("lab3.e.dec.rank.lead")}</p>
        {fit.length > 0 ? (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[480px] text-xs sm:text-sm" aria-label={tx("lab3.e.dec.rank.title")} data-testid="dec-fit">
              <thead><tr className="text-left text-muted">
                <th scope="col" className="border-b border-line px-2 py-1.5">#</th>
                <th scope="col" className="border-b border-line px-2 py-1.5">{tx("lab3.e.rs.col.model")}</th>
                <th scope="col" className="border-b border-line px-2 py-1.5 text-right">{tx("lab3.e.rs.col.acc")}</th>
                <th scope="col" className="border-b border-line px-2 py-1.5 text-right">{tx("lab3.e.rs.col.lat")}</th>
                <th scope="col" className="border-b border-line px-2 py-1.5 text-right">{tx("lab3.e.cs.col.train")}</th>
                <th scope="col" className="border-b border-line px-2 py-1.5">{tx("lab3.e.dec.rank.basis")}</th>
              </tr></thead>
              <tbody>
                {fit.map((x, i) => (
                  <tr key={x.model.tag}>
                    <td className="border-b border-line px-2 py-1.5 font-mono">{i + 1}</td>
                    <td className="border-b border-line px-2 py-1.5"><FamilyDot family={x.model.family} />{x.model.name}</td>
                    <td className="border-b border-line px-2 py-1.5 text-right font-mono font-semibold">{pct(x.accuracy, 1)} %</td>
                    <td className="border-b border-line px-2 py-1.5 text-right font-mono">{fmtMs(x.model.latencyMs)}</td>
                    <td className="border-b border-line px-2 py-1.5 text-right font-mono">{x.model.trainSize ? fmtDuration(x.trainSeconds) : tx("lab3.e.cs.noTrain")}</td>
                    <td className="border-b border-line px-2 py-1.5 text-muted">{tx(x.basis === "curve" ? "lab3.e.dec.rank.curve" : "lab3.e.dec.rank.run")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="mt-2 text-sm font-medium text-c-amber">{tx("lab3.e.dec.rank.empty")}</p>}
        {out.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-semibold">{tx("lab3.e.dec.rank.excluded", { n: out.length })}</summary>
            <ul className="mt-2 space-y-1.5 text-sm">
              {out.map((x) => (
                <li key={x.model.tag}><b>{x.model.name}</b>: <span className="text-muted">{x.reasons.map((q) => tx(`lab3.e.dec.rwhy.${q.key}`, q.vars)).join("; ")}</span></li>
              ))}
            </ul>
          </details>
        )}
        <p className="mt-3 text-xs text-muted">{r("lab3.e.dec.rank.note")}</p>
      </Demo>
    </div>
  );
}
