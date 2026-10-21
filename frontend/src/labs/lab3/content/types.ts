/** A message row: [key, English, Kannada, Lithuanian]. English is the source text. */
export type Row = [key: string, en: string, kn: string, lt: string];
/** One string in three languages: [English, Kannada, Lithuanian]. */
export type T3 = [en: string, kn: string, lt: string];

export interface QuestionDef {
  q: T3;
  options: T3[];
  /** Index into `options` of the single correct answer. */
  correct: number;
  /** Why the correct answer is right (shown after any answer). */
  why: T3;
  /** Numerical proof, run by the tests: true when the correct option agrees with the lab's maths or recorded numbers. */
  verify?: () => boolean;
}

export interface GuideDef {
  goal: T3;
  fit: T3;
  keywords: [term: T3, meaning: T3][];
  tasks: T3[];
  questions: QuestionDef[];
  takeaways: T3[];
  mistakes: T3[];
}
