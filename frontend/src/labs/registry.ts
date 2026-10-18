import { DOMAINS, type DomainId } from "./domains";
import { lab1 } from "./lab1";
import type { Lab } from "./types";
import { TOOLS } from "../lib/features";

const planned = (number: number, id: string, domain: DomainId, title: string, subtitle: string, tags: string[]): Lab => ({
  id, number, domain, title, subtitle, status: "planned", tags, steps: [],
});

/**
 * Every lab on the platform. To add one: create `labs/<name>/index.ts` exporting a `Lab`
 * (pick its domain), then add it here. Routes, menus, filters, the home page and
 * progress tracking pick it up. A planned entry can simply be replaced by the real lab.
 */
export const LABS: Lab[] = [
  lab1,
  planned(2, "lab2", "ml", "Classical machine learning", "Regression, classification and model evaluation on real tabular data.", ["Regression", "Evaluation"]),
  planned(3, "lab3", "dl", "Convolutional networks", "Slide filters over images and inspect feature maps layer by layer.", ["CNN", "Vision"]),
  planned(4, "lab4", "nlp", "Sequences and attention", "Peek inside a tiny transformer and watch tokens attend to each other.", ["Transformers", "Text"]),
];

export const getLab = (id: string | undefined) => LABS.find((l) => l.id === id);
export const liveLabs = () => LABS.filter((l) => l.status === "live");
export const labMinutes = (lab: Lab) => lab.steps.reduce((n, s) => n + s.minutes, 0);

export interface DomainSummary {
  id: DomainId;
  liveLabs: Lab[];
  plannedLabs: Lab[];
  tools: typeof TOOLS;
}

export const domainSummary = (): DomainSummary[] =>
  DOMAINS.map((d) => ({
    id: d.id,
    liveLabs: LABS.filter((l) => l.domain === d.id && l.status === "live"),
    plannedLabs: LABS.filter((l) => l.domain === d.id && l.status === "planned"),
    tools: TOOLS.filter((t) => t.domain === d.id),
  }));
