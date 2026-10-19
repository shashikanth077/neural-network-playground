import { useEffect } from "react";
import { AccuracyChart } from "../components/AccuracyChart";
import { CrossValidationPanel } from "../components/CrossValidationPanel";
import { DatasetSelector } from "../components/DatasetSelector";
import { DecisionBoundary } from "../components/DecisionBoundary";
import { ErrorMessage } from "../components/ErrorMessage";
import { EvaluationPanel } from "../components/EvaluationPanel";
import { ExperimentPresets } from "../components/ExperimentPresets";
import { GradientChart } from "../components/GradientChart";
import { GuidedExperiments } from "../components/GuidedExperiments";
import { Header } from "../components/Header";
import { LearningCenter } from "../components/LearningCenter";
import { LearningDiagnosis } from "../components/LearningDiagnosis";
import { LossChart } from "../components/LossChart";
import { NetworkArchitectureEditor } from "../components/NetworkArchitectureEditor";
import { NetworkGraphView, NetworkLegend } from "../components/NetworkGraph";
import { PlaygroundGuide, useHelpToggle } from "../components/PlaygroundGuide";
import { HelpProvider, SectionHelp } from "../components/SectionHelp";
import { TrainingMetrics } from "../components/TrainingMetrics";
import { usePlayground } from "../hooks/usePlayground";
import { useT } from "../i18n";
import { takePendingRestore } from "../lib/pendingRestore";

export function Playground() {
  const pg = usePlayground();
  const t = useT();
  const [helpOn, setHelpOn] = useHelpToggle();
  const hasVal = (pg.session?.n_val ?? 0) > 0;

  // "Open in Playground" on the My runs page leaves its settings here.
  const { restoreRun } = pg;
  useEffect(() => {
    const r = takePendingRestore();
    if (r) void restoreRun(r);
  }, [restoreRun]);

  return (
    <HelpProvider value={helpOn}>
      <main className="mx-auto max-w-[1500px] space-y-4 px-4 py-4 sm:px-6 sm:py-6">
        <Header pg={pg} />
        <ErrorMessage
          message={pg.backendUp === false ? pg.error : null}
          title={t("pg.err.backend")}
          onRetry={pg.checkBackend}
        />
        <ErrorMessage
          message={pg.backendUp === false ? null : pg.error}
          title={pg.status === "failed" ? t("pg.err.failed") : t("pg.err.default")}
          onDismiss={pg.clearError}
        />

        <PlaygroundGuide enabled={helpOn} onToggle={setHelpOn} />
        <GuidedExperiments pg={pg} />

        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
          <div className="order-2 space-y-4 xl:order-1">
            <DatasetSelector pg={pg} />
            <ExperimentPresets pg={pg} />
          </div>

          <div className="order-1 min-w-0 space-y-4 xl:order-2">
            <section className="card p-4" aria-labelledby="db-title" id="section-boundary">
              <h2 id="db-title" className="card-title">{t("pg.db.title")}</h2>
              <p className="mb-3 mt-1 text-xs text-muted">
                {t("pg.db.intro")}
                {pg.grid ? ` ${t("pg.db.epoch", undefined, { n: pg.grid.epoch })}` : "."}
              </p>
              <SectionHelp id="boundary" className="mb-3" />
              <DecisionBoundary
                data={pg.data}
                grid={pg.grid}
                view={pg.view}
                onView={pg.setView}
                onProbe={pg.setProbe}
                hasModel={!!pg.session}
              />
            </section>

            <section className="card p-4" aria-labelledby="net-title" id="section-network">
              <h2 id="net-title" className="card-title">{t("pg.net.title")}</h2>
              <p className="mb-2 mt-1 text-xs text-muted">
                {t("pg.net.intro", undefined, { x: pg.probe[0].toFixed(2), y: pg.probe[1].toFixed(2) })}
              </p>
              <SectionHelp id="network" className="mb-2" />
              <NetworkGraphView config={pg.config} params={pg.params} activations={pg.activations} status={pg.status} />
              <NetworkLegend />
            </section>

            <TrainingMetrics pg={pg} />

            <EvaluationPanel pg={pg} />

            <section className="card p-4" aria-labelledby="charts-title" id="section-charts">
              <h2 id="charts-title" className="card-title">{t("pg.charts.title")}</h2>
              <p className="mt-1 text-xs text-muted">{t("pg.charts.intro")}</p>
              <div className="mt-3 grid gap-6 lg:grid-cols-2">
                <LossChart history={pg.history} pinned={pg.pinned} hasVal={hasVal} bestEpoch={pg.session?.best_epoch} />
                <AccuracyChart history={pg.history} pinned={pg.pinned} hasVal={hasVal} />
              </div>
              <LearningDiagnosis history={pg.history} loss={pg.config.loss} stoppedEarly={!!pg.session?.stopped_early} restored={!!pg.session?.restored_best} stopEpoch={pg.session?.epoch ?? 0} />
              <div className="mt-6"><GradientChart history={pg.history} /></div>
            </section>

            <CrossValidationPanel pg={pg} />
          </div>

          <div className="order-3 xl:order-3">
            <NetworkArchitectureEditor pg={pg} />
          </div>
        </div>

        <LearningCenter pg={pg} />
      </main>
    </HelpProvider>
  );
}
