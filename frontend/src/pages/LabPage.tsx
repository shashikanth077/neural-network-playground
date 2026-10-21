import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useLabProgress } from "../labs/progress";
import { getDomain } from "../labs/domains";
import { getLab, LABS } from "../labs/registry";
import type { Lab, LabStep } from "../labs/types";
import { firstLessonId, labSteps, SETUP_STEP_ID } from "../labs/LabSetupPanel";
import { useMeta, useT } from "../i18n";

function ProgressBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-raised" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
      <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${percent}%` }} />
    </div>
  );
}

function Stepper({ lab, steps, current, progress, onPick }: { lab: Lab; steps: LabStep[]; current: string; progress: ReturnType<typeof useLabProgress>; onPick?: () => void }) {
  const t = useT();
  const m = useMeta();
  const groups = useMemo(() => {
    const out: { name: string; steps: { step: LabStep; index: number }[] }[] = [];
    steps.forEach((step, index) => {
      const g = out.find((x) => x.name === step.group);
      if (g) g.steps.push({ step, index });
      else out.push({ name: step.group, steps: [{ step, index }] });
    });
    return out;
  }, [steps]);
  return (
    <nav aria-label={`${m.labTitle(lab)} · ${t("lab.stepsLabel")}`} className="space-y-4">
      {groups.map((g) => (
        <div key={g.name}>
          <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{t(`lab.group.${g.name}`, g.name)}</p>
          <ol className="mt-1 space-y-0.5">
            {g.steps.map(({ step, index }) => {
              const active = step.id === current;
              const done = progress.isDone(step.id);
              return (
                <li key={step.id}>
                  <Link
                    to={`/labs/${lab.id}/${step.id}`}
                    onClick={onPick}
                    aria-current={active ? "step" : undefined}
                    title={m.stepSummary(lab.id, step)}
                    className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition ${active ? "bg-brand/10 font-semibold text-brand" : "text-muted hover:bg-raised hover:text-ink"}`}
                  >
                    <span
                      aria-hidden
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] font-semibold ${
                        done ? "border-ok bg-ok text-white dark:text-bg" : active ? "border-brand" : "border-line"
                      }`}
                    >
                      {done ? "✓" : index + 1}
                    </span>
                    <span className="min-w-0 flex-1 leading-snug">{m.stepTitle(lab.id, step)}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </nav>
  );
}

export function LabPage() {
  const { labId, stepId } = useParams();
  const lab = getLab(labId);
  const navigate = useNavigate();
  const t = useT();
  const m = useMeta();
  const steps = useMemo(() => (lab ? labSteps(lab) : []), [lab]);
  const progress = useLabProgress(lab?.id ?? "none", steps.map((s) => s.id));
  const [drawer, setDrawer] = useState(false);
  const main = useRef<HTMLDivElement>(null);

  const index = lab ? steps.findIndex((s) => s.id === stepId) : -1;
  const step = lab && index >= 0 ? steps[index] : null;

  useEffect(() => {
    if (step) {
      progress.visit(step.id);
      document.title = `${m.stepTitle(lab!.id, step)} · ${t("lab.labN", undefined, { n: lab!.number })} · AI Lab`;
      main.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0 });
    }
    return () => { document.title = "AI Lab"; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id, t]);

  if (!lab) return <Navigate to="/labs" replace />;
  if (lab.status !== "live" || lab.steps.length === 0) return <Navigate to="/labs" replace />;
  if (!step) {
    const resume = steps.find((s) => s.id === progress.last) ?? steps.find((s) => s.id === firstLessonId(lab)) ?? steps[0];
    return <Navigate to={`/labs/${lab.id}/${resume.id}`} replace />;
  }

  const prev = steps[index - 1];
  const next = steps[index + 1];
  const Step = step.Component;
  const done = progress.isDone(step.id);

  const goNext = () => {
    progress.complete(step.id);
    if (next) navigate(`/labs/${lab.id}/${next.id}`);
    else navigate(`/labs/${lab.id}`);
  };

  return (
    <div className="mx-auto grid max-w-[1400px] gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* sidebar (desktop) */}
      <aside className="hidden lg:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] space-y-4 overflow-y-auto pr-1">
          <LabSwitcher lab={lab} />
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
              <span>{t("lab.stepsDone", undefined, { a: progress.done.length, b: steps.length })}</span>
              <span className="font-mono">{progress.percent}%</span>
            </div>
            <ProgressBar percent={progress.percent} label={t("lab.progress")} />
          </div>
          <Stepper lab={lab} steps={steps} current={step.id} progress={progress} />
          <button className="btn-ghost w-full !py-1.5 !text-xs" onClick={() => { if (window.confirm(t("lab.resetConfirm"))) progress.reset(); }}>
            {t("lab.reset")}
          </button>
        </div>
      </aside>

      {/* top bar (mobile / tablet) */}
      <div className="min-w-0 lg:hidden">
        <button className="card flex w-full items-center justify-between gap-3 p-3 text-left" aria-expanded={drawer} aria-controls="lab-drawer" onClick={() => setDrawer((d) => !d)}>
          <span className="min-w-0">
            <span className="block text-xs text-muted">{t("lab.stepOfShort", undefined, { n: lab.number, a: index + 1, b: steps.length })}</span>
            <span className="block truncate text-sm font-semibold">{m.stepTitle(lab.id, step)}</span>
          </span>
          <span aria-hidden className="text-muted">{drawer ? "▴" : "▾"}</span>
        </button>
        <div className="mt-2"><ProgressBar percent={progress.percent} label={t("lab.progress")} /></div>
        {drawer && (
          <div id="lab-drawer" className="card mt-3 max-h-[60vh] space-y-3 overflow-y-auto p-3">
            <LabSwitcher lab={lab} />
            <Stepper lab={lab} steps={steps} current={step.id} progress={progress} onPick={() => setDrawer(false)} />
          </div>
        )}
      </div>

      {/* content */}
      <div ref={main} tabIndex={-1} className="min-w-0 outline-none focus:outline-none focus-visible:ring-0 lg:col-start-2 lg:row-start-1">
        <nav aria-label="Breadcrumb" className="text-xs text-muted">
          <Link className="hover:text-ink" to="/labs">{t("lab.breadcrumb.labs")}</Link> <span aria-hidden>/</span>{" "}
          <Link className="hover:text-ink" to={`/labs?domain=${lab.domain}`}>{m.domainName(getDomain(lab.domain))}</Link> <span aria-hidden>/</span>{" "}
          <Link className="hover:text-ink" to={`/labs/${lab.id}`}>{t("lab.labN", undefined, { n: lab.number })}</Link> <span aria-hidden>/</span> <span>{t(`lab.group.${step.group}`, step.group)}</span>
        </nav>
        <header className="mt-2 mb-5">
          <p className="font-mono text-sm text-brand">{t("lab.stepOf", undefined, { a: index + 1, b: steps.length, m: step.minutes })}</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{m.stepTitle(lab.id, step)}</h1>
          <p className="mt-1 max-w-3xl text-muted">{m.stepSummary(lab.id, step)}</p>
        </header>

        {lab.Map && step.id !== SETUP_STEP_ID && <lab.Map key={`map-${step.id}`} stepId={step.id} done={progress.done} />}
        {lab.Intro && step.id !== SETUP_STEP_ID && <lab.Intro key={`intro-${step.id}`} stepId={step.id} done={progress.done} />}

        <Suspense fallback={<p className="py-10 text-center text-sm text-muted" role="status">{t("lab.loading")}</p>}>
          <Step />
        </Suspense>

        {lab.Outro && step.id !== SETUP_STEP_ID && <lab.Outro key={`outro-${step.id}`} stepId={step.id} done={progress.done} />}

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          {prev ? (
            <Link to={`/labs/${lab.id}/${prev.id}`} className="btn-ghost">← {m.stepTitle(lab.id, prev)}</Link>
          ) : <span />}
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input type="checkbox" className="h-4 w-4 accent-brand" checked={done} onChange={() => progress.toggle(step.id)} />
              {t("lab.markDone")}
            </label>
            <button className="btn-primary" onClick={goNext}>{next ? t("lab.continue") : t("lab.finish")}</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function LabSwitcher({ lab }: { lab: Lab }) {
  const navigate = useNavigate();
  const t = useT();
  const m = useMeta();
  return (
    <div className="card p-3">
      <p className={`text-[11px] font-semibold uppercase tracking-wider ${getDomain(lab.domain).text}`}>{getDomain(lab.domain).glyph} {getDomain(lab.domain).short} · {t("lab.labN", undefined, { n: lab.number })}</p>
      <p className="mt-0.5 text-sm font-semibold leading-snug">{m.labTitle(lab)}</p>
      <label htmlFor={`switch-${lab.id}`} className="sr-only">{t("lab.switch")}</label>
      <select
        id={`switch-${lab.id}`}
        className="field mt-2 !py-1 text-xs"
        value={lab.id}
        onChange={(e) => navigate(`/labs/${e.target.value}`)}
      >
        {LABS.map((l) => (
          <option key={l.id} value={l.id} disabled={l.status !== "live"}>
            {t("lab.labN", undefined, { n: l.number })} · {m.labTitle(l)}{l.status !== "live" ? ` ${t("lab.plannedSuffix")}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
