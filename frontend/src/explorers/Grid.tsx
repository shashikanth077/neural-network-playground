import type { Matrix } from "./conv";

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(2));

interface Props {
  m: Matrix;
  label: string;
  /** Cells to highlight as `r,c` keys. */
  hot?: Set<string>;
  onHover?: (r: number, c: number) => void;
  onLeave?: () => void;
  /** Colour intensity scale (max abs value). */
  scale?: number;
}

/** Numeric grid with a heat-map background; negative = red, positive = brand. */
export function Grid({ m, label, hot, onHover, onLeave, scale }: Props) {
  const max = scale ?? Math.max(1e-9, ...m.flat().map(Math.abs));
  return (
    <div role="group" aria-label={label} onMouseLeave={onLeave} className="inline-block">
      <table className="border-separate border-spacing-0.5 font-mono text-xs">
        <tbody>
          {m.map((row, r) => (
            <tr key={r}>
              {row.map((v, c) => {
                const a = Math.min(1, Math.abs(v) / max) * 0.55;
                const isHot = hot?.has(`${r},${c}`);
                return (
                  <td
                    key={c}
                    onMouseEnter={onHover ? () => onHover(r, c) : undefined}
                    className="h-8 w-9 rounded text-center tabular-nums"
                    style={{
                      background: `color-mix(in srgb, ${v < 0 ? "rgb(var(--bad))" : "rgb(var(--brand))"} ${Math.round(a * 100)}%, transparent)`,
                      outline: isHot ? "2px solid rgb(var(--brand))" : undefined,
                    }}
                  >
                    {fmt(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
