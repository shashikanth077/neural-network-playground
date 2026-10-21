/** Shape and parameter-count formulas used by the cheatsheet calculators (checked against the lecture numbers). */

export const denseParams = (nIn: number, units: number) => (nIn + 1) * units;
export const embeddingParams = (vocab: number, dim: number) => vocab * dim;
export const convParams = (kernel: number, inChannels: number, filters: number, dims: 1 | 2 = 2) =>
  filters * (kernel ** dims * inChannels + 1);

/** Output size of a convolution / pooling along one axis: floor((W − F + 2P) / S) + 1. */
export const convOut = (w: number, f: number, s = 1, p = 0) => {
  if (s < 1 || f < 1 || w + 2 * p < f) return 0;
  return Math.floor((w - f + 2 * p) / s) + 1;
};
/** Padding that keeps the size for stride 1 ("same"): (F − 1) / 2 for odd F (rounded up for even F). */
export const samePad = (f: number) => Math.ceil((f - 1) / 2);

export const rnnParams = (inputs: number, units: number) => units * (inputs + units) + units;
export const lstmParams = (inputs: number, units: number) => 4 * (units * (inputs + units) + units);
/** Keras GRU default (reset_after = True) keeps two bias vectors. */
export const gruParams = (inputs: number, units: number, resetAfter = true) => 3 * (units * (inputs + units) + (resetAfter ? 2 : 1) * units);

export const stepsPerEpoch = (nTrain: number, batch: number) => Math.ceil(nTrain / Math.max(1, Math.min(batch, nTrain)));

// ---------------------------------------------------------------- Transformer encoders (NLP / Transformers cheatsheets)

export interface EncoderConfig {
  vocab: number;
  d: number;
  layers: number;
  ff: number;
  /** Learned position table length (BERT family: 512). */
  maxPos?: number;
  /** Segment (token-type) embeddings: 2 for BERT, 0 for DistilBERT. */
  typeVocab?: number;
  /** BERT pooler / DistilBERT pre-classifier: one d × d dense layer on top of the encoder. */
  denseHead?: boolean;
  /** Size of the final classification layer (0 = no classifier). */
  classes?: number;
}

export interface EncoderParams {
  embeddings: number;
  perLayer: number;
  attention: number;
  feedForward: number;
  layerNorms: number;
  layersTotal: number;
  head: number;
  total: number;
}

/**
 * Trainable parameters of a BERT-style encoder with a classification head.
 * The number of heads does not appear: d_k = d / h, so h·(3·d·d_k) = 3·d² whatever h is.
 *  embeddings = (V + P + T)·d + 2d (embedding LayerNorm)
 *  per layer  = 4(d² + d) attention (W_Q, W_K, W_V, W_O with biases)
 *             + 2·d·ff + ff + d feed-forward
 *             + 2 · 2d two LayerNorms
 *  head       = (d² + d) pooler / pre-classifier + (d·C + C) classifier
 */
export function transformerParams(c: EncoderConfig): EncoderParams {
  const { vocab, d, layers, ff } = c;
  const maxPos = c.maxPos ?? 512, typeVocab = c.typeVocab ?? 2, classes = c.classes ?? 2, dense = c.denseHead ?? true;
  const embeddings = (vocab + maxPos + typeVocab) * d + 2 * d;
  const attention = 4 * (d * d + d);
  const feedForward = 2 * d * ff + ff + d;
  const layerNorms = 2 * 2 * d;
  const perLayer = attention + feedForward + layerNorms;
  const head = (dense ? d * d + d : 0) + (classes > 0 ? d * classes + classes : 0);
  return { embeddings, perLayer, attention, feedForward, layerNorms, layersTotal: perLayer * layers, head, total: embeddings + perLayer * layers + head };
}

/** Memory of the weights: 4 bytes per parameter at 32-bit precision, in megabytes (10^6 bytes, as in the paper's 17–500 MB). */
export const megabytes32 = (params: number) => (params * 4) / 1e6;

/** Dominant operation counts of ONE self-attention layer (multiply-adds, orders of magnitude). */
export function attentionCost(n: number, d: number, h: number, ff = 4 * d) {
  return {
    scoreEntries: h * n * n, // n × n weights per head
    attentionMults: 2 * n * n * d, // Q·Kᵀ and A·V, summed over heads (h · d_k = d)
    projectionMults: 4 * n * d * d, // W_Q, W_K, W_V, W_O
    ffnMults: 2 * n * d * ff,
    recurrentMults: n * d * d, // O(n·d²): the cost the paper compares against
    ratio: d > 0 ? n / d : 0, // O(n²d) / O(nd²) = n / d
  };
}

/** Hugging Face get_linear_schedule_with_warmup: 0 → peak over the warm-up steps, then linearly down to 0. */
export function linearWarmupLR(step: number, totalSteps: number, peak: number, warmFrac = 0.1) {
  const warm = Math.ceil(warmFrac * totalSteps);
  if (step < warm) return (peak * step) / Math.max(1, warm);
  return (peak * Math.max(0, totalSteps - step)) / Math.max(1, totalSteps - warm);
}

/** Original Transformer sinusoidal encoding: even dimensions sin, odd dimensions cos. */
export const sinusoidalPE = (pos: number, dim: number, d: number) => {
  const i = Math.floor(dim / 2);
  const angle = pos / 10000 ** ((2 * i) / d);
  return dim % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
};

/** Seconds needed to classify `sentences` at `msPerSentence` (the paper's latency = test-set time / sentences). */
export const inferenceSeconds = (msPerSentence: number, sentences: number) => (msPerSentence * sentences) / 1000;
export const sentencesPerSecond = (msPerSentence: number) => (msPerSentence > 0 ? 1000 / msPerSentence : 0);

/** How many test sentences one accuracy point is worth. */
export const sentencesPerPoint = (n: number) => n / 100;
/** Normal-approximation half-width (in percentage points) of a 95 % interval of an accuracy: 196·√(p(1−p)/n). */
export const accuracyHalfWidth = (acc: number, n: number) => (n > 0 ? 196 * Math.sqrt((acc * (1 - acc)) / n) : 0);

/**
 * Exact two-sided McNemar test: b ~ Binomial(b + c, 0.5) under the null.
 * b = sentences only model A got right, c = only model B got right.
 */
export function mcnemarExact(b: number, c: number) {
  const n = b + c;
  if (n === 0) return 1;
  const k = Math.min(b, c);
  const logC = [0];
  for (let i = 1; i <= n; i++) logC[i] = logC[i - 1] + Math.log(n - i + 1) - Math.log(i);
  let tail = 0;
  for (let i = 0; i <= k; i++) tail += Math.exp(logC[i] - n * Math.LN2);
  return Math.min(1, 2 * tail);
}

/** Scaled dot-product attention for small matrices: softmax(Q·Kᵀ / √d_k)·V, row by row. Used for the worked example. */
export function attention(Q: number[][], K: number[][], V: number[][]) {
  const dk = Q[0].length;
  const scores = Q.map((q) => K.map((k) => q.reduce((s, x, i) => s + x * k[i], 0)));
  const scaled = scores.map((r) => r.map((x) => x / Math.sqrt(dk)));
  const weights = scaled.map((r) => {
    const m = Math.max(...r);
    const e = r.map((x) => Math.exp(x - m));
    const z = e.reduce((a, b) => a + b, 0);
    return e.map((x) => x / z);
  });
  const out = weights.map((w) => V[0].map((_, j) => w.reduce((s, a, t) => s + a * V[t][j], 0)));
  return { scores, scaled, weights, out };
}

/** Accuracy, precision, recall and F1 of the positive class from a binary confusion matrix. */
export function binaryMetrics(tp: number, fp: number, fn: number, tn: number) {
  const total = tp + fp + fn + tn;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  return { accuracy: total > 0 ? (tp + tn) / total : 0, precision, recall, f1 };
}
