import type { Playground } from "../hooks/usePlayground";
import { useT } from "../i18n";
import { duration, fmt, pct } from "../lib/format";
import { Rich, SectionHelp } from "./SectionHelp";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-raised/70 p-3" title={hint}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-mono text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

export function TrainingMetrics({ pg }: { pg: Playground }) {
  const t = useT();
  const s = pg.session;
  const l = s?.latest ?? null;
  const hasVal = (s?.n_val ?? 0) > 0;
  return (
    <section className="card p-4" aria-labelledby="metrics-title">
      <h2 id="metrics-title" className="card-title">{t("pg.tm.title")}</h2>
      <SectionHelp id="metrics" className="mt-2" />
      {!s ? (
        <p className="mt-3 text-sm text-muted">{t("pg.tm.none")}</p>
      ) : (
        <>
          <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label={t("pg.tm.epoch")} value={`${s.epoch} / ${s.total_epochs}`} />
            <Stat label={t("pg.tm.elapsed")} value={duration(s.elapsed_seconds)} hint={t("pg.tm.elapsed.hint")} />
            <Stat label={t("pg.tm.trainLoss")} value={fmt(l?.train_loss)} hint={t("pg.tm.trainLoss.hint")} />
            <Stat label={t("pg.tm.valLoss")} value={hasVal ? fmt(l?.val_loss) : t("pg.na")} hint={t("pg.tm.valLoss.hint")} />
            <Stat label={t("pg.tm.trainAcc")} value={pct(l?.train_acc)} />
            <Stat label={t("pg.tm.valAcc")} value={hasVal ? pct(l?.val_acc) : t("pg.na")} />
            <Stat label={t("pg.tm.samples")} value={t("pg.tm.samples.value", undefined, { a: s.n_train, b: s.n_val })} />
            <Stat label={t("pg.tm.params")} value={s.n_parameters.toLocaleString()} />
          </dl>
          {s.epoch === 0 && s.status === "ready" && (
            <p className="mt-3 text-xs text-muted"><Rich text={t("pg.tm.first")} /></p>
          )}
        </>
      )}
    </section>
  );
}
