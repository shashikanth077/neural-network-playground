import type { Activation } from "../types";

export const SELU_ALPHA = 1.6732632423543772;
export const SELU_SCALE = 1.0507009873554805;
const sig = (x: number) => (x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x)));

export interface ActivationDef {
  f: (x: number) => number;
  d: (x: number) => number;
  tex: string;
  dtex: string;
}

/** Same definitions as backend/app/nn.py (checked against it in the tests). */
export const ACT: Record<Activation, ActivationDef> = {
  relu: { f: (x) => Math.max(0, x), d: (x) => (x > 0 ? 1 : 0), tex: String.raw`f(x)=\max(0,x)`, dtex: String.raw`f'(x)=\begin{cases}1&x>0\\0&x\le0\end{cases}` },
  leaky_relu: { f: (x) => (x > 0 ? x : 0.01 * x), d: (x) => (x > 0 ? 1 : 0.01), tex: String.raw`f(x)=\begin{cases}x&x>0\\0.01x&x\le0\end{cases}`, dtex: String.raw`f'(x)=\begin{cases}1&x>0\\0.01&x\le0\end{cases}` },
  elu: { f: (x) => (x > 0 ? x : Math.exp(x) - 1), d: (x) => (x > 0 ? 1 : Math.exp(x)), tex: String.raw`f(x)=\begin{cases}x&x>0\\e^{x}-1&x\le0\end{cases}`, dtex: String.raw`f'(x)=\begin{cases}1&x>0\\e^{x}&x\le0\end{cases}` },
  selu: { f: (x) => SELU_SCALE * (x > 0 ? x : SELU_ALPHA * (Math.exp(x) - 1)), d: (x) => SELU_SCALE * (x > 0 ? 1 : SELU_ALPHA * Math.exp(x)), tex: String.raw`f(x)=\lambda\begin{cases}x&x>0\\\alpha(e^{x}-1)&x\le0\end{cases}`, dtex: String.raw`f'(x)=\lambda\begin{cases}1&x>0\\\alpha e^{x}&x\le0\end{cases}` },
  sigmoid: { f: sig, d: (x) => sig(x) * (1 - sig(x)), tex: String.raw`f(x)=\frac{1}{1+e^{-x}}`, dtex: String.raw`f'(x)=f(x)\,(1-f(x))` },
  tanh: { f: Math.tanh, d: (x) => 1 - Math.tanh(x) ** 2, tex: String.raw`f(x)=\tanh(x)`, dtex: String.raw`f'(x)=1-\tanh^2(x)` },
  softplus: { f: (x) => Math.log1p(Math.exp(-Math.abs(x))) + Math.max(x, 0), d: sig, tex: String.raw`f(x)=\ln(1+e^{x})`, dtex: String.raw`f'(x)=\sigma(x)` },
  silu: { f: (x) => x * sig(x), d: (x) => sig(x) * (1 + x * (1 - sig(x))), tex: String.raw`f(x)=x\,\sigma(x)`, dtex: String.raw`f'(x)=\sigma(x)\big(1+x(1-\sigma(x))\big)` },
};

export const ACTIVATION_NAMES = Object.keys(ACT) as Activation[];
