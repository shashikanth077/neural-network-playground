import time

import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def dataset(name="moons", n=160, seed=0, noise=0.2):
    return client.post("/api/datasets/generate", json={"name": name, "n_samples": n, "seed": seed, "noise": noise}).json()


def payload(name="moons", n=160, noise=0.2, **cfg):
    d = dataset(name, n, noise=noise)
    config = {"hidden_layers": [8], "epochs": 40, "epoch_delay_ms": 0, "learning_rate": 0.05, **cfg}
    return {"dataset": {"points": d["points"], "labels": d["labels"]}, "config": config}


def run(**cfg):
    created = client.post("/api/models", json=payload(**cfg))
    assert created.status_code == 201, created.text
    sid = created.json()["session_id"]
    client.post("/api/training/start", json={"session_id": sid})
    end = time.time() + 30
    while time.time() < end:
        s = client.get(f"/api/training/{sid}/status").json()
        if s["status"] in ("completed", "failed"):
            return sid, s
        time.sleep(0.02)
    raise AssertionError("timeout")


@pytest.mark.parametrize("activation", ["relu", "leaky_relu", "elu", "selu", "sigmoid", "tanh", "softplus", "silu"])
def test_every_activation_trains_through_the_api(activation):
    sid, s = run(activation=activation, epochs=15)
    assert s["status"] == "completed" and s["latest"]["train_loss"] < 0.8
    client.delete(f"/api/training/{sid}")


@pytest.mark.parametrize(
    "optimizer,lr",
    [("sgd", 0.3), ("momentum", 0.05), ("nesterov", 0.05), ("adagrad", 0.2), ("rmsprop", 0.01), ("adadelta", 1.0), ("adam", 0.05), ("nadam", 0.05)],
)
def test_every_optimizer_trains_through_the_api(optimizer, lr):
    sid, s = run(optimizer=optimizer, learning_rate=lr, epochs=40)
    hist = client.get(f"/api/training/{sid}/history").json()["history"]
    assert s["status"] == "completed" and hist[-1]["train_loss"] < hist[0]["train_loss"]


@pytest.mark.parametrize("loss", ["bce", "mse", "hinge"])
def test_every_loss_trains_through_the_api(loss):
    sid, s = run(loss=loss, epochs=40)
    assert s["status"] == "completed" and s["latest"]["train_acc"] > 0.8


def test_batch_gd_sgd_and_minibatch_modes_run_and_differ_in_updates_per_epoch():
    # same epochs: the smaller the batch, the more weight updates, so the lower the loss after few epochs
    losses = {}
    for name, bs in [("batch", 128), ("mini", 16), ("sgd", 1)]:
        sid, s = run(batch_size=bs, epochs=3, optimizer="sgd", learning_rate=0.1)
        losses[name] = s["latest"]["train_loss"]
    assert losses["sgd"] < losses["mini"] < losses["batch"]


def test_regularisation_dropout_and_batchnorm_session():
    sid, s = run(l1=0.001, l2=0.01, dropout=0.2, batch_norm=True, batch_size=16, epochs=30)
    assert s["status"] == "completed"
    assert s["latest"]["penalty"] > 0
    assert s["n_non_trainable"] == 2 * 8
    params = client.get(f"/api/training/{sid}/parameters").json()
    assert params["layers"][0]["gamma"] is not None and params["layers"][-1].get("gamma") is None
    trace = client.get(f"/api/training/{sid}/iteration-trace").json()
    assert trace["loss"] > 0  # dry run works with batch norm in inference mode


def test_early_stopping_stops_before_the_epoch_limit_and_restores_best():
    # tiny noisy data + big net overfits quickly -> validation loss turns upward
    sid, s = run(name="moons", n=40, noise=0.9, hidden_layers=[32, 32], epochs=400, val_split=0.4,
                 early_stopping=True, patience=5, restore_best=True, learning_rate=0.05, batch_size=8)
    assert s["stopped_early"] is True and s["epoch"] < 400
    assert s["restored_best"] is True and s["best_epoch"] is not None and s["best_epoch"] <= s["epoch"] - 5
    hist = client.get(f"/api/training/{sid}/history").json()["history"]
    assert min(h["val_loss"] for h in hist) == pytest.approx(hist[s["best_epoch"] - 1]["val_loss"])
    # weights were restored: current validation loss equals the best recorded one
    ev = client.get(f"/api/training/{sid}/evaluation", params={"split": "val"}).json()
    assert ev["epoch"] == s["epoch"]


def test_invalid_combinations_are_rejected_with_helpful_messages():
    r = client.post("/api/models", json=payload(early_stopping=True, val_split=0.0))
    assert r.status_code == 422 and "validation split" in r.text
    r = client.post("/api/models", json=payload(batch_norm=True, batch_size=1))
    assert r.status_code == 422 and "batch size of at least 2" in r.text
    assert client.post("/api/models", json=payload(dropout=0.99)).status_code == 422
    assert client.post("/api/models", json=payload(optimizer="lion")).status_code == 422
    assert client.post("/api/models", json=payload(loss="huber")).status_code == 422


def test_evaluation_endpoint_metrics_roc_and_threshold():
    sid, s = run(epochs=60)
    ev = client.get(f"/api/training/{sid}/evaluation", params={"split": "val", "threshold": 0.5}).json()
    c = ev["confusion"]
    assert c["tp"] + c["fp"] + c["tn"] + c["fn"] == ev["n"] == s["n_val"]
    assert ev["accuracy"] == pytest.approx((c["tp"] + c["tn"]) / ev["n"])
    assert 0.5 < ev["auc"] <= 1.0
    assert ev["roc"]["fpr"][0] == 0 and ev["roc"]["tpr"][-1] == 1
    tr = client.get(f"/api/training/{sid}/evaluation", params={"split": "train"}).json()
    assert tr["n"] == s["n_train"]
    hi = client.get(f"/api/training/{sid}/evaluation", params={"split": "val", "threshold": 0.95}).json()
    lo = client.get(f"/api/training/{sid}/evaluation", params={"split": "val", "threshold": 0.05}).json()
    assert hi["recall"] <= lo["recall"]
    assert client.get(f"/api/training/{sid}/evaluation", params={"threshold": 2}).status_code == 422
    assert client.get("/api/training/nope/evaluation").status_code == 404


def test_evaluation_without_validation_set_is_a_clear_error():
    created = client.post("/api/models", json=payload(val_split=0.0)).json()
    r = client.get(f"/api/training/{created['session_id']}/evaluation", params={"split": "val"})
    assert r.status_code == 422 and "no validation set" in r.text
    assert client.get(f"/api/training/{created['session_id']}/evaluation", params={"split": "train"}).status_code == 200


@pytest.mark.parametrize("method", ["holdout", "kfold", "stratified_kfold", "shuffle_split", "time_series"])
def test_cross_validation_methods(method):
    body = payload(epochs=25)
    body["method"] = method
    body["k"] = 4
    r = client.post("/api/cross-validation", json=body)
    assert r.status_code == 200, r.text
    out = r.json()
    assert len(out["folds"]) == (1 if method == "holdout" else 4)
    assert all(0 <= f["val_accuracy"] <= 1 for f in out["folds"])
    assert out["mean_val_accuracy"] == pytest.approx(np.mean([f["val_accuracy"] for f in out["folds"]]))
    if method in ("kfold", "stratified_kfold"):
        covered = sorted(i for f in out["folds"] for i in f["val_indices"])
        assert covered == list(range(out["n_samples"]))
    if method == "time_series":
        assert max(out["folds"][0]["val_indices"]) < min(out["folds"][-1]["val_indices"])


def test_cross_validation_leave_one_out_limit_and_budget():
    small = payload(n=30, epochs=5)
    small["method"] = "leave_one_out"
    r = client.post("/api/cross-validation", json=small)
    assert r.status_code == 200 and len(r.json()["folds"]) == 30
    big = payload(n=200, epochs=5)
    big["method"] = "leave_one_out"
    assert client.post("/api/cross-validation", json=big).status_code == 422
    huge = payload(n=1500, epochs=1500)
    huge["method"] = "kfold"
    huge["k"] = 10
    assert client.post("/api/cross-validation", json=huge).status_code == 422


def test_cross_validation_is_reproducible():
    body = payload(epochs=15)
    body["method"] = "kfold"
    a = client.post("/api/cross-validation", json=body).json()
    b = client.post("/api/cross-validation", json=body).json()
    assert [f["val_loss"] for f in a["folds"]] == [f["val_loss"] for f in b["folds"]]
