import { describe, expect, it } from "vitest";
import { CODE_FILES } from "../labs/lab3/data/expCode";
import { LR_CHUNK as C0 } from "../labs/lab3/data/expLr0";
import { LR_CHUNK as C1 } from "../labs/lab3/data/expLr1";
import { LR_CHUNK as C2 } from "../labs/lab3/data/expLr2";
import { LR_CHUNK as C3 } from "../labs/lab3/data/expLr3";
import { LR_BIAS, LR_FEATURES, LR_TOP_NEG, LR_TOP_POS } from "../labs/lab3/data/expLrTop";
import { CURVE, DATASET, LC_TIME, MODELS, PAIRS, STATS, SUBSETS, SUBSET_SIZES } from "../labs/lab3/data/expModels";
import { GOLD, PREDS, SENTENCES } from "../labs/lab3/data/expPreds";
import {
  accuracy, bootstrapIntervals, buildLrModel, byTag, confusion, correctness, curveAt, exactMcNemarP, filterSentences, fmtDuration, fmtP,
  hasContrast, hasNegation, interpLog, labelsToReach, lcTrainSeconds, lrScore, macroMetrics, mcnemar, memoryMB, mulberry32, nbPredict,
  NEGATION_RE, CONTRAST_RE, ngrams, nliHypothesis, perSecond, rankModels, recommend, rightCount, secondsFor, softmax, splitFacts,
  subsetAccuracy, subsetIndices, tfidfRows, trainNb, wordTokens, type DecideInput,
} from "../labs/lab3/expMath";

const BEST = "pt_distilbert_sst2";
const near = (a: number, b: number, tol = 1e-9) => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThanOrEqual(tol);
const rel = (a: number, b: number, tol = 1e-9) => expect(Math.abs(a - b) / Math.abs(b), `${a} vs ${b}`).toBeLessThanOrEqual(tol);

describe("the recorded data is internally consistent", () => {
  it("has ten models and 872 sentences", () => {
    expect(MODELS).toHaveLength(10);
    expect(SENTENCES).toHaveLength(872);
    expect(GOLD).toHaveLength(872);
    for (const m of MODELS) expect(PREDS[m.tag]).toHaveLength(872);
  });
  it("accuracy, confusion matrix and macro metrics recomputed from the predictions equal summary_table.csv and the saved matrices", () => {
    for (const m of MODELS) {
      near(accuracy(PREDS[m.tag], GOLD), m.accuracy, 1e-12);
      expect(confusion(PREDS[m.tag], GOLD), m.tag).toEqual(m.confusion);
      const mac = macroMetrics(confusion(PREDS[m.tag], GOLD));
      near(mac.precision, m.precision, 1e-12);
      near(mac.recall, m.recall, 1e-12);
      near(mac.f1, m.f1, 1e-12);
    }
  });
  it("the test split facts: 872 sentences, 50.9 % positive, 19.5 words (Table 3)", () => {
    const f = splitFacts(SENTENCES, GOLD);
    expect(f.size).toBe(872);
    near(f.positiveShare, DATASET.test_pos, 1e-12);
    near(f.meanWords, DATASET.test_len, 1e-9);
    expect(f.positiveShare.toFixed(3)).toBe("0.509");
    expect(f.meanWords.toFixed(1)).toBe("19.5");
    expect(DATASET.train).toBe(65349);
    expect(DATASET.dev).toBe(2000);
    expect(DATASET.test).toBe(872);
  });
});

describe("exact McNemar test", () => {
  it("matches independent values (math.comb sums)", () => {
    rel(exactMcNemarP(48, 28), 0.02862665550873788);
    rel(exactMcNemarP(104, 53), 5.73972746966961e-05);
    rel(exactMcNemarP(71, 64), 0.6057422651905525);
    rel(exactMcNemarP(154, 28), 2.7918433104683494e-22);
    rel(exactMcNemarP(7, 3), 0.34375);
    rel(exactMcNemarP(0, 5), 0.0625);
    rel(exactMcNemarP(300, 100), 2.5918869069720767e-24);
    expect(exactMcNemarP(10, 10)).toBe(1);
    expect(exactMcNemarP(0, 0)).toBe(1);
  });
  it("is symmetric and never above 1", () => {
    for (const [b, c] of [[3, 9], [20, 21], [1, 40]]) { expect(exactMcNemarP(b, c)).toBe(exactMcNemarP(c, b)); expect(exactMcNemarP(b, c)).toBeLessThanOrEqual(1); }
  });
  it("recomputed b/c counts and p-values equal statistics.csv for EVERY model", () => {
    for (const m of MODELS) {
      const r = mcnemar(PREDS[BEST], PREDS[m.tag], GOLD);
      const s = STATS[m.tag];
      expect(r.onlyA, `${m.tag} b01`).toBe(s.bestOnly);
      expect(r.onlyB, `${m.tag} b10`).toBe(s.modelOnly);
      rel(r.p, s.p, 1e-9);
    }
  });
  it("the paper's headline pairs", () => {
    const ft = mcnemar(PREDS["ft_distilbert_8000"], PREDS[BEST], GOLD);
    expect([ft.onlyB, ft.onlyA]).toEqual([48, 28]); // best only 48, fine-tuned only 28
    expect(ft.p.toFixed(3)).toBe("0.029");
    const vsSvm = mcnemar(PREDS["ft_distilbert_8000"], PREDS["tfidf_svm"], GOLD);
    expect([vsSvm.onlyA, vsSvm.onlyB]).toEqual([104, 53]);
    expect(vsSvm.p).toBeLessThan(0.001);
    const small = mcnemar(PREDS["ft_bert-small_8000"], PREDS["tfidf_svm"], GOLD);
    expect([small.onlyA, small.onlyB]).toEqual([71, 64]);
    expect(small.p.toFixed(2)).toBe("0.61");
    expect(mcnemar(PREDS["bilstm"], PREDS["tfidf_svm"], GOLD).p).toBe(1);
    expect(mcnemar(PREDS["zs_nli_distilroberta"], PREDS["tfidf_logreg"], GOLD).p).toBe(1);
  });
  it("the generated PAIRS and SUBSET_SIZES equal what the browser recomputes from the predictions", () => {
    expect(PAIRS).toHaveLength(5);
    for (const p of PAIRS) {
      const r = mcnemar(PREDS[p.a], PREDS[p.b], GOLD);
      expect([r.onlyA, r.onlyB], `${p.a} vs ${p.b}`).toEqual([p.onlyA, p.onlyB]);
      rel(r.p, p.p, 1e-9);
    }
    expect(SUBSET_SIZES).toEqual({ negation: subsetIndices(SENTENCES, NEGATION_RE).length, contrast: subsetIndices(SENTENCES, CONTRAST_RE).length });
  });
  it("formats p-values", () => {
    expect(fmtP(5.7e-5)).toBe("< 0.001");
    expect(fmtP(0.0286)).toBe("0.029");
  });
});

describe("bootstrap", () => {
  const corr = MODELS.map((m) => correctness(PREDS[m.tag], GOLD));
  const ci = bootstrapIntervals(corr, 2000, 42);
  it("lies within 0.6 percentage points of the recorded interval of every model", () => {
    MODELS.forEach((m, k) => {
      expect(Math.abs(ci[k].low - STATS[m.tag].ciLow), `${m.tag} low`).toBeLessThan(0.006);
      expect(Math.abs(ci[k].high - STATS[m.tag].ciHigh), `${m.tag} high`).toBeLessThan(0.006);
      expect(ci[k].low).toBeLessThan(m.accuracy);
      expect(ci[k].high).toBeGreaterThan(m.accuracy);
    });
  });
  it("is repeatable for the same seed and differs for another", () => {
    const again = bootstrapIntervals(corr, 2000, 42);
    expect(again).toEqual(ci);
    expect(bootstrapIntervals(corr, 2000, 7)[0].low).not.toBe(ci[0].low);
  });
  it("the generator is uniform in [0, 1)", () => {
    const r = mulberry32(1);
    let s = 0;
    for (let i = 0; i < 20000; i++) { const v = r(); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); s += v; }
    near(s / 20000, 0.5, 0.01);
  });
});

describe("negation and contrast subsets", () => {
  it("the keyword rules give 184 and 130 sentences", () => {
    expect(subsetIndices(SENTENCES, NEGATION_RE)).toHaveLength(184);
    expect(subsetIndices(SENTENCES, CONTRAST_RE)).toHaveLength(130);
    expect(hasNegation("it does n't work")).toBe(true);
    expect(hasNegation("a nothing of a film")).toBe(true);
    expect(hasNegation("a snot of a film")).toBe(false);
    expect(hasContrast("good but dull")).toBe(true);
    expect(hasContrast("a butter film")).toBe(false);
  });
  it("subset accuracies recomputed from the predictions equal subset_accuracy.csv for every model", () => {
    const neg = subsetIndices(SENTENCES, NEGATION_RE), con = subsetIndices(SENTENCES, CONTRAST_RE);
    for (const m of MODELS) {
      near(subsetAccuracy(PREDS[m.tag], GOLD, neg), SUBSETS[m.tag].negation, 1e-12);
      near(subsetAccuracy(PREDS[m.tag], GOLD, con), SUBSETS[m.tag].contrast, 1e-12);
    }
  });
  it("the paper's drops on negation (points): SST2 -4.1, fine-tuned DistilBERT -3.4, Twitter-RoBERTa -2.1, BERT-small -9.3, BiLSTM -4.0", () => {
    const drop = (t: string) => ((SUBSETS[t].negation - SUBSETS[t].all) * 100);
    expect(drop("pt_distilbert_sst2").toFixed(1)).toBe("-4.1");
    expect(drop("ft_distilbert_8000").toFixed(1)).toBe("-3.4");
    expect(drop("pt_twitter_roberta").toFixed(1)).toBe("-2.1");
    expect(drop("ft_bert-small_8000").toFixed(1)).toBe("-9.3");
    expect(drop("bilstm").toFixed(1)).toBe("-4.0");
    expect(drop("zs_nli_distilroberta").toFixed(1)).toBe("-0.2");
  });
});

describe("cost numbers", () => {
  it("calculators", () => {
    expect(secondsFor(1000, 39.13225814222984)).toBeCloseTo(39.132, 3);
    expect(perSecond(40)).toBe(25);
    expect(memoryMB(4386178)).toBeCloseTo(17.54, 2); // BERT-tiny: the paper's "17 MB"
    expect(memoryMB(124647939)).toBeCloseTo(498.6, 1); // Twitter-RoBERTa: "500 MB"
    expect(memoryMB(124647939, 2)).toBeCloseTo(249.3, 1);
    expect(fmtDuration(9529.979623399966)).toBe("2 h 39 min");
    expect(fmtDuration(380.01)).toBe("6 min 20 s");
    expect(fmtDuration(0.05)).toBe("50 ms");
  });
  it("the paper's ratios: 20 to 2,000 times slower, 60 to 1,700 times larger than TF-IDF", () => {
    const tfidf = ["tfidf_nb", "tfidf_logreg", "tfidf_svm"].map(byTag);
    const tr = MODELS.filter((m) => m.family === "transformer");
    const slow = tr.map((m) => m.latencyMs / byTag("tfidf_svm").latencyMs);
    expect(Math.min(...slow)).toBeGreaterThan(20);
    expect(Math.max(...slow)).toBeLessThan(2000);
    const big = tr.map((m) => m.params / byTag("tfidf_logreg").params);
    expect(Math.round(Math.min(...big))).toBe(60);
    expect(Math.round(Math.max(...big) / 100) * 100).toBe(1700);
    expect(tfidf.every((m) => m.latencyMs < 0.06)).toBe(true);
    expect(byTag("ft_distilbert_8000").trainSeconds / 3600).toBeCloseTo(2.65, 2);
    expect(byTag("ft_bert-small_8000").trainSeconds / 60).toBeCloseTo(26.3, 1);
    expect(1000 / byTag("ft_distilbert_8000").latencyMs).toBeCloseTo(25.6, 1); // "about 25 sentences per second"
  });
});

describe("learning curves", () => {
  it("interpolation is exact at the measured sizes and monotone between", () => {
    for (const p of CURVE["bert-small"]) near(curveAt("bert-small", p.n), p.accuracy, 1e-12);
    for (const p of CURVE["tfidf-lr"]) near(curveAt("tfidf-lr", p.n), p.accuracy, 1e-12);
    expect(curveAt("bert-small", 700)).toBeGreaterThan(curveAt("bert-small", 500));
    expect(curveAt("bert-small", 700)).toBeLessThan(curveAt("bert-small", 1000));
    expect(curveAt("bert-small", 100000)).toBe(curveAt("bert-small", 8000));
    expect(interpLog([{ n: 1, v: 0 }, { n: 100, v: 2 }], 10)).toBeCloseTo(1, 12);
  });
  it("the paper's findings: +14.1 points at 500, +6.9 at 4,000, +6.2 at 8,000; BERT-small at 4,000 about equals the SVM on 65,349", () => {
    const gain = (n: number) => (curveAt("bert-small", n) - curveAt("tfidf-lr", n)) * 100;
    expect(gain(500).toFixed(1)).toBe("14.1");
    expect(gain(4000).toFixed(1)).toBe("6.9");
    expect(gain(8000).toFixed(1)).toBe("6.2");
    expect((curveAt("bert-small", 4000) * 100).toFixed(1)).toBe("82.7");
    expect((byTag("tfidf_svm").accuracy * 100).toFixed(1)).toBe("82.9");
    const need = labelsToReach("bert-small", byTag("tfidf_svm").accuracy)!;
    expect(need).toBeGreaterThan(4000);
    expect(need).toBeLessThan(4700);
    expect(65349 / 4000).toBeGreaterThan(16);
    expect(labelsToReach("tfidf-lr", 0.99)).toBeNull();
  });
  it("fine-tuning time grows with the number of labels", () => {
    expect(lcTrainSeconds(500)).toBeCloseTo(LC_TIME[0].trainSeconds, 6);
    expect(lcTrainSeconds(8000)).toBeCloseTo(byTag("ft_bert-small_8000").trainSeconds, 6);
    expect(lcTrainSeconds(3000)).toBeGreaterThan(lcTrainSeconds(2000));
  });
});

describe("the real TF-IDF + logistic regression model in the browser", () => {
  const model = buildLrModel([C0, C1, C2, C3], LR_BIAS);
  it("joins the four chunks into the 73,556-term vocabulary", () => {
    expect(model.terms).toHaveLength(LR_FEATURES);
    expect(model.idf).toHaveLength(LR_FEATURES);
    expect(model.coef).toHaveLength(LR_FEATURES);
    expect(model.index.get("good")).toBeDefined();
    near(model.coef[model.index.get("bad")!], -10.074, 1e-9);
    near(model.coef[model.index.get("good")!], 8.399, 1e-9);
    expect(LR_TOP_POS[0].t).toBe("good");
    expect(LR_TOP_NEG[0].t).toBe("bad");
  });
  it("tokens, n-grams and the feature vector follow scikit-learn", () => {
    expect(wordTokens("It's NOT good , but fun!")).toEqual(["it", "not", "good", "but", "fun"]);
    expect(wordTokens("how do you spell cliché ?")).toEqual(["how", "do", "you", "spell", "cliché"]);
    expect(ngrams(["not", "good"])).toEqual(["not", "good", "not good"]);
    const rows = tfidfRows("not good", model);
    const norm = Math.sqrt(rows.reduce((s, r) => s + r.weight * r.weight, 0));
    near(norm, 1, 1e-12);
    expect(rows.map((r) => r.term).sort()).toEqual(["good", "not", "not good"]);
    const { z, p } = lrScore(rows, model.bias);
    expect(p).toBeCloseTo(1 / (1 + Math.exp(-z)), 12);
  });
  it("reproduces the recorded predictions of the Python model on the 872 test sentences", () => {
    let same = 0;
    for (let i = 0; i < SENTENCES.length; i++) {
      const z = lrScore(tfidfRows(SENTENCES[i], model), model.bias).z;
      if ((z > 0 ? "1" : "0") === PREDS["tfidf_logreg"][i]) same++;
    }
    expect(same).toBe(SENTENCES.length); // all 872: the tokenizer is Unicode-aware like Python (one sentence has "cliché")
  });
  it("an empty or unknown sentence falls back to the bias", () => {
    const rows = tfidfRows("zzzqqq xxyyzz", model);
    expect(rows).toHaveLength(0);
    near(lrScore(rows, model.bias).z, model.bias, 1e-12);
  });
});

describe("naive Bayes illustration", () => {
  const nb = trainNb(SENTENCES, [...GOLD].map(Number), 0.5);
  it("probabilities are consistent and a clearly positive word pushes towards positive", () => {
    const a = nbPredict(nb, "a wonderful moving film");
    expect(a.pPositive).toBeGreaterThan(0.5);
    const b = nbPredict(nb, "a dull and boring mess");
    expect(b.pPositive).toBeLessThan(0.5);
    expect(a.pPositive).toBeGreaterThan(0);
    expect(a.pPositive).toBeLessThan(1);
  });
  it("matches a hand computation on a tiny corpus", () => {
    const m = trainNb(["good good", "bad"], [1, 0], 0.5);
    // V = 2; P(good|pos) = (2 + .5) / (2 + 1) ; P(good|neg) = (0 + .5) / (1 + 1)
    const r = nbPredict(m, "good");
    const lpos = Math.log(0.5) + Math.log(2.5 / 3), lneg = Math.log(0.5) + Math.log(0.5 / 2);
    near(r.logPosterior[1], lpos, 1e-12);
    near(r.logPosterior[0], lneg, 1e-12);
    near(r.pPositive, 1 / (1 + Math.exp(lneg - lpos)), 1e-12);
  });
});

describe("zero-shot toy and the hypothesis template", () => {
  it("softmax sums to one and keeps the order", () => {
    const p = softmax([2, 0.5]);
    near(p[0] + p[1], 1, 1e-12);
    expect(p[0]).toBeGreaterThan(p[1]);
    expect(softmax([1000, 1000])[0]).toBeCloseTo(0.5, 12);
  });
  it("uses the paper's template", () => {
    expect(nliHypothesis("positive")).toBe("The sentiment of this movie review is positive.");
    expect(CODE_FILES.find((f) => f.file === "05_pretrained_transformers.py")!.code).toContain("The sentiment of this movie review is {}.");
  });
});

describe("decision helper", () => {
  const base: DecideInput = { publicInDomain: false, publicRelated: false, labels: 8000, maxLatencyMs: 200, maxTrainMinutes: 600, english: true };
  it("recommendation 1: a public in-domain model beats everything", () => {
    expect(recommend({ ...base, publicInDomain: true })).toEqual({ step: 1, tag: "pt_distilbert_sst2" });
  });
  it("recommendation 2: a few thousand labels and no public model: fine-tune DistilBERT (or BERT-small on a tight budget)", () => {
    expect(recommend(base)).toEqual({ step: 2, tag: "ft_distilbert_8000" });
    expect(recommend({ ...base, maxTrainMinutes: 60 }).tag).toBe("ft_bert-small_8000");
    expect(recommend({ ...base, labels: 2000, maxTrainMinutes: 60 }).tag).toBe("ft_bert-small_8000");
    expect(recommend({ ...base, labels: 4000 })).toEqual({ step: 2, tag: "ft_distilbert_8000" });
    expect(recommend({ ...base, labels: 500 }).step).not.toBe(2); // below a thousand labels the paper's rule 2 does not apply
  });
  it("recommendation 3: no labels at all: zero-shot", () => {
    expect(recommend({ ...base, labels: 0 })).toEqual({ step: 3, tag: "zs_nli_distilroberta" });
  });
  it("recommendation 4: extreme speed limit: TF-IDF", () => {
    const r = recommend({ ...base, maxLatencyMs: 0.1, publicInDomain: true });
    expect(r.step).toBe(4);
    expect(["tfidf_svm", "tfidf_logreg", "tfidf_nb"]).toContain(r.tag);
  });
  it("nothing fits: no labels and an extreme speed limit", () => {
    expect(recommend({ ...base, labels: 0, maxLatencyMs: 0.1 })).toEqual({ step: 0, tag: null });
  });
  it("the ranking excludes with reasons and is sorted: fitting models first, by accuracy", () => {
    const r = rankModels({ ...base, labels: 0 });
    const ok = r.filter((x) => x.ok);
    expect(ok.map((x) => x.model.tag)).toEqual(["zs_nli_distilroberta"]);
    expect(r.find((x) => x.model.tag === "pt_distilbert_sst2")!.reasons[0].key).toBe("needInDomain");
    expect(r.find((x) => x.model.tag === "tfidf_svm")!.reasons.map((x) => x.key)).toContain("needLabels");
    const all = rankModels({ ...base, publicInDomain: true, publicRelated: true, labels: 65349 });
    const accs = all.filter((x) => x.ok).map((x) => x.accuracy);
    expect([...accs].sort((a, b) => b - a)).toEqual(accs);
    expect(all[0].model.tag).toBe("pt_distilbert_sst2");
  });
  it("with 1,000 labels BERT-small is read off the learning curve", () => {
    const r = rankModels({ ...base, labels: 1000 }).find((x) => x.model.tag === "ft_bert-small_8000")!;
    expect(r.basis).toBe("curve");
    near(r.accuracy, CURVE["bert-small"][1].accuracy, 1e-12);
  });
  it("is deterministic", () => {
    expect(rankModels(base)).toEqual(rankModels(base));
  });
});

describe("sentence lab filters", () => {
  const f = (mode: Parameters<typeof filterSentences>[3]["mode"], query = "", tag?: string) => filterSentences(SENTENCES, GOLD, PREDS, { mode, query, tag });
  it("presets", () => {
    expect(f("all")).toHaveLength(872);
    expect(f("negation")).toHaveLength(184);
    expect(f("contrast")).toHaveLength(130);
    expect(f("distilRightSvmWrong")).toHaveLength(104);
    expect(f("svmRightDistilWrong")).toHaveLength(53);
    const dis = f("disagree"), aw = f("allWrong"), ar = f("allRight");
    expect(dis.length + aw.length + ar.length).toBe(872);
    aw.forEach((i) => expect(rightCount(PREDS, GOLD, i)).toBe(0));
    expect(f("modelWrong", "", "pt_distilbert_sst2")).toHaveLength(Math.round((1 - byTag("pt_distilbert_sst2").accuracy) * 872));
  });
  it("text search is case-insensitive and combines with the preset", () => {
    const hits = f("all", "  BRILLIANT ");
    expect(hits.length).toBeGreaterThan(0);
    hits.forEach((i) => expect(SENTENCES[i]).toContain("brilliant"));
    f("negation", "never").forEach((i) => expect(hasNegation(SENTENCES[i])).toBe(true));
  });
  it("the paper's example sentences are in the table", () => {
    const grease = SENTENCES.findIndex((s) => s.startsWith("in its best moments , resembles a bad high school production of grease"));
    expect(grease).toBeGreaterThanOrEqual(0);
    expect(PREDS["tfidf_svm"][grease]).not.toBe(GOLD[grease]);
    expect(PREDS["ft_distilbert_8000"][grease]).toBe(GOLD[grease]);
  });
});

describe("the code files", () => {
  it("are the nine scripts, utils, run_all.sh and requirements.txt", () => {
    const names = CODE_FILES.map((c) => c.file);
    for (let i = 1; i <= 9; i++) expect(names.some((n) => n.startsWith(`0${i}_`))).toBe(true);
    expect(names).toEqual(expect.arrayContaining(["utils.py", "run_all.sh", "requirements.txt"]));
    expect(CODE_FILES.find((c) => c.file === "run_all.sh")!.code).toContain("bash") ;
    const py = CODE_FILES.filter((c) => /^0\d_/.test(c.file)).reduce((n, c) => n + c.lines, 0);
    expect(py).toBeGreaterThan(500); // the paper: "about 770 lines of code in nine scripts"
  });
});
