"""Pydantic request / response models."""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from .config import MAX_SAMPLES

DatasetName = Literal["xor", "moons", "circles", "linear"]
Activation = Literal["relu", "sigmoid", "tanh"]
Initializer = Literal["xavier", "he", "small_normal", "zeros"]
Optimizer = Literal["sgd", "adam"]
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


class DataPayload(BaseModel):
    points: list[list[float]]
    labels: list[int]

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
    batch_size: int = Field(32, ge=1, le=512)
    epochs: int = Field(200, ge=1, le=2000)
    val_split: float = Field(0.2, ge=0.0, le=0.5)
    seed: int = Field(0, ge=0, le=2**31 - 1)
    epoch_delay_ms: int = Field(15, ge=0, le=1000, description="Pause after each epoch so progress is watchable.")

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
    n_train: int
    n_val: int
    layer_sizes: list[int]
    config: ModelConfig
    latest: Optional[EpochMetrics]


class HistoryResponse(BaseModel):
    session_id: str
    history: list[EpochMetrics]


class LayerParameters(BaseModel):
    weights: list[list[float]]  # (n_in, n_out)
    biases: list[float]


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
