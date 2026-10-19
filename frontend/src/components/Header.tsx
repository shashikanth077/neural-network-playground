import type { Playground } from "../hooks/usePlayground";
import { useT } from "../i18n";
import { SectionHelp } from "./SectionHelp";
import { StatusIndicator, TrainingControls } from "./TrainingControls";

export function Header({ pg }: { pg: Playground }) {
  const t = useT();
  const pct = pg.session ? Math.round((pg.session.epoch / pg.session.total_epochs) * 100) : 0;
  return (
    <div className="card overflow-hidden" id="section-train">
      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t("pg.title")}</h1>
            <StatusIndicator status={pg.status} />
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted">{t("pg.subtitle")}</p>
        </div>
        <TrainingControls pg={pg} />
      </div>
      <SectionHelp id="training" className="mx-4 mb-3 sm:mx-5" />
      <div
        className="h-1 bg-raised"
        role="progressbar"
        aria-label={t("pg.training.progress")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className="h-full bg-brand transition-[width] duration-200" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
