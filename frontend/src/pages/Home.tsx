import { Link } from "react-router-dom";
import { HeroArt } from "../components/HeroArt";
import { TOOLS } from "../lib/features";
import { labMinutes, LABS } from "../labs/registry";

const PILLARS = [
  { t: "Real calculations, no mock data", d: "Every demo runs the real maths: lab numbers are checked by tests, and Playground training happens in a NumPy network on the server." },
  { t: "See inside the model", d: "Hover neurons and connections, watch activations light up and the decision boundary bend as epochs pass." },
  { t: "Learn the math as you go", d: "Formulas for forward pass, backprop and optimizers are tied to the numbers of your current experiment." },
  { t: "Cloud-ready by design", d: "Stateless React front-end, containerised FastAPI back-end, session cleanup and health checks for AWS." },
];

export function Home() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-line">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-70"
          style={{ background: "radial-gradient(60% 50% at 80% 0%, rgb(var(--brand) / .16), transparent), radial-gradient(40% 40% at 0% 100%, rgb(var(--pos) / .10), transparent)" }} />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr_.9fr] md:py-20">
          <div>
            <span className="chip !text-brand">Interactive AI learning platform</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
              Understand AI by <span className="text-brand">building</span> it, one experiment at a time.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              AI Lab is a growing platform of guided labs and interactive tools that teach how machine-learning systems really work. Start Lab 1, or jump straight into the Neural Network Playground.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/labs/lab1" className="btn-primary !px-5 !py-2.5 !text-base">Start Lab 1 →</Link>
              <Link to="/playground" className="btn-ghost !px-5 !py-2.5 !text-base">Open the Playground</Link>
            </div>
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {[["1", "guided lab live"], ["13", "step-by-step lessons"], ["9", "interactive demos"]].map(([a, b]) => (
                <div key={b}><dt className="font-mono text-lg font-semibold">{a}</dt><dd className="text-muted">{b}</dd></div>
              ))}
            </dl>
          </div>
          <div className="card p-4"><HeroArt /></div>
        </div>
      </section>

      <section id="labs" className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6" aria-labelledby="labs-title">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="labs-title" className="text-2xl font-bold tracking-tight">Guided labs</h2>
            <p className="mt-1 text-sm text-muted">Step-by-step paths with live demos. Progress is saved in your browser.</p>
          </div>
          <Link to="/labs" className="text-sm font-semibold text-brand hover:underline">All labs →</Link>
        </div>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LABS.map((lab) => {
            const live = lab.status === "live";
            const body = (
              <>
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand/10 font-mono font-bold text-brand">{lab.number}</span>
                  <span className={`chip ${live ? "!border-ok/40 !bg-ok/10 !text-ok" : ""}`}>{live ? "Available" : "Planned"}</span>
                </div>
                <h3 className="mt-3 text-base font-semibold leading-snug tracking-tight">{lab.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{lab.subtitle}</p>
                {live && <p className="mt-3 text-xs text-muted">{lab.steps.length} steps · ~{labMinutes(lab)} min</p>}
                {live && <span className="mt-3 inline-block text-sm font-semibold text-brand">Start →</span>}
              </>
            );
            return (
              <li key={lab.id}>
                {live ? (
                  <Link to={`/labs/${lab.id}`} className="card block h-full p-5 transition hover:-translate-y-0.5 hover:border-brand/50">{body}</Link>
                ) : (
                  <div className="card h-full border-dashed p-5 opacity-75" aria-disabled="true">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pb-14 sm:px-6" aria-labelledby="tools-title">
        <h2 id="tools-title" className="text-2xl font-bold tracking-tight">Interactive tools</h2>
        <p className="mt-1 text-sm text-muted">Open-ended sandboxes you can use on their own or alongside a lab.</p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {TOOLS.map((t) => (
            <li key={t.id}>
              <Link to={t.path} className="card block h-full p-5 transition hover:-translate-y-0.5 hover:border-brand/50">
                <span className="chip !border-ok/40 !bg-ok/10 !text-ok">Live</span>
                <h3 className="mt-3 text-lg font-semibold tracking-tight">{t.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{t.tagline}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">{t.tags.map((x) => <span key={x} className="chip">{x}</span>)}</div>
                <span className="mt-4 inline-block text-sm font-semibold text-brand">Launch →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-line bg-surface/50">
        <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight">Why it's different</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <li key={p.t} className="rounded-2xl border border-line bg-surface p-5">
                <h3 className="font-semibold">{p.t}</h3>
                <p className="mt-1.5 text-sm text-muted">{p.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight">How a lab works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {[["Pick a lab", "Choose a guided lab from the Labs menu and follow its steps in order."], ["Play with each concept", "Drag sliders, switch methods and watch the numbers and pictures respond."], ["Track your progress", "Mark steps complete; the platform remembers where you stopped."]].map(([t, d], i) => (
            <li key={t} className="card p-5"><span className="font-mono text-sm text-brand">0{i + 1}</span><h3 className="mt-1 font-semibold">{t}</h3><p className="mt-1 text-sm text-muted">{d}</p></li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-line py-8 text-center text-xs text-muted">
        AI Lab · React · TypeScript · FastAPI · NumPy · MIT License
      </footer>
    </div>
  );
}
