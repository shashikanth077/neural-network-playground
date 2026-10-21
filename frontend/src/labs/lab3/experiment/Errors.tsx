import { useMemo, useState } from "react";
import { Callout, Demo } from "../../ui";
import { MODELS, SUBSETS } from "../data/expModels";
import {
  CONTRAST_RE, CONTRAST_WORDS, filterSentences, NEGATION_RE, NEGATION_WORDS, rightCount, subsetAccuracy, subsetIndices, type SentenceMode,
} from "../expMath";
import { useR, useTx } from "../rich";
import { FamilyDot, FamilyLegend, INPUT, Loading, ModelSelect, pct, SortTable, usePreds, type Col } from "./shared";

type Data = NonNullable<ReturnType<typeof usePreds>>;
const CODE: Record<string, string> = {
  tfidf_nb: "NB", tfidf_logreg: "LR", tfidf_svm: "SVM", bilstm: "LSTM", "ft_bert-tiny_8000": "tiny", "ft_bert-small_8000": "small",
  ft_distilbert_8000: "DB-ft", pt_distilbert_sst2: "SST2", pt_twitter_roberta: "TW", zs_nli_distilroberta: "ZS",
};
const MODES: SentenceMode[] = ["all", "disagree", "allWrong", "allRight", "negation", "contrast", "svmRightDistilWrong", "distilRightSvmWrong", "modelWrong"];
const PAGE = 40;
const ATTENTION_SENTENCE = "the plot was not good , but the acting was brilliant";

function SubsetTable({ data }: { data: Data }) {
  const r = useR();
  const tx = useTx();
  const { neg, con, rows } = useMemo(() => {
    const neg = subsetIndices(data.SENTENCES, NEGATION_RE), con = subsetIndices(data.SENTENCES, CONTRAST_RE);
    const rows = MODELS.map((m) => {
      const all = subsetAccuracy(data.PREDS[m.tag], data.GOLD, data.SENTENCES.map((_, i) => i));
      const n = subsetAccuracy(data.PREDS[m.tag], data.GOLD, neg), c = subsetAccuracy(data.PREDS[m.tag], data.GOLD, con);
      const rec = SUBSETS[m.tag];
      return { m, all, n, c, dn: (n - all) * 100, dc: (c - all) * 100, ok: Math.abs(n - rec.negation) < 1e-9 && Math.abs(c - rec.contrast) < 1e-9 && Math.abs(all - rec.all) < 1e-9 };
    });
    return { neg, con, rows };
  }, [data]);
  type Row = (typeof rows)[number];
  const bar = (v: number, color: string) => (
    <span className="flex items-center justify-end gap-2">
      <span aria-hidden className="hidden h-2 w-16 rounded bg-raised sm:block"><span className="block h-full rounded" style={{ width: `${Math.max(0, (v - 0.6) / 0.35) * 100}%`, background: color }} /></span>
      <span className="font-mono">{pct(v, 1)}</span>
    </span>
  );
  const sgn = (d: number) => <span className={d < -5 ? "text-bad" : d < -2 ? "text-c-amber" : "text-ok"}>{d >= 0 ? "+" : "−"}{Math.abs(d).toFixed(1)}</span>;
  const cols: Col<Row>[] = [
    { id: "name", label: tx("lab3.e.rs.col.model"), value: (x) => x.m.name, render: (x) => <span className="font-medium"><FamilyDot family={x.m.family} />{x.m.name}</span> },
    { id: "all", label: tx("lab3.e.er.col.all"), value: (x) => x.all, align: "right", render: (x) => bar(x.all, "rgb(var(--muted))") },
    { id: "neg", label: tx("lab3.e.er.col.neg", { n: neg.length }), value: (x) => x.n, align: "right", render: (x) => bar(x.n, "rgb(var(--pos))") },
    { id: "con", label: tx("lab3.e.er.col.con", { n: con.length }), value: (x) => x.c, align: "right", render: (x) => bar(x.c, "rgb(var(--neg))") },
    { id: "dn", label: tx("lab3.e.er.col.dn"), value: (x) => x.dn, align: "right", render: (x) => sgn(x.dn) },
    { id: "dc", label: tx("lab3.e.er.col.dc"), value: (x) => x.dc, align: "right", render: (x) => sgn(x.dc) },
  ];
  return (
    <Demo title={tx("lab3.e.er.subsets.title")}>
      <p className="text-sm leading-relaxed text-muted">{r("lab3.e.er.subsets.lead", { n: neg.length, c: con.length })}</p>
      <div className="mt-3">
        <SortTable rows={rows} cols={cols} rowKey={(x) => x.m.tag} initial={{ id: "dn", dir: 1 }} label={tx("lab3.e.er.subsets.title")} />
      </div>
      <p className="mt-2 text-xs text-muted">{tx("lab3.e.er.subsets.note")}</p>
      <p className={`mt-1 text-xs ${rows.every((x) => x.ok) ? "text-ok" : "text-bad"}`}>{rows.every((x) => x.ok) ? "✓ " : "✗ "}{tx("lab3.e.er.subsets.match")}</p>
    </Demo>
  );
}

function Rules({ data }: { data: Data }) {
  const r = useR();
  const tx = useTx();
  const neg = useMemo(() => subsetIndices(data.SENTENCES, NEGATION_RE).length, [data]);
  const con = useMemo(() => subsetIndices(data.SENTENCES, CONTRAST_RE).length, [data]);
  const chips = (ws: string[]) => ws.map((w) => <code key={w} className="mr-1.5 inline-block rounded bg-raised px-1.5 py-0.5 font-mono text-[0.92em]">{w}</code>);
  return (
    <Demo title={tx("lab3.e.er.rules.title")}>
      <p className="text-sm leading-relaxed text-muted">{r("lab3.e.er.rules.lead")}</p>
      <dl className="mt-3 space-y-3 text-sm">
        <div>
          <dt className="font-semibold">{tx("lab3.e.er.rules.neg")} <span className="font-mono text-brand" data-testid="er-neg-n">{neg}</span> / {data.SENTENCES.length}</dt>
          <dd className="mt-1">{chips(NEGATION_WORDS)}<span className="mt-1 block break-all font-mono text-xs text-muted">{NEGATION_RE.source}</span></dd>
        </div>
        <div>
          <dt className="font-semibold">{tx("lab3.e.er.rules.con")} <span className="font-mono text-brand" data-testid="er-con-n">{con}</span> / {data.SENTENCES.length}</dt>
          <dd className="mt-1">{chips(CONTRAST_WORDS)}<span className="mt-1 block break-all font-mono text-xs text-muted">{CONTRAST_RE.source}</span></dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-muted">{tx("lab3.e.er.rules.note")}</p>
    </Demo>
  );
}

function Attention() {
  const r = useR();
  const tx = useTx();
  return (
    <Demo title={tx("lab3.e.er.att.title")}>
      <p className="text-sm leading-relaxed text-muted">{r("lab3.e.er.att.lead", { s: ATTENTION_SENTENCE })}</p>
      <figure className="mt-3">
        <img src="/lab3/attention-fig7.png" alt={tx("lab3.e.er.att.alt")} width={1400} height={1200} loading="lazy" className="mx-auto h-auto w-full max-w-xl rounded-xl border border-line bg-white" />
        <figcaption className="mt-2 text-xs leading-relaxed text-muted">{r("lab3.e.er.att.caption")}</figcaption>
      </figure>
      <Callout tone="warn" title={tx("lab3.e.er.att.caution.title")}>{r("lab3.e.er.att.caution.body")}</Callout>
    </Demo>
  );
}

function Strip({ data, i }: { data: Data; i: number }) {
  const tx = useTx();
  const g = data.GOLD[i];
  return (
    <span className="flex flex-wrap gap-1" role="group" aria-label={tx("lab3.e.er.lab.strip")}>
      {MODELS.map((m) => {
        const p = data.PREDS[m.tag][i], ok = p === g;
        return (
          <span
            key={m.tag}
            role="img"
            data-ok={ok ? "1" : "0"}
            aria-label={`${m.name}: ${tx(p === "1" ? "lab3.e.x.positive" : "lab3.e.x.negative")}, ${tx(ok ? "lab3.e.er.lab.right" : "lab3.e.er.lab.wrong")}`}
            title={`${m.name}: ${tx(p === "1" ? "lab3.e.x.positive" : "lab3.e.x.negative")} ${ok ? "✓" : "✗"}`}
            className={`flex w-[2.6rem] flex-col items-center rounded border px-0.5 py-0.5 text-[9px] leading-tight ${ok ? "border-ok/50 bg-ok/10 text-ok" : "border-bad/50 bg-bad/10 text-bad"}`}
          >
            <span className="font-semibold">{CODE[m.tag]}</span>
            <span aria-hidden className="text-[11px]">{p === "1" ? "+" : "−"}{ok ? "✓" : "✗"}</span>
          </span>
        );
      })}
    </span>
  );
}

function SentenceLab({ data }: { data: Data }) {
  const r = useR();
  const tx = useTx();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SentenceMode>("all");
  const [tag, setTag] = useState("tfidf_svm");
  const [limit, setLimit] = useState(PAGE);
  const hits = useMemo(() => filterSentences(data.SENTENCES, data.GOLD, data.PREDS, { query, mode, tag }), [data, query, mode, tag]);
  const shown = hits.slice(0, limit);
  return (
    <Demo title={tx("lab3.e.er.lab.title")}>
      <p className="text-sm leading-relaxed text-muted">{r("lab3.e.er.lab.lead")}</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-[2]">
          <label htmlFor="er-search" className="block text-xs font-medium text-muted">{tx("lab3.e.er.lab.search")}</label>
          <input id="er-search" data-testid="er-search" type="search" value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }} placeholder={tx("lab3.e.er.lab.placeholder")} className={`${INPUT} mt-1`} />
        </div>
        <div className="min-w-[200px] flex-1">
          <label htmlFor="er-mode" className="block text-xs font-medium text-muted">{tx("lab3.e.er.lab.filter")}</label>
          <select id="er-mode" data-testid="er-mode" value={mode} onChange={(e) => { setMode(e.target.value as SentenceMode); setLimit(PAGE); }} className={`${INPUT} mt-1`}>
            {MODES.map((m) => <option key={m} value={m}>{tx(`lab3.e.er.mode.${m}`)}</option>)}
          </select>
        </div>
        {mode === "modelWrong" && <ModelSelect id="er-model" label={tx("lab3.e.er.lab.model")} value={tag} onChange={(t) => { setTag(t); setLimit(PAGE); }} />}
      </div>
      <p className="mt-2 text-xs text-muted">
        {MODELS.map((m) => <span key={m.tag} className="mr-3 inline-block whitespace-nowrap"><b className="font-mono text-ink">{CODE[m.tag]}</b> {m.name}</span>)}
      </p>
      <p role="status" aria-live="polite" className="mt-3 text-sm font-semibold" data-testid="er-count">{tx("lab3.e.er.lab.count", { n: hits.length, total: data.SENTENCES.length })}</p>
      <ul className="mt-2 divide-y divide-line rounded-xl border border-line" data-testid="er-list">
        {shown.map((i) => (
          <li key={i} className="space-y-1.5 px-3 py-2.5">
            <p className="text-sm leading-snug"><span className="mr-2 font-mono text-xs text-muted">#{i + 1}</span>{data.SENTENCES[i]}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="chip">{tx("lab3.e.er.lab.gold")}: {tx(data.GOLD[i] === "1" ? "lab3.e.x.positive" : "lab3.e.x.negative")}</span>
              <span className="text-xs text-muted">{tx("lab3.e.er.lab.rightCount", { k: rightCount(data.PREDS, data.GOLD, i), n: MODELS.length })}</span>
            </div>
            <Strip data={data} i={i} />
          </li>
        ))}
        {hits.length === 0 && <li className="px-3 py-4 text-sm text-muted">{tx("lab3.e.er.lab.none")}</li>}
      </ul>
      {hits.length > limit && (
        <button type="button" className="btn-ghost mt-3 !text-xs" onClick={() => setLimit((l) => l + PAGE * 2)}>{tx("lab3.e.er.lab.more", { n: Math.min(PAGE * 2, hits.length - limit) })}</button>
      )}
    </Demo>
  );
}

export default function Errors() {
  const r = useR();
  const tx = useTx();
  const data = usePreds();
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{r("lab3.e.er.lead")}</p>
      {data ? (
        <>
          <SubsetTable data={data} />
          <FamilyLegend />
          <Rules data={data} />
          <Attention />
          <SentenceLab data={data} />
        </>
      ) : <Loading />}
      <Callout tone="warn" title={tx("lab3.e.x.recorded.title")}>{r("lab3.e.er.recorded")}</Callout>
    </div>
  );
}

