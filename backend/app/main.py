"""FastAPI application: REST API for the Neural Network Playground."""
from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

import numpy as np
from typing import Literal

import time

from fastapi import APIRouter, FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import config as settings
from .cv import cross_validate
from .datasets import DATASET_INFO, generate_dataset
from .schemas import (
    CreateModelRequest,
    DbStatus,
    RunComparison,
    RunDetail,
    RunList,
    RunUpdate,
    CrossValidationRequest,
    CrossValidationResponse,
    DatasetInfo,
    DatasetRequest,
    DatasetResponse,
    EvaluationResponse,
    HistoryResponse,
    IterationTrace,
    ParametersResponse,
    PredictRequest,
    PredictResponse,
    SessionStatus,
    StartRequest,
)
from .sessions import InvalidState, SessionManager, SessionNotFound
from .store import RunNotFound, StoreError, align_histories, config_diff, store

manager = SessionManager(on_finish=store.record_session)


async def _janitor():
    while True:
        await asyncio.sleep(settings.CLEANUP_INTERVAL_SECONDS)
        manager.cleanup()


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(_janitor())
    yield
    task.cancel()
    manager.shutdown_all()


app = FastAPI(
    title="Neural Network Playground API",
    version="1.0.0",
    description="Train small NumPy neural networks in independent, pausable sessions and inspect them live.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(SessionNotFound)
async def _not_found(_: Request, exc: SessionNotFound):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(InvalidState)
async def _conflict(_: Request, exc: InvalidState):
    return JSONResponse(status_code=409, content={"detail": str(exc)})


@app.exception_handler(RunNotFound)
async def _run_not_found(_: Request, exc: RunNotFound):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(StoreError)
async def _store_down(_: Request, exc: StoreError):
    return JSONResponse(status_code=503, content={"detail": exc.message, "code": exc.code})


@app.exception_handler(ValueError)
async def _bad_value(_: Request, exc: ValueError):
    return JSONResponse(status_code=422, content={"detail": str(exc)})


api = APIRouter(prefix="/api")


@api.get("/health", tags=["system"])
def health():
    return {"status": "ok", "active_sessions": len(manager)}


@api.get("/datasets", response_model=list[DatasetInfo], tags=["datasets"])
def list_datasets():
    return [
        DatasetInfo(name=k, label=v["label"], description=v["description"], generated=k != "custom")
        for k, v in DATASET_INFO.items()
    ]


@api.post("/datasets/generate", response_model=DatasetResponse, tags=["datasets"])
def generate(req: DatasetRequest):
    x, y = generate_dataset(req.name, req.n_samples, req.noise, req.seed)
    return DatasetResponse(name=req.name, points=x.tolist(), labels=y.tolist())


def _source(dataset) -> dict | None:
    return dataset.source.model_dump() if dataset.source else None


@api.post("/models", response_model=SessionStatus, status_code=201, tags=["models"])
def create_model(req: CreateModelRequest):
    """Create a session (dataset split + freshly initialised network). Training has not started."""
    session = manager.create(req.dataset.points, req.dataset.labels, req.config, _source(req.dataset))
    return session.status_dict()


@api.post("/training/start", response_model=SessionStatus, tags=["training"])
def start_training(req: StartRequest):
    """Start training an existing ``session_id`` or create a session from ``dataset`` + ``config``."""
    if req.session_id:
        session = manager.get(req.session_id)
    else:
        assert req.dataset is not None
        from .schemas import ModelConfig

        session = manager.create(
            req.dataset.points, req.dataset.labels, req.config or ModelConfig(), _source(req.dataset)
        )
    session.start()
    return session.status_dict()


@api.post("/training/{session_id}/pause", response_model=SessionStatus, tags=["training"])
def pause(session_id: str):
    s = manager.get(session_id)
    s.pause()
    return s.status_dict()


@api.post("/training/{session_id}/resume", response_model=SessionStatus, tags=["training"])
def resume(session_id: str):
    s = manager.get(session_id)
    s.resume()
    return s.status_dict()


@api.post("/training/{session_id}/reset", response_model=SessionStatus, tags=["training"])
def reset(session_id: str):
    s = manager.get(session_id)
    s.reset()
    return s.status_dict()


@api.delete("/training/{session_id}", status_code=204, tags=["training"])
def delete_session(session_id: str):
    manager.delete(session_id)


@api.get("/training/{session_id}/status", response_model=SessionStatus, tags=["training"])
def status(session_id: str):
    return manager.get(session_id).status_dict()


@api.get("/training/{session_id}/history", response_model=HistoryResponse, tags=["training"])
def history(session_id: str, since: int = 0):
    """Per-epoch metrics. ``since`` skips the first N epochs for incremental polling."""
    s = manager.get(session_id)
    return HistoryResponse(session_id=s.id, history=s.history_since(max(0, since)))


@api.get("/training/{session_id}/parameters", response_model=ParametersResponse, tags=["training"])
def parameters(session_id: str):
    return manager.get(session_id).parameters()


@api.get("/training/{session_id}/iteration-trace", response_model=IterationTrace, tags=["training"])
def iteration_trace(session_id: str, sample: int = 0):
    """Dry-run one training iteration on a single sample and return every intermediate value."""
    return manager.get(session_id).trace_iteration(max(0, sample))


@api.get("/training/{session_id}/evaluation", response_model=EvaluationResponse, tags=["training"])
def evaluation(session_id: str, split: Literal["train", "val"] = "val", threshold: float = Query(0.5, ge=0.0, le=1.0)):
    """Confusion matrix, accuracy / precision / recall / F1, ROC curve and AUC for the current weights."""
    return manager.get(session_id).evaluation(split, threshold)


@api.post("/cross-validation", response_model=CrossValidationResponse, tags=["models"])
def run_cross_validation(req: CrossValidationRequest):
    """Train a fresh network per split (hold-out, k-fold, stratified, shuffle, time-series, leave-one-out)."""
    X = np.asarray(req.dataset.points, dtype=float)
    y = np.asarray(req.dataset.labels, dtype=int)
    t0 = time.time()
    result = cross_validate(X, y, req.config, req.method, req.k, req.val_fraction)
    result["run_id"] = store.record_cv(
        req.dataset.points, req.dataset.labels, _source(req.dataset), req.config.model_dump(), result, time.time() - t0
    )
    return result


# ---------------------------------------------------------------- saved runs
@api.get("/runs/status", response_model=DbStatus, tags=["runs"])
def runs_status():
    """Whether the experiment database is enabled and reachable."""
    return store.status()


@api.get("/runs", response_model=RunList, tags=["runs"])
def list_runs(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    kind: Literal["playground", "cross-validation"] | None = None,
    q: str | None = Query(None, max_length=100),
):
    """Saved runs, newest first. ``q`` matches title, notes, settings and dataset text."""
    return store.list(limit, offset, kind, q)


@api.get("/runs/compare", response_model=RunComparison, tags=["runs"])
def compare_runs(ids: str = Query(..., description="Comma-separated run ids, 2 to 4.")):
    """Per-epoch histories of 2-4 runs on one epoch axis, plus the settings that differ."""
    wanted = [i.strip() for i in ids.split(",") if i.strip()]
    if len(set(wanted)) != len(wanted):
        raise ValueError("Each run id may appear only once.")
    if not 2 <= len(wanted) <= 4:
        raise ValueError("Compare between 2 and 4 runs.")
    runs = [store.get(i) for i in wanted]
    return {**align_histories(runs), "runs": runs, "differing": config_diff(runs)}


@api.get("/runs/{run_id}", response_model=RunDetail, tags=["runs"])
def get_run(run_id: str):
    return store.get(run_id)


@api.patch("/runs/{run_id}", response_model=RunDetail, tags=["runs"])
def update_run(run_id: str, req: RunUpdate):
    return store.update(run_id, req.title.strip() if req.title is not None else None, req.notes)


@api.delete("/runs/{run_id}", status_code=204, tags=["runs"])
def delete_run(run_id: str):
    store.delete(run_id)


@api.post("/training/{session_id}/predict", response_model=PredictResponse, tags=["training"])
def predict(session_id: str, req: PredictRequest):
    s = manager.get(session_id)
    resolution = None
    if req.grid is not None:
        g = req.grid
        if not (g.x_max > g.x_min and g.y_max > g.y_min):
            raise ValueError("grid max values must exceed min values.")
        xs = np.linspace(g.x_min, g.x_max, g.resolution)
        ys = np.linspace(g.y_min, g.y_max, g.resolution)
        gx, gy = np.meshgrid(xs, ys)  # rows = y, columns = x
        X = np.stack([gx.reshape(-1), gy.reshape(-1)], axis=1)
        resolution = g.resolution
    else:
        assert req.points is not None
        X = np.asarray(req.points, dtype=float).reshape(-1, 2)
    epoch, probs, acts = s.predict(X, req.include_activations)
    return PredictResponse(
        session_id=s.id, epoch=epoch, probabilities=probs.tolist(), resolution=resolution, activations=acts
    )


app.include_router(api)
