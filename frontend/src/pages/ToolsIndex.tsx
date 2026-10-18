import { Link } from "react-router-dom";
import { DOMAINS } from "../labs/domains";
import { TOOLS } from "../lib/features";

export function ToolsIndex() {
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-12">
      <p className="font-mono text-sm text-brand">AI Lab · Tools</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Interactive tools</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Open-ended sandboxes. Use them on their own or alongside a lab. Tools are grouped by domain.
      </p>
      {DOMAINS.map((d) => {
        const tools = TOOLS.filter((t) => t.domain === d.id);
        return (
          <section key={d.id} className="mt-8" aria-labelledby={`tools-${d.id}`}>
            <h2 id={`tools-${d.id}`} className={`flex items-center gap-2 text-lg font-bold tracking-tight ${d.text}`}>
              <span aria-hidden>{d.glyph}</span>{d.name}
            </h2>
            {tools.length === 0 ? (
              <p className="mt-2 rounded-xl border border-dashed border-line p-4 text-sm text-muted">No tools in this domain yet.</p>
            ) : (
              <ul className="mt-3 grid gap-4 md:grid-cols-2">
                {tools.map((t) => (
                  <li key={t.id}>
                    <Link to={t.path} className="card block h-full p-5 transition hover:-translate-y-0.5 hover:border-brand/50">
                      <div className="flex flex-wrap gap-2">
                        <span className="chip !border-ok/40 !bg-ok/10 !text-ok">Available</span>
                        <span className="chip">{t.needsBackend ? "Needs the backend" : "Runs in the browser"}</span>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold tracking-tight">{t.title}</h3>
                      <p className="mt-1.5 text-sm text-muted">{t.tagline}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">{t.tags.map((x) => <span key={x} className="chip">{x}</span>)}</div>
                      <span className="mt-3 inline-block text-sm font-semibold text-brand">Launch →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </main>
  );
}
