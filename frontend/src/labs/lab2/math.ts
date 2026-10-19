/**
 * The maths behind the Lab 2 demos. Pure functions, no DOM: every value shown in the browser is computed here
 * and checked by the unit tests against NumPy / Keras-equivalent reference numbers.
 */

export const SIZE = 28;
/** A 28 × 28 greyscale image, row-major, values 0..1. */
export type Img = Float32Array;

export const sig = (x: number) => 1 / (1 + Math.exp(-x));

/** JavaScript Math.round semantics (halves go up), so the numbers match the lab script exactly. */
export const roundHalfUp = (x: number) => Math.floor(x + 0.5);

export const emptyImg = (): Img => new Float32Array(SIZE * SIZE);

/** Paint a soft disk; where strokes overlap the brighter value wins (the same rule as the lab's demo). */
export function stampDisk(img: Img, x: number, y: number, reach: number, falloff: number): void {
  for (let yy = 0; yy < SIZE; yy++) {
    for (let xx = 0; xx < SIZE; xx++) {
      const d = Math.hypot(xx + 0.5 - x, yy + 0.5 - y);
      if (d < reach) img[yy * SIZE + xx] = Math.max(img[yy * SIZE + xx], 1 - d / falloff);
    }
  }
}

/** The pen used by the drawing pad of the convolution step. */
export const brushStroke = (img: Img, x: number, y: number) => stampDisk(img, x, y, 1.6, 2.4);

/** The ring with a tail that is shown until the learner draws something. */
export function defaultDigit(): Img {
  const img = emptyImg();
  for (let a = 0; a < 6.3; a += 0.05) stampDisk(img, 11 + 5 * Math.cos(a), 9 + 4.5 * Math.sin(a), 1.4, 2);
  for (let y = 9; y < 22; y++) stampDisk(img, 16, y, 1.4, 2);
  return img;
}

// ---------------------------------------------------------------- Conv2D

export type Pad = "same" | "valid";

export const KERNELS: { name: string; w: number[] }[] = [
  { name: "Vertical edge", w: [-1, 0, 1, -2, 0, 2, -1, 0, 1] },
  { name: "Horizontal edge", w: [-1, -2, -1, 0, 0, 0, 1, 2, 1] },
  { name: "Blur (average)", w: [1, 1, 1, 1, 1, 1, 1, 1, 1].map((v) => v / 9) },
  { name: "Sharpen", w: [0, -1, 0, -1, 5, -1, 0, -1, 0] },
  { name: "Identity", w: [0, 0, 0, 0, 1, 0, 0, 0, 0] },
];

/**
 * A 3×3 convolution as Keras computes it (cross-correlation, no kernel flip).
 * `same` pads with zeros so the output stays 28×28; `valid` gives 26×26.
 */
export function conv2d(input: Img, kernel: number[], pad: Pad, relu: boolean): { n: number; out: Float32Array } {
  const off = pad === "same" ? 1 : 0;
  const n = pad === "same" ? SIZE : SIZE - 2;
  const out = new Float32Array(n * n);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let s = 0;
      for (let ky = 0; ky < 3; ky++) {
        for (let kx = 0; kx < 3; kx++) {
          const iy = y + ky - off;
          const ix = x + kx - off;
          if (iy >= 0 && iy < SIZE && ix >= 0 && ix < SIZE) s += input[iy * SIZE + ix] * kernel[ky * 3 + kx];
        }
      }
      out[y * n + x] = relu ? Math.max(0, s) : s;
    }
  }
  return { n, out };
}

/** The nine products behind one output pixel (for the hover calculation). */
export function convAt(input: Img, kernel: number[], pad: Pad, x: number, y: number) {
  const off = pad === "same" ? 1 : 0;
  const cells: { iy: number; ix: number; v: number; k: number; p: number }[] = [];
  let sum = 0;
  for (let ky = 0; ky < 3; ky++) {
    for (let kx = 0; kx < 3; kx++) {
      const iy = y + ky - off;
      const ix = x + kx - off;
      const inside = iy >= 0 && iy < SIZE && ix >= 0 && ix < SIZE;
      const v = inside ? input[iy * SIZE + ix] : 0;
      const k = kernel[ky * 3 + kx];
      cells.push({ iy, ix, v, k, p: v * k });
      sum += v * k;
    }
  }
  return { cells, sum };
}

// ---------------------------------------------------------------- pooling

/** 2×2 max or average pooling with stride 2 over a 4×4 grid (row-major, 16 numbers). */
export function pool2x2(g: number[], mode: "max" | "avg"): number[] {
  const out: number[] = [];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const b = [g[2 * r * 4 + 2 * c], g[2 * r * 4 + 2 * c + 1], g[(2 * r + 1) * 4 + 2 * c], g[(2 * r + 1) * 4 + 2 * c + 1]];
      out.push(mode === "max" ? Math.max(...b) : b.reduce((a, x) => a + x, 0) / 4);
    }
  }
  return out;
}

// ---------------------------------------------------------------- parameter counts

export interface CnnSpec { blocks: number; firstFilters: number; kernel: number }

/** Keras parameter count of the lab's CNN: (k·k·in + 1)·filters per Conv2D, then Flatten → Dense 128 → Dense 10. */
export function cnnBreakdown({ blocks, firstFilters, kernel }: CnnSpec) {
  const filters = [firstFilters, firstFilters * 2, firstFilters * 4].slice(0, blocks);
  let cin = 1;
  let size = SIZE;
  let total = 0;
  const conv = filters.map((f) => {
    const p = (kernel * kernel * cin + 1) * f;
    total += p;
    const row = { filters: f, cin, params: p, sizeBefore: size };
    cin = f;
    size = Math.floor(size / 2);
    return row;
  });
  const flat = size * size * cin;
  const dense1 = flat * 128 + 128;
  const dense2 = 128 * 10 + 10;
  total += dense1 + dense2;
  return { conv, size, channels: cin, flat, dense1, dense2, total };
}

/** Parameters of a fully connected net with the given layer sizes (weights + biases). */
export const denseParams = (sizes: number[]) => {
  let p = 0;
  for (let i = 0; i < sizes.length - 1; i++) p += sizes[i] * sizes[i + 1] + sizes[i + 1];
  return p;
};
export const LAB1_SIZES = [784, 512, 256, 128, 64, 10];

// ---------------------------------------------------------------- learning rate

/** Gradient descent on f(w) = w², starting at w0: each epoch is one update w ← w − lr·2w. */
export function gradientPath(lr: number, epochs: number, w0 = 4): { w: number; loss: number }[] {
  let w = w0;
  const pts = [{ w, loss: w * w }];
  for (let i = 0; i < epochs; i++) {
    w = w - lr * 2 * w;
    pts.push({ w, loss: w * w });
  }
  return pts;
}

/** Which of the four explanations applies to a learning rate (the same thresholds as the lab page). */
export type LrBand = "diverges" | "closeToLimit" | "small" | "reasonable";
export function lrBand(lr: number): LrBand {
  if (lr > 1) return "diverges";
  if (lr > 0.9) return "closeToLimit";
  if (lr < 0.06) return "small";
  return "reasonable";
}

// ---------------------------------------------------------------- text

/** A made-up but stable "word number" in 27 … 9999 (the lab uses IMDB's frequency ranks instead). */
export function hashId(word: string): number {
  let h = 7;
  for (const ch of word) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return h + 27;
}

export const wordsOf = (text: string): string[] => text.toLowerCase().match(/[a-z']+/g) ?? [];

/** Four placeholder embedding values for a word number (fixed pseudo-random, not learned). */
export function embedValues(id: number): number[] {
  let s = id;
  const v: number[] = [];
  for (let i = 0; i < 4; i++) {
    s = (s * 9301 + 49297) % 233280;
    v.push((s / 233280) * 2 - 1);
  }
  return v;
}

/** How many of the 10 000 one-hot slots are 1 for this text (distinct word numbers). */
export const oneHotOnes = (ids: number[]) => new Set(ids).size;

export const REVIEWS: string[][] = [
  ["the", "plot", "was", "not", "good", "at", "all"],
  ["a", "truly", "great", "film", "with", "great", "acting"],
  ["not", "bad", "but", "not", "great"],
];
export const SENTIMENT: Record<string, number> = { great: 1, good: 1, truly: 0.4, wonderful: 1, bad: -1, boring: -1, awful: -1 };

/**
 * A toy Conv1D filter of width k that fires on "not" followed by a positive word.
 * Each window: 0.6 × sentiment of every word, and "not" flips (×−1.2) the word after it.
 */
export function conv1dWindows(words: string[], k: number): number[] {
  const sc = words.map((w) => SENTIMENT[w] ?? 0);
  const out: number[] = [];
  for (let i = 0; i + k <= words.length; i++) {
    let v = 0;
    for (let j = 0; j < k; j++) {
      const w = words[i + j];
      v += sc[i + j] * 0.6;
      if (w === "not" && j < k - 1) v += -sc[i + j + 1] * 1.2;
    }
    out.push(Number(v.toFixed(2)));
  }
  return out;
}

/** Parameters Keras counts for one LSTM layer: 4 gates × (units·(units + input) + units). */
export const lstmParams = (units: number, inputDim: number) => 4 * (units * (units + inputDim) + units);
/** One GRU layer with Keras' default reset_after=True: 3·units·(units + input) + 6·units (two bias sets). */
export const gruParams = (units: number, inputDim: number) => 3 * units * (units + inputDim) + 6 * units;

// ---------------------------------------------------------------- LSTM / GRU toy cell

export const RNN_INPUTS = [0.2, -0.8, 0.9, -0.3, 1.0, 0.5];
export const RNN_WORDS = ["the", "not", "great", "plot", "film", "!"];
/** Fixed toy weights [w_x, w_h, bias] per gate, copied from the lab page. */
export const RNN_W = {
  f: [0.5, 0.8, 0.3], i: [1.2, 0.6, 0], o: [0.9, 0.5, -0.1], g: [1.4, 0.7, 0],
  z: [0.6, 0.4, 0], r: [0.5, 0.5, 0],
  n: [1.3, 0.9, 0],
};
export interface CellState { h: number; c: number }
const lin = (w: number[], x: number, h: number) => w[0] * x + w[1] * h + w[2];

export function lstmStep(s: CellState, x: number): { state: CellState; gates: Record<string, number> } {
  const f = sig(lin(RNN_W.f, x, s.h));
  const i = sig(lin(RNN_W.i, x, s.h));
  const o = sig(lin(RNN_W.o, x, s.h));
  const g = Math.tanh(lin(RNN_W.g, x, s.h));
  const c = f * s.c + i * g;
  const h = o * Math.tanh(c);
  return { state: { h, c }, gates: { f, i, o, g } };
}

export function gruStep(s: CellState, x: number): { state: CellState; gates: Record<string, number> } {
  const z = sig(lin(RNN_W.z, x, s.h));
  const r = sig(lin(RNN_W.r, x, s.h));
  const n = Math.tanh(RNN_W.n[0] * x + RNN_W.n[1] * (r * s.h) + RNN_W.n[2]);
  const h = (1 - z) * n + z * s.h;
  return { state: { h, c: 0 }, gates: { z, r, n } };
}

/** Run the toy cell over the sequence and keep every step (state after each word). */
export function runCell(kind: "LSTM" | "GRU", xs: number[] = RNN_INPUTS) {
  let s: CellState = { h: 0, c: 0 };
  return xs.map((x) => {
    const r = kind === "LSTM" ? lstmStep(s, x) : gruStep(s, x);
    s = r.state;
    return { x, ...r };
  });
}

// ---------------------------------------------------------------- handwritten digit preprocessing

/** Median of the sampled values (the lab takes np.median of the paper colour per channel). */
export function median(values: number[]): number {
  const a = [...values].sort((p, q) => p - q);
  return a[a.length >> 1];
}

/**
 * Step 1 of the preprocessing: the ink of a W×W RGBA picture = largest channel difference from the paper colour.
 * The paper colour is the median of every 7th pixel. Returns the ink scaled to 0..1 with values under 0.25 removed.
 */
export function inkFromRgba(rgba: ArrayLike<number>, W: number): { ink: Float32Array; max: number; paper: number[] } {
  const px = W * W;
  const paper = [0, 1, 2].map((ch) => {
    const vals: number[] = [];
    for (let i = 0; i < px; i += 7) vals.push(rgba[i * 4 + ch]);
    return median(vals);
  });
  const ink = new Float32Array(px);
  let max = 0;
  for (let i = 0; i < px; i++) {
    const v = Math.max(
      Math.abs(rgba[i * 4] - paper[0]),
      Math.abs(rgba[i * 4 + 1] - paper[1]),
      Math.abs(rgba[i * 4 + 2] - paper[2]),
    );
    ink[i] = v;
    if (v > max) max = v;
  }
  if (max > 0) {
    for (let i = 0; i < px; i++) {
      ink[i] /= max;
      if (ink[i] < 0.25) ink[i] = 0;
    }
  }
  return { ink, max, paper };
}

/** Bounding box of the non-zero pixels of a W×W image, or null when it is empty. */
export function bbox(img: ArrayLike<number>, W: number) {
  let x0 = W, x1 = -1, y0 = W, y1 = -1;
  for (let i = 0; i < W * W; i++) {
    if (img[i] > 0) {
      const x = i % W, y = Math.floor(i / W);
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return x1 < 0 ? null : { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

export interface Rect { x0: number; y0: number; w: number; h: number }

/** Area-average resampling of a rectangle of `src` (width sw) to tw×th. Each output pixel averages its source box. */
export function boxResample(src: ArrayLike<number>, sw: number, rect: Rect, tw: number, th: number): Float32Array {
  const out = new Float32Array(tw * th);
  for (let y = 0; y < th; y++) {
    const ya = Math.floor((y * rect.h) / th);
    const yb = Math.max(ya + 1, Math.floor(((y + 1) * rect.h) / th));
    for (let x = 0; x < tw; x++) {
      const xa = Math.floor((x * rect.w) / tw);
      const xb = Math.max(xa + 1, Math.floor(((x + 1) * rect.w) / tw));
      let s = 0;
      for (let yy = ya; yy < yb; yy++) for (let xx = xa; xx < xb; xx++) s += src[(rect.y0 + yy) * sw + rect.x0 + xx];
      out[y * tw + x] = s / ((yb - ya) * (xb - xa));
    }
  }
  return out;
}

/** The whole preprocessing chain of the digit step on a W×W ink image (already scaled, see inkFromRgba). */
export function preprocessInk(ink: ArrayLike<number>, W: number) {
  const full = boxResample(ink, W, { x0: 0, y0: 0, w: W, h: W }, SIZE, SIZE);
  const box = bbox(ink, W);
  if (!box) return null;
  // crop to the ink, longest side → 20 pixels
  const s = 20 / Math.max(box.w, box.h);
  const tw = Math.max(1, roundHalfUp(box.w * s));
  const th = Math.max(1, roundHalfUp(box.h * s));
  const small = boxResample(ink, W, box, tw, th);
  // place the patch in the middle of the 28×28 frame
  const stage2 = new Float32Array(SIZE * SIZE);
  const top = (SIZE - th) >> 1;
  const left = (SIZE - tw) >> 1;
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) stage2[(top + y) * SIZE + left + x] = small[y * tw + x];
  // thicker pen: each pixel takes the largest value of its 3×3 neighbourhood
  const stage3 = new Float32Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let m = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const yy = y + dy, xx = x + dx;
          if (yy >= 0 && yy < SIZE && xx >= 0 && xx < SIZE) m = Math.max(m, stage2[yy * SIZE + xx]);
        }
      }
      stage3[y * SIZE + x] = m;
    }
  }
  // centre of mass moved to (13.5, 13.5), wrapping around the frame
  let sum = 0, cy = 0, cx = 0;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const v = stage3[y * SIZE + x];
      sum += v;
      cy += v * y;
      cx += v * x;
    }
  }
  cy /= sum;
  cx /= sum;
  const dy = roundHalfUp(13.5 - cy);
  const dx = roundHalfUp(13.5 - cx);
  const stage4 = new Float32Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      stage4[((y + dy + SIZE) % SIZE) * SIZE + ((x + dx + SIZE) % SIZE)] = stage3[y * SIZE + x];
    }
  }
  return { full, stage2, stage3, stage4, box, tw, th, centre: { cy, cx }, shift: { dy, dx } };
}
