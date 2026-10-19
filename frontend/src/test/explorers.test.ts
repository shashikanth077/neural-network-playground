import { describe, expect, it } from "vitest";
import { conv2d, EXERCISE_IMAGE, KERNELS, mnistCnn, pool2d, receptiveField, relu, SQUARE_IMAGE } from "../explorers/conv";
import { gruStep, lstmStep, makeWeights, rnnStep, unroll, type Gate, type LstmWeights } from "../explorers/rnn";
import fx from "./fixtures/rnn_torch.json";

describe("convolution (expected values computed independently with NumPy)", () => {
  it("exercise A: 6×6 valid stride 1 → 4×4", () => {
    expect(conv2d(EXERCISE_IMAGE, KERNELS.lecture.k)).toEqual([[2, 6, 1, 5], [0, 8, -2, 5], [2, 0, 3, 1], [-2, 6, 2, 0]]);
  });
  it("same padding keeps the size and matches NumPy", () => {
    expect(conv2d(EXERCISE_IMAGE, KERNELS.lecture.k, 1, "same")).toEqual([
      [2, 6, 3, 9, 6, 3], [3, 2, 6, 1, 5, 3], [3, 0, 8, -2, 5, 0], [3, 2, 0, 3, 1, 2], [0, -2, 6, 2, 0, 8], [2, -2, -1, 3, 5, 0],
    ]);
  });
  it("stride 2 shrinks the output: floor((6-3)/2)+1 = 2", () => {
    const o = conv2d(EXERCISE_IMAGE, KERNELS.lecture.k, 2);
    expect([o.length, o[0].length]).toEqual([2, 2]);
    expect(o[0][0]).toBe(2);
  });
  it("exercise C: 2×2 max pool stride 2 → 3×3", () => {
    expect(pool2d(EXERCISE_IMAGE, 2, 2, "max")).toEqual([[2, 3, 3], [2, 3, 3], [1, 1, 3]]);
  });
  it("average pooling averages and ReLU clamps", () => {
    expect(pool2d([[1, 3], [5, 7]], 2, 2, "avg")).toEqual([[4]]);
    expect(relu([[-1, 2]])).toEqual([[0, 2]]);
  });
  it("blur kernel preserves a constant image; separation kernel zeroes it", () => {
    const flat = Array.from({ length: 5 }, () => Array(5).fill(3));
    conv2d(flat, KERNELS.blur.k).flat().forEach((v) => expect(v).toBeCloseTo(3));
    conv2d(flat, KERNELS.separation.k).flat().forEach((v) => expect(v).toBeCloseTo(0));
  });
  it("vertical edge kernel fires on the left and right sides and is 0 on flat areas", () => {
    const o = conv2d(SQUARE_IMAGE, KERNELS.vertical.k);
    expect(o[2].some((v) => v > 0)).toBe(true);
    expect(o[2].some((v) => v < 0)).toBe(true);
    expect(o[2][2]).toBe(0); // window entirely inside the flat bright square
  });
  it("receptive field clips cells in the padding", () => {
    expect(receptiveField(0, 0, 3, 3, 1, 1, 6, 6)).toHaveLength(4);
    expect(receptiveField(1, 1, 3, 3, 1, 0, 6, 6)).toHaveLength(9);
  });
  it("MNIST CNN matches the lecture's 333,526 parameters", () => {
    const { rows, total } = mnistCnn(32, 64, 100);
    expect(rows.map((r) => r.params)).toEqual([0, 320, 0, 18496, 0, 0, 313700, 1010]);
    expect(total).toBe(333526);
  });
});

const close = (a: number[][], b: number[][]) => a.forEach((row, t) => row.forEach((v, i) => expect(v).toBeCloseTo(b[t][i], 5)));

describe("recurrent cells against PyTorch", () => {
  it("SimpleRNN matches torch.nn.RNN over a 5-step sequence", () => {
    const g: Gate = { W: fx.rnn.W, U: fx.rnn.U, b: fx.rnn.b };
    close(unroll("rnn", g, fx.xs, fx.units).steps.map((s) => s.h), fx.rnn.h);
  });
  it("LSTM matches torch.nn.LSTM over a 5-step sequence", () => {
    const w = fx.lstm.gates as unknown as LstmWeights;
    close(unroll("lstm", w, fx.xs, fx.units).steps.map((s) => s.h), fx.lstm.h);
  });
});

describe("recurrent cells: formulas", () => {
  const scalar = (w: number, u: number, b = 0): Gate => ({ W: [[w]], U: [[u]], b: [b] });
  const sig = (v: number) => 1 / (1 + Math.exp(-v));
  it("GRU follows the lecture: reset before U, h = (1-z)h_prev + z·h̃", () => {
    const w = { r: scalar(0.5, 0.3), z: scalar(-0.4, 0.8), n: scalar(1.2, -0.7) };
    const x = 0.9, h = 0.6;
    const r = sig(0.5 * x + 0.3 * h), z = sig(-0.4 * x + 0.8 * h);
    const cand = Math.tanh(1.2 * x - 0.7 * (r * h));
    const s = gruStep(w, [x], [h]);
    expect(s.h[0]).toBeCloseTo((1 - z) * h + z * cand, 12);
    expect(s.r[0]).toBeCloseTo(r, 12);
  });
  it("LSTM with forget gate open and input gate closed keeps the cell state", () => {
    const open = scalar(0, 0, 50), shut = scalar(0, 0, -50);
    const s = lstmStep({ i: shut, f: open, g: scalar(0, 0, 0), o: open }, [1], [0], [2.5]);
    expect(s.c[0]).toBeCloseTo(2.5, 6);
    expect(s.h[0]).toBeCloseTo(Math.tanh(2.5), 6);
  });
  it("RNN step is tanh(Wx+Uh+b)", () => {
    expect(rnnStep(scalar(2, 1, 0.1), [0.5], [0.2]).h[0]).toBeCloseTo(Math.tanh(1.3), 12);
  });
  it("makeWeights is deterministic and has the right shape", () => {
    const a = makeWeights("lstm", 2, 3) as LstmWeights;
    expect(JSON.stringify(a)).toBe(JSON.stringify(makeWeights("lstm", 2, 3)));
    expect(a.f.W).toHaveLength(3);
    expect(a.f.W[0]).toHaveLength(2);
  });
});
