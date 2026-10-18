"""Synthetic 2-D binary classification datasets.

All generators return coordinates roughly inside [-1.5, 1.5]^2 and labels in {0, 1}.
They are deterministic for a given seed.
"""
from __future__ import annotations

from typing import Callable

import numpy as np

DATASET_INFO = {
    "xor": {
        "label": "XOR",
        "description": "Opposite quadrants share a class. Not linearly separable.",
    },
    "moons": {
        "label": "Two moons",
        "description": "Two interleaving half circles.",
    },
    "circles": {
        "label": "Circles",
        "description": "A ring of one class around a disc of the other.",
    },
    "linear": {
        "label": "Linearly separable",
        "description": "Two Gaussian clouds that a single straight line can separate.",
    },
    "custom": {
        "label": "Custom",
        "description": "Click on the plot to place your own points.",
    },
}


def _xor(n: int, noise: float, rng: np.random.Generator):
    x = rng.uniform(-1.0, 1.0, size=(n, 2))
    # keep points off the axes so the classes are cleanly defined before noise
    x = np.sign(x) * (0.12 + 0.88 * np.abs(x))
    y = (x[:, 0] * x[:, 1] > 0).astype(int)
    x = x + rng.normal(0.0, noise * 0.5, size=x.shape)
    return x, y


def _moons(n: int, noise: float, rng: np.random.Generator):
    n_out = n // 2
    n_in = n - n_out
    t_out = rng.uniform(0, np.pi, n_out)
    t_in = rng.uniform(0, np.pi, n_in)
    outer = np.stack([np.cos(t_out), np.sin(t_out)], axis=1)
    inner = np.stack([1 - np.cos(t_in), 0.5 - np.sin(t_in)], axis=1)
    x = np.vstack([outer, inner])
    y = np.concatenate([np.zeros(n_out, dtype=int), np.ones(n_in, dtype=int)])
    x = x + rng.normal(0.0, noise * 0.5, size=x.shape)
    x = (x - np.array([0.5, 0.25])) * 1.1  # centre roughly on the origin
    return x, y


def _circles(n: int, noise: float, rng: np.random.Generator):
    n_out = n // 2
    n_in = n - n_out
    t_out = rng.uniform(0, 2 * np.pi, n_out)
    t_in = rng.uniform(0, 2 * np.pi, n_in)
    outer = 1.0 * np.stack([np.cos(t_out), np.sin(t_out)], axis=1)
    inner = 0.45 * np.stack([np.cos(t_in), np.sin(t_in)], axis=1)
    x = np.vstack([outer, inner])
    y = np.concatenate([np.zeros(n_out, dtype=int), np.ones(n_in, dtype=int)])
    x = x + rng.normal(0.0, noise * 0.5, size=x.shape)
    return x, y


def _linear(n: int, noise: float, rng: np.random.Generator):
    n0 = n // 2
    n1 = n - n0
    spread = 0.25 + noise * 0.6
    a = rng.normal([-0.6, -0.6], spread, size=(n0, 2))
    b = rng.normal([0.6, 0.6], spread, size=(n1, 2))
    x = np.vstack([a, b])
    y = np.concatenate([np.zeros(n0, dtype=int), np.ones(n1, dtype=int)])
    return x, y


_GENERATORS: dict[str, Callable] = {
    "xor": _xor,
    "moons": _moons,
    "circles": _circles,
    "linear": _linear,
}


def generate_dataset(name: str, n_samples: int, noise: float, seed: int):
    """Return ``(points, labels)`` as NumPy arrays of shape (n, 2) and (n,)."""
    if name not in _GENERATORS:
        raise ValueError(f"Unknown generated dataset '{name}'.")
    rng = np.random.default_rng(seed)
    x, y = _GENERATORS[name](n_samples, noise, rng)
    order = rng.permutation(len(y))
    return x[order].astype(float), y[order].astype(int)
