import type { Optimizer } from "../types";

/** Tiny re-implementation of the backend optimizers for the Learning Center's toy valley.
 *  Same update rules as backend/app/nn.py (checked against the same hand-computed values in the tests). */
export interface Opt {
  step(p: number[], g: number[]): void;
}

const zeros = (n: number) => new Array<number>(n).fill(0);

export function makeOpt(name: Optimizer, lr: number, n = 2): Opt {
  const v = zeros(n), s = zeros(n), m = zeros(n), ed = zeros(n);
  let t = 0;
  const b1 = 0.9, b2 = 0.999;
  return {
    step(p, g) {
      t++;
      for (let i = 0; i < n; i++) {
        switch (name) {
          case "sgd": p[i] -= lr * g[i]; break;
          case "momentum": v[i] = 0.9 * v[i] + lr * g[i]; p[i] -= v[i]; break;
          case "nesterov": v[i] = 0.9 * v[i] + lr * g[i]; p[i] -= 0.9 * v[i] + lr * g[i]; break;
          case "adagrad": s[i] += g[i] * g[i]; p[i] -= (lr * g[i]) / (Math.sqrt(s[i]) + 1e-7); break;
          case "rmsprop": s[i] = 0.9 * s[i] + 0.1 * g[i] * g[i]; p[i] -= (lr * g[i]) / (Math.sqrt(s[i]) + 1e-7); break;
          case "adadelta": {
            s[i] = 0.95 * s[i] + 0.05 * g[i] * g[i];
            const d = (-Math.sqrt(ed[i] + 1e-6) / Math.sqrt(s[i] + 1e-6)) * g[i];
            ed[i] = 0.95 * ed[i] + 0.05 * d * d;
            p[i] += lr * d;
            break;
          }
          case "adam":
          case "nadam": {
            m[i] = b1 * m[i] + (1 - b1) * g[i];
            v[i] = b2 * v[i] + (1 - b2) * g[i] * g[i];
            const mh = m[i] / (1 - b1 ** t), vh = v[i] / (1 - b2 ** t);
            const num = name === "adam" ? mh : b1 * mh + ((1 - b1) / (1 - b1 ** t)) * g[i];
            p[i] -= (lr * num) / (Math.sqrt(vh) + 1e-8);
            break;
          }
        }
      }
    },
  };
}

/** The toy loss valley used by the Learning Center: steep in y, flat in x. */
export const valleyLoss = (p: number[]) => 0.5 * (p[0] * p[0] + 10 * p[1] * p[1]);
export const valleyGrad = (p: number[]) => [p[0], 10 * p[1]];
export const VALLEY_START: [number, number] = [-4.2, 1.5];

/** Learning rates measured to work on this particular valley within 400 steps (not on real problems).
 *  Adadelta needs the largest rate and the most steps: its running average of past updates starts at zero. */
export const VALLEY_RATES: Record<Optimizer, number> = {
  sgd: 0.1, momentum: 0.02, nesterov: 0.05, adagrad: 1.0, rmsprop: 0.1, adadelta: 5, adam: 0.15, nadam: 0.3,
};

export interface Run { path: [number, number][]; loss: number; ok: boolean }

export function race(names: Optimizer[], lrOf: (n: Optimizer) => number, steps: number): Record<string, Run> {
  const out: Record<string, Run> = {};
  for (const name of names) {
    const p: number[] = [...VALLEY_START];
    const opt = makeOpt(name, lrOf(name));
    const path: [number, number][] = [[p[0], p[1]]];
    let ok = true;
    for (let k = 0; k < steps && ok; k++) {
      opt.step(p, valleyGrad(p));
      path.push([p[0], p[1]]);
      if (!Number.isFinite(valleyLoss(p)) || valleyLoss(p) > 1e6) ok = false;
    }
    out[name] = { path, loss: valleyLoss(p), ok };
  }
  return out;
}
