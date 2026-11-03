import { useTx } from "../../labs/lab3/rich";
import { Fig2 } from "./diagrams";
import { Table5 } from "./tables";
import { Eq, Figure, Heading, Items, LiveStep, Para, Plain, Section, StepChip } from "./ui";

/** 2.6 The Transformer architecture: Fig. 2 and six subsections, each with its live Lab 3 step. */
export function SecArchitecture() {
  const tx = useTx();
  return (
    <Section id="architecture">
      <Heading top id="architecture" level={3} num="2.6" title={tx("tp.sec.architecture")} />
      <Para k="tp.arch.lead" className="mt-3" />
      <Figure n={2} caption={tx("tp.f2.cap")}><Fig2 /></Figure>
      <Plain k="tp.arch.plain" />

      <div className="mt-8 space-y-3">
        <Heading id="arch-tokens" level={4} num="2.6.1" title={tx("tp.sub.arch.tokens")} />
        <Para k="tp.arch.tokens.p" />
      </div>
      <Plain k="tp.arch.tokens.plain" />
      <LiveStep stepId="tokens" />

      <div className="mt-8 space-y-3">
        <Heading id="arch-position" level={4} num="2.6.2" title={tx("tp.sub.arch.position")} />
        <Para k="tp.arch.pos.p1" />
        <Eq n={1} />
        <Para k="tp.arch.pos.p2" />
      </div>
      <Plain k="tp.arch.pos.plain" />
      <LiveStep stepId="position" />

      <div className="mt-8 space-y-3">
        <Heading id="arch-attention" level={4} num="2.6.3" title={tx("tp.sub.arch.attention")} />
        <Para k="tp.arch.att.p1" />
        <Eq n={2} />
        <Para k="tp.arch.att.p2" />
        <Eq n={3} />
        <Para k="tp.arch.att.p3" />
        <Eq n={4} />
        <Para k="tp.arch.att.p4" />
      </div>
      <Plain k="tp.arch.att.plain" />
      <LiveStep stepId="attention" />

      <div className="mt-8 space-y-3">
        <Heading id="arch-heads" level={4} num="2.6.4" title={tx("tp.sub.arch.heads")} />
        <Para k="tp.arch.heads.p1" />
        <Eq n={5} />
        <Para k="tp.arch.heads.p2" />
      </div>
      <Plain k="tp.arch.heads.plain" />
      <LiveStep stepId="heads" />

      <div className="mt-8 space-y-3">
        <Heading id="arch-ffn" level={4} num="2.6.5" title={tx("tp.sub.arch.ffn")} />
        <Para k="tp.arch.ffn.p1" />
        <Eq n={6} />
        <Para k="tp.arch.ffn.p2" />
        <Eq n={7} />
        <Eq n={8} />
        <Para k="tp.arch.ffn.p3" />
      </div>
      <Plain k="tp.arch.ffn.plain" />
      <LiveStep stepId="encoder" />

      <div className="mt-8 space-y-3">
        <Heading id="arch-complexity" level={4} num="2.6.6" title={tx("tp.sub.arch.cplx")} />
        <Para k="tp.arch.cplx.p" />
      </div>
      <Plain k="tp.arch.cplx.plain" />
      <LiveStep stepId="complexity" />
    </Section>
  );
}

/** 2.7 Mathematical methods of training and evaluation (eight subsections, Table 5, Formulas 9–20). */
export function SecMath() {
  const tx = useTx();
  return (
    <Section id="math">
      <Heading top id="math" level={3} num="2.7" title={tx("tp.sec.math")} />

      <div className="mt-6 space-y-3">
        <Heading id="math-pretrain" level={4} num="2.7.1" title={tx("tp.sub.math.pre")} />
        <Para k="tp.math.pre.p1" />
        <Eq n={9} />
        <Para k="tp.math.pre.p2" />
      </div>
      <div className="mt-8 space-y-3">
        <Heading id="math-finetune" level={4} num="2.7.2" title={tx("tp.sub.math.ft")} />
        <Para k="tp.math.ft.p1" />
        <Eq n={10} />
        <Para k="tp.math.ft.p2" />
        <Eq n={11} />
      </div>
      <div className="mt-8 space-y-3">
        <Heading id="math-optimisation" level={4} num="2.7.3" title={tx("tp.sub.math.opt")} />
        <Para k="tp.math.opt.p1" />
        <Eq n={12} />
        <Eq n={13} />
        <Para k="tp.math.opt.p2" />
      </div>
      <Table5 />
      <Plain k="tp.math.plain1" />
      <LiveStep stepId="training" />

      <div className="mt-8 space-y-3">
        <Heading id="math-tfidf" level={4} num="2.7.4" title={tx("tp.sub.math.tfidf")} />
        <Para k="tp.math.tfidf.p1" />
        <Eq n={14} />
        <Para k="tp.math.tfidf.p2" />
      </div>
      <div className="mt-8 space-y-3">
        <Heading id="math-classical" level={4} num="2.7.5" title={tx("tp.sub.math.cls")} />
        <Para k="tp.math.cls.nb" />
        <Para k="tp.math.cls.lr" />
        <Para k="tp.math.cls.svm1" />
        <Eq n={15} />
        <Para k="tp.math.cls.svm2" />
      </div>
      <div className="mt-8 space-y-3">
        <Heading id="math-lstm" level={4} num="2.7.6" title={tx("tp.sub.math.lstm")} />
        <Para k="tp.math.lstm.p1" />
        <Eq n={16} />
        <Eq n={17} />
        <Para k="tp.math.lstm.p2" />
      </div>
      <Plain k="tp.math.plain2" />
      <LiveStep stepId="baselines" />

      <div className="mt-8 space-y-3">
        <Heading id="math-nli" level={4} num="2.7.7" title={tx("tp.sub.math.nli")} />
        <Para k="tp.math.nli.p1" />
        <Eq n={18} />
        <Para k="tp.math.nli.p2" />
      </div>
      <Plain k="tp.math.nli.plain" />

      <div className="mt-8 space-y-3">
        <Heading id="math-metrics" level={4} num="2.7.8" title={tx("tp.sub.math.met")} />
        <Para k="tp.math.met.p1" />
        <Eq n={19} />
        <Eq n={20} />
        <Para k="tp.math.met.p2" />
        <Para k="tp.math.met.p3" />
      </div>
      <Plain k="tp.math.plain3" />
    </Section>
  );
}

/** 2.8 Experimental protocol and threats to validity. */
export function SecProtocol() {
  const tx = useTx();
  return (
    <Section id="protocol">
      <Heading top id="protocol" level={3} num="2.8" title={tx("tp.sec.protocol")} />
      <Para k="tp.prot.p1" className="mt-3" />
      <Items ordered keys={["tp.prot.s1", "tp.prot.s2", "tp.prot.s3", "tp.prot.s4", "tp.prot.s5"]} label={tx("tp.prot.p1")} />
      <Para k="tp.prot.threats" />
      <Items keys={["tp.prot.t1", "tp.prot.t2", "tp.prot.t3", "tp.prot.t4"]} label={tx("tp.prot.threats")} />
      <Plain k="tp.prot.plain" />
      <p className="my-2 flex flex-wrap items-center gap-2 text-xs text-muted"><span>{tx("tp.step.also")}</span><StepChip stepId="design" /></p>
    </Section>
  );
}
