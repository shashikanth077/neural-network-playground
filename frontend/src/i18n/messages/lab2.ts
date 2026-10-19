import { guideRows } from "../../labs/lab2/content/guides";
import { prose1 } from "../../labs/lab2/content/prose1";
import { prose2 } from "../../labs/lab2/content/prose2";
import { build } from "./common";

/**
 * Lab 2 messages: step titles/summaries (`step.lab2.*`), the lab title (`lab.lab2.*`), the step guides (`lab2.g.*`)
 * and all prose and labels of the 13 steps (`lab2.*`). The content lives in `labs/lab2/content/`, English first.
 */
export const lab2 = build([...prose1, ...prose2, ...guideRows()]);
