import type { Activation, Loss, Optimizer, ValidationMethod } from "../types";

/** Single source of truth for the choices shown in the editor, Learning Center and cheatsheet. */
export const ACTIVATION_OPTIONS: { value: Activation; label: string; note: string }[] = [
  { value: "relu", label: "ReLU", note: "max(0, x). Fast, no saturation for x > 0; neurons can “die” at x < 0." },
  { value: "leaky_relu", label: "Leaky ReLU", note: "Like ReLU but keeps a small slope (0.01) for x < 0, so neurons do not die." },
  { value: "elu", label: "ELU", note: "Smooth negative side (e^x − 1); outputs centred nearer zero than ReLU." },
  { value: "selu", label: "SELU", note: "Scaled ELU (λ ≈ 1.0507, α ≈ 1.6733) that tends to keep activations normalised." },
  { value: "sigmoid", label: "Sigmoid", note: "Squashes to 0…1; gradient ≤ 0.25 so deep stacks suffer vanishing gradients." },
  { value: "tanh", label: "tanh", note: "Squashes to −1…1, zero-centred, gradient up to 1; still saturates." },
  { value: "softplus", label: "Softplus", note: "ln(1 + eˣ): a smooth version of ReLU." },
  { value: "silu", label: "SiLU / Swish", note: "x · sigmoid(x): smooth, slightly non-monotonic, popular in modern nets." },
];

export const OPTIMIZER_OPTIONS: { value: Optimizer; label: string; lr: number; note: string }[] = [
  { value: "sgd", label: "SGD", lr: 0.3, note: "θ ← θ − η·g. Simple; needs a well-tuned learning rate." },
  { value: "momentum", label: "SGD + momentum (γ = 0.9)", lr: 0.05, note: "Keeps a velocity of past gradients to smooth the path and speed up along flat directions." },
  { value: "nesterov", label: "Nesterov momentum (γ = 0.9)", lr: 0.05, note: "Momentum with a look-ahead gradient; often a little more stable." },
  { value: "adagrad", label: "Adagrad", lr: 0.1, note: "Per-parameter rate that shrinks as squared gradients accumulate; good for sparse features, can stall later." },
  { value: "rmsprop", label: "RMSprop (ρ = 0.9)", lr: 0.01, note: "Divides by a decaying average of squared gradients, fixing Adagrad's ever-shrinking step." },
  { value: "adadelta", label: "Adadelta (ρ = 0.95)", lr: 1.0, note: "Uses the ratio of past update size to gradient size; designed for a learning rate of about 1." },
  { value: "adam", label: "Adam (β = 0.9, 0.999)", lr: 0.03, note: "Momentum + RMSprop scaling with bias correction. A strong default." },
  { value: "nadam", label: "Nadam", lr: 0.03, note: "Adam with Nesterov's look-ahead." },
];

export const LOSS_OPTIONS: { value: Loss; label: string; note: string }[] = [
  { value: "bce", label: "Binary cross-entropy", note: "−[y ln p + (1−y) ln(1−p)]. The standard loss for a sigmoid output; punishes confident mistakes hard." },
  { value: "mse", label: "Mean squared error (on p)", note: "(p − y)². Works, but gradients vanish when a confident prediction is wrong." },
  { value: "hinge", label: "Hinge (margin on the logit)", note: "max(0, 1 − s·z) with s = ±1. Cares about the margin, not about probabilities." },
];

export const VALIDATION_OPTIONS: { value: ValidationMethod; label: string; note: string; usesK: boolean; usesFraction: boolean }[] = [
  { value: "holdout", label: "Hold-out", note: "One split into training and validation. Cheap; the estimate depends on that single split.", usesK: false, usesFraction: true },
  { value: "kfold", label: "K-fold", note: "K parts; each is the validation set once. Fair estimate on small data, but trains K models.", usesK: true, usesFraction: false },
  { value: "stratified_kfold", label: "Stratified K-fold", note: "K-fold that keeps the class ratio in every fold. Use it for imbalanced classes.", usesK: true, usesFraction: false },
  { value: "shuffle_split", label: "Shuffle split", note: "Several independent random splits; some samples may repeat or be missed.", usesK: true, usesFraction: true },
  { value: "time_series", label: "Time-series split", note: "Growing training window, validation always in the future. Points are not shuffled.", usesK: true, usesFraction: false },
  { value: "leave_one_out", label: "Leave-one-out", note: "One model per sample. Very slow; only for tiny datasets (≤ 60 here).", usesK: false, usesFraction: false },
];

export const labelOf = <T extends { value: string; label: string }>(list: T[], v: string) => list.find((o) => o.value === v)?.label ?? v;
