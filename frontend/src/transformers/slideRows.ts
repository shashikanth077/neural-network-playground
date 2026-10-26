import type { Row } from "../labs/lab3/content/types";
import { rowsDeck } from "./slides/rowsDeck";
import { rowsNotes } from "./slides/rowsNotes";
import { rowsUi } from "./slides/rowsUi";

/** Rows of the presentation view, keys `ts.*` (slide text, speaker notes, viewer interface). Owned by the slides worker. */
export const slideRows: Row[] = [...rowsDeck, ...rowsNotes, ...rowsUi];
