/**
 * Results recorded in the project (SST-2, 872 test sentences, CPU-only laptop: Intel Core i5-8365U, 4 cores, 16 GB, no GPU).
 * Copied from code/results/summary_table.csv, statistics.csv and subset_accuracy.csv of the project repository
 * (accuracy and F1 in %, times in seconds, latency in ms per sentence with batches of 32).
 */
export interface Measured {
  name: string;
  family: "classical" | "recurrent" | "fine-tuned" | "ready-made" | "zero-shot";
  trainSize: number;
  params: number;
  acc: number;
  f1: number;
  trainS: number;
  latMs: number;
  ciLow: number;
  ciHigh: number;
  /** Sentences only the best model (DistilBERT-SST2) got right / only this model got right (paired, for McNemar). */
  bBest: number;
  cModel: number;
  /** Accuracy on the 184 negation and 130 contrast sentences. */
  neg: number;
  con: number;
}

export const MEASURED: Measured[] = [
  { name: "BERT-tiny fine-tuned (8k)", family: "fine-tuned", trainSize: 8000, params: 4386178, acc: 76.6, f1: 76.5, trainS: 120.0, latMs: 1.174, ciLow: 73.7, ciHigh: 79.2, bBest: 154, cModel: 28, neg: 69.6, con: 65.4 },
  { name: "Zero-shot NLI DistilRoBERTa", family: "zero-shot", trainSize: 0, params: 82120707, acc: 81.8, f1: 81.7, trainS: 0.0, latMs: 107.02, ciLow: 79.1, ciHigh: 84.2, bBest: 116, cModel: 35, neg: 81.5, con: 79.2 },
  { name: "TF-IDF + Logistic Regr.", family: "classical", trainSize: 65349, params: 73556, acc: 81.9, f1: 81.8, trainS: 3.6, latMs: 0.049, ciLow: 79.2, ciHigh: 84.4, bBest: 114, cModel: 34, neg: 73.9, con: 76.9 },
  { name: "TF-IDF + Naive Bayes", family: "classical", trainSize: 65349, params: 147112, acc: 82.2, f1: 82.1, trainS: 1.8, latMs: 0.053, ciLow: 79.6, ciHigh: 84.7, bBest: 115, cModel: 38, neg: 73.9, con: 76.9 },
  { name: "BiLSTM (from scratch)", family: "recurrent", trainSize: 65349, params: 1974786, acc: 82.8, f1: 82.7, trainS: 380.0, latMs: 0.454, ciLow: 80.3, ciHigh: 85.2, bBest: 103, cModel: 31, neg: 78.8, con: 77.7 },
  { name: "TF-IDF + Linear SVM", family: "classical", trainSize: 65349, params: 73556, acc: 82.9, f1: 82.9, trainS: 2.3, latMs: 0.055, ciLow: 80.4, ciHigh: 85.3, bBest: 106, cModel: 35, neg: 74.5, con: 77.7 },
  { name: "BERT-small fine-tuned (8k)", family: "fine-tuned", trainSize: 8000, params: 28764674, acc: 83.7, f1: 83.7, trainS: 1580.8, latMs: 14.113, ciLow: 81.1, ciHigh: 85.9, bBest: 90, cModel: 26, neg: 74.5, con: 76.2 },
  { name: "Twitter-RoBERTa (off-the-shelf)", family: "ready-made", trainSize: 0, params: 124647939, acc: 85.8, f1: 85.8, trainS: 0.0, latMs: 84.804, ciLow: 83.4, ciHigh: 88.1, bBest: 82, cModel: 36, neg: 83.7, con: 84.6 },
  { name: "DistilBERT fine-tuned (8k)", family: "fine-tuned", trainSize: 8000, params: 66955010, acc: 88.8, f1: 88.8, trainS: 9530.0, latMs: 39.132, ciLow: 86.6, ciHigh: 90.7, bBest: 48, cModel: 28, neg: 85.3, con: 85.4 },
  { name: "DistilBERT-SST2 (off-the-shelf)", family: "ready-made", trainSize: 0, params: 66955010, acc: 91.1, f1: 91.0, trainS: 0.0, latMs: 44.563, ciLow: 89.1, ciHigh: 92.9, bBest: 0, cModel: 0, neg: 87.0, con: 86.2 },
];

/** Learning curve (accuracy %, same random subsets for both models): code/results/learning_curve.csv. */
export const LEARNING_CURVE = [
  { n: 500, bert: 75.9, tfidf: 61.8 },
  { n: 1000, bert: 77.6, tfidf: 68.1 },
  { n: 2000, bert: 80.7, tfidf: 71.0 },
  { n: 4000, bert: 82.7, tfidf: 75.8 },
  { n: 8000, bert: 83.7, tfidf: 77.5 },
];
