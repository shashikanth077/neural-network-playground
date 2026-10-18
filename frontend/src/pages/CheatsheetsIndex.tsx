import { Link } from "react-router-dom";
import { SHEETS } from "../cheatsheets/registry";
import { DOMAINS } from "../labs/domains";

export function CheatsheetsIndex() {
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-12">
      <p className="font-mono text-sm text-brand">AI Lab · Cheatsheets</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Cheatsheets</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Quick references you can search and print: formulas, defaults, code and worked numbers. Grouped by domain.
      </p>
      {DOMAINS.map((d) => {
        const sheets = SHEETS.filter((s) => s.domain === d.id);
        return (
          <section key={d.id} className="mt-8" aria-labelledby={`sheets-${d.id}`}>
            <h2 id={`sheets-${d.id}`} className={`flex items-center gap-2 text-lg font-bold tracking-tight ${d.text}`}>
              <span aria-hidden>{d.glyph}</span>{d.name}
            </h2>
            {sheets.length === 0 ? (
              <p className="mt-2 rounded-xl border border-dashed border-line p-4 text-sm text-muted">No cheatsheets in this domain yet.</p>
            ) : (
              <ul className="mt-3 grid gap-4 md:grid-cols-2">
                {sheets.map((s) => {
                  const live = s.status === "live";
                  const body = (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {live ? <span className="chip !border-ok/40 !bg-ok/10 !text-ok">Available</span> : <span className="chip">Planned</span>}
                        {live && <span className="chip">{s.sections.length} sections</span>}
                      </div>
                      <h3 className="mt-3 text-lg font-semibold tracking-tight">{s.title}</h3>
                      <p className="mt-1.5 text-sm text-muted">{s.subtitle}</p>
                      {live && <span className="mt-3 inline-block text-sm font-semibold text-brand">Open →</span>}
                    </>
                  );
                  return (
                    <li key={s.id}>
                      {live ? (
                        <Link to={`/cheatsheets/${s.id}`} className="card block h-full p-5 transition hover:-translate-y-0.5 hover:border-brand/50">{body}</Link>
                      ) : (
                        <div className="card h-full p-5 opacity-70" aria-disabled="true">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </main>
  );
}
