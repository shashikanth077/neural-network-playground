import { Link } from "react-router-dom";
import { AREAS } from "../concepts/areas";
import { CONCEPTS, coverageOf } from "../concepts/registry";
import { useT } from "../i18n";
import { liveLabs, LABS } from "../labs/registry";
import { TOOLS } from "../lib/features";
import { ConceptMap } from "../home/ConceptMap";
import { ContinueCard, CoverageStrip, LabsAndTools, LayerCards, LearningPaths } from "../home/HomeSections";

export function Home() {
  const t = useT();
  const areaCount = AREAS.filter((a) => CONCEPTS.some((c) => c.area === a.id)).length;
  const stats: [number, string][] = [
    [CONCEPTS.length, "homev2.stat.concepts"],
    [areaCount, "homev2.stat.areas"],
    [CONCEPTS.filter((c) => coverageOf(c) === "live").length, "homev2.stat.live"],
    [liveLabs().length || LABS.length, "homev2.stat.labs"],
    [TOOLS.length, "homev2.stat.tools"],
  ];

  return (
    <main>
      <section className="home-hero relative overflow-hidden border-b border-line" aria-labelledby="home-title">
        <div aria-hidden className="home-hero-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-[1200px] px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:pt-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1 font-mono text-xs font-medium text-brand">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ok" />
            {t("homev2.hero.eyebrow")}
          </p>
          <h1 id="home-title" className="mt-5 max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {t("homev2.hero.title.a")} <span className="home-gradient-text">{t("homev2.hero.title.b")}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{t("homev2.hero.intro")}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/concepts" className="btn-primary !px-5 !py-2.5 !text-base">{t("homev2.hero.cta.concepts")}</Link>
            <Link to="/labs" className="btn-ghost !px-5 !py-2.5 !text-base">{t("homev2.hero.cta.labs")}</Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-9 gap-y-3" data-testid="hero-stats">
            {stats.map(([n, key]) => (
              <li key={key}>
                <span className="block font-mono text-2xl font-semibold tracking-tight">{n}</span>
                <span className="text-sm text-muted">{t(key)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10"><ConceptMap /></div>
        </div>
      </section>

      <ContinueCard />
      <LayerCards />
      <LearningPaths />
      <CoverageStrip />
      <LabsAndTools />

      <footer className="border-t border-line py-8 text-center text-xs text-muted">
        AI Lab · Machine Learning · Deep Learning · NLP · React · TypeScript · FastAPI · NumPy · MIT License
      </footer>
    </main>
  );
}
