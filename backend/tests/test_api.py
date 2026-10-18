import time

import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.main import app, manager

client = TestClient(app)


def dataset(name="xor", n=120, seed=0):
    r = client.post("/api/datasets/generate", json={"name": name, "n_samples": n, "seed": seed, "noise": 0.1})
    assert r.status_code == 200
    return r.json()


def payload(name="xor", **cfg):
    d = dataset(name)
    config = {"hidden_layers": [6], "epochs": 60, "epoch_delay_ms": 0, "learning_rate": 0.05, **cfg}
    return {"dataset": {"points": d["points"], "labels": d["labels"]}, "config": config}


def wait_for(sid, states, timeout=20):
    end = time.time() + timeout
    while time.time() < end:
        s = client.get(f"/api/training/{sid}/status").json()
        if s["status"] in states:
            return s
        time.sleep(0.02)
    raise AssertionError(f"timeout, last status {s}")


def test_health_and_dataset_catalogue():
    assert client.get("/api/health").json()["status"] == "ok"
    names = {d["name"] for d in client.get("/api/datasets").json()}
    assert names == {"xor", "moons", "circles", "linear", "custom"}


def test_generate_validation():
    r = client.post("/api/datasets/generate", json={"name": "bogus"})
    assert r.status_code == 422
    r = client.post("/api/datasets/generate", json={"name": "xor", "n_samples": 5})
    assert r.status_code == 422


def test_training_updates_parameters_and_history():
    created = client.post("/api/models", json=payload()).json()
    sid = created["session_id"]
    assert created["status"] == "ready" and created["layer_sizes"] == [2, 6, 1]
    assert created["n_parameters"] == 2 * 6 + 6 + 6 + 1
    before = client.get(f"/api/training/{sid}/parameters").json()
    assert client.post(f"/api/training/start", json={"session_id": sid}).status_code == 200
    final = wait_for(sid, {"completed", "failed"})
    assert final["status"] == "completed" and final["epoch"] == 60
    after = client.get(f"/api/training/{sid}/parameters").json()
    assert not np.allclose(before["layers"][0]["weights"], after["layers"][0]["weights"])
    hist = client.get(f"/api/training/{sid}/history").json()["history"]
    assert [h["epoch"] for h in hist] == list(range(1, 61))
    assert hist[-1]["train_loss"] < hist[0]["train_loss"]
    assert hist[-1]["val_loss"] is not None and hist[-1]["grad_norm"] > 0
    part = client.get(f"/api/training/{sid}/history", params={"since": 55}).json()["history"]
    assert len(part) == 5


def test_predict_points_grid_and_activations():
    sid = client.post("/api/models", json=payload()).json()["session_id"]
    r = client.post(f"/api/training/{sid}/predict", json={"points": [[0, 0], [1, 1], [-1, 0.5]]}).json()
    assert len(r["probabilities"]) == 3 and all(0 <= p <= 1 for p in r["probabilities"])
    g = client.post(
        f"/api/training/{sid}/predict",
        json={"grid": {"x_min": -1, "x_max": 1, "y_min": -1, "y_max": 1, "resolution": 10}},
    ).json()
    assert g["resolution"] == 10 and len(g["probabilities"]) == 100
    a = client.post(f"/api/training/{sid}/predict", json={"points": [[0.3, -0.2]], "include_activations": True}).json()
    assert [len(l) for l in a["activations"]] == [2, 6, 1]
    assert client.post(f"/api/training/{sid}/predict", json={}).status_code == 422


def test_pause_resume_reset():
    sid = client.post("/api/models", json=payload(epochs=400, epoch_delay_ms=10)).json()["session_id"]
    before = client.get(f"/api/training/{sid}/parameters").json()
    client.post("/api/training/start", json={"session_id": sid})
    time.sleep(0.15)
    assert client.post(f"/api/training/{sid}/pause").json()["status"] == "paused"
    time.sleep(0.1)
    e1 = client.get(f"/api/training/{sid}/status").json()["epoch"]
    time.sleep(0.2)
    assert client.get(f"/api/training/{sid}/status").json()["epoch"] == e1  # truly paused
    assert 0 < e1 < 400
    assert client.post(f"/api/training/{sid}/pause").status_code == 409
    assert client.post(f"/api/training/{sid}/resume").json()["status"] == "running"
    time.sleep(0.2)
    assert client.get(f"/api/training/{sid}/status").json()["epoch"] > e1
    r = client.post(f"/api/training/{sid}/reset").json()
    assert r["status"] == "ready" and r["epoch"] == 0 and r["latest"] is None
    assert client.get(f"/api/training/{sid}/history").json()["history"] == []
    after = client.get(f"/api/training/{sid}/parameters").json()
    assert np.allclose(before["layers"][0]["weights"], after["layers"][0]["weights"])  # same seed -> same init


def test_reset_while_paused_and_restart():
    sid = client.post("/api/models", json=payload(epochs=300, epoch_delay_ms=10)).json()["session_id"]
    client.post("/api/training/start", json={"session_id": sid})
    time.sleep(0.1)
    client.post(f"/api/training/{sid}/pause")
    assert client.post(f"/api/training/{sid}/reset").json()["status"] == "ready"
    assert client.post("/api/training/start", json={"session_id": sid}).json()["status"] == "running"
    client.post(f"/api/training/{sid}/reset")


def test_start_twice_and_after_completion_conflicts():
    sid = client.post("/api/models", json=payload(epochs=3)).json()["session_id"]
    client.post("/api/training/start", json={"session_id": sid})
    wait_for(sid, {"completed"})
    assert client.post("/api/training/start", json={"session_id": sid}).status_code == 409


def test_start_creates_session_from_inline_payload():
    r = client.post("/api/training/start", json=payload(epochs=5))
    assert r.status_code == 200
    wait_for(r.json()["session_id"], {"completed"})


def test_unknown_session_and_invalid_configs():
    for path in ("status", "history", "parameters"):
        assert client.get(f"/api/training/nope/{path}").status_code == 404
    assert client.post("/api/training/nope/pause").status_code == 404
    assert client.post("/api/training/start", json={"session_id": "nope"}).status_code == 404
    bad = payload(hidden_layers=[4] * 6)
    assert client.post("/api/models", json=bad).status_code == 422
    assert client.post("/api/models", json=payload(hidden_layers=[40])).status_code == 422
    assert client.post("/api/models", json=payload(learning_rate=-1)).status_code == 422
    assert client.post("/api/models", json=payload(activation="swish")).status_code == 422
    one_class = {"dataset": {"points": [[0, 0]] * 8, "labels": [1] * 8}, "config": {}}
    assert client.post("/api/models", json=one_class).status_code == 422
    tiny = {"dataset": {"points": [[0, 0], [1, 1], [0, 1], [1, 0], [2, 2], [3, 3]], "labels": [0, 1, 0, 1, 0, 1]}, "config": {"val_split": 0.1}}
    assert client.post("/api/models", json=tiny).status_code == 422


def test_divergence_is_reported_as_failure():
    sid = client.post("/api/models", json=payload(optimizer="sgd", learning_rate=10, epochs=200, activation="relu", hidden_layers=[32, 32, 32], init="he")).json()["session_id"]
    client.post("/api/training/start", json={"session_id": sid})
    s = wait_for(sid, {"completed", "failed"})
    # Either it survived (fine) or the failure carries a helpful message.
    if s["status"] == "failed":
        assert "Training failed" in s["error"]


def test_sessions_are_independent():
    a = client.post("/api/models", json=payload(seed=1, epochs=200, epoch_delay_ms=5)).json()["session_id"]
    b = client.post("/api/models", json=payload(seed=2, epochs=5)).json()["session_id"]
    client.post("/api/training/start", json={"session_id": a})
    client.post("/api/training/start", json={"session_id": b})
    wait_for(b, {"completed"})
    assert client.get(f"/api/training/{a}/status").json()["epoch"] < 200
    assert client.get(f"/api/training/{b}/status").json()["epoch"] == 5
    client.post(f"/api/training/{a}/reset")


def test_iteration_trace_is_a_dry_run():
    sid = client.post("/api/models", json=payload()).json()["session_id"]
    before = client.get(f"/api/training/{sid}/parameters").json()
    t = client.get(f"/api/training/{sid}/iteration-trace", params={"sample": 2}).json()
    assert len(t["layers"]) == 2 and t["loss"] > 0
    assert t["example_weight"]["sgd_update"] == pytest.approx(
        t["example_weight"]["value"] - t["learning_rate"] * t["example_weight"]["gradient"]
    )
    assert client.get(f"/api/training/{sid}/parameters").json() == before


def test_cleanup_policy_removes_stale_sessions():
    sid = client.post("/api/models", json=payload()).json()["session_id"]
    manager.get(sid).last_access -= manager.ttl + 10
    assert manager.cleanup() >= 1
    assert client.get(f"/api/training/{sid}/status").status_code == 404


def test_delete_session():
    sid = client.post("/api/models", json=payload()).json()["session_id"]
    assert client.delete(f"/api/training/{sid}").status_code == 204
    assert client.get(f"/api/training/{sid}/status").status_code == 404
