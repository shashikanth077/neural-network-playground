import { guidesA } from "./guidesA";
import { guidesB } from "./guidesB";
import type { GuideDef, Row } from "./types";

/** The step guide of every Lab 3 step, keyed by step id. Theory steps live in guidesA, experiment steps in guidesB. */
export const GUIDES: Record<string, GuideDef> = { ...guidesA, ...guidesB };

/** Flatten every guide into message rows (`lab3.g.<step>.<part>`), the keys the StepGuide component reads. */
export function guideRows(): Row[] {
  const rows: Row[] = [];
  const add = (key: string, t: [string, string, string]) => rows.push([key, t[0], t[1], t[2]]);
  for (const [id, g] of Object.entries(GUIDES)) {
    const k = (s: string) => `lab3.g.${id}.${s}`;
    add(k("goal"), g.goal);
    add(k("fit"), g.fit);
    g.keywords.forEach(([term, meaning], i) => { add(k(`kw${i}.t`), term); add(k(`kw${i}.d`), meaning); });
    g.tasks.forEach((t, i) => add(k(`do${i}`), t));
    g.questions.forEach((q, i) => {
      add(k(`q${i}.q`), q.q);
      q.options.forEach((o, j) => add(k(`q${i}.o${j}`), o));
      add(k(`q${i}.e`), q.why);
    });
    g.takeaways.forEach((t, i) => add(k(`take${i}`), t));
    g.mistakes.forEach((t, i) => add(k(`mist${i}`), t));
  }
  return rows;
}
