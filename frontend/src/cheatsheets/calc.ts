/** Shape and parameter-count formulas used by the cheatsheet calculators (checked against the lecture numbers). */

export const denseParams = (nIn: number, units: number) => (nIn + 1) * units;
export const embeddingParams = (vocab: number, dim: number) => vocab * dim;
export const convParams = (kernel: number, inChannels: number, filters: number, dims: 1 | 2 = 2) =>
  filters * (kernel ** dims * inChannels + 1);

/** Output size of a convolution / pooling along one axis: floor((W − F + 2P) / S) + 1. */
export const convOut = (w: number, f: number, s = 1, p = 0) => {
  if (s < 1 || f < 1 || w + 2 * p < f) return 0;
  return Math.floor((w - f + 2 * p) / s) + 1;
};
/** Padding that keeps the size for stride 1 ("same"): (F − 1) / 2 for odd F (rounded up for even F). */
export const samePad = (f: number) => Math.ceil((f - 1) / 2);

export const rnnParams = (inputs: number, units: number) => units * (inputs + units) + units;
export const lstmParams = (inputs: number, units: number) => 4 * (units * (inputs + units) + units);
/** Keras GRU default (reset_after = True) keeps two bias vectors. */
export const gruParams = (inputs: number, units: number, resetAfter = true) => 3 * (units * (inputs + units) + (resetAfter ? 2 : 1) * units);

export const stepsPerEpoch = (nTrain: number, batch: number) => Math.ceil(nTrain / Math.max(1, Math.min(batch, nTrain)));
