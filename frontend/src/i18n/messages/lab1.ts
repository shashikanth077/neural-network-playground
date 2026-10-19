import { guideRows } from "../../labs/lab1/content/guides";
import { s00 } from "../../labs/lab1/content/s00";
import { s01 } from "../../labs/lab1/content/s01";
import { s03 } from "../../labs/lab1/content/s03";
import { s04 } from "../../labs/lab1/content/s04";
import { s05 } from "../../labs/lab1/content/s05";
import { s06 } from "../../labs/lab1/content/s06";
import { s07 } from "../../labs/lab1/content/s07";
import { s08 } from "../../labs/lab1/content/s08";
import { s09 } from "../../labs/lab1/content/s09";
import { s10 } from "../../labs/lab1/content/s10";
import { s11 } from "../../labs/lab1/content/s11";
import { build } from "./common";

/**
 * Lab 1 messages: step titles/summaries (`step.lab1.*`), the pipeline map, the step guides and all prose of the
 * 13 steps (`lab1.*`). The content lives in `labs/lab1/content/`, one file per step, English first.
 */
export const lab1 = build([...s00, ...s01, ...s03, ...s04, ...s05, ...s06, ...s07, ...s08, ...s09, ...s10, ...s11, ...guideRows()]);
