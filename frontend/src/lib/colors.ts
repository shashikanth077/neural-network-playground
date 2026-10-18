/** Shared visual encodings. Class colours are colour-blind friendly (orange vs blue). */
export const CLASS_COLORS = { 0: "#f97316", 1: "#3b82f6" } as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Probability → RGB, diverging orange (class 0) ↔ near-white at 0.5 ↔ blue (class 1). */
export function probabilityRGB(p: number, dark: boolean): [number, number, number] {
  const neutral: [number, number, number] = dark ? [30, 36, 54] : [248, 249, 252];
  const c0: [number, number, number] = [249, 115, 22];
  const c1: [number, number, number] = [59, 130, 246];
  const t = Math.min(1, Math.abs(p - 0.5) * 2);
  const target = p >= 0.5 ? c1 : c0;
  const s = Math.pow(t, 0.85) * (dark ? 0.7 : 0.62);
  return [lerp(neutral[0], target[0], s), lerp(neutral[1], target[1], s), lerp(neutral[2], target[2], s)];
}

/** Activation value → fill colour. Squashed with tanh so unbounded ReLU outputs stay readable. */
export function activationFill(v: number, scale: number): string {
  const t = Math.tanh(v / Math.max(scale, 1e-6));
  const neutral = [226, 232, 240];
  const target = t >= 0 ? [37, 99, 235] : [234, 88, 12];
  const s = Math.abs(t);
  const c = neutral.map((n, i) => Math.round(lerp(n, target[i], s)));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}
