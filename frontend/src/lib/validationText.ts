import type { TFn } from "../i18n";

/**
 * `validateConfig` returns English sentences (the tests and the backend mirror them). To show them in the
 * chosen language we look the sentence up here and translate by key; unknown sentences are shown as they are.
 */
const KEYS: Record<string, string> = {
  "At most 5 hidden layers.": "pg.verr.layersMax",
  "Each layer needs 1–32 neurons.": "pg.verr.layerSize",
  "Use a value above 0 and up to 10.": "pg.verr.lr",
  "Whole number 1–2000 (1 = SGD, large = batch GD).": "pg.verr.batch",
  "Batch normalisation needs a batch size of at least 2.": "pg.verr.batchNorm",
  "Between 0 and 1.": "pg.verr.zeroOne",
  "Between 0 and 0.9.": "pg.verr.dropout",
  "Whole number 1–500.": "pg.verr.patience",
  "Early stopping watches the validation loss: set a validation split above 0.": "pg.verr.early",
  "Whole number 1–2000.": "pg.verr.epochs",
  "Between 0 and 0.5.": "pg.verr.valSplit",
  "Too few points for this validation split.": "pg.verr.fewPoints",
  "Non-negative whole number.": "pg.verr.seed",
};

export const VALIDATION_MESSAGES = Object.keys(KEYS);
export const validationKey = (message: string) => KEYS[message];

export function translateValidation(t: TFn, message: string | undefined): string | undefined {
  if (!message) return message;
  const key = KEYS[message];
  return key ? t(key, message) : message;
}
