/** Numerical helpers behind every Lab 1 demo. Pure functions: no DOM, easy to test. */

export const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;

export const median = (a: number[]) => {
  const b = [...a].sort((x, y) => x - y);
  const m = b.length >> 1;
  return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2;
};

/** Standard deviation; `ddof` 1 = sample (n-1), 0 = population (n). */
export const std = (a: number[], ddof = 1) => {
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - ddof));
};

/** Linear-interpolated percentile (same convention as numpy.percentile). */
export const percentile = (a: number[], p: number) => {
  const b = [...a].sort((x, y) => x - y);
  const i = ((b.length - 1) * p) / 100;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return b[lo] + (b[hi] - b[lo]) * (i - lo);
};

/** Complementary error function (Numerical Recipes rational approximation, |error| < 1.2e-7). */
export function erfc(x: number): number {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  // Horner form of the polynomial in t (coefficients from Numerical Recipes, erfcc)
  const poly = [-1.26551223, 1.00002368, 0.37409196, 0.09678418, -0.18628806, 0.27886807, -1.13520398, 1.48851587, -0.82215223, 0.17087277];
  let acc = 0;
  for (let i = poly.length - 1; i >= 0; i--) acc = poly[i] + t * acc;
  const r = t * Math.exp(-z * z + acc);
  return x >= 0 ? r : 2 - r;
}

// ------------------------------------------------------------------ Task 1
export type Patient = [gender: 0 | 1, height: number | null];

export function impute(patients: Patient[], method: "mean" | "median", scope: "group" | "all", gender: 0 | 1 = 0) {
  const pool = patients
    .filter(([g, h]) => h !== null && (scope === "all" || g === gender))
    .map(([, h]) => h as number);
  return { pool, value: method === "mean" ? mean(pool) : median(pool) };
}

// ------------------------------------------------------------- Tasks 2-4
export type AnomalyMethod = "z" | "chauvenet" | "iqr";

export interface AnomalyResult {
  flagged: number[];
  mu: number;
  sigma: number;
  /** Method-specific numbers used by the UI explanation. */
  detail: { zOfSuspect?: number; nP?: number; zCritical?: number; q1?: number; q3?: number; iqr?: number; low?: number; high?: number };
}

/** Chauvenet criterion: reject x when n * P(|Z| >= z) < 0.5. */
export const chauvenetP = (x: number, mu: number, sigma: number, n: number) =>
  n * erfc(Math.abs(x - mu) / sigma / Math.SQRT2);

export function detectAnomalies(values: number[], method: AnomalyMethod, zThreshold = 3, suspect = 10): AnomalyResult {
  const n = values.length;
  const mu = mean(values);
  const sigma = std(values);
  const flagged: number[] = [];
  const detail: AnomalyResult["detail"] = {};
  if (method === "z") {
    values.forEach((x, i) => {
      if (Math.abs((x - mu) / sigma) > zThreshold) flagged.push(i);
    });
    detail.zOfSuspect = (values[suspect] - mu) / sigma;
  } else if (method === "chauvenet") {
    values.forEach((x, i) => {
      if (chauvenetP(x, mu, sigma, n) < 0.5) flagged.push(i);
    });
    detail.nP = chauvenetP(values[suspect], mu, sigma, n);
    let lo = 0;
    let hi = 6;
    for (let k = 0; k < 50; k++) {
      const mid = (lo + hi) / 2;
      if (n * erfc(mid / Math.SQRT2) < 0.5) hi = mid;
      else lo = mid;
    }
    detail.zCritical = hi;
  } else {
    const q1 = percentile(values, 25);
    const q3 = percentile(values, 75);
    const iqr = q3 - q1;
    detail.q1 = q1;
    detail.q3 = q3;
    detail.iqr = iqr;
    detail.low = q1 - 1.5 * iqr;
    detail.high = q3 + 1.5 * iqr;
    values.forEach((x, i) => {
      if (x < detail.low! || x > detail.high!) flagged.push(i);
    });
  }
  return { flagged, mu, sigma, detail };
}

// --------------------------------------------------------------- scaling
export const minMax = (a: number[]) => {
  const lo = Math.min(...a);
  const hi = Math.max(...a);
  return a.map((x) => (x - lo) / (hi - lo));
};
export const standardize = (a: number[]) => {
  const m = mean(a);
  const s = std(a, 0);
  return a.map((x) => (x - m) / s);
};

// ------------------------------------------------- Task 5: the 2-2-1 net
export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

/** Small deterministic PRNG (mulberry32) so a "random start" can be reproduced from its seed. */
export function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class SmallNet {
  w1: number[][];
  b1: number[];
  w2: number[];
  b2: number;
  lossHistory: number[] = [];

  constructor(seed: number) {
    const r = mulberry32(seed);
    const u = () => r() * 2 - 1;
    this.w1 = [[u(), u()], [u(), u()]];
    this.b1 = [u(), u()];
    this.w2 = [u(), u()];
    this.b2 = u();
  }

  forward(x: number[]): { h: number[]; out: number } {
    const h = [
      sigmoid(x[0] * this.w1[0][0] + x[1] * this.w1[1][0] + this.b1[0]),
      sigmoid(x[0] * this.w1[0][1] + x[1] * this.w1[1][1] + this.b1[1]),
    ];
    return { h, out: sigmoid(h[0] * this.w2[0] + h[1] * this.w2[1] + this.b2) };
  }

  /** Online SGD with the squared-error loss, exactly as written in the lab notebook. */
  train(X: number[][], Y: number[], lr: number, epochs: number): void {
    for (let e = 0; e < epochs; e++) {
      for (let i = 0; i < X.length; i++) {
        const x = X[i];
        const { h, out } = this.forward(x);
        const dOut = (out - Y[i]) * out * (1 - out);
        const dHid = [dOut * this.w2[0] * h[0] * (1 - h[0]), dOut * this.w2[1] * h[1] * (1 - h[1])];
        this.w2[0] -= lr * dOut * h[0];
        this.w2[1] -= lr * dOut * h[1];
        this.b2 -= lr * dOut;
        for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) this.w1[a][b] -= lr * x[a] * dHid[b];
        this.b1[0] -= lr * dHid[0];
        this.b1[1] -= lr * dHid[1];
      }
      this.lossHistory.push(X.reduce((s, x, i) => s + (this.forward(x).out - Y[i]) ** 2, 0) / X.length);
    }
  }

  accuracy(X: number[][], Y: number[]): number {
    return X.filter((x, i) => (this.forward(x).out > 0.5 ? 1 : 0) === Y[i]).length / X.length;
  }
}

// ---------------------------------------------------------------- softmax
export function softmax(logits: number[]): number[] {
  const mx = Math.max(...logits);
  const ex = logits.map((v) => Math.exp(v - mx));
  const sum = ex.reduce((a, b) => a + b, 0);
  return ex.map((v) => v / sum);
}

// ------------------------------------------------------------- activations
export const ACTIVATIONS = {
  sigmoid: { f: sigmoid, d: (x: number) => sigmoid(x) * (1 - sigmoid(x)) },
  tanh: { f: Math.tanh, d: (x: number) => 1 - Math.tanh(x) ** 2 },
  relu: { f: (x: number) => Math.max(0, x), d: (x: number) => (x > 0 ? 1 : 0) },
} as const;
export type ActivationName = keyof typeof ACTIVATIONS;

// --------------------------------------------------------- optimizer lab
export type OptName = "sgd" | "rms" | "adam";
export interface OptRun {
  path: [number, number][];
  loss: number;
  ok: boolean;
}

/** Loss valley f = 0.5 (x^2 + 10 y^2): steep in y, flat in x. All optimizers start from the same point. */
export function optimizerPaths(lr: number, steps: number): Record<OptName, OptRun> {
  const f = (p: number[]) => 0.5 * (p[0] * p[0] + 10 * p[1] * p[1]);
  const g = (p: number[]) => [p[0], 10 * p[1]];
  const start: [number, number] = [-4.2, 1.5];
  const result = {} as Record<OptName, OptRun>;
  (["sgd", "rms", "adam"] as OptName[]).forEach((k) => {
    const p: number[] = [...start];
    const s = [0, 0];
    const m = [0, 0];
    const v = [0, 0];
    const path: [number, number][] = [[p[0], p[1]]];
    let ok = true;
    for (let t = 1; t <= steps && ok; t++) {
      const gr = g(p);
      for (let i = 0; i < 2; i++) {
        if (k === "sgd") p[i] -= lr * gr[i];
        if (k === "rms") {
          s[i] = 0.9 * s[i] + 0.1 * gr[i] * gr[i];
          p[i] -= (lr * gr[i]) / (Math.sqrt(s[i]) + 1e-7);
        }
        if (k === "adam") {
          m[i] = 0.9 * m[i] + 0.1 * gr[i];
          v[i] = 0.999 * v[i] + 0.001 * gr[i] * gr[i];
          p[i] -= (lr * (m[i] / (1 - 0.9 ** t))) / (Math.sqrt(v[i] / (1 - 0.999 ** t)) + 1e-8);
        }
      }
      path.push([p[0], p[1]]);
      if (!isFinite(f(p)) || f(p) > 1e6) ok = false;
    }
    result[k] = { path, loss: f(p), ok };
  });
  return result;
}

// =====================================================================================
// Interactive-lab helpers (added for the hands-on widgets). Each has a unit test whose
// expected numbers were computed independently with NumPy / Python's math module.
// =====================================================================================

// ---------------------------------------------------------- Task 1: groups
export interface GroupStats { n: number; mean: number; median: number; min: number; max: number; sum: number }

/** Summary of the known heights of one gender (or of everyone when `gender` is "all"). */
export function groupStats(patients: Patient[], gender: 0 | 1 | "all"): GroupStats {
  const pool = patients.filter(([g, h]) => h !== null && (gender === "all" || g === gender)).map(([, h]) => h as number);
  if (!pool.length) return { n: 0, mean: NaN, median: NaN, min: NaN, max: NaN, sum: 0 };
  return { n: pool.length, mean: mean(pool), median: median(pool), min: Math.min(...pool), max: Math.max(...pool), sum: pool.reduce((a, b) => a + b, 0) };
}

// ------------------------------------------------------ Tasks 2-4: per point
export interface PointReport {
  x: number; mu: number; sigma: number; z: number; nP: number;
  q1: number; q3: number; low: number; high: number;
  zFlag: boolean; chauvenetFlag: boolean; iqrFlag: boolean;
}

/** Every number the three rules use for the value at index `i`, with the same conventions as detectAnomalies. */
export function pointReport(values: number[], i: number, zThreshold = 3): PointReport {
  const n = values.length;
  const mu = mean(values);
  const sigma = std(values);
  const x = values[i];
  const z = (x - mu) / sigma;
  const nP = chauvenetP(x, mu, sigma, n);
  const q1 = percentile(values, 25);
  const q3 = percentile(values, 75);
  const low = q1 - 1.5 * (q3 - q1);
  const high = q3 + 1.5 * (q3 - q1);
  return { x, mu, sigma, z, nP, q1, q3, low, high, zFlag: Math.abs(z) > zThreshold, chauvenetFlag: nP < 0.5, iqrFlag: x < low || x > high };
}

// ------------------------------------------------------------- scaling
export const scaleMinMax = (x: number, lo: number, hi: number) => (x - lo) / (hi - lo);
export const scaleZ = (x: number, mu: number, sigma: number) => (x - mu) / sigma;
/** Min, max, mean and population std of a feature: the numbers a scaler must remember from the training data. */
export const featureStats = (a: number[]) => ({ min: Math.min(...a), max: Math.max(...a), mean: mean(a), std: std(a, 0) });

// ------------------------------------------- Task 5: the 2-2-1 net as plain numbers
export interface NetParams { w1: number[][]; b1: number[]; w2: number[]; b2: number }

export const netParamsOf = (n: NetParams): NetParams => ({
  w1: n.w1.map((r) => [...r]), b1: [...n.b1], w2: [...n.w2], b2: n.b2,
});

export function forwardParams(p: NetParams, x: number[]) {
  const z1 = [x[0] * p.w1[0][0] + x[1] * p.w1[1][0] + p.b1[0], x[0] * p.w1[0][1] + x[1] * p.w1[1][1] + p.b1[1]];
  const h = z1.map(sigmoid);
  const zo = h[0] * p.w2[0] + h[1] * p.w2[1] + p.b2;
  return { z1, h, zo, out: sigmoid(zo) };
}

/** Gradients of the per-sample loss ½(out − y)², the quantity the lab's backward pass differentiates. */
export function gradients(p: NetParams, x: number[], y: number) {
  const f = forwardParams(p, x);
  const error = f.out - y;
  const dOut = error * f.out * (1 - f.out);
  const dHid = [dOut * p.w2[0] * f.h[0] * (1 - f.h[0]), dOut * p.w2[1] * f.h[1] * (1 - f.h[1])];
  return {
    ...f, y, error, loss: 0.5 * error * error, dOut, dHid,
    gw2: [dOut * f.h[0], dOut * f.h[1]], gb2: dOut,
    gw1: [[x[0] * dHid[0], x[0] * dHid[1]], [x[1] * dHid[0], x[1] * dHid[1]]],
    gb1: [dHid[0], dHid[1]],
  };
}

/** One plain gradient-descent update on one sample; returns the new parameters (the input is not modified). */
export function sgdStep(p: NetParams, x: number[], y: number, lr: number) {
  const g = gradients(p, x, y);
  const next: NetParams = {
    w1: p.w1.map((r, a) => r.map((v, b) => v - lr * g.gw1[a][b])),
    b1: p.b1.map((v, b) => v - lr * g.gb1[b]),
    w2: p.w2.map((v, b) => v - lr * g.gw2[b]),
    b2: p.b2 - lr * g.gb2,
  };
  return { params: next, grads: g };
}

export interface TraceStep { id: string; phase: "forward" | "backward" | "update"; expr: string; value: number }

const r4 = (v: number) => (Math.abs(v) < 5e-5 && v !== 0 ? v.toExponential(2) : v.toFixed(4)).replace(/^-/, "−");
const sg = (v: number) => (v < 0 ? `(${r4(v)})` : r4(v));

/** The whole forward + backward pass + update as an ordered list of single calculations, numbers filled in. */
export function netTrace(p: NetParams, x: number[], y: number, lr: number): TraceStep[] {
  const g = gradients(p, x, y);
  const u = sgdStep(p, x, y, lr).params;
  const T: TraceStep[] = [];
  const add = (id: string, phase: TraceStep["phase"], expr: string, value: number) => T.push({ id, phase, expr, value });
  [0, 1].forEach((j) => add(`z${j + 1}`, "forward", `z${j + 1} = ${sg(x[0])}·${sg(p.w1[0][j])} + ${sg(x[1])}·${sg(p.w1[1][j])} + ${sg(p.b1[j])} = ${r4(g.z1[j])}`, g.z1[j]));
  [0, 1].forEach((j) => add(`h${j + 1}`, "forward", `h${j + 1} = sigmoid(${r4(g.z1[j])}) = ${r4(g.h[j])}`, g.h[j]));
  add("zo", "forward", `z_out = ${r4(g.h[0])}·${sg(p.w2[0])} + ${r4(g.h[1])}·${sg(p.w2[1])} + ${sg(p.b2)} = ${r4(g.zo)}`, g.zo);
  add("out", "forward", `out = sigmoid(${r4(g.zo)}) = ${r4(g.out)}`, g.out);
  add("loss", "forward", `loss = ½·(${r4(g.out)} − ${y})² = ${r4(g.loss)}`, g.loss);
  add("dOut", "backward", `d_out = (out − y)·out·(1 − out) = (${r4(g.out)} − ${y})·${r4(g.out)}·${r4(1 - g.out)} = ${r4(g.dOut)}`, g.dOut);
  [0, 1].forEach((j) => add(`dH${j + 1}`, "backward", `d_h${j + 1} = d_out·w_out${j + 1}·h${j + 1}·(1 − h${j + 1}) = ${sg(g.dOut)}·${sg(p.w2[j])}·${r4(g.h[j])}·${r4(1 - g.h[j])} = ${r4(g.dHid[j])}`, g.dHid[j]));
  [0, 1].forEach((j) => add(`gw2_${j + 1}`, "backward", `∂loss/∂w_out${j + 1} = d_out·h${j + 1} = ${sg(g.dOut)}·${r4(g.h[j])} = ${r4(g.gw2[j])}`, g.gw2[j]));
  add("gb2", "backward", `∂loss/∂b_out = d_out = ${r4(g.gb2)}`, g.gb2);
  [0, 1].forEach((a) => [0, 1].forEach((b) => add(`gw1_${a}${b}`, "backward", `∂loss/∂w(${a ? "weight" : "height"}→h${b + 1}) = ${r4(x[a])}·${sg(g.dHid[b])} = ${r4(g.gw1[a][b])}`, g.gw1[a][b])));
  [0, 1].forEach((j) => add(`gb1_${j + 1}`, "backward", `∂loss/∂b_h${j + 1} = d_h${j + 1} = ${r4(g.gb1[j])}`, g.gb1[j]));
  [0, 1].forEach((a) => [0, 1].forEach((b) => add(`u_w1_${a}${b}`, "update", `w(${a ? "weight" : "height"}→h${b + 1}): ${sg(p.w1[a][b])} − ${lr}·${sg(g.gw1[a][b])} = ${r4(u.w1[a][b])}`, u.w1[a][b])));
  [0, 1].forEach((j) => add(`u_b1_${j + 1}`, "update", `b_h${j + 1}: ${sg(p.b1[j])} − ${lr}·${sg(g.gb1[j])} = ${r4(u.b1[j])}`, u.b1[j]));
  [0, 1].forEach((j) => add(`u_w2_${j + 1}`, "update", `w_out${j + 1}: ${sg(p.w2[j])} − ${lr}·${sg(g.gw2[j])} = ${r4(u.w2[j])}`, u.w2[j]));
  add("u_b2", "update", `b_out: ${sg(p.b2)} − ${lr}·${sg(g.gb2)} = ${r4(u.b2)}`, u.b2);
  return T;
}

/** Scale a raw height/weight with the TRAINING min and max (new data never gets its own min/max) and classify it. */
export function predictRaw(p: NetParams, height: number, weight: number, hs: { min: number; max: number }, ws: { min: number; max: number }) {
  const x = [scaleMinMax(height, hs.min, hs.max), scaleMinMax(weight, ws.min, ws.max)];
  const out = forwardParams(p, x).out;
  return { x, pMale: out, pFemale: 1 - out, label: out > 0.5 ? ("male" as const) : ("female" as const) };
}

// -------------------------------------------------- MNIST: dense layers
export interface Dense { w: number[][]; b: number[] }

/** Fully connected stack with Glorot-uniform weights and zero biases, reproducible from `seed`. */
export function randomMlp(sizes: number[], seed: number): Dense[] {
  const r = mulberry32(seed);
  return sizes.slice(1).map((out, l) => {
    const inn = sizes[l];
    const lim = Math.sqrt(6 / (inn + out));
    return { w: Array.from({ length: inn }, () => Array.from({ length: out }, () => (r() * 2 - 1) * lim)), b: new Array(out).fill(0) };
  });
}

/** relu on every hidden layer, softmax on the last; returns the activation of every layer and the probabilities. */
export function mlpForward(layers: Dense[], x: number[]) {
  let a = x;
  const acts: number[][] = [x];
  let logits: number[] = [];
  layers.forEach((L, li) => {
    const z = L.b.map((bias, j) => { let s = bias; for (let i = 0; i < a.length; i++) s += a[i] * L.w[i][j]; return s; });
    const last = li === layers.length - 1;
    if (last) logits = z;
    a = last ? z : z.map((v) => Math.max(0, v));
    acts.push(a);
  });
  return { acts, logits, probs: softmax(logits) };
}

/** inputs × neurons + neurons for every layer. */
export const paramCount = (sizes: number[]) => sizes.slice(1).reduce((s, n, i) => s + sizes[i] * n + n, 0);

// ----------------------------------------------- activation chain (6.2)
/** Best-case gradient that survives `layers` identical layers: f′(x)^layers (all weights taken as 1). */
export const chainGradient = (name: ActivationName, x: number, layers: number) => ACTIVATIONS[name].d(x) ** layers;

// ---------------------------------------------------- optimizer challenge
/** The valley loss f = ½(x² + 10y²) used by optimizerPaths. */
export const valleyLoss = (p: [number, number]) => 0.5 * (p[0] * p[0] + 10 * p[1] * p[1]);

/** Index of the first step whose loss is below `target`, or −1 if the run never gets there. */
export const stepsToLoss = (run: OptRun, target: number) => run.path.findIndex((p) => valleyLoss(p) < target);
