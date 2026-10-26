import { build } from "./common";

/** Messages of the paper page (`tp.*`) and the presentation view (`ts.*`). Each worker owns its own rows file. */
import { paperRows } from "../../transformers/paperRows";
import { slideRows } from "../../transformers/slideRows";

export const tpaper = build([...paperRows, ...slideRows]);
