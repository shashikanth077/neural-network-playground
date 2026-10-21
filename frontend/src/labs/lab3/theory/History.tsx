import { useState } from "react";
import { Demo, Seg } from "../../ui";
import { RECORDED } from "../data/theoryRecorded";
import { useR, useTx } from "../rich";
import { Bar, DemoHead, Heat, human, P } from "./shared";

interface Ev { id: string; year: number; who: string }
const EVENTS: Ev[] = [
  { id: "lstm", year: 1997, who: "Hochreiter & Schmidhuber" },
  { id: "w2v", year: 2013, who: "Mikolov et al." },
  { id: "bahdanau", year: 2015, who: "Bahdanau et al." },
  { id: "transformer", year: 2017, who: "Vaswani et al." },
  { id: "elmo", year: 2018, who: "Peters et al.; Howard & Ruder" },
  { id: "gpt", year: 2018, who: "Radford et al." },
  { id: "bert", year: 2019, who: "Devlin et al." },
  { id: "distil", year: 2019, who: "Sanh et al.; Turc et al.; Liu et al." },
  { id: "gpt3", year: 2020, who: "Brown et al." },
  { id: "t5", year: 2020, who: "Raffel et al.; Lewis et al." },
  { id: "litlat", year: 2021, who: "Ulčar & Robnik-Šikonja" },
  { id: "llama", year: 2024, who: "Nakvosas et al." },
];

type Fam = "enc" | "dec" | "encdec";
const MASK_TOKENS = ["the", "plot", "was", "not", "good", "."];
const full = MASK_TOKENS.map(() => MASK_TOKENS.map(() => 1));
const causal = MASK_TOKENS.map((_, i) => MASK_TOKENS.map((_, j) => (j <= i ? 1 : 0)));

/** Parameter counts quoted in the paper (BERT-tiny/small/DistilBERT: the three fine-tuned models of the experiment, with their heads). */
const SIZES: { name: string; params: number }[] = [
  { name: "BERT-tiny", params: 4386178 },
  { name: "BERT-small", params: 28764674 },
  { name: "DistilBERT", params: 66955010 },
  { name: "BERT-base", params: 110e6 },
  { name: "BERT-large", params: 340e6 },
  { name: "GPT-3", params: 175e9 },
];

export default function History() {
  const r = useR();
  const tx = useTx();
  const [sel, setSel] = useState(3);
  const [fam, setFam] = useState<Fam>("enc");
  const [lmI, setLmI] = useState(0);
  const ev = EVENTS[sel];
  const lm = RECORDED.lm[lmI];
  const logMin = 6;
  const logMax = 11.5;
  const distil = SIZES[2].params;

  return (
    <div className="space-y-5">
      <P k="lab3.t.hi.lead" />

      <Demo>
        <DemoHead title={tx("lab3.t.hi.tl.title")} tags={["paper"]} />
        <div className="-mx-1 overflow-x-auto px-1 pb-2">
          <div role="tablist" aria-label={tx("lab3.t.hi.tl.title")} className="flex min-w-max items-stretch gap-0">
            {EVENTS.map((e, i) => (
              <button
                key={e.id}
                role="tab"
                aria-selected={i === sel}
                onClick={() => setSel(i)}
                className={`relative min-w-[5.6rem] border-t-4 px-2 pb-1 pt-2 text-left transition ${i === sel ? "border-brand bg-brand/10" : "border-line hover:bg-raised"}`}
              >
                <span className="block font-mono text-xs font-bold text-brand">{e.year}</span>
                <span className="block text-xs font-medium leading-tight">{tx(`lab3.t.hi.e.${e.id}.t`)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 rounded-xl border border-line bg-raised/60 p-3" role="tabpanel" aria-live="polite" data-testid="hi-event">
          <p className="text-sm font-semibold"><span className="font-mono text-brand">{ev.year}</span> · {tx(`lab3.t.hi.e.${ev.id}.t`)} <span className="font-normal text-muted">({ev.who})</span></p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{r(`lab3.t.hi.e.${ev.id}.d`)}</p>
          <div className="mt-2 flex gap-2">
            <button type="button" className="btn-ghost !py-1 !text-xs" disabled={sel === 0} onClick={() => setSel(sel - 1)}>← {tx("lab3.t.hi.prev")}</button>
            <button type="button" className="btn-ghost !py-1 !text-xs" disabled={sel === EVENTS.length - 1} onClick={() => setSel(sel + 1)}>{tx("lab3.t.hi.next")} →</button>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">{r("lab3.t.hi.tl.note")}</p>
      </Demo>

      <Demo>
        <DemoHead title={tx("lab3.t.hi.fam.title")} tags={["paper", "recomputed"]} />
        <Seg<Fam>
          label={tx("lab3.t.hi.fam.title")}
          value={fam}
          onChange={setFam}
          options={[{ value: "enc", label: tx("lab3.t.hi.fam.enc") }, { value: "dec", label: tx("lab3.t.hi.fam.dec") }, { value: "encdec", label: tx("lab3.t.hi.fam.encdec") }]}
        />
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm leading-relaxed">{r(`lab3.t.hi.fam.${fam}.d`)}</p>
            <p className="text-sm leading-relaxed text-muted">{r(`lab3.t.hi.fam.${fam}.ex`)}</p>
          </div>
          <div className="space-y-3">
            {(fam === "enc" || fam === "encdec") && (
              <div>
                <p className="mb-1 text-xs font-semibold text-muted">{tx("lab3.t.hi.mask.enc")}</p>
                <Heat values={full} rowLabels={MASK_TOKENS} colLabels={MASK_TOKENS} showValues={false} cell="h-6 w-8" label={tx("lab3.t.hi.mask.enc")} small />
              </div>
            )}
            {(fam === "dec" || fam === "encdec") && (
              <div>
                <p className="mb-1 text-xs font-semibold text-muted">{tx("lab3.t.hi.mask.dec")}</p>
                <Heat values={causal} rowLabels={MASK_TOKENS} colLabels={MASK_TOKENS} showValues={false} cell="h-6 w-8" label={tx("lab3.t.hi.mask.dec")} small />
              </div>
            )}
            <p className="text-xs text-muted">{r("lab3.t.hi.mask.note")}</p>
          </div>
        </div>

        {fam === "dec" && (
          <div className="mt-4 border-t border-line pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold">{tx("lab3.t.hi.lm.title")}</p>
              <span className="inline-block rounded-full border border-ok/60 bg-ok/10 px-2 py-0.5 text-[11px] font-semibold text-ok">{tx("lab3.t.tag.recorded")}</span>
            </div>
            <p className="mt-1 text-xs text-muted">{r("lab3.t.hi.lm.hint", { model: RECORDED.lmModel.name, params: RECORDED.lmModel.params.toLocaleString("en-US").replace(/,/g, " ") })}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {RECORDED.lm.map((x, i) => (
                <button key={i} type="button" onClick={() => setLmI(i)} aria-pressed={i === lmI} className={`rounded-lg border px-2.5 py-1 text-left text-xs ${i === lmI ? "border-brand bg-brand/10" : "border-line bg-raised/60"}`}>{x.prompt}…</button>
              ))}
            </div>
            <div className="mt-2 space-y-1.5" aria-live="polite">
              <p className="font-mono text-sm">{lm.prompt} <b className="text-brand">?</b></p>
              {lm.top.map(([w, p]) => <Bar key={w} label={<span className="font-mono">{w.trim()}</span>} value={p} max={Math.max(...lm.top.map((t) => t[1]))} text={`${(p * 100).toFixed(1)} %`} tone="bg-ok" />)}
            </div>
          </div>
        )}

        {fam === "enc" && (
          <div className="mt-4 border-t border-line pt-3 text-sm leading-relaxed">
            <p className="font-semibold">{tx("lab3.t.hi.num.title")}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted">
              <li>{r("lab3.t.hi.num.bert")}</li>
              <li>{r("lab3.t.hi.num.distil")}</li>
            </ul>
          </div>
        )}
      </Demo>

      <Demo>
        <DemoHead title={tx("lab3.t.hi.size.title")} tags={["paper", "recomputed"]} />
        <P k="lab3.t.hi.size.hint" />
        <div className="mt-3 space-y-1.5">
          {SIZES.map((s) => (
            <Bar key={s.name} label={s.name} value={Math.log10(s.params) - logMin} max={logMax - logMin} text={human(s.params)} tone={s.name === "GPT-3" ? "bg-c-amber" : "bg-brand"} />
          ))}
        </div>
        <p className="mt-3 text-sm" aria-live="polite">{r("lab3.t.hi.size.ratio", { x: Math.round(SIZES[5].params / distil).toLocaleString("en-US").replace(/,/g, " ") })}</p>
      </Demo>
    </div>
  );
}
