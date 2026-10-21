/**
 * Pure functions behind the experiment steps of Lab 3. Everything takes the recorded per-sentence predictions
 * (strings of "0"/"1", one character per test sentence) so the numbers can be recomputed in the browser and checked
 * against the CSV files of the team's repository (see src/test/lab3exp.test.ts).
 */
import type { ModelRec } from "./data/expModels";
import { CURVE, LC_TIME, MODELS } from "./data/expModels";

// ------------------------------------------------------------------------------------------------ basic metrics
export const bit = (s: string, i: number) => (s.charCodeAt(i) === 49 ? 1 : 0);

/** Share of positions where prediction and gold agree. */
export function accuracy(pred: string, gold: string): number {
  let ok = 0;
  for (let i = 0; i < gold.length; i++) if (pred.charCodeAt(i) === gold.charCodeAt(i)) ok++;
  return ok / gold.length;
}

/** 0/1 per sentence: 1 when the prediction is right. */
export function correctness(pred: string, gold: string): Uint8Array {
  const out = new Uint8Array(gold.length);
  for (let i = 0; i < gold.length; i++) out[i] = pred.charCodeAt(i) === gold.charCodeAt(i) ? 1 : 0;
  return out;
}

/** [[TN, FP], [FN, TP]] with class 1 = positive: the layout of scikit-learn's confusion_matrix. */
export function confusion(pred: string, gold: string): [[number, number], [number, number]] {
  const m: [[number, number], [number, number]] = [[0, 0], [0, 0]];
  for (let i = 0; i < gold.length; i++) m[bit(gold, i)][bit(pred, i)]++;
  return m;
}

export interface Macro { precision: number; recall: number; f1: number; perClass: { precision: number; recall: number; f1: number }[] }

/** Macro-averaged precision, recall and F1 (mean over the two classes, as scikit-learn's average="macro"). */
export function macroMetrics(cm: [[number, number], [number, number]]): Macro {
  const [[tn, fp], [fn, tp]] = cm;
  const div = (a: number, b: number) => (b === 0 ? 0 : a / b);
  const cls = (tpc: number, fpc: number, fnc: number) => {
    const precision = div(tpc, tpc + fpc), recall = div(tpc, tpc + fnc);
    return { precision, recall, f1: div(2 * precision * recall, precision + recall) };
  };
  const neg = cls(tn, fn, fp), pos = cls(tp, fp, fn);
  return {
    precision: (neg.precision + pos.precision) / 2,
    recall: (neg.recall + pos.recall) / 2,
    f1: (neg.f1 + pos.f1) / 2,
    perClass: [neg, pos],
  };
}

// ------------------------------------------------------------------------------------------------ McNemar, exact
const lnFact: number[] = [0];
function lnFactorial(n: number): number {
  for (let i = lnFact.length; i <= n; i++) lnFact.push(lnFact[i - 1] + Math.log(i));
  return lnFact[n];
}

/**
 * Two-sided exact binomial test with p = 0.5 (what scipy.stats.binomtest returns for it): P(X <= min(b, c)) doubled,
 * 1 when b = c. This is the exact McNemar test of the paper (section 2.7.8).
 */
export function exactMcNemarP(b: number, c: number): number {
  const n = b + c;
  if (n === 0) return 1;
  const k = Math.min(b, c);
  if (2 * k >= n - 1) return 1; // b = c, or n odd with |b - c| = 1: the doubled tail is exactly 1
  let mx = -Infinity;
  const terms: number[] = [];
  for (let i = 0; i <= k; i++) {
    const t = lnFactorial(n) - lnFactorial(i) - lnFactorial(n - i) - n * Math.LN2;
    terms.push(t);
    if (t > mx) mx = t;
  }
  let s = 0;
  for (const t of terms) s += Math.exp(t - mx);
  return Math.min(1, 2 * Math.exp(mx + Math.log(s)));
}

export interface McNemar { onlyA: number; onlyB: number; p: number }

/** Paired comparison: onlyA = sentences A gets right and B wrong, onlyB the other way round. */
export function mcnemar(a: string, b: string, gold: string): McNemar {
  let onlyA = 0, onlyB = 0;
  for (let i = 0; i < gold.length; i++) {
    const ra = a.charCodeAt(i) === gold.charCodeAt(i), rb = b.charCodeAt(i) === gold.charCodeAt(i);
    if (ra && !rb) onlyA++;
    else if (!ra && rb) onlyB++;
  }
  return { onlyA, onlyB, p: exactMcNemarP(onlyA, onlyB) };
}

/** p-value text: "< 0.001" below a thousandth, otherwise three decimals. */
export function fmtP(p: number): string {
  if (p < 0.001) return "< 0.001";
  return p.toFixed(3);
}

// ------------------------------------------------------------------------------------------------ bootstrap
/** Small seeded generator (mulberry32): the page can show the same interval every time. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** numpy.percentile with linear interpolation, on an ascending array. */
export function percentile(sorted: ArrayLike<number>, q: number): number {
  const pos = (q / 100) * (sorted.length - 1);
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/**
 * 95 % percentile-bootstrap interval of accuracy for several models at once. The same resampled sentence indices are
 * used for every model (like the Python run). Seeded, so it is repeatable; it is NOT the numpy stream of the paper.
 */
export function bootstrapIntervals(correct: Uint8Array[], resamples = 2000, seed = 42): { low: number; high: number }[] {
  const n = correct[0].length, m = correct.length;
  const rng = mulberry32(seed);
  const accs = correct.map(() => new Float64Array(resamples));
  const sums = new Int32Array(m);
  for (let b = 0; b < resamples; b++) {
    sums.fill(0);
    for (let i = 0; i < n; i++) {
      const j = Math.floor(rng() * n);
      for (let k = 0; k < m; k++) sums[k] += correct[k][j];
    }
    for (let k = 0; k < m; k++) accs[k][b] = sums[k] / n;
  }
  return accs.map((a) => {
    a.sort();
    return { low: percentile(a, 2.5), high: percentile(a, 97.5) };
  });
}

// ------------------------------------------------------------------------------------------------ negation / contrast subsets
/** The keyword rules of 08_report.py (and of the paper, section 2.4). */
export const NEGATION_RE = /\b(?:not|no|never|nothing|nor|neither)\b|n't/;
export const CONTRAST_RE = /\b(?:but|although|though|yet|however)\b/;
export const NEGATION_WORDS = ["not", "no", "never", "nothing", "n't", "nor", "neither"];
export const CONTRAST_WORDS = ["but", "although", "though", "yet", "however"];

export const hasNegation = (s: string) => NEGATION_RE.test(s);
export const hasContrast = (s: string) => CONTRAST_RE.test(s);

/** Indices of the sentences that match a rule. */
export function subsetIndices(sentences: string[], re: RegExp): number[] {
  const out: number[] = [];
  sentences.forEach((s, i) => { if (re.test(s)) out.push(i); });
  return out;
}

export function subsetAccuracy(pred: string, gold: string, idx: number[]): number {
  let ok = 0;
  for (const i of idx) if (pred.charCodeAt(i) === gold.charCodeAt(i)) ok++;
  return ok / idx.length;
}

// ------------------------------------------------------------------------------------------------ data set facts
export function splitFacts(sentences: string[], gold: string) {
  const words = sentences.reduce((n, s) => n + s.split(/\s+/).filter(Boolean).length, 0);
  let pos = 0;
  for (let i = 0; i < gold.length; i++) pos += bit(gold, i);
  return { size: sentences.length, positiveShare: pos / gold.length, meanWords: words / sentences.length };
}

// ------------------------------------------------------------------------------------------------ cost calculators
/** Seconds to classify n sentences at `ms` milliseconds per sentence. */
export const secondsFor = (n: number, ms: number) => (n * ms) / 1000;
/** Sentences per second at `ms` milliseconds per sentence. */
export const perSecond = (ms: number) => 1000 / ms;
/** Memory of the weights in MB (decimal, 10^6 bytes) at `bytes` bytes per parameter (4 = 32-bit). */
export const memoryMB = (params: number, bytes = 4) => (params * bytes) / 1e6;

/** "37 s", "4 min 10 s", "2 h 39 min": a human duration. */
export function fmtDuration(seconds: number): string {
  if (seconds < 1) return `${(seconds * 1000).toFixed(seconds < 0.01 ? 1 : 0)} ms`;
  if (seconds < 60) return `${seconds < 10 ? seconds.toFixed(1) : Math.round(seconds)} s`;
  if (seconds < 3600) { const m = Math.floor(seconds / 60); return `${m} min ${Math.round(seconds - m * 60)} s`; }
  const h = Math.floor(seconds / 3600);
  return `${h} h ${Math.round((seconds - h * 3600) / 60)} min`;
}

export const byTag = (tag: string): ModelRec => MODELS.find((m) => m.tag === tag)!;

// ------------------------------------------------------------------------------------------------ learning curves
/** Piecewise-linear interpolation of y over log(n); n is clamped to the measured range. */
export function interpLog(points: { n: number; v: number }[], n: number): number {
  const lo = points[0], hi = points[points.length - 1];
  if (n <= lo.n) return lo.v;
  if (n >= hi.n) return hi.v;
  for (let i = 1; i < points.length; i++) {
    if (n <= points[i].n) {
      const a = points[i - 1], b = points[i];
      const t = (Math.log(n) - Math.log(a.n)) / (Math.log(b.n) - Math.log(a.n));
      return a.v + (b.v - a.v) * t;
    }
  }
  return hi.v;
}
export const curvePoints = (key: "bert-small" | "tfidf-lr") => CURVE[key].map((p) => ({ n: p.n, v: p.accuracy }));
export const curveAt = (key: "bert-small" | "tfidf-lr", n: number) => interpLog(curvePoints(key), n);
/** Fine-tuning seconds of BERT-small for n labelled sentences (interpolated linearly between the measured runs). */
export function lcTrainSeconds(n: number): number {
  const pts = LC_TIME;
  if (n <= pts[0].n) return pts[0].trainSeconds * (n / pts[0].n);
  for (let i = 1; i < pts.length; i++) {
    if (n <= pts[i].n) {
      const a = pts[i - 1], b = pts[i];
      return a.trainSeconds + ((b.trainSeconds - a.trainSeconds) * (n - a.n)) / (b.n - a.n);
    }
  }
  return pts[pts.length - 1].trainSeconds;
}
/** Smallest measured training size at which BERT-small reaches `target` accuracy, interpolated on the curve (null if never). */
export function labelsToReach(key: "bert-small" | "tfidf-lr", target: number): number | null {
  const pts = curvePoints(key);
  if (target <= pts[0].v) return pts[0].n;
  for (let i = 1; i < pts.length; i++) {
    if (target <= pts[i].v) {
      const a = pts[i - 1], b = pts[i];
      const t = (target - a.v) / (b.v - a.v);
      return Math.exp(Math.log(a.n) + t * (Math.log(b.n) - Math.log(a.n)));
    }
  }
  return null;
}

// ------------------------------------------------------------------------------------------------ TF-IDF + logistic regression
export interface LrChunk { terms: string; idf: string; coef: string }
export interface LrModel { index: Map<string, number>; terms: string[]; idf: Float64Array; coef: Float64Array; bias: number }

function int16s(b64: string): Int16Array {
  const bin = atob(b64);
  const out = new Int16Array(bin.length / 2);
  for (let i = 0; i < out.length; i++) {
    const v = bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8);
    out[i] = v >= 0x8000 ? v - 0x10000 : v;
  }
  return out;
}

/** Join the chunks of the exported model (idf and coef are int16 / 1000). */
export function buildLrModel(chunks: LrChunk[], bias: number): LrModel {
  const terms: string[] = [];
  const idf: number[] = [], coef: number[] = [];
  for (const c of chunks) {
    for (const t of c.terms.split("\n")) terms.push(t);
    int16s(c.idf).forEach((v) => idf.push(v / 1000));
    int16s(c.coef).forEach((v) => coef.push(v / 1000));
  }
  const index = new Map<string, number>();
  terms.forEach((t, i) => index.set(t, i));
  return { index, terms, idf: Float64Array.from(idf), coef: Float64Array.from(coef), bias };
}

/** scikit-learn's default token pattern on lower-cased text: words of two or more letters or digits. */
export const wordTokens = (s: string): string[] => s.toLowerCase().match(/[\p{L}\p{N}_]{2,}/gu) ?? []; // Python's \b\w\w+\b: runs of two or more letters, digits or _ (Unicode-aware, e.g. "cliché")
/** Unigrams then bigrams (ngram_range = (1, 2)). */
export function ngrams(tokens: string[]): string[] {
  const out = tokens.slice();
  for (let i = 0; i + 1 < tokens.length; i++) out.push(tokens[i] + " " + tokens[i + 1]);
  return out;
}

export interface TermRow { term: string; tf: number; idf: number; raw: number; weight: number; coef: number; contribution: number }

/**
 * The feature vector the real classifier sees: sublinear tf (1 + ln tf) times idf for every n-gram that is in the
 * vocabulary of 73,556 terms (min_df = 2), L2-normalised; the logistic regression contribution of a term is coef x weight.
 */
export function tfidfRows(sentence: string, m: LrModel): TermRow[] {
  const tf = new Map<string, number>();
  for (const g of ngrams(wordTokens(sentence))) if (m.index.has(g)) tf.set(g, (tf.get(g) ?? 0) + 1);
  const rows: TermRow[] = [];
  let norm = 0;
  for (const [term, n] of tf) {
    const j = m.index.get(term)!;
    const raw = (1 + Math.log(n)) * m.idf[j];
    norm += raw * raw;
    rows.push({ term, tf: n, idf: m.idf[j], raw, weight: 0, coef: m.coef[j], contribution: 0 });
  }
  norm = Math.sqrt(norm) || 1;
  for (const r of rows) { r.weight = r.raw / norm; r.contribution = r.coef * r.weight; }
  return rows.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
}

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/** z = bias + sum of contributions; P(positive) = sigmoid(z). */
export function lrScore(rows: TermRow[], bias: number): { z: number; p: number } {
  const z = rows.reduce((s, r) => s + r.contribution, bias);
  return { z, p: sigmoid(z) };
}

// ------------------------------------------------------------------------------------------------ multinomial naive Bayes (illustration)
export interface NbModel { alpha: number; vocab: Map<string, [number, number]>; total: [number, number]; docs: [number, number] }

/** Train a unigram multinomial NB with additive smoothing alpha (the paper uses alpha = 0.5) on labelled sentences. */
export function trainNb(sentences: string[], labels: number[], alpha = 0.5): NbModel {
  const vocab = new Map<string, [number, number]>();
  const total: [number, number] = [0, 0], docs: [number, number] = [0, 0];
  sentences.forEach((s, i) => {
    const y = labels[i];
    docs[y]++;
    for (const t of wordTokens(s)) {
      const e = vocab.get(t) ?? [0, 0];
      e[y]++;
      vocab.set(t, e);
      total[y]++;
    }
  });
  return { alpha, vocab, total, docs };
}

export interface NbTerm { term: string; count: number; logPos: number; logNeg: number; delta: number }

/** log P(t | y) = ln((count + alpha) / (total + alpha V)); delta = log P(t|pos) - log P(t|neg), times the word count in the sentence. */
export function nbPredict(m: NbModel, sentence: string): { terms: NbTerm[]; logPosterior: [number, number]; pPositive: number } {
  const V = m.vocab.size;
  const counts = new Map<string, number>();
  for (const t of wordTokens(sentence)) if (m.vocab.has(t)) counts.set(t, (counts.get(t) ?? 0) + 1);
  const n = m.docs[0] + m.docs[1];
  const lp: [number, number] = [Math.log(m.docs[0] / n), Math.log(m.docs[1] / n)];
  const terms: NbTerm[] = [];
  for (const [term, count] of counts) {
    const c = m.vocab.get(term)!;
    const logNeg = Math.log((c[0] + m.alpha) / (m.total[0] + m.alpha * V));
    const logPos = Math.log((c[1] + m.alpha) / (m.total[1] + m.alpha * V));
    lp[0] += count * logNeg; lp[1] += count * logPos;
    terms.push({ term, count, logPos, logNeg, delta: count * (logPos - logNeg) });
  }
  terms.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const d = lp[1] - lp[0];
  return { terms, logPosterior: lp, pPositive: sigmoid(d) };
}

// ------------------------------------------------------------------------------------------------ zero-shot NLI toy
export function softmax(xs: number[]): number[] {
  const mx = Math.max(...xs);
  const e = xs.map((x) => Math.exp(x - mx));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}
export const NLI_TEMPLATE = "The sentiment of this movie review is {}.";
export const nliHypothesis = (label: string) => NLI_TEMPLATE.replace("{}", label);

// ------------------------------------------------------------------------------------------------ decision helper
export interface DecideInput {
  /** A public model fine-tuned for the same task and domain exists. */
  publicInDomain: boolean;
  /** A public model for a related domain (e.g. tweets) exists. */
  publicRelated: boolean;
  /** Labelled sentences you have. */
  labels: number;
  /** Largest acceptable latency per sentence on the CPU, ms. */
  maxLatencyMs: number;
  /** Longest acceptable training time, minutes (0 = cannot train at all). */
  maxTrainMinutes: number;
  /** The texts are English (the measured models are English models). */
  english: boolean;
}

export interface Ranked {
  model: ModelRec;
  accuracy: number;
  trainSeconds: number;
  /** "curve" when accuracy comes from the learning curve instead of the 8k / 65k run. */
  basis: "run" | "curve";
  /** Translation keys (`lab3.dec.why.*`) with their variables, explaining the exclusion. */
  reasons: { key: string; vars: Record<string, string | number> }[];
  ok: boolean;
}

/** Rank the ten measured models for a situation: those that fit are sorted by accuracy, the others carry reasons. */
export function rankModels(inp: DecideInput): Ranked[] {
  const out: Ranked[] = MODELS.map((m) => {
    let acc = m.accuracy, trainSeconds = m.trainSeconds, basis: "run" | "curve" = "run";
    const reasons: Ranked["reasons"] = [];
    if (m.tag === "pt_distilbert_sst2") { if (!inp.publicInDomain) reasons.push({ key: "needInDomain", vars: {} }); }
    else if (m.tag === "pt_twitter_roberta") { if (!inp.publicRelated) reasons.push({ key: "needRelated", vars: {} }); }
    else if (m.tag === "zs_nli_distilroberta") { /* needs nothing: no labels, no training */ }
    else if (m.tag === "tfidf_logreg" && inp.labels >= 500 && inp.labels < m.trainSize) {
      if (inp.labels > 8000) reasons.push({ key: "measuredUpTo", vars: { n: 8000, all: m.trainSize } });
      else { acc = curveAt("tfidf-lr", inp.labels); trainSeconds = 5; basis = "curve"; }
    } else if (m.tag === "ft_bert-small_8000" && inp.labels >= 500) {
      acc = curveAt("bert-small", Math.min(inp.labels, 8000));
      trainSeconds = lcTrainSeconds(Math.min(inp.labels, 8000));
      basis = inp.labels < 8000 ? "curve" : "run";
    } else if (m.trainSize > 0 && inp.labels < m.trainSize) reasons.push({ key: "measuredWith", vars: { n: m.trainSize, have: inp.labels } });
    if (m.trainSize > 0 && inp.labels === 0) reasons.push({ key: "needLabels", vars: {} });
    if (m.trainSize > 0 && trainSeconds > inp.maxTrainMinutes * 60) reasons.push({ key: "trainTooLong", vars: { t: fmtDuration(trainSeconds) } });
    if (m.latencyMs > inp.maxLatencyMs) reasons.push({ key: "tooSlow", vars: { ms: m.latencyMs.toFixed(m.latencyMs < 1 ? 2 : 1), max: inp.maxLatencyMs } });
    if (!inp.english && m.family === "transformer") reasons.push({ key: "englishOnly", vars: {} });
    return { model: m, accuracy: acc, trainSeconds, basis, reasons, ok: reasons.length === 0 };
  });
  return out.sort((a, b) => Number(b.ok) - Number(a.ok) || b.accuracy - a.accuracy);
}

export type Recommendation = {
  /** Which of the paper's four recommendations applies (1 reuse, 2 fine-tune, 3 zero-shot, 4 TF-IDF), or 0 when none fits. */
  step: 0 | 1 | 2 | 3 | 4;
  tag: string | null;
};

/**
 * The paper's practical recommendations as a rule list, in order: (1) a public in-domain model, (2) fine-tune a distilled
 * Transformer on a few thousand labels, (3) zero-shot NLI when there are no labels, (4) TF-IDF when speed or hardware is
 * the limit. Each rule applies only if the model it names fits the latency and training limits.
 */
export function recommend(inp: DecideInput): Recommendation {
  const fits = (tag: string, labels = inp.labels) => rankModels({ ...inp, labels }).find((r) => r.model.tag === tag)?.ok ?? false;
  if (inp.publicInDomain && fits("pt_distilbert_sst2")) return { step: 1, tag: "pt_distilbert_sst2" };
  if (inp.labels >= 1000) {
    // DistilBERT was only measured with 8,000 labels: its limits are checked as measured, accuracy with fewer labels is lower.
    if (fits("ft_distilbert_8000", 8000)) return { step: 2, tag: "ft_distilbert_8000" };
    if (fits("ft_bert-small_8000")) return { step: 2, tag: "ft_bert-small_8000" };
  }
  if (inp.labels === 0 && fits("zs_nli_distilroberta")) return { step: 3, tag: "zs_nli_distilroberta" };
  const classical = ["tfidf_svm", "tfidf_logreg", "tfidf_nb"].find((t) => fits(t));
  return classical ? { step: 4, tag: classical } : { step: 0, tag: null };
}

// ------------------------------------------------------------------------------------------------ sentence lab
export type SentenceMode =
  | "all" | "disagree" | "allWrong" | "allRight" | "negation" | "contrast" | "svmRightDistilWrong" | "distilRightSvmWrong" | "modelWrong";

export interface SentenceQuery {
  query: string;
  mode: SentenceMode;
  /** For mode "modelWrong": the model tag that must be wrong. */
  tag?: string;
}

/** Indices of the test sentences that match the text search and the preset filter. */
export function filterSentences(sentences: string[], gold: string, preds: Record<string, string>, q: SentenceQuery): number[] {
  const tags = Object.keys(preds);
  const svm = preds["tfidf_svm"], ft = preds["ft_distilbert_8000"];
  const needle = q.query.trim().toLowerCase();
  const out: number[] = [];
  for (let i = 0; i < sentences.length; i++) {
    if (needle && !sentences[i].includes(needle)) continue;
    const g = gold.charCodeAt(i);
    let right = 0;
    for (const t of tags) if (preds[t].charCodeAt(i) === g) right++;
    let ok = true;
    switch (q.mode) {
      case "disagree": ok = right !== 0 && right !== tags.length; break;
      case "allWrong": ok = right === 0; break;
      case "allRight": ok = right === tags.length; break;
      case "negation": ok = hasNegation(sentences[i]); break;
      case "contrast": ok = hasContrast(sentences[i]); break;
      case "svmRightDistilWrong": ok = svm.charCodeAt(i) === g && ft.charCodeAt(i) !== g; break;
      case "distilRightSvmWrong": ok = ft.charCodeAt(i) === g && svm.charCodeAt(i) !== g; break;
      case "modelWrong": ok = !!q.tag && preds[q.tag].charCodeAt(i) !== g; break;
      default: break;
    }
    if (ok) out.push(i);
  }
  return out;
}

/** Number of models (of those in `preds`) that classify sentence i correctly. */
export function rightCount(preds: Record<string, string>, gold: string, i: number): number {
  let n = 0;
  for (const t of Object.keys(preds)) if (preds[t].charCodeAt(i) === gold.charCodeAt(i)) n++;
  return n;
}
