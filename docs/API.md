# API reference

Base path `/api`. Live OpenAPI docs: `/docs`. Errors are `{"detail": "..."}`: **404** unknown/expired session, **409** invalid state transition, **422** validation.

| Method & path | Purpose |
|---|---|
| `GET /health` | `{status, active_sessions}` |
| `GET /datasets` | Dataset catalogue |
| `POST /datasets/generate` | `{name, n_samples, noise, seed}` → `{points, labels}` |
| `POST /models` | `{dataset:{points,labels}, config}` → session status (`ready`), 201 |
| `POST /training/start` | `{session_id}` or `{dataset, config}` → starts the worker thread |
| `POST /training/{id}/pause` · `/resume` · `/reset` | State transitions (reset re-initialises weights from the seed) |
| `DELETE /training/{id}` | Remove a session |
| `GET /training/{id}/status` | status, epoch, elapsed, latest metrics, error, layer sizes, config |
| `GET /training/{id}/history?since=N` | Per-epoch metrics after the first N epochs |
| `GET /training/{id}/parameters` | Weights `[n_in][n_out]` and biases per layer |
| `POST /training/{id}/predict` | `{points}` or `{grid:{x_min,x_max,y_min,y_max,resolution}}`, optional `include_activations` (single point) |
| `GET /training/{id}/iteration-trace?sample=i` | Dry-run of one iteration (nothing modified) |

Status values: `ready → running ⇄ paused → completed | failed`.

`config`: `hidden_layers` (≤5, each 1–32), `activation` (relu|sigmoid|tanh), `init` (xavier|he|small_normal|zeros), `optimizer` (sgd|adam), `learning_rate` (0,10], `batch_size` 1–512, `epochs` 1–2000, `val_split` 0–0.5, `seed`, `epoch_delay_ms` (pacing only; does not affect results).

Sessions idle longer than `SESSION_TTL_SECONDS` (and not running) are removed by a background janitor; creating beyond `MAX_SESSIONS` evicts the least recently used.
