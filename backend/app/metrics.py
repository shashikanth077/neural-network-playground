"""Binary-classification metrics: confusion matrix, precision / recall / F1, ROC curve and AUC."""
from __future__ import annotations

import numpy as np


def confusion_matrix(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, int]:
    t = np.asarray(y_true).reshape(-1).astype(int)
    p = np.asarray(y_pred).reshape(-1).astype(int)
    return {
        "tp": int(np.sum((t == 1) & (p == 1))),
        "fp": int(np.sum((t == 0) & (p == 1))),
        "tn": int(np.sum((t == 0) & (p == 0))),
        "fn": int(np.sum((t == 1) & (p == 0))),
    }


def _div(a: float, b: float) -> float:
    """Division that returns 0 when the denominator is 0 (the usual 'zero_division=0' convention)."""
    return float(a / b) if b else 0.0


def scores(cm: dict[str, int]) -> dict[str, float]:
    tp, fp, tn, fn = cm["tp"], cm["fp"], cm["tn"], cm["fn"]
    precision = _div(tp, tp + fp)
    recall = _div(tp, tp + fn)
    return {
        "accuracy": _div(tp + tn, tp + tn + fp + fn),
        "precision": precision,
        "recall": recall,
        "specificity": _div(tn, tn + fp),
        "fpr": _div(fp, fp + tn),
        "f1": _div(2 * precision * recall, precision + recall),
    }


def roc_curve(y_true: np.ndarray, scores_: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """ROC points (fpr, tpr) for every distinct score threshold, starting at (0, 0). Ties are handled."""
    y = np.asarray(y_true).reshape(-1).astype(int)
    s = np.asarray(scores_).reshape(-1).astype(float)
    n_pos, n_neg = int(y.sum()), int(len(y) - y.sum())
    if n_pos == 0 or n_neg == 0:
        raise ValueError("ROC needs both classes in the evaluated data.")
    order = np.argsort(-s, kind="stable")
    s, y = s[order], y[order]
    last_of_group = np.r_[np.where(np.diff(s))[0], len(s) - 1]  # last index of each run of tied scores
    tps = np.cumsum(y)[last_of_group]
    fps = (last_of_group + 1) - tps
    fpr = np.r_[0.0, fps / n_neg]
    tpr = np.r_[0.0, tps / n_pos]
    thresholds = np.r_[np.inf, s[last_of_group]]
    return fpr, tpr, thresholds


def auc(fpr: np.ndarray, tpr: np.ndarray) -> float:
    """Area under the ROC curve (trapezoid rule)."""
    return float(np.sum(np.diff(fpr) * (tpr[1:] + tpr[:-1]) / 2.0))


def evaluate(y_true: np.ndarray, probs: np.ndarray, threshold: float = 0.5) -> dict:
    cm = confusion_matrix(y_true, (probs >= threshold).astype(int))
    out: dict = {"threshold": float(threshold), "n": int(len(y_true)), "confusion": cm, **scores(cm)}
    try:
        fpr, tpr, thr = roc_curve(y_true, probs)
        out["auc"] = auc(fpr, tpr)
        out["roc"] = {"fpr": fpr.tolist(), "tpr": tpr.tolist(), "thresholds": [None if np.isinf(t) else float(t) for t in thr]}
    except ValueError:
        out["auc"] = None
        out["roc"] = None
    return out
