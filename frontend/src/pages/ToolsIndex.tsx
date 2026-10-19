import { Link } from "react-router-dom";
import { DOMAINS } from "../labs/domains";
import { TOOLS } from "../lib/features";
import { useMeta, useT } from "../i18n";

export function ToolsIndex() {
  const t = useT();
  const m = useMeta();
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-12">
      <p className="font-mono text-sm text-brand">{t("tools.eyebrow")}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{t("tools.title")}</h1>
      <p className="mt-2 max-w-2xl text-muted">
        {t("tools.intro")}
      </p>
      {DOMAINS.map((d) => {
        const tools = TOOLS.filter((x) => x.domain === d.id);
        return (
          <section key={d.id} className="mt-8" aria-labelledby={`tools-${d.id}`}>
            <h2 id={`tools-${d.id}`} className={`flex items-center gap-2 text-lg font-bold tracking-tight ${d.text}`}>
              <span aria-hidden>{d.glyph}</span>{m.domainName(d)}
            </h2>
            {tools.length === 0 ? (
              <p className="mt-2 rounded-xl border border-dashed border-line p-4 text-sm text-muted">{t("tools.none")}</p>
            ) : (
              <ul className="mt-3 grid gap-4 md:grid-cols-2">
                {tools.map((x) => (
                  <li key={x.id}>
                    <Link to={x.path} className="card block h-full p-5 transition hover:-translate-y-0.5 hover:border-brand/50">
                      <div className="flex flex-wrap gap-2">
                        <span className="chip !border-ok/40 !bg-ok/10 !text-ok">{t("tools.available")}</span>
                        <span className="chip">{x.needsBackend ? t("nav.needsBackend") : t("nav.inBrowser")}</span>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold tracking-tight">{m.toolTitle(x)}</h3>
                      <p className="mt-1.5 text-sm text-muted">{m.toolTagline(x)}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">{x.tags.map((g) => <span key={g} className="chip">{g}</span>)}</div>
                      <span className="mt-3 inline-block text-sm font-semibold text-brand">{t("tools.launch")}</span>
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
