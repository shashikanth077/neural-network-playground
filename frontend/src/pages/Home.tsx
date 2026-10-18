import { Link } from "react-router-dom";
import { HeroArt } from "../components/HeroArt";
import { DOMAINS, getDomain } from "../labs/domains";
import { domainSummary, labMinutes, LABS, liveLabs } from "../labs/registry";
import { TOOLS } from "../lib/features";

const STEPS = [
  ["Pick a domain", "Machine learning, deep learning or language. Every project belongs to one."],
  ["Open a lab or a tool", "Labs are guided step-by-step paths; tools are open-ended sandboxes."],
  ["Run real experiments", "Drag sliders, train models and watch the numbers and pictures respond."],
  ["Track your progress", "Mark steps complete; the platform remembers where you stopped."],
];

const PRINCIPLES = [
  { t: "Real calculations, no mock data", d: "Every demo runs the real maths. Lab numbers are checked by tests; Playground training happens in a NumPy network on the server." },
  { t: "One project, one purpose", d: "Each lab or tool is its own self-contained project, so very different kinds of work live side by side." },
  { t: "Learn the math as you go", d: "Formulas for forward pass, backprop, scaling and outlier tests are tied to live numbers." },
  { t: "Cloud-ready by design", d: "Static React front end, containerised FastAPI back end, health checks and a CloudFormation template." },
];

function DomainChip({ id }: { id: Parameters<typeof getDomain>[0] }) {
  const d = getDomain(id);
  return <span className={`chip !border-transparent ${d.tint} ${d.text}`}>{d.glyph} {d.short}</span>;
}

export function Home() {
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
            <span className="chip !text-brand">Interactive AI learning platform</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
              Learn <span className="text-c-teal">machine learning</span>, <span className="text-brand">deep learning</span> and <span className="text-c-purple">NLP</span> by running real experiments.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              AI Lab is a growing platform of guided labs and interactive tools. Each project has its own step-by-step path, live demos and numbers you can trust, whatever the domain.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/labs" className="btn-primary !px-5 !py-2.5 !text-base">Explore labs →</Link>
              <Link to="/tools" className="btn-ghost !px-5 !py-2.5 !text-base">Open a tool</Link>
              <Link to="/cheatsheets" className="btn-ghost !px-5 !py-2.5 !text-base">Cheatsheets</Link>
            </div>
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {[[String(DOMAINS.length), "domains"], [String(live.length), live.length === 1 ? "lab available" : "labs available"], [String(TOOLS.length), TOOLS.length === 1 ? "interactive tool" : "interactive tools"], [String(totalSteps), "guided steps"]].map(([a, b]) => (
                <div key={b}><dt className="font-mono text-lg font-semibold">{a}</dt><dd className="text-muted">{b}</dd></div>
              ))}
            </dl>
          </div>
          <HeroArt />
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6" aria-labelledby="dom-title">
        <h2 id="dom-title" className="text-2xl font-bold tracking-tight">Explore by domain</h2>
        <p className="mt-1 text-sm text-muted">Projects are grouped by what they teach.</p>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {DOMAINS.map((d) => {
            const s = summary.find((x) => x.id === d.id)!;
            return (
              <li key={d.id}>
                <Link to={`/labs?domain=${d.id}`} className={`card block h-full p-5 transition hover:-translate-y-0.5 hover:border-brand/50`}>
                  <div className="flex items-center gap-3">
                    <span className={`grid h-11 w-11 place-items-center rounded-xl text-2xl ${d.tint}`} aria-hidden>{d.glyph}</span>
                    <h3 className="text-lg font-semibold leading-tight tracking-tight">{d.name}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{d.blurb}</p>
                  <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span><b className="text-ink">{s.liveLabs.length}</b> {s.liveLabs.length === 1 ? "lab" : "labs"} available</span>
                    <span><b className="text-ink">{s.tools.length}</b> {s.tools.length === 1 ? "tool" : "tools"}</span>
                    <span><b className="text-ink">{s.plannedLabs.length}</b> planned</span>
                  </p>
                  <span className={`mt-3 inline-block text-sm font-semibold ${d.text}`}>Browse {d.short} →</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border-y border-line bg-surface/50" aria-labelledby="now-title">
        <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
          <h2 id="now-title" className="text-2xl font-bold tracking-tight">Available now</h2>
          <p className="mt-1 text-sm text-muted">Start a guided lab or open a tool.</p>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {live.map((lab) => (
              <li key={lab.id}>
                <Link to={`/labs/${lab.id}`} className="card block h-full p-5 transition hover:-translate-y-0.5 hover:border-brand/50">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip !border-ok/40 !bg-ok/10 !text-ok">Guided lab {lab.number}</span>
                    <DomainChip id={lab.domain} />
                  </div>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight">{lab.title}</h3>
                  {lab.course && <p className="text-xs text-muted">{lab.course}</p>}
                  <p className="mt-2 text-sm text-muted">{lab.subtitle}</p>
                  <p className="mt-3 text-xs text-muted">{lab.steps.length} steps · ~{labMinutes(lab)} min</p>
                  <span className="mt-3 inline-block text-sm font-semibold text-brand">Start lab →</span>
                </Link>
              </li>
            ))}
            {TOOLS.map((t) => (
              <li key={t.id}>
                <Link to={t.path} className="card block h-full p-5 transition hover:-translate-y-0.5 hover:border-brand/50">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip !border-ok/40 !bg-ok/10 !text-ok">Interactive tool</span>
                    <DomainChip id={t.domain} />
                  </div>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight">{t.title}</h3>
                  <p className="mt-2 text-sm text-muted">{t.tagline}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">{t.tags.map((x) => <span key={x} className="chip">{x}</span>)}</div>
                  <span className="mt-3 inline-block text-sm font-semibold text-brand">Launch →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6" aria-labelledby="next-title">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="next-title" className="text-2xl font-bold tracking-tight">Coming next</h2>
            <p className="mt-1 text-sm text-muted">Planned projects across the domains. New labs appear here and in the Labs menu as they are added.</p>
          </div>
          <Link to="/labs?status=planned" className="shrink-0 text-sm font-semibold text-brand hover:underline">All planned →</Link>
        </div>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {planned.map((lab) => (
            <li key={lab.id} className="card border-dashed p-5 opacity-80" aria-disabled="true">
              <div className="flex items-center gap-2"><span className="chip">Lab {lab.number} · planned</span><DomainChip id={lab.domain} /></div>
              <h3 className="mt-3 font-semibold leading-snug tracking-tight">{lab.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{lab.subtitle}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-line bg-surface/50">
        <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight">Why it's different</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRINCIPLES.map((p) => (
              <li key={p.t} className="rounded-2xl border border-line bg-surface p-5">
                <h3 className="font-semibold">{p.t}</h3>
                <p className="mt-1.5 text-sm text-muted">{p.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="card p-5"><span className="font-mono text-sm text-brand">0{i + 1}</span><h3 className="mt-1 font-semibold">{t}</h3><p className="mt-1 text-sm text-muted">{d}</p></li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-line py-8 text-center text-xs text-muted">
        AI Lab · Machine Learning · Deep Learning · NLP · React · TypeScript · FastAPI · NumPy · MIT License
      </footer>
    </div>
  );
}
