import { lab1 } from "./lab1";
import type { Lab } from "./types";

const planned = (number: number, id: string, title: string, subtitle: string, tags: string[]): Lab => ({
  id, number, title, subtitle, status: "planned", accent: "c-purple", tags, steps: [],
});

/**
 * Every lab on the platform. To add one: create `labs/<name>/index.ts` exporting a `Lab`
 * with its steps, then add it here. Routes, menu, home page and progress tracking pick it up.
 */
export const LABS: Lab[] = [
  lab1,
  planned(2, "lab2", "Convolutional networks", "Slide filters over images and inspect feature maps layer by layer.", ["CNN", "Vision"]),
  planned(3, "lab3", "Sequences and attention", "Peek inside a tiny transformer and watch tokens attend to each other.", ["Transformers", "NLP"]),
  planned(4, "lab4", "Loss landscapes", "Fly over the loss surface and see how optimizers roll toward minima.", ["Optimization"]),
];

export const getLab = (id: string | undefined) => LABS.find((l) => l.id === id);
export const liveLabs = () => LABS.filter((l) => l.status === "live");
export const labMinutes = (lab: Lab) => lab.steps.reduce((n, s) => n + s.minutes, 0);
