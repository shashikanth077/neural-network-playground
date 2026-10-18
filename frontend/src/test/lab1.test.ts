import { AGES, GENDER_LABELS, HEIGHTS, PATIENTS, SUSPECT_INDEX, WEIGHTS } from "../labs/lab1/data";
import { DIGIT } from "../labs/lab1/digit";
import {
  detectAnomalies, erfc, impute, mean, median, minMax, optimizerPaths, percentile, SmallNet, softmax, standardize, std,
} from "../labs/lab1/math";

describe("Task 1 · imputation", () => {
  it("same-gender mean/median match the lab (165.83 / 166 cm)", () => {
    expect(impute(PATIENTS, "mean", "group").value).toBeCloseTo(165.83, 2);
    expect(impute(PATIENTS, "median", "group").value).toBe(166);
  });
  it("using everyone is ~9 cm too tall for a woman", () => {
    const all = impute(PATIENTS, "mean", "all").value;
    expect(all).toBeGreaterThan(173);
    expect(all - 165.83).toBeGreaterThan(8);
  });
});

describe("Tasks 2-4 · anomalies", () => {
  it("statistics with the outlier match the lab", () => {
    expect(mean(AGES)).toBeCloseTo(14.73, 2);
    expect(std(AGES)).toBeCloseTo(14.04, 2);
  });
  it("Z-score: z(88) ≈ 5.22 and only 88 is flagged", () => {
    const r = detectAnomalies(AGES, "z", 3, SUSPECT_INDEX);
    expect(r.detail.zOfSuspect).toBeCloseTo(5.22, 2);
    expect(r.flagged).toEqual([SUSPECT_INDEX]);
  });
  it("Chauvenet: n·P ≈ 5.4e-6 and only 88 is flagged", () => {
    const r = detectAnomalies(AGES, "chauvenet", 3, SUSPECT_INDEX);
    expect(r.detail.nP!).toBeGreaterThan(4.5e-6);
    expect(r.detail.nP!).toBeLessThan(6.5e-6);
    expect(r.flagged).toEqual([SUSPECT_INDEX]);
  });
  it("IQR limits are 4.625 … 19.625", () => {
    const r = detectAnomalies(AGES, "iqr");
    expect(r.detail.low).toBeCloseTo(4.625, 3);
    expect(r.detail.high).toBeCloseTo(19.625, 3);
    expect(r.flagged).toEqual([SUSPECT_INDEX]);
  });
  it("masking: at 20 the Z-score(3) rule misses the entry but Chauvenet and IQR still catch it", () => {
    const a = AGES.slice();
    a[SUSPECT_INDEX] = 20;
    expect(detectAnomalies(a, "z", 3, SUSPECT_INDEX).flagged).not.toContain(SUSPECT_INDEX);
    expect(detectAnomalies(a, "chauvenet").flagged).toContain(SUSPECT_INDEX);
    expect(detectAnomalies(a, "iqr").flagged).toContain(SUSPECT_INDEX);
  });
  it("correction to the original guide: at 30-40 Z-score still flags it (masking starts near 21)", () => {
    for (const v of [30, 35, 40]) {
      const a = AGES.slice();
      a[SUSPECT_INDEX] = v;
      expect(detectAnomalies(a, "z", 3).flagged).toContain(SUSPECT_INDEX);
    }
    const a = AGES.slice();
    a[SUSPECT_INDEX] = 22;
    expect(detectAnomalies(a, "z", 3).flagged).toContain(SUSPECT_INDEX);
    a[SUSPECT_INDEX] = 21;
    expect(detectAnomalies(a, "z", 3).flagged).not.toContain(SUSPECT_INDEX);
  });
  it("without 88 the real spread is only ≈ 2.4", () => {
    expect(std(AGES.filter((_, i) => i !== SUSPECT_INDEX))).toBeCloseTo(2.4, 1);
  });
  it("erfc and percentile behave", () => {
    expect(erfc(0)).toBeCloseTo(1, 6);
    expect(erfc(1)).toBeCloseTo(0.157299, 5);
    expect(percentile([1, 2, 3, 4], 50)).toBe(2.5);
    expect(median([3, 1, 2])).toBe(2);
  });
});

describe("Scaling", () => {
  it("min-max maps to [0,1] and Name 5 becomes (0, 0.04)", () => {
    const h = minMax(HEIGHTS);
    const w = minMax(WEIGHTS);
    expect(Math.min(...h)).toBe(0);
    expect(Math.max(...h)).toBe(1);
    expect(h[4]).toBe(0);
    expect(w[4]).toBeCloseTo(0.04, 3);
  });
  it("standardize gives mean 0 and std 1", () => {
    const z = standardize(HEIGHTS);
    expect(mean(z)).toBeCloseTo(0, 9);
    expect(std(z, 0)).toBeCloseTo(1, 9);
  });
});

describe("Task 5 · SmallNet (2-2-1, backprop by hand)", () => {
  const X: number[][] = [];
  const Y: number[] = [];
  const h = minMax(HEIGHTS);
  const w = minMax(WEIGHTS);
  GENDER_LABELS.forEach((g, i) => {
    if (g === null) return;
    X.push([h[i], w[i]]);
    Y.push(g);
  });
  const name5 = [h[4], w[4]];

  it("is reproducible from its seed", () => {
    const a = new SmallNet(7);
    const b = new SmallNet(7);
    expect(a.w1).toEqual(b.w1);
    expect(new SmallNet(8).w1).not.toEqual(a.w1);
  });
  it("training really lowers the loss and changes the weights", () => {
    const net = new SmallNet(7);
    const before = JSON.stringify(net.w1);
    net.train(X, Y, 0.5, 300);
    expect(JSON.stringify(net.w1)).not.toBe(before);
    expect(net.lossHistory[net.lossHistory.length - 1]).toBeLessThan(net.lossHistory[0]);
  });
  it("lr 0.5 × 1000 epochs reaches 100 % accuracy and calls Name 5 female", () => {
    const net = new SmallNet(7);
    net.train(X, Y, 0.5, 1000);
    expect(net.accuracy(X, Y)).toBe(1);
    expect(net.forward(name5).out).toBeLessThan(0.5);
  });
  it("lr 0.01 × 100 epochs barely learns", () => {
    const net = new SmallNet(7);
    net.train(X, Y, 0.01, 100);
    expect(net.lossHistory[99]).toBeGreaterThan(0.15);
  });
});

describe("Task 6 helpers", () => {
  it("softmax sums to 1 and is shift-invariant", () => {
    const p = softmax([-1, -1, 0, -1, -2, -1, -2, 4, 0, 1]);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
    expect(p.indexOf(Math.max(...p))).toBe(7);
    expect(softmax([1001, 1000])[0]).toBeCloseTo(softmax([1, 0])[0], 9);
  });
  it("the embedded digit is 28×28 grey values", () => {
    expect(DIGIT).toHaveLength(784);
    expect(Math.max(...DIGIT)).toBeLessThanOrEqual(255);
    expect(DIGIT.some((v) => v > 0)).toBe(true);
  });
});

describe("Optimizer lab", () => {
  it("small SGD rate converges; huge SGD rate diverges", () => {
    expect(optimizerPaths(0.1, 60).sgd.ok).toBe(true);
    expect(optimizerPaths(0.1, 60).sgd.loss).toBeLessThan(0.1);
    expect(optimizerPaths(0.5, 60).sgd.ok).toBe(false);
  });
  it("all three start at the same point", () => {
    const r = optimizerPaths(0.05, 5);
    expect(r.sgd.path[0]).toEqual(r.adam.path[0]);
    expect(r.rms.path[0]).toEqual(r.adam.path[0]);
  });
});
