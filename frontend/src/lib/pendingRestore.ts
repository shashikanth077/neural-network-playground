import type { DatasetSpec, ModelConfig } from "../types";

/** What "Open in Playground" hands over: the settings and the data of a saved run. */
export interface RestoreRequest {
  config: Partial<ModelConfig>;
  dataset: DatasetSpec & { points?: number[][]; labels?: number[] };
}

let pending: RestoreRequest | null = null;

/** The My runs page leaves a request here before navigating; the Playground takes it once when it mounts. */
export const setPendingRestore = (r: RestoreRequest | null) => {
  pending = r;
};
export const takePendingRestore = (): RestoreRequest | null => {
  const r = pending;
  pending = null;
  return r;
};
