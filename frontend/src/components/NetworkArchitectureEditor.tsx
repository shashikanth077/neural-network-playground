import type { ReactNode } from "react";
import type { Playground } from "../hooks/usePlayground";
import { useT } from "../i18n";
import { ACTIVATION_OPTIONS, LOSS_OPTIONS, OPTIMIZER_OPTIONS } from "../lib/options";
import { useOptionText } from "../lib/optionText";
import { countParameters } from "../lib/validation";
import { translateValidation } from "../lib/validationText";
import { ACT } from "../lib/activations";
import type { Activation, Initializer, Loss, Optimizer } from "../types";
import { Field } from "./Field";
import { Rich, SectionHelp } from "./SectionHelp";

const INITS: { value: Initializer; label: string }[] = [
  { value: "xavier", label: "Xavier / Glorot (uniform)" },
  { value: "he", label: "He (normal)" },
  { value: "small_normal", label: "Small normal (σ = 0.1)" },
  { value: "zeros", label: "Zeros (demo: symmetry problem)" },
];

function Section({ title, children, open = true, id }: { title: string; children: ReactNode; open?: boolean; id: string }) {
  return (
    <details open={open} className="group rounded-xl border border-line" id={id}>
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-semibold marker:hidden">
        {title}
        <span aria-hidden className="text-muted transition group-open:rotate-180">▾</span>
      </summary>
      <div className="space-y-3 border-t border-line p-3">{children}</div>
    </details>
  );
}

const OPTIM_FORMULA: Record<Optimizer, string> = {
  sgd: String.raw`\theta\leftarrow\theta-\eta\,g`,
  momentum: String.raw`v\leftarrow\gamma v+\eta g,\quad \theta\leftarrow\theta-v`,
  nesterov: String.raw`g=\nabla L(\theta-\gamma v),\quad v\leftarrow\gamma v+\eta g,\quad \theta\leftarrow\theta-v`,
  adagrad: String.raw`G\leftarrow G+g^2,\quad \theta\leftarrow\theta-\frac{\eta\,g}{\sqrt G+\varepsilon}`,
  rmsprop: String.raw`v\leftarrow\rho v+(1-\rho)g^2,\quad \theta\leftarrow\theta-\frac{\eta\,g}{\sqrt v+\varepsilon}`,
  adadelta: String.raw`\Delta\theta=-\frac{\sqrt{E[\Delta\theta^2]+\varepsilon}}{\sqrt{E[g^2]+\varepsilon}}\,g`,
  adam: String.raw`m\leftarrow\beta_1m+(1-\beta_1)g,\ v\leftarrow\beta_2v+(1-\beta_2)g^2,\ \theta\leftarrow\theta-\frac{\eta\,\hat m}{\sqrt{\hat v}+\varepsilon}`,
  nadam: String.raw`\theta\leftarrow\theta-\frac{\eta}{\sqrt{\hat v}+\varepsilon}\Big(\beta_1\hat m+\frac{1-\beta_1}{1-\beta_1^t}\,g\Big)`,
};

const LOSS_FORMULA: Record<Loss, string> = {
  bce: String.raw`L=-\big[y\ln p+(1-y)\ln(1-p)\big]`,
  mse: String.raw`L=(p-y)^2`,
  hinge: String.raw`L=\max\!\big(0,\,1-s\,z\big),\ s=2y-1`,
};

export function NetworkArchitectureEditor({ pg }: { pg: Playground }) {
  const t = useT();
  const ot = useOptionText();
  const { config: c, setConfig, locked } = pg;
  const err = Object.fromEntries(Object.entries(pg.configErrors).map(([k, v]) => [k, translateValidation(t, v)])) as Partial<Record<string, string>>;
  const layers = c.hidden_layers;
  const setLayers = (next: number[]) => setConfig({ hidden_layers: next });
  const num = (v: string, d: number) => (v === "" ? d : Number(v));
  const n = pg.data?.labels.length ?? 0;
  const nTrain = pg.session?.n_train ?? Math.round(n * (1 - c.val_split));
  const effBatch = Math.max(1, Math.min(c.batch_size, nTrain || c.batch_size));
  const updates = nTrain ? Math.ceil(nTrain / effBatch) : null;
  const mode = c.batch_size === 1 ? t("pg.ed.mode.sgd") : nTrain && c.batch_size >= nTrain ? t("pg.ed.mode.batch") : t("pg.ed.mode.mini");
  const opt = OPTIMIZER_OPTIONS.find((o) => o.value === c.optimizer)!;
  const act = ACTIVATION_OPTIONS.find((o) => o.value === c.activation)!;
  const loss = LOSS_OPTIONS.find((o) => o.value === c.loss)!;
  const params = countParameters(layers, c.batch_norm);
  /** Only the controls are disabled while a run is active; explanation buttons must stay usable. */
  const lock = (children: ReactNode, key?: string) => (
    <fieldset key={key} disabled={locked} className="m-0 min-w-0 space-y-3 border-0 p-0">{children}</fieldset>
  );
  const batchHelp = updates
    ? t(updates === 1 ? "pg.ed.batch.update1" : "pg.ed.batch.updateN", undefined, { mode, u: updates, n: nTrain, b: effBatch })
    : t("pg.ed.batch.noUpdates", undefined, { mode });

  return (
    <section className="card p-4" aria-labelledby="arch-title" id="section-design">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="arch-title" className="card-title">{t("pg.ed.title")}</h2>
        <span className="chip" title={t("pg.ed.params.hint")}>
          {t("pg.ed.params", undefined, { n: params.toLocaleString() })}
        </span>
      </div>
      {locked && (
        <p className="mt-2 rounded-lg bg-raised p-2 text-xs text-muted"><Rich text={t("pg.ed.locked")} /></p>
      )}
      <div className="mt-3 space-y-3" role="group" aria-label={t("pg.ed.legend")}>

        <Section id="sec-arch" title={t("pg.ed.sec1")}>
          <div>
            <div className="label">{t("pg.ed.layers", undefined, { n: layers.length })}</div>
            {lock(<>
            <div className="space-y-2">
              {layers.map((u, i) => (
                <div key={i} className="flex items-center gap-2">
                  <label htmlFor={`layer-${i}`} className="w-16 shrink-0 text-xs text-muted">{t("pg.ed.layerN", undefined, { n: i + 1 })}</label>
                  <input id={`layer-${i}`} type="range" min={1} max={32} value={u}
                    onChange={(e) => setLayers(layers.map((v, j) => (j === i ? Number(e.target.value) : v)))}
                    className="min-w-0 flex-1 accent-brand" aria-valuetext={t("pg.ed.neurons", undefined, { n: u })} />
                  <span className="w-14 text-right font-mono text-xs">{u} <span className="text-muted">n</span></span>
                  <button className="btn-ghost !px-2 !py-0.5 !text-xs" aria-label={t("pg.ed.removeLayer", undefined, { n: i + 1 })} onClick={() => setLayers(layers.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
              {layers.length === 0 && <p className="text-xs text-muted">{t("pg.ed.noHidden")}</p>}
            </div>
            <button className="btn-ghost mt-2 w-full !py-1.5 !text-xs" disabled={layers.length >= 5} onClick={() => setLayers([...layers, layers[layers.length - 1] ?? 4])}>
              {t("pg.ed.addLayer")}
            </button>
            </>)}
            <p className="mt-1 text-xs text-muted">{t("pg.ed.layers.help")}</p>
            {err.hidden_layers && <p role="alert" className="mt-1 text-xs text-bad">{err.hidden_layers}</p>}
            <SectionHelp id="layers" className="mt-2" />
          </div>
          {lock(<Field id="act" label={t("pg.ed.act")} help={ot.note("act", act)}>
            <select id="act" className="field" value={c.activation} onChange={(e) => setConfig({ activation: e.target.value as Activation })}>
              {ACTIVATION_OPTIONS.map((a) => <option key={a.value} value={a.value}>{ot.label("act", a)}</option>)}
            </select>
          </Field>)}
          <SectionHelp id="activation" />
          <SectionHelp id={`act.${c.activation}`} kind="option" formula={ACT[c.activation].tex} />
          {lock(<Field id="init" label={t("pg.ed.init")} help={t("pg.ed.init.help")}>
            <select id="init" className="field" value={c.init} onChange={(e) => setConfig({ init: e.target.value as Initializer })}>
              {INITS.map((i) => <option key={i.value} value={i.value}>{ot.label("init", i)}</option>)}
            </select>
          </Field>)}
          <SectionHelp id="init" />
        </Section>

        <Section id="sec-opt" title={t("pg.ed.sec2")}>
          {lock(<Field id="opt" label={t("pg.ed.opt")} help={ot.note("optim", opt)}>
            <select id="opt" className="field" value={c.optimizer} onChange={(e) => setConfig({ optimizer: e.target.value as Optimizer })}>
              {OPTIMIZER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{ot.label("optim", o)}</option>)}
            </select>
          </Field>)}
          <SectionHelp id="optimizer" />
          <SectionHelp id={`optim.${c.optimizer}`} kind="option" formula={OPTIM_FORMULA[c.optimizer]} />
          {lock(<>
          <Field id="lr" label={t("pg.ed.lr")} help={t("pg.ed.lr.help")} error={err.learning_rate}>
            <input id="lr" type="number" step="any" min={0} max={10} className="field" value={c.learning_rate}
              aria-invalid={!!err.learning_rate} aria-describedby={err.learning_rate ? "lr-err" : "lr-help"}
              onChange={(e) => setConfig({ learning_rate: num(e.target.value, 0) })} />
          </Field>
          {c.learning_rate !== opt.lr && (
            <button type="button" className="btn-ghost w-full !py-1 !text-xs" onClick={() => setConfig({ learning_rate: opt.lr })}>
              {t("pg.ed.lr.typical", undefined, { lr: opt.lr })}
            </button>
          )}
          </>)}
          <SectionHelp id="lr" formula={String.raw`\theta_{t+1}=\theta_t-\eta\,g_t`} />
          {lock(<Field id="loss" label={t("pg.ed.loss")} help={ot.note("loss", loss)}>
            <select id="loss" className="field" value={c.loss} onChange={(e) => setConfig({ loss: e.target.value as Loss })}>
              {LOSS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{ot.label("loss", o)}</option>)}
            </select>
          </Field>)}
          <SectionHelp id="loss" />
          <SectionHelp id={`loss.${c.loss}`} kind="option" formula={LOSS_FORMULA[c.loss]} />
          {lock(<div className="grid grid-cols-2 gap-3">
            <Field id="epochs" label={t("pg.ed.epochs")} help={t("pg.ed.epochs.help")} error={err.epochs}>
              <input id="epochs" type="number" min={1} max={2000} className="field" value={c.epochs} aria-invalid={!!err.epochs}
                onChange={(e) => setConfig({ epochs: num(e.target.value, 1) })} />
            </Field>
            <Field id="mseed" label={t("pg.ed.mseed")} help={t("pg.ed.mseed.help")} error={err.seed}>
              <input id="mseed" type="number" min={0} className="field" value={c.seed}
                onChange={(e) => setConfig({ seed: Math.max(0, Math.floor(num(e.target.value, 0))) })} />
            </Field>
          </div>)}
          <SectionHelp id="epochs" />
          {lock(<Field id="delay" label={t("pg.ed.delay")} help={t("pg.ed.delay.help")}>
            <input id="delay" type="number" min={0} max={1000} className="field" value={c.epoch_delay_ms}
              onChange={(e) => setConfig({ epoch_delay_ms: Math.min(1000, Math.max(0, Math.floor(num(e.target.value, 0)))) })} />
          </Field>)}
        </Section>

        <Section id="sec-batch" title={t("pg.ed.sec3")}>
          {lock(<>
          <div role="group" aria-label={t("pg.ed.gdVariant")} className="flex flex-wrap gap-1.5">
            {[
              { label: t("pg.ed.batchGD"), value: Math.max(1, nTrain || 160), hint: t("pg.ed.batchGD.hint") },
              { label: t("pg.ed.miniBatch"), value: 32, hint: t("pg.ed.miniBatch.hint") },
              { label: t("pg.ed.sgd"), value: 1, hint: t("pg.ed.sgd.hint") },
            ].map((b, bi) => (
              <button key={bi} type="button" title={b.hint} onClick={() => setConfig({ batch_size: b.value })}
                aria-pressed={c.batch_size === b.value}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${c.batch_size === b.value ? "border-brand bg-brand/10 text-brand" : "border-line text-muted hover:text-ink"}`}>
                {b.label}
              </button>
            ))}
          </div>
          <Field id="batch" label={t("pg.ed.batch")} help={batchHelp} error={err.batch_size}>
            <input id="batch" type="number" min={1} max={2000} className="field" value={c.batch_size} aria-invalid={!!err.batch_size}
              onChange={(e) => setConfig({ batch_size: num(e.target.value, 1) })} />
          </Field>
          </>)}
          <p className="text-xs text-muted">{t("pg.ed.batch.note")}</p>
          <SectionHelp id="batch" formula={[String.raw`\theta\leftarrow\theta-\eta\,\nabla_\theta L`, String.raw`\text{updates per epoch}=\lceil N_{\text{train}}/B\rceil`]} />
        </Section>

        <Section id="sec-reg" title={t("pg.ed.sec4")} open={false}>
          <p className="text-xs text-muted">{t("pg.ed.reg.intro")}</p>
          {lock(<div className="grid grid-cols-2 gap-3">
            <Field id="l1" label={t("pg.ed.l1")} help={t("pg.ed.l1.help")} error={err.l1}>
              <input id="l1" type="number" step={0.001} min={0} max={1} className="field" value={c.l1} aria-invalid={!!err.l1}
                onChange={(e) => setConfig({ l1: num(e.target.value, 0) })} />
            </Field>
            <Field id="l2" label={t("pg.ed.l2")} help={t("pg.ed.l2.help")} error={err.l2}>
              <input id="l2" type="number" step={0.001} min={0} max={1} className="field" value={c.l2} aria-invalid={!!err.l2}
                onChange={(e) => setConfig({ l2: num(e.target.value, 0) })} />
            </Field>
          </div>)}
          <p className="text-xs text-muted">{t("pg.ed.l1l2.note")}</p>
          <SectionHelp id="l1l2" formula={String.raw`L_{\text{total}}=L_{\text{data}}+\lambda_1\sum|w|+\lambda_2\sum w^2`} />
          {lock(<div className="min-w-[180px]">
            <label htmlFor="dropout" className="flex items-baseline justify-between text-xs font-medium text-muted">
              <span title={t("pg.ed.dropout.hint")}>{t("pg.ed.dropout")}</span>
              <output htmlFor="dropout" className="font-mono text-sm text-ink">{c.dropout.toFixed(2)}</output>
            </label>
            <input id="dropout" type="range" min={0} max={0.9} step={0.05} value={c.dropout} className="mt-1 w-full accent-brand"
              onChange={(e) => setConfig({ dropout: Number(e.target.value) })} />
            <p className="mt-1 text-xs text-muted">{t("pg.ed.dropout.help")}</p>
            {err.dropout && <p role="alert" className="text-xs text-bad">{err.dropout}</p>}
          </div>)}
          <SectionHelp id="dropout" formula={String.raw`\tilde a=\frac{m\odot a}{1-p},\quad m_i\sim\text{Bernoulli}(1-p)`} />
          {lock(<label className="flex cursor-pointer items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-brand" checked={c.batch_norm} onChange={(e) => setConfig({ batch_norm: e.target.checked })} />
            <span>{t("pg.ed.bn")}<small className="block text-xs text-muted">{t("pg.ed.bn.help")}</small></span>
          </label>)}
          <SectionHelp id="bn" formula={String.raw`\hat x=\frac{x-\mu_B}{\sqrt{\sigma_B^2+\epsilon}},\quad y=\gamma\hat x+\beta`} />
        </Section>

        <Section id="sec-val" title={t("pg.ed.sec5")} open={false}>
          {lock(<Field id="val" label={t("pg.ed.val")} help={t("pg.ed.val.help")} error={err.val_split}>
            <input id="val" type="number" step={0.05} min={0} max={0.5} className="field" value={c.val_split} aria-invalid={!!err.val_split}
              onChange={(e) => setConfig({ val_split: num(e.target.value, 0) })} />
          </Field>)}
          <SectionHelp id="valsplit" />
          {lock(<label className="flex cursor-pointer items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-brand" checked={c.early_stopping} onChange={(e) => setConfig({ early_stopping: e.target.checked })} />
            <span>{t("pg.ed.early")}<small className="block text-xs text-muted"><Rich text={t("pg.ed.early.help")} /></small></span>
          </label>)}
          {err.early_stopping && <p role="alert" className="text-xs text-bad">{err.early_stopping}</p>}
          {c.early_stopping && lock(
            <div className="grid grid-cols-2 gap-3">
              <Field id="patience" label={t("pg.ed.patience")} help={t("pg.ed.patience.help")} error={err.patience}>
                <input id="patience" type="number" min={1} max={500} className="field" value={c.patience} aria-invalid={!!err.patience}
                  onChange={(e) => setConfig({ patience: Math.max(1, Math.floor(num(e.target.value, 1))) })} />
              </Field>
              <label className="flex cursor-pointer items-start gap-2 pt-5 text-sm">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-brand" checked={c.restore_best} onChange={(e) => setConfig({ restore_best: e.target.checked })} />
                <span>{t("pg.ed.restore")}</span>
              </label>
            </div>,
          )}
          <SectionHelp id="early" />
        </Section>
      </div>
    </section>
  );
}
