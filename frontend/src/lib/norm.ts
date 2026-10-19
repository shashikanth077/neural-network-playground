import { mulberry32 } from "../labs/lab1/math";

export const meanOf = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
export const varOf = (a: number[]) => {
  const m = meanOf(a);
  return a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length;
};

/** Batch normalisation of one feature over a mini-batch: x̂ = (x − μ)/√(σ² + ε), y = γ·x̂ + β. */
export function batchNorm(x: number[], gamma = 1, beta = 0, eps = 1e-5) {
  const mu = meanOf(x);
  const v = varOf(x);
  const xhat = x.map((a) => (a - mu) / Math.sqrt(v + eps));
  return { mu, variance: v, xhat, y: xhat.map((a) => gamma * a + beta) };
}

/** Seeded Gaussian samples (Box–Muller) so demos are reproducible. */
export function gaussian(n: number, mean: number, sd: number, seed: number) {
  const r = mulberry32(seed);
  return Array.from({ length: n }, () => mean + sd * Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r()));
}

/** Inverted dropout mask: each unit is kept with probability 1 − rate and scaled by 1/(1 − rate). */
export function dropoutMask(n: number, rate: number, rand: () => number) {
  return Array.from({ length: n }, () => (rand() >= rate ? 1 / (1 - rate) : 0));
}
