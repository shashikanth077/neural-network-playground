/** Per-sample losses and their gradient wrt the logit z (same definitions as backend/app/nn.py, y in {0, 1}). */
export const sigmoid = (z: number) => (z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z)));

export const bce = (z: number, y: number) => Math.max(z, 0) - z * y + Math.log1p(Math.exp(-Math.abs(z)));
export const bceGrad = (z: number, y: number) => sigmoid(z) - y;

export const mse = (z: number, y: number) => (sigmoid(z) - y) ** 2;
export const mseGrad = (z: number, y: number) => 2 * (sigmoid(z) - y) * sigmoid(z) * (1 - sigmoid(z));

export const hinge = (z: number, y: number) => Math.max(0, 1 - (2 * y - 1) * z);
export const hingeGrad = (z: number, y: number) => ((2 * y - 1) * z < 1 ? -(2 * y - 1) : 0);

export const LOSS_FNS = {
  bce: { f: bce, g: bceGrad },
  mse: { f: mse, g: mseGrad },
  hinge: { f: hinge, g: hingeGrad },
} as const;
