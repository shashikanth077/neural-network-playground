import { useMemo, useState } from "react";
import { Callout, Demo, Grid, Seg } from "../../ui";
import { DATASET, MODELS, type Family } from "../data/expModels";
import { splitFacts } from "../expMath";
import { useR, useTx } from "../rich";
import { FAM_KEY, FamilyDot, FamilyLegend, fmtInt, fmtParams, pct, usePreds } from "./shared";

/** Layers / hidden size / heads of the three fine-tuned encoders (paper, Table 5; architecture of the checkpoints). */
const ARCH: Record<string, [number, number, number]> = {
  "ft_bert-tiny_8000": [2, 128, 2],
  "ft_bert-small_8000": [4, 512, 8],
  "ft_distilbert_8000": [6, 768, 12],
};
const RQ = [1, 2, 3, 4, 5];
const CRITERIA = [0, 1, 2, 3, 4, 5];
const PROTOCOL = [1, 2, 3, 4, 5];
const THREATS = ["seed", "subsets", "domain", "timing", "ready"];
type Filter = "all" | Family;
/** 0.0002 -> "2·10⁻⁴" */
const fmtLr = (v: number) => {
  const [m, e] = v.toExponential(0).split("e");
  return `${m}·10⁻${[...String(Math.abs(Number(e)))].map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)]).join("")}`;
};

function Splits() {
  const r = useR();
  const tx = useTx();
  const data = usePreds();
  const test = useMemo(() => (data ? splitFacts(data.SENTENCES, data.GOLD) : null), [data]);
  const rows = [
    { id: "train", src: tx("lab3.e.ds.split.trainSrc"), size: DATASET.train, pos: DATASET.train_pos, len: DATASET.train_len, rec: true },
    { id: "dev", src: tx("lab3.e.ds.split.devSrc"), size: DATASET.dev, pos: 0.558, len: 9.6, rec: false },
    { id: "test", src: tx("lab3.e.ds.split.testSrc"), size: test?.size ?? DATASET.test, pos: test?.positiveShare ?? DATASET.test_pos, len: test?.meanWords ?? DATASET.test_len, rec: true },
  ];
  return (
    <Demo title={tx("lab3.e.ds.split.title")}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm" aria-label={tx("lab3.e.ds.split.title")} data-testid="ds-splits">
          <thead>
            <tr className="text-left text-muted">
              {["split", "source", "size", "pos", "len"].map((c) => (
                <th key={c} scope="col" className={`border-b border-line px-2 py-1.5 ${c === "size" || c === "pos" || c === "len" ? "text-right" : ""}`}>{tx(`lab3.e.ds.split.col.${c}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id}>
                <td className="border-b border-line px-2 py-1.5 font-semibold">{tx(`lab3.e.ds.split.${x.id}`)}</td>
                <td className="border-b border-line px-2 py-1.5 text-muted">{x.src}</td>
                <td className="border-b border-line px-2 py-1.5 text-right font-mono">{fmtInt(x.size)}</td>
                <td className="border-b border-line px-2 py-1.5 text-right font-mono">{pct(x.pos)} %</td>
                <td className="border-b border-line px-2 py-1.5 text-right font-mono">{x.len.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{r("lab3.e.ds.split.note")}</p>
      <p className="mt-2 text-xs text-muted">{r("lab3.e.ds.split.source")}</p>
      <p className="mt-2 text-sm" data-testid="ds-onepoint">{r("lab3.e.ds.split.onepoint", { n: (DATASET.test / 100).toFixed(1) })}</p>
    </Demo>
  );
}

function Competitors() {
  const tx = useTx();
  const [f, setF] = useState<Filter>("all");
  const rows = MODELS.filter((m) => f === "all" || m.family === f);
  const famLabel = (m: (typeof MODELS)[number]) =>
    m.kind === "transformer-finetuned" ? tx("lab3.e.ds.kind.ft") : m.kind === "transformer-pretrained" ? tx("lab3.e.ds.kind.ready") : m.kind === "transformer-zero-shot" ? tx("lab3.e.ds.kind.zero") : tx(FAM_KEY[m.family]);
  return (
    <Demo title={tx("lab3.e.ds.models.title")}>
      <div className="mb-3">
        <Seg<Filter>
          label={tx("lab3.e.ds.models.filter")}
          value={f}
          onChange={setF}
          options={[{ value: "all", label: tx("lab3.e.x.all") }, { value: "classical", label: tx(FAM_KEY.classical) }, { value: "recurrent", label: tx(FAM_KEY.recurrent) }, { value: "transformer", label: tx(FAM_KEY.transformer) }]}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-xs sm:text-sm" aria-label={tx("lab3.e.ds.models.title")} data-testid="ds-models">
          <thead>
            <tr className="text-left text-muted">
              <th scope="col" className="border-b border-line px-2 py-1.5">{tx("lab3.e.ds.models.family")}</th>
              <th scope="col" className="border-b border-line px-2 py-1.5">{tx("lab3.e.ds.models.model")}</th>
              <th scope="col" className="border-b border-line px-2 py-1.5">{tx("lab3.e.ds.models.pre")}</th>
              <th scope="col" className="border-b border-line px-2 py-1.5">{tx("lab3.e.ds.models.ours")}</th>
              <th scope="col" className="border-b border-line px-2 py-1.5 text-right">{tx("lab3.e.ds.models.params")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.tag}>
                <td className="border-b border-line px-2 py-1.5 text-muted"><FamilyDot family={m.family} />{famLabel(m)}</td>
                <td className="border-b border-line px-2 py-1.5 font-medium">{m.name}</td>
                <td className="border-b border-line px-2 py-1.5">{m.pretrained ? tx("lab3.e.x.yes") : tx("lab3.e.x.no")}</td>
                <td className="border-b border-line px-2 py-1.5">{m.trainSize > 0 ? `${tx("lab3.e.x.yes")} (${m.trainSize >= 65000 ? "65k" : `${m.trainSize / 1000}k`})` : tx("lab3.e.x.no")}</td>
                <td className="border-b border-line px-2 py-1.5 text-right font-mono">{fmtParams(m.params)}{m.family === "classical" ? "*" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <FamilyLegend />
      <p className="mt-2 text-xs text-muted">{tx("lab3.e.ds.models.note")}</p>
    </Demo>
  );
}

function Hyper() {
  const r = useR();
  const tx = useTx();
  const ft = MODELS.filter((m) => m.tag in ARCH);
  return (
    <Demo title={tx("lab3.e.ds.hyper.title")}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm" aria-label={tx("lab3.e.ds.hyper.title")}>
          <thead>
            <tr className="text-left text-muted">
              <th scope="col" className="border-b border-line px-2 py-1.5">{tx("lab3.e.ds.hyper.name")}</th>
              {ft.map((m) => <th key={m.tag} scope="col" className="border-b border-line px-2 py-1.5 text-right">{m.short.replace("-FT", "")}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr><td className="border-b border-line px-2 py-1.5">{tx("lab3.e.ds.hyper.arch")}</td>{ft.map((m) => <td key={m.tag} className="border-b border-line px-2 py-1.5 text-right font-mono">{ARCH[m.tag].join(" / ")}</td>)}</tr>
            <tr><td className="border-b border-line px-2 py-1.5">{tx("lab3.e.ds.hyper.n")}</td>{ft.map((m) => <td key={m.tag} className="border-b border-line px-2 py-1.5 text-right font-mono">{fmtInt(m.trainSize)}</td>)}</tr>
            <tr><td className="border-b border-line px-2 py-1.5">{tx("lab3.e.ds.hyper.epochs")}</td>{ft.map((m) => <td key={m.tag} className="border-b border-line px-2 py-1.5 text-right font-mono">{m.epochs}</td>)}</tr>
            <tr><td className="px-2 py-1.5">{tx("lab3.e.ds.hyper.lr")}</td>{ft.map((m) => <td key={m.tag} className="px-2 py-1.5 text-right font-mono">{fmtLr(m.lr!)}</td>)}</tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{r("lab3.e.ds.hyper.common")}</p>
    </Demo>
  );
}

export default function Design() {
  const r = useR();
  const tx = useTx();
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{r("lab3.e.ds.lead")}</p>
      <Demo title={tx("lab3.e.ds.rq.title")}>
        <ol className="space-y-1.5 text-sm leading-relaxed">
          {RQ.map((i) => (
            <li key={i} className="flex gap-2"><b className="shrink-0 font-mono text-brand">RQ{i}</b><span>{tx(`lab3.e.ds.rq.${i}`)}</span></li>
          ))}
        </ol>
      </Demo>
      <Splits />
      <Competitors />
      <Hyper />
      <Grid>
        <Demo title={tx("lab3.e.ds.crit.title")}>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
            {CRITERIA.map((i) => <li key={i}>{r(`lab3.e.ds.crit.${i}`)}</li>)}
          </ul>
        </Demo>
        <Demo title={tx("lab3.e.ds.proto.title")}>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed">
            {PROTOCOL.map((i) => <li key={i}>{r(`lab3.e.ds.proto.${i}`)}</li>)}
          </ol>
          <p className="mt-3 text-xs text-muted">{r("lab3.e.ds.proto.machine")}</p>
        </Demo>
      </Grid>
      <Demo title={tx("lab3.e.ds.threat.title")}>
        <ul className="space-y-3">
          {THREATS.map((t, i) => (
            <li key={t} className="flex gap-3 text-sm leading-relaxed">
              <span aria-hidden className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-c-amber text-xs font-semibold text-c-amber">{i + 1}</span>
              <span><b>{tx(`lab3.e.ds.threat.${t}.t`)}</b> <span className="text-muted">{r(`lab3.e.ds.threat.${t}.d`)}</span></span>
            </li>
          ))}
        </ul>
      </Demo>
      <Callout title={tx("lab3.e.ds.why.title")}>{r("lab3.e.ds.why.body")}</Callout>
    </div>
  );
}
