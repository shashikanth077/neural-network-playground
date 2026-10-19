import { convOut, convParams, denseParams, embeddingParams, gruParams, lstmParams, rnnParams, samePad, stepsPerEpoch } from "../cheatsheets/calc";

describe("cheatsheet formulas reproduce the lecture's numbers", () => {
  it("MNIST dense network 784-100-10 = 79,510", () => {
    expect(denseParams(784, 100)).toBe(78500);
    expect(denseParams(100, 10)).toBe(1010);
    expect(denseParams(784, 100) + denseParams(100, 10)).toBe(79510);
  });
  it("IMDB dense network 200-100-50-1 = 25,201", () => {
    expect(denseParams(200, 100) + denseParams(100, 50) + denseParams(50, 1)).toBe(25201);
  });
  it("IMDB embedding network = 131,777", () => {
    expect(embeddingParams(10000, 8) + denseParams(200 * 8, 32) + denseParams(32, 16) + denseParams(16, 1)).toBe(131777);
  });
  it("MNIST CNN = 333,526", () => {
    const conv1 = convParams(3, 1, 32);
    const conv2 = convParams(3, 32, 64);
    expect([conv1, conv2]).toEqual([320, 18496]);
    const flat = convOut(convOut(28, 2, 2), 2, 2) ** 2 * 64; // 28 -> 14 -> 7 with same padding & pooling
    expect(flat).toBe(3136);
    expect(conv1 + conv2 + denseParams(flat, 100) + denseParams(100, 10)).toBe(333526);
  });
  it("IMDB Conv1D network = 1,387,757", () => {
    const c1 = convParams(5, 8, 100, 1);
    const c2 = convParams(5, 100, 200, 1);
    expect([c1, c2]).toEqual([4100, 100200]);
    const len1 = convOut(200, 5); // 196
    const len2 = convOut(convOut(len1, 2, 2), 5); // 98 -> 94
    const flat = convOut(len2, 2, 2) * 200; // 47 * 200
    expect([len1, len2, flat]).toEqual([196, 94, 9400]);
    expect(embeddingParams(10000, 8) + c1 + c2 + denseParams(flat, 128) + denseParams(128, 1)).toBe(1387757);
  });
  it("conv output sizes: LeNet 32→28→14→10→5, valid vs same, stride", () => {
    expect(convOut(32, 5)).toBe(28);
    expect(convOut(28, 2, 2)).toBe(14);
    expect(convOut(14, 5)).toBe(10);
    expect(convOut(10, 2, 2)).toBe(5);
    expect(convOut(6, 3)).toBe(4); // the lecture's 6×6 exercise
    expect(convOut(3, 3, 1, samePad(3))).toBe(3); // "same" keeps the size
    expect(convOut(28, 3, 2, 1)).toBe(14);
    expect(convOut(2, 5)).toBe(0); // kernel larger than the input
  });
  it("recurrent layer parameter counts (verified against PyTorch layer sizes)", () => {
    expect(lstmParams(128, 64)).toBe(49408);
    expect(lstmParams(64, 24)).toBe(8544);
    expect(gruParams(128, 64)).toBe(37248);
    expect(gruParams(64, 24)).toBe(6480);
    expect(rnnParams(128, 64)).toBe(12352);
  });
  it("updates per epoch: 48,000 / 32 = 1,500", () => {
    expect(stepsPerEpoch(48000, 32)).toBe(1500);
    expect(stepsPerEpoch(10, 32)).toBe(1);
    expect(stepsPerEpoch(240, 1)).toBe(240);
  });
});
