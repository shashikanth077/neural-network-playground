import type { Playground } from "../hooks/usePlayground";
import { useT } from "../i18n";
import { PRESETS } from "../lib/presets";
import { SectionHelp } from "./SectionHelp";

export function ExperimentPresets({ pg }: { pg: Playground }) {
  const t = useT();
  const active = PRESETS.find((p) => p.id === pg.activePreset?.id) ?? null;
  return (
    <section className="card p-4" aria-labelledby="presets-title">
      <h2 id="presets-title" className="card-title">{t("pg.presets.title")}</h2>
      <SectionHelp id="presets" className="mt-2" />
      <p className="mt-1 text-xs text-muted">{t("pg.presets.intro")}</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {PRESETS.map((p) => {
          const isActive = active?.id === p.id;
          return (
            <li key={p.id}>
              <button
                onClick={() => pg.applyPreset(p, p.variants?.[1] ?? p.variants?.[0])}
                aria-pressed={isActive}
                className={`h-full w-full rounded-xl border p-3 text-left transition ${
                  isActive ? "border-brand bg-brand/10" : "border-line hover:bg-raised"
                }`}
              >
                <span className="block text-sm font-semibold">{t(`pg.preset.${p.id}.title`, p.title)}</span>
                <span className="mt-0.5 block text-xs text-muted">{t(`pg.preset.${p.id}.summary`, p.summary)}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {active && (
        <div className="mt-4 rounded-xl bg-raised/70 p-3" aria-live="polite">
          <p className="text-sm font-semibold">{t("pg.presets.lookFor", undefined, { title: t(`pg.preset.${active.id}.title`, active.title) })}</p>
          {active.variants && (
            <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={t("pg.presets.variants")}>
              {active.variants.map((v, vi) => (
                <button
                  key={v.label}
                  onClick={() => pg.applyVariant(active, v)}
                  aria-pressed={pg.activePreset?.variant === v.label}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                    pg.activePreset?.variant === v.label ? "border-brand bg-brand/10 text-brand" : "border-line text-muted hover:text-ink"
                  }`}
                >
                  {t(`pg.preset.${active.id}.v.${vi}`, v.label)}
                </button>
              ))}
            </div>
          )}
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
            {active.observe.map((o, i) => <li key={o}>{t(`pg.preset.${active.id}.obs.${i}`, o)}</li>)}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button className="btn-ghost !py-1 !text-xs" onClick={pg.pinRun} disabled={pg.history.length === 0}>
              📌 {t("pg.presets.pin")}
            </button>
            {pg.pinned && (
              <button className="btn-ghost !py-1 !text-xs" onClick={pg.clearPin}>{t("pg.presets.clearPin")}</button>
            )}
          </div>
          {pg.pinned && <p className="mt-1 text-xs text-muted">{t("pg.presets.pinned", undefined, { label: pg.pinned.label })}</p>}
        </div>
      )}
      <SectionHelp id="chart.pin" className="mt-3" />
      {!active && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button className="btn-ghost !py-1 !text-xs" onClick={pg.pinRun} disabled={pg.history.length === 0}>
            📌 {t("pg.presets.pin")}
          </button>
          {pg.pinned && <button className="btn-ghost !py-1 !text-xs" onClick={pg.clearPin}>{t("pg.presets.clearPin")}</button>}
        </div>
      )}
    </section>
  );
}
