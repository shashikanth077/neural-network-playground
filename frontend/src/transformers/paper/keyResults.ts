import { CURVE, MODELS } from "../../labs/lab3/data/expModels";

/** The headline numbers of the paper, computed from the Lab 3 data modules (never typed). */
export interface KeyResults {
  bestFineTuned: number;
  bestClassical: number;
  bestReady: number;
  gain500: number;
  slowdown: number;
}

const best = (pred: (m: (typeof MODELS)[number]) => boolean) => Math.max(...MODELS.filter(pred).map((m) => m.accuracy));

export function keyResults(): KeyResults {
  const ft = MODELS.find((m) => m.tag === "ft_distilbert_8000")!;
  const svm = MODELS.find((m) => m.tag === "tfidf_svm")!;
  return {
    bestFineTuned: Math.round(best((m) => m.kind === "transformer-finetuned") * 1000) / 10,
    bestClassical: Math.round(best((m) => m.family === "classical") * 1000) / 10,
    bestReady: Math.round(best((m) => m.kind === "transformer-pretrained") * 1000) / 10,
    gain500: Math.round((CURVE["bert-small"][0].accuracy - CURVE["tfidf-lr"][0].accuracy) * 1000) / 10,
    slowdown: Math.round(ft.latencyMs / svm.latencyMs),
  };
}
