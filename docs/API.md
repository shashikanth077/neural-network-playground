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
| `GET /training/{id}/evaluation?split=val&threshold=0.5` | Confusion matrix, accuracy/precision/recall/F1, ROC curve and AUC for the current weights (`split` = `train` or `val`) |
| `POST /cross-validation` | `{dataset, config, method, k, val_fraction}` → per-fold losses, accuracy, F1 and their mean ± std. Methods: `holdout`, `kfold`, `stratified_kfold`, `shuffle_split`, `time_series`, `leave_one_out`. Total work (splits × epochs × samples) is capped, otherwise 422 |

### Saved runs (experiment database)

Finished training sessions (`completed`, `failed`, early-stopped) and cross-validation results are stored automatically in SQLite (`DB_PATH`, default `backend/data/ailab.db`; `DB_ENABLED=false` switches everything off). A storage error is logged and never affects training. Sessions that are reset or deleted before finishing are not saved. To record where a dataset came from, send the optional `dataset.source = {name, n_samples, noise, seed}`; points are stored only for `custom` datasets (at most 2000). `status` reports `run_id` once the run is saved, and the cross-validation response carries `run_id`.

| Method & path | Purpose |
|---|---|
| `GET /runs/status` | `{enabled, available, count, schema_version, error}` |
| `GET /runs?limit=50&offset=0&kind=&q=` | `{total, items}`, newest first. `kind` = `playground` or `cross-validation`; `q` matches title, notes, settings and dataset. Items hold config, dataset summary, metrics and a thinned `spark` loss curve (no full history) |
| `GET /runs/{id}` | One run including `history` (per-epoch metrics) |
| `PATCH /runs/{id}` | `{title?, notes?}` (title 1-200 chars, notes up to 5000) |
| `DELETE /runs/{id}` | 204 |
| `GET /runs/compare?ids=a,b[,c,d]` | 2-4 runs: `runs`, `epochs`, `rows` (one row per epoch, keys `"<id>.train_loss"`, `.val_loss`, `.train_acc`, `.val_acc`, null where a run is shorter) and `differing` (config keys whose values differ) |

Errors: 404 unknown run, 422 invalid input (for example fewer than 2 or more than 4 ids), **503** with `{"detail", "code"}` where `code` is `disabled` or `unavailable` (directory not writable, corrupted file).

Status values: `ready → running ⇄ paused → completed | failed`.

`config`:

| Field | Values |
|---|---|
| `hidden_layers` | ≤ 5 layers, each 1–32 neurons |
| `activation` | `relu`, `leaky_relu`, `elu`, `selu`, `sigmoid`, `tanh`, `softplus`, `silu` |
| `init` | `xavier`, `he`, `small_normal`, `zeros` |
| `optimizer` | `sgd`, `momentum`, `nesterov`, `adagrad`, `rmsprop`, `adadelta`, `adam`, `nadam` |
| `loss` | `bce`, `mse`, `hinge` |
| `learning_rate` | (0, 10] |
| `l1`, `l2` | 0–1, penalty on weights only (not biases) |
| `dropout` | 0–0.9 (inverted dropout on hidden layers, training only) |
| `batch_norm` | bool; needs `batch_size` ≥ 2; running statistics are used for prediction |
| `early_stopping`, `patience`, `restore_best` | stops after `patience` epochs without a better validation loss; needs `val_split` > 0 |
| `batch_size` | 1–512 (1 = SGD, n = batch GD) |
| `epochs` | 1–2000 |
| `val_split` | 0–0.5 |
| `seed`, `epoch_delay_ms` | reproducibility; pacing only |

`status` also reports `n_non_trainable`, `best_epoch`, `stopped_early` and `restored_best`; `parameters` includes `gamma`/`beta` for hidden layers when batch norm is on.

Sessions idle longer than `SESSION_TTL_SECONDS` (and not running) are removed by a background janitor; creating beyond `MAX_SESSIONS` evicts the least recently used.
