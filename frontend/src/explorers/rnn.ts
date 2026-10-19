/** Single-step RNN, LSTM and GRU cells with every intermediate value exposed (lecture 8 formulas). */

export type Vec = number[];
export type Mat = number[][];
export interface Gate { W: Mat; U: Mat; b: Vec }

const sigmoid = (v: number) => 1 / (1 + Math.exp(-v));
const dot = (m: Mat, v: Vec) => m.map((row) => row.reduce((s, w, i) => s + w * v[i], 0));
const add = (...vs: Vec[]) => vs[0].map((_, i) => vs.reduce((s, v) => s + v[i], 0));
const mul = (a: Vec, b: Vec) => a.map((v, i) => v * b[i]);
const lin = (g: Gate, x: Vec, h: Vec) => add(dot(g.W, x), dot(g.U, h), g.b);

export interface RnnStep { h: Vec }
export function rnnStep(g: Gate, x: Vec, h: Vec): RnnStep {
  return { h: lin(g, x, h).map(Math.tanh) };
}

export interface LstmWeights { i: Gate; f: Gate; g: Gate; o: Gate }
export interface LstmStep { h: Vec; c: Vec; i: Vec; f: Vec; g: Vec; o: Vec }
export function lstmStep(w: LstmWeights, x: Vec, h: Vec, c: Vec): LstmStep {
  const i = lin(w.i, x, h).map(sigmoid);
  const f = lin(w.f, x, h).map(sigmoid);
  const g = lin(w.g, x, h).map(Math.tanh);
  const o = lin(w.o, x, h).map(sigmoid);
  const cn = add(mul(f, c), mul(i, g));
  return { h: mul(o, cn.map(Math.tanh)), c: cn, i, f, g, o };
}

export interface GruWeights { r: Gate; z: Gate; n: Gate }
export interface GruStep { h: Vec; r: Vec; z: Vec; cand: Vec }
/** Lecture form: h̃ = tanh(W x + U (r ⊙ h)); h = (1 − z) ⊙ h_prev + z ⊙ h̃. */
export function gruStep(w: GruWeights, x: Vec, h: Vec): GruStep {
  const r = lin(w.r, x, h).map(sigmoid);
  const z = lin(w.z, x, h).map(sigmoid);
  const cand = add(dot(w.n.W, x), dot(w.n.U, mul(r, h)), w.n.b).map(Math.tanh);
  return { h: add(mul(z.map((v) => 1 - v), h), mul(z, cand)), r, z, cand };
}

export type CellKind = "rnn" | "lstm" | "gru";

export interface Trace { steps: { h: Vec; c?: Vec; gates: Record<string, Vec> }[] }

export function unroll(kind: CellKind, weights: Gate | LstmWeights | GruWeights, xs: Vec[], units: number): Trace {
  let h: Vec = Array(units).fill(0);
  let c: Vec = Array(units).fill(0);
  const steps: Trace["steps"] = [];
  for (const x of xs) {
    if (kind === "rnn") {
      h = rnnStep(weights as Gate, x, h).h;
      steps.push({ h, gates: {} });
    } else if (kind === "lstm") {
      const s = lstmStep(weights as LstmWeights, x, h, c);
      h = s.h; c = s.c;
      steps.push({ h, c, gates: { input: s.i, forget: s.f, candidate: s.g, output: s.o } });
    } else {
      const s = gruStep(weights as GruWeights, x, h);
      h = s.h;
      steps.push({ h, gates: { reset: s.r, update: s.z, candidate: s.cand } });
    }
  }
  return { steps };
}

/** Deterministic pseudo-random weights in [-s, s] so the demo is reproducible. */
export function makeWeights(kind: CellKind, inputs: number, units: number, seed = 7, scale = 0.8): Gate | LstmWeights | GruWeights {
  let s = seed >>> 0;
  const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return ((s / 2 ** 32) * 2 - 1) * scale; };
  const gate = (): Gate => ({
    W: Array.from({ length: units }, () => Array.from({ length: inputs }, rnd)),
    U: Array.from({ length: units }, () => Array.from({ length: units }, rnd)),
    b: Array.from({ length: units }, () => 0),
  });
  if (kind === "rnn") return gate();
  if (kind === "lstm") return { i: gate(), f: gate(), g: gate(), o: gate() };
  return { r: gate(), z: gate(), n: gate() };
}
