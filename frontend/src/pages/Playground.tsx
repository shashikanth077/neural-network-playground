import { AccuracyChart } from "../components/AccuracyChart";
import { CrossValidationPanel } from "../components/CrossValidationPanel";
import { DatasetSelector } from "../components/DatasetSelector";
import { DecisionBoundary } from "../components/DecisionBoundary";
import { ErrorMessage } from "../components/ErrorMessage";
import { EvaluationPanel } from "../components/EvaluationPanel";
import { ExperimentPresets } from "../components/ExperimentPresets";
import { GradientChart } from "../components/GradientChart";
import { Header } from "../components/Header";
import { LearningCenter } from "../components/LearningCenter";
import { LearningDiagnosis } from "../components/LearningDiagnosis";
import { LossChart } from "../components/LossChart";
import { NetworkArchitectureEditor } from "../components/NetworkArchitectureEditor";
import { NetworkGraphView, NetworkLegend } from "../components/NetworkGraph";
import { TrainingMetrics } from "../components/TrainingMetrics";
import { usePlayground } from "../hooks/usePlayground";

export function Playground() {
  const pg = usePlayground();
  const hasVal = (pg.session?.n_val ?? 0) > 0;

  return (
    <main className="mx-auto max-w-[1500px] space-y-4 px-4 py-4 sm:px-6 sm:py-6">
      <Header pg={pg} />
      <ErrorMessage
        message={pg.backendUp === false ? pg.error : null}
        title="Backend unreachable"
        onRetry={pg.checkBackend}
      />
      <ErrorMessage
        message={pg.backendUp === false ? null : pg.error}
        title={pg.status === "failed" ? "Training failed" : "Something went wrong"}
        onDismiss={pg.clearError}
      />

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
        <div className="order-2 space-y-4 xl:order-1">
          <DatasetSelector pg={pg} />
          <ExperimentPresets pg={pg} />
        </div>

        <div className="order-1 min-w-0 space-y-4 xl:order-2">
          <section className="card p-4" aria-labelledby="db-title">
            <h2 id="db-title" className="card-title">Decision boundary</h2>
            <p className="mb-3 mt-1 text-xs text-muted">
              Colours show the model's predicted class for every point of the plane
              {pg.grid ? ` (epoch ${pg.grid.epoch}).` : "."}
            </p>
            <DecisionBoundary
              data={pg.data}
              grid={pg.grid}
              view={pg.view}
              onView={pg.setView}
              onProbe={pg.setProbe}
              hasModel={!!pg.session}
            />
          </section>

          <section className="card p-4" aria-labelledby="net-title">
            <h2 id="net-title" className="card-title">Network diagram</h2>
            <p className="mb-2 mt-1 text-xs text-muted">
              Drawn from the model's actual weights. Node colours show activations for the point you last hovered on the plot ({pg.probe[0].toFixed(2)}, {pg.probe[1].toFixed(2)}).
            </p>
            <NetworkGraphView config={pg.config} params={pg.params} activations={pg.activations} status={pg.status} />
            <NetworkLegend />
          </section>

          <TrainingMetrics pg={pg} />

          <EvaluationPanel pg={pg} />

          <section className="card p-4" aria-labelledby="charts-title">
            <h2 id="charts-title" className="card-title">Training analytics</h2>
            <p className="mt-1 text-xs text-muted">Every point is a real per-epoch value computed by the training loop.</p>
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
  );
}
