"""Experiment database: store, auto-save hooks and the /api/runs endpoints."""
import sqlite3
import threading
import time

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.store import RunNotFound, RunStore, StoreError, summarize_dataset

client = TestClient(app)


@pytest.fixture()
def db(tmp_path, monkeypatch):
    path = tmp_path / "sub" / "runs.db"  # directory does not exist yet
    monkeypatch.setenv("DB_PATH", str(path))
    monkeypatch.setenv("DB_ENABLED", "true")
    return path


def save(store, **over):
    args = dict(
        kind="playground", status="completed", config={"optimizer": "adam", "hidden_layers": [4]},
        dataset={"name": "moons"}, metrics={"final_train_loss": 0.2},
        history=[{"epoch": 1, "train_loss": 0.9, "train_acc": 0.5, "val_loss": 1.0, "val_acc": 0.4},
                 {"epoch": 2, "train_loss": 0.5, "train_acc": 0.8, "val_loss": 0.6, "val_acc": 0.7}],
        title="t",
    )
    args.update(over)
    return store.save(**args)


def payload(n=120, **cfg):
    d = client.post("/api/datasets/generate", json={"name": "moons", "n_samples": n, "seed": 1, "noise": 0.2}).json()
    config = {"hidden_layers": [6], "epochs": 12, "epoch_delay_ms": 0, "learning_rate": 0.05, **cfg}
    return {
        "dataset": {"points": d["points"], "labels": d["labels"],
                    "source": {"name": "moons", "n_samples": n, "noise": 0.2, "seed": 1}},
        "config": config,
    }


def train(**cfg):
    sid = client.post("/api/models", json=payload(**cfg)).json()["session_id"]
    client.post("/api/training/start", json={"session_id": sid})
    end = time.time() + 30
    while time.time() < end:
        s = client.get(f"/api/training/{sid}/status").json()
        if s["status"] in ("completed", "failed") and s["run_id"]:
            return sid, s
        time.sleep(0.02)
    raise AssertionError("timeout")


# ------------------------------------------------------------------- store
def test_store_crud_on_temp_db(db):
    store = RunStore()
    rid = save(store, notes="hello")
    got = store.get(rid)
    assert got["title"] == "t" and got["notes"] == "hello" and len(got["history"]) == 2
    assert store.list()["total"] == 1
    store.update(rid, title="renamed")
    assert store.get(rid)["title"] == "renamed" and store.get(rid)["notes"] == "hello"
    store.delete(rid)
    with pytest.raises(RunNotFound):
        store.get(rid)
    with pytest.raises(RunNotFound):
        store.delete(rid)
    assert db.exists()


def test_migration_version_recorded_and_idempotent(db):
    RunStore().status()
    RunStore().status()  # second instance must not re-run the migration
    conn = sqlite3.connect(db)
    assert conn.execute("SELECT version FROM migrations").fetchall() == [(1,)]
    conn.close()


def test_list_order_filter_search_and_paging(db):
    store = RunStore()
    a = save(store, title="first moons", created_at=1000)
    b = save(store, title="second", kind="cross-validation", history=[], created_at=2000, notes="needle here")
    c = save(store, title="third", created_at=3000, config={"optimizer": "sgd"})
    assert [r["id"] for r in store.list()["items"]] == [c, b, a]
    assert [r["id"] for r in store.list(kind="cross-validation")["items"]] == [b]
    assert [r["id"] for r in store.list(q="NEEDLE")["items"]] == [b]
    assert [r["id"] for r in store.list(q="sgd")["items"]] == [c]
    page = store.list(limit=1, offset=1)
    assert page["total"] == 3 and [r["id"] for r in page["items"]] == [b]
    assert "history" not in page["items"][0] and page["items"][0]["spark"] == []


def test_dataset_points_only_for_custom_and_capped():
    pts = [[float(i), 0.0] for i in range(10)]
    labels = [i % 2 for i in range(10)]
    assert "points" not in summarize_dataset(pts, labels, {"name": "moons"})
    assert summarize_dataset(pts, labels, None)["points"] == pts
    big = [[0.0, 0.0]] * 2001
    assert "points" not in summarize_dataset(big, [0] * 2001, None)


def test_concurrent_writes(db):
    store = RunStore()
    ids, errors = [], []

    def worker(i):
        try:
            ids.append(save(store, title=f"w{i}"))
        except Exception as exc:  # pragma: no cover
            errors.append(exc)

    threads = [threading.Thread(target=worker, args=(i,)) for i in range(16)]
    [t.start() for t in threads]
    [t.join() for t in threads]
    assert not errors and len(set(ids)) == 16 and store.list(limit=200)["total"] == 16


def test_unwritable_directory_is_reported_not_raised(tmp_path):
    blocker = tmp_path / "file"
    blocker.write_text("x")
    store = RunStore(path=blocker / "nested" / "x.db")  # parent is a file, cannot be created
    with pytest.raises(StoreError) as e:
        store.list()
    assert e.value.code == "unavailable"
    assert store.status()["available"] is False


def test_corrupted_file_is_reported_and_left_alone(tmp_path):
    bad = tmp_path / "bad.db"
    bad.write_bytes(b"this is not a sqlite database" * 50)
    store = RunStore(path=bad)
    with pytest.raises(StoreError):
        store.list()
    assert bad.read_bytes().startswith(b"this is not")
    assert store.record_cv([[0, 0]], [0], None, {}, {"folds": []}, 0.1) is None  # no exception


def test_corrupt_json_columns_do_not_break_reads(db):
    store = RunStore()
    rid = save(store)
    conn = sqlite3.connect(db)
    conn.execute("UPDATE runs SET metrics_json='{oops', history_json='nope' WHERE id=?", (rid,))
    conn.commit()
    conn.close()
    got = store.get(rid)
    assert got["metrics"] == {} and got["history"] == []


# --------------------------------------------------------------- auto-save
def test_training_is_saved_automatically(db):
    _, status = train()
    run = client.get(f"/api/runs/{status['run_id']}").json()
    assert run["kind"] == "playground" and run["status"] == "completed"
    assert run["dataset"]["name"] == "moons" and run["dataset"]["seed"] == 1 and "points" not in run["dataset"]
    assert run["config"]["hidden_layers"] == [6]
    assert len(run["history"]) == 12 and run["metrics"]["epochs_run"] == 12
    assert run["metrics"]["final_train_loss"] == run["history"][-1]["train_loss"]
    assert run["metrics"]["n_parameters"] > 0 and run["metrics"]["elapsed"] >= 0
    assert client.get("/api/runs").json()["total"] == 1


def test_early_stopped_run_is_saved(db):
    _, status = train(early_stopping=True, patience=2, epochs=200, learning_rate=0.5)
    run = client.get(f"/api/runs/{status['run_id']}").json()
    assert run["metrics"]["stopped_early"] in (True, False) and run["metrics"]["epochs_run"] >= 1


def test_failed_run_is_saved(db):
    _, status = train(learning_rate=10.0, optimizer="sgd", hidden_layers=[32, 32, 32], epochs=300, activation="relu")
    run = client.get(f"/api/runs/{status['run_id']}").json()
    assert run["status"] == status["status"]
    if status["status"] == "failed":
        assert run["metrics"]["error"]


def test_reset_session_is_not_saved_and_second_run_gets_new_id(db):
    sid, first = train()
    client.post(f"/api/training/{sid}/reset")
    assert client.get(f"/api/training/{sid}/status").json()["run_id"] is None
    client.post("/api/training/start", json={"session_id": sid})
    end = time.time() + 30
    second = None
    while time.time() < end:
        s = client.get(f"/api/training/{sid}/status").json()
        if s["status"] == "completed" and s["run_id"]:
            second = s
            break
        time.sleep(0.02)
    assert second and second["run_id"] != first["run_id"]
    assert client.get("/api/runs").json()["total"] == 2


def test_deleted_running_session_is_not_saved(db):
    body = payload(epochs=2000, epoch_delay_ms=20)
    sid = client.post("/api/models", json=body).json()["session_id"]
    client.post("/api/training/start", json={"session_id": sid})
    time.sleep(0.2)
    client.delete(f"/api/training/{sid}")
    time.sleep(0.3)
    assert client.get("/api/runs").json()["total"] == 0


def test_cross_validation_is_saved(db):
    body = payload(epochs=10)
    body.update({"method": "kfold", "k": 3})
    r = client.post("/api/cross-validation", json=body)
    assert r.status_code == 200, r.text
    run = client.get(f"/api/runs/{r.json()['run_id']}").json()
    assert run["kind"] == "cross-validation" and run["metrics"]["n_folds"] == 3
    assert run["config"]["cv_method"] == "kfold" and run["history"] == []
    assert len(run["metrics"]["folds"]) == 3
    assert client.get("/api/runs", params={"kind": "cross-validation"}).json()["total"] == 1
    assert client.get("/api/runs", params={"kind": "playground"}).json()["total"] == 0


def test_storage_failure_never_breaks_training_or_cv(tmp_path, monkeypatch):
    blocker = tmp_path / "f"
    blocker.write_text("x")
    monkeypatch.setenv("DB_PATH", str(blocker / "x" / "y.db"))
    sid, status = None, None
    sid = client.post("/api/models", json=payload()).json()["session_id"]
    client.post("/api/training/start", json={"session_id": sid})
    end = time.time() + 30
    while time.time() < end:
        status = client.get(f"/api/training/{sid}/status").json()
        if status["status"] == "completed":
            break
        time.sleep(0.02)
    assert status["status"] == "completed" and status["run_id"] is None and status["error"] is None
    body = payload(epochs=5)
    body.update({"method": "holdout"})
    r = client.post("/api/cross-validation", json=body)
    assert r.status_code == 200 and r.json()["run_id"] is None


# --------------------------------------------------------------- endpoints
def test_get_patch_delete_and_404_422(db):
    store = RunStore()
    rid = save(store)
    assert client.get(f"/api/runs/{rid}").status_code == 200
    r = client.patch(f"/api/runs/{rid}", json={"title": "  New name ", "notes": "why"})
    assert r.status_code == 200 and r.json()["title"] == "New name" and r.json()["notes"] == "why"
    assert client.patch(f"/api/runs/{rid}", json={"notes": ""}).json()["notes"] == ""
    assert client.patch(f"/api/runs/{rid}", json={}).status_code == 422
    assert client.patch(f"/api/runs/{rid}", json={"title": "   "}).status_code == 422
    assert client.patch(f"/api/runs/{rid}", json={"title": "x" * 300}).status_code == 422
    assert client.patch("/api/runs/nope", json={"title": "x"}).status_code == 404
    assert client.get("/api/runs/nope").status_code == 404
    assert client.delete("/api/runs/nope").status_code == 404
    assert client.get("/api/runs", params={"limit": 0}).status_code == 422
    assert client.get("/api/runs", params={"kind": "bogus"}).status_code == 422
    assert client.delete(f"/api/runs/{rid}").status_code == 204
    assert client.get(f"/api/runs/{rid}").status_code == 404


def test_compare_aligns_histories_and_lists_differences(db):
    store = RunStore()
    a = save(store, config={"optimizer": "adam", "learning_rate": 0.1, "seed": 0})
    long_hist = [{"epoch": i + 1, "train_loss": 1 / (i + 1), "train_acc": 0.5, "val_loss": None, "val_acc": None} for i in range(5)]
    b = save(store, config={"optimizer": "sgd", "learning_rate": 0.1, "seed": 0}, history=long_hist)
    r = client.get("/api/runs/compare", params={"ids": f"{a},{b}"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["epochs"] == 5 and body["differing"] == ["optimizer"]
    assert body["rows"][0][f"{a}.train_loss"] == 0.9 and body["rows"][4][f"{a}.train_loss"] is None
    assert body["rows"][4][f"{b}.train_loss"] == pytest.approx(0.2)
    assert [x["id"] for x in body["runs"]] == [a, b]


def test_compare_validation(db):
    store = RunStore()
    a, b = save(store), save(store)
    assert client.get("/api/runs/compare", params={"ids": a}).status_code == 422
    assert client.get("/api/runs/compare", params={"ids": f"{a},{a}"}).status_code == 422
    assert client.get("/api/runs/compare", params={"ids": ",".join([a, b, "c", "d", "e"])}).status_code == 422
    assert client.get("/api/runs/compare", params={"ids": f"{a},missing"}).status_code == 404
    assert client.get("/api/runs/compare").status_code == 422


def test_database_disabled(db, monkeypatch):
    monkeypatch.setenv("DB_ENABLED", "false")
    st = client.get("/api/runs/status").json()
    assert st["enabled"] is False and st["available"] is False
    r = client.get("/api/runs")
    assert r.status_code == 503 and r.json()["code"] == "disabled"
    assert client.get("/api/runs/x").status_code == 503
    _, status = None, None
    sid = client.post("/api/models", json=payload()).json()["session_id"]
    client.post("/api/training/start", json={"session_id": sid})
    end = time.time() + 30
    while time.time() < end:
        status = client.get(f"/api/training/{sid}/status").json()
        if status["status"] == "completed":
            break
        time.sleep(0.02)
    assert status["status"] == "completed" and status["run_id"] is None
    assert not db.exists()  # nothing was created while disabled


def test_status_endpoint_when_enabled(db):
    st = client.get("/api/runs/status").json()
    assert st == {"enabled": True, "available": True, "count": 0, "schema_version": 1, "error": None}


def test_missing_directory_is_created_on_demand(db):
    assert not db.parent.exists()
    assert client.get("/api/runs").json() == {"total": 0, "items": []}
    assert db.exists()
