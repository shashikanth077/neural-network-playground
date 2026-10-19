import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSheet } from "../cheatsheets/registry";
import { useLang, useMeta, useT } from "../i18n";

export function CheatsheetPage() {
  const { sheetId } = useParams();
  const sheet = getSheet(sheetId);
  const [q, setQ] = useState("");
  const t = useT();
  const m = useMeta();
  const { lang } = useLang();

  const shown = useMemo(() => {
    if (!sheet) return [];
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    return sheet.sections.filter((s) => {
      const hay = `${s.title} ${t(`cs.${sheet.id}.${s.id}.title`, "")} ${s.keywords}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }, [sheet, q, t]);

  if (!sheet || sheet.status !== "live") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">{sheet ? m.sheetTitle(sheet) : t("sheets.notFound")}</h1>
        <p className="mt-2 text-muted">{sheet ? t("sheets.planned") : t("sheets.notFoundHint")}</p>
        <Link to="/cheatsheets" className="btn-primary mt-6 inline-block">{t("sheets.allBtn")}</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <div className="print:hidden">
        <Link to="/cheatsheets" className="text-sm text-brand hover:underline">{t("sheets.all")}</Link>
      </div>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{m.sheetTitle(sheet)}</h1>
          <p className="mt-1 max-w-2xl text-muted">{m.sheetSubtitle(sheet)}</p>
        </div>
        <button className="btn-ghost print:hidden" onClick={() => window.print()}>{t("sheets.print")}</button>
      </div>

      <div className="mt-5 print:hidden">
        <label htmlFor="sheet-search" className="sr-only">{t("sheets.searchLabel")}</label>
        <input
          id="sheet-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("sheets.searchPh")}
          className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
        <p className="mt-1.5 text-xs text-muted" role="status">{t("sheets.count", undefined, { a: shown.length, b: sheet.sections.length })}</p>
      </div>

      {lang !== "en" && <p className="mt-4 rounded-xl border border-line bg-raised/60 p-3 text-xs text-muted print:hidden">{t("sheets.partial")}</p>}

      <div className="mt-6 grid gap-8 lg:grid-cols-[14rem_1fr]">
        <nav aria-label={t("sheets.sections", "Sections")} className="print:hidden lg:sticky lg:top-20 lg:self-start">
          <ul className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-0.5">
            {shown.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="block rounded-lg px-2.5 py-1 text-sm text-muted hover:bg-raised hover:text-ink">{t(`cs.${sheet.id}.${s.id}.title`, s.title)}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 space-y-10">
          {shown.length === 0 && <p className="text-sm text-muted">{t("sheets.noMatch", undefined, { q })}</p>}
          {shown.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-20 break-inside-avoid-page" aria-labelledby={`${s.id}-h`}>
              <h2 id={`${s.id}-h`} className="border-b border-line pb-1.5 text-xl font-bold tracking-tight">{t(`cs.${sheet.id}.${s.id}.title`, s.title)}</h2>
              {t(`cs.${sheet.id}.${s.id}.sum`, "") && <p className="mt-2 text-sm text-muted">{t(`cs.${sheet.id}.${s.id}.sum`, "")}</p>}
              <div className="mt-3">{s.render()}</div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
