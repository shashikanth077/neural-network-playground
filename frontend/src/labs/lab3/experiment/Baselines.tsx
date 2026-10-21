import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Callout, Demo, Grid } from "../../ui";
import { LR_BIAS, LR_FEATURES, LR_TOP_NEG, LR_TOP_POS } from "../data/expLrTop";
import { byTag, buildLrModel, lrScore, nbPredict, ngrams, tfidfRows, trainNb, wordTokens, type LrModel } from "../expMath";
import { useR, useTx } from "../rich";
import { fmtInt, INPUT, Loading, pct, usePreds } from "./shared";

let lrCache: Promise<LrModel> | null = null;
/** The real model is stored in four chunks of about 330 kB; they are fetched only when this step opens. */
function loadLr(): Promise<LrModel> {
  lrCache ??= Promise.all([import("../data/expLr0"), import("../data/expLr1"), import("../data/expLr2"), import("../data/expLr3")])
    .then((m) => buildLrModel(m.map((x) => x.LR_CHUNK), LR_BIAS));
  return lrCache;
}
function useLr() {
  const [m, setM] = useState<LrModel | null>(null);
  useEffect(() => {
    let live = true;
    loadLr().then((x) => { if (live) setM(x); });
    return () => { live = false; };
  }, []);
  return m;
}

const PRESETS = ["not good", "not bad", "good", "bad", "the plot was not good , but the acting was brilliant"];
const f2 = (v: number) => v.toFixed(2);
const f3 = (v: number) => v.toFixed(3);
const sgn = (v: number) => (v >= 0 ? "+" : "") + v.toFixed(3);

function ContribBar({ v, max }: { v: number; max: number }) {
  const w = Math.min(100, (Math.abs(v) / max) * 100);
  return (
    <span aria-hidden className="relative block h-2.5 w-24 rounded bg-raised">
      <span className="absolute top-0 h-full rounded" style={{ width: `${w / 2}%`, left: v >= 0 ? "50%" : `${50 - w / 2}%`, background: v >= 0 ? "rgb(var(--ok))" : "rgb(var(--bad))" }} />
      <span className="absolute left-1/2 top-0 h-full w-px bg-line" />
    </span>
  );
}

function TfidfDemo() {
  const r = useR();
  const tx = useTx();
  const model = useLr();
  const data = usePreds();
  const [text, setText] = useState(PRESETS[0]);
  const calc = useMemo(() => {
    if (!model) return null;
    const rows = tfidfRows(text, model);
    const { z, p } = lrScore(rows, model.bias);
    const unknown = wordTokens(text).filter((t) => !model.index.has(t));
    return { rows, z, p, unknown, grams: ngrams(wordTokens(text)).length };
  }, [model, text]);
  const recorded = useMemo(() => {
    if (!data) return null;
    const i = data.SENTENCES.indexOf(text.trim().toLowerCase());
    return i < 0 ? null : ["tfidf_nb", "tfidf_logreg", "tfidf_svm"].map((t) => ({ tag: t, pred: data.PREDS[t][i], gold: data.GOLD[i] }));
  }, [data, text]);
  const shown = calc?.rows.slice(0, 10) ?? [];
  const maxC = Math.max(0.01, ...shown.map((x) => Math.abs(x.contribution)));
  return (
    <Demo title={tx("lab3.e.bl.lr.title")}>
      <p className="text-sm leading-relaxed text-muted">{r("lab3.e.bl.lr.lead", { n: fmtInt(LR_FEATURES) })}</p>
      <div className="mt-3">
        <label htmlFor="bl-text" className="block text-xs font-medium text-muted">{tx("lab3.e.bl.lr.input")}</label>
        <input id="bl-text" data-testid="bl-input" type="text" value={text} onChange={(e) => setText(e.target.value)} className={`${INPUT} mt-1`} maxLength={200} spellCheck={false} />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button key={p} type="button" className="chip hover:bg-surface" onClick={() => setText(p)}>{p.length > 28 ? p.slice(0, 26) + "…" : p}</button>
          ))}
        </div>
      </div>
      {!calc ? <div className="mt-3"><Loading /></div> : (
        <>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-xs sm:text-sm" aria-label={tx("lab3.e.bl.lr.table")} data-testid="bl-table">
              <thead>
                <tr className="text-left text-muted">
                  <th scope="col" className="border-b border-line px-2 py-1.5">{tx("lab3.e.bl.col.term")}</th>
                  <th scope="col" className="border-b border-line px-2 py-1.5 text-right">tf</th>
                  <th scope="col" className="border-b border-line px-2 py-1.5 text-right">idf</th>
                  <th scope="col" className="border-b border-line px-2 py-1.5 text-right">{tx("lab3.e.bl.col.weight")}</th>
                  <th scope="col" className="border-b border-line px-2 py-1.5 text-right">{tx("lab3.e.bl.col.coef")}</th>
                  <th scope="col" className="border-b border-line px-2 py-1.5 text-right">{tx("lab3.e.bl.col.contrib")}</th>
                  <th scope="col" className="border-b border-line px-2 py-1.5" aria-label={tx("lab3.e.bl.col.bar")} />
                </tr>
              </thead>
              <tbody>
                {shown.map((x) => (
                  <tr key={x.term}>
                    <td className="border-b border-line px-2 py-1.5 font-mono">{x.term}</td>
                    <td className="border-b border-line px-2 py-1.5 text-right font-mono">{x.tf}</td>
                    <td className="border-b border-line px-2 py-1.5 text-right font-mono">{f2(x.idf)}</td>
                    <td className="border-b border-line px-2 py-1.5 text-right font-mono">{f3(x.weight)}</td>
                    <td className="border-b border-line px-2 py-1.5 text-right font-mono">{sgn(x.coef)}</td>
                    <td className={`border-b border-line px-2 py-1.5 text-right font-mono ${x.contribution >= 0 ? "text-ok" : "text-bad"}`}>{sgn(x.contribution)}</td>
                    <td className="border-b border-line px-2 py-1.5"><ContribBar v={x.contribution} max={maxC} /></td>
                  </tr>
                ))}
                {shown.length === 0 && <tr><td colSpan={7} className="px-2 py-3 text-muted">{tx("lab3.e.bl.lr.none")}</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">
            {calc.rows.length > shown.length ? tx("lab3.e.bl.lr.more", { n: calc.rows.length - shown.length }) + " " : ""}
            {calc.unknown.length > 0 ? tx("lab3.e.bl.lr.unknown", { words: calc.unknown.join(", ") }) : ""}
          </p>
          <div role="status" aria-live="polite" className="mt-3 rounded-xl border border-line bg-raised/70 px-3 py-2 text-sm leading-relaxed" data-testid="bl-out">
            <p className="font-mono text-[13px]">z = {LR_BIAS.toFixed(2)} {calc.rows.length ? `+ ${calc.rows.length > 1 ? "Σ" : ""}(${tx("lab3.e.bl.col.contrib")})` : ""} = <b>{f3(calc.z)}</b></p>
            <p className="mt-1">
              {r("lab3.e.bl.lr.result", { p: pct(calc.p, 1), label: tx(calc.p >= 0.5 ? "lab3.e.x.positive" : "lab3.e.x.negative") })}
            </p>
          </div>
          {recorded && (
            <p className="mt-2 text-sm" data-testid="bl-recorded">
              {tx("lab3.e.bl.lr.recorded", { gold: tx(recorded[0].gold === "1" ? "lab3.e.x.positive" : "lab3.e.x.negative") })}{" "}
              {recorded.map((x) => (
                <span key={x.tag} className={`chip mr-1 ${x.pred === x.gold ? "!border-ok/50 !text-ok" : "!border-bad/50 !text-bad"}`}>
                  {byTag(x.tag).short}: {tx(x.pred === "1" ? "lab3.e.x.positive" : "lab3.e.x.negative")} {x.pred === x.gold ? "✓" : "✗"}
                </span>
              ))}
            </p>
          )}
        </>
      )}
      <Callout title={tx("lab3.e.bl.lr.fail.title")}>
        {model ? r("lab3.e.bl.lr.fail.body", {
          not: sgn(model.coef[model.index.get("not")!]),
          good: sgn(model.coef[model.index.get("good")!]),
          ng: sgn(model.coef[model.index.get("not good")!]),
          nb: sgn(model.coef[model.index.get("not bad")!]),
        }) : tx("lab3.e.x.loading")}
      </Callout>
    </Demo>
  );
}

function NbDemo() {
  const r = useR();
  const tx = useTx();
  const data = usePreds();
  const [text, setText] = useState("a wonderful but slow film");
  const nb = useMemo(() => (data ? trainNb(data.SENTENCES, [...data.GOLD].map(Number), 0.5) : null), [data]);
  const out = useMemo(() => (nb ? nbPredict(nb, text) : null), [nb, text]);
  return (
    <Demo title={tx("lab3.e.bl.nb.title")}>
      <p className="text-sm leading-relaxed text-muted">{r("lab3.e.bl.nb.lead")}</p>
      <Callout tone="warn" title={tx("lab3.e.bl.nb.honest.title")}>{r("lab3.e.bl.nb.honest.body", { n: byTag("tfidf_nb").trainSize.toLocaleString("en-US") })}</Callout>
      <div className="mt-3">
        <label htmlFor="bl-nb-text" className="block text-xs font-medium text-muted">{tx("lab3.e.bl.lr.input")}</label>
        <input id="bl-nb-text" type="text" value={text} onChange={(e) => setText(e.target.value)} className={`${INPUT} mt-1`} maxLength={200} spellCheck={false} />
      </div>
      {!out ? <div className="mt-3"><Loading /></div> : (
        <>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-xs sm:text-sm" aria-label={tx("lab3.e.bl.nb.table")}>
              <thead>
                <tr className="text-left text-muted">
                  <th scope="col" className="border-b border-line px-2 py-1.5">{tx("lab3.e.bl.col.term")}</th>
                  <th scope="col" className="border-b border-line px-2 py-1.5 text-right">{tx("lab3.e.bl.nb.count")}</th>
                  <th scope="col" className="border-b border-line px-2 py-1.5 text-right">ln P(t | +)</th>
                  <th scope="col" className="border-b border-line px-2 py-1.5 text-right">ln P(t | −)</th>
                  <th scope="col" className="border-b border-line px-2 py-1.5 text-right">Δ</th>
                </tr>
              </thead>
              <tbody>
                {out.terms.map((t) => (
                  <tr key={t.term}>
                    <td className="border-b border-line px-2 py-1.5 font-mono">{t.term}</td>
                    <td className="border-b border-line px-2 py-1.5 text-right font-mono">{t.count}</td>
                    <td className="border-b border-line px-2 py-1.5 text-right font-mono">{t.logPos.toFixed(2)}</td>
                    <td className="border-b border-line px-2 py-1.5 text-right font-mono">{t.logNeg.toFixed(2)}</td>
                    <td className={`border-b border-line px-2 py-1.5 text-right font-mono ${t.delta >= 0 ? "text-ok" : "text-bad"}`}>{sgn(t.delta)}</td>
                  </tr>
                ))}
                {out.terms.length === 0 && <tr><td colSpan={5} className="px-2 py-3 text-muted">{tx("lab3.e.bl.lr.none")}</td></tr>}
              </tbody>
            </table>
          </div>
          <div role="status" aria-live="polite" className="mt-3 rounded-xl border border-line bg-raised/70 px-3 py-2 text-sm leading-relaxed" data-testid="bl-nb-out">
            <p className="font-mono text-[13px]">ln P(+) − ln P(−) = {(out.logPosterior[1] - out.logPosterior[0]).toFixed(3)}</p>
            <p className="mt-1">{r("lab3.e.bl.lr.result", { p: pct(out.pPositive, 1), label: tx(out.pPositive >= 0.5 ? "lab3.e.x.positive" : "lab3.e.x.negative") })}</p>
          </div>
        </>
      )}
    </Demo>
  );
}

function TopWeights() {
  const tx = useTx();
  const list = (rows: typeof LR_TOP_POS, tone: string) => (
    <ul className="space-y-0.5 font-mono text-xs sm:text-sm">
      {rows.slice(0, 12).map((x) => (
        <li key={x.t} className="flex justify-between gap-3"><span className="min-w-0 truncate">{x.t}</span><span className={tone}>{sgn(x.w)}</span></li>
      ))}
    </ul>
  );
  return (
    <Demo title={tx("lab3.e.bl.top.title")}>
      <Grid>
        <div><h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ok">{tx("lab3.e.bl.top.pos")}</h4>{list(LR_TOP_POS, "text-ok")}</div>
        <div><h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-bad">{tx("lab3.e.bl.top.neg")}</h4>{list(LR_TOP_NEG, "text-bad")}</div>
      </Grid>
      <p className="mt-3 text-xs text-muted">{tx("lab3.e.bl.top.note")}</p>
    </Demo>
  );
}

function Recap() {
  const r = useR();
  const tx = useTx();
  const m = byTag("bilstm");
  return (
    <Demo title={tx("lab3.e.bl.lstm.title")}>
      <p className="text-sm leading-relaxed text-muted">
        {r("lab3.e.bl.lstm.body", {
          params: fmtInt(m.params), acc: pct(m.accuracy), dev: pct(m.devHistory[m.devHistory.length - 1]), min: (m.trainSeconds / 60).toFixed(1),
        })}
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full max-w-md text-sm" aria-label={tx("lab3.e.bl.lstm.table")}>
          <thead><tr className="text-left text-muted"><th scope="col" className="border-b border-line px-2 py-1">{tx("lab3.e.bl.lstm.epoch")}</th><th scope="col" className="border-b border-line px-2 py-1 text-right">{tx("lab3.e.bl.lstm.dev")}</th></tr></thead>
          <tbody>
            {m.devHistory.map((a, i) => (
              <tr key={i}><td className="border-b border-line px-2 py-1 font-mono">{i + 1}</td><td className="border-b border-line px-2 py-1 text-right font-mono">{pct(a, 2)} %</td></tr>
            ))}
            <tr className="font-semibold"><td className="px-2 py-1">{tx("lab3.e.bl.lstm.test")}</td><td className="px-2 py-1 text-right font-mono">{pct(m.accuracy, 2)} %</td></tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-muted">
        {r("lab3.e.bl.lstm.link")}{" "}
        <Link to="/labs/lab2/rnn" className="font-medium text-brand underline-offset-2 hover:underline">{tx("lab3.e.bl.lstm.linkText")}</Link>
      </p>
    </Demo>
  );
}

export default function Baselines() {
  const r = useR();
  const tx = useTx();
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{r("lab3.e.bl.lead")}</p>
      <TfidfDemo />
      <NbDemo />
      <TopWeights />
      <Recap />
      <Callout tone="warn" title={tx("lab3.e.x.recorded.title")}>{r("lab3.e.bl.recorded")}</Callout>
    </div>
  );
}
