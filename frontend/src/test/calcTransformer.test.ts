import { describe, expect, it } from "vitest";
import { accuracyHalfWidth, attentionCost, binaryMetrics, inferenceSeconds, linearWarmupLR, mcnemarExact, megabytes32, sentencesPerPoint, sinusoidalPE, transformerParams } from "../cheatsheets/calc";

describe("transformerParams reproduces the real sizes of the project's models", () => {
  it("BERT-tiny with a 2-class head = 4,386,178", () => {
    expect(transformerParams({ vocab: 30522, d: 128, layers: 2, ff: 512 }).total).toBe(4386178);
  });
  it("BERT-small = 28,764,674", () => {
    expect(transformerParams({ vocab: 30522, d: 512, layers: 4, ff: 2048 }).total).toBe(28764674);
  });
  it("DistilBERT (no token-type table, pre-classifier + classifier) = 66,955,010", () => {
    expect(transformerParams({ vocab: 30522, d: 768, layers: 6, ff: 3072, typeVocab: 0 }).total).toBe(66955010);
  });
  it("BERT-base encoder with pooler and no classifier = 109,482,240 (the published BertModel size)", () => {
    expect(transformerParams({ vocab: 30522, d: 768, layers: 12, ff: 3072, classes: 0 }).total).toBe(109482240);
  });
  it("breakdown adds up", () => {
    const p = transformerParams({ vocab: 30522, d: 128, layers: 2, ff: 512 });
    expect(p.embeddings + p.layersTotal + p.head).toBe(p.total);
    expect(p.attention + p.feedForward + p.layerNorms).toBe(p.perLayer);
  });
  it("memory at 32 bit: 4.4 M → 17.5 MB, 124.6 M → 498.6 MB (the paper's 17–500 MB)", () => {
    expect(megabytes32(4386178)).toBeCloseTo(17.5, 1);
    expect(megabytes32(124647939)).toBeCloseTo(498.6, 1);
  });
});

describe("attention and schedule helpers", () => {
  it("n²d vs nd²: ratio n/d; at length 64 attention is far cheaper than the projections", () => {
    const c = attentionCost(64, 768, 12);
    expect(c.ratio).toBeCloseTo(64 / 768);
    expect(c.scoreEntries).toBe(12 * 64 * 64);
    expect(c.attentionMults).toBe(2 * 64 * 64 * 768);
    expect(c.attentionMults).toBeLessThan(c.projectionMults);
    const long = attentionCost(4096, 768, 12);
    expect(long.attentionMults).toBeGreaterThan(long.projectionMults);
  });
  it("BERT-small schedule: 3 epochs × 250 steps, warm-up 75, peak 1e-4", () => {
    expect(linearWarmupLR(0, 750, 1e-4)).toBe(0);
    expect(linearWarmupLR(75, 750, 1e-4)).toBeCloseTo(1e-4);
    expect(linearWarmupLR(375, 750, 1e-4)).toBeCloseTo((1e-4 * 375) / 675);
    expect(linearWarmupLR(750, 750, 1e-4)).toBe(0);
  });
  it("sinusoidal PE: position 0 gives sin 0 = 0 and cos 0 = 1; pos 1 follows the formula", () => {
    expect(sinusoidalPE(0, 0, 4)).toBe(0);
    expect(sinusoidalPE(0, 1, 4)).toBe(1);
    expect(sinusoidalPE(1, 0, 4)).toBeCloseTo(Math.sin(1));
    expect(sinusoidalPE(1, 2, 4)).toBeCloseTo(Math.sin(1 / 100));
  });
});

describe("evaluation helpers", () => {
  it("one point is about 9 sentences on 872; the 95 % half-width is about 2.5 points", () => {
    expect(sentencesPerPoint(872)).toBeCloseTo(8.72);
    expect(accuracyHalfWidth(0.83, 872)).toBeGreaterThan(2.4);
    expect(accuracyHalfWidth(0.83, 872)).toBeLessThan(2.7);
  });
  it("exact McNemar reproduces statistics.csv and the paper's p values", () => {
    expect(mcnemarExact(48, 28)).toBeCloseTo(0.028626655508737896, 10);
    expect(mcnemarExact(154, 28)).toBeLessThan(1e-21);
    expect(mcnemarExact(104, 53)).toBeLessThan(0.001);
    expect(mcnemarExact(71, 64)).toBeCloseTo(0.61, 1);
    expect(mcnemarExact(0, 0)).toBe(1);
    expect(mcnemarExact(5, 5)).toBe(1);
  });
  it("latency × sentences and precision / recall / F1", () => {
    expect(inferenceSeconds(39.13, 872)).toBeCloseTo(34.1, 1);
    const m = binaryMetrics(40, 10, 20, 30);
    expect(m.precision).toBeCloseTo(0.8);
    expect(m.recall).toBeCloseTo(2 / 3);
    expect(m.f1).toBeCloseTo((2 * 0.8 * (2 / 3)) / (0.8 + 2 / 3));
    expect(m.accuracy).toBeCloseTo(0.7);
  });
});
