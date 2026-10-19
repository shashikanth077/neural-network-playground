import { useState } from "react";
import { Callout, Controls, Demo, Grid, Seg } from "../../ui";
import { pool2x2 } from "../math";
import { useR, useTx } from "../rich";

/** A fixed starting grid (the lab's own picks are random; this one is the same on every visit). */
const START = [1, 3, 2, 8, 5, 6, 7, 0, 9, 1, 4, 4, 2, 2, 6, 5];

export default function PoolStep() {
  const r = useR();
  const tx = useTx();
  const [grid, setGrid] = useState<number[]>(START);
  const [mode, setMode] = useState<"max" | "avg">("max");
  const out = pool2x2(grid, mode);
  const bump = (i: number) => setGrid((g) => g.map((v, j) => (j === i ? (v + 1) % 10 : v)));
  const randomise = () => setGrid(Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)));

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{r("lab2.pool.lead")}</p>
      <Demo title={tx("lab2.pool.title")}>
        <Controls>
          <Seg<"max" | "avg">
            label={tx("lab2.pool.mode")}
            value={mode}
            onChange={setMode}
            options={[{ value: "max", label: tx("lab2.pool.max") }, { value: "avg", label: tx("lab2.pool.avg") }]}
          />
          <button type="button" className="btn-ghost !py-1.5 !text-xs" onClick={randomise}>{tx("lab2.pool.random")}</button>
        </Controls>
        <div className="grid items-center gap-6 md:grid-cols-[auto_auto_minmax(0,1fr)]">
          <div>
            <p className="mb-1 text-xs text-muted">{tx("lab2.pool.input")}</p>
            <table className="border-collapse text-sm" aria-label={tx("lab2.pool.input")}>
              <tbody>
                {[0, 1, 2, 3].map((row) => (
                  <tr key={row}>
                    {[0, 1, 2, 3].map((col) => {
                      const i = row * 4 + col;
                      const shade = ((row >> 1) + (col >> 1)) % 2 === 1;
                      return (
                        <td key={col} className="p-0">
                          <button
                            type="button"
                            onClick={() => bump(i)}
                            aria-label={tx("lab2.pool.cell", { r: row + 1, c: col + 1, v: grid[i] })}
                            className={`h-10 w-11 border border-line font-mono font-semibold hover:bg-brand/10 ${shade ? "bg-raised" : ""}`}
                          >
                            {grid[i]}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <span aria-hidden className="text-2xl text-muted">→</span>
          <div>
            <p className="mb-1 text-xs text-muted">{tx("lab2.pool.output")}</p>
            <table className="border-collapse text-sm" aria-label={tx("lab2.pool.output")} aria-live="polite">
              <tbody>
                {[0, 1].map((row) => (
                  <tr key={row}>
                    {[0, 1].map((col) => {
                      const v = out[row * 2 + col];
                      return (
                        <td key={col} className="h-11 w-14 border border-line text-center font-mono font-bold">
                          {Number.isInteger(v) ? v : v.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-muted">{tx("lab2.pool.blocks")}</p>
          </div>
        </div>
        <p className="mt-4 rounded-xl border border-line bg-raised/70 px-3 py-2 text-sm leading-relaxed">
          {mode === "max" ? r("lab2.pool.maxText") : r("lab2.pool.avgText")}
        </p>
      </Demo>
      <Grid>
        <Callout tone="info" title={tx("lab2.pool.shape.title")}>{r("lab2.pool.shape.body")}</Callout>
        <Callout tone="good" title={tx("lab2.pool.lab.title")}>{r("lab2.pool.lab.body")}</Callout>
      </Grid>
    </div>
  );
}
