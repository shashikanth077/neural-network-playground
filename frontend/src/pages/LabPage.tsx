import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useLabProgress } from "../labs/progress";
import { getDomain } from "../labs/domains";
import { getLab, LABS } from "../labs/registry";
import type { Lab } from "../labs/types";

function ProgressBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-raised" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
      <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${percent}%` }} />
    </div>
  );
}

function Stepper({ lab, current, progress, onPick }: { lab: Lab; current: string; progress: ReturnType<typeof useLabProgress>; onPick?: () => void }) {
  const groups = useMemo(() => {
    const out: { name: string; steps: { step: Lab["steps"][number]; index: number }[] }[] = [];
    lab.steps.forEach((step, index) => {
      const g = out.find((x) => x.name === step.group);
      if (g) g.steps.push({ step, index });
      else out.push({ name: step.group, steps: [{ step, index }] });
    });
    return out;
  }, [lab]);
  return (
    <nav aria-label={`${lab.title} steps`} className="space-y-4">
      {groups.map((g) => (
        <div key={g.name}>
          <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{g.name}</p>
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
                    title={step.summary}
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
                    <span className="min-w-0 flex-1 leading-snug">{step.title}</span>
                    <span className="sr-only">{done ? "(completed)" : ""}</span>
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
  const progress = useLabProgress(lab?.id ?? "none", lab?.steps.map((s) => s.id) ?? []);
  const [drawer, setDrawer] = useState(false);
  const main = useRef<HTMLDivElement>(null);

  const index = lab ? lab.steps.findIndex((s) => s.id === stepId) : -1;
  const step = lab && index >= 0 ? lab.steps[index] : null;

  useEffect(() => {
    if (step) {
      progress.visit(step.id);
      document.title = `${step.title} · Lab ${lab!.number} · AI Lab`;
      main.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0 });
    }
    return () => { document.title = "AI Lab"; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id]);

  if (!lab) return <Navigate to="/labs" replace />;
  if (lab.status !== "live" || lab.steps.length === 0) return <Navigate to="/labs" replace />;
  if (!step) {
    const resume = lab.steps.find((s) => s.id === progress.last) ?? lab.steps[0];
    return <Navigate to={`/labs/${lab.id}/${resume.id}`} replace />;
  }

  const prev = lab.steps[index - 1];
  const next = lab.steps[index + 1];
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
              <span>{progress.done.length} of {lab.steps.length} steps</span>
              <span className="font-mono">{progress.percent}%</span>
            </div>
            <ProgressBar percent={progress.percent} label="Lab progress" />
          </div>
          <Stepper lab={lab} current={step.id} progress={progress} />
          <button className="btn-ghost w-full !py-1.5 !text-xs" onClick={() => { if (window.confirm("Clear your progress in this lab?")) progress.reset(); }}>
            Reset progress
          </button>
        </div>
      </aside>

      {/* top bar (mobile / tablet) */}
      <div className="lg:hidden">
        <button className="card flex w-full items-center justify-between gap-3 p-3 text-left" aria-expanded={drawer} aria-controls="lab-drawer" onClick={() => setDrawer((d) => !d)}>
          <span className="min-w-0">
            <span className="block text-xs text-muted">Lab {lab.number} · step {index + 1} of {lab.steps.length}</span>
            <span className="block truncate text-sm font-semibold">{step.title}</span>
          </span>
          <span aria-hidden className="text-muted">{drawer ? "▴" : "▾"}</span>
        </button>
        <div className="mt-2"><ProgressBar percent={progress.percent} label="Lab progress" /></div>
        {drawer && (
          <div id="lab-drawer" className="card mt-3 max-h-[60vh] space-y-3 overflow-y-auto p-3">
            <LabSwitcher lab={lab} />
            <Stepper lab={lab} current={step.id} progress={progress} onPick={() => setDrawer(false)} />
          </div>
        )}
      </div>

      {/* content */}
      <div ref={main} tabIndex={-1} className="min-w-0 outline-none focus:outline-none focus-visible:ring-0 lg:col-start-2 lg:row-start-1">
        <nav aria-label="Breadcrumb" className="text-xs text-muted">
          <Link className="hover:text-ink" to="/labs">Labs</Link> <span aria-hidden>/</span>{" "}
          <Link className="hover:text-ink" to={`/labs?domain=${lab.domain}`}>{getDomain(lab.domain).name}</Link> <span aria-hidden>/</span>{" "}
          <Link className="hover:text-ink" to={`/labs/${lab.id}`}>Lab {lab.number}</Link> <span aria-hidden>/</span> <span>{step.group}</span>
        </nav>
        <header className="mt-2 mb-5">
          <p className="font-mono text-sm text-brand">Step {index + 1} / {lab.steps.length} · ~{step.minutes} min</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{step.title}</h1>
          <p className="mt-1 max-w-3xl text-muted">{step.summary}</p>
        </header>

        <Suspense fallback={<p className="py-10 text-center text-sm text-muted" role="status">Loading step…</p>}>
          <Step />
        </Suspense>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          {prev ? (
            <Link to={`/labs/${lab.id}/${prev.id}`} className="btn-ghost">← {prev.title}</Link>
          ) : <span />}
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input type="checkbox" className="h-4 w-4 accent-brand" checked={done} onChange={() => progress.toggle(step.id)} />
              Mark step complete
            </label>
            <button className="btn-primary" onClick={goNext}>{next ? "Continue →" : "Finish lab ✓"}</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function LabSwitcher({ lab }: { lab: Lab }) {
  const navigate = useNavigate();
  return (
    <div className="card p-3">
      <p className={`text-[11px] font-semibold uppercase tracking-wider ${getDomain(lab.domain).text}`}>{getDomain(lab.domain).glyph} {getDomain(lab.domain).short} · Lab {lab.number}</p>
      <p className="mt-0.5 text-sm font-semibold leading-snug">{lab.title}</p>
      <label htmlFor={`switch-${lab.id}`} className="sr-only">Switch lab</label>
      <select
        id={`switch-${lab.id}`}
        className="field mt-2 !py-1 text-xs"
        value={lab.id}
        onChange={(e) => navigate(`/labs/${e.target.value}`)}
      >
        {LABS.map((l) => (
          <option key={l.id} value={l.id} disabled={l.status !== "live"}>
            Lab {l.number} · {l.title}{l.status !== "live" ? " (planned)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
