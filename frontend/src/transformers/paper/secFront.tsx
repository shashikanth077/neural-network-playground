import { useTx } from "../../labs/lab3/rich";
import { Figure, Heading, Items, LiveStep, Para, Plain, Section, StepChip } from "./ui";
import { Table1, Table2, Table3, Table4 } from "./tables";
import { Fig1 } from "./diagrams";

/** Introduction (unnumbered) with Table 1. */
export function SecIntro() {
  const tx = useTx();
  return (
    <Section id="intro">
      <Heading top id="intro" level={2} title={tx("tp.sec.intro")} />
      <div className="mt-4 space-y-3">
        <Para k="tp.intro.rel1" />
        <Para k="tp.intro.rel2" />
        <Para k="tp.intro.rel3" />
        <Para k="tp.intro.problem" />
        <Para k="tp.intro.object" />
        <Para k="tp.intro.aim" />
        <Para k="tp.intro.objLead" className="!mb-0" />
        <Items ordered keys={["tp.intro.obj1", "tp.intro.obj2", "tp.intro.obj3", "tp.intro.obj4", "tp.intro.obj5"]} label={tx("tp.intro.objLead")} />
        <Para k="tp.intro.methods" />
        <Para k="tp.intro.structure" />
        <Para k="tp.intro.distribution" />
      </div>
      <Table1 />
      <Plain k="tp.intro.plain" />
    </Section>
  );
}

const QUERY = "(“transformer” OR “BERT” OR “self-attention” OR “pre-trained language model”) AND (“natural language processing” OR “text classification” OR “sentiment analysis”)";

/** Chapter 1: literature review (1.1–1.7) with Table 2. */
export function SecReview() {
  const tx = useTx();
  return (
    <Section id="review">
      <Heading top id="review" level={2} num="1" title={tx("tp.sec.review")} />
      <Para k="tp.rev.lead" className="mt-3" />

      <div className="mt-6 space-y-3">
        <Heading id="review-search" level={3} num="1.1" title={tx("tp.sub.rev.search")} />
        <Para k="tp.rev.search.p1" />
        <figure className="my-2">
          <pre lang="en" className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-line bg-raised px-3 py-2 font-mono text-xs leading-relaxed" data-testid="search-query">{QUERY}</pre>
          <figcaption className="mt-1 text-xs text-muted">{tx("tp.rev.search.qnote")}</figcaption>
        </figure>
        <Para k="tp.rev.search.p2" />
        <Items keys={["tp.rev.search.c1", "tp.rev.search.c2", "tp.rev.search.c3"]} />
        <Para k="tp.rev.search.p3" />
      </div>

      <div className="mt-8 space-y-3">
        <Heading id="review-history" level={3} num="1.2" title={tx("tp.sub.rev.hist")} />
        <Para k="tp.rev.hist.p1" />
        <Para k="tp.rev.hist.p2" />
      </div>
      <div className="mt-8 space-y-3">
        <Heading id="review-families" level={3} num="1.3" title={tx("tp.sub.rev.fam")} />
        <Para k="tp.rev.fam.lead" />
        <Para k="tp.rev.fam.enc" />
        <Para k="tp.rev.fam.compact" />
        <Para k="tp.rev.fam.dec" />
      </div>
      <LiveStep stepId="history" />
      <Plain k="tp.rev.plain1" />

      <div className="mt-8 space-y-3">
        <Heading id="review-sentiment" level={3} num="1.4" title={tx("tp.sub.rev.sent")} />
        <Para k="tp.rev.sent.p1" />
        <Para k="tp.rev.sent.p2" />
        <Para k="tp.rev.sent.p3" />
      </div>
      <div className="mt-8 space-y-3">
        <Heading id="review-lithuania" level={3} num="1.5" title={tx("tp.sub.rev.lt")} />
        <Para k="tp.rev.lt.p1" />
        <Para k="tp.rev.lt.p2" />
      </div>
      <Plain k="tp.rev.plain2" />

      <div className="mt-8 space-y-3">
        <Heading id="review-summary" level={3} num="1.6" title={tx("tp.sub.rev.sum")} />
        <Para k="tp.rev.sum.lead" />
      </div>
      <Table2 />

      <div className="mt-8 space-y-3">
        <Heading id="review-conclusions" level={3} num="1.7" title={tx("tp.sub.rev.concl")} />
        <Para k="tp.rev.concl.lead" />
        <Items keys={["tp.rev.concl.1", "tp.rev.concl.2", "tp.rev.concl.3", "tp.rev.concl.4"]} ordered />
        <Para k="tp.rev.concl.last" />
      </div>
      <Plain k="tp.rev.plain3" />
    </Section>
  );
}

/** Chapter divider (not a section of the fixed list). */
export function ChapterHead({ n }: { n: 2 | 3 }) {
  const tx = useTx();
  return (
    <div id={`chapter-${n}`} className="tp-chapter scroll-mt-[var(--anchor-off,8rem)] border-t-2 border-brand/40 pt-8">
      <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl" data-chapter={n}>{tx(`tp.chapter.${n}`)}</h2>
      <p className="tp-p mt-2 text-muted">{tx(`tp.chapter.${n}.lead`)}</p>
    </div>
  );
}

/** 2.1 Problem formulation. */
export function SecProblem() {
  const tx = useTx();
  return (
    <Section id="problem">
      <Heading top id="problem" level={3} num="2.1" title={tx("tp.sec.problem")} />
      <div className="mt-3 space-y-3">
        <Para k="tp.prob.p1" />
        <Para k="tp.prob.p2" />
        <Para k="tp.prob.rqLead" />
        <ul className="my-3 space-y-1.5" aria-label={tx("tp.prob.rqLead")} data-testid="rq-list">
          {["tp.prob.rq1", "tp.prob.rq2", "tp.prob.rq3", "tp.prob.rq4", "tp.prob.rq5"].map((k) => <li key={k}><Para k={k} className="rounded-lg border border-line bg-raised/50 px-3 py-1.5" /></li>)}
        </ul>
      </div>
      <Plain k="tp.prob.plain" />
    </Section>
  );
}

/** 2.2 Dataset with Table 3 and the experiment-design step. */
export function SecDataset() {
  const tx = useTx();
  return (
    <Section id="dataset">
      <Heading top id="dataset" level={3} num="2.2" title={tx("tp.sec.dataset")} />
      <div className="mt-3 space-y-3">
        <Para k="tp.data.p1" />
      </div>
      <Table3 />
      <Para k="tp.data.p2" />
      <Plain k="tp.data.plain" />
      <LiveStep stepId="design" />
    </Section>
  );
}

/** 2.3 Competitors with Table 4. */
export function SecCompetitors() {
  const tx = useTx();
  return (
    <Section id="competitors">
      <Heading top id="competitors" level={3} num="2.3" title={tx("tp.sec.competitors")} />
      <Para k="tp.comp.lead" className="mt-3" />
      <Table4 />
      <Para k="tp.comp.p2" />
      <Plain k="tp.comp.plain" />
      <p className="my-2 flex flex-wrap items-center gap-2 text-xs text-muted"><span>{tx("tp.step.also")}</span><StepChip stepId="design" /><StepChip stepId="baselines" /><StepChip stepId="readymade" /></p>
    </Section>
  );
}

/** 2.4 Evaluation criteria. */
export function SecCriteria() {
  const tx = useTx();
  return (
    <Section id="criteria">
      <Heading top id="criteria" level={3} num="2.4" title={tx("tp.sec.criteria")} />
      <Para k="tp.crit.lead" className="mt-3" />
      <Items ordered keys={["tp.crit.c1", "tp.crit.c2", "tp.crit.c3", "tp.crit.c4", "tp.crit.c5", "tp.crit.c6"]} label={tx("tp.crit.lead")} />
      <Para k="tp.crit.stats" />
      <Para k="tp.crit.hw" className="mt-3" />
      <Plain k="tp.crit.plain" />
      <p className="my-2 flex flex-wrap items-center gap-2 text-xs text-muted"><span>{tx("tp.step.also")}</span><StepChip stepId="design" /></p>
    </Section>
  );
}

/** 2.5 Program design with Fig. 1 and the module list. */
export function SecProgram() {
  const tx = useTx();
  return (
    <Section id="program">
      <Heading top id="program" level={3} num="2.5" title={tx("tp.sec.program")} />
      <Para k="tp.prog.lead" className="mt-3" />
      <Figure n={1} caption={tx("tp.f1.cap")}><Fig1 /></Figure>
      <Para k="tp.prog.modules" className="!mb-0" />
      <Items keys={["tp.prog.m.utils", "tp.prog.m.01", "tp.prog.m.02", "tp.prog.m.03", "tp.prog.m.04", "tp.prog.m.05", "tp.prog.m.06", "tp.prog.m.07", "tp.prog.m.08"]} label={tx("tp.prog.modules")} />
      <Para k="tp.prog.result" />
      <Plain k="tp.prog.plain" />
      <p className="my-2 flex flex-wrap items-center gap-2 text-xs text-muted"><span>{tx("tp.step.also")}</span><StepChip stepId="code" /></p>
    </Section>
  );
}
