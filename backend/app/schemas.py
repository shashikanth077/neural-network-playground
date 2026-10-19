"""Pydantic request / response models."""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from .config import MAX_SAMPLES

DatasetName = Literal["xor", "moons", "circles", "linear"]
Activation = Literal["relu", "leaky_relu", "elu", "selu", "sigmoid", "tanh", "softplus", "silu"]
Initializer = Literal["xavier", "he", "small_normal", "zeros"]
Optimizer = Literal["sgd", "momentum", "nesterov", "adagrad", "rmsprop", "adadelta", "adam", "nadam"]
Loss = Literal["bce", "mse", "hinge"]
ValidationMethod = Literal["holdout", "kfold", "stratified_kfold", "shuffle_split", "time_series", "leave_one_out"]
Status = Literal["ready", "running", "paused", "completed", "failed"]


class DatasetRequest(BaseModel):
    name: DatasetName
    n_samples: int = Field(200, ge=10, le=MAX_SAMPLES)
    noise: float = Field(0.15, ge=0.0, le=1.0)
    seed: int = Field(0, ge=0, le=2**31 - 1)


class DatasetResponse(BaseModel):
    name: str
    points: list[list[float]]
    labels: list[int]


class DatasetInfo(BaseModel):
    name: str
    label: str
    description: str
    generated: bool


class DatasetSource(BaseModel):
    """Optional description of where a dataset came from; stored with saved runs."""

    name: str = Field("custom", max_length=40)
    n_samples: Optional[int] = Field(None, ge=0, le=100000)
    noise: Optional[float] = Field(None, ge=0.0, le=10.0)
    seed: Optional[int] = Field(None, ge=0, le=2**31 - 1)


class DataPayload(BaseModel):
    points: list[list[float]]
    labels: list[int]
    source: Optional[DatasetSource] = None

    @model_validator(mode="after")
    def _check(self):
        if len(self.points) != len(self.labels):
            raise ValueError("points and labels must have the same length")
        if len(self.points) < 6:
            raise ValueError("At least 6 points are needed to train (place a few of each class).")
        if len(self.points) > MAX_SAMPLES:
            raise ValueError(f"At most {MAX_SAMPLES} points are supported.")
        if any(len(p) != 2 for p in self.points):
            raise ValueError("Every point must have exactly two coordinates [x, y].")
        if any(l not in (0, 1) for l in self.labels):
            raise ValueError("Labels must be 0 or 1.")
        if len(set(self.labels)) < 2:
            raise ValueError("Both classes need at least one point.")
        import math

        if any(not math.isfinite(c) for p in self.points for c in p):
            raise ValueError("Coordinates must be finite numbers.")
        return self


class ModelConfig(BaseModel):
    hidden_layers: list[int] = Field(default_factory=lambda: [4])
    activation: Activation = "tanh"
    init: Initializer = "xavier"
    optimizer: Optimizer = "adam"
    learning_rate: float = Field(0.03, gt=0.0, le=10.0)
    batch_size: int = Field(32, ge=1, le=MAX_SAMPLES, description="1 = SGD, n_train = batch gradient descent, in between = mini-batch.")
    loss: Loss = "bce"
    l1: float = Field(0.0, ge=0.0, le=1.0, description="L1 (lasso) strength on the weights.")
    l2: float = Field(0.0, ge=0.0, le=1.0, description="L2 (ridge / weight decay) strength on the weights.")
    dropout: float = Field(0.0, ge=0.0, le=0.9, description="Probability of dropping a hidden neuron during training.")
    batch_norm: bool = False
    early_stopping: bool = False
    patience: int = Field(10, ge=1, le=500, description="Epochs without validation-loss improvement before stopping.")
    restore_best: bool = True
    epochs: int = Field(200, ge=1, le=2000)
    val_split: float = Field(0.2, ge=0.0, le=0.5)
    seed: int = Field(0, ge=0, le=2**31 - 1)
    epoch_delay_ms: int = Field(15, ge=0, le=1000, description="Pause after each epoch so progress is watchable.")

    @model_validator(mode="after")
    def _combos(self):
        if self.early_stopping and self.val_split <= 0:
            raise ValueError("Early stopping watches the validation loss, so set a validation split above 0.")
        if self.batch_norm and self.batch_size < 2:
            raise ValueError("Batch normalisation needs a batch size of at least 2.")
        return self

    @field_validator("hidden_layers")
    @classmethod
    def _layers(cls, v: list[int]):
        if len(v) > 5:
            raise ValueError("At most 5 hidden layers are supported.")
        if any(n < 1 or n > 32 for n in v):
            raise ValueError("Each hidden layer needs between 1 and 32 neurons.")
        return v


class CreateModelRequest(BaseModel):
    dataset: DataPayload
    config: ModelConfig = Field(default_factory=ModelConfig)


class StartRequest(BaseModel):
    session_id: Optional[str] = None
    dataset: Optional[DataPayload] = None
    config: Optional[ModelConfig] = None

    @model_validator(mode="after")
    def _check(self):
        if self.session_id is None and self.dataset is None:
            raise ValueError("Provide either session_id or dataset (+ config).")
        return self


class EpochMetrics(BaseModel):
    epoch: int
    train_loss: float
    train_acc: float
    val_loss: Optional[float] = None
    val_acc: Optional[float] = None
    penalty: float = 0.0
    grad_norm: float
    param_norm: float
    elapsed: float


class SessionStatus(BaseModel):
    session_id: str
    status: Status
    epoch: int
    total_epochs: int
    elapsed_seconds: float
    error: Optional[str]
    n_parameters: int
    n_non_trainable: int = 0
    best_epoch: Optional[int] = None
    stopped_early: bool = False
    restored_best: bool = False
    n_train: int
    n_val: int
    layer_sizes: list[int]
    config: ModelConfig
    latest: Optional[EpochMetrics]
    run_id: Optional[str] = Field(None, description="Id of the saved run once training has finished and been stored.")


class HistoryResponse(BaseModel):
    session_id: str
    history: list[EpochMetrics]


class LayerParameters(BaseModel):
    weights: list[list[float]]  # (n_in, n_out)
    biases: list[float]
    gamma: Optional[list[float]] = None  # batch-norm scale (hidden layers, when enabled)
    beta: Optional[list[float]] = None


class ParametersResponse(BaseModel):
    session_id: str
    epoch: int
    layer_sizes: list[int]
    activation: str
    layers: list[LayerParameters]


class GridSpec(BaseModel):
    x_min: float
    x_max: float
    y_min: float
    y_max: float
    resolution: int = Field(48, ge=2, le=200)


class PredictRequest(BaseModel):
    points: Optional[list[list[float]]] = None
    grid: Optional[GridSpec] = None
    include_activations: bool = False

    @model_validator(mode="after")
    def _check(self):
        if (self.points is None) == (self.grid is None):
            raise ValueError("Provide exactly one of 'points' or 'grid'.")
        if self.points is not None:
            if len(self.points) > 10000:
                raise ValueError("At most 10000 points per request.")
            if any(len(p) != 2 for p in self.points):
                raise ValueError("Every point must be [x, y].")
        if self.include_activations and self.points is not None and len(self.points) != 1:
            raise ValueError("include_activations needs exactly one point.")
        return self


class PredictResponse(BaseModel):
    session_id: str
    epoch: int
    probabilities: list[float]
    resolution: Optional[int] = None  # row-major (y rows, x columns) when a grid was requested
    activations: Optional[list[list[float]]] = None  # per layer incl. input and output


class TraceLayer(BaseModel):
    layer: int
    pre_activation: list[float]
    activation: list[float]
    weight_grad_norm: float
    bias_grad_norm: float


class IterationTrace(BaseModel):
    session_id: str
    epoch: int
    sample_index: int
    input: list[float]
    target: int
    probability: float
    loss: float
    layers: list[TraceLayer]
    example_weight: dict
    optimizer: str
    learning_rate: float
    note: str


class Confusion(BaseModel):
    tp: int
    fp: int
    tn: int
    fn: int


class RocCurve(BaseModel):
    fpr: list[float]
    tpr: list[float]
    thresholds: list[Optional[float]]


class EvaluationResponse(BaseModel):
    session_id: str
    split: Literal["train", "val"]
    epoch: int
    n: int
    threshold: float
    confusion: Confusion
    accuracy: float
    precision: float
    recall: float
    specificity: float
    fpr: float
    f1: float
    auc: Optional[float]
    roc: Optional[RocCurve]


class CrossValidationRequest(BaseModel):
    dataset: DataPayload
    config: ModelConfig = Field(default_factory=ModelConfig)
    method: ValidationMethod = "kfold"
    k: int = Field(5, ge=2, le=10, description="Folds (or number of splits).")
    val_fraction: float = Field(0.2, gt=0.0, lt=0.9, description="Used by hold-out and shuffle split.")


class FoldResult(BaseModel):
    fold: int
    n_train: int
    n_val: int
    val_indices: list[int]
    val_loss: float
    val_accuracy: float
    val_f1: float
    train_loss: float
    train_accuracy: float


class CrossValidationResponse(BaseModel):
    method: str
    folds: list[FoldResult]
    mean_val_loss: float
    std_val_loss: float
    mean_val_accuracy: float
    std_val_accuracy: float
    mean_val_f1: float
    n_samples: int
    note: str
    run_id: Optional[str] = Field(None, description="Id of the saved run (null when the database is off).")


class RunUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = Field(None, max_length=5000)

    @model_validator(mode="after")
    def _any(self):
        if self.title is None and self.notes is None:
            raise ValueError("Provide a title and/or notes to change.")
        if self.title is not None and not self.title.strip():
            raise ValueError("The title cannot be empty.")
        return self


class RunSummary(BaseModel):
    id: str
    created_at: float
    finished_at: Optional[float] = None
    kind: Literal["playground", "cross-validation"]
    status: str
    title: str
    notes: str
    config: dict
    dataset: dict
    metrics: dict
    spark: list[float] = Field(default_factory=list, description="Up to 40 thinned training-loss values.")


class RunDetail(RunSummary):
    history: list[dict] = Field(default_factory=list)


class RunList(BaseModel):
    total: int
    items: list[RunSummary]


class DbStatus(BaseModel):
    enabled: bool
    available: bool
    count: int
    schema_version: Optional[int] = None
    error: Optional[str] = None


class RunComparison(BaseModel):
    runs: list[RunDetail]
    epochs: int
    rows: list[dict] = Field(description="One row per epoch: '<run id>.<metric>' keys, null where a run is shorter.")
    differing: list[str] = Field(description="Config keys whose values differ between the runs.")
