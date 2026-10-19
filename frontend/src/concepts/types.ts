/** A piece of evidence that a concept is covered somewhere in the app. Links are checked by tests. */
export type Evidence =
  /** A Learning Center topic in the Playground (shows live numbers from your own run). */
  | { kind: "learn"; topic: string }
  /** A section of the Playground you can operate (the anchor must exist on the page). */
  | { kind: "playground"; section: PlaygroundSection; note: string }
  /** A guided experiment in the Playground (one-click setup of the comparison). */
  | { kind: "experiment"; id: string }
  /** A step of a guided lab. */
  | { kind: "lab"; lab: string; step: string }
  /** A stand-alone interactive tool. */
  | { kind: "tool"; id: string }
  /** A whole page of the app (for example My runs). The path must be a real route. */
  | { kind: "page"; to: string; title: string }
  /** A section of a cheatsheet (reference only, not interactive). */
  | { kind: "sheet"; sheet: string; section: string };

export type PlaygroundSection = "data" | "design" | "train" | "boundary" | "network" | "eval" | "charts" | "cv" | "experiments" | "learn";

export type Level = "beginner" | "intermediate" | "advanced";

export interface Concept {
  id: string;
  area: AreaId;
  level: Level;
  title: string;
  /** One or two plain sentences: what it is. */
  summary: string;
  /** Why it matters in practice. */
  why: string;
  /** A concrete thing to do with the live example. */
  tryIt: string;
  /** Concept ids to understand first. */
  needs: string[];
  /** Where it is covered. Empty = planned. */
  evidence: Evidence[];
  /** For planned concepts: what the interactive example would be. */
  plan?: string;
}

export type AreaId = "data" | "core" | "training" | "generalisation" | "vision" | "sequences" | "advanced" | "engineering";

export interface Area {
  id: AreaId;
  title: string;
  blurb: string;
  glyph: string;
}
