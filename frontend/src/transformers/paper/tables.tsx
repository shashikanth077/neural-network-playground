import { useMemo } from "react";
import { FamilyDot, SortTable, fmtInt, pct, type Col } from "../../labs/lab3/experiment/shared";
import { useTx } from "../../labs/lab3/rich";
import { CURVE, MODELS, SUBSETS, SUBSET_SIZES, TABLE2_AUTHORS, TABLE3, TABLE4, TABLE5, fmtP7 } from "./data";
import type { ModelRec } from "../../labs/lab3/data/expModels";
import { STATS } from "../../labs/lab3/data/expModels";
import { DataTable, TableBox } from "./ui";

/** The authors and their responsibilities (Table 1 of the REVISED paper: two members). */
export const TEAM = [
  { name: "Shashikanth Hosur Ramegowda", key: "tp.t1.r1" },
  { name: "Shaeed Khan", key: "tp.t1.r2" },
];

export function Table1() {
  const tx = useTx();
  return (
    <TableBox n={1} caption={tx("tp.t1.cap")}>
      <DataTable
        label={tx("tp.t1.cap")}
        minW={420}
        head={[tx("tp.t1.h.member"), tx("tp.t1.h.resp")]}
        rows={TEAM.map((m) => [<b key="n" className="whitespace-nowrap">{m.name}</b>, tx(m.key)])}
      />
    </TableBox>
  );
}

export function Table2() {
  const tx = useTx();
  return (
    <TableBox n={2} caption={tx("tp.t2.cap")}>
      <DataTable
        label={tx("tp.t2.cap")}
        minW={680}
        head={[tx("tp.t2.h.authors"), tx("tp.t2.h.model"), tx("tp.t2.h.task"), tx("tp.t2.h.result")]}
        rows={TABLE2_AUTHORS.map((a, i) => [<b key="a" className="whitespace-nowrap">{a}</b>, tx(`tp.t2.${i}.model`), tx(`tp.t2.${i}.task`), tx(`tp.t2.${i}.result`)])}
      />
    </TableBox>
  );
}

export function Table3() {
  const tx = useTx();
  return (
    <TableBox n={3} caption={tx("tp.t3.cap")}>
      <DataTable
        label={tx("tp.t3.cap")}
        minW={480}
        numeric={[2, 3, 4]}
        head={[tx("tp.t3.h.split"), tx("tp.t3.h.source"), tx("tp.t3.h.size"), tx("tp.t3.h.pos"), tx("tp.t3.h.len")]}
        rows={TABLE3.map((r) => [tx(r.split), tx(r.source), fmtInt(r.size), `${r.pos.toFixed(1)}%`, r.len.toFixed(1)])}
      />
    </TableBox>
  );
}

const FAM4 = { classical: "tp.t4.fam.classical", recurrent: "tp.t4.fam.recurrent", ft: "tp.t4.fam.ft", ready: "tp.t4.fam.ready", zs: "tp.t4.fam.zs" } as const;

export function Table4() {
  const tx = useTx();
  return (
    <TableBox n={4} caption={tx("tp.t4.cap")}>
      <DataTable
        label={tx("tp.t4.cap")}
        minW={600}
        numeric={[4]}
        head={[tx("tp.t4.h.family"), tx("tp.t4.h.model"), tx("tp.t4.h.pre"), tx("tp.t4.h.trained"), tx("tp.t4.h.params")]}
        rows={TABLE4.map((r) => [tx(FAM4[r.family]), r.model, tx(r.pre ? "tp.ui.yes" : "tp.ui.no"), r.trained ? `${tx("tp.ui.yes")} (${r.trained})` : tx("tp.ui.no"), r.params])}
      />
      <p className="px-2 pb-1 pt-2 text-xs text-muted">{tx("tp.t4.note")}</p>
    </TableBox>
  );
}

export function Table5() {
  const tx = useTx();
  return (
    <TableBox n={5} caption={tx("tp.t5.cap")}>
      <DataTable
        label={tx("tp.t5.cap")}
        minW={440}
        numeric={[1, 2, 3]}
        head={[tx("tp.t5.h.hp"), "BERT-tiny", "BERT-small", "DistilBERT"]}
        rows={TABLE5.map((r) => [tx(r.key), ...r.v])}
      />
    </TableBox>
  );
}

/** Latency as printed in the paper: two decimals below 1 ms, one decimal above. */
export const lat = (m: ModelRec) => (m.latencyMs < 1 ? m.latencyMs.toFixed(2) : m.latencyMs.toFixed(1));

/** Table 6: all ten models, sorted by accuracy, every column sortable. */
export function Table6() {
  const tx = useTx();
  const cols: Col<ModelRec>[] = useMemo(() => [
    { id: "name", label: tx("tp.t6.h.model"), value: (m) => m.name, render: (m) => <span className="font-medium"><FamilyDot family={m.family} />{m.name}</span> },
    { id: "n", label: tx("tp.t6.h.n"), value: (m) => m.trainSize, align: "right", render: (m) => fmtInt(m.trainSize) },
    { id: "acc", label: tx("tp.t6.h.acc"), value: (m) => m.accuracy, align: "right", render: (m) => <b>{pct(m.accuracy, 1)}</b> },
    { id: "prec", label: tx("tp.t6.h.prec"), value: (m) => m.precision, align: "right", render: (m) => pct(m.precision, 1) },
    { id: "rec", label: tx("tp.t6.h.rec"), value: (m) => m.recall, align: "right", render: (m) => pct(m.recall, 1) },
    { id: "f1", label: tx("tp.t6.h.f1"), value: (m) => m.f1, align: "right", render: (m) => pct(m.f1, 1) },
    { id: "train", label: tx("tp.t6.h.train"), value: (m) => m.trainSeconds, align: "right", render: (m) => (m.trainSeconds > 0 ? Math.round(m.trainSeconds).toString() : "–") },
    { id: "lat", label: tx("tp.t6.h.lat"), value: (m) => m.latencyMs, align: "right", render: (m) => lat(m) },
  ], [tx]);
  return (
    <TableBox n={6} caption={tx("tp.t6.cap")}>
      <SortTable rows={MODELS} cols={cols} rowKey={(m) => m.tag} initial={{ id: "acc", dir: -1 }} label={tx("tp.t6.cap")} rowClass={(m) => (m.tag === "pt_distilbert_sst2" ? "bg-ok/10" : "")} />
      <p className="px-2 pb-1 pt-2 text-xs text-muted">{tx("tp.t6.note")}</p>
    </TableBox>
  );
}

/** Table 7: bootstrap intervals and McNemar test against the best model (the values recorded in statistics.csv). */
export function Table7() {
  const tx = useTx();
  const cols: Col<ModelRec>[] = useMemo(() => [
    { id: "name", label: tx("tp.t7.h.model"), value: (m) => m.name, render: (m) => <span className="font-medium"><FamilyDot family={m.family} />{m.name}</span> },
    { id: "acc", label: tx("tp.t7.h.acc"), value: (m) => m.accuracy, align: "right", render: (m) => <b>{pct(m.accuracy, 1)}</b> },
    { id: "ci", label: tx("tp.t7.h.ci"), value: (m) => STATS[m.tag].ciLow, align: "right", render: (m) => `[${pct(STATS[m.tag].ciLow, 1)}; ${pct(STATS[m.tag].ciHigh, 1)}]` },
    { id: "b", label: tx("tp.t7.h.b"), value: (m) => STATS[m.tag].bestOnly, align: "right", render: (m) => (m.tag === "pt_distilbert_sst2" ? "–" : STATS[m.tag].bestOnly) },
    { id: "c", label: tx("tp.t7.h.c"), value: (m) => STATS[m.tag].modelOnly, align: "right", render: (m) => (m.tag === "pt_distilbert_sst2" ? "–" : STATS[m.tag].modelOnly) },
    { id: "p", label: tx("tp.t7.h.p"), value: (m) => STATS[m.tag].p, align: "right", render: (m) => (m.tag === "pt_distilbert_sst2" ? "–" : fmtP7(STATS[m.tag].p)) },
  ], [tx]);
  return (
    <TableBox n={7} caption={tx("tp.t7.cap")}>
      <SortTable rows={MODELS} cols={cols} rowKey={(m) => m.tag} initial={{ id: "acc", dir: -1 }} label={tx("tp.t7.cap")} rowClass={(m) => (m.tag === "pt_distilbert_sst2" ? "bg-ok/10" : "")} />
      <p className="px-2 pb-1 pt-2 text-xs text-muted">{tx("tp.t7.note")}</p>
    </TableBox>
  );
}

/** Table 8: learning-curve table (computed from the recorded curve; differences are recomputed from it). */
export function Table8() {
  const tx = useTx();
  return (
    <TableBox n={8} caption={tx("tp.t8.cap")}>
      <DataTable
        label={tx("tp.t8.cap")}
        minW={440}
        numeric={[0, 1, 2, 3]}
        head={[tx("tp.t8.h.n"), tx("tp.t8.h.bert"), tx("tp.t8.h.lr"), tx("tp.t8.h.diff")]}
        rows={CURVE["bert-small"].map((p, i) => {
          const lr = CURVE["tfidf-lr"][i].accuracy;
          return [fmtInt(p.n), pct(p.accuracy, 1), pct(lr, 1), `+${((p.accuracy - lr) * 100).toFixed(1)}`];
        })}
      />
      <p className="px-2 pb-1 pt-2 text-xs text-muted">{tx("tp.t8.note")}</p>
    </TableBox>
  );
}

/** Table 9: accuracy on the negation and contrast subsets (delta negation is recomputed from the two recorded columns). */
export function Table9() {
  const tx = useTx();
  const cols: Col<ModelRec>[] = useMemo(() => [
    { id: "name", label: tx("tp.t9.h.model"), value: (m) => m.name, render: (m) => <span className="font-medium"><FamilyDot family={m.family} />{m.name}</span> },
    { id: "all", label: tx("tp.t9.h.all"), value: (m) => SUBSETS[m.tag].all, align: "right", render: (m) => pct(SUBSETS[m.tag].all, 1) },
    { id: "neg", label: tx("tp.t9.h.neg"), value: (m) => SUBSETS[m.tag].negation, align: "right", render: (m) => pct(SUBSETS[m.tag].negation, 1) },
    { id: "con", label: tx("tp.t9.h.con"), value: (m) => SUBSETS[m.tag].contrast, align: "right", render: (m) => pct(SUBSETS[m.tag].contrast, 1) },
    { id: "d", label: tx("tp.t9.h.d"), value: (m) => SUBSETS[m.tag].negation - SUBSETS[m.tag].all, align: "right", render: (m) => deltaNeg(m.tag) },
  ], [tx]);
  return (
    <TableBox n={9} caption={tx("tp.t9.cap")}>
      <SortTable rows={MODELS} cols={cols} rowKey={(m) => m.tag} initial={{ id: "all", dir: -1 }} label={tx("tp.t9.cap")} rowClass={(m) => (m.tag === "pt_distilbert_sst2" ? "bg-ok/10" : "")} />
      <p className="px-2 pb-1 pt-2 text-xs text-muted">{tx("tp.t9.note", { neg: SUBSET_SIZES.negation, con: SUBSET_SIZES.contrast })}</p>
    </TableBox>
  );
}

/** Δ negation in percentage points as printed in the paper (e.g. -4.1, -0.2). */
export function deltaNeg(tag: string): string {
  const d = (SUBSETS[tag].negation - SUBSETS[tag].all) * 100;
  return d.toFixed(1);
}

