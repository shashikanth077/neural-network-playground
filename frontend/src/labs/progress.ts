import { useCallback, useEffect, useState } from "react";

const key = (labId: string) => `ailab-progress-${labId}`;

interface Stored {
  done: string[];
  last?: string;
}

function read(labId: string): Stored {
  try {
    const raw = localStorage.getItem(key(labId));
    if (raw) {
      const p = JSON.parse(raw);
      return { done: Array.isArray(p.done) ? p.done : [], last: typeof p.last === "string" ? p.last : undefined };
    }
  } catch {
    /* storage unavailable or corrupt: start fresh */
  }
  return { done: [] };
}

function write(labId: string, v: Stored) {
  try {
    localStorage.setItem(key(labId), JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

/** Per-lab progress kept in this browser only. */
export function useLabProgress(labId: string, stepIds: string[]) {
  const [state, setState] = useState<Stored>(() => read(labId));
  useEffect(() => setState(read(labId)), [labId]);

  const done = state.done.filter((id) => stepIds.includes(id));
  const isDone = useCallback((id: string) => done.includes(id), [done]);

  const update = useCallback(
    (fn: (s: Stored) => Stored) =>
      setState((s) => {
        const next = fn(s);
        write(labId, next);
        return next;
      }),
    [labId],
  );
  const toggle = useCallback(
    (id: string) => update((s) => ({ ...s, done: s.done.includes(id) ? s.done.filter((x) => x !== id) : [...s.done, id] })),
    [update],
  );
  const complete = useCallback(
    (id: string) => update((s) => (s.done.includes(id) ? s : { ...s, done: [...s.done, id] })),
    [update],
  );
  const visit = useCallback((id: string) => update((s) => (s.last === id ? s : { ...s, last: id })), [update]);
  const reset = useCallback(() => update(() => ({ done: [] })), [update]);

  return { done, isDone, toggle, complete, visit, reset, last: state.last, percent: stepIds.length ? Math.round((done.length / stepIds.length) * 100) : 0 };
}

/** Read-only snapshot, for cards outside a lab (index, home). */
export function readProgress(labId: string, stepIds: string[]) {
  const s = read(labId);
  const done = s.done.filter((id) => stepIds.includes(id));
  return { done: done.length, total: stepIds.length, last: s.last, percent: stepIds.length ? Math.round((done.length / stepIds.length) * 100) : 0 };
}
