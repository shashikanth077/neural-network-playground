import { Link } from "react-router-dom";
import { SHEETS } from "../cheatsheets/registry";
import { DOMAINS } from "../labs/domains";
import { useMeta, useT } from "../i18n";

export function CheatsheetsIndex() {
  const t = useT();
  const m = useMeta();
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-12">
      <p className="font-mono text-sm text-brand">{t("sheets.eyebrow")}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{t("sheets.title")}</h1>
      <p className="mt-2 max-w-2xl text-muted">
        {t("sheets.intro")}
      </p>
      {DOMAINS.map((d) => {
        const sheets = SHEETS.filter((s) => s.domain === d.id);
        return (
          <section key={d.id} className="mt-8" aria-labelledby={`sheets-${d.id}`}>
            <h2 id={`sheets-${d.id}`} className={`flex items-center gap-2 text-lg font-bold tracking-tight ${d.text}`}>
              <span aria-hidden>{d.glyph}</span>{m.domainName(d)}
            </h2>
            {sheets.length === 0 ? (
              <p className="mt-2 rounded-xl border border-dashed border-line p-4 text-sm text-muted">{t("sheets.none")}</p>
            ) : (
              <ul className="mt-3 grid gap-4 md:grid-cols-2">
                {sheets.map((s) => {
                  const live = s.status === "live";
                  const body = (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {live ? <span className="chip !border-ok/40 !bg-ok/10 !text-ok">{t("tools.available")}</span> : <span className="chip">{t("nav.planned")}</span>}
                        {live && <span className="chip">{t("nav.sections", undefined, { n: s.sections.length })}</span>}
                      </div>
                      <h3 className="mt-3 text-lg font-semibold tracking-tight">{m.sheetTitle(s)}</h3>
                      <p className="mt-1.5 text-sm text-muted">{m.sheetSubtitle(s)}</p>
                      {live && <span className="mt-3 inline-block text-sm font-semibold text-brand">{t("sheets.open")}</span>}
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
