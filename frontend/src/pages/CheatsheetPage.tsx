import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSheet } from "../cheatsheets/registry";

export function CheatsheetPage() {
  const { sheetId } = useParams();
  const sheet = getSheet(sheetId);
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    if (!sheet) return [];
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    return sheet.sections.filter((s) => {
      const hay = `${s.title} ${s.keywords}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }, [sheet, q]);

  if (!sheet || sheet.status !== "live") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">{sheet ? sheet.title : "Cheatsheet not found"}</h1>
        <p className="mt-2 text-muted">{sheet ? "This cheatsheet is planned and not written yet." : "There is no cheatsheet with that name."}</p>
        <Link to="/cheatsheets" className="btn-primary mt-6 inline-block">All cheatsheets</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <div className="print:hidden">
        <Link to="/cheatsheets" className="text-sm text-brand hover:underline">← All cheatsheets</Link>
      </div>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{sheet.title}</h1>
          <p className="mt-1 max-w-2xl text-muted">{sheet.subtitle}</p>
        </div>
        <button className="btn-ghost print:hidden" onClick={() => window.print()}>Print / save as PDF</button>
      </div>

      <div className="mt-5 print:hidden">
        <label htmlFor="sheet-search" className="sr-only">Search this cheatsheet</label>
        <input
          id="sheet-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search sections, e.g. softmax, dropout, LSTM, padding…"
          className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
        <p className="mt-1.5 text-xs text-muted" role="status">{shown.length} of {sheet.sections.length} sections</p>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="Sections" className="print:hidden lg:sticky lg:top-20 lg:self-start">
          <ul className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-0.5">
            {shown.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="block rounded-lg px-2.5 py-1 text-sm text-muted hover:bg-raised hover:text-ink">{s.title}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 space-y-10">
          {shown.length === 0 && <p className="text-sm text-muted">No section matches “{q}”.</p>}
          {shown.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-20 break-inside-avoid-page" aria-labelledby={`${s.id}-h`}>
              <h2 id={`${s.id}-h`} className="border-b border-line pb-1.5 text-xl font-bold tracking-tight">{s.title}</h2>
              <div className="mt-3">{s.render()}</div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
