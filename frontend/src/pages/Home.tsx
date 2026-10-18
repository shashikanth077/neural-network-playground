import { Link } from "react-router-dom";
import { HeroArt } from "../components/HeroArt";
import { FEATURES } from "../lib/features";

const PILLARS = [
  { t: "Real training, no mock data", d: "Every loss value, weight and boundary comes from an actual NumPy network training on the server." },
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
              AI Lab is a growing collection of hands-on, visual tools that teach how machine-learning models really work. Start with the Neural Network Playground, with more labs on the way.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/playground" className="btn-primary !px-5 !py-2.5 !text-base">Open the Playground →</Link>
              <a href="#labs" className="btn-ghost !px-5 !py-2.5 !text-base">Browse labs</a>
            </div>
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {[["4", "datasets + custom"], ["0–5", "hidden layers"], ["SGD · Adam", "optimizers"]].map(([a, b]) => (
                <div key={b}><dt className="font-mono text-lg font-semibold">{a}</dt><dd className="text-muted">{b}</dd></div>
              ))}
            </dl>
          </div>
          <div className="card p-4"><HeroArt /></div>
        </div>
      </section>

      <section id="labs" className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6" aria-labelledby="labs-title">
        <h2 id="labs-title" className="text-2xl font-bold tracking-tight">Labs</h2>
        <p className="mt-1 text-sm text-muted">One platform, many ways to build intuition.</p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const live = f.status === "live" && f.path;
            const body = (
              <>
                <div className="flex items-center justify-between">
                  <span className={`chip ${live ? "!border-ok/40 !bg-ok/10 !text-ok" : ""}`}>{live ? "Live" : "Roadmap"}</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{f.tagline}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">{f.tags.map((t) => <span key={t} className="chip">{t}</span>)}</div>
                {live && <span className="mt-4 inline-block text-sm font-semibold text-brand">Launch →</span>}
              </>
            );
            return (
              <li key={f.id} className={live ? "sm:col-span-2 lg:col-span-1" : ""}>
                {live ? (
                  <Link to={f.path!} className="card block h-full p-5 transition hover:-translate-y-0.5 hover:border-brand/50">{body}</Link>
                ) : (
                  <div className="card h-full border-dashed p-5 opacity-75" aria-disabled="true">{body}</div>
                )}
              </li>
            );
          })}
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
        <h2 className="text-2xl font-bold tracking-tight">How a session works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {[["Choose data", "Generate XOR, moons, circles or linear data, or click your own points."], ["Design the network", "Set layers, neurons, activation, initialization, optimizer and learning rate."], ["Train and observe", "Pause, resume and reset while charts and the boundary update from the live model."]].map(([t, d], i) => (
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
