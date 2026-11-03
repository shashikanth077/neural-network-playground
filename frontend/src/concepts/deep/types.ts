import type { ComponentType } from "react";

/** One string in three languages: [English, Kannada, Lithuanian]. Placeholders like {n} must match. */
export type T3 = [en: string, kn: string, lt: string];

/** A real-world use of the concept in one domain (finance, health, retail ...). */
export interface RealUse {
  domain: T3;
  example: T3;
}

/** One step of a worked example: a sentence, and optionally the calculation in mono type (not translated). */
export interface WorkedStep {
  title: T3;
  body: T3;
  /** The arithmetic of this step, e.g. "z = 0.8 × 0.5 + 0.9 × 0.4 + 0.1 = 0.86". Numbers and symbols only. */
  calc?: string;
}

export interface DeepQuestion {
  q: T3;
  options: T3[];
  /** Index of the single correct option. */
  correct: number;
  why: T3;
  /** Numerical proof that the correct option is right; run by the tests. */
  verify?: () => boolean;
}

/**
 * A deep dive turns a concept page into a full lesson: a real-world story, a worked example with every
 * calculation, a live lab, Python code, real-world uses, common mistakes and a quiz. Every number shown
 * must be computed or checked by a test; nothing invented.
 */
export interface DeepDive {
  /** Must equal a concept id in `concepts/registry.ts`. */
  id: string;
  /** The running real-world story the whole page follows (e.g. a university predicting pass/fail). */
  story: { title: T3; body: T3[] };
  /** Analogy that makes the idea stick. */
  analogy?: T3;
  /** Worked example: every step with its numbers. */
  worked?: { title: T3; intro: T3; steps: WorkedStep[]; result: T3 };
  /** Interactive lab rendered in the page (lazy-loaded with the deep dive). */
  Lab?: ComponentType;
  labTitle?: T3;
  /** Python (NumPy / Keras) code that reproduces the worked example. Not translated. */
  code?: { title: T3; source: string; output?: string };
  /** At least three domains. */
  uses: RealUse[];
  mistakes: T3[];
  quiz: DeepQuestion[];
  /** Where the material comes from (lecture, uploaded guide, paper). Shown small at the bottom. */
  sources?: T3;
}
