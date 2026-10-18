"""A small feed-forward neural network for binary classification, in pure NumPy.

Conventions
-----------
* Samples are rows: ``X`` has shape ``(m, n_in)``.
* Layer ``l`` stores ``W[l]`` with shape ``(n_in_l, n_out_l)`` and ``b[l]`` with
  shape ``(1, n_out_l)``, so the forward pass is ``z = a_prev @ W + b``.
* Hidden layers use the chosen activation; the output layer is a single neuron
  whose logit is turned into a probability by the sigmoid.
* The loss is binary cross-entropy, computed from logits in a numerically
  stable form. With that pairing the output-layer error simplifies to
  ``dL/dz = (p - y) / m``.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence

import numpy as np

EPS = 1e-12


# ---------------------------------------------------------------- activations
def sigmoid(z: np.ndarray) -> np.ndarray:
    """Overflow-free logistic function."""
    e = np.exp(-np.abs(z))
    return np.where(z >= 0, 1.0 / (1.0 + e), e / (1.0 + e))


def tanh(z: np.ndarray) -> np.ndarray:
    return np.tanh(z)


def relu(z: np.ndarray) -> np.ndarray:
    return np.maximum(z, 0.0)


# derivative expressed with the pre-activation z and the activation a
def _d_sigmoid(z, a):
    return a * (1.0 - a)


def _d_tanh(z, a):
    return 1.0 - a * a


def _d_relu(z, a):
    return (z > 0.0).astype(z.dtype)


ACTIVATIONS = {
    "relu": (relu, _d_relu),
    "sigmoid": (sigmoid, _d_sigmoid),
    "tanh": (tanh, _d_tanh),
}
INITIALIZERS = ("xavier", "he", "small_normal", "zeros")


# ---------------------------------------------------------------------- loss
def bce_from_logits(logits: np.ndarray, y: np.ndarray) -> float:
    """Mean binary cross-entropy from logits z: max(z,0) - z*y + log(1+exp(-|z|))."""
    z = logits.reshape(-1)
    t = y.reshape(-1).astype(float)
    return float(np.mean(np.maximum(z, 0.0) - z * t + np.log1p(np.exp(-np.abs(z)))))


def binary_cross_entropy(probs: np.ndarray, y: np.ndarray, eps: float = 1e-7) -> float:
    """Mean BCE from probabilities, clipped away from 0 and 1."""
    p = np.clip(probs.reshape(-1), eps, 1.0 - eps)
    t = y.reshape(-1).astype(float)
    return float(-np.mean(t * np.log(p) + (1.0 - t) * np.log(1.0 - p)))


# ------------------------------------------------------------------ the model
class NeuralNetwork:
    def __init__(
        self,
        hidden_layers: Sequence[int] = (4,),
        activation: str = "tanh",
        init: str = "xavier",
        seed: int = 0,
        n_inputs: int = 2,
    ):
        if activation not in ACTIVATIONS:
            raise ValueError(f"Unknown activation '{activation}'.")
        if init not in INITIALIZERS:
            raise ValueError(f"Unknown initializer '{init}'.")
        self.layer_sizes = [n_inputs, *[int(h) for h in hidden_layers], 1]
        self.activation_name = activation
        self.init_name = init
        self.seed = seed
        self._act, self._dact = ACTIVATIONS[activation]
        self.W: list[np.ndarray] = []
        self.b: list[np.ndarray] = []
        self.initialize()

    # -- parameters ---------------------------------------------------------
    def initialize(self) -> None:
        rng = np.random.default_rng(self.seed)
        self.W, self.b = [], []
        for n_in, n_out in zip(self.layer_sizes[:-1], self.layer_sizes[1:]):
            if self.init_name == "xavier":
                limit = np.sqrt(6.0 / (n_in + n_out))
                w = rng.uniform(-limit, limit, size=(n_in, n_out))
            elif self.init_name == "he":
                w = rng.normal(0.0, np.sqrt(2.0 / n_in), size=(n_in, n_out))
            elif self.init_name == "small_normal":
                w = rng.normal(0.0, 0.1, size=(n_in, n_out))
            else:  # zeros
                w = np.zeros((n_in, n_out))
            self.W.append(w)
            self.b.append(np.zeros((1, n_out)))

    @property
    def params(self) -> list[np.ndarray]:
        """Flat list [W0, b0, W1, b1, ...] of the live arrays (not copies)."""
        out: list[np.ndarray] = []
        for w, b in zip(self.W, self.b):
            out.extend([w, b])
        return out

    def n_parameters(self) -> int:
        return int(sum(p.size for p in self.params))

    def param_norm(self) -> float:
        return float(np.sqrt(sum(float(np.sum(p * p)) for p in self.params)))

    # -- forward ------------------------------------------------------------
    def forward(self, X: np.ndarray):
        """Return ``(logits, cache)``; cache holds the inputs, z's and a's of each layer."""
        a = np.asarray(X, dtype=float)
        activations = [a]
        zs: list[np.ndarray] = []
        last = len(self.W) - 1
        for i, (w, b) in enumerate(zip(self.W, self.b)):
            z = a @ w + b
            zs.append(z)
            a = sigmoid(z) if i == last else self._act(z)
            activations.append(a)
        return zs[-1], {"a": activations, "z": zs}

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        logits, _ = self.forward(X)
        return sigmoid(logits).reshape(-1)

    def predict(self, X: np.ndarray, threshold: float = 0.5) -> np.ndarray:
        return (self.predict_proba(X) >= threshold).astype(int)

    # -- loss / metrics -----------------------------------------------------
    def loss(self, X: np.ndarray, y: np.ndarray) -> float:
        logits, _ = self.forward(X)
        return bce_from_logits(logits, y)

    def accuracy(self, X: np.ndarray, y: np.ndarray) -> float:
        return float(np.mean(self.predict(X) == y.reshape(-1)))

    # -- backward -----------------------------------------------------------
    def backward(self, y: np.ndarray, cache) -> tuple[list[np.ndarray], list[np.ndarray]]:
        """Backpropagation. Returns gradients ``(dW, db)`` of the mean BCE loss."""
        a, z = cache["a"], cache["z"]
        m = a[0].shape[0]
        y = y.reshape(-1, 1).astype(float)
        n_layers = len(self.W)
        dW: list[np.ndarray] = [None] * n_layers  # type: ignore[list-item]
        db: list[np.ndarray] = [None] * n_layers  # type: ignore[list-item]
        delta = (sigmoid(z[-1]) - y) / m  # dL/dz at the output
        for l in range(n_layers - 1, -1, -1):
            dW[l] = a[l].T @ delta
            db[l] = delta.sum(axis=0, keepdims=True)
            if l > 0:
                delta = (delta @ self.W[l].T) * self._dact(z[l - 1], a[l])
        return dW, db

    def gradients(self, X: np.ndarray, y: np.ndarray):
        logits, cache = self.forward(X)
        dW, db = self.backward(y, cache)
        return bce_from_logits(logits, y), dW, db


# ----------------------------------------------------------------- optimizers
class SGD:
    def __init__(self, lr: float):
        self.lr = lr

    def step(self, params: list[np.ndarray], grads: list[np.ndarray]) -> None:
        for p, g in zip(params, grads):
            p -= self.lr * g


class Adam:
    def __init__(self, lr: float, beta1: float = 0.9, beta2: float = 0.999, eps: float = 1e-8):
        self.lr, self.beta1, self.beta2, self.eps = lr, beta1, beta2, eps
        self.t = 0
        self.m: list[np.ndarray] | None = None
        self.v: list[np.ndarray] | None = None

    def step(self, params: list[np.ndarray], grads: list[np.ndarray]) -> None:
        if self.m is None or self.v is None:
            self.m = [np.zeros_like(p) for p in params]
            self.v = [np.zeros_like(p) for p in params]
        self.t += 1
        for p, g, m, v in zip(params, grads, self.m, self.v):
            m *= self.beta1
            m += (1.0 - self.beta1) * g
            v *= self.beta2
            v += (1.0 - self.beta2) * g * g
            m_hat = m / (1.0 - self.beta1**self.t)
            v_hat = v / (1.0 - self.beta2**self.t)
            p -= self.lr * m_hat / (np.sqrt(v_hat) + self.eps)


def make_optimizer(name: str, lr: float):
    if name == "sgd":
        return SGD(lr)
    if name == "adam":
        return Adam(lr)
    raise ValueError(f"Unknown optimizer '{name}'.")


def flatten(arrays: Sequence[np.ndarray]) -> np.ndarray:
    return np.concatenate([a.reshape(-1) for a in arrays]) if arrays else np.zeros(0)


@dataclass
class StepResult:
    loss: float
    grad_norm: float


def train_step(net: NeuralNetwork, opt, X: np.ndarray, y: np.ndarray) -> StepResult:
    """One mini-batch iteration: forward, backward, optimizer update (in place)."""
    loss, dW, db = net.gradients(X, y)
    grads: list[np.ndarray] = []
    for gw, gb in zip(dW, db):
        grads.extend([gw, gb])
    opt.step(net.params, grads)
    return StepResult(loss, float(np.sqrt(sum(float(np.sum(g * g)) for g in grads))))
