import { Callout, Demo, Grid } from "../../ui";
import { HARDWARE, SUMMARY, TASK11, TASK12, TASK21, TASK22, TASK23, TASK2_ALL, type Run } from "../data/results";
import { useR, useTx } from "../rich";

/** A recorded table. The best run (chosen by validation accuracy) is highlighted. */
function Table({ rows, cols, best, label }: { rows: Run[]; cols: string[]; best?: number; label: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-xs sm:text-sm" aria-label={label}>
        <thead>
          <tr>
            {cols.map((c) => <th key={c} scope="col" className="border-b border-line px-2 py-1.5 text-left font-semibold uppercase tracking-wide text-muted">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={best !== undefined && row.Run === best ? "bg-ok/10 font-semibold" : ""}>
              {cols.map((c) => <td key={c} className="border-b border-line px-2 py-1.5 font-mono">{String(row[c] ?? "")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const pct = (v: number) => `${(v * 100).toFixed(2)} %`;

export default function Results() {
  const r = useR();
  const tx = useTx();
  const s = SUMMARY;
  const best = (run: number) => run;
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{r("lab2.res.lead")}</p>
      <Callout tone="warn" title={tx("lab2.res.recorded.title")}>
        {r("lab2.res.recorded.body", { hw: HARDWARE })}
      </Callout>

      <Demo title={tx("lab2.res.t11")}>
        <Table
          rows={TASK11}
          cols={["Run", "Change", "Filters", "Kernel", "Dropout", "LR", "Epochs", "train_acc", "test_acc", "train_loss", "test_loss", "params", "seconds", "my_digit_ok"]}
          best={best(s.task11.best_run)}
          label={tx("lab2.res.t11")}
        />
        <Grid>
          <div className="rounded-xl border border-ok/40 bg-ok/5 p-3 text-sm leading-relaxed" role="status">
            {r("lab2.res.bestCnn", { test: pct(s.task11.test_acc), params: s.task11.cnn_params.toLocaleString("en-US") })}
          </div>
          <div className="rounded-xl border border-line bg-raised/70 p-3 text-sm leading-relaxed">
            {r("lab2.res.vsDense", { test: pct(s.task11.fc_test_acc), params: s.task11.fc_params.toLocaleString("en-US") })}
          </div>
        </Grid>
        <p className="mt-3 text-sm">
          {tx("lab2.res.digitProbs")}{" "}
          {s.task11.my_digit_probs.map((p, i) => <span key={i} className="mr-1.5 inline-block rounded-full border border-line px-2 font-mono text-xs">{i}: {p}</span>)}
        </p>
        <p className="mt-1 text-xs text-muted">{tx("lab2.res.digitNote")}</p>
      </Demo>

      <Demo title={tx("lab2.res.t12")}>
        <Table rows={TASK12} cols={["Pooling", "Filters", "Kernel", "Epochs", "train_acc", "test_acc", "train_loss", "test_loss", "seconds"]} label={tx("lab2.res.t12")} />
        <p className="mt-2 text-sm text-muted">{r("lab2.res.pooling", { max: pct(s.task12.max_test_acc), avg: pct(s.task12.avg_test_acc) })}</p>
      </Demo>

      <Demo title={tx("lab2.res.t21")}>
        <Table rows={TASK21} cols={["Run", "Encoding", "Dense layers", "Epochs", "Batch", "train_acc", "test_acc", "train_loss", "test_loss", "params", "seconds"]} best={s.task21.best_run} label={tx("lab2.res.t21")} />
      </Demo>

      <Demo title={tx("lab2.res.t22")}>
        <Table rows={TASK22} cols={["Run", "Model", "Embedding", "Epochs", "Batch", "train_acc", "test_acc", "train_loss", "test_loss", "params", "seconds"]} best={s.task22.best_run} label={tx("lab2.res.t22")} />
      </Demo>

      <Demo title={tx("lab2.res.t23")}>
        <Table rows={TASK23} cols={["Run", "Cell", "Layers", "Neurons", "Activation", "Optimizer", "Epochs", "Batch", "train_acc", "test_acc", "train_loss", "test_loss", "params", "seconds"]} best={s.task23.best_run} label={tx("lab2.res.t23")} />
        <p className="mt-2 text-sm text-muted">{r("lab2.res.t23note")}</p>
      </Demo>

      <Demo title={tx("lab2.res.all")}>
        <div className="space-y-2" role="img" aria-label={tx("lab2.res.all")}>
          {TASK2_ALL.map((row) => (
            <div key={String(row.Name)} className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="w-56 shrink-0 truncate" title={String(row.Name)}>{String(row.Name)}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-raised">
                <div className="h-full rounded-full bg-brand" style={{ width: `${Number(row.test_acc) * 100}%` }} />
              </div>
              <b className="w-16 text-right font-mono">{Number(row.test_acc).toFixed(4)}</b>
            </div>
          ))}
        </div>
      </Demo>

      <Demo title={tx("lab2.res.demo")}>
        <p className="text-sm leading-relaxed">{r("lab2.res.demoText", { s0: (s.demo_reviews.scores[0]).toFixed(3), s1: (s.demo_reviews.scores[1]).toFixed(3) })}</p>
        <p className="mt-1 text-xs text-muted">{tx("lab2.res.demoNote")}</p>
      </Demo>
    </div>
  );
}
