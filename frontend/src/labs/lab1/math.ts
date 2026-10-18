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
