import { useEffect, useMemo, useState } from "react";
import { Callout, Demo } from "../../ui";
import { MODELS, STATS, type ModelRec } from "../data/expModels";
import { accuracy, bootstrapIntervals, byTag, confusion, correctness, fmtP, macroMetrics, mcnemar } from "../expMath";
import { useR, useTx } from "../rich";
import { BarList, FAM_COLOR, FAM_KEY, FamilyDot, FamilyLegend, fmtInt, fmtMs, fmtParams, Loading, ModelSelect, pct, SortTable, usePreds, type Col } from "./shared";

const BEST = "pt_distilbert_sst2";
const PAIRS: [string, string][] = [["ft_distilbert_8000", BEST], ["ft_distilbert_8000", "tfidf_svm"], ["ft_bert-small_8000", "tfidf_svm"], ["bilstm", "tfidf_svm"], ["zs_nli_distilroberta", "tfidf_logreg"]];

function ResultsTable() {
  const tx = useTx();
  const cols: Col<ModelRec>[] = [
    { id: "name", label: tx("lab3.e.rs.col.model"), value: (m) => m.name, render: (m) => <span className="font-medium"><FamilyDot family={m.family} />{m.name}</span> },
    { id: "family", label: tx("lab3.e.rs.col.family"), value: (m) => m.family, render: (m) => <span className="text-muted">{tx(FAM_KEY[m.family])}</span> },
    { id: "pre", label: tx("lab3.e.rs.col.pre"), value: (m) => Number(m.pretrained), render: (m) => tx(m.pretrained ? "lab3.e.x.yes" : "lab3.e.x.no") },
    { id: "n", label: tx("lab3.e.rs.col.n"), value: (m) => m.trainSize, align: "right", render: (m) => (m.trainSize ? fmtInt(m.trainSize) : "0") },
    { id: "params", label: tx("lab3.e.rs.col.params"), value: (m) => m.params, align: "right", render: (m) => fmtParams(m.params) },
    { id: "acc", label: tx("lab3.e.rs.col.acc"), value: (m) => m.accuracy, align: "right", render: (m) => <b>{pct(m.accuracy, 2)}</b> },
    { id: "prec", label: tx("lab3.e.rs.col.prec"), value: (m) => m.precision, align: "right", render: (m) => pct(m.precision, 2) },
    { id: "rec", label: tx("lab3.e.rs.col.rec"), value: (m) => m.recall, align: "right", render: (m) => pct(m.recall, 2) },
    { id: "f1", label: "F1", value: (m) => m.f1, align: "right", render: (m) => pct(m.f1, 2) },
    { id: "train", label: tx("lab3.e.rs.col.train"), value: (m) => m.trainSeconds, align: "right", render: (m) => (m.trainSeconds ? Math.round(m.trainSeconds).toString() : "0") },
    { id: "lat", label: tx("lab3.e.rs.col.lat"), value: (m) => m.latencyMs, align: "right", render: (m) => fmtMs(m.latencyMs) },
  ];
  return (
    <SortTable rows={MODELS} cols={cols} rowKey={(m) => m.tag} initial={{ id: "acc", dir: -1 }} label={tx("lab3.e.rs.table")} rowClass={(m) => (m.tag === BEST ? "bg-ok/10" : "")} />
  );
}

function Stats({ data }: { data: NonNullable<ReturnType<typeof usePreds>> }) {
  const r = useR();
  const tx = useTx();
  const [ci, setCi] = useState<{ low: number; high: number }[] | null>(null);
  const corr = useMemo(() => MODELS.map((m) => correctness(data.PREDS[m.tag], data.GOLD)), [data]);
  useEffect(() => {
    let live = true;
    const id = setTimeout(() => { const out = bootstrapIntervals(corr, 2000, 42); if (live) setCi(out); }, 20);
    return () => { live = false; clearTimeout(id); };
  }, [corr]);
  const rows = useMemo(() => MODELS.map((m, k) => {
    const mc = mcnemar(data.PREDS[BEST], data.PREDS[m.tag], data.GOLD);
    const s = STATS[m.tag];
    return { m, k, acc: accuracy(data.PREDS[m.tag], data.GOLD), mc, rec: s, ok: mc.onlyA === s.bestOnly && mc.onlyB === s.modelOnly && Math.abs(mc.p - s.p) <= 1e-6 * Math.max(s.p, 1e-300) };
  }).sort((a, b) => b.acc - a.acc), [data]);
  return (
    <Demo title={tx("lab3.e.rs.stats.title")}>
      <p className="text-sm leading-relaxed text-muted">{r("lab3.e.rs.stats.lead", { best: byTag(BEST).name })}</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[760px] text-xs sm:text-sm" aria-label={tx("lab3.e.rs.stats.title")} data-testid="rs-stats">
          <thead>
            <tr className="text-left text-muted">
              <th scope="col" className="border-b border-line px-2 py-1.5">{tx("lab3.e.rs.col.model")}</th>
              <th scope="col" className="border-b border-line px-2 py-1.5 text-right">{tx("lab3.e.rs.col.acc")}</th>
              <th scope="col" className="border-b border-line px-2 py-1.5 text-right">{tx("lab3.e.rs.stats.ciRec")}</th>
              <th scope="col" className="border-b border-line px-2 py-1.5 text-right">{tx("lab3.e.rs.stats.ciNew")}</th>
              <th scope="col" className="border-b border-line px-2 py-1.5 text-right" title={tx("lab3.e.rs.stats.bTip")}>b</th>
              <th scope="col" className="border-b border-line px-2 py-1.5 text-right" title={tx("lab3.e.rs.stats.cTip")}>c</th>
              <th scope="col" className="border-b border-line px-2 py-1.5 text-right">p ({tx("lab3.e.rs.stats.recomputed")})</th>
              <th scope="col" className="border-b border-line px-2 py-1.5 text-right">p ({tx("lab3.e.rs.stats.recorded")})</th>
              <th scope="col" className="border-b border-line px-2 py-1.5 text-center">=</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ m, k, acc, mc, rec, ok }) => (
              <tr key={m.tag} className={m.tag === BEST ? "bg-ok/10" : ""}>
                <td className="border-b border-line px-2 py-1.5"><FamilyDot family={m.family} />{m.name}</td>
                <td className="border-b border-line px-2 py-1.5 text-right font-mono">{pct(acc, 2)}</td>
                <td className="border-b border-line px-2 py-1.5 text-right font-mono">{pct(rec.ciLow, 1)} – {pct(rec.ciHigh, 1)}</td>
                <td className="border-b border-line px-2 py-1.5 text-right font-mono" data-testid="rs-ci">{ci ? `${pct(ci[k].low, 1)} – ${pct(ci[k].high, 1)}` : "…"}</td>
                <td className="border-b border-line px-2 py-1.5 text-right font-mono">{mc.onlyA}</td>
                <td className="border-b border-line px-2 py-1.5 text-right font-mono">{mc.onlyB}</td>
                <td className="border-b border-line px-2 py-1.5 text-right font-mono">{m.tag === BEST ? "1.0" : mc.p < 0.001 ? mc.p.toExponential(2) : mc.p.toFixed(4)}</td>
                <td className="border-b border-line px-2 py-1.5 text-right font-mono">{rec.p === 1 ? "1.0" : rec.p < 0.001 ? rec.p.toExponential(2) : rec.p.toFixed(4)}</td>
                <td className={`border-b border-line px-2 py-1.5 text-center ${ok ? "text-ok" : "text-bad"}`} aria-label={tx(ok ? "lab3.e.rs.stats.match" : "lab3.e.rs.stats.nomatch")}>{ok ? "✓" : "✗"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">{r("lab3.e.rs.stats.note")}</p>
      <Callout title={tx("lab3.e.rs.stats.honest.title")}>{r("lab3.e.rs.stats.honest.body")}</Callout>
    </Demo>
  );
}

function Pair({ data }: { data: NonNullable<ReturnType<typeof usePreds>> }) {
  const r = useR();
  const tx = useTx();
  const [a, setA] = useState(PAIRS[1][0]);
  const [b, setB] = useState(PAIRS[1][1]);
  const mc = useMemo(() => mcnemar(data.PREDS[a], data.PREDS[b], data.GOLD), [data, a, b]);
  const same = a === b;
  return (
    <Demo title={tx("lab3.e.rs.pair.title")}>
      <p className="text-sm leading-relaxed text-muted">{r("lab3.e.rs.pair.lead")}</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <ModelSelect id="rs-pair-a" label={tx("lab3.e.rs.pair.a")} value={a} onChange={setA} />
        <ModelSelect id="rs-pair-b" label={tx("lab3.e.rs.pair.b")} value={b} onChange={setB} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PAIRS.map(([x, y]) => (
          <button key={x + y} type="button" className="chip hover:bg-surface" onClick={() => { setA(x); setB(y); }}>{byTag(x).short} · {byTag(y).short}</button>
        ))}
      </div>
      <div role="status" aria-live="polite" className="mt-3 rounded-xl border border-line bg-raised/70 px-3 py-2 text-sm leading-relaxed" data-testid="rs-pair-out">
        {same ? tx("lab3.e.rs.pair.same") : (
          <>
            <p>{r("lab3.e.rs.pair.counts", { a: byTag(a).name, b: byTag(b).name, ab: mc.onlyA, ba: mc.onlyB })}</p>
            <p className="mt-1">
              <b>p {mc.p < 0.001 ? "< 0.001" : `= ${fmtP(mc.p)}`}</b> · {tx(mc.p < 0.05 ? "lab3.e.rs.pair.sig" : "lab3.e.rs.pair.nosig")}
            </p>
          </>
        )}
      </div>
    </Demo>
  );
}

function Confusion({ data }: { data: NonNullable<ReturnType<typeof usePreds>> }) {
  const r = useR();
  const tx = useTx();
  const [tag, setTag] = useState("ft_distilbert_8000");
  const m = byTag(tag);
  const cm = useMemo(() => confusion(data.PREDS[tag], data.GOLD), [data, tag]);
  const mac = macroMetrics(cm);
  const same = JSON.stringify(cm) === JSON.stringify(m.confusion)
    && Math.abs(mac.f1 - m.f1) < 1e-9 && Math.abs(mac.precision - m.precision) < 1e-9 && Math.abs(mac.recall - m.recall) < 1e-9;
  const cell = (v: number, good: boolean) => (
    <td className={`border border-line p-3 text-center font-mono text-lg ${good ? "bg-ok/15" : "bg-bad/10"}`}>{v}</td>
  );
  return (
    <Demo title={tx("lab3.e.rs.cm.title")}>
      <ModelSelect id="rs-cm" label={tx("lab3.e.rs.cm.pick")} value={tag} onChange={setTag} />
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div className="overflow-x-auto">
          <table className="mx-auto text-sm" aria-label={tx("lab3.e.rs.cm.title")} data-testid="rs-cm">
            <thead>
              <tr><th className="p-1" /><th scope="col" colSpan={2} className="p-1 text-xs font-semibold uppercase tracking-wide text-muted">{tx("lab3.e.rs.cm.pred")}</th></tr>
              <tr><th className="p-1" /><th scope="col" className="p-1 text-xs text-muted">{tx("lab3.e.x.negative")}</th><th scope="col" className="p-1 text-xs text-muted">{tx("lab3.e.x.positive")}</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row" className="pr-2 text-right text-xs text-muted">{tx("lab3.e.rs.cm.true")} · {tx("lab3.e.x.negative")}</th>{cell(cm[0][0], true)}{cell(cm[0][1], false)}</tr>
              <tr><th scope="row" className="pr-2 text-right text-xs text-muted">{tx("lab3.e.rs.cm.true")} · {tx("lab3.e.x.positive")}</th>{cell(cm[1][0], false)}{cell(cm[1][1], true)}</tr>
            </tbody>
          </table>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label={tx("lab3.e.rs.cm.metrics")}>
            <thead><tr className="text-left text-muted"><th className="border-b border-line px-2 py-1" /><th scope="col" className="border-b border-line px-2 py-1 text-right">{tx("lab3.e.rs.col.prec")}</th><th scope="col" className="border-b border-line px-2 py-1 text-right">{tx("lab3.e.rs.col.rec")}</th><th scope="col" className="border-b border-line px-2 py-1 text-right">F1</th></tr></thead>
            <tbody>
              {(["negative", "positive"] as const).map((c, i) => (
                <tr key={c}><th scope="row" className="border-b border-line px-2 py-1 text-left font-medium">{tx(`lab3.e.x.${c}`)}</th>
                  <td className="border-b border-line px-2 py-1 text-right font-mono">{pct(mac.perClass[i].precision, 2)}</td>
                  <td className="border-b border-line px-2 py-1 text-right font-mono">{pct(mac.perClass[i].recall, 2)}</td>
                  <td className="border-b border-line px-2 py-1 text-right font-mono">{pct(mac.perClass[i].f1, 2)}</td></tr>
              ))}
              <tr className="font-semibold"><th scope="row" className="px-2 py-1 text-left">{tx("lab3.e.rs.cm.macro")}</th>
                <td className="px-2 py-1 text-right font-mono">{pct(mac.precision, 2)}</td><td className="px-2 py-1 text-right font-mono">{pct(mac.recall, 2)}</td><td className="px-2 py-1 text-right font-mono">{pct(mac.f1, 2)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <p className={`mt-3 text-sm ${same ? "text-ok" : "text-bad"}`} role="status">{same ? "✓ " : "✗ "}{r(same ? "lab3.e.rs.cm.match" : "lab3.e.rs.cm.nomatch")}</p>
    </Demo>
  );
}

export default function Results() {
  const r = useR();
  const tx = useTx();
  const data = usePreds();
  const sorted = MODELS.slice().sort((a, b) => b.accuracy - a.accuracy);
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{r("lab3.e.rs.lead")}</p>
      <Demo title={tx("lab3.e.rs.table")}>
        <p className="mb-2 text-xs text-muted">{tx("lab3.e.rs.sortHint")}</p>
        <ResultsTable />
        <p className="mt-2 text-xs text-muted">{tx("lab3.e.rs.units")}</p>
      </Demo>
      <Demo title={tx("lab3.e.rs.bars")}>
        <BarList
          label={tx("lab3.e.rs.bars")}
          min={70}
          max={95}
          rows={sorted.map((m) => ({ key: m.tag, label: m.name, value: m.accuracy * 100, text: `${pct(m.accuracy)} %`, color: FAM_COLOR[m.family] }))}
        />
        <FamilyLegend />
        <p className="mt-2 text-xs text-muted">{tx("lab3.e.rs.bars.note")}</p>
      </Demo>
      <p className="text-sm leading-relaxed">{r("lab3.e.rs.groups", {
        sst2: pct(byTag("pt_distilbert_sst2").accuracy), ft: pct(byTag("ft_distilbert_8000").accuracy), tw: pct(byTag("pt_twitter_roberta").accuracy),
        small: pct(byTag("ft_bert-small_8000").accuracy), tiny: pct(byTag("ft_bert-tiny_8000").accuracy),
        lo: pct(Math.min(...["tfidf_nb", "tfidf_logreg", "tfidf_svm", "bilstm", "zs_nli_distilroberta"].map((t) => byTag(t).accuracy))),
        hi: pct(Math.max(...["tfidf_nb", "tfidf_logreg", "tfidf_svm", "bilstm", "zs_nli_distilroberta"].map((t) => byTag(t).accuracy))),
      })}</p>
      {data ? (
        <>
          <Stats data={data} />
          <Pair data={data} />
          <Confusion data={data} />
        </>
      ) : <Loading />}
      <Callout tone="warn" title={tx("lab3.e.x.recorded.title")}>{r("lab3.e.rs.recorded")}</Callout>
    </div>
  );
}
