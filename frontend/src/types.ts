export type DatasetName = "xor" | "moons" | "circles" | "linear" | "custom";
export type Activation = "relu" | "sigmoid" | "tanh";
export type Initializer = "xavier" | "he" | "small_normal" | "zeros";
export type Optimizer = "sgd" | "adam";
export type TrainStatus = "ready" | "running" | "paused" | "completed" | "failed";

export interface DatasetSpec {
  name: DatasetName;
  n_samples: number;
  noise: number;
  seed: number;
}

export interface DataPayload {
  points: number[][];
  labels: number[];
}

export interface ModelConfig {
  hidden_layers: number[];
  activation: Activation;
  init: Initializer;
  optimizer: Optimizer;
  learning_rate: number;
  batch_size: number;
  epochs: number;
  val_split: number;
  seed: number;
  epoch_delay_ms: number;
}

export interface EpochMetrics {
  epoch: number;
  train_loss: number;
  train_acc: number;
  val_loss: number | null;
  val_acc: number | null;
  grad_norm: number;
  param_norm: number;
  elapsed: number;
}

export interface SessionStatus {
  session_id: string;
  status: TrainStatus;
  epoch: number;
  total_epochs: number;
  elapsed_seconds: number;
  error: string | null;
  n_parameters: number;
  n_train: number;
  n_val: number;
  layer_sizes: number[];
  config: ModelConfig;
  latest: EpochMetrics | null;
}

export interface LayerParameters {
  weights: number[][]; // [n_in][n_out]
  biases: number[];
}

export interface ModelParameters {
  session_id: string;
  epoch: number;
  layer_sizes: number[];
  activation: Activation;
  layers: LayerParameters[];
}

export interface PredictResponse {
  session_id: string;
  epoch: number;
  probabilities: number[];
  resolution: number | null;
  activations: number[][] | null;
}

export interface GridBounds {
  x_min: number;
  x_max: number;
  y_min: number;
  y_max: number;
}

export interface GridPrediction extends GridBounds {
  resolution: number;
  probabilities: number[];
  epoch: number;
}

export interface TraceLayer {
  layer: number;
  pre_activation: number[];
  activation: number[];
  weight_grad_norm: number;
  bias_grad_norm: number;
}

export interface IterationTrace {
  session_id: string;
  epoch: number;
  sample_index: number;
  input: number[];
  target: number;
  probability: number;
  loss: number;
  layers: TraceLayer[];
  example_weight: { name: string; value: number; gradient: number; sgd_update: number };
  optimizer: Optimizer;
  learning_rate: number;
  note: string;
}

export interface PinnedRun {
  label: string;
  history: EpochMetrics[];
}
