import type {
  DataPayload,
  CrossValidation,
  DatasetSource,
  DatasetSpec,
  DbStatus,
  Evaluation,
  EpochMetrics,
  GridBounds,
  IterationTrace,
  ModelConfig,
  ModelParameters,
  PredictResponse,
  RunComparison,
  RunDetail,
  RunKind,
  RunList,
  SessionStatus,
  ValidationMethod,
} from "../types";

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "/api";

export class ApiError extends Error {
  status: number;
  /** Machine-readable reason from the server, for example "disabled" when the run database is off. */
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Turn FastAPI's `detail` (string or validation-error list) into one readable sentence. */
export function describeDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const where = Array.isArray(d?.loc) ? d.loc.filter((p: unknown) => p !== "body").join(".") : "";
        const msg = String(d?.msg ?? "invalid value").replace(/^Value error, /, "");
        return where ? `${where}: ${msg}` : msg;
      })
      .join("; ");
  }
  return "Unexpected error";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError("Cannot reach the backend. Make sure the API server is running (see README).", 0);
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    let code: string | undefined;
    try {
      const body = await res.json();
      msg = describeDetail(body.detail);
      if (typeof body.code === "string") code = body.code;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(msg, res.status, code);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const api = {
  health: () => request<{ status: string; active_sessions: number }>("/health"),
  generateDataset: (spec: DatasetSpec) =>
    post<DataPayload & { name: string }>("/datasets/generate", spec),
  createModel: (dataset: DataPayload, config: ModelConfig, source?: DatasetSource) =>
    post<SessionStatus>("/models", { dataset: source ? { ...dataset, source } : dataset, config }),
  start: (sessionId: string) => post<SessionStatus>("/training/start", { session_id: sessionId }),
  pause: (id: string) => post<SessionStatus>(`/training/${id}/pause`),
  resume: (id: string) => post<SessionStatus>(`/training/${id}/resume`),
  reset: (id: string) => post<SessionStatus>(`/training/${id}/reset`),
  remove: (id: string) => request<void>(`/training/${id}`, { method: "DELETE" }),
  status: (id: string) => request<SessionStatus>(`/training/${id}/status`),
  history: (id: string, since = 0) =>
    request<{ history: EpochMetrics[] }>(`/training/${id}/history?since=${since}`),
  parameters: (id: string) => request<ModelParameters>(`/training/${id}/parameters`),
  predictGrid: (id: string, bounds: GridBounds, resolution: number) =>
    post<PredictResponse>(`/training/${id}/predict`, { grid: { ...bounds, resolution } }),
  predictPoint: (id: string, point: [number, number]) =>
    post<PredictResponse>(`/training/${id}/predict`, { points: [point], include_activations: true }),
  evaluation: (id: string, split: "train" | "val", threshold: number) =>
    request<Evaluation>(`/training/${id}/evaluation?split=${split}&threshold=${threshold}`),
  crossValidate: (dataset: DataPayload, config: ModelConfig, method: ValidationMethod, k: number, valFraction: number, source?: DatasetSource) =>
    post<CrossValidation>("/cross-validation", { dataset: source ? { ...dataset, source } : dataset, config, method, k, val_fraction: valFraction }),
  trace: (id: string, sample: number) =>
    request<IterationTrace>(`/training/${id}/iteration-trace?sample=${sample}`),
  // ---- saved runs (experiment database)
  runsStatus: () => request<DbStatus>("/runs/status"),
  listRuns: (opts: { limit?: number; offset?: number; kind?: RunKind | ""; q?: string } = {}) => {
    const p = new URLSearchParams();
    p.set("limit", String(opts.limit ?? 50));
    if (opts.offset) p.set("offset", String(opts.offset));
    if (opts.kind) p.set("kind", opts.kind);
    if (opts.q?.trim()) p.set("q", opts.q.trim());
    return request<RunList>(`/runs?${p.toString()}`);
  },
  getRun: (id: string) => request<RunDetail>(`/runs/${encodeURIComponent(id)}`),
  updateRun: (id: string, patch: { title?: string; notes?: string }) =>
    request<RunDetail>(`/runs/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteRun: (id: string) => request<void>(`/runs/${encodeURIComponent(id)}`, { method: "DELETE" }),
  compareRuns: (ids: string[]) => request<RunComparison>(`/runs/compare?ids=${ids.map(encodeURIComponent).join(",")}`),
};
