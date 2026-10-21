import { useMemo, useState } from "react";
import { Callout, Demo, Grid, Slider } from "../../ui";
import { CODE_FILES } from "../data/expCode";
import { byTag, fmtDuration, macroMetrics, nliHypothesis, NLI_TEMPLATE, softmax } from "../expMath";
import { useR, useTx } from "../rich";
import { fmtInt, fmtMs, pct } from "./shared";

const CARDS = ["pt_distilbert_sst2", "pt_twitter_roberta", "zs_nli_distilroberta"] as const;
/** Invented entailment logits for the toy: [positive, negative]. They are NOT outputs of the real model. */
const TOY: { id: string; pos: number; neg: number }[] = [
  { id: "clear", pos: 3.2, neg: -2.6 },
  { id: "mixed", pos: 0.6, neg: 0.2 },
  { id: "bad", pos: -2.2, neg: 2.9 },
];

function Toy() {
  const r = useR();
  const tx = useTx();
  const [pos, setPos] = useState(3.2);
  const [neg, setNeg] = useState(-2.6);
  const p = useMemo(() => softmax([pos, neg]), [pos, neg]);
  const label = p[0] >= p[1] ? "positive" : "negative";
  return (
    <Demo title={tx("lab3.e.rm.toy.title")}>
      <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-c-amber/60 bg-c-amber/10 px-2.5 py-1 text-xs font-semibold text-c-amber" data-testid="rm-toy-badge">⚠ {tx("lab3.e.rm.toy.badge")}</div>
      <p className="text-sm leading-relaxed text-muted">{r("lab3.e.rm.toy.lead")}</p>
      <ul className="mt-3 space-y-1 text-sm">
        {(["positive", "negative"] as const).map((c) => (
          <li key={c}><span className="text-xs uppercase tracking-wide text-muted">{tx(`lab3.e.x.${c}`)}</span> <code className="rounded bg-raised px-1.5 font-mono text-[0.92em]">{nliHypothesis(c)}</code></li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
        <Slider id="rm-pos" label={tx("lab3.e.rm.toy.sliderPos")} min={-6} max={6} step={0.1} value={pos} onChange={setPos} format={(v) => v.toFixed(1)} />
        <Slider id="rm-neg" label={tx("lab3.e.rm.toy.sliderNeg")} min={-6} max={6} step={0.1} value={neg} onChange={setNeg} format={(v) => v.toFixed(1)} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {TOY.map((t) => (
          <button key={t.id} type="button" className="chip hover:bg-surface" onClick={() => { setPos(t.pos); setNeg(t.neg); }}>{tx(`lab3.e.rm.toy.p.${t.id}`)}</button>
        ))}
      </div>
      <div role="status" aria-live="polite" className="mt-3 rounded-xl border border-line bg-raised/70 px-3 py-2 text-sm leading-relaxed" data-testid="rm-toy-out">
        <p className="font-mono text-[13px]">softmax([{pos.toFixed(1)}, {neg.toFixed(1)}]) = [{pct(p[0], 1)} %, {pct(p[1], 1)} %]</p>
        <p className="mt-1"><b>{tx("lab3.e.rm.toy.pred", { label: tx(`lab3.e.x.${label}`) })}</b></p>
      </div>
      <p className="mt-2 text-xs text-muted">{r("lab3.e.rm.toy.note")}</p>
    </Demo>
  );
}

function Card({ tag }: { tag: (typeof CARDS)[number] }) {
  const r = useR();
  const tx = useTx();
  const m = byTag(tag);
  const mac = macroMetrics(m.confusion);
  const k = tag === "pt_distilbert_sst2" ? "sst2" : tag === "pt_twitter_roberta" ? "tw" : "nli";
  return (
    <div className="card p-4 sm:p-5" data-testid={`rm-card-${k}`}>
      <h3 className="text-base font-semibold tracking-tight">{m.name}</h3>
      <p className="mt-0.5 break-all font-mono text-xs text-muted">{m.hub}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{r(`lab3.e.rm.card.${k}`)}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted">{tx("lab3.e.rs.col.acc")}</dt><dd className="text-right font-mono font-semibold">{pct(m.accuracy, 2)} %</dd>
        <dt className="text-muted">F1</dt><dd className="text-right font-mono">{pct(m.f1, 2)} %</dd>
        <dt className="text-muted">{tx("lab3.e.rm.recallNeg")}</dt><dd className="text-right font-mono">{pct(mac.perClass[0].recall, 1)} %</dd>
        <dt className="text-muted">{tx("lab3.e.rm.recallPos")}</dt><dd className="text-right font-mono">{pct(mac.perClass[1].recall, 1)} %</dd>
        <dt className="text-muted">{tx("lab3.e.rs.col.lat")}</dt><dd className="text-right font-mono">{fmtMs(m.latencyMs)}</dd>
        <dt className="text-muted">{tx("lab3.e.rs.col.params")}</dt><dd className="text-right font-mono">{fmtInt(m.params)}</dd>
        <dt className="text-muted">{tx("lab3.e.cs.col.train")}</dt><dd className="text-right font-mono">{tx("lab3.e.rm.zeroTrain")}</dd>
        <dt className="text-muted">{tx("lab3.e.rm.evalTime")}</dt><dd className="text-right font-mono">{fmtDuration((m.latencyMs * 872) / 1000)}</dd>
      </dl>
    </div>
  );
}

export default function ReadyMade() {
  const r = useR();
  const tx = useTx();
  const sst2 = byTag("pt_distilbert_sst2"), tw = byTag("pt_twitter_roberta"), nli = byTag("zs_nli_distilroberta"), lr = byTag("tfidf_logreg");
  const nliMac = macroMetrics(nli.confusion);
  const script = CODE_FILES.find((f) => f.file === "05_pretrained_transformers.py")!.code;
  const snippet = script.slice(script.indexOf("# 3. Zero-shot"));
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{r("lab3.e.rm.lead")}</p>
      <div className="grid gap-4 lg:grid-cols-3 [&>*]:min-w-0">{CARDS.map((t) => <Card key={t} tag={t} />)}</div>
      <Demo title={tx("lab3.e.rm.find.title")}>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
          <li>{r("lab3.e.rm.find.0", { acc: pct(sst2.accuracy) })}</li>
          <li>{r("lab3.e.rm.find.1", { loss: ((sst2.accuracy - tw.accuracy) * 100).toFixed(1), acc: pct(tw.accuracy) })}</li>
          <li>{r("lab3.e.rm.find.2", { acc: pct(nli.accuracy), lr: pct(lr.accuracy) })}</li>
          <li>{r("lab3.e.rm.find.3", { fn: nli.confusion[1][0], pos: nli.confusion[1][0] + nli.confusion[1][1], rec: pct(nliMac.perClass[1].recall, 1), recNeg: pct(nliMac.perClass[0].recall, 1) })}</li>
        </ul>
      </Demo>
      <Grid>
        <Toy />
        <Demo title={tx("lab3.e.rm.code.title")}>
          <p className="text-sm leading-relaxed text-muted">{r("lab3.e.rm.code.lead", { template: NLI_TEMPLATE })}</p>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-line bg-raised p-3 font-mono text-[12px] leading-relaxed" aria-label={tx("lab3.e.rm.code.label")}>{snippet}</pre>
          <p className="mt-2 text-xs text-muted">{r("lab3.e.rm.code.note")}</p>
        </Demo>
      </Grid>
      <Callout tone="warn" title={tx("lab3.e.x.recorded.title")}>{r("lab3.e.rm.recorded")}</Callout>
    </div>
  );
}
