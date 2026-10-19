"""FastAPI application: REST API for the Neural Network Playground."""
from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

import numpy as np
from typing import Literal

from fastapi import APIRouter, FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import config as settings
from .cv import cross_validate
from .datasets import DATASET_INFO, generate_dataset
from .schemas import (
    CreateModelRequest,
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

manager = SessionManager()


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


@api.post("/models", response_model=SessionStatus, status_code=201, tags=["models"])
def create_model(req: CreateModelRequest):
    """Create a session (dataset split + freshly initialised network). Training has not started."""
    session = manager.create(req.dataset.points, req.dataset.labels, req.config)
    return session.status_dict()


@api.post("/training/start", response_model=SessionStatus, tags=["training"])
def start_training(req: StartRequest):
    """Start training an existing ``session_id`` or create a session from ``dataset`` + ``config``."""
    if req.session_id:
        session = manager.get(req.session_id)
    else:
        assert req.dataset is not None
        from .schemas import ModelConfig

        session = manager.create(req.dataset.points, req.dataset.labels, req.config or ModelConfig())
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
    return cross_validate(X, y, req.config, req.method, req.k, req.val_fraction)


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
