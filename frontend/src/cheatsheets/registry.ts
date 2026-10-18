import { neuralNetworkSheet } from "./neuralNetwork";
import type { Cheatsheet } from "./types";

const planned = (id: string, domain: Cheatsheet["domain"], title: string, subtitle: string): Cheatsheet => ({
  id, domain, title, subtitle, status: "planned", sections: [],
});

/** Every cheatsheet. Add one: create its file exporting a `Cheatsheet`, then list it here. */
export const SHEETS: Cheatsheet[] = [
  neuralNetworkSheet,
  planned("machine-learning", "ml", "Machine Learning cheatsheet", "Data preparation, regression, classification, evaluation and model selection."),
  planned("nlp", "nlp", "NLP cheatsheet", "Tokens, embeddings, sequence models, attention and evaluation."),
];

export const getSheet = (id: string | undefined) => SHEETS.find((s) => s.id === id);
