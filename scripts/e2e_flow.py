"""End-to-end flow against a RUNNING backend (default http://127.0.0.1:8000).

Walks the same path the UI uses and checks each step with real values:
dataset -> model -> train -> pause/resume -> metrics -> parameters -> predict -> trace -> reset -> cleanup.

Usage:  uvicorn app.main:app --port 8000   (in backend/)
        python scripts/e2e_flow.py [BASE_URL]
Exit code 0 only if every check passes.
"""
import sys
import time

import httpx

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000").rstrip("/") + "/api"
results: list[tuple[str, bool, str]] = []


def step(name: str, ok: bool, detail: str = "") -> None:
    results.append((name, ok, detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" — {detail}" if detail else ""))


def wait(c: httpx.Client, sid: str, states: set[str], timeout: float = 60) -> dict:
    end = time.time() + timeout
    while time.time() < end:
        s = c.get(f"/training/{sid}/status").json()
        if s["status"] in states:
            return s
        time.sleep(0.05)
    raise TimeoutError(f"session {sid} did not reach {states}")


def main() -> int:
    c = httpx.Client(base_url=BASE, timeout=30)

    # 1. health + catalogue
    h = c.get("/health").json()
    step("1 health", h.get("status") == "ok", f"active_sessions={h.get('active_sessions')}")
    names = [d["name"] for d in c.get("/datasets").json()]
    step("2 dataset catalogue", {"xor", "moons", "circles", "linear"} <= set(names), ", ".join(names))

    # 2. generate data, deterministic by seed
    d1 = c.post("/datasets/generate", json={"name": "xor", "n_samples": 200, "noise": 0.15, "seed": 42}).json()
    d2 = c.post("/datasets/generate", json={"name": "xor", "n_samples": 200, "noise": 0.15, "seed": 42}).json()
    step("3 dataset generated", len(d1["points"]) == 200 and d1["points"] == d2["points"],
         f"200 points, {sum(d1['labels'])} class-1, same seed -> identical")

    # 3. create model (initial weights, not yet trained)
    cfg = {"hidden_layers": [8], "activation": "tanh", "init": "xavier", "optimizer": "adam",
           "learning_rate": 0.05, "batch_size": 32, "epochs": 150, "val_split": 0.2,
           "seed": 7, "epoch_delay_ms": 10}  # small pacing so pause can be observed
    body = {"dataset": {"points": d1["points"], "labels": d1["labels"]}, "config": cfg}
    m = c.post("/models", json=body)
    step("4 model created", m.status_code == 201, f"status={m.json().get('status')}, layers={m.json().get('layer_sizes')}")
    sid = m.json()["session_id"]
    expected_params = 2 * 8 + 8 + 8 + 1
    step("5 parameter count", m.json()["n_parameters"] == expected_params, f"{m.json()['n_parameters']} = {expected_params}")
    p0 = c.get(f"/training/{sid}/parameters").json()
    step("6 initial parameters readable", len(p0["layers"]) == 2, f"{len(p0['layers'][0]['weights'])}x{len(p0['layers'][0]['weights'][0])} hidden weights")

    # 4. start, pause, verify it really stops, resume
    c.post("/training/start", json={"session_id": sid})
    time.sleep(0.4)
    pr_pause = c.post(f"/training/{sid}/pause")
    e1 = pr_pause.json().get("epoch", -1)
    time.sleep(0.3)
    e2 = c.get(f"/training/{sid}/status").json()["epoch"]
    step("7 pause freezes training", pr_pause.status_code == 200 and e1 == e2 and 0 < e1 < cfg["epochs"],
         f"HTTP {pr_pause.status_code}, epoch {e1} -> {e2}")
    pr_resume = c.post(f"/training/{sid}/resume")
    step("8 resume", pr_resume.status_code == 200 and pr_resume.json()["status"] == "running")

    # 5. run to completion, check the history is real and complete
    final = wait(c, sid, {"completed", "failed"})
    hist = c.get(f"/training/{sid}/history").json()["history"]
    step("9 training completed", final["status"] == "completed" and final["epoch"] == cfg["epochs"],
         f"epoch {final['epoch']}/{cfg['epochs']}, elapsed {final['elapsed_seconds']:.2f}s")
    first, last = hist[0], hist[-1]
    step("10 loss decreased", last["train_loss"] < first["train_loss"],
         f"train loss {first['train_loss']:.4f} -> {last['train_loss']:.4f}")
    step("11 accuracy", last["train_acc"] > 0.9 and last["val_acc"] is not None,
         f"train {last['train_acc']*100:.1f}%, val {last['val_acc']*100:.1f}%")
    step("12 incremental history", len(c.get(f"/training/{sid}/history", params={"since": 140}).json()["history"]) == 10)

    # 6. weights really changed
    p1 = c.get(f"/training/{sid}/parameters").json()
    changed = p0["layers"][0]["weights"] != p1["layers"][0]["weights"]
    step("13 weights updated by training", changed)

    # 7. predictions: points and grid, probabilities in range
    pr = c.post(f"/training/{sid}/predict", json={"points": [[0.9, 0.9], [-0.9, 0.9]]}).json()
    step("14 predict points", pr["probabilities"][0] > 0.5 > pr["probabilities"][1] or pr["probabilities"][0] < 0.5 < pr["probabilities"][1],
         f"P(class1) at (0.9,0.9)={pr['probabilities'][0]:.3f}, at (-0.9,0.9)={pr['probabilities'][1]:.3f}")
    g = c.post(f"/training/{sid}/predict", json={"grid": {"x_min": -1.5, "x_max": 1.5, "y_min": -1.5, "y_max": 1.5, "resolution": 30}}).json()
    step("15 predict grid", len(g["probabilities"]) == 900 and g["resolution"] == 30, "30x30 = 900 values")

    # 8. one iteration, dry run (must not change the model)
    before = c.get(f"/training/{sid}/parameters").json()
    tr = c.get(f"/training/{sid}/iteration-trace", params={"sample": 0}).json()
    after = c.get(f"/training/{sid}/parameters").json()
    step("16 iteration trace is a dry run", before == after and tr["loss"] > 0,
         f"loss {tr['loss']:.4f}, sample {tr['sample_index']}, model unchanged")

    # 9. reset returns to the seeded initial weights
    r = c.post(f"/training/{sid}/reset").json()
    p2 = c.get(f"/training/{sid}/parameters").json()
    step("17 reset", r["status"] == "ready" and r["epoch"] == 0 and p2["layers"][0]["weights"] == p0["layers"][0]["weights"],
         "weights identical to seeded initialisation")

    # 10. errors are reported properly
    step("18 unknown session -> 404", c.get("/training/nope/status").status_code == 404)
    step("19 invalid config -> 422", c.post("/models", json={**body, "config": {**cfg, "learning_rate": -1}}).status_code == 422)

    # 11. cleanup
    step("20 delete session", c.delete(f"/training/{sid}").status_code == 204)

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} steps passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
