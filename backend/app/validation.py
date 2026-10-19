"""Train / validation index splitters (hold-out, k-fold, stratified k-fold, shuffle split, time-series split, leave-one-out).

Every function returns a list of ``(train_indices, validation_indices)`` pairs of NumPy integer arrays.
"""
from __future__ import annotations

import numpy as np

METHODS = ("holdout", "kfold", "stratified_kfold", "shuffle_split", "time_series", "leave_one_out")


def holdout(n: int, val_fraction: float = 0.2, seed: int = 0, shuffle: bool = True):
    idx = np.random.default_rng(seed).permutation(n) if shuffle else np.arange(n)
    n_val = max(1, int(round(n * val_fraction)))
    if n_val >= n:
        raise ValueError("Validation fraction leaves no training data.")
    return [(np.sort(idx[n_val:]), np.sort(idx[:n_val]))]


def kfold(n: int, k: int, seed: int = 0, shuffle: bool = True):
    if not 2 <= k <= n:
        raise ValueError("k must be between 2 and the number of samples.")
    idx = np.random.default_rng(seed).permutation(n) if shuffle else np.arange(n)
    folds = np.array_split(idx, k)
    return [(np.sort(np.concatenate([f for j, f in enumerate(folds) if j != i])), np.sort(folds[i])) for i in range(k)]


def stratified_kfold(y: np.ndarray, k: int, seed: int = 0, shuffle: bool = True):
    """Each class is spread over the folds separately, so every fold keeps (almost) the original class ratio."""
    y = np.asarray(y).reshape(-1).astype(int)
    n = len(y)
    if not 2 <= k <= n:
        raise ValueError("k must be between 2 and the number of samples.")
    rng = np.random.default_rng(seed)
    buckets: list[list[int]] = [[] for _ in range(k)]
    offset = 0
    for cls in np.unique(y):
        members = np.where(y == cls)[0]
        if len(members) < k:
            raise ValueError(f"Class {cls} has only {len(members)} samples; stratified {k}-fold needs at least {k} per class.")
        if shuffle:
            members = rng.permutation(members)
        for j, part in enumerate(np.array_split(members, k)):
            buckets[(j + offset) % k].extend(part.tolist())  # rotate so fold sizes stay balanced
        offset += len(members) % k
    folds = [np.sort(np.array(b, dtype=int)) for b in buckets]
    all_idx = np.arange(n)
    return [(np.setdiff1d(all_idx, f), f) for f in folds]


def shuffle_split(n: int, n_splits: int = 5, test_size: float = 0.3, seed: int = 0):
    """Independent random splits (a sample can be validation in several splits, or in none)."""
    n_val = max(1, int(round(n * test_size)))
    if n_val >= n:
        raise ValueError("test_size leaves no training data.")
    rng = np.random.default_rng(seed)
    out = []
    for _ in range(n_splits):
        perm = rng.permutation(n)
        out.append((np.sort(perm[n_val:]), np.sort(perm[:n_val])))
    return out


def time_series_split(n: int, n_splits: int = 4):
    """Expanding training window; the validation block always lies in the future of the training data."""
    block = n // (n_splits + 1)
    if block < 1:
        raise ValueError("Not enough samples for this number of splits.")
    return [(np.arange(0, block * (i + 1)), np.arange(block * (i + 1), block * (i + 2))) for i in range(n_splits)]


def leave_one_out(n: int):
    all_idx = np.arange(n)
    return [(np.delete(all_idx, i), np.array([i])) for i in range(n)]


def make_splits(method: str, y: np.ndarray, k: int = 5, val_fraction: float = 0.2, seed: int = 0):
    n = len(y)
    if method == "holdout":
        return holdout(n, val_fraction, seed)
    if method == "kfold":
        return kfold(n, k, seed)
    if method == "stratified_kfold":
        return stratified_kfold(y, k, seed)
    if method == "shuffle_split":
        return shuffle_split(n, k, val_fraction, seed)
    if method == "time_series":
        return time_series_split(n, k)
    if method == "leave_one_out":
        if n > 60:
            raise ValueError("Leave-one-out trains one model per sample; it is limited to 60 samples here.")
        return leave_one_out(n)
    raise ValueError(f"Unknown validation method '{method}'.")
