/**
 * Pure maths of the Lab 3 theory steps: every function here is a real computation (no mock-ups) and is unit-tested
 * against values computed independently with NumPy (see src/test/lab3theory.test.ts).
 */

export type Vec = number[];
export type Mat = number[][];

/* ------------------------------------------------------------------ random numbers */

/** Small seeded generator (mulberry32): the same seed always gives the same numbers. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A rows x cols matrix with entries uniform in [-scale, scale], seeded. */
export function randMat(rows: number, cols: number, seed: number, scale = 1): Mat {
  const r = rng(seed);
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => (r() * 2 - 1) * scale));
}

/* ------------------------------------------------------------------ linear algebra */

export const matmul = (a: Mat, b: Mat): Mat =>
  a.map((row) => b[0].map((_, j) => row.reduce((s, v, k) => s + v * b[k][j], 0)));
export const transpose = (a: Mat): Mat => a[0].map((_, j) => a.map((r) => r[j]));
export const addMat = (a: Mat, b: Mat): Mat => a.map((r, i) => r.map((v, j) => v + b[i][j]));
export const dot = (a: Vec, b: Vec) => a.reduce((s, v, i) => s + v * b[i], 0);

/* ------------------------------------------------------------------ positional encoding */

/** Sinusoidal positional encoding of the original Transformer (the formula in the paper):
 *  PE(pos, 2i) = sin(pos / 10000^(2i/d)), PE(pos, 2i+1) = cos(pos / 10000^(2i/d)). Returns n x d. */
export function sinusoidalPE(n: number, d: number): Mat {
  return Array.from({ length: n }, (_, pos) =>
    Array.from({ length: d }, (_, k) => {
      const i2 = k - (k % 2); // this is 2i for both members of the pair
      const angle = pos / Math.pow(10000, i2 / d);
      return k % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
    }),
  );
}

/* ------------------------------------------------------------------ softmax and attention */

/** Numerically stable softmax of one row. */
export function softmax(z: Vec): Vec {
  const m = Math.max(...z);
  const e = z.map((v) => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

export interface AttentionResult {
  /** Q·Kᵀ (n x n), before scaling and softmax. */
  raw: Mat;
  /** The scores that enter the softmax (raw / sqrt(d_k) when scaled). */
  scores: Mat;
  /** Row-wise softmax: each row is positive and sums to one. */
  weights: Mat;
  /** weights · V (n x d_v). */
  output: Mat;
}

/** Scaled dot-product attention: softmax(Q·Kᵀ / sqrt(d_k))·V (the scaling can be switched off to see why it is there). */
export function attention(Q: Mat, K: Mat, V: Mat, scaled = true): AttentionResult {
  const dk = Q[0].length;
  const raw = matmul(Q, transpose(K));
  const f = scaled ? 1 / Math.sqrt(dk) : 1;
  const scores = raw.map((r) => r.map((v) => v * f));
  const weights = scores.map(softmax);
  return { raw, scores, weights, output: matmul(weights, V) };
}

/** Average largest softmax weight over the rows of Q·Kᵀ of random Q, K (entries ~ N(0,1) via Box-Muller), with and
 *  without the 1/sqrt(d_k) scaling. Shows how the unscaled softmax saturates (largest weight near 1) as d_k grows. */
export function saturation(dk: number, n: number, seed: number, trials = 20): { scaled: number; unscaled: number } {
  const r = rng(seed);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  let a = 0;
  let b = 0;
  let cnt = 0;
  for (let t = 0; t < trials; t++) {
    const q = Array.from({ length: dk }, gauss);
    const keys = Array.from({ length: n }, () => Array.from({ length: dk }, gauss));
    const raw = keys.map((k) => dot(q, k));
    a += Math.max(...softmax(raw.map((v) => v / Math.sqrt(dk))));
    b += Math.max(...softmax(raw));
    cnt++;
  }
  return { scaled: a / cnt, unscaled: b / cnt };
}

/** Raw (unscaled) scores q·k of one random query against n random keys, entries ~ N(0,1). Their spread grows like sqrt(d_k). */
export function randomScores(dk: number, n: number, seed: number): Vec {
  const r = rng(seed);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const q = Array.from({ length: dk }, gauss);
  return Array.from({ length: n }, () => dot(q, Array.from({ length: dk }, gauss)));
}

/** Root-mean-square of the raw scores over many random draws (about sqrt(d_k)). */
export function scoreSpread(dk: number, seed: number, draws = 60, n = 8): number {
  let s = 0;
  let c = 0;
  for (let t = 0; t < draws; t++) for (const v of randomScores(dk, n, seed * 1000 + t)) { s += v * v; c++; }
  return Math.sqrt(s / c);
}

/** Decode a recorded attention tensor: uint8 = round(255*w), layers x heads x n x n, base64. Returns [layer][head][i][j]. */
export function decodeAttention(b64: string, layers: number, heads: number, n: number): number[][][][] {
  const bin = atob(b64);
  const out: number[][][][] = [];
  let p = 0;
  for (let l = 0; l < layers; l++) {
    const L: number[][][] = [];
    for (let h = 0; h < heads; h++) {
      const M: number[][] = [];
      for (let i = 0; i < n; i++) {
        const row: number[] = [];
        for (let j = 0; j < n; j++) row.push(bin.charCodeAt(p++) / 255);
        M.push(row);
      }
      L.push(M);
    }
    out.push(L);
  }
  return out;
}

/** Mean of several n x n attention maps (e.g. over the heads of one layer). */
export function meanMaps(maps: Mat[]): Mat {
  const n = maps[0].length;
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => maps.reduce((s, m) => s + m[i][j], 0) / maps.length));
}

/* ------------------------------------------------------------------ multi-head attention */

export interface HeadWeights { Wq: Mat; Wk: Mat; Wv: Mat }
export interface MultiHeadResult {
  heads: AttentionResult[];
  /** Concat(head_1..head_h), n x (h*d_k) = n x d. */
  concat: Mat;
  /** Concat · W_O, n x d. */
  output: Mat;
}

/** Toy multi-head attention with d = h·d_k: per-head projections (d x d_k) and the output projection W_O (d x d). */
export function multiHead(H: Mat, heads: HeadWeights[], Wo: Mat): MultiHeadResult {
  const res = heads.map((w) => attention(matmul(H, w.Wq), matmul(H, w.Wk), matmul(H, w.Wv)));
  const concat = H.map((_, i) => res.flatMap((r) => r.output[i]));
  return { heads: res, concat, output: matmul(concat, Wo) };
}

/** Seeded toy weights for `multiHead`: h heads of size d/h each, plus W_O. */
export function toyMultiHeadWeights(d: number, h: number, seed: number): { heads: HeadWeights[]; Wo: Mat } {
  const dk = d / h;
  const sc = 1 / Math.sqrt(d);
  return {
    heads: Array.from({ length: h }, (_, i) => ({
      Wq: randMat(d, dk, seed + 11 * i + 1, sc), Wk: randMat(d, dk, seed + 11 * i + 2, sc), Wv: randMat(d, dk, seed + 11 * i + 3, sc),
    })),
    Wo: randMat(d, d, seed + 999, sc),
  };
}

/* ------------------------------------------------------------------ feed-forward, GELU, layer norm */

/** erf with about 1e-13 accuracy: Taylor series for |x| < 3, continued fraction for the tail. */
export function erf(x: number): number {
  const ax = Math.abs(x);
  if (ax < 3) {
    let term = ax;
    let sum = ax;
    for (let n = 1; n < 80; n++) {
      term *= (-ax * ax) / n;
      sum += term / (2 * n + 1);
      if (Math.abs(term) < 1e-18) break;
    }
    return Math.sign(x) * (2 / Math.sqrt(Math.PI)) * sum;
  }
  // erfc(x) = exp(-x²)/sqrt(pi) · 1/(x + (1/2)/(x + 1/(x + (3/2)/(x + ...))))
  let f = ax;
  for (let k = 60; k >= 1; k--) f = ax + (k / 2) / f;
  const erfc = Math.exp(-ax * ax) / Math.sqrt(Math.PI) / f;
  return Math.sign(x) * (1 - erfc);
}

/** GELU, exact form: x · Φ(x) = x · 0.5 · (1 + erf(x / sqrt(2))). */
export const gelu = (x: number) => 0.5 * x * (1 + erf(x / Math.SQRT2));
/** GELU, tanh approximation used by some implementations. */
export const geluTanh = (x: number) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)));
export const relu = (x: number) => Math.max(0, x);

/** Layer normalisation of one vector: gamma · (x - mean) / sqrt(var + eps) + beta (biased variance, as in the paper). */
export function layerNorm(x: Vec, gamma?: Vec, beta?: Vec, eps = 1e-5): Vec {
  const mu = x.reduce((a, b) => a + b, 0) / x.length;
  const v = x.reduce((a, b) => a + (b - mu) ** 2, 0) / x.length;
  return x.map((a, i) => (gamma ? gamma[i] : 1) * ((a - mu) / Math.sqrt(v + eps)) + (beta ? beta[i] : 0));
}

export interface FfnResult { hidden: Vec; activated: Vec; output: Vec }
/** FFN(x) = GELU(x·W1 + b1)·W2 + b2 for one position. W1: d x ff, W2: ff x d. */
export function ffn(x: Vec, W1: Mat, b1: Vec, W2: Mat, b2: Vec, act: (v: number) => number = gelu): FfnResult {
  const hidden = b1.map((b, j) => b + x.reduce((s, v, i) => s + v * W1[i][j], 0));
  const activated = hidden.map(act);
  const output = b2.map((b, j) => b + activated.reduce((s, v, i) => s + v * W2[i][j], 0));
  return { hidden, activated, output };
}

/* ------------------------------------------------------------------ parameter counter */

export interface EncoderConfig {
  vocab: number;
  d: number;
  layers: number;
  heads: number;
  ff: number;
  /** Learned position embeddings (512 in BERT-type models). */
  maxPositions: number;
  /** BERT has a 2-row token-type (segment) embedding; DistilBERT drops it. */
  tokenTypes: boolean;
  /** The extra d→d dense layer before the classifier: the BERT pooler or the DistilBERT pre-classifier. */
  headDense: boolean;
  classes: number;
}
export interface CountPart { id: string; count: number }

export const BERT_TINY: EncoderConfig = { vocab: 30522, d: 128, layers: 2, heads: 2, ff: 512, maxPositions: 512, tokenTypes: true, headDense: true, classes: 2 };
export const BERT_SMALL: EncoderConfig = { vocab: 30522, d: 512, layers: 4, heads: 8, ff: 2048, maxPositions: 512, tokenTypes: true, headDense: true, classes: 2 };
export const DISTILBERT: EncoderConfig = { vocab: 30522, d: 768, layers: 6, heads: 12, ff: 3072, maxPositions: 512, tokenTypes: false, headDense: true, classes: 2 };

/** Parameters of the attention sub-layer of one encoder layer: W_Q, W_K, W_V and W_O, each d x d plus a bias of d. */
export const attentionParams = (d: number) => 4 * (d * d + d);
/** Parameters of the feed-forward sub-layer: d x ff and ff x d weights plus both biases. */
export const ffnParams = (d: number, ff: number) => d * ff + ff + ff * d + d;
/** Layer norm: gamma and beta. */
export const lnParams = (d: number) => 2 * d;

/** The parts of the total for a BERT-style encoder with a classification head, in reading order. */
export function paramBreakdown(c: EncoderConfig): CountPart[] {
  const parts: CountPart[] = [
    { id: "word", count: c.vocab * c.d },
    { id: "pos", count: c.maxPositions * c.d },
  ];
  if (c.tokenTypes) parts.push({ id: "type", count: 2 * c.d });
  parts.push({ id: "embLn", count: lnParams(c.d) });
  parts.push({ id: "attn", count: c.layers * attentionParams(c.d) });
  parts.push({ id: "ln1", count: c.layers * lnParams(c.d) });
  parts.push({ id: "ffn", count: c.layers * ffnParams(c.d, c.ff) });
  parts.push({ id: "ln2", count: c.layers * lnParams(c.d) });
  if (c.headDense) parts.push({ id: "dense", count: c.d * c.d + c.d });
  parts.push({ id: "cls", count: c.classes * c.d + c.classes });
  return parts;
}
export const paramTotal = (c: EncoderConfig) => paramBreakdown(c).reduce((s, p) => s + p.count, 0);

/* ------------------------------------------------------------------ complexity */

/** Multiply-adds of one self-attention layer: n²·d (scores and weighted sum, constant factors dropped). */
export const attentionOps = (n: number, d: number) => n * n * d;
/** Multiply-adds of one recurrent layer: n·d². */
export const recurrentOps = (n: number, d: number) => n * d * d;
/** Sequential steps that cannot be parallelised: 1 for self-attention, n for a recurrent layer. */
export const sequentialSteps = (n: number, kind: "attention" | "recurrent") => (kind === "attention" ? 1 : n);

/* ------------------------------------------------------------------ training */

export interface MaskResult {
  /** The corrupted input. */
  input: string[];
  /** Positions that were selected (15 %), i.e. the ones the loss is computed on. */
  selected: number[];
  /** What happened to each selected position. */
  action: Record<number, "mask" | "random" | "keep">;
}

/** BERT's masked-language-model corruption: select each (non-special) token with probability `rate`; of the selected,
 *  80 % become [MASK], 10 % a random token, 10 % stay unchanged. Seeded, so reproducible. At least one token is always selected. */
export function maskTokens(tokens: string[], vocab: string[], seed: number, rate = 0.15): MaskResult {
  const r = rng(seed);
  const eligible = tokens.map((t, i) => (t === "[CLS]" || t === "[SEP]" ? -1 : i)).filter((i) => i >= 0);
  let selected = eligible.filter(() => r() < rate);
  if (selected.length === 0 && eligible.length) selected = [eligible[Math.floor(r() * eligible.length)]];
  const input = [...tokens];
  const action: MaskResult["action"] = {};
  for (const i of selected) {
    const u = r();
    if (u < 0.8) { input[i] = "[MASK]"; action[i] = "mask"; }
    else if (u < 0.9) { input[i] = vocab[Math.floor(r() * vocab.length)]; action[i] = "random"; }
    else action[i] = "keep";
  }
  return { input, selected, action };
}

/** Cross-entropy of a probability vector against the true class index: -ln p[y]. */
export const crossEntropy = (p: Vec, y: number) => -Math.log(p[y]);

/** [CLS] classification head: logits = W·h + b (W: classes x d), probabilities = softmax(logits). */
export function classify(h: Vec, W: Mat, b: Vec): { logits: Vec; probs: Vec } {
  const logits = W.map((row, c) => b[c] + dot(row, h));
  return { logits, probs: softmax(logits) };
}

/** Linear warm-up to `peak` over the first `warmFrac` of the steps, then linear decay to 0 (HF get_linear_schedule_with_warmup). */
export function lrAt(step: number, total: number, peak: number, warmFrac = 0.1): number {
  const warm = Math.max(1, Math.round(total * warmFrac));
  if (step < warm) return (peak * step) / warm;
  return Math.max(0, (peak * (total - step)) / Math.max(1, total - warm));
}
export const lrSchedule = (total: number, peak: number, warmFrac = 0.1) => Array.from({ length: total + 1 }, (_, s) => lrAt(s, total, peak, warmFrac));

/** Optimizer steps of a fine-tuning run: ceil(examples / batch) per epoch, times the epochs. */
export const totalSteps = (examples: number, batch: number, epochs: number) => Math.ceil(examples / batch) * epochs;

export interface AdamState { m: number; v: number; t: number }
/** One AdamW step for one parameter (the paper's equations): decoupled weight decay λ·θ, bias-corrected moments. */
export function adamwStep(theta: number, g: number, st: AdamState, lr: number, wd = 0.01, b1 = 0.9, b2 = 0.999, eps = 1e-8): { theta: number; state: AdamState; mhat: number; vhat: number } {
  const t = st.t + 1;
  const m = b1 * st.m + (1 - b1) * g;
  const v = b2 * st.v + (1 - b2) * g * g;
  const mhat = m / (1 - b1 ** t);
  const vhat = v / (1 - b2 ** t);
  return { theta: theta - lr * (mhat / (Math.sqrt(vhat) + eps) + wd * theta), state: { m, v, t }, mhat, vhat };
}

/** Global-norm gradient clipping: scale the gradient so that its norm is at most maxNorm. */
export function clipNorm(g: Vec, maxNorm = 1): { g: Vec; norm: number; scale: number } {
  const norm = Math.sqrt(g.reduce((s, v) => s + v * v, 0));
  const scale = norm > maxNorm ? maxNorm / norm : 1;
  return { g: g.map((v) => v * scale), norm, scale };
}

/** The fine-tuning hyper-parameters of the paper (its Table "Fine-tuning hyper-parameters"). */
export const HPARAMS = [
  { model: "BERT-tiny", layers: 2, d: 128, heads: 2, examples: 8000, epochs: 3, peak: 2e-4, batch: 32, maxLen: 64 },
  { model: "BERT-small", layers: 4, d: 512, heads: 8, examples: 8000, epochs: 3, peak: 1e-4, batch: 32, maxLen: 64 },
  { model: "DistilBERT", layers: 6, d: 768, heads: 12, examples: 8000, epochs: 2, peak: 5e-5, batch: 32, maxLen: 64 },
] as const;

/* ------------------------------------------------------------------ toy WordPiece and embeddings */

/** A small TOY vocabulary for the greedy WordPiece demo. It is NOT the DistilBERT vocabulary (about 30 000 pieces). */
export const TOY_VOCAB: string[] = [
  "the", "a", "an", "is", "was", "not", "good", "bad", "plot", "acting", "film", "movie", "but", "and", "very", "great", "brilliant", "boring",
  "watch", "un", "##watch", "##able", "##ing", "##ed", "##s", "##ly", "play", "##er", "trans", "##form", "##ers", "token", "##ise",
  "love", "hate", "this", "that", "it", "i", ",", ".", "!", "?", "'", "-",
];

/** Greedy longest-match-first WordPiece for one word (the BERT algorithm, over a given vocabulary). Unknown words give [UNK]. */
export function wordpiece(word: string, vocab: string[]): string[] {
  const set = new Set(vocab);
  const pieces: string[] = [];
  let start = 0;
  while (start < word.length) {
    let end = word.length;
    let cur: string | null = null;
    while (start < end) {
      const sub = (start > 0 ? "##" : "") + word.slice(start, end);
      if (set.has(sub)) { cur = sub; break; }
      end--;
    }
    if (cur === null) return ["[UNK]"];
    pieces.push(cur);
    start = end;
  }
  return pieces;
}

/** Split a sentence into words and punctuation (lower-cased, as in bert-base-uncased), then WordPiece each word; adds [CLS] and [SEP]. */
export function tokenizeToy(text: string, vocab: string[]): string[] {
  const words = text.toLowerCase().match(/[a-z0-9]+|[^\sa-z0-9]/g) ?? [];
  return ["[CLS]", ...words.flatMap((w) => wordpiece(w, vocab)), "[SEP]"];
}

/** Seeded random embedding table for a list of token strings (rows are d-dimensional). */
export function toyEmbeddings(tokens: string[], d: number, seed: number): Mat {
  return tokens.map((t) => {
    let h = seed;
    for (let i = 0; i < t.length; i++) h = (Math.imul(h, 31) + t.charCodeAt(i)) >>> 0;
    const r = rng(h);
    return Array.from({ length: d }, () => Math.round((r() * 2 - 1) * 100) / 100);
  });
}
