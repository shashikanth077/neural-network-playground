import { Link } from "react-router-dom";
import { HeroArt } from "../components/HeroArt";
import { DOMAINS, getDomain } from "../labs/domains";
import { domainSummary, labMinutes, LABS, liveLabs } from "../labs/registry";
import { TOOLS } from "../lib/features";
import { useMeta, useT } from "../i18n";

function DomainChip({ id }: { id: Parameters<typeof getDomain>[0] }) {
  const d = getDomain(id);
  return <span className={`chip !border-transparent ${d.tint} ${d.text}`}>{d.glyph} {d.short}</span>;
}

export function Home() {
  const t = useT();
  const m = useMeta();
  const summary = domainSummary();
  const live = liveLabs();
  const planned = LABS.filter((l) => l.status === "planned");
  const totalSteps = live.reduce((n, l) => n + l.steps.length, 0);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-70"
          style={{ background: "radial-gradient(60% 50% at 80% 0%, rgb(var(--brand) / .16), transparent), radial-gradient(40% 40% at 0% 100%, rgb(var(--c-teal) / .12), transparent)" }} />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.15fr_.85fr] md:py-20">
          <div>
            <span className="chip !text-brand">{t("home.badge")}</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
              {t("home.title.1")} <span className="text-c-teal">{t("home.title.ml")}</span>, <span className="text-brand">{t("home.title.dl")}</span> {t("home.title.and", "and")} <span className="text-c-purple">{t("home.title.nlp")}</span> {t("home.title.end")}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              {t("home.intro")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/labs" className="btn-primary !px-5 !py-2.5 !text-base">{t("home.cta.labs")}</Link>
              <Link to="/tools" className="btn-ghost !px-5 !py-2.5 !text-base">{t("home.cta.tool")}</Link>
              <Link to="/cheatsheets" className="btn-ghost !px-5 !py-2.5 !text-base">{t("home.cta.sheets")}</Link>
            </div>
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {[[String(DOMAINS.length), t("home.stat.domains")], [String(live.length), live.length === 1 ? t("home.stat.lab") : t("home.stat.labs")], [String(TOOLS.length), TOOLS.length === 1 ? t("home.stat.tool") : t("home.stat.tools")], [String(totalSteps), t("home.stat.steps")]].map(([a, b]) => (
                <div key={b}><dt className="font-mono text-lg font-semibold">{a}</dt><dd className="text-muted">{b}</dd></div>
              ))}
            </dl>
          </div>
          <HeroArt />
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6" aria-labelledby="dom-title">
        <h2 id="dom-title" className="text-2xl font-bold tracking-tight">{t("home.domains.title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("home.domains.sub")}</p>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {DOMAINS.map((d) => {
            const s = summary.find((x) => x.id === d.id)!;
            return (
              <li key={d.id}>
                <Link to={`/labs?domain=${d.id}`} className={`card block h-full p-5 transition hover:-translate-y-0.5 hover:border-brand/50`}>
                  <div className="flex items-center gap-3">
                    <span className={`grid h-11 w-11 place-items-center rounded-xl text-2xl ${d.tint}`} aria-hidden>{d.glyph}</span>
                    <h3 className="text-lg font-semibold leading-tight tracking-tight">{m.domainName(d)}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{m.domainBlurb(d)}</p>
                  <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span><b className="text-ink">{s.liveLabs.length}</b> {s.liveLabs.length === 1 ? t("home.domains.lab") : t("home.domains.labs")}</span>
                    <span><b className="text-ink">{s.tools.length}</b> {s.tools.length === 1 ? t("home.domains.tool") : t("home.domains.tools")}</span>
                    <span><b className="text-ink">{s.plannedLabs.length}</b> {t("home.domains.planned")}</span>
                  </p>
                  <span className={`mt-3 inline-block text-sm font-semibold ${d.text}`}>{t("home.domains.browse")} {d.short} →</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border-y border-line bg-surface/50" aria-labelledby="now-title">
        <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
          <h2 id="now-title" className="text-2xl font-bold tracking-tight">{t("home.now.title")}</h2>
          <p className="mt-1 text-sm text-muted">{t("home.now.sub")}</p>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {live.map((lab) => (
              <li key={lab.id}>
                <Link to={`/labs/${lab.id}`} className="card block h-full p-5 transition hover:-translate-y-0.5 hover:border-brand/50">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip !border-ok/40 !bg-ok/10 !text-ok">{t("home.guidedLab", undefined, { n: lab.number })}</span>
                    <DomainChip id={lab.domain} />
                  </div>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight">{m.labTitle(lab)}</h3>
                  {lab.course && <p className="text-xs text-muted">{lab.course}</p>}
                  <p className="mt-2 text-sm text-muted">{m.labSubtitle(lab)}</p>
                  <p className="mt-3 text-xs text-muted">{t("home.stepsMin", undefined, { n: lab.steps.length, m: labMinutes(lab) })}</p>
                  <span className="mt-3 inline-block text-sm font-semibold text-brand">{t("home.startLab")}</span>
                </Link>
              </li>
            ))}
            {TOOLS.map((x) => (
              <li key={x.id}>
                <Link to={x.path} className="card block h-full p-5 transition hover:-translate-y-0.5 hover:border-brand/50">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip !border-ok/40 !bg-ok/10 !text-ok">{t("home.tool")}</span>
                    <DomainChip id={x.domain} />
                  </div>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight">{m.toolTitle(x)}</h3>
                  <p className="mt-2 text-sm text-muted">{m.toolTagline(x)}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">{x.tags.map((g) => <span key={g} className="chip">{g}</span>)}</div>
                  <span className="mt-3 inline-block text-sm font-semibold text-brand">{t("home.launch")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6" aria-labelledby="next-title">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="next-title" className="text-2xl font-bold tracking-tight">{t("home.next.title")}</h2>
            <p className="mt-1 text-sm text-muted">{t("home.next.sub")}</p>
          </div>
          <Link to="/labs?status=planned" className="shrink-0 text-sm font-semibold text-brand hover:underline">{t("home.next.all")}</Link>
        </div>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {planned.map((lab) => (
            <li key={lab.id} className="card border-dashed p-5 opacity-80" aria-disabled="true">
              <div className="flex items-center gap-2"><span className="chip">{t("home.labPlanned", undefined, { n: lab.number })}</span><DomainChip id={lab.domain} /></div>
              <h3 className="mt-3 font-semibold leading-snug tracking-tight">{m.labTitle(lab)}</h3>
              <p className="mt-1.5 text-sm text-muted">{m.labSubtitle(lab)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-line bg-surface/50">
        <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight">{t("home.why.title")}</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className="rounded-2xl border border-line bg-surface p-5">
                <h3 className="font-semibold">{t(`home.why.${i}.t`)}</h3>
                <p className="mt-1.5 text-sm text-muted">{t(`home.why.${i}.d`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight">{t("home.how.title")}</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <li key={i} className="card p-5"><span className="font-mono text-sm text-brand">0{i}</span><h3 className="mt-1 font-semibold">{t(`home.how.${i}.t`)}</h3><p className="mt-1 text-sm text-muted">{t(`home.how.${i}.d`)}</p></li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-line py-8 text-center text-xs text-muted">
        AI Lab · Machine Learning · Deep Learning · NLP · React · TypeScript · FastAPI · NumPy · MIT License
      </footer>
    </div>
  );
}
