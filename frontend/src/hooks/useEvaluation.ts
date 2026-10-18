import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import type { Evaluation } from "../types";

/** Fetches the confusion matrix / ROC for the live model. While training it refreshes at most once a second. */
export function useEvaluation(sessionId: string | null, epoch: number, status: string | null, split: "train" | "val", threshold: number) {
  const [data, setData] = useState<Evaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const last = useRef(0);

  useEffect(() => {
    if (!sessionId) {
      setData(null);
      return;
    }
    let cancelled = false;
    const delay = status === "running" ? Math.max(0, 1000 - (Date.now() - last.current)) : 120;
    const t = setTimeout(async () => {
      last.current = Date.now();
      try {
        const e = await api.evaluation(sessionId, split, threshold);
        if (!cancelled) {
          setData(e);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [sessionId, epoch, status, split, threshold]);

  return { data: data && data.session_id === sessionId ? data : null, error };
}
