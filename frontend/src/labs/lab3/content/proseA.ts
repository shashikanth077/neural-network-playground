import { proseAttention } from "../theory/prose/attention";
import { proseComplexity } from "../theory/prose/complexity";
import { proseEncoder } from "../theory/prose/encoder";
import { proseHeads } from "../theory/prose/heads";
import { proseHistory } from "../theory/prose/history";
import { proseOverview, proseShared } from "../theory/prose/overview";
import { prosePosition } from "../theory/prose/position";
import { proseTokens } from "../theory/prose/tokens";
import { proseTraining } from "../theory/prose/training";
import type { Row } from "./types";

/** Prose, labels and step titles of the theory steps (keys `lab3.t.*` and `step.lab3.<id>.*`). Written in theory/prose/. */
export const proseA: Row[] = [
  ...proseShared, ...proseOverview, ...proseHistory, ...proseTokens, ...prosePosition,
  ...proseAttention, ...proseHeads, ...proseEncoder, ...proseComplexity, ...proseTraining,
];
