import { readProgress } from "../labs/progress";
import type { Lab } from "../labs/types";

export interface ContinueItem { lab: Lab; stepId: string; done: number; total: number; percent: number }

/** Labs the learner has started, with the step to resume at. Safe when storage is unavailable (readProgress catches). */
export function continueItems(labs: Lab[]): ContinueItem[] {
  const out: ContinueItem[] = [];
  for (const lab of labs) {
    if (lab.status !== "live" || lab.steps.length === 0) continue;
    const ids = lab.steps.map((s) => s.id);
    const p = readProgress(lab.id, ids);
    const last = p.last && ids.includes(p.last) ? p.last : undefined;
    if (p.done === 0 && !last) continue;
    out.push({ lab, stepId: last ?? ids[0], done: p.done, total: p.total, percent: p.percent });
  }
  return out;
}
