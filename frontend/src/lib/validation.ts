import type { ModelConfig } from "../types";

export type ConfigErrors = Partial<Record<keyof ModelConfig, string>>;

/** Client-side mirror of the backend limits so users get feedback before a request is sent. */
export function validateConfig(c: ModelConfig, nSamples: number): ConfigErrors {
  const e: ConfigErrors = {};
  if (c.hidden_layers.length > 5) e.hidden_layers = "At most 5 hidden layers.";
  else if (c.hidden_layers.some((n) => !Number.isInteger(n) || n < 1 || n > 32))
    e.hidden_layers = "Each layer needs 1–32 neurons.";
  if (!(c.learning_rate > 0 && c.learning_rate <= 10)) e.learning_rate = "Use a value above 0 and up to 10.";
  if (!Number.isInteger(c.batch_size) || c.batch_size < 1 || c.batch_size > 2000) e.batch_size = "Whole number 1–2000 (1 = SGD, large = batch GD).";
  else if (c.batch_norm && c.batch_size < 2) e.batch_size = "Batch normalisation needs a batch size of at least 2.";
  if (!(c.l1 >= 0 && c.l1 <= 1)) e.l1 = "Between 0 and 1.";
  if (!(c.l2 >= 0 && c.l2 <= 1)) e.l2 = "Between 0 and 1.";
  if (!(c.dropout >= 0 && c.dropout <= 0.9)) e.dropout = "Between 0 and 0.9.";
  if (!Number.isInteger(c.patience) || c.patience < 1 || c.patience > 500) e.patience = "Whole number 1–500.";
  if (c.early_stopping && c.val_split <= 0) e.early_stopping = "Early stopping watches the validation loss: set a validation split above 0.";
  if (!Number.isInteger(c.epochs) || c.epochs < 1 || c.epochs > 2000) e.epochs = "Whole number 1–2000.";
  if (c.val_split < 0 || c.val_split > 0.5) e.val_split = "Between 0 and 0.5.";
  else if (c.val_split > 0 && Math.round(nSamples * c.val_split) < 2)
    e.val_split = "Too few points for this validation split.";
  if (!Number.isInteger(c.seed) || c.seed < 0) e.seed = "Non-negative whole number.";
  return e;
}

export const hasErrors = (e: ConfigErrors) => Object.keys(e).length > 0;

/** Trainable parameter count for a 2-input, 1-output network (batch norm adds gamma and beta per hidden unit). */
export function countParameters(hidden: number[], batchNorm = false): number {
  const sizes = [2, ...hidden, 1];
  let total = 0;
  for (let i = 0; i < sizes.length - 1; i++) total += sizes[i] * sizes[i + 1] + sizes[i + 1];
  if (batchNorm) total += 2 * hidden.reduce((a, b) => a + b, 0);
  return total;
}
