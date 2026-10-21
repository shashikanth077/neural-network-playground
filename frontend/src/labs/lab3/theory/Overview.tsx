import { useMemo, useState } from "react";
import { Demo, Seg } from "../../ui";
import { RECORDED } from "../data/theoryRecorded";
import { useR, useTx } from "../rich";
import { DemoHead, fmtInt, P, StepLink, useStepTitle } from "./shared";

const RQ_STEPS: string[][] = [["results"], ["cost"], ["efficiency"], ["readymade"], ["errors"]];
const ROAD = ["tokens", "position", "attention", "heads", "encoder", "complexity", "training"];
type Fam = "all" | "classical" | "recurrent" | "transformer";
type Sort = "acc" | "params";

const famOf = (f: string): Exclude<Fam, "all"> => (f === "classical" ? "classical" : f === "recurrent" ? "recurrent" : "transformer");

export default function Overview() {
  const r = useR();
  const tx = useTx();
  const title = useStepTitle();
  const [fam, setFam] = useState<Fam>("all");
  const [sort, setSort] = useState<Sort>("acc");
  const rows = useMemo(() => {
    const list = RECORDED.models.filter((m) => fam === "all" || famOf(m.family) === fam);
    return [...list].sort((a, b) => (sort === "acc" ? b.acc - a.acc : a.params - b.params));
  }, [fam, sort]);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <P k="lab3.t.ov.lead1" />
        <P k="lab3.t.ov.lead2" />
      </div>

      <Demo>
        <DemoHead title={tx("lab3.t.ov.rq.title")} tags={["paper"]} />
        <ol className="space-y-3">
          {RQ_STEPS.map((steps, i) => (
            <li key={i} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
              <span className="w-10 shrink-0 font-mono text-sm font-bold text-brand">RQ{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed">{r(`lab3.t.ov.rq${i}`)}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {steps.map((s) => <StepLink key={s} to={s}>{title(s)}</StepLink>)}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Demo>

      <Demo>
        <DemoHead title={tx("lab3.t.ov.obj.title")} tags={["paper"]} />
        <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed">
          {[0, 1, 2, 3, 4].map((i) => <li key={i}>{r(`lab3.t.ov.obj${i}`)}</li>)}
        </ol>
      </Demo>

      <Demo>
        <DemoHead title={tx("lab3.t.ov.models.title")} tags={["recorded"]} />
        <P k="lab3.t.ov.models.hint" />
        <div className="mb-3 mt-3 flex flex-wrap items-center gap-3">
          <Seg<Fam>
            label={tx("lab3.t.ov.fam.label")}
            value={fam}
            onChange={setFam}
            options={[
              { value: "all", label: tx("lab3.t.ov.fam.all") }, { value: "classical", label: tx("lab3.t.ov.fam.classical") },
              { value: "recurrent", label: tx("lab3.t.ov.fam.recurrent") }, { value: "transformer", label: tx("lab3.t.ov.fam.transformer") },
            ]}
          />
          <Seg<Sort>
            label={tx("lab3.t.ov.sort.label")}
            value={sort}
            onChange={setSort}
            options={[{ value: "acc", label: tx("lab3.t.ov.sort.acc") }, { value: "params", label: tx("lab3.t.ov.sort.params") }]}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm" data-testid="ov-models">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="py-1.5 pr-2 font-medium">{tx("lab3.t.ov.col.model")}</th>
                <th className="px-2 font-medium">{tx("lab3.t.ov.col.family")}</th>
                <th className="px-2 text-right font-medium">{tx("lab3.t.ov.col.train")}</th>
                <th className="px-2 text-right font-medium">{tx("lab3.t.ov.col.params")}</th>
                <th className="pl-2 text-right font-medium">{tx("lab3.t.ov.col.acc")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.name} className="border-b border-line/60">
                  <td className="py-1.5 pr-2 font-medium">{m.name}</td>
                  <td className="px-2 text-muted">{tx(`lab3.t.ov.f.${m.family}`)}</td>
                  <td className="px-2 text-right font-mono">{m.trainSize ? fmtInt(m.trainSize) : tx("lab3.t.ov.noTrain")}</td>
                  <td className="px-2 text-right font-mono">{fmtInt(m.params)}</td>
                  <td className="pl-2 text-right font-mono font-semibold">{m.acc.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">{r("lab3.t.ov.models.note")}</p>
      </Demo>

      <Demo>
        <DemoHead title={tx("lab3.t.ov.road.title")} tags={[]} />
        <ul className="grid gap-2 sm:grid-cols-2">
          {ROAD.map((id) => (
            <li key={id} className="rounded-xl border border-line bg-raised/50 p-3">
              <StepLink to={id}>{title(id)}</StepLink>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{r(`lab3.t.ov.road.${id}`)}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">{r("lab3.t.ov.src")}</p>
      </Demo>
    </div>
  );
}
