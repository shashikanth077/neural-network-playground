import { guides1 } from "../theory/guides/g1";
import { guides2 } from "../theory/guides/g2";
import type { GuideDef } from "./types";

/** Step guides of the theory steps (overview ... training). Written in theory/guides/. */
export const guidesA: Record<string, GuideDef> = { ...guides1, ...guides2 };
