import { useTx } from "../../labs/lab3/rich";
import { Fig3, Fig4, Fig5, Fig6, Fig7 } from "./charts";
import { SUBSET_SIZES } from "./data";
import { References } from "./layout";
import { Table6, Table7, Table8, Table9 } from "./tables";
import { Figure, Heading, Items, LiveStep, Note, Para, Plain, Section, StepChip } from "./ui";

/** 3.1 Implementation of the program (plus the note on recorded results). */
export function SecImplementation() {
  const tx = useTx();
  return (
    <Section id="implementation">
      <Heading top id="implementation" level={3} num="3.1" title={tx("tp.sec.implementation")} />
      <Note tone="ok">{tx("tp.res.note")}</Note>
      <div className="mt-3 space-y-3">
        <Para k="tp.impl.p1" />
        <Para k="tp.impl.p2" />
      </div>
      <Plain k="tp.impl.plain" />
      <p className="my-2 flex flex-wrap items-center gap-2 text-xs text-muted"><span>{tx("tp.step.also")}</span><StepChip stepId="code" /></p>
    </Section>
  );
}

/** 3.2 Overall comparison: Table 6, Fig. 3, Table 7. */
export function SecOverall() {
  const tx = useTx();
  return (
    <Section id="results-overall">
      <Heading top id="results-overall" level={3} num="3.2" title={tx("tp.sec.results-overall")} />
      <Para k="tp.res.p1" className="mt-3" />
      <Table6 />
      <Figure n={3} caption={tx("tp.f3.cap")}><Fig3 /></Figure>
      <Para k="tp.res.p2" />
      <Para k="tp.res.p3" className="mt-3" />
      <Table7 />
      <Para k="tp.res.p4" />
      <Plain k="tp.res.plain" />
      <LiveStep stepId="results" />
    </Section>
  );
}

/** 3.3 Cost: Fig. 4. */
export function SecCost() {
  const tx = useTx();
  return (
    <Section id="results-cost">
      <Heading top id="results-cost" level={3} num="3.3" title={tx("tp.sec.results-cost")} />
      <Para k="tp.cost.p1" className="mt-3" />
      <Figure n={4} caption={tx("tp.f4.cap")}><Fig4 /></Figure>
      <Para k="tp.cost.p2" />
      <Plain k="tp.cost.plain" />
      <LiveStep stepId="cost" />
    </Section>
  );
}

/** 3.4 Data efficiency: Table 8, Fig. 5. */
export function SecData() {
  const tx = useTx();
  return (
    <Section id="results-data">
      <Heading top id="results-data" level={3} num="3.4" title={tx("tp.sec.results-data")} />
      <Para k="tp.lc.p1" className="mt-3" />
      <Table8 />
      <Figure n={5} caption={tx("tp.f5.cap")}><Fig5 /></Figure>
      <Para k="tp.lc.p2" />
      <Plain k="tp.lc.plain" />
      <LiveStep stepId="efficiency" />
    </Section>
  );
}

/** 3.5 Ready-made and zero-shot models. */
export function SecReady() {
  const tx = useTx();
  return (
    <Section id="results-ready">
      <Heading top id="results-ready" level={3} num="3.5" title={tx("tp.sec.results-ready")} />
      <Para k="tp.rm.p" className="mt-3" />
      <Plain k="tp.rm.plain" />
      <LiveStep stepId="readymade" />
    </Section>
  );
}

/** 3.6 Error analysis: Table 9, Figs 6 and 7, examples, the sentence lab. */
export function SecErrors() {
  const tx = useTx();
  return (
    <Section id="results-errors">
      <Heading top id="results-errors" level={3} num="3.6" title={tx("tp.sec.results-errors")} />
      <Para k="tp.err.p1" vars={{ neg: SUBSET_SIZES.negation, con: SUBSET_SIZES.contrast }} className="mt-3" />
      <Table9 />
      <Figure n={6} caption={tx("tp.f6.cap")}><Fig6 /></Figure>
      <Para k="tp.err.p2" />
      <Para k="tp.err.p3" className="mt-3" />
      <Figure n={7} caption={tx("tp.f7.cap")}><Fig7 /></Figure>
      <Para k="tp.err.p4" />
      <Plain k="tp.err.plain" />
      <LiveStep stepId="errors" />
    </Section>
  );
}

/** 3.7 Comparison with previous research. */
export function SecPrev() {
  const tx = useTx();
  return (
    <Section id="results-prev">
      <Heading top id="results-prev" level={3} num="3.7" title={tx("tp.sec.results-prev")} />
      <Para k="tp.prev.p" className="mt-3" />
      <Plain k="tp.prev.plain" />
    </Section>
  );
}

/** Conclusions and practical recommendations, with the decision helper. */
export function SecConclusions() {
  const tx = useTx();
  return (
    <Section id="conclusions">
      <Heading top id="conclusions" level={2} title={tx("tp.sec.conclusions")} />
      <div className="mt-4 space-y-3">
        <Para k="tp.concl.p1" />
        <Para k="tp.concl.p2" />
        <Para k="tp.concl.p3" />
        <Para k="tp.concl.p4" />
        <Para k="tp.concl.p5" />
        <Para k="tp.concl.recLead" className="!mb-0" />
        <Items ordered keys={["tp.concl.rec1", "tp.concl.rec2", "tp.concl.rec3", "tp.concl.rec4"]} label={tx("tp.sub.conclusions.rec")} />
        <Para k="tp.concl.next" />
      </div>
      <Plain k="tp.concl.plain" />
      <LiveStep stepId="decide" />
    </Section>
  );
}

/** References with the in-page filter. */
export function SecReferences() {
  const tx = useTx();
  return (
    <Section id="references">
      <Heading top id="references" level={2} title={tx("tp.sec.references")} />
      <div className="mt-4"><References /></div>
    </Section>
  );
}
