import { useCallback, useEffect, useRef, useState } from "react";
import { SLIDES, SLIDE_COUNT, TARGET_MAX, TARGET_MIN, TOTAL_BUDGET } from "./model";

/** 0:05, 12:03: minutes and seconds (negative values are shown without a sign). */
export function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(Math.abs(totalSeconds)));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export type SlideStatus = "ok" | "near" | "over";
/** "over" once the planned time is exceeded, "near" in the last 10 seconds. */
export function slideStatus(elapsedSec: number, budgetSec: number): SlideStatus {
  if (elapsedSec > budgetSec) return "over";
  if (elapsedSec >= budgetSec - 10 && elapsedSec > 0) return "near";
  return "ok";
}

export type TotalStatus = "below" | "within" | "beyond";
/** Against the 7 to 10 minute target of the talk. */
export function totalStatus(totalSec: number): TotalStatus {
  if (totalSec > TARGET_MAX) return "beyond";
  if (totalSec >= TARGET_MIN) return "within";
  return "below";
}

export interface Rehearsal {
  running: boolean;
  /** Seconds spent on each slide (milliseconds are kept internally). */
  perSlide: number[];
  total: number;
  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
}

/**
 * Rehearsal timer. Time is measured with Date.now() deltas (not by counting ticks) so a throttled background tab does
 * not lose seconds, and every delta is booked on the slide that was showing while it passed.
 */
export function useRehearsal(current: number): Rehearsal {
  const [running, setRunning] = useState(false);
  const [ms, setMs] = useState<number[]>(() => new Array(SLIDE_COUNT).fill(0));
  const last = useRef(0);
  const cur = useRef(current);
  const run = useRef(false);

  const flush = useCallback((slide: number) => {
    if (!run.current) return;
    const now = Date.now();
    const d = Math.max(0, now - last.current);
    last.current = now;
    if (d > 0) setMs((a) => { const b = a.slice(); b[slide] += d; return b; });
  }, []);

  // book the time of the previous slide when the slide changes
  useEffect(() => {
    if (cur.current !== current) { flush(cur.current); cur.current = current; }
  }, [current, flush]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => flush(cur.current), 250);
    return () => clearInterval(id);
  }, [running, flush]);

  const start = useCallback(() => { if (run.current) return; run.current = true; last.current = Date.now(); setRunning(true); }, []);
  const pause = useCallback(() => { if (!run.current) return; flush(cur.current); run.current = false; setRunning(false); }, [flush]);
  const toggle = useCallback(() => (run.current ? pause() : start()), [pause, start]);
  const reset = useCallback(() => { run.current = false; setRunning(false); setMs(new Array(SLIDE_COUNT).fill(0)); }, []);

  const perSlide = ms.map((v) => v / 1000);
  return { running, perSlide, total: perSlide.reduce((a, b) => a + b, 0), start, pause, toggle, reset };
}

/** Planned seconds per slide in order. */
export const BUDGETS = SLIDES.map((s) => s.budget);
export { TOTAL_BUDGET };
