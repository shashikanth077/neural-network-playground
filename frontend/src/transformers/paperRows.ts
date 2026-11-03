import type { Row } from "../labs/lab3/content/types";
import { rowsArch } from "./paper/rowsArch";
import { rowsIntro } from "./paper/rowsIntro";
import { rowsMethod } from "./paper/rowsMethod";
import { rowsResults } from "./paper/rowsResults";
import { rowsUi } from "./paper/rowsUi";

/** Rows of the paper page, keys `tp.*`. Owned by the paper-page worker; split by part of the paper under `paper/`. */
export const paperRows: Row[] = [...rowsUi, ...rowsIntro, ...rowsMethod, ...rowsArch, ...rowsResults];
