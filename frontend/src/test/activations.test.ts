import { ACT, ACTIVATION_NAMES } from "../lib/activations";
import { diagnose } from "../lib/diagnose";
import type { EpochMetrics } from "../types";

describe("activations", () => {
  it("covers the eight backend activations", () => {
    expect(ACTIVATION_NAMES.sort()).toEqual(["elu", "leaky_relu", "relu", "selu", "sigmoid", "silu", "softplus", "tanh"]);
  });
  it("known values (same as the backend tests)", () => {
    expect(ACT.relu.f(-2)).toBe(0);
    expect(ACT.leaky_relu.f(-2)).toBeCloseTo(-0.02, 12);
    expect(ACT.elu.f(-2)).toBeCloseTo(Math.exp(-2) - 1, 12);
    expect(ACT.selu.f(1)).toBeCloseTo(1.0507009873554805, 12);
    expect(ACT.silu.f(3)).toBeCloseTo(3 / (1 + Math.exp(-3)), 12);
    expect(ACT.softplus.f(3)).toBeCloseTo(Math.log1p(Math.exp(3)), 12);
    expect(ACT.sigmoid.d(0)).toBeCloseTo(0.25, 12);
    expect(ACT.tanh.d(0)).toBe(1);
  });
  it.each(ACTIVATION_NAMES)("%s derivative matches a finite difference", (name) => {
    for (const x of [-3.1, -0.7, 0.4, 2.2]) {
      const h = 1e-6;
      const num = (ACT[name].f(x + h) - ACT[name].f(x - h)) / (2 * h);
      expect(ACT[name].d(x)).toBeCloseTo(num, 5);
    }
  });
  it("is stable at extreme inputs", () => {
    for (const name of ACTIVATION_NAMES) for (const x of [-800, 800]) expect(Number.isFinite(ACT[name].f(x))).toBe(true);
  });
});

const make = (n: number, f: (i: number) => Partial<EpochMetrics>): EpochMetrics[] =>
  Array.from({ length: n }, (_, i) => ({ epoch: i + 1, train_loss: 0.5, train_acc: 0.9, val_loss: 0.5, val_acc: 0.9, penalty: 0, grad_norm: 0, param_norm: 0, elapsed: i, ...f(i) }));

describe("diagnose (learning-curve rules)", () => {
  it("waits for enough epochs and for a validation curve", () => {
    expect(diagnose(make(4, () => ({}))).verdict).toBe("too-early");
    expect(diagnose(make(20, () => ({ val_loss: null, val_acc: null }))).verdict).toBe("no-validation");
  });
  it("detects overfitting: validation loss turns up while training keeps falling", () => {
    const h = make(60, (i) => ({ train_loss: 0.7 * Math.exp(-i / 12), val_loss: i < 20 ? 0.7 * Math.exp(-i / 12) + 0.2 : 0.45 + (i - 20) * 0.01, train_acc: 0.95, val_acc: 0.85 }));
    const d = diagnose(h);
    expect(d.verdict).toBe("overfitting");
    expect(d.bestEpoch).toBeGreaterThan(10);
    expect(d.bestEpoch).toBeLessThan(30);
  });
  it("detects underfitting: low accuracy for both, close together", () => {
    expect(diagnose(make(40, () => ({ train_loss: 0.68, val_loss: 0.69, train_acc: 0.55, val_acc: 0.52 }))).verdict).toBe("underfitting");
  });
  it("calls a healthy run a reasonable fit", () => {
    const h = make(50, (i) => ({ train_loss: 0.6 * Math.exp(-i / 10) + 0.05, val_loss: 0.62 * Math.exp(-i / 10) + 0.07, train_acc: 0.97, val_acc: 0.95 }));
    expect(diagnose(h).verdict).toBe("good-fit");
  });
});
