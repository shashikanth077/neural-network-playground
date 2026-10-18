import type { DatasetSpec, ModelConfig } from "../types";

export interface PresetVariant {
  label: string;
  config: Partial<ModelConfig>;
}

export interface Preset {
  id: string;
  title: string;
  summary: string;
  dataset: DatasetSpec;
  config: Partial<ModelConfig>;
  variants?: PresetVariant[];
  observe: string[];
}

export const DEFAULT_CONFIG: ModelConfig = {
  hidden_layers: [6],
  activation: "tanh",
  init: "xavier",
  optimizer: "adam",
  learning_rate: 0.03,
  batch_size: 32,
  epochs: 200,
  val_split: 0.2,
  seed: 0,
  epoch_delay_ms: 15,
};

export const DEFAULT_DATASET: DatasetSpec = { name: "xor", n_samples: 200, noise: 0.15, seed: 0 };

export const PRESETS: Preset[] = [
  {
    id: "xor",
    title: "XOR: a nonlinear relationship",
    summary: "Opposite quadrants share a class, so no single straight line can separate them.",
    dataset: { name: "xor", n_samples: 240, noise: 0.15, seed: 1 },
    config: { hidden_layers: [6], activation: "tanh", optimizer: "adam", learning_rate: 0.05, epochs: 200 },
    observe: [
      "The boundary should bend into a four-region (checkerboard-like) pattern.",
      "Hidden neurons are what make this possible; try setting hidden layers to 0 and compare.",
      "Some seeds converge faster than others. Initialization matters.",
    ],
  },
  {
    id: "linear",
    title: "Linear classification",
    summary: "A single neuron (no hidden layers) is logistic regression: one straight decision boundary.",
    dataset: { name: "linear", n_samples: 200, noise: 0.2, seed: 2 },
    config: { hidden_layers: [], activation: "tanh", optimizer: "sgd", learning_rate: 0.5, epochs: 150 },
    observe: [
      "The boundary is always a straight line, whatever the weights.",
      "The network graph has just two weights and one bias: 3 parameters.",
      "Accuracy is limited only by how much the two classes overlap.",
    ],
  },
  {
    id: "underfit",
    title: "Underfitting",
    summary: "A model that is too simple for the data: one hidden neuron on concentric circles.",
    dataset: { name: "circles", n_samples: 240, noise: 0.12, seed: 3 },
    config: { hidden_layers: [1], activation: "tanh", optimizer: "adam", learning_rate: 0.05, epochs: 250 },
    observe: [
      "Both training and validation loss stay high: the model lacks capacity, not data.",
      "A single hidden neuron can only produce a monotone 1-D function of a linear projection, so it cannot enclose a disc.",
      "Increase the hidden neurons to see the gap close.",
    ],
  },
  {
    id: "overfit",
    title: "Overfitting",
    summary: "A large network, few noisy points and a long run: it can memorize the training set.",
    dataset: { name: "moons", n_samples: 50, noise: 0.7, seed: 4 },
    config: {
      hidden_layers: [32, 32, 32],
      activation: "tanh",
      optimizer: "adam",
      learning_rate: 0.02,
      batch_size: 8,
      epochs: 500,
      val_split: 0.3,
      epoch_delay_ms: 5,
    },
    observe: [
      "Training loss keeps falling while validation loss may flatten or rise.",
      "The boundary can become wiggly and wrap around individual points.",
      "This is not guaranteed for every seed; the small validation set is noisy, which is part of the lesson.",
    ],
  },
  {
    id: "lr",
    title: "Learning-rate experiment",
    summary: "Run the same model with a tiny, moderate and huge learning rate. Pin a run to overlay it.",
    dataset: { name: "moons", n_samples: 240, noise: 0.15, seed: 5 },
    config: { hidden_layers: [8], activation: "tanh", optimizer: "sgd", learning_rate: 0.3, epochs: 200 },
    variants: [
      { label: "Small (0.005)", config: { learning_rate: 0.005 } },
      { label: "Moderate (0.3)", config: { learning_rate: 0.3 } },
      { label: "Large (8)", config: { learning_rate: 8 } },
    ],
    observe: [
      "Too small: loss decreases but very slowly.",
      "Too large: loss may oscillate, plateau, or the run may diverge.",
      "Use “Pin run” after each run to overlay it against the next one. Results depend on seed and data.",
    ],
  },
  {
    id: "activation",
    title: "Activation comparison",
    summary: "ReLU, sigmoid and tanh on the same circles problem and the same seed.",
    dataset: { name: "circles", n_samples: 240, noise: 0.12, seed: 6 },
    config: { hidden_layers: [8, 8], activation: "relu", init: "he", optimizer: "adam", learning_rate: 0.03, epochs: 200 },
    variants: [
      { label: "ReLU", config: { activation: "relu", init: "he" } },
      { label: "Sigmoid", config: { activation: "sigmoid", init: "xavier" } },
      { label: "Tanh", config: { activation: "tanh", init: "xavier" } },
    ],
    observe: [
      "ReLU boundaries tend to look piecewise-linear; tanh and sigmoid look smoother.",
      "Sigmoid networks often learn more slowly because their gradients are small (max 0.25).",
      "Each run's outcome still depends on initialization.",
    ],
  },
  {
    id: "optimizer",
    title: "Optimizer comparison",
    summary: "Plain SGD versus Adam with the same learning rate, data and initial weights.",
    dataset: { name: "moons", n_samples: 240, noise: 0.15, seed: 7 },
    config: { hidden_layers: [8], activation: "tanh", optimizer: "sgd", learning_rate: 0.05, epochs: 200 },
    variants: [
      { label: "SGD", config: { optimizer: "sgd" } },
      { label: "Adam", config: { optimizer: "adam" } },
    ],
    observe: [
      "Adam adapts a step size per parameter, so it often reaches low loss in fewer epochs at this learning rate.",
      "SGD with a well-tuned (usually larger) learning rate can catch up.",
      "Pin the SGD run, then run Adam to overlay the curves.",
    ],
  },
];
