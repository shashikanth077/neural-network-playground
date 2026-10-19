import { build } from "./common";
import { exp } from "./pg/exp";
import { help1 } from "./pg/help1";
import { help2 } from "./pg/help2";
import { learn } from "./pg/learn";
import { lw } from "./pg/lw";
import { opts } from "./pg/opts";
import { presets } from "./pg/presets";
import { ui1 } from "./pg/ui1";
import { ui2 } from "./pg/ui2";

/**
 * Playground catalogue (every key starts with `pg.`). The rows are split over several files so that each stays
 * readable; each row is `[key, English, Kannada, Lithuanian]`.
 */
export const playground = build([...ui1, ...ui2, ...opts, ...lw, ...presets, ...exp, ...help1, ...help2, ...learn]);
