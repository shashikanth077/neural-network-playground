import type { DatasetSpec, ModelConfig } from "../types";

/**
 * Guided experiments. Only the set-up lives here; every user-visible sentence is an i18n key
 * (`pg.exp.<id>.title | goal | setup | watch | expect | lecture` and `pg.exp.<id>.v.<variantId>`).
 * "Apply" merges `config` (plus the variant's own `config`) over DEFAULT_CONFIG and loads the dataset,
 * exactly like a preset does, then resets training. The user presses Train.
 */
export interface ExperimentVariant {
  id: string;
  /** Replaces the experiment's dataset for this variant (e.g. a tiny noisy set for the overfit run). */
  dataset?: DatasetSpec;
  config: Partial<ModelConfig>;
}

export interface Experiment {
  id: string;
  dataset: DatasetSpec;
  config: Partial<ModelConfig>;
  variants: ExperimentVariant[];
  /** Page section id to jump to for reading the result. */
  readIn: "section-charts" | "section-eval" | "section-cv";
}

const MOONS_SMALL: DatasetSpec = { name: "moons", n_samples: 60, noise: 0.6, seed: 8 };
const BIG_NET: Partial<ModelConfig> = { hidden_layers: [32, 32, 32], activation: "tanh", optimizer: "adam", learning_rate: 0.02, batch_size: 8, epochs: 400, val_split: 0.3, epoch_delay_ms: 3 };

export const EXPERIMENTS: Experiment[] = [
  {
    id: "fit",
    readIn: "section-charts",
    dataset: { name: "moons", n_samples: 240, noise: 0.15, seed: 5 },
    config: { hidden_layers: [8], activation: "tanh", optimizer: "adam", learning_rate: 0.03, epochs: 200, epoch_delay_ms: 5 },
    variants: [
      { id: "under", dataset: { name: "circles", n_samples: 240, noise: 0.12, seed: 3 }, config: { hidden_layers: [1], learning_rate: 0.05, epochs: 250 } },
      { id: "good", config: {} },
      { id: "over", dataset: { name: "moons", n_samples: 50, noise: 0.7, seed: 4 }, config: { hidden_layers: [32, 32, 32], learning_rate: 0.02, batch_size: 8, epochs: 500, val_split: 0.3, epoch_delay_ms: 3 } },
    ],
  },
  {
    id: "lr",
    readIn: "section-charts",
    dataset: { name: "moons", n_samples: 240, noise: 0.15, seed: 5 },
    config: { hidden_layers: [8], activation: "tanh", optimizer: "adam", learning_rate: 0.03, epochs: 200, epoch_delay_ms: 5 },
    variants: [
      { id: "small", config: { learning_rate: 0.001 } },
      { id: "good", config: { learning_rate: 0.03 } },
      { id: "big", config: { learning_rate: 10 } },
    ],
  },
  {
    id: "dropout",
    readIn: "section-charts",
    dataset: MOONS_SMALL,
    config: { ...BIG_NET },
    variants: [
      { id: "none", config: { dropout: 0 } },
      { id: "d03", config: { dropout: 0.3 } },
      { id: "d05", config: { dropout: 0.5 } },
    ],
  },
  {
    id: "early",
    readIn: "section-charts",
    dataset: MOONS_SMALL,
    config: { ...BIG_NET },
    variants: [
      { id: "off", config: { early_stopping: false } },
      { id: "on", config: { early_stopping: true, patience: 15, restore_best: true } },
    ],
  },
  {
    id: "momentum",
    readIn: "section-charts",
    dataset: { name: "moons", n_samples: 240, noise: 0.15, seed: 7 },
    config: { hidden_layers: [8], activation: "tanh", learning_rate: 0.05, epochs: 120, epoch_delay_ms: 5 },
    variants: [
      { id: "sgd", config: { optimizer: "sgd" } },
      { id: "momentum", config: { optimizer: "momentum" } },
      { id: "adam", config: { optimizer: "adam" } },
    ],
  },
  {
    id: "depth",
    readIn: "section-charts",
    dataset: { name: "circles", n_samples: 240, noise: 0.12, seed: 6 },
    config: { hidden_layers: [8, 8, 8, 8, 8], optimizer: "sgd", learning_rate: 0.3, epochs: 200, epoch_delay_ms: 3 },
    variants: [
      { id: "relu", config: { activation: "relu", init: "he" } },
      { id: "sigmoid", config: { activation: "sigmoid", init: "xavier" } },
    ],
  },
  {
    id: "threshold",
    readIn: "section-eval",
    dataset: { name: "moons", n_samples: 300, noise: 0.7, seed: 11 },
    config: { hidden_layers: [8], activation: "tanh", optimizer: "adam", learning_rate: 0.03, epochs: 120, epoch_delay_ms: 3 },
    variants: [{ id: "run", config: {} }],
  },
  {
    id: "cv",
    readIn: "section-cv",
    dataset: { name: "moons", n_samples: 60, noise: 0.3, seed: 12 },
    config: { hidden_layers: [8], activation: "tanh", optimizer: "adam", learning_rate: 0.03, epochs: 80, epoch_delay_ms: 0 },
    variants: [{ id: "run", config: {} }],
  },
];
