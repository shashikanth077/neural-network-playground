"""Independent training sessions that run on background threads."""
from __future__ import annotations

import threading
import time
import uuid
from typing import Optional

import numpy as np

from . import config as settings
from .nn import NeuralNetwork, flatten, make_optimizer, sigmoid, bce_from_logits
from .schemas import ModelConfig


class SessionNotFound(Exception):
    pass


class InvalidState(Exception):
    pass


class TrainingSession:
    """Owns one dataset, one network, one optimizer and one worker thread.

    All reads and writes of parameters / history happen under ``self.lock`` so
    that prediction requests always see a consistent snapshot between updates.
    Pause / resume use an Event that the worker checks before every mini-batch.
    """

    def __init__(self, points: list[list[float]], labels: list[int], config: ModelConfig):
        self.id = uuid.uuid4().hex[:12]
        self.config = config
        self.lock = threading.RLock()
        self.created = self.last_access = time.time()
        X = np.asarray(points, dtype=float)
        y = np.asarray(labels, dtype=int)
        self._split(X, y)
        self.thread: Optional[threading.Thread] = None
        self._run_flag = threading.Event()  # set => allowed to run
        self._stop_flag = threading.Event()
        self._init_model()

    # ------------------------------------------------------------- set-up
    def _split(self, X: np.ndarray, y: np.ndarray) -> None:
        rng = np.random.default_rng(self.config.seed)
        order = rng.permutation(len(y))
        X, y = X[order], y[order]
        n_val = int(round(len(y) * self.config.val_split))
        if self.config.val_split > 0 and n_val < 2:
            raise ValueError("Dataset too small for the chosen validation split; lower it or add points.")
        if len(y) - n_val < 4:
            raise ValueError("Too few training points after the validation split.")
        self.X_train, self.y_train = X[n_val:], y[n_val:]
        self.X_val, self.y_val = (X[:n_val], y[:n_val]) if n_val else (None, None)

    def _init_model(self) -> None:
        cfg = self.config
        self.net = NeuralNetwork(cfg.hidden_layers, cfg.activation, cfg.init, cfg.seed)
        self.opt = make_optimizer(cfg.optimizer, cfg.learning_rate)
        self.shuffle_rng = np.random.default_rng(cfg.seed + 1)
        self.history: list[dict] = []
        self.epoch = 0
        self.status = "ready"
        self.error: Optional[str] = None
        self._elapsed = 0.0
        self._resumed_at: Optional[float] = None

    # ------------------------------------------------------------ control
    def start(self) -> None:
        with self.lock:
            if self.status == "paused":
                return self.resume()
            if self.status != "ready":
                raise InvalidState(f"Cannot start a session that is '{self.status}'. Reset it first.")
            self.status = "running"
            self._resumed_at = time.time()
            self._stop_flag.clear()
            self._run_flag.set()
            self.thread = threading.Thread(target=self._run, name=f"train-{self.id}", daemon=True)
            self.thread.start()

    def pause(self) -> None:
        with self.lock:
            if self.status != "running":
                raise InvalidState(f"Cannot pause a session that is '{self.status}'.")
            self._run_flag.clear()
            self._bank_time()
            self.status = "paused"

    def resume(self) -> None:
        with self.lock:
            if self.status != "paused":
                raise InvalidState(f"Cannot resume a session that is '{self.status}'.")
            self._resumed_at = time.time()
            self.status = "running"
            self._run_flag.set()

    def reset(self) -> None:
        """Stop any worker and return to freshly initialised parameters."""
        self._stop_flag.set()
        self._run_flag.set()  # wake a paused worker so it can exit
        t = self.thread
        if t is not None and t is not threading.current_thread():
            t.join(timeout=5)
        with self.lock:
            self.thread = None
            self._init_model()

    def shutdown(self) -> None:
        self._stop_flag.set()
        self._run_flag.set()

    def _bank_time(self) -> None:
        if self._resumed_at is not None:
            self._elapsed += time.time() - self._resumed_at
            self._resumed_at = None

    def elapsed(self) -> float:
        with self.lock:
            live = time.time() - self._resumed_at if self._resumed_at is not None else 0.0
            return self._elapsed + live

    # ------------------------------------------------------------- worker
    def _run(self) -> None:
        cfg = self.config
        try:
            n = len(self.y_train)
            bs = min(cfg.batch_size, n)
            while True:
                with self.lock:
                    if self.epoch >= cfg.epochs:
                        break
                grad_norms: list[float] = []
                order = self.shuffle_rng.permutation(n)
                for start in range(0, n, bs):
                    self._run_flag.wait()
                    if self._stop_flag.is_set():
                        return
                    idx = order[start : start + bs]
                    with self.lock:
                        loss, dW, db = self.net.gradients(self.X_train[idx], self.y_train[idx])
                        grads = [g for pair in zip(dW, db) for g in pair]
                        self.opt.step(self.net.params, grads)
                        grad_norms.append(float(np.sqrt(sum(float(np.sum(g * g)) for g in grads))))
                with self.lock:
                    if self._stop_flag.is_set():
                        return
                    self._record_epoch(float(np.mean(grad_norms)))
                if cfg.epoch_delay_ms:
                    self._interruptible_sleep(cfg.epoch_delay_ms / 1000.0)
            with self.lock:
                if not self._stop_flag.is_set():
                    self._bank_time()
                    self.status = "completed"
        except Exception as exc:  # surfaced to the UI through /status
            with self.lock:
                self._bank_time()
                self.status = "failed"
                self.error = f"Training failed: {exc}"

    def _interruptible_sleep(self, seconds: float) -> None:
        end = time.time() + seconds
        while time.time() < end and not self._stop_flag.is_set():
            time.sleep(min(0.005, seconds))

    def _record_epoch(self, grad_norm: float) -> None:
        net = self.net
        train_loss = net.loss(self.X_train, self.y_train)
        entry = {
            "epoch": self.epoch + 1,
            "train_loss": train_loss,
            "train_acc": net.accuracy(self.X_train, self.y_train),
            "val_loss": None,
            "val_acc": None,
            "grad_norm": grad_norm,
            "param_norm": net.param_norm(),
        }
        if self.X_val is not None:
            entry["val_loss"] = net.loss(self.X_val, self.y_val)
            entry["val_acc"] = net.accuracy(self.X_val, self.y_val)
        if not all(np.isfinite(v) for v in entry.values() if v is not None) or not np.all(np.isfinite(flatten(net.params))):
            raise FloatingPointError(
                "loss or weights became NaN/Inf (numerical divergence). Try a smaller learning rate."
            )
        self.epoch += 1
        entry["elapsed"] = self._elapsed + (time.time() - self._resumed_at if self._resumed_at else 0.0)
        self.history.append(entry)

    # -------------------------------------------------------------- reads
    def touch(self) -> None:
        self.last_access = time.time()

    def status_dict(self) -> dict:
        with self.lock:
            return {
                "session_id": self.id,
                "status": self.status,
                "epoch": self.epoch,
                "total_epochs": self.config.epochs,
                "elapsed_seconds": self.elapsed(),
                "error": self.error,
                "n_parameters": self.net.n_parameters(),
                "n_train": len(self.y_train),
                "n_val": 0 if self.y_val is None else len(self.y_val),
                "layer_sizes": list(self.net.layer_sizes),
                "config": self.config.model_dump(),
                "latest": dict(self.history[-1]) if self.history else None,
            }

    def history_since(self, since: int = 0) -> list[dict]:
        with self.lock:
            return [dict(h) for h in self.history[since:]]

    def parameters(self) -> dict:
        with self.lock:
            return {
                "session_id": self.id,
                "epoch": self.epoch,
                "layer_sizes": list(self.net.layer_sizes),
                "activation": self.net.activation_name,
                "layers": [
                    {"weights": w.tolist(), "biases": b.reshape(-1).tolist()}
                    for w, b in zip(self.net.W, self.net.b)
                ],
            }

    def predict(self, X: np.ndarray, with_activations: bool = False):
        with self.lock:
            epoch = self.epoch
            logits, cache = self.net.forward(X)
            probs = sigmoid(logits).reshape(-1)
            acts = [a.reshape(-1).tolist() for a in cache["a"]] if with_activations else None
        return epoch, probs, acts

    def trace_iteration(self, sample_index: int) -> dict:
        """Dry-run one training iteration on a single training sample.

        Nothing is modified: the update shown is what the optimizer *would* do.
        """
        with self.lock:
            idx = sample_index % len(self.y_train)
            x = self.X_train[idx : idx + 1]
            y = self.y_train[idx : idx + 1]
            logits, cache = self.net.forward(x)
            dW, db = self.net.backward(y, cache)
            prob = float(sigmoid(logits).reshape(-1)[0])
            loss = bce_from_logits(logits, y)
            layers = [
                {
                    "layer": l + 1,
                    "pre_activation": cache["z"][l].reshape(-1).tolist(),
                    "activation": cache["a"][l + 1].reshape(-1).tolist(),
                    "weight_grad_norm": float(np.linalg.norm(dW[l])),
                    "bias_grad_norm": float(np.linalg.norm(db[l])),
                }
                for l in range(len(self.net.W))
            ]
            w0 = float(self.net.W[0][0, 0])
            g0 = float(dW[0][0, 0])
            lr = self.config.learning_rate
            return {
                "session_id": self.id,
                "epoch": self.epoch,
                "sample_index": idx,
                "input": x.reshape(-1).tolist(),
                "target": int(y[0]),
                "probability": prob,
                "loss": loss,
                "layers": layers,
                "example_weight": {
                    "name": "W[1][0,0]",
                    "value": w0,
                    "gradient": g0,
                    "sgd_update": w0 - lr * g0,
                },
                "optimizer": self.config.optimizer,
                "learning_rate": lr,
                "note": "Single-sample dry run: the optimizer is not applied. "
                "'sgd_update' shows what plain SGD would do to this weight; Adam rescales the step.",
            }


class SessionManager:
    """Thread-safe registry with a TTL / capacity cleanup policy."""

    def __init__(self, ttl: int = settings.SESSION_TTL_SECONDS, max_sessions: int = settings.MAX_SESSIONS):
        self.ttl = ttl
        self.max_sessions = max_sessions
        self._sessions: dict[str, TrainingSession] = {}
        self._lock = threading.Lock()

    def create(self, points, labels, config: ModelConfig) -> TrainingSession:
        session = TrainingSession(points, labels, config)
        with self._lock:
            self._evict_locked()
            self._sessions[session.id] = session
        return session

    def get(self, session_id: str) -> TrainingSession:
        with self._lock:
            session = self._sessions.get(session_id)
        if session is None:
            raise SessionNotFound(f"Session '{session_id}' was not found. It may have expired.")
        session.touch()
        return session

    def delete(self, session_id: str) -> None:
        with self._lock:
            session = self._sessions.pop(session_id, None)
        if session is not None:
            session.shutdown()

    def cleanup(self) -> int:
        now = time.time()
        with self._lock:
            stale = [
                sid for sid, s in self._sessions.items()
                if now - s.last_access > self.ttl and s.status != "running"
            ]
            removed = [self._sessions.pop(sid) for sid in stale]
        for s in removed:
            s.shutdown()
        return len(removed)

    def _evict_locked(self) -> None:
        while len(self._sessions) >= self.max_sessions:
            oldest = min(self._sessions.values(), key=lambda s: s.last_access)
            self._sessions.pop(oldest.id).shutdown()

    def __len__(self) -> int:
        with self._lock:
            return len(self._sessions)

    def shutdown_all(self) -> None:
        with self._lock:
            sessions = list(self._sessions.values())
            self._sessions.clear()
        for s in sessions:
            s.shutdown()
