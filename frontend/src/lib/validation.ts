import type { ModelConfig } from "../types";

export type ConfigErrors = Partial<Record<keyof ModelConfig | "hidden_layers", string>>;

/** Client-side mirror of the backend limits so users get feedback before a request is sent. */
export function validateConfig(c: ModelConfig, nSamples: number): ConfigErrors {
  const e: ConfigErrors = {};
  if (c.hidden_layers.length > 5) e.hidden_layers = "At most 5 hidden layers.";
  else if (c.hidden_layers.some((n) => !Number.isInteger(n) || n < 1 || n > 32))
    e.hidden_layers = "Each layer needs 1–32 neurons.";
  if (!(c.learning_rate > 0 && c.learning_rate <= 10)) e.learning_rate = "Use a value above 0 and up to 10.";
  if (!Number.isInteger(c.batch_size) || c.batch_size < 1 || c.batch_size > 512) e.batch_size = "Whole number 1–512.";
  if (!Number.isInteger(c.epochs) || c.epochs < 1 || c.epochs > 2000) e.epochs = "Whole number 1–2000.";
  if (c.val_split < 0 || c.val_split > 0.5) e.val_split = "Between 0 and 0.5.";
  else if (c.val_split > 0 && Math.round(nSamples * c.val_split) < 2)
    e.val_split = "Too few points for this validation split.";
  if (!Number.isInteger(c.seed) || c.seed < 0) e.seed = "Non-negative whole number.";
  return e;
}

export const hasErrors = (e: ConfigErrors) => Object.keys(e).length > 0;

/** Trainable parameter count for a 2-input, 1-output network. */
export function countParameters(hidden: number[]): number {
  const sizes = [2, ...hidden, 1];
  let total = 0;
  for (let i = 0; i < sizes.length - 1; i++) total += sizes[i] * sizes[i + 1] + sizes[i + 1];
  return total;
}
