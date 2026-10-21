import { describe, expect, it } from "vitest";
import fx from "./fixtures/lab3theory.json";
import {
  adamwStep, attention, attentionOps, BERT_SMALL, BERT_TINY, classify, clipNorm, crossEntropy, decodeAttention, DISTILBERT, erf, ffn, gelu, geluTanh,
  HPARAMS, layerNorm, lrAt, lrSchedule, maskTokens, meanMaps, multiHead, paramBreakdown, paramTotal, recurrentOps, rng, saturation, sequentialSteps,
  sinusoidalPE, softmax, TOY_VOCAB, tokenizeToy, toyEmbeddings, toyMultiHeadWeights, totalSteps, wordpiece, type EncoderConfig,
} from "../labs/lab3/transformerMath";
import { RECORDED_ATTENTION } from "../labs/lab3/data/theoryAttention";
import { RECORDED } from "../labs/lab3/data/theoryRecorded";

/* Expected values in fixtures/lab3theory.json were computed independently with NumPy / Python's math (not with this code). */

const close = (a: number[], b: number[], tol = 1e-9) => {
  expect(a).toHaveLength(b.length);
  a.forEach((v, i) => expect(Math.abs(v - b[i])).toBeLessThan(tol));
};
const closeM = (a: number[][], b: number[][], tol = 1e-9) => a.forEach((r, i) => close(r, b[i], tol));

describe("positional encoding", () => {
  it("matches the sinusoid of the paper (n=4, d=6)", () => closeM(sinusoidalPE(4, 6), fx.pe));
  it("matches at position 50 of a 128-dimensional encoding", () => {
    const pe = sinusoidalPE(51, 128)[50];
    close([0, 1, 10, 11, 126, 127].map((k) => pe[k]), fx.pe50);
  });
  it("position 0 is sin 0 = 0 and cos 0 = 1 in every pair", () => {
    const r = sinusoidalPE(1, 8)[0];
    r.forEach((v, k) => expect(v).toBe(k % 2 ? 1 : 0));
  });
});

describe("softmax and scaled dot-product attention", () => {
  const Q = [[1, 0], [0.5, 1], [-1, 0.5]];
  const K = [[1, 1], [0, 2], [-1, 0]];
  const V = [[1, 0, 2], [0, 1, 0.5], [3, -1, 0]];
  it("softmax rows are positive and sum to 1; it is stable for huge scores", () => {
    const p = softmax([1000, 1001, 999]);
    expect(p.reduce((a, b) => a + b)).toBeCloseTo(1, 12);
    expect(p[1]).toBeGreaterThan(p[0]);
  });
  it("scores, weights and outputs match NumPy", () => {
    const r = attention(Q, K, V);
    closeM(r.raw, fx.att.raw);
    closeM(r.weights, fx.att.w);
    closeM(r.output, fx.att.o);
    r.weights.forEach((row) => expect(row.reduce((a, b) => a + b)).toBeCloseTo(1, 12));
  });
  it("without the 1/sqrt(d_k) scaling the weights are sharper (NumPy values)", () => {
    const r = attention(Q, K, V, false);
    closeM(r.weights, fx.att.wu);
    closeM(r.output, fx.att.ou);
    expect(Math.max(...r.weights[0])).toBeGreaterThan(Math.max(...attention(Q, K, V).weights[0]));
  });
  it("unscaled softmax saturates as d_k grows; the scaled one does not", () => {
    const small = saturation(4, 8, 7);
    const big = saturation(256, 8, 7);
    expect(big.unscaled).toBeGreaterThan(0.9);
    expect(big.scaled).toBeLessThan(0.6);
    expect(big.unscaled - big.scaled).toBeGreaterThan(small.unscaled - small.scaled);
  });
});

describe("recorded DistilBERT attention", () => {
  it("every recorded map decodes to the stated shape, and its rows sum to about 1", () => {
    for (const s of RECORDED_ATTENTION) {
      const n = s.tokens.length;
      expect(atob(s.att).length).toBe(s.layers * s.heads * n * n);
      const a = decodeAttention(s.att, s.layers, s.heads, n);
      expect(a.length).toBe(6);
      for (const row of a[5][0]) expect(Math.abs(row.reduce((x, y) => x + y) - 1)).toBeLessThan(0.05);
    }
  });
  it("contains the paper sentence with its 13 tokens, and the prediction 0.9997 positive", () => {
    const p = RECORDED_ATTENTION.find((s) => s.id === "paper")!;
    expect(p.tokens).toEqual(["[CLS]", "the", "plot", "was", "not", "good", ",", "but", "the", "acting", "was", "brilliant", "[SEP]"]);
    expect(p.pPos).toBeCloseTo(0.9997, 4);
  });
  it("meanMaps averages heads", () => {
    expect(meanMaps([[[0, 1], [1, 0]], [[1, 0], [1, 0]]])).toEqual([[0.5, 0.5], [1, 0]]);
  });
});

describe("multi-head attention", () => {
  it("split, per-head attention, concat and W_O match NumPy (d=4, h=2, d_k=2)", () => {
    const m = fx.mh;
    const heads = [0, 1].map((i) => ({ Wq: m.Wq[i], Wk: m.Wk[i], Wv: m.Wv[i] }));
    const r = multiHead(m.H, heads, m.Wo);
    closeM(r.concat, m.concat);
    closeM(r.output, m.out);
    expect(r.concat[0]).toHaveLength(4); // h * d_k = d
  });
  it("toy weights have the right shapes", () => {
    const w = toyMultiHeadWeights(8, 4, 1);
    expect(w.heads).toHaveLength(4);
    expect(w.heads[0].Wq).toHaveLength(8);
    expect(w.heads[0].Wq[0]).toHaveLength(2);
    expect(w.Wo).toHaveLength(8);
  });
});

describe("feed-forward, GELU, layer norm", () => {
  const xs = [-3, -1, -0.5, 0, 0.5, 1, 2, 3.5];
  it("erf agrees with Python's math.erf", () => close([0.1, 0.5, 1, 2, 2.9, 3, 3.5, 5, -1.5].map(erf), fx.erf, 1e-12));
  it("exact GELU matches Python", () => close(xs.map(gelu), fx.gelu, 1e-12));
  it("tanh-approximate GELU matches Python and differs from the exact form by less than 1e-3", () => {
    close(xs.map(geluTanh), fx.gelut, 1e-12);
    xs.forEach((x) => expect(Math.abs(gelu(x) - geluTanh(x))).toBeLessThan(1e-3));
    expect(Math.abs(gelu(-3) - geluTanh(-3))).toBeGreaterThan(0);
  });
  it("layer norm with gamma and beta matches NumPy", () => close(layerNorm([1, 2, 4, 8], [1, 0.5, 2, 1], [0, 0.1, -0.1, 0.2]), fx.ln, 1e-9));
  it("layer norm without gamma/beta has mean 0 and variance about 1", () => {
    const y = layerNorm([3, -1, 7, 2, 9]);
    expect(Math.abs(y.reduce((a, b) => a + b) / 5)).toBeLessThan(1e-12);
    expect(y.reduce((a, b) => a + b * b, 0) / 5).toBeCloseTo(1, 4);
  });
  it("FFN with GELU matches NumPy", () => {
    const r = ffn([1, -2], [[0.5, -0.2, 0.1], [0.3, 0.8, -0.5]], [0.1, 0, -0.1], [[1, 0], [0.5, -1], [-0.5, 2]], [0, 0.3]);
    close(r.hidden, fx.ffn.hidden);
    close(r.activated, fx.ffn.act, 1e-12);
    close(r.output, fx.ffn.out, 1e-12);
  });
});

describe("parameter counter (the real sizes of the paper's summary_table.csv)", () => {
  it("BERT-tiny with a 2-class head = 4,386,178", () => expect(paramTotal(BERT_TINY)).toBe(4386178));
  it("BERT-small with a 2-class head = 28,764,674", () => expect(paramTotal(BERT_SMALL)).toBe(28764674));
  it("DistilBERT (no token-type embeddings, pre-classifier + classifier) = 66,955,010", () => expect(paramTotal(DISTILBERT)).toBe(66955010));
  it("agrees with the independent Python formula, including BERT-base (109,483,778) and an odd configuration", () => {
    expect(paramTotal({ ...DISTILBERT, tokenTypes: true, layers: 12 })).toBe(fx.params.base);
    const odd: EncoderConfig = { vocab: 1000, d: 64, layers: 3, heads: 4, ff: 256, maxPositions: 64, tokenTypes: true, headDense: true, classes: 3 };
    expect(paramTotal(odd)).toBe(fx.params.v10);
  });
  it("the number of heads does not change the count", () => expect(paramTotal({ ...BERT_SMALL, heads: 4 })).toBe(paramTotal(BERT_SMALL)));
  it("the breakdown has named parts that add up and the embeddings dominate BERT-tiny", () => {
    const b = paramBreakdown(BERT_TINY);
    expect(b.reduce((s, p) => s + p.count, 0)).toBe(4386178);
    expect(b.find((p) => p.id === "word")!.count).toBe(30522 * 128);
    expect(b.find((p) => p.id === "attn")!.count).toBe(2 * 4 * (128 * 128 + 128));
    expect(b.find((p) => p.id === "type")).toBeTruthy();
    expect(paramBreakdown(DISTILBERT).find((p) => p.id === "type")).toBeUndefined();
  });
  it("equals the parameters column of the repository's summary table for the three fine-tuned encoders", () => {
    const get = (n: string) => RECORDED.models.find((m) => m.name.startsWith(n))!.params;
    expect(get("BERT-tiny")).toBe(paramTotal(BERT_TINY));
    expect(get("BERT-small")).toBe(paramTotal(BERT_SMALL));
    expect(get("DistilBERT fine-tuned")).toBe(paramTotal(DISTILBERT));
  });
});

describe("complexity", () => {
  it("attention costs n²d, recurrence n d²: they are equal at n = d and attention is cheaper below it", () => {
    expect(attentionOps(768, 768)).toBe(recurrentOps(768, 768));
    expect(attentionOps(64, 768)).toBeLessThan(recurrentOps(64, 768));
    expect(attentionOps(2000, 768)).toBeGreaterThan(recurrentOps(2000, 768));
    expect(attentionOps(64, 768)).toBe(64 * 64 * 768);
  });
  it("sequential steps: 1 against n", () => {
    expect(sequentialSteps(64, "attention")).toBe(1);
    expect(sequentialSteps(64, "recurrent")).toBe(64);
  });
});

describe("training", () => {
  it("learning-rate schedule: 10 % linear warm-up, then linear decay (NumPy values)", () => {
    close([0, 37, 75, 76, 400, 750].map((s) => lrAt(s, 750, 5e-5)), fx.lr, 1e-15);
    close([0, 75, 750].map((s) => lrAt(s, 750, 2e-4)), fx.lr_tiny, 1e-15);
    const sch = lrSchedule(750, 5e-5);
    expect(Math.max(...sch)).toBeCloseTo(5e-5, 15);
    expect(sch.indexOf(Math.max(...sch))).toBe(75);
    expect(sch[750]).toBe(0);
  });
  it("optimizer steps of the paper's runs", () => {
    expect(totalSteps(8000, 32, 3)).toBe(750);
    expect(totalSteps(8000, 32, 2)).toBe(500);
    expect(HPARAMS.map((h) => h.peak)).toEqual([2e-4, 1e-4, 5e-5]);
    expect(HPARAMS.every((h) => h.batch === 32 && h.maxLen === 64)).toBe(true);
  });
  it("AdamW matches a Python implementation over three steps", () => {
    let theta = 1;
    let st = { m: 0, v: 0, t: 0 };
    const out: number[] = [];
    for (const g of [0.5, -0.2, 0.3]) {
      const r = adamwStep(theta, g, st, 1e-3);
      theta = r.theta; st = r.state; out.push(theta);
    }
    close(out, fx.adamw, 1e-12);
  });
  it("[CLS] head and cross-entropy match NumPy", () => {
    const r = classify([1, 2, -1], [[0.2, -0.1, 0.4], [-0.3, 0.5, 0.1]], [0.05, -0.05]);
    close(r.logits, fx.cls.logits, 1e-12);
    close(r.probs, fx.cls.probs, 1e-12);
    close([crossEntropy(r.probs, 0), crossEntropy(r.probs, 1)], fx.cls.ce, 1e-12);
  });
  it("gradient clipping to norm 1", () => {
    const c = clipNorm([3, 4], 1);
    close(c.g, [0.6, 0.8]);
    expect(c.norm).toBe(5);
    expect(clipNorm([0.3, 0.4], 1).scale).toBe(1);
  });
  it("masking is seeded and follows the 15 % and 80/10/10 rule on a large sample", () => {
    const toks = ["[CLS]", ...Array.from({ length: 2000 }, (_, i) => `w${i}`), "[SEP]"];
    const a = maskTokens(toks, ["x", "y", "z"], 5);
    expect(maskTokens(toks, ["x", "y", "z"], 5)).toEqual(a);
    expect(maskTokens(toks, ["x", "y", "z"], 6)).not.toEqual(a);
    expect(a.selected.length / 2000).toBeGreaterThan(0.13);
    expect(a.selected.length / 2000).toBeLessThan(0.17);
    const acts = Object.values(a.action);
    const share = (k: string) => acts.filter((x) => x === k).length / acts.length;
    expect(share("mask")).toBeGreaterThan(0.74);
    expect(share("mask")).toBeLessThan(0.86);
    expect(share("random")).toBeGreaterThan(0.05);
    expect(share("keep")).toBeGreaterThan(0.05);
    expect(a.input[0]).toBe("[CLS]");
    expect(a.input[2001]).toBe("[SEP]");
    for (const i of a.selected) if (a.action[i] === "mask") expect(a.input[i]).toBe("[MASK]");
  });
  it("always selects at least one token of a short sentence", () => {
    for (let s = 0; s < 30; s++) expect(maskTokens(["[CLS]", "a", "b", "[SEP]"], ["q"], s).selected.length).toBeGreaterThanOrEqual(1);
  });
});

describe("toy WordPiece and embeddings", () => {
  it("greedy longest match splits 'unwatchable' like the paper's example", () => expect(wordpiece("unwatchable", TOY_VOCAB)).toEqual(["un", "##watch", "##able"]));
  it("a whole word in the vocabulary stays whole; unknown words give [UNK]", () => {
    expect(wordpiece("good", TOY_VOCAB)).toEqual(["good"]);
    expect(wordpiece("zzz", TOY_VOCAB)).toEqual(["[UNK]"]);
  });
  it("adds [CLS] and [SEP], lower-cases and separates punctuation", () =>
    expect(tokenizeToy("The plot was not good, but...", TOY_VOCAB).slice(0, 3)).toEqual(["[CLS]", "the", "plot"]));
  it("embeddings are deterministic per token", () => {
    const e = toyEmbeddings(["good", "bad", "good"], 4, 3);
    expect(e[0]).toEqual(e[2]);
    expect(e[0]).not.toEqual(e[1]);
    expect(e[0]).toHaveLength(4);
  });
  it("the recorded tokenisation examples are consistent", () => {
    expect(RECORDED.tokenisation[0]).toEqual({ word: "unwatchable", pieces: ["un", "##watch", "##able"] });
  });
  it("rng is reproducible", () => expect(rng(1)()).toBe(rng(1)()));
});
