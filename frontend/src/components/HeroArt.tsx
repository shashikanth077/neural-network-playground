/** Decorative-but-honest hero illustration: a small static network (no fake metrics). */
export function HeroArt() {
  const cols = [3, 5, 5, 2];
  const xs = [40, 150, 260, 370];
  const y = (c: number, i: number) => 30 + ((i + (6 - cols[c]) / 2) * 240) / 5.0 + 0;
  const edges: JSX.Element[] = [];
  for (let c = 0; c < cols.length - 1; c++)
    for (let i = 0; i < cols[c]; i++)
      for (let j = 0; j < cols[c + 1]; j++) {
        const s = Math.sin((c + 1) * 12.9898 + i * 78.233 + j * 37.719) * 43758.5453;
        const w = (s - Math.floor(s)) * 2 - 1;
        edges.push(
          <line key={`${c}${i}${j}`} x1={xs[c]} y1={y(c, i)} x2={xs[c + 1]} y2={y(c + 1, j)}
            style={{ stroke: w >= 0 ? "rgb(var(--pos))" : "rgb(var(--neg))" }}
            strokeWidth={0.6 + Math.abs(w) * 2.4} strokeOpacity={0.25 + Math.abs(w) * 0.5}
            strokeDasharray={w < 0 ? "5 3" : undefined} />,
        );
      }
  return (
    <svg viewBox="0 0 410 300" className="w-full" role="img" aria-label="Illustration of a small neural network">
      {edges}
      {cols.map((n, c) => Array.from({ length: n }, (_, i) => (
        <circle key={`${c}-${i}`} cx={xs[c]} cy={y(c, i)} r="10" style={{ fill: "rgb(var(--surface))", stroke: "rgb(var(--brand))" }} strokeWidth="2.2" />
      )))}
    </svg>
  );
}
