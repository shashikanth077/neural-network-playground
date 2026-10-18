import { Link, useSearchParams } from "react-router-dom";
import { DOMAINS, getDomain, type DomainId } from "../labs/domains";
import { readProgress } from "../labs/progress";
import { labMinutes, LABS } from "../labs/registry";

type Status = "all" | "live" | "planned";
const STATUSES: { v: Status; label: string }[] = [{ v: "all", label: "All" }, { v: "live", label: "Available" }, { v: "planned", label: "Planned" }];

export function LabsIndex() {
  const [params, setParams] = useSearchParams();
  const domain = (DOMAINS.some((d) => d.id === params.get("domain")) ? params.get("domain") : "all") as DomainId | "all";
  const status = (["live", "planned"].includes(params.get("status") ?? "") ? params.get("status") : "all") as Status;

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value === "all") next.delete(key); else next.set(key, value);
    setParams(next, { replace: true });
  };

  const shown = LABS.filter((l) => (domain === "all" || l.domain === domain) && (status === "all" || l.status === status));
  const count = (id: DomainId | "all") => LABS.filter((l) => id === "all" || l.domain === id).length;

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-12">
      <p className="font-mono text-sm text-brand">AI Lab · Labs</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Guided labs</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Each lab is its own project: a step-by-step path with live demos, short explanations and checked numbers. Filter by domain; your progress is saved in this browser.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div role="radiogroup" aria-label="Filter by domain" className="inline-flex flex-wrap gap-1 rounded-xl border border-line bg-raised/60 p-1">
          {([{ id: "all", name: "All domains", glyph: "" }, ...DOMAINS] as { id: DomainId | "all"; name: string; glyph: string }[]).map((d) => (
            <button key={d.id} role="radio" aria-checked={domain === d.id} onClick={() => set("domain", d.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${domain === d.id ? "bg-surface text-brand shadow-sm" : "text-muted hover:text-ink"}`}>
              {d.glyph && <span aria-hidden className="mr-1">{d.glyph}</span>}{d.id === "all" ? d.name : getDomain(d.id).short}
              <span className="ml-1.5 font-mono text-xs opacity-60">{count(d.id)}</span>
            </button>
          ))}
        </div>
        <div role="radiogroup" aria-label="Filter by status" className="inline-flex gap-1 rounded-xl border border-line bg-raised/60 p-1">
          {STATUSES.map((s) => (
            <button key={s.v} role="radio" aria-checked={status === s.v} onClick={() => set("status", s.v)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${status === s.v ? "bg-surface text-brand shadow-sm" : "text-muted hover:text-ink"}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {domain !== "all" && (
        <p className={`mt-4 max-w-2xl text-sm ${getDomain(domain).text}`}>
          <b>{getDomain(domain).name}.</b> <span className="text-muted">{getDomain(domain).blurb}</span>
        </p>
      )}

      {shown.length === 0 ? (
        <div className="card mt-6 p-8 text-center" role="status">
          <p className="font-semibold">No labs match these filters yet.</p>
          <p className="mt-1 text-sm text-muted">New labs appear here as they are added.</p>
          <button className="btn-ghost mt-4" onClick={() => setParams({}, { replace: true })}>Clear filters</button>
        </div>
      ) : (
        <ul className="mt-6 grid gap-5 md:grid-cols-2">
          {shown.map((lab) => {
            const live = lab.status === "live";
            const d = getDomain(lab.domain);
            const p = live ? readProgress(lab.id, lab.steps.map((s) => s.id)) : null;
            const started = !!p && p.done > 0;
            const body = (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 font-mono text-lg font-bold text-brand">{lab.number}</span>
                  <span className="flex flex-wrap items-center justify-end gap-1.5">
                    <span className={`chip !border-transparent ${d.tint} ${d.text}`}>{d.glyph} {d.short}</span>
                    <span className={`chip ${live ? "!border-ok/40 !bg-ok/10 !text-ok" : ""}`}>{live ? "Available" : "Planned"}</span>
                  </span>
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
      )}

      <section className="card mt-8 p-5" aria-labelledby="add-lab">
        <h2 id="add-lab" className="font-semibold">Adding a lab</h2>
        <p className="mt-1 text-sm text-muted">
          A lab is a list of steps (title, summary, a React component) tagged with a domain. Create <code className="rounded bg-raised px-1.5 font-mono text-xs">src/labs/&lt;name&gt;/index.ts</code>, register it in <code className="rounded bg-raised px-1.5 font-mono text-xs">src/labs/registry.ts</code>, and the menus, filters, stepper, home page and progress tracking update automatically. A planned card is simply replaced by the real lab.
        </p>
      </section>
    </main>
  );
}
