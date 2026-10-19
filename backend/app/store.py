"""Experiment storage: finished training runs and cross-validation results in SQLite.

Standard library only. Every call opens its own short-lived connection, so the
store is safe to use from the request threads and the training worker threads
at the same time. Settings are read from the environment on each call
(``DB_PATH``, ``DB_ENABLED``) unless explicit values are given to ``RunStore``.
"""
from __future__ import annotations

import json
import logging
import os
import sqlite3
import threading
import time
import uuid
from pathlib import Path
from typing import Any, Optional

log = logging.getLogger("ailab.store")

DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "data" / "ailab.db"
SCHEMA_VERSION = 1
MAX_STORED_POINTS = 2000
KINDS = ("playground", "cross-validation")

_MIGRATIONS: dict[int, str] = {
    1: """
    CREATE TABLE runs (
        id TEXT PRIMARY KEY,
        created_at REAL NOT NULL,
        finished_at REAL,
        kind TEXT NOT NULL,
        status TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        config_json TEXT NOT NULL DEFAULT '{}',
        dataset_json TEXT NOT NULL DEFAULT '{}',
        metrics_json TEXT NOT NULL DEFAULT '{}',
        history_json TEXT NOT NULL DEFAULT '[]',
        notes TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX idx_runs_created ON runs (created_at DESC);
    """,
}


class StoreError(Exception):
    """The database cannot be used (disabled, unreachable, corrupted)."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


class RunNotFound(Exception):
    pass


def _env_enabled() -> bool:
    return os.getenv("DB_ENABLED", "true").strip().lower() not in ("0", "false", "no", "off")


def summarize_dataset(points: list, labels: list, source: Optional[dict] = None) -> dict:
    """Small description of a dataset; points are kept only for custom data and at most 2000 of them."""
    source = dict(source or {})
    n = len(labels)
    n1 = int(sum(1 for l in labels if l == 1))
    out: dict[str, Any] = {
        "name": source.get("name") or "custom",
        "n_samples": n,
        "noise": source.get("noise"),
        "seed": source.get("seed"),
        "class_counts": [n - n1, n1],
    }
    if points:
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        out["bounds"] = [min(xs), max(xs), min(ys), max(ys)]
    out["summary"] = f"{n} points, {n - n1} in class 0 and {n1} in class 1"
    if out["name"] == "custom" and 0 < len(points) <= MAX_STORED_POINTS:
        out["points"] = points
        out["labels"] = labels
    return out


def default_title(dataset: dict, cfg: dict, prefix: str = "") -> str:
    layers = "-".join(str(n) for n in cfg.get("hidden_layers", [])) or "none"
    head = f"{prefix} " if prefix else ""
    return f"{head}{dataset.get('name', 'custom')} · {cfg.get('optimizer')} {cfg.get('activation')} [{layers}]".strip()


def _thin(items: list, n: int) -> list:
    if len(items) <= n:
        return items
    step = (len(items) - 1) / (n - 1)
    return [items[round(i * step)] for i in range(n)]


class RunStore:
    def __init__(self, path: Optional[str | Path] = None, enabled: Optional[bool] = None):
        self._path = path
        self._enabled = enabled
        self._init_lock = threading.Lock()
        self._ready: set[str] = set()

    # ---------------------------------------------------------- settings
    @property
    def enabled(self) -> bool:
        return _env_enabled() if self._enabled is None else self._enabled

    @property
    def path(self) -> Path:
        raw = self._path if self._path is not None else os.getenv("DB_PATH") or DEFAULT_DB_PATH
        return Path(raw)

    # -------------------------------------------------------- connection
    def _connect(self) -> sqlite3.Connection:
        if not self.enabled:
            raise StoreError("disabled", "The experiment database is switched off (DB_ENABLED=false).")
        path = self.path
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            conn = sqlite3.connect(str(path), timeout=10)
            conn.row_factory = sqlite3.Row
            key = str(path)
            if key not in self._ready:
                with self._init_lock:
                    if key not in self._ready:
                        self._migrate(conn)
                        self._ready.add(key)
            return conn
        except (OSError, sqlite3.Error) as exc:
            raise StoreError("unavailable", f"The experiment database cannot be opened: {exc}") from exc

    @staticmethod
    def _migrate(conn: sqlite3.Connection) -> None:
        try:
            conn.execute("PRAGMA journal_mode=WAL")
        except sqlite3.Error:
            pass
        conn.execute("CREATE TABLE IF NOT EXISTS migrations (version INTEGER PRIMARY KEY, applied_at REAL NOT NULL)")
        done = conn.execute("SELECT COALESCE(MAX(version), 0) FROM migrations").fetchone()[0]
        for version in sorted(v for v in _MIGRATIONS if v > done):
            with conn:
                for stmt in _MIGRATIONS[version].split(";"):
                    if stmt.strip():
                        conn.execute(stmt)
                conn.execute("INSERT INTO migrations (version, applied_at) VALUES (?, ?)", (version, time.time()))

    def _run(self, fn):
        conn = self._connect()
        try:
            with conn:
                return fn(conn)
        except sqlite3.Error as exc:
            raise StoreError("unavailable", f"Database error: {exc}") from exc
        finally:
            conn.close()

    # ------------------------------------------------------------- reads
    def status(self) -> dict:
        if not self.enabled:
            return {"enabled": False, "available": False, "count": 0, "schema_version": None, "error": None}
        try:
            count = self._run(lambda c: c.execute("SELECT COUNT(*) FROM runs").fetchone()[0])
            return {"enabled": True, "available": True, "count": count, "schema_version": SCHEMA_VERSION, "error": None}
        except StoreError as exc:
            return {"enabled": True, "available": False, "count": 0, "schema_version": None, "error": exc.message}

    @staticmethod
    def _row(row: sqlite3.Row, full: bool) -> dict:
        def load(text: str, default):
            try:
                return json.loads(text)
            except (TypeError, ValueError):
                return default

        dataset = load(row["dataset_json"], {})
        out = {
            "id": row["id"],
            "created_at": row["created_at"],
            "finished_at": row["finished_at"],
            "kind": row["kind"],
            "status": row["status"],
            "title": row["title"],
            "notes": row["notes"],
            "config": load(row["config_json"], {}),
            "dataset": dataset if full else {k: v for k, v in dataset.items() if k not in ("points", "labels")},
            "metrics": load(row["metrics_json"], {}),
        }
        history = load(row["history_json"], [])
        if full:
            out["history"] = history
        else:
            out["spark"] = [round(h["train_loss"], 5) for h in _thin(history, 40) if h.get("train_loss") is not None]
        return out

    def list(self, limit: int = 50, offset: int = 0, kind: Optional[str] = None, q: Optional[str] = None) -> dict:
        where: list[str] = []
        args: list[Any] = []
        if kind:
            where.append("kind = ?")
            args.append(kind)
        if q and q.strip():
            like = f"%{q.strip().lower()}%"
            where.append(
                "(lower(title) LIKE ? OR lower(notes) LIKE ? OR lower(config_json) LIKE ? OR lower(dataset_json) LIKE ?)"
            )
            args += [like] * 4
        clause = ("WHERE " + " AND ".join(where)) if where else ""

        def go(c):
            total = c.execute(f"SELECT COUNT(*) FROM runs {clause}", args).fetchone()[0]
            rows = c.execute(
                f"SELECT * FROM runs {clause} ORDER BY created_at DESC, id LIMIT ? OFFSET ?", [*args, limit, offset]
            ).fetchall()
            return total, [self._row(r, full=False) for r in rows]

        total, items = self._run(go)
        return {"total": total, "items": items}

    def get(self, run_id: str) -> dict:
        row = self._run(lambda c: c.execute("SELECT * FROM runs WHERE id = ?", (run_id,)).fetchone())
        if row is None:
            raise RunNotFound(f"Run '{run_id}' was not found.")
        return self._row(row, full=True)

    # ------------------------------------------------------------ writes
    def save(
        self,
        *,
        kind: str,
        status: str,
        config: dict,
        dataset: dict,
        metrics: dict,
        history: Optional[list] = None,
        title: str = "",
        notes: str = "",
        created_at: Optional[float] = None,
        run_id: Optional[str] = None,
    ) -> str:
        if kind not in KINDS:
            raise ValueError(f"kind must be one of {KINDS}")
        rid = run_id or uuid.uuid4().hex[:12]
        now = time.time()
        row = (
            rid, created_at or now, now, kind, status, title[:200], json.dumps(config), json.dumps(dataset),
            json.dumps(metrics), json.dumps(history or []), notes[:5000],
        )
        self._run(
            lambda c: c.execute(
                "INSERT OR REPLACE INTO runs (id, created_at, finished_at, kind, status, title, config_json,"
                " dataset_json, metrics_json, history_json, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                row,
            )
        )
        return rid

    def update(self, run_id: str, title: Optional[str] = None, notes: Optional[str] = None) -> dict:
        sets: list[str] = []
        args: list[Any] = []
        if title is not None:
            sets.append("title = ?")
            args.append(title)
        if notes is not None:
            sets.append("notes = ?")
            args.append(notes)
        if sets:
            n = self._run(lambda c: c.execute(f"UPDATE runs SET {', '.join(sets)} WHERE id = ?", [*args, run_id]).rowcount)
            if n == 0:
                raise RunNotFound(f"Run '{run_id}' was not found.")
        return self.get(run_id)

    def delete(self, run_id: str) -> None:
        n = self._run(lambda c: c.execute("DELETE FROM runs WHERE id = ?", (run_id,)).rowcount)
        if n == 0:
            raise RunNotFound(f"Run '{run_id}' was not found.")

    # --------------------------------------------------------- recording
    def record_session(self, session) -> Optional[str]:
        """Save a finished training session. Never raises: storage problems are logged."""
        try:
            if not self.enabled:
                return None
            with session.lock:
                cfg = session.config.model_dump()
                history = [dict(h) for h in session.history]
                last = history[-1] if history else {}
                metrics = {
                    "final_train_loss": last.get("train_loss"),
                    "final_train_acc": last.get("train_acc"),
                    "final_val_loss": last.get("val_loss"),
                    "final_val_acc": last.get("val_acc"),
                    "best_epoch": session._best_epoch(),
                    "stopped_early": bool(session.stopped_early),
                    "n_parameters": session.net.n_parameters(),
                    "epochs_run": len(history),
                    "elapsed": session.elapsed(),
                    "error": session.error,
                }
                status = session.status
                created = session.created
                source = dict(session.source or {})
                points, labels = session.dataset_points, session.dataset_labels
            dataset = summarize_dataset(points, labels, source)
            return self.save(
                kind="playground", status=status, config=cfg, dataset=dataset, metrics=metrics, history=history,
                title=default_title(dataset, cfg), created_at=created,
            )
        except Exception as exc:  # noqa: BLE001 - storage must never break training
            log.warning("could not save training run: %s", exc)
            return None

    def record_cv(self, points, labels, source, cfg: dict, result: dict, elapsed: float) -> Optional[str]:
        """Save a cross-validation result. Never raises."""
        try:
            if not self.enabled:
                return None
            dataset = summarize_dataset(points, labels, source)
            folds = result.get("folds", [])
            config = dict(cfg, cv_method=result.get("method"), cv_k=len(folds))
            metrics = {
                k: result.get(k)
                for k in (
                    "method", "mean_val_loss", "std_val_loss", "mean_val_accuracy", "std_val_accuracy",
                    "mean_val_f1", "n_samples",
                )
            }
            metrics["n_folds"] = len(folds)
            metrics["elapsed"] = elapsed
            metrics["folds"] = [
                {k: f[k] for k in ("fold", "n_train", "n_val", "val_loss", "val_accuracy", "val_f1")} for f in folds
            ]
            return self.save(
                kind="cross-validation", status="completed", config=config, dataset=dataset, metrics=metrics,
                title=default_title(dataset, cfg, prefix=f"CV {result.get('method')}"), created_at=time.time() - elapsed,
            )
        except Exception as exc:  # noqa: BLE001
            log.warning("could not save cross-validation run: %s", exc)
            return None


store = RunStore()


def align_histories(runs: list[dict]) -> dict:
    """Align per-epoch series of several runs on a common epoch axis (shorter runs padded with null)."""
    n = max((len(r.get("history", [])) for r in runs), default=0)
    keys = ("train_loss", "val_loss", "train_acc", "val_acc")
    rows = []
    for e in range(n):
        row: dict[str, Any] = {"epoch": e + 1}
        for r in runs:
            h = r.get("history", [])
            for k in keys:
                row[f"{r['id']}.{k}"] = h[e].get(k) if e < len(h) else None
        rows.append(row)
    return {"epochs": n, "rows": rows}


def config_diff(runs: list[dict]) -> list[str]:
    keys: list[str] = []
    for r in runs:
        for k in r["config"]:
            if k not in keys:
                keys.append(k)
    return [k for k in keys if len({json.dumps(r["config"].get(k), sort_keys=True) for r in runs}) > 1]
