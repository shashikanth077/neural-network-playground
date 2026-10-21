import { rowsBaselines } from "../experiment/rows/rowsBaselines";
import { rowsCode } from "../experiment/rows/rowsCode";
import { rowsCostEff } from "../experiment/rows/rowsCostEff";
import { rowsDesign } from "../experiment/rows/rowsDesign";
import { rowsErrDecide } from "../experiment/rows/rowsErrDecide";
import { rowsResults } from "../experiment/rows/rowsResults";
import { rowsShared } from "../experiment/rows/rowsShared";
import type { Row } from "./types";

/**
 * Prose, labels and step titles of the experiment steps (keys `lab3.e.*`, `step.lab3.<id>.*` and `lab.group.Experiment`).
 * The rows live next to the step components in `experiment/rows/`, one file per step group.
 * The Kannada and Lithuanian texts have not been reviewed by a native speaker.
 */
export const proseB: Row[] = [
  ...rowsShared, ...rowsBaselines, ...rowsDesign, ...rowsResults, ...rowsCostEff, ...rowsErrDecide, ...rowsCode,
];
