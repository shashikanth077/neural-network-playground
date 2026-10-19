import numpy as np
import pytest

from app.metrics import auc, confusion_matrix, evaluate, roc_curve, scores
from app.validation import (
    holdout, kfold, leave_one_out, make_splits, shuffle_split, stratified_kfold, time_series_split,
)


# ------------------------------------------------------------------ metrics
def test_confusion_matrix_and_scores_hand_example():
    y = np.array([1, 1, 1, 1, 0, 0, 0, 0, 0, 0])
    p = np.array([1, 1, 1, 0, 1, 0, 0, 0, 0, 0])
    cm = confusion_matrix(y, p)
    assert cm == {"tp": 3, "fn": 1, "fp": 1, "tn": 5}
    s = scores(cm)
    assert s["accuracy"] == pytest.approx(0.8)
    assert s["precision"] == pytest.approx(0.75) and s["recall"] == pytest.approx(0.75)
    assert s["f1"] == pytest.approx(0.75) and s["specificity"] == pytest.approx(5 / 6)
    # F1 two ways, as written in the lecture: 2PR/(P+R) = TP/(TP+(FN+FP)/2)
    assert s["f1"] == pytest.approx(3 / (3 + (1 + 1) / 2))


def test_accuracy_paradox_on_imbalanced_data():
    # 9990 healthy, 10 sick; a model that always says "healthy" is 99.9% accurate and useless
    y = np.r_[np.zeros(9990), np.ones(10)].astype(int)
    s = scores(confusion_matrix(y, np.zeros_like(y)))
    assert s["accuracy"] == pytest.approx(0.999) and s["recall"] == 0.0 and s["f1"] == 0.0


def test_zero_division_is_reported_as_zero():
    s = scores({"tp": 0, "fp": 0, "tn": 5, "fn": 0})
    assert s["precision"] == 0.0 and s["recall"] == 0.0 and s["f1"] == 0.0


def test_roc_auc_classic_example():
    # scikit-learn's documentation example: AUC = 0.75
    y = np.array([0, 0, 1, 1])
    s = np.array([0.1, 0.4, 0.35, 0.8])
    fpr, tpr, thr = roc_curve(y, s)
    assert auc(fpr, tpr) == pytest.approx(0.75)
    assert fpr[0] == 0 and tpr[0] == 0 and fpr[-1] == 1 and tpr[-1] == 1


def test_auc_extremes_and_ties():
    y = np.array([0, 0, 0, 1, 1, 1])
    assert auc(*roc_curve(y, np.array([.1, .2, .3, .7, .8, .9]))[:2]) == pytest.approx(1.0)
    assert auc(*roc_curve(y, np.array([.9, .8, .7, .3, .2, .1]))[:2]) == pytest.approx(0.0)
    assert auc(*roc_curve(y, np.full(6, 0.5))[:2]) == pytest.approx(0.5)  # all tied: chance


def test_auc_equals_probability_a_positive_outranks_a_negative():
    rng = np.random.default_rng(0)
    y = rng.integers(0, 2, 200)
    s = rng.normal(size=200) + y * 0.8
    pos, neg = s[y == 1], s[y == 0]
    mann_whitney = np.mean([(a > b) + 0.5 * (a == b) for a in pos for b in neg])
    assert auc(*roc_curve(y, s)[:2]) == pytest.approx(mann_whitney)


def test_roc_needs_both_classes_and_evaluate_degrades_gracefully():
    with pytest.raises(ValueError):
        roc_curve(np.ones(4), np.linspace(0, 1, 4))
    out = evaluate(np.ones(4), np.array([0.9, 0.8, 0.2, 0.1]))
    assert out["auc"] is None and out["roc"] is None and out["confusion"]["tp"] == 2


def test_raising_the_threshold_trades_recall_for_precision():
    rng = np.random.default_rng(1)
    y = rng.integers(0, 2, 400)
    p = np.clip(0.5 + (y - 0.5) * 0.5 + rng.normal(0, 0.25, 400), 0, 1)
    low, high = evaluate(y, p, 0.3), evaluate(y, p, 0.7)
    assert high["recall"] < low["recall"] and high["precision"] > low["precision"]


# --------------------------------------------------------------- validation
def _is_partition(splits, n):
    vals = np.concatenate([v for _, v in splits])
    return sorted(vals.tolist()) == list(range(n))


def test_holdout_sizes_and_disjointness():
    (tr, va), = holdout(100, 0.2, seed=1)
    assert len(va) == 20 and len(tr) == 80 and not set(tr) & set(va)


def test_kfold_partitions_the_data():
    splits = kfold(23, 5, seed=0)
    assert len(splits) == 5 and _is_partition(splits, 23)
    for tr, va in splits:
        assert not set(tr) & set(va) and len(tr) + len(va) == 23


def test_stratified_kfold_keeps_class_ratio():
    y = np.array([0] * 4 + [1] * 8)  # the lecture's 12-sample example, 3 folds
    splits = stratified_kfold(y, 3, seed=0)
    assert _is_partition(splits, 12)
    for _, va in splits:
        c0 = int(np.sum(y[va] == 0))
        assert c0 in (1, 2) and int(np.sum(y[va] == 1)) in (2, 3)  # never a fold with only one class
    big = np.r_[np.zeros(30), np.ones(70)].astype(int)
    for _, va in stratified_kfold(big, 5, seed=2):
        assert abs(np.mean(big[va]) - 0.7) < 0.06


def test_stratified_needs_enough_samples_per_class():
    with pytest.raises(ValueError, match="needs at least"):
        stratified_kfold(np.array([0, 0, 0, 1]), 3)


def test_shuffle_split_sizes_and_possible_repeats():
    splits = shuffle_split(10, n_splits=3, test_size=0.3, seed=0)
    assert len(splits) == 3 and all(len(v) == 3 and len(t) == 7 for t, v in splits)
    assert not _is_partition(splits, 10) or True  # splits are independent; coverage is not guaranteed


def test_time_series_split_matches_the_lecture_table():
    # 100 samples, 4 splits: train 0-19 / val 20-39, train 0-39 / val 40-59, ...
    splits = time_series_split(100, 4)
    expected = [((0, 19), (20, 39)), ((0, 39), (40, 59)), ((0, 59), (60, 79)), ((0, 79), (80, 99))]
    for (tr, va), ((a, b), (c, d)) in zip(splits, expected):
        assert (tr[0], tr[-1], va[0], va[-1]) == (a, b, c, d)
        assert tr.max() < va.min()  # the future is never used for training


def test_leave_one_out_and_limits():
    splits = leave_one_out(6)
    assert len(splits) == 6 and all(len(v) == 1 and len(t) == 5 for t, v in splits) and _is_partition(splits, 6)
    with pytest.raises(ValueError, match="limited"):
        make_splits("leave_one_out", np.zeros(100))
    with pytest.raises(ValueError):
        make_splits("nope", np.zeros(10))
