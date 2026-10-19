/** Real 2-D convolution (cross-correlation, no kernel flip, as in CNN libraries), padding and pooling. */
import { convOut, samePad } from "../cheatsheets/calc";

export type Matrix = number[][];

export const shape = (m: Matrix): [number, number] => [m.length, m[0]?.length ?? 0];

export function pad(m: Matrix, p: number): Matrix {
  const [h, w] = shape(m);
  return Array.from({ length: h + 2 * p }, (_, i) =>
    Array.from({ length: w + 2 * p }, (_, j) => (i >= p && i < h + p && j >= p && j < w + p ? m[i - p][j - p] : 0)),
  );
}

export type Padding = "valid" | "same";

export function conv2d(input: Matrix, kernel: Matrix, stride = 1, padding: Padding = "valid"): Matrix {
  const [kh, kw] = shape(kernel);
  const p = padding === "same" ? samePad(kh) : 0;
  const x = pad(input, p);
  const [h, w] = shape(x);
  const oh = convOut(h, kh, stride), ow = convOut(w, kw, stride);
  return Array.from({ length: oh }, (_, i) =>
    Array.from({ length: ow }, (_, j) => {
      let s = 0;
      for (let a = 0; a < kh; a++) for (let b = 0; b < kw; b++) s += x[i * stride + a][j * stride + b] * kernel[a][b];
      return s;
    }),
  );
}

export const relu = (m: Matrix): Matrix => m.map((r) => r.map((v) => Math.max(0, v)));

export function pool2d(input: Matrix, size = 2, stride = size, mode: "max" | "avg" = "max"): Matrix {
  const [h, w] = shape(input);
  const oh = convOut(h, size, stride), ow = convOut(w, size, stride);
  return Array.from({ length: oh }, (_, i) =>
    Array.from({ length: ow }, (_, j) => {
      const vals: number[] = [];
      for (let a = 0; a < size; a++) for (let b = 0; b < size; b++) vals.push(input[i * stride + a][j * stride + b]);
      return mode === "max" ? Math.max(...vals) : vals.reduce((s, v) => s + v, 0) / vals.length;
    }),
  );
}

/** Input cells (in the unpadded image) seen by output cell (i, j). Cells in the padding are omitted. */
export function receptiveField(i: number, j: number, kh: number, kw: number, stride: number, p: number, h: number, w: number) {
  const cells: [number, number][] = [];
  for (let a = 0; a < kh; a++) for (let b = 0; b < kw; b++) {
    const r = i * stride + a - p, c = j * stride + b - p;
    if (r >= 0 && r < h && c >= 0 && c < w) cells.push([r, c]);
  }
  return cells;
}

export const KERNELS: Record<string, { label: string; note: string; k: Matrix }> = {
  vertical: { label: "Vertical edges", note: "Responds where brightness changes from left to right.", k: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]] },
  horizontal: { label: "Horizontal edges", note: "The vertical-edge kernel turned on its side: responds to top-to-bottom changes.", k: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]] },
  blur: { label: "Blur (1/9)", note: "Averages the 3×3 neighbourhood.", k: Array.from({ length: 3 }, () => Array(3).fill(1 / 9)) },
  separation: { label: "Edge separation", note: "Centre minus its four neighbours: flat areas go to 0.", k: [[0, -1, 0], [-1, 4, -1], [0, -1, 0]] },
  lecture: { label: "Lecture exercise kernel", note: "The kernel used in the lecture's exercises A and B.", k: [[0, 1, 0], [1, 0, 1], [1, 0, 1]] },
};

/** Exercise image from the lecture (6×6). */
export const EXERCISE_IMAGE: Matrix = [
  [1, 2, 3, 1, 2, 3],
  [-1, 0, 3, 0, 1, 2],
  [1, 2, -3, 1, -1, 0],
  [-1, 2, 3, 0, -1, 3],
  [1, 0, -3, 1, 3, -2],
  [-2, 1, 0, 1, 2, 1],
];

/** A small 8×8 picture with a bright square, so edge kernels have something to find. */
export const SQUARE_IMAGE: Matrix = Array.from({ length: 8 }, (_, i) =>
  Array.from({ length: 8 }, (_, j) => (i >= 2 && i <= 5 && j >= 2 && j <= 5 ? 9 : 0)),
);

export interface LayerRow { name: string; out: string; params: number }

/** Shapes and parameters of the lecture's MNIST CNN, with editable filter counts. */
export function mnistCnn(f1: number, f2: number, dense: number): { rows: LayerRow[]; total: number } {
  const rows: LayerRow[] = [];
  const conv = (name: string, cin: number, f: number, h: number) => ({ name, out: `${h}×${h}×${f}`, params: f * (9 * cin + 1) });
  rows.push({ name: "Input", out: "28×28×1", params: 0 });
  rows.push(conv("Conv 3×3, same, ReLU", 1, f1, 28));
  rows.push({ name: "MaxPool 2×2", out: `14×14×${f1}`, params: 0 });
  rows.push(conv("Conv 3×3, same, ReLU", f1, f2, 14));
  rows.push({ name: "MaxPool 2×2", out: `7×7×${f2}`, params: 0 });
  const flat = 7 * 7 * f2;
  rows.push({ name: "Flatten", out: String(flat), params: 0 });
  rows.push({ name: "Dense, ReLU", out: String(dense), params: (flat + 1) * dense });
  rows.push({ name: "Dense 10, softmax", out: "10", params: (dense + 1) * 10 });
  return { rows, total: rows.reduce((s, r) => s + r.params, 0) };
}
