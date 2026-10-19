import { batchNorm, dropoutMask, gaussian, meanOf, varOf } from "../lib/norm";
import { bce, bceGrad, hinge, hingeGrad, mse, mseGrad, sigmoid } from "../lib/losses";
import { mulberry32 } from "../labs/lab1/math";

describe("losses (same values as the backend)", () => {
  it("bce at z=0 is ln 2 and its gradient is sigmoid - y", () => {
    expect(bce(0, 1)).toBeCloseTo(Math.LN2, 12);
    expect(bceGrad(0, 1)).toBeCloseTo(-0.5, 12);
    expect(bce(800, 0)).toBeCloseTo(800, 6); // stable at extreme logits
    expect(Number.isFinite(bce(-800, 1))).toBe(true);
  });
  it("mse gradient vanishes when confidently wrong, bce does not (lecture 4)", () => {
    expect(Math.abs(bceGrad(-6, 1))).toBeGreaterThan(0.99);
    expect(Math.abs(mseGrad(-6, 1))).toBeLessThan(0.01);
  });
  it("hinge is zero beyond the margin", () => {
    expect(hinge(2, 1)).toBe(0);
    expect(hinge(0.25, 1)).toBeCloseTo(0.75, 12);
    expect(hingeGrad(0.25, 1)).toBe(-1);
    expect(hingeGrad(2, 1)).toBe(0);
    expect(hinge(0.25, 0)).toBeCloseTo(1.25, 12);
  });
  it.each([["bce", bce, bceGrad], ["mse", mse, mseGrad], ["hinge", hinge, hingeGrad]] as const)("%s gradient matches a finite difference", (_, f, g) => {
    for (const [z, y] of [[-1.3, 1], [0.4, 0], [2.5, 1], [-0.2, 0]]) {
      const h = 1e-6;
      expect(g(z, y)).toBeCloseTo((f(z + h, y) - f(z - h, y)) / (2 * h), 5);
    }
  });
  it("sigmoid is stable", () => expect(sigmoid(-1000)).toBe(0));
});

describe("batch norm and dropout helpers", () => {
  it("batchNorm yields mean 0 and variance ~1, then scale/shift", () => {
    const x = gaussian(64, 3, 2, 1);
    const r = batchNorm(x);
    expect(meanOf(r.xhat)).toBeCloseTo(0, 10);
    expect(varOf(r.xhat)).toBeCloseTo(1, 4);
    const s = batchNorm(x, 2, 5);
    expect(meanOf(s.y)).toBeCloseTo(5, 8);
    expect(Math.sqrt(varOf(s.y))).toBeCloseTo(2, 3);
  });
  it("inverted dropout keeps the expected value", () => {
    const rand = mulberry32(5);
    const acts = Array.from({ length: 16 }, (_, i) => (i + 1) / 16);
    const S = acts.reduce((a, b) => a + b, 0);
    let total = 0;
    const N = 4000;
    for (let t = 0; t < N; t++) total += dropoutMask(16, 0.4, rand).reduce((s, m, i) => s + m * acts[i], 0);
    expect(total / N).toBeCloseTo(S, 0);
    expect(Math.max(...dropoutMask(50, 0.4, mulberry32(1)))).toBeCloseTo(1 / 0.6, 12);
  });
});
