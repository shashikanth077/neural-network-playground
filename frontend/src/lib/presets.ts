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
  loss: "bce",
  l1: 0,
  l2: 0,
  dropout: 0,
  batch_norm: false,
  early_stopping: false,
  patience: 10,
  restore_best: true,
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
    summary: "All eight activations on the same circles problem and the same seed.",
    dataset: { name: "circles", n_samples: 240, noise: 0.12, seed: 6 },
    config: { hidden_layers: [8, 8], activation: "relu", init: "he", optimizer: "adam", learning_rate: 0.03, epochs: 200 },
    variants: [
      { label: "ReLU", config: { activation: "relu", init: "he" } },
      { label: "Leaky ReLU", config: { activation: "leaky_relu", init: "he" } },
      { label: "ELU", config: { activation: "elu", init: "he" } },
      { label: "SELU", config: { activation: "selu", init: "xavier" } },
      { label: "Sigmoid", config: { activation: "sigmoid", init: "xavier" } },
      { label: "Tanh", config: { activation: "tanh", init: "xavier" } },
      { label: "Softplus", config: { activation: "softplus", init: "xavier" } },
      { label: "SiLU", config: { activation: "silu", init: "xavier" } },
    ],
    observe: [
      "ReLU-family boundaries tend to look piecewise-linear; tanh, sigmoid, ELU and softplus look smoother.",
      "Sigmoid networks often learn more slowly because their gradients are small (max 0.25).",
      "Leaky ReLU and ELU keep a gradient for negative inputs, so fewer neurons “die”.",
      "Each run's outcome still depends on initialization. Pin a run to compare curves.",
    ],
  },
  {
    id: "optimizer",
    title: "Optimizer comparison",
    summary: "SGD, momentum, Nesterov, Adagrad, RMSprop, Adadelta, Adam and Nadam, each at a typical learning rate.",
    dataset: { name: "moons", n_samples: 240, noise: 0.15, seed: 7 },
    config: { hidden_layers: [8], activation: "tanh", optimizer: "sgd", learning_rate: 0.3, epochs: 200 },
    variants: [
      { label: "SGD", config: { optimizer: "sgd", learning_rate: 0.3 } },
      { label: "Momentum", config: { optimizer: "momentum", learning_rate: 0.05 } },
      { label: "Nesterov", config: { optimizer: "nesterov", learning_rate: 0.05 } },
      { label: "Adagrad", config: { optimizer: "adagrad", learning_rate: 0.1 } },
      { label: "RMSprop", config: { optimizer: "rmsprop", learning_rate: 0.01 } },
      { label: "Adadelta", config: { optimizer: "adadelta", learning_rate: 1 } },
      { label: "Adam", config: { optimizer: "adam", learning_rate: 0.03 } },
      { label: "Nadam", config: { optimizer: "nadam", learning_rate: 0.03 } },
    ],
    observe: [
      "Each optimizer needs a different learning-rate scale; the variants use typical values, not the best ones.",
      "Adaptive methods (Adagrad, RMSprop, Adam, Nadam) rescale every weight's step, which often helps at small rates.",
      "Try Adadelta at 0.03: it is designed for a rate near 1 and crawls otherwise.",
      "Pin the SGD run, then run another optimizer to overlay the curves. Outcomes depend on seed and data.",
    ],
  },
  {
    id: "regularisation",
    title: "Fighting overfitting",
    summary: "A big network on few noisy points, then try L2, L1, dropout, batch norm and early stopping.",
    dataset: { name: "moons", n_samples: 60, noise: 0.6, seed: 8 },
    config: { hidden_layers: [32, 32, 32], activation: "tanh", optimizer: "adam", learning_rate: 0.02, batch_size: 8, epochs: 400, val_split: 0.3, epoch_delay_ms: 3 },
    variants: [
      { label: "None", config: { l1: 0, l2: 0, dropout: 0, batch_norm: false, early_stopping: false } },
      { label: "L2 (0.01)", config: { l1: 0, l2: 0.01, dropout: 0, batch_norm: false, early_stopping: false } },
      { label: "L1 (0.003)", config: { l1: 0.003, l2: 0, dropout: 0, batch_norm: false, early_stopping: false } },
      { label: "Dropout 0.3", config: { l1: 0, l2: 0, dropout: 0.3, batch_norm: false, early_stopping: false } },
      { label: "Batch norm", config: { l1: 0, l2: 0, dropout: 0, batch_norm: true, early_stopping: false } },
      { label: "Early stopping", config: { l1: 0, l2: 0, dropout: 0, batch_norm: false, early_stopping: true, patience: 15 } },
    ],
    observe: [
      "Without regularisation the validation loss may rise while training loss keeps falling (check the learning-curve reading).",
      "L2 shrinks all weights; L1 pushes many to zero. Both smooth the decision boundary.",
      "Dropout switches hidden neurons off at random during training, so no neuron can rely on a single partner.",
      "Early stopping ends the run near the validation minimum. With 18 validation points the signal is noisy: results vary by seed.",
    ],
  },
  {
    id: "batching",
    title: "Batch, mini-batch and SGD",
    summary: "The same model with the whole training set, 32 samples, or one sample per weight update.",
    dataset: { name: "moons", n_samples: 300, noise: 0.15, seed: 9 },
    config: { hidden_layers: [8], activation: "tanh", optimizer: "sgd", learning_rate: 0.1, epochs: 60, batch_size: 32 },
    variants: [
      { label: "Batch GD", config: { batch_size: 240 } },
      { label: "Mini-batch (32)", config: { batch_size: 32 } },
      { label: "SGD (1)", config: { batch_size: 1 } },
    ],
    observe: [
      "Same epochs, very different numbers of updates: 1, 8 and 240 per epoch for 240 training points.",
      "Batch gradient descent is smooth but slow to improve per epoch; SGD moves fast but its loss curve is jagged.",
      "Mini-batches are the usual compromise. Results depend on seed and learning rate.",
    ],
  },
  {
    id: "losses",
    title: "Loss functions",
    summary: "Binary cross-entropy, squared error and hinge loss on the same problem.",
    dataset: { name: "moons", n_samples: 240, noise: 0.2, seed: 10 },
    config: { hidden_layers: [8], activation: "tanh", optimizer: "adam", learning_rate: 0.03, epochs: 150 },
    variants: [
      { label: "Cross-entropy", config: { loss: "bce" } },
      { label: "Squared error", config: { loss: "mse" } },
      { label: "Hinge", config: { loss: "hinge" } },
    ],
    observe: [
      "Loss values are on different scales, so compare accuracy and the boundary, not the raw numbers.",
      "Cross-entropy gives strong gradients when the model is confidently wrong; squared error on probabilities does not.",
      "Hinge loss only cares about the margin around the boundary, not about calibrated probabilities.",
    ],
  },
];
