import type { build } from "../common";

/** One catalogue row: `[key, English, Kannada, Lithuanian]`. */
export type Rows = Parameters<typeof build>[0];
