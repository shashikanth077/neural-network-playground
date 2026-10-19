import { makeOpt, race, valleyLoss, VALLEY_RATES, VALLEY_START } from "../lib/optimizers";
import type { Optimizer } from "../types";

const quad = (name: Optimizer, lr: number, steps = 1, w0 = 2) => {
  const p = [w0];
  const o = makeOpt(name, lr, 1);
  for (let i = 0; i < steps; i++) o.step(p, [2 * p[0]]);
  return p[0];
};

describe("toy optimizers match the backend's hand-computed values", () => {
  it("sgd", () => expect(quad("sgd", 0.1)).toBeCloseTo(2 - 0.1 * 4, 12));
  it("momentum (two steps)", () => {
    const lr = 0.1, g = 0.9, g1 = 4, v1 = lr * g1, w1 = 2 - v1, v2 = g * v1 + lr * 2 * w1;
    expect(quad("momentum", lr, 2)).toBeCloseTo(w1 - v2, 12);
  });
  it("nesterov (two steps)", () => {
    const lr = 0.1, g = 0.9, g1 = 4, v1 = lr * g1, w1 = 2 - (g * v1 + lr * g1);
    const g2 = 2 * w1, v2 = g * v1 + lr * g2;
    expect(quad("nesterov", lr, 2)).toBeCloseTo(w1 - (g * v2 + lr * g2), 12);
  });
  it("adagrad first step is about lr", () => expect(2 - quad("adagrad", 0.1)).toBeCloseTo(0.1, 5));
  it("rmsprop", () => {
    const v = 0.1 * 16;
    expect(2 - quad("rmsprop", 0.01)).toBeCloseTo((0.01 * 4) / (Math.sqrt(v) + 1e-7), 10);
  });
  it("adadelta", () => {
    const eg = 0.05 * 16;
    expect(quad("adadelta", 1)).toBeCloseTo(2 + (-Math.sqrt(1e-6) / Math.sqrt(eg + 1e-6)) * 4, 10);
  });
  it("adam moves lr per step; nadam moves (1+beta1) times lr", () => {
    expect(2 - quad("adam", 0.01)).toBeCloseTo(0.01, 6);
    expect(2 - quad("nadam", 0.01)).toBeCloseTo(0.019, 6);
  });
});

describe("valley race", () => {
  const all: Optimizer[] = ["sgd", "momentum", "nesterov", "adagrad", "rmsprop", "adadelta", "adam", "nadam"];
  it("every optimizer makes real progress at its toy-valley rate (Adadelta needs ~400 steps)", () => {
    const start = valleyLoss(VALLEY_START);
    const r = race(all, (n) => VALLEY_RATES[n], 400);
    for (const n of all) {
      expect(r[n].ok).toBe(true);
      expect(r[n].loss).toBeLessThan(start * 0.1);
    }
  });
  it("Adadelta is slow to warm up: after 80 steps it has barely moved", () => {
    expect(race(["adadelta"], () => 1, 80).adadelta.loss).toBeGreaterThan(valleyLoss(VALLEY_START) * 0.5);
  });
  it("a huge shared SGD rate diverges", () => {
    expect(race(["sgd"], () => 0.5, 60).sgd.ok).toBe(false);
  });
});
