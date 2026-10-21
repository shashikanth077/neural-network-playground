import { neuralNetworkSheet } from "./neuralNetwork";
import { nlpSheet } from "./nlp";
import { transformersSheet } from "./transformers";
import type { Cheatsheet } from "./types";

const planned = (id: string, domain: Cheatsheet["domain"], title: string, subtitle: string): Cheatsheet => ({
  id, domain, title, subtitle, status: "planned", sections: [],
});

/** Every cheatsheet. Add one: create its file exporting a `Cheatsheet`, then list it here. */
export const SHEETS: Cheatsheet[] = [
  neuralNetworkSheet,
  planned("machine-learning", "ml", "Machine Learning cheatsheet", "Data preparation, regression, classification, evaluation and model selection."),
  nlpSheet,
  transformersSheet,
];

export const getSheet = (id: string | undefined) => SHEETS.find((s) => s.id === id);
