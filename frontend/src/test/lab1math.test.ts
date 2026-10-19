// Tests for the helpers behind the interactive Lab 1 widgets.
// Expected values were computed independently with NumPy / Python's math.erfc (not with the code under test).
import { AGES, PATIENTS, SUSPECT_INDEX } from "../labs/lab1/data";
import {
  chainGradient, detectAnomalies, featureStats, forwardParams, gradients, groupStats, mlpForward, netParamsOf, netTrace,
  optimizerPaths, paramCount, pointReport, predictRaw, randomMlp, scaleMinMax, scaleZ, sgdStep, SmallNet, stepsToLoss,
  type NetParams,
} from "../labs/lab1/math";

describe("groupStats (Task 1)", () => {
  it("women: n 6, mean 165.8333, median 166; men: n 9, mean 182.6667, median 182; all: n 15, mean 175.9333", () => {
    const f = groupStats(PATIENTS, 0);
    expect([f.n, f.sum, f.min, f.max, f.median]).toEqual([6, 995, 160, 171, 166]);
    expect(f.mean).toBeCloseTo(165.8333333, 6);
    const m = groupStats(PATIENTS, 1);
    expect([m.n, m.median, m.min, m.max]).toEqual([9, 182, 175, 194]);
    expect(m.mean).toBeCloseTo(182.6666667, 6);
    const a = groupStats(PATIENTS, "all");
    expect([a.n, a.median]).toEqual([15, 177]);
    expect(a.mean).toBeCloseTo(175.9333333, 6);
  });
  it("an emptied group reports n = 0 instead of crashing", () => {
    expect(groupStats(PATIENTS.map(([g]) => [g, null]), 0).n).toBe(0);
  });
});

describe("pointReport (Tasks 2-4, per point)", () => {
  it("88 in the original list: z 5.2196, n·P 5.378e-6, IQR fence 4.625 … 19.625, all three flag", () => {
    const r = pointReport(AGES, SUSPECT_INDEX);
    expect(r.z).toBeCloseTo(5.219637966, 6);
    expect(r.nP).toBeCloseTo(5.37819675e-6, 12);
    expect([r.q1, r.q3, r.low, r.high]).toEqual([10.25, 14, 4.625, 19.625]);
    expect([r.zFlag, r.chauvenetFlag, r.iqrFlag]).toEqual([true, true, true]);
  });
  it("21 in place of 88: z 2.98279 (just below 3, masked), n·P 0.085691, fence unchanged", () => {
    const a = AGES.slice(); a[SUSPECT_INDEX] = 21;
    const r = pointReport(a, SUSPECT_INDEX);
    expect(r.mu).toBeCloseTo(12.5, 9);
    expect(r.sigma).toBeCloseTo(2.84968238, 7);
    expect(r.z).toBeCloseTo(2.98278856, 6);
    expect(r.nP).toBeCloseTo(0.0856905741, 6);
    expect([r.zFlag, r.chauvenetFlag, r.iqrFlag]).toEqual([false, true, true]);
  });
  it("22 is the first integer the Z-score rule catches (z 3.2021)", () => {
    const a = AGES.slice(); a[SUSPECT_INDEX] = 22;
    expect(pointReport(a, SUSPECT_INDEX).z).toBeCloseTo(3.20210565, 6);
    expect(pointReport(a, SUSPECT_INDEX).zFlag).toBe(true);
  });
  it("two outliers (88 and 90): σ grows to 19.6246, z(88) 3.6009, z(90) 3.7028, fence 3.5 … 21.5", () => {
    const a = AGES.slice(); a[11] = 90;
    const r = pointReport(a, SUSPECT_INDEX);
    expect(r.sigma).toBeCloseTo(19.62463851, 6);
    expect(r.z).toBeCloseTo(3.60091558, 6);
    expect(pointReport(a, 11).z).toBeCloseTo(3.70282829, 6);
    expect([r.low, r.high]).toEqual([3.5, 21.5]);
  });
  it("an ordinary age (8) has z −0.4797 and n·P 18.94: not flagged by anything", () => {
    const r = pointReport(AGES, 0);
    expect(r.z).toBeCloseTo(-0.47969375, 6);
    expect(r.nP).toBeCloseTo(18.9433551, 5);
    expect([r.zFlag, r.chauvenetFlag, r.iqrFlag]).toEqual([false, false, false]);
  });
  it("agrees with detectAnomalies on which indexes are flagged", () => {
    const a = AGES.slice(); a[SUSPECT_INDEX] = 21; a[3] = 2;
    const idx = (k: "zFlag" | "chauvenetFlag" | "iqrFlag") => a.map((_, i) => i).filter((i) => pointReport(a, i)[k]);
    expect(idx("zFlag")).toEqual(detectAnomalies(a, "z", 3).flagged);
    expect(idx("chauvenetFlag")).toEqual(detectAnomalies(a, "chauvenet").flagged);
    expect(idx("iqrFlag")).toEqual(detectAnomalies(a, "iqr").flagged);
  });
});

describe("scaling formulas with the numbers filled in", () => {
  const H = [165, 183, 171, 194, 158, 185, 160, 175, 169, 180, 164, 182, 167, 190, 163, 177];
  const W = [55, 95, 60, 102, 54, 90, 52, 78, 63, 85, 52, 92, 58, 98, 54, 77];
  it("feature statistics match NumPy (population std)", () => {
    const h = featureStats(H);
    expect([h.min, h.max]).toEqual([158, 194]);
    expect(h.mean).toBeCloseTo(173.9375, 9);
    expect(h.std).toBeCloseTo(10.62113900436295, 9);
    expect(featureStats(W).mean).toBeCloseTo(72.8125, 9);
    expect(featureStats(W).std).toBeCloseTo(18.038911933650542, 9);
  });
  it("Name 5: min-max (0, 0.04) and z-scores (−1.50055, −1.04288)", () => {
    expect(scaleMinMax(158, 158, 194)).toBe(0);
    expect(scaleMinMax(54, 52, 102)).toBeCloseTo(0.04, 12);
    expect(scaleZ(158, 173.9375, 10.62113900436295)).toBeCloseTo(-1.50054528, 7);
    expect(scaleZ(54, 72.8125, 18.038911933650542)).toBeCloseTo(-1.04288441, 7);
  });
  it("a NEW patient is scaled with the training min/max and can leave [0,1]: 200 cm, 105 kg → (1.1667, 1.06)", () => {
    expect(scaleMinMax(200, 158, 194)).toBeCloseTo(1.16666667, 7);
    expect(scaleMinMax(105, 52, 102)).toBeCloseTo(1.06, 12);
  });
});

describe("2-2-1 network by hand (forward, backward, update)", () => {
  const p: NetParams = { w1: [[0.5, -0.3], [0.2, 0.8]], b1: [0.1, -0.2], w2: [0.7, -0.6], b2: 0.05 };
  const x = [0.3, 0.6];
  it("forward values match NumPy", () => {
    const f = forwardParams(p, x);
    expect(f.z1[0]).toBeCloseTo(0.37, 12);
    expect(f.z1[1]).toBeCloseTo(0.19, 12);
    expect(f.h[0]).toBeCloseTo(0.5914589784327801, 12);
    expect(f.h[1]).toBeCloseTo(0.5473576181430894, 12);
    expect(f.zo).toBeCloseTo(0.13560671401709246, 12);
    expect(f.out).toBeCloseTo(0.5338498218541203, 12);
  });
  it("gradients match NumPy (loss ½(out−1)² = 0.108648)", () => {
    const g = gradients(p, x, 1);
    expect(g.loss).toBeCloseTo(0.10864799429271768, 12);
    expect(g.dOut).toBeCloseTo(-0.11600342479594962, 12);
    expect(g.dHid[0]).toBeCloseTo(-0.019621362013449876, 12);
    expect(g.dHid[1]).toBeCloseTo(0.017244414128693517, 12);
    expect(g.gw2[0]).toBeCloseTo(-0.06861126712451619, 12);
    expect(g.gw2[1]).toBeCloseTo(-0.06349535829275198, 12);
    expect(g.gw1[1][0]).toBeCloseTo(-0.011772817208069926, 12);
    expect(g.gw1[0][1]).toBeCloseTo(0.005173324238608055, 12);
  });
  it("backprop agrees with a numerical derivative of the loss (central differences)", () => {
    const g = gradients(p, x, 1);
    const loss = (q: NetParams) => 0.5 * (forwardParams(q, x).out - 1) ** 2;
    const eps = 1e-6;
    const bump = (edit: (q: NetParams, d: number) => void) => {
      const a = netParamsOf(p); edit(a, eps);
      const b = netParamsOf(p); edit(b, -eps);
      return (loss(a) - loss(b)) / (2 * eps);
    };
    expect(bump((q, d) => { q.w2[1] += d; })).toBeCloseTo(g.gw2[1], 8);
    expect(bump((q, d) => { q.b2 += d; })).toBeCloseTo(g.gb2, 8);
    expect(bump((q, d) => { q.w1[0][0] += d; })).toBeCloseTo(g.gw1[0][0], 8);
    expect(bump((q, d) => { q.w1[1][1] += d; })).toBeCloseTo(g.gw1[1][1], 8);
    expect(bump((q, d) => { q.b1[0] += d; })).toBeCloseTo(g.gb1[0], 8);
  });
  it("sgdStep with lr 0.5 matches NumPy and does not modify its input", () => {
    const before = JSON.stringify(p);
    const u = sgdStep(p, x, 1, 0.5).params;
    expect(JSON.stringify(p)).toBe(before);
    expect(u.w1[0][0]).toBeCloseTo(0.5029432043020174, 12);
    expect(u.w1[1][0]).toBeCloseTo(0.20588640860403498, 12);
    expect(u.b1[1]).toBeCloseTo(-0.20862220706434678, 12);
    expect(u.w2[0]).toBeCloseTo(0.7343056335622581, 12);
    expect(u.w2[1]).toBeCloseTo(-0.568252320853624, 12);
    expect(u.b2).toBeCloseTo(0.10800171239797482, 12);
  });
  it("one step equals one online-SGD step of the lab's own SmallNet.train", () => {
    const net = new SmallNet(3);
    const start = netParamsOf(net);
    const xs = [0.25, 0.8];
    const u = sgdStep(start, xs, 0, 0.7).params;
    net.train([xs], [0], 0.7, 1);
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) expect(net.w1[a][b]).toBeCloseTo(u.w1[a][b], 12);
    expect(net.w2[0]).toBeCloseTo(u.w2[0], 12);
    expect(net.b2).toBeCloseTo(u.b2, 12);
  });
  it("a single update lowers the loss of that sample", () => {
    const before = gradients(p, x, 1).loss;
    const after = gradients(sgdStep(p, x, 1, 0.5).params, x, 1).loss;
    expect(after).toBeLessThan(before);
  });
  it("the step-by-step trace has 6 forward values, the loss, backward values and 9 updates, and ends in the same weights", () => {
    const t = netTrace(p, x, 1, 0.5);
    expect(t.filter((s) => s.phase === "forward")).toHaveLength(7);
    expect(t.filter((s) => s.phase === "update")).toHaveLength(9);
    expect(new Set(t.map((s) => s.id)).size).toBe(t.length);
    expect(t.find((s) => s.id === "out")!.value).toBeCloseTo(0.5338498218541203, 12);
    expect(t.find((s) => s.id === "u_b2")!.value).toBeCloseTo(0.10800171239797482, 12);
    expect(t.find((s) => s.id === "z1")!.expr).toContain("= 0.3700");
  });
  it("predictRaw scales with training min/max, then calls the net: Name 5 and an out-of-range patient", () => {
    const hs = { min: 158, max: 194 };
    const ws = { min: 52, max: 102 };
    const r = predictRaw(p, 158, 54, hs, ws);
    expect(r.x[0]).toBe(0);
    expect(r.x[1]).toBeCloseTo(0.04, 12);
    expect(r.pMale).toBeCloseTo(forwardParams(p, r.x).out, 12);
    expect(r.pMale + r.pFemale).toBeCloseTo(1, 12);
    expect(predictRaw(p, 200, 105, hs, ws).x[0]).toBeCloseTo(1.1666666667, 9);
  });
});

describe("dense stack for MNIST", () => {
  it("parameter counts: 2-2-1 → 9, 784-128-10 → 101 770, the lab's model → 575 050", () => {
    expect(paramCount([2, 2, 1])).toBe(9);
    expect(paramCount([784, 128, 10])).toBe(101770);
    expect(paramCount([784, 512, 256, 128, 64, 10])).toBe(575050);
  });
  it("forward pass of a 3-2-2 relu/softmax net with fixed weights matches NumPy", () => {
    const layers = [
      { w: [[0.5, -1.0], [1.5, 0.25], [-0.5, 2.0]], b: [0.1, -0.3] },
      { w: [[1.0, -1.0], [0.5, 0.5]], b: [0.0, 0.2] },
    ];
    const r = mlpForward(layers, [1, 2, 3]);
    expect(r.acts[1][0]).toBeCloseTo(2.1, 12);
    expect(r.acts[1][1]).toBeCloseTo(5.2, 12);
    expect(r.logits[0]).toBeCloseTo(4.7, 12);
    expect(r.logits[1]).toBeCloseTo(0.7, 12);
    expect(r.probs[0]).toBeCloseTo(0.9820137900379085, 12);
    expect(r.probs[1]).toBeCloseTo(0.017986209962091555, 12);
  });
  it("relu clips negative pre-activations to 0 in hidden layers", () => {
    const layers = [{ w: [[-1, 1]], b: [0, 0] }, { w: [[1], [1]], b: [0] }];
    expect(mlpForward(layers, [2]).acts[1]).toEqual([0, 2]);
  });
  it("randomMlp is reproducible, has the right shapes and gives 10 probabilities that sum to 1", () => {
    const a = randomMlp([784, 64, 10], 5);
    const b = randomMlp([784, 64, 10], 5);
    expect(a[0].w[3][7]).toBe(b[0].w[3][7]);
    expect(randomMlp([784, 64, 10], 6)[0].w[3][7]).not.toBe(a[0].w[3][7]);
    expect([a[0].w.length, a[0].w[0].length, a[1].w.length, a[1].w[0].length]).toEqual([784, 64, 64, 10]);
    const lim = Math.sqrt(6 / (784 + 64));
    expect(Math.max(...a[0].w.flat().map(Math.abs))).toBeLessThanOrEqual(lim);
    const r = mlpForward(a, Array.from({ length: 784 }, (_, i) => (i % 7) / 7));
    expect(r.probs).toHaveLength(10);
    expect(r.probs.reduce((s, v) => s + v, 0)).toBeCloseTo(1, 9);
  });
});

describe("vanishing gradient chain (best case, weights = 1)", () => {
  it("sigmoid at 0 over 5 layers = 0.25^5 = 9.765625e-4; at 1.5 = 7.3801e-5; at 3 over 8 layers = 1.735e-11", () => {
    expect(chainGradient("sigmoid", 0, 5)).toBeCloseTo(0.0009765625, 12);
    expect(chainGradient("sigmoid", 1.5, 5)).toBeCloseTo(7.380140564732418e-5, 14);
    expect(chainGradient("sigmoid", 3, 8)).toBeCloseTo(1.7350537586901188e-11, 20);
  });
  it("tanh at 0 keeps gradient 1; at 1.5 over 5 layers = 1.9270e-4; relu keeps 1 for x > 0 and 0 for x < 0", () => {
    expect(chainGradient("tanh", 0, 5)).toBe(1);
    expect(chainGradient("tanh", 1.5, 5)).toBeCloseTo(0.00019269504235640695, 12);
    expect(chainGradient("relu", 2, 50)).toBe(1);
    expect(chainGradient("relu", -2, 3)).toBe(0);
  });
});

describe("optimizer runs against an independent NumPy implementation (40 steps)", () => {
  const cases: [string, number, number, number][] = [
    // optimizer, lr, final loss, first step with loss < 0.01 (−1 = never)
    ["sgd", 0.1, 0.001926945094660418, 33],
    ["sgd", 0.05, 0.1456656020758203, -1],
    ["rms", 0.3, 3.05922302173051e-19, 16],
    ["rms", 0.1, 0.12293496926763477, -1],
    ["adam", 0.3, 0.05728247436338508, -1],
    ["adam", 0.05, 2.6954864189757353, -1],
  ];
  for (const [k, lr, loss, first] of cases) {
    it(`${k} lr ${lr}: final loss ${loss.toExponential(3)}, first below 0.01 at step ${first}`, () => {
      const run = optimizerPaths(lr, 40)[k as "sgd" | "rms" | "adam"];
      expect(run.ok).toBe(true);
      expect(run.loss).toBeCloseTo(loss, Math.abs(loss) < 1e-6 ? 18 : 8);
      expect(stepsToLoss(run, 0.01)).toBe(first);
    });
  }
  it("SGD with lr 0.3 diverges after 9 steps", () => {
    const run = optimizerPaths(0.3, 40).sgd;
    expect(run.ok).toBe(false);
    expect(run.path).toHaveLength(10);
  });
  it("challenge grid: exactly 2 of the 12 optimizer × rate combinations reach loss < 0.01 within 40 steps (SGD 0.1 at step 33, RMSprop 0.3 at step 16)", () => {
    const wins: string[] = [];
    for (const k of ["sgd", "rms", "adam"] as const) {
      for (const lr of [0.01, 0.05, 0.1, 0.3]) {
        const at = stepsToLoss(optimizerPaths(lr, 40)[k], 0.01);
        if (at >= 0) wins.push(`${k}@${lr}:${at}`);
      }
    }
    expect(wins).toEqual(["sgd@0.1:33", "rms@0.3:16"]);
  });
});
