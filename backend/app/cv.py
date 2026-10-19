"""Cross-validation: train a fresh network on each split and report validation scores."""
from __future__ import annotations

import numpy as np

from .metrics import confusion_matrix, scores
from .nn import NeuralNetwork, batch_indices, make_optimizer, train_step
from .schemas import ModelConfig
from .validation import make_splits

MAX_WORK = 6_000_000  # splits * epochs * samples; keeps a request to a few seconds on a laptop


def cross_validate(X: np.ndarray, y: np.ndarray, cfg: ModelConfig, method: str, k: int, val_fraction: float) -> dict:
    splits = make_splits(method, y, k=k, val_fraction=val_fraction, seed=cfg.seed)
    work = len(splits) * cfg.epochs * len(y)
    if work > MAX_WORK:
        raise ValueError(
            f"This run is too large ({len(splits)} splits x {cfg.epochs} epochs x {len(y)} samples). "
            "Reduce the epochs, samples or number of folds."
        )
    folds = []
    for i, (tr, va) in enumerate(splits):
        net = NeuralNetwork(
            cfg.hidden_layers, cfg.activation, cfg.init, cfg.seed + i,
            loss=cfg.loss, l1=cfg.l1, l2=cfg.l2, dropout=cfg.dropout, batch_norm=cfg.batch_norm,
        )
        opt = make_optimizer(cfg.optimizer, cfg.learning_rate)
        shuffle_rng = np.random.default_rng(cfg.seed + 1 + i)
        drop_rng = np.random.default_rng(cfg.seed + 2 + i)
        bs = min(cfg.batch_size, len(tr))
        Xt, yt = X[tr], y[tr]
        for _ in range(cfg.epochs):
            for idx in batch_indices(len(tr), bs, shuffle_rng, cfg.batch_norm):
                train_step(net, opt, Xt[idx], yt[idx], drop_rng)
        if not np.all(np.isfinite(net.predict_proba(X[va]))):
            raise ValueError("Training diverged in one fold (NaN/Inf). Try a smaller learning rate.")
        pred = net.predict(X[va])
        folds.append(
            {
                "fold": i + 1,
                "n_train": int(len(tr)),
                "n_val": int(len(va)),
                "val_indices": va.tolist(),
                "val_loss": net.loss(X[va], y[va]),
                "val_accuracy": net.accuracy(X[va], y[va]),
                "val_f1": scores(confusion_matrix(y[va], pred))["f1"],
                "train_loss": net.loss(Xt, yt),
                "train_accuracy": net.accuracy(Xt, yt),
            }
        )
    vl = np.array([f["val_loss"] for f in folds])
    va_ = np.array([f["val_accuracy"] for f in folds])
    return {
        "method": method,
        "folds": folds,
        "mean_val_loss": float(vl.mean()),
        "std_val_loss": float(vl.std()),
        "mean_val_accuracy": float(va_.mean()),
        "std_val_accuracy": float(va_.std()),
        "mean_val_f1": float(np.mean([f["val_f1"] for f in folds])),
        "n_samples": int(len(y)),
        "note": (
            "Each split trains a fresh network for the configured number of epochs. "
            "The configured validation split and early stopping are ignored here; the chosen method does the splitting."
        ),
    }
