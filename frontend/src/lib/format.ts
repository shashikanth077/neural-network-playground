export const fmt = (v: number | null | undefined, digits = 4) =>
  v === null || v === undefined || !Number.isFinite(v) ? "–" : v.toFixed(digits);

export const pct = (v: number | null | undefined) =>
  v === null || v === undefined || !Number.isFinite(v) ? "–" : `${(v * 100).toFixed(1)}%`;

export function duration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  return `${m}m ${(seconds - m * 60).toFixed(0)}s`;
}

/** Keep charts light: evenly thin out long series for drawing only (the data itself is untouched). */
export function downsample<T>(items: T[], max = 400): T[] {
  if (items.length <= max) return items;
  const step = items.length / max;
  const out: T[] = [];
  for (let i = 0; i < max; i++) out.push(items[Math.floor(i * step)]);
  out.push(items[items.length - 1]);
  return out;
}
