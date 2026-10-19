import type { Evidence } from "./types";

/** Where an evidence item leads (a route plus optional hash/query). */
export function evidenceHref(e: Evidence): string {
  switch (e.kind) {
    case "learn": return `/playground?topic=${e.topic}#learn`;
    case "playground": return `/playground#section-${e.section}`;
    case "experiment": return "/playground#section-experiments";
    case "lab": return `/labs/${e.lab}/${e.step}`;
    case "tool": return e.id === "playground" ? "/playground" : `/tools/${e.id}`;
    case "sheet": return `/cheatsheets/${e.sheet}#${e.section}`;
  }
}

export const evidenceKindLabel: Record<Evidence["kind"], string> = {
  learn: "Learning Center topic",
  playground: "Playground",
  experiment: "Guided experiment",
  lab: "Lab step",
  tool: "Tool",
  sheet: "Cheatsheet",
};

/** Hands-on evidence is something you can operate; a cheatsheet is reference only. */
export const isHandsOn = (e: Evidence) => e.kind !== "sheet";
