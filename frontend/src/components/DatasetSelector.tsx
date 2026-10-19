import { useState } from "react";
import type { Playground } from "../hooks/usePlayground";
import { useT } from "../i18n";
import { CLASS_COLORS } from "../lib/colors";
import type { DatasetName } from "../types";
import { DatasetCanvas } from "./DatasetCanvas";
import { Field } from "./Field";
import { SectionHelp } from "./SectionHelp";

const OPTIONS: { name: DatasetName; label: string; blurb: string }[] = [
  { name: "xor", label: "XOR", blurb: "Opposite quadrants share a class: not linearly separable." },
  { name: "moons", label: "Moons", blurb: "Two interleaving half-circles." },
  { name: "circles", label: "Circles", blurb: "A ring around a disc." },
  { name: "linear", label: "Linear", blurb: "Separable by one straight line." },
  { name: "custom", label: "Custom", blurb: "Click on the plot to draw your own." },
];

export function DatasetSelector({ pg }: { pg: Playground }) {
  const t = useT();
  const { datasetSpec: spec, setDatasetSpec, data, locked } = pg;
  const [activeClass, setActiveClass] = useState<0 | 1>(0);
  const custom = spec.name === "custom";
  const counts = [0, 1].map((c) => data?.labels.filter((l) => l === c).length ?? 0);
  const current = OPTIONS.find((o) => o.name === spec.name)!;

  return (
    <section className="card p-4" aria-labelledby="ds-title" id="section-data">
      <h2 id="ds-title" className="card-title">{t("pg.ds.title")}</h2>
      <SectionHelp id="dataset" className="mt-2" />
      <div role="radiogroup" aria-label={t("pg.ds.aria")} className="mt-3 flex flex-wrap gap-1.5">
        {OPTIONS.map((o) => (
          <button
            key={o.name}
            role="radio"
            aria-checked={spec.name === o.name}
            disabled={locked}
            onClick={() => setDatasetSpec({ name: o.name })}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
              spec.name === o.name ? "border-brand bg-brand/10 text-brand" : "border-line text-muted hover:text-ink"
            }`}
          >
            {t(`pg.ds.${o.name}.label`, o.label)}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">{t(`pg.ds.${current.name}.blurb`, current.blurb)}</p>

      <div className="mt-3">
        <DatasetCanvas data={data} editable={custom && !locked} activeClass={activeClass} onAdd={pg.addPoint} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs" aria-label={t("pg.legend")}>
        {[0, 1].map((c) => (
          <span key={c} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: CLASS_COLORS[c as 0 | 1] }} />
            {t("pg.ds.class", undefined, { c })} <span className="text-muted">({counts[c]})</span>
          </span>
        ))}
      </div>

      {custom ? (
        <div className="mt-3 space-y-2">
          <div role="radiogroup" aria-label={t("pg.ds.classToPlace")} className="flex gap-1.5">
            {[0, 1].map((c) => (
              <button
                key={c}
                role="radio"
                aria-checked={activeClass === c}
                onClick={() => setActiveClass(c as 0 | 1)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium ${
                  activeClass === c ? "border-brand bg-brand/10" : "border-line text-muted"
                }`}
              >
                {t("pg.ds.placeClass", undefined, { c })}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button className="btn-ghost !py-1 !text-xs" disabled={locked || !data?.labels.length} onClick={pg.undoPoint}>
              {t("pg.ds.undo")}
            </button>
            <button className="btn-ghost !py-1 !text-xs" disabled={locked || !data?.labels.length} onClick={pg.clearPoints}>
              {t("pg.ds.clear")}
            </button>
            <button
              className="btn-ghost !py-1 !text-xs"
              disabled={locked}
              onClick={() => pg.addPoint(+(Math.random() * 2.4 - 1.2).toFixed(3), +(Math.random() * 2.4 - 1.2).toFixed(3), activeClass)}
              title={t("pg.ds.addRandom.title")}
            >
              {t("pg.ds.addRandom")}
            </button>
          </div>
          {(data?.labels.length ?? 0) < 6 || counts[0] === 0 || counts[1] === 0 ? (
            <p className="text-xs text-muted">{t("pg.ds.need6")}</p>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Field id="ds-n" label={t("pg.ds.samples")} help={t("pg.ds.samples.help")}>
            <input id="ds-n" type="number" min={10} max={2000} step={10} className="field" disabled={locked}
              value={spec.n_samples}
              onChange={(e) => setDatasetSpec({ n_samples: Math.min(2000, Math.max(10, Number(e.target.value) || 10)) })} />
          </Field>
          <Field id="ds-noise" label={t("pg.ds.noise")} help={t("pg.ds.noise.help")}>
            <input id="ds-noise" type="number" min={0} max={1} step={0.05} className="field" disabled={locked}
              value={spec.noise}
              onChange={(e) => setDatasetSpec({ noise: Math.min(1, Math.max(0, Number(e.target.value) || 0)) })} />
          </Field>
          <Field id="ds-seed" label={t("pg.ds.seed")} help={t("pg.ds.seed.help")}>
            <input id="ds-seed" type="number" min={0} step={1} className="field" disabled={locked}
              value={spec.seed}
              onChange={(e) => setDatasetSpec({ seed: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} />
          </Field>
          <button
            className="btn-ghost col-span-3 !py-1.5 !text-xs"
            disabled={locked}
            onClick={() => setDatasetSpec({ seed: Math.floor(Math.random() * 10000) })}
          >
            {t("pg.ds.regen")}
          </button>
        </div>
      )}
    </section>
  );
}
