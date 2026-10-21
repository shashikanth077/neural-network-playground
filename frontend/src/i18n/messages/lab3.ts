import { guideRows } from "../../labs/lab3/content/guides";
import { proseA } from "../../labs/lab3/content/proseA";
import { proseB } from "../../labs/lab3/content/proseB";
import { uiRows } from "../../labs/lab3/content/ui";
import { build } from "./common";

/**
 * Lab 3 messages: the lab title (`lab.lab3.*`), step titles/summaries (`step.lab3.*`), the step guides (`lab3.g.*`),
 * the guide labels (`lab3.ui.*`) and all prose of the steps (`lab3.*`). Content lives in `labs/lab3/content/`, English first.
 */
export const lab3 = build([
  ...uiRows, ...proseA, ...proseB, ...guideRows(),
]);
