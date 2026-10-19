export type DatasetName = "xor" | "moons" | "circles" | "linear" | "custom";
export type Activation = "relu" | "leaky_relu" | "elu" | "selu" | "sigmoid" | "tanh" | "softplus" | "silu";
export type Initializer = "xavier" | "he" | "small_normal" | "zeros";
export type Optimizer = "sgd" | "momentum" | "nesterov" | "adagrad" | "rmsprop" | "adadelta" | "adam" | "nadam";
export type Loss = "bce" | "mse" | "hinge";
export type ValidationMethod = "holdout" | "kfold" | "stratified_kfold" | "shuffle_split" | "time_series" | "leave_one_out";
export type TrainStatus = "ready" | "running" | "paused" | "completed" | "failed";

export interface DatasetSpec {
  name: DatasetName;
  n_samples: number;
  noise: number;
  seed: number;
}

/** Where a dataset came from; sent along so saved runs can say which data they used. */
export interface DatasetSource {
  name: string;
  n_samples?: number;
  noise?: number;
  seed?: number;
}

export interface DataPayload {
  points: number[][];
  labels: number[];
  source?: DatasetSource;
}

export interface ModelConfig {
  hidden_layers: number[];
  activation: Activation;
  init: Initializer;
  optimizer: Optimizer;
  learning_rate: number;
  batch_size: number;
  loss: Loss;
  l1: number;
  l2: number;
  dropout: number;
  batch_norm: boolean;
  early_stopping: boolean;
  patience: number;
  restore_best: boolean;
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
  penalty: number;
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
  n_non_trainable: number;
  best_epoch: number | null;
  stopped_early: boolean;
  restored_best: boolean;
  n_train: number;
  n_val: number;
  layer_sizes: number[];
  config: ModelConfig;
  latest: EpochMetrics | null;
  /** Id of the saved run once training has finished and been stored (null when not saved). */
  run_id?: string | null;
}

export interface LayerParameters {
  weights: number[][]; // [n_in][n_out]
  biases: number[];
  gamma?: number[] | null;
  beta?: number[] | null;
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

export interface Evaluation {
  session_id: string;
  split: "train" | "val";
  epoch: number;
  n: number;
  threshold: number;
  confusion: { tp: number; fp: number; tn: number; fn: number };
  accuracy: number;
  precision: number;
  recall: number;
  specificity: number;
  fpr: number;
  f1: number;
  auc: number | null;
  roc: { fpr: number[]; tpr: number[]; thresholds: (number | null)[] } | null;
}

export interface FoldResult {
  fold: number;
  n_train: number;
  n_val: number;
  val_indices: number[];
  val_loss: number;
  val_accuracy: number;
  val_f1: number;
  train_loss: number;
  train_accuracy: number;
}

export interface CrossValidation {
  method: ValidationMethod;
  folds: FoldResult[];
  mean_val_loss: number;
  std_val_loss: number;
  mean_val_accuracy: number;
  std_val_accuracy: number;
  mean_val_f1: number;
  n_samples: number;
  note: string;
}

// ---------------------------------------------------------------- saved runs
export type RunKind = "playground" | "cross-validation";

export interface RunDataset {
  name: string;
  n_samples?: number;
  noise?: number | null;
  seed?: number | null;
  class_counts?: [number, number];
  summary?: string;
  points?: number[][];
  labels?: number[];
}

export interface RunMetrics {
  final_train_loss?: number | null;
  final_train_acc?: number | null;
  final_val_loss?: number | null;
  final_val_acc?: number | null;
  best_epoch?: number | null;
  stopped_early?: boolean;
  n_parameters?: number;
  epochs_run?: number;
  elapsed?: number;
  error?: string | null;
  // cross-validation
  method?: string;
  mean_val_loss?: number | null;
  std_val_loss?: number | null;
  mean_val_accuracy?: number | null;
  std_val_accuracy?: number | null;
  mean_val_f1?: number | null;
  n_folds?: number;
}

export interface RunSummary {
  id: string;
  created_at: number;
  finished_at: number | null;
  kind: RunKind;
  status: string;
  title: string;
  notes: string;
  /** The model settings, plus `cv_method` / `cv_k` for cross-validation runs. */
  config: Partial<ModelConfig> & Record<string, unknown>;
  dataset: RunDataset;
  metrics: RunMetrics;
  spark: number[];
}

export interface RunDetail extends Omit<RunSummary, "spark"> {
  spark?: number[];
  history: EpochMetrics[];
}

export interface RunList {
  total: number;
  items: RunSummary[];
}

export interface RunComparison {
  runs: RunDetail[];
  epochs: number;
  rows: Record<string, number | null>[];
  differing: string[];
}

export interface DbStatus {
  enabled: boolean;
  available: boolean;
  count: number;
  schema_version: number | null;
  error: string | null;
}
