import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { DEFAULT_CONFIG, DEFAULT_DATASET, type Preset, type PresetVariant } from "../lib/presets";
import type { RestoreRequest } from "../lib/pendingRestore";
import { hasErrors, validateConfig } from "../lib/validation";
import type {
  DataPayload,
  DatasetSpec,
  EpochMetrics,
  GridPrediction,
  ModelConfig,
  ModelParameters,
  PinnedRun,
  SessionStatus,
} from "../types";

export interface View {
  cx: number;
  cy: number;
  half: number;
}
export const DEFAULT_VIEW: View = { cx: 0, cy: 0, half: 1.6 };
const GRID_RESOLUTION = 56;
const POLL_MS = 250;

const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * All playground state in one place. Components stay presentational.
 * Everything shown (history, parameters, boundary, activations) is fetched from the
 * backend session; nothing is simulated on the client.
 */
export function usePlayground() {
  const [datasetSpec, setDatasetSpecState] = useState<DatasetSpec>(DEFAULT_DATASET);
  const [data, setData] = useState<DataPayload | null>(null);
  const [config, setConfigState] = useState<ModelConfig>(DEFAULT_CONFIG);
  const [session, setSession] = useState<SessionStatus | null>(null);
  const [history, setHistory] = useState<EpochMetrics[]>([]);
  const [params, setParams] = useState<ModelParameters | null>(null);
  const [grid, setGrid] = useState<GridPrediction | null>(null);
  const [probe, setProbe] = useState<[number, number]>([0, 0]);
  const [activations, setActivations] = useState<number[][] | null>(null);
  const [view, setViewState] = useState<View>(DEFAULT_VIEW);
  const [pinned, setPinned] = useState<PinnedRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backendUp, setBackendUp] = useState<boolean | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activePreset, setActivePreset] = useState<{ id: string; variant?: string } | null>(null);

  const sessionIdRef = useRef<string | null>(null);
  const token = useRef(0); // bumps whenever the session is replaced or reset, invalidating in-flight fetches
  const histLen = useRef(0);
  const lastEpoch = useRef(-1);
  const busy = useRef(false);
  const gridSeq = useRef(0);
  const viewRef = useRef(view);
  viewRef.current = view;
  const historyRef = useRef(history);
  historyRef.current = history;

  const nSamples = data?.labels.length ?? 0;
  const configErrors = useMemo(() => validateConfig(config, nSamples), [config, nSamples]);
  const status = session?.status ?? null;
  const locked = status === "running" || status === "paused";

  // ----------------------------------------------------------- backend probe
  const checkBackend = useCallback(async () => {
    try {
      await api.health();
      setBackendUp(true);
    } catch (e) {
      setBackendUp(false);
      setError(messageOf(e));
    }
  }, []);
  useEffect(() => {
    void checkBackend();
  }, [checkBackend]);

  // ------------------------------------------------------------ dataset load
  useEffect(() => {
    if (datasetSpec.name === "custom") return;
    let cancelled = false;
    setDataLoading(true);
    const t = setTimeout(async () => {
      try {
        const d = await api.generateDataset(datasetSpec);
        if (!cancelled) setData({ points: d.points, labels: d.labels });
      } catch (e) {
        if (!cancelled) setError(messageOf(e));
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [datasetSpec]);

  // -------------------------------------------------------------- fetch grid
  const fetchGrid = useCallback(async (id: string) => {
    const seq = ++gridSeq.current;
    const v = viewRef.current;
    const bounds = { x_min: v.cx - v.half, x_max: v.cx + v.half, y_min: v.cy - v.half, y_max: v.cy + v.half };
    try {
      const r = await api.predictGrid(id, bounds, GRID_RESOLUTION);
      if (seq === gridSeq.current && id === sessionIdRef.current)
        setGrid({ ...bounds, resolution: GRID_RESOLUTION, probabilities: r.probabilities, epoch: r.epoch });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return;
      setError(messageOf(e));
    }
  }, []);

  // ------------------------------------------------------------------ refresh
  const refresh = useCallback(
    async (id: string, force = false) => {
      if (busy.current && !force) return;
      busy.current = true;
      const my = token.current;
      try {
        const st = await api.status(id);
        if (my !== token.current) return;
        setSession(st);
        if (st.epoch !== lastEpoch.current || force) {
          lastEpoch.current = st.epoch;
          const [h, p] = await Promise.all([api.history(id, histLen.current), api.parameters(id)]);
          if (my !== token.current) return;
          if (h.history.length) {
            histLen.current += h.history.length;
            setHistory((prev) => prev.concat(h.history));
          }
          setParams(p);
          void fetchGrid(id);
        }
        if (st.status === "failed" && st.error) setError(st.error);
      } catch (e) {
        if (my === token.current && !(e instanceof ApiError && e.status === 404)) setError(messageOf(e));
      } finally {
        busy.current = false;
      }
    },
    [fetchGrid],
  );

  // ------------------------------------------------- session (re)creation
  useEffect(() => {
    const old = sessionIdRef.current;
    const ready = data && (datasetSpec.name !== "custom" || data.labels.length >= 6) && !hasErrors(configErrors);
    if (locked) return; // never replace a run that is in progress; the user must reset first
    if (!ready) {
      if (old) {
        sessionIdRef.current = null;
        token.current++;
        void api.remove(old).catch(() => undefined);
        setSession(null);
        setParams(null);
        setGrid(null);
        setHistory([]);
        histLen.current = 0;
        lastEpoch.current = -1;
      }
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setCreating(true);
      try {
        if (old) void api.remove(old).catch(() => undefined);
        token.current++;
        histLen.current = 0;
        lastEpoch.current = -1;
        setHistory([]);
        const source = {
          name: datasetSpec.name,
          n_samples: data!.labels.length,
          ...(datasetSpec.name === "custom" ? {} : { noise: datasetSpec.noise, seed: datasetSpec.seed }),
        };
        const st = await api.createModel(data!, config, source);
        if (cancelled) {
          void api.remove(st.session_id).catch(() => undefined);
          return;
        }
        sessionIdRef.current = st.session_id;
        setSession(st);
        setBackendUp(true);
        setError(null);
        await refresh(st.session_id, true);
      } catch (e) {
        if (!cancelled) {
          sessionIdRef.current = null;
          setSession(null);
          setError(messageOf(e));
        }
      } finally {
        if (!cancelled) setCreating(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // `locked` is intentionally omitted: it must not itself trigger a rebuild.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, config, datasetSpec.name, refresh]);

  useEffect(
    () => () => {
      const id = sessionIdRef.current;
      if (id) void api.remove(id).catch(() => undefined);
    },
    [],
  );

  // ------------------------------------------------------------------ polling
  useEffect(() => {
    if (status !== "running" || !session) return;
    const id = session.session_id;
    const timer = setInterval(() => void refresh(id), POLL_MS);
    return () => clearInterval(timer);
  }, [status, session?.session_id, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  // boundary follows pan / zoom
  useEffect(() => {
    const id = sessionIdRef.current;
    if (!id) return;
    const t = setTimeout(() => void fetchGrid(id), 80);
    return () => clearTimeout(t);
  }, [view, fetchGrid]);

  // neuron activations for the probe point
  useEffect(() => {
    const id = session?.session_id;
    if (!id) {
      setActivations(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const r = await api.predictPoint(id, probe);
        if (!cancelled && id === sessionIdRef.current) setActivations(r.activations);
      } catch {
        /* the session may have just been replaced */
      }
    }, 100);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [probe, session?.session_id, params?.epoch]);

  // ------------------------------------------------------------------ actions
  const guarded = useCallback(async (fn: () => Promise<void>) => {
    try {
      setError(null);
      await fn();
    } catch (e) {
      setError(messageOf(e));
    }
  }, []);

  const resetSession = useCallback(async () => {
    const id = sessionIdRef.current;
    if (!id) return;
    token.current++;
    histLen.current = 0;
    lastEpoch.current = -1;
    setHistory([]);
    const st = await api.reset(id);
    setSession(st);
    await refresh(id, true);
  }, [refresh]);

  const train = useCallback(
    () =>
      guarded(async () => {
        const id = sessionIdRef.current;
        if (!id) return;
        if (status === "completed" || status === "failed") await resetSession();
        const st = await api.start(id);
        setSession(st);
      }),
    [guarded, status, resetSession],
  );
  const pause = useCallback(
    () =>
      guarded(async () => {
        const id = sessionIdRef.current;
        if (!id) return;
        setSession(await api.pause(id));
        await refresh(id, true);
      }),
    [guarded, refresh],
  );
  const resume = useCallback(
    () =>
      guarded(async () => {
        const id = sessionIdRef.current;
        if (id) setSession(await api.resume(id));
      }),
    [guarded],
  );
  const reset = useCallback(() => guarded(resetSession), [guarded, resetSession]);

  const setConfig = useCallback((patch: Partial<ModelConfig>) => {
    setConfigState((c) => ({ ...c, ...patch }));
  }, []);
  const setDatasetSpec = useCallback((patch: Partial<DatasetSpec>) => {
    setDatasetSpecState((s) => {
      const next = { ...s, ...patch };
      if (patch.name === "custom" && s.name !== "custom") setData({ points: [], labels: [] });
      return next;
    });
  }, []);

  const addPoint = useCallback((x: number, y: number, label: 0 | 1) => {
    setData((d) => ({
      points: [...(d?.points ?? []), [x, y]],
      labels: [...(d?.labels ?? []), label],
    }));
  }, []);
  const undoPoint = useCallback(() => {
    setData((d) => (d ? { points: d.points.slice(0, -1), labels: d.labels.slice(0, -1) } : d));
  }, []);
  const clearPoints = useCallback(() => setData({ points: [], labels: [] }), []);

  const statusRef = useRef(status);
  statusRef.current = status;
  const stopIfRunning = useCallback(async () => {
    if (statusRef.current === "running" || statusRef.current === "paused") await resetSession();
  }, [resetSession]);

  const applyPreset = useCallback(
    (preset: Preset, variant?: PresetVariant) =>
      guarded(async () => {
        await stopIfRunning();
        applyPresetNow(preset, variant);
      }),
    [guarded, stopIfRunning], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const applyPresetNow = (preset: Preset, variant?: PresetVariant) => {
    setDatasetSpecState(preset.dataset);
    setConfigState({ ...DEFAULT_CONFIG, ...preset.config, ...(variant?.config ?? {}) });
    setActivePreset({ id: preset.id, variant: variant?.label });
    setPinned(null);
    setViewState(DEFAULT_VIEW);
  };
  const applyVariant = useCallback(
    (preset: Preset, variant: PresetVariant) =>
      guarded(async () => {
        await stopIfRunning();
        setConfigState((c) => ({ ...c, ...variant.config }));
        setActivePreset({ id: preset.id, variant: variant.label });
      }),
    [guarded, stopIfRunning],
  );

  /** Put the settings and data of a saved run back into the Playground (stops a run in progress first). */
  const restoreRun = useCallback(
    (r: RestoreRequest) =>
      guarded(async () => {
        await stopIfRunning();
        const d = r.dataset;
        setDatasetSpecState({ name: d.name, n_samples: d.n_samples, noise: d.noise, seed: d.seed });
        if (d.name === "custom") setData({ points: d.points ?? [], labels: d.labels ?? [] });
        setConfigState({ ...DEFAULT_CONFIG, ...r.config });
        setActivePreset(null);
        setPinned(null);
        setViewState(DEFAULT_VIEW);
      }),
    [guarded, stopIfRunning],
  );

  const pinRun = useCallback(() => {
    const h = historyRef.current;
    if (!h.length) return;
    const c = config;
    setPinned({
      label: `${c.optimizer.toUpperCase()} · lr ${c.learning_rate} · ${c.activation} · [${c.hidden_layers.join(",") || "no hidden"}]`,
      history: h.slice(),
    });
  }, [config]);

  const setView = useCallback((v: View) => setViewState(v), []);

  return {
    datasetSpec, setDatasetSpec, data, dataLoading,
    config, setConfig, configErrors,
    session, status, locked, creating,
    history, params, grid, probe, setProbe, activations,
    view, setView,
    pinned, pinRun, clearPin: () => setPinned(null),
    error, clearError: () => setError(null), backendUp, checkBackend,
    train, pause, resume, reset,
    addPoint, undoPoint, clearPoints,
    activePreset, applyPreset, applyVariant, restoreRun,
  };
}

export type Playground = ReturnType<typeof usePlayground>;
