import { useState } from "react";
import { Link } from "react-router-dom";
import { readProgress } from "../labs/progress";
import { labMinutes, LABS } from "../labs/registry";

type Filter = "all" | "live" | "planned";

export function LabsIndex() {
  const [filter, setFilter] = useState<Filter>("all");
  const shown = LABS.filter((l) => filter === "all" || l.status === filter);

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-12">
      <p className="font-mono text-sm text-brand">AI Lab · Labs</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Guided labs</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Each lab is a step-by-step path with live demos, short explanations and checked numbers. Your progress is saved in this browser. New labs appear here as they are added.
      </p>

      <div role="radiogroup" aria-label="Filter labs" className="mt-6 inline-flex gap-1 rounded-xl border border-line bg-raised/60 p-1">
        {(["all", "live", "planned"] as Filter[]).map((f) => (
          <button key={f} role="radio" aria-checked={filter === f} onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${filter === f ? "bg-surface text-brand shadow-sm" : "text-muted hover:text-ink"}`}>
            {f === "live" ? "Available" : f}
          </button>
        ))}
      </div>

      <ul className="mt-6 grid gap-5 md:grid-cols-2">
        {shown.map((lab) => {
          const live = lab.status === "live";
          const p = live ? readProgress(lab.id, lab.steps.map((s) => s.id)) : null;
          const started = !!p && p.done > 0;
          const body = (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 font-mono text-lg font-bold text-brand">{lab.number}</span>
                <span className={`chip ${live ? "!border-ok/40 !bg-ok/10 !text-ok" : ""}`}>{live ? "Available" : "Planned"}</span>
              </div>
              <h2 className="mt-4 text-xl font-bold tracking-tight">{lab.title}</h2>
              {lab.course && <p className="mt-0.5 text-xs text-muted">{lab.course}</p>}
              <p className="mt-2 text-sm leading-relaxed text-muted">{lab.subtitle}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">{lab.tags.map((t) => <span key={t} className="chip">{t}</span>)}</div>
              {live && p && (
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{lab.steps.length} steps · ~{labMinutes(lab)} min</span>
                    <span>{started ? `${p.done}/${p.total} done` : "Not started"}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-raised" role="progressbar" aria-label={`${lab.title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.percent}>
                    <div className="h-full rounded-full bg-brand" style={{ width: `${p.percent}%` }} />
                  </div>
                  <span className="mt-4 inline-block text-sm font-semibold text-brand">{started ? "Continue →" : "Start lab →"}</span>
                </div>
              )}
              {!live && <p className="mt-5 text-sm text-muted">In the roadmap. Not available yet.</p>}
            </>
          );
          return (
            <li key={lab.id}>
              {live ? (
                <Link to={`/labs/${lab.id}`} className="card block h-full p-5 transition hover:-translate-y-0.5 hover:border-brand/50 sm:p-6">{body}</Link>
              ) : (
                <div className="card h-full border-dashed p-5 opacity-75 sm:p-6" aria-disabled="true">{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      <section className="card mt-8 p-5" aria-labelledby="add-lab">
        <h2 id="add-lab" className="font-semibold">Adding a lab</h2>
        <p className="mt-1 text-sm text-muted">
          A lab is a list of steps (title, summary, a React component). Create <code className="rounded bg-raised px-1.5 font-mono text-xs">src/labs/&lt;name&gt;/index.ts</code>, register it in <code className="rounded bg-raised px-1.5 font-mono text-xs">src/labs/registry.ts</code>, and the menu, stepper, progress tracking and this page update automatically.
        </p>
      </section>
    </main>
  );
}
