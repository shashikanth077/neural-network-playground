import { TASK11, TASK21, TASK23 } from "../labs/lab2/data/results";
import {
  bbox, boxResample, brushStroke, cnnBreakdown, conv1dWindows, conv2d, convAt, defaultDigit, denseParams, embedValues,
  emptyImg, gradientPath, gruParams, hashId, inkFromRgba, KERNELS, LAB1_SIZES, lrBand, lstmParams, pool2x2, preprocessInk,
  REVIEWS, runCell, SIZE, wordsOf, oneHotOnes,
} from "../labs/lab2/math";

/** A 28×28 image with a vertical bar at x = 10, rows 5…20 (values as in the NumPy reference). */
const bar = () => {
  const img = emptyImg();
  for (let y = 5; y <= 20; y++) img[y * SIZE + 10] = 1;
  return img;
};

describe("Conv2D", () => {
  it("same padding keeps 28×28; valid gives 26×26", () => {
    expect(conv2d(bar(), KERNELS[0].w, "same", false).n).toBe(28);
    expect(conv2d(bar(), KERNELS[0].w, "valid", false).n).toBe(26);
  });
  it("vertical-edge kernel: the bar gives +4 on its left and −4 on its right (NumPy reference)", () => {
    const { out } = conv2d(bar(), KERNELS[0].w, "same", false);
    expect(out[9 * 28 + 9]).toBeCloseTo(4, 5);
    expect(out[9 * 28 + 11]).toBeCloseTo(-4, 5);
    expect(out[9 * 28 + 10]).toBeCloseTo(0, 5);
  });
  it("valid output (x=8, y=9) sees the bar on its right column: +4 (NumPy reference)", () => {
    const { out, n } = conv2d(bar(), KERNELS[0].w, "valid", false);
    expect(out[9 * n + 8]).toBeCloseTo(4, 5);
    expect(out[9 * n + 9]).toBeCloseTo(0, 5);
  });
  it("ReLU clips every negative value to 0", () => {
    const { out } = conv2d(bar(), KERNELS[0].w, "same", true);
    expect(Math.min(...out)).toBe(0);
    expect(out[9 * 28 + 11]).toBe(0);
  });
  it("hover calculation adds up to the same output value", () => {
    const r = convAt(bar(), KERNELS[0].w, "same", 9, 9);
    expect(r.sum).toBeCloseTo(4, 5);
    expect(r.cells).toHaveLength(9);
    expect(r.cells.reduce((s, c) => s + c.p, 0)).toBeCloseTo(r.sum, 5);
    const outside = convAt(bar(), KERNELS[0].w, "same", 0, 0);
    expect(outside.cells.filter((c) => c.iy < 0 || c.ix < 0)).toHaveLength(5);
  });
  it("five presets, the blur kernel sums to 1", () => {
    expect(KERNELS).toHaveLength(5);
    expect(KERNELS[2].w.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });
});

describe("pooling", () => {
  const grid = [1, 3, 2, 8, 5, 6, 7, 0, 9, 1, 4, 4, 2, 2, 6, 5];
  it("max pooling keeps the largest of each 2×2 block (NumPy reference)", () => {
    expect(pool2x2(grid, "max")).toEqual([6, 8, 9, 6]);
  });
  it("average pooling takes the mean of each block (NumPy reference)", () => {
    expect(pool2x2(grid, "avg")).toEqual([3.75, 4.25, 3.5, 4.75]);
  });
});

describe("parameter counts (Keras formulas, checked against the recorded runs)", () => {
  it("the lab's default and 3-block CNN", () => {
    expect(cnnBreakdown({ blocks: 2, firstFilters: 32, kernel: 3 }).total).toBe(421642);
    const three = cnnBreakdown({ blocks: 3, firstFilters: 32, kernel: 3 });
    expect(three.total).toBe(241546);
    expect(three.flat).toBe(1152);
    expect(three.size).toBe(3);
  });
  it("reproduces every recorded CNN run's parameter count", () => {
    const spec = [
      { blocks: 1, firstFilters: 32, kernel: 3 }, { blocks: 2, firstFilters: 32, kernel: 3 },
      { blocks: 2, firstFilters: 32, kernel: 5 }, { blocks: 3, firstFilters: 32, kernel: 3 },
      { blocks: 2, firstFilters: 64, kernel: 3 }, { blocks: 3, firstFilters: 32, kernel: 3 },
      { blocks: 3, firstFilters: 32, kernel: 3 }, { blocks: 3, firstFilters: 32, kernel: 3 },
      { blocks: 3, firstFilters: 32, kernel: 3 }, { blocks: 3, firstFilters: 32, kernel: 3 },
    ];
    expect(TASK11).toHaveLength(spec.length);
    TASK11.forEach((row, i) => expect(cnnBreakdown(spec[i]).total, `run ${row.Run}`).toBe(row.params));
  });
  it("the fully connected 512-256-128-64 net of Lab 1 has 575 050 parameters", () => {
    expect(denseParams(LAB1_SIZES)).toBe(575050);
  });
  it("the one-hot Dense net and the embedding Dense net (recorded runs 1 and 4 of task 2.1)", () => {
    expect(10000 * 16 + 16 + (16 * 1 + 1)).toBe(TASK21[0].params);
    expect(10000 * 16 + 200 * 16 * 16 + 16 + 16 + 1).toBe(TASK21[3].params);
  });
  it("LSTM and GRU layers: the recorded text models (64 units, 32-dim embedding, Dense 1)", () => {
    expect(10000 * 32 + lstmParams(64, 32) + 65).toBe(TASK23[0].params);
    expect(10000 * 32 + gruParams(64, 32) + 65).toBe(TASK23[5].params);
    expect(lstmParams(64, 32)).toBe(24832);
    expect(gruParams(64, 32)).toBe(18816);
  });
});

describe("learning rate on f(w) = w²", () => {
  it("starts at w = 4 and one epoch is one update w ← w − lr·2w", () => {
    const p = gradientPath(0.3, 2);
    expect(p[0]).toEqual({ w: 4, loss: 16 });
    expect(p[1].w).toBeCloseTo(1.6, 10);
    expect(p[2].w).toBeCloseTo(0.64, 10);
  });
  it("lr 0.3 for 10 epochs (NumPy reference)", () => {
    const last = gradientPath(0.3, 10).at(-1)!;
    expect(last.w).toBeCloseTo(0.0004194304, 10);
    expect(last.loss).toBeCloseTo(1.7592186e-7, 13);
  });
  it("lr above 1 makes the value jump across zero and grow (NumPy reference)", () => {
    expect(gradientPath(1.1, 3).at(-1)!.w).toBeCloseTo(-6.912, 10);
  });
  it("picks the explanation band", () => {
    expect(lrBand(1.1)).toBe("diverges");
    expect(lrBand(0.95)).toBe("closeToLimit");
    expect(lrBand(0.05)).toBe("small");
    expect(lrBand(0.3)).toBe("reasonable");
  });
});

describe("text encoding", () => {
  it("word numbers are stable and inside the 10 000-word vocabulary", () => {
    expect(hashId("great")).toBe(2646);
    expect(hashId("the")).toBe(4229);
    for (const w of ["a", "zzzzzzzzzz", "wonderful", "it's"]) {
      expect(hashId(w)).toBeGreaterThanOrEqual(27);
      expect(hashId(w)).toBeLessThan(10000);
    }
  });
  it("the default sentence has 9 words, 8 distinct word numbers", () => {
    const words = wordsOf("this movie was wonderful and the acting was great");
    expect(words).toHaveLength(9);
    expect(oneHotOnes(words.map(hashId))).toBe(8);
  });
  it("placeholder embedding values for 'great' (NumPy reference, 2 decimals)", () => {
    expect(embedValues(hashId("great")).map((v) => Number(v.toFixed(2)))).toEqual([0.42, 0.05, 0.03, 0.39]);
  });
  it("wordsOf lower-cases and drops punctuation", () => {
    expect(wordsOf("Good, NOT bad!")).toEqual(["good", "not", "bad"]);
  });
});

describe("Conv1D toy filter", () => {
  it("width 3 on 'the plot was not good at all' (NumPy reference)", () => {
    expect(conv1dWindows(REVIEWS[0], 3)).toEqual([0, 0, -0.6, -0.6, 0.6]);
  });
  it("width 2 on the same review", () => {
    expect(conv1dWindows(REVIEWS[0], 2)).toEqual([0, 0, 0, -0.6, 0.6, 0]);
  });
  it("'not bad but not great' and 'a truly great film with great acting'", () => {
    expect(conv1dWindows(REVIEWS[2], 3)).toEqual([0.6, -0.6, -0.6]);
    expect(conv1dWindows(REVIEWS[1], 3)).toEqual([0.84, 0.84, 0.6, 0.6, 0.6]);
  });
});

describe("LSTM and GRU toy cell (NumPy reference, same fixed weights)", () => {
  const lstmH = [0.07881566628824414, -0.046967051420830006, 0.31918923151013745, 0.09894631383640773, 0.4874899212569955, 0.5310560346319811];
  const gruH = [0.11952804181007905, -0.41357355457852296, 0.05842650943895583, -0.16167618593724023, 0.20723647238883297, 0.38302651650105335];
  it("LSTM hidden state after every word", () => {
    const run = runCell("LSTM");
    run.forEach((r, i) => expect(r.state.h).toBeCloseTo(lstmH[i], 10));
    expect(run.at(-1)!.state.c).toBeCloseTo(1.1701944894147447, 10);
  });
  it("GRU hidden state after every word, and no cell state", () => {
    const run = runCell("GRU");
    run.forEach((r, i) => expect(r.state.h).toBeCloseTo(gruH[i], 10));
    expect(run.every((r) => r.state.c === 0)).toBe(true);
  });
  it("gates are probabilities between 0 and 1", () => {
    for (const r of runCell("LSTM")) for (const k of ["f", "i", "o"]) expect(r.gates[k]).toBeGreaterThan(0);
  });
});

describe("digit preprocessing", () => {
  it("a brush stroke is brightest at its centre", () => {
    const img = emptyImg();
    brushStroke(img, 14.5, 14.5);
    expect(img[14 * SIZE + 14]).toBeCloseTo(1, 6);
    expect(img[14 * SIZE + 17]).toBe(0);
  });
  it("the default picture is a ring with a tail, not empty", () => {
    const d = defaultDigit();
    expect(d.reduce((a, b) => a + b, 0)).toBeGreaterThan(20);
  });
  it("area-average resampling of 2×2 blocks", () => {
    const src = Float32Array.from([1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0]);
    const out = boxResample(src, 4, { x0: 0, y0: 0, w: 4, h: 4 }, 2, 2);
    // rows: [1 0 0 0] [1 0 0 0] [1 1 0 0] [1 1 0 0] → blocks: (1+0+1+0)/4, 0, (1+1+1+1)/4, 0
    expect(Array.from(out)).toEqual([0.5, 0, 1, 0]);
  });
  it("bbox of an empty image is null", () => {
    expect(bbox(new Float32Array(16), 4)).toBeNull();
  });

  // L-shaped stroke 40 wide, 80 tall, with the top-right corner cut out, drawn on a 200 × 200 picture
  const W = 200;
  const inL = (x: number, y: number) => x >= 20 && x < 60 && y >= 100 && y < 180 && !(x >= 40 && x < 60 && y >= 100 && y < 140);
  const rgba = () => {
    const a = new Uint8ClampedArray(W * W * 4);
    for (let i = 0; i < W * W; i++) {
      const x = i % W, y = Math.floor(i / W);
      const [r, g, b] = inL(x, y) ? [34, 34, 34] : [217, 216, 210];
      a.set([r, g, b, 255], i * 4);
    }
    return a;
  };
  it("paper colour is found, ink is scaled to 1 and thresholded", () => {
    const { ink, paper, max } = inkFromRgba(rgba(), W);
    expect(paper).toEqual([217, 216, 210]);
    expect(max).toBe(183);
    expect(ink[120 * W + 30]).toBe(1);
    expect(ink[10 * W + 10]).toBe(0);
  });
  it("crop, scale to 20 px, centre of mass and shift (NumPy reference)", () => {
    const { ink } = inkFromRgba(rgba(), W);
    const p = preprocessInk(ink, W)!;
    expect(p.box).toEqual({ x0: 20, y0: 100, w: 40, h: 80 });
    expect([p.tw, p.th]).toEqual([10, 20]);
    expect(p.centre.cy).toBeCloseTo(14.901869158878505, 9);
    expect(p.centre.cx).toBeCloseTo(12.682242990654206, 9);
    expect(p.shift).toEqual({ dy: -1, dx: 1 });
    const sum = Array.from(p.stage4).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(214, 4);
    const rows = [...Array(SIZE).keys()].filter((y) => Array.from(p.stage4.slice(y * SIZE, y * SIZE + SIZE)).some((v) => v > 0));
    const cols = [...Array(SIZE).keys()].filter((x) => [...Array(SIZE).keys()].some((y) => p.stage4[y * SIZE + x] > 0));
    expect([rows[0], rows.at(-1)]).toEqual([2, 23]);
    expect([cols[0], cols.at(-1)]).toEqual([9, 20]);
  });
  it("an empty picture has nothing to preprocess", () => {
    const { ink, max } = inkFromRgba(new Uint8ClampedArray(W * W * 4).fill(200), W);
    expect(max).toBe(0);
    expect(preprocessInk(ink, W)).toBeNull();
  });
});

describe("recorded run tables used by the math tests", () => {
  it("the best CNN run is run 4, with 99.09 % test accuracy", () => {
    const best = TASK11.find((r) => r.Run === 4)!;
    expect(best.test_acc).toBe(0.9909);
    expect(best.params).toBe(241546);
  });
});
