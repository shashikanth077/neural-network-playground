import { Callout, col, Demo, f2, Grid } from "../../ui";
import { T5, T61, T62, T63 } from "../data";
import { mean } from "../math";

const Table = ({ head, rows, best }: { head: string[]; rows: (string | number)[][]; best: number }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[520px] text-sm">
      <thead><tr>{head.map((h) => <th key={h} scope="col" className="border-b border-line px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">{h}</th>)}</tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r[0]} className={r[0] === best ? "bg-ok/10 font-semibold" : ""}>
            {r.map((v, i) => <td key={i} className="border-b border-line px-2 py-1.5">{v}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

function Bars61() {
  const lo = 0.974;
  const hi = 0.983;
  return (
    <svg viewBox="0 0 720 230" className="mt-3 w-full" role="img" aria-label="Test accuracy per run for experiment 6.1">
      {T61.map((r, i) => {
        const hgt = ((r[6] - lo) / (hi - lo)) * 150;
        const x = 40 + i * 84;
        return (
          <g key={r[0]}>
            <rect x={x} y={180 - hgt} width="56" height={hgt} rx="6" opacity={r[0] === 5 ? 1 : 0.7} style={{ fill: r[0] === 5 ? col("ok") : col("brand") }} />
            <text x={x + 28} y={174 - hgt} textAnchor="middle" fontSize="12" fontWeight="700" style={{ fill: col("ink") }}>{f2(r[6] * 100)}</text>
            <text x={x + 28} y="200" textAnchor="middle" fontSize="12" style={{ fill: col("muted") }}>run {r[0]}</text>
          </g>
        );
      })}
      <text x="40" y="222" fontSize="11" style={{ fill: col("muted") }}>test accuracy % (axis starts at 97.4% to make small differences visible)</text>
    </svg>
  );
}

function Dots62() {
  const lo = 0.97;
  const hi = 0.979;
  const Y = (v: number) => 220 - ((v - lo) / (hi - lo)) * 180;
  return (
    <svg viewBox="0 0 400 260" className="w-full" role="img" aria-label="Accuracy of three repeats per activation">
      {[0.97, 0.972, 0.974, 0.976, 0.978].map((v) => (
        <g key={v}><line x1="40" x2="390" y1={Y(v)} y2={Y(v)} style={{ stroke: col("line") }} /><text x="36" y={Y(v) + 4} textAnchor="end" fontSize="10" style={{ fill: col("muted") }}>{f2(v * 100, 1)}</text></g>
      ))}
      {Object.keys(T62).map((k, i) => {
        const x = 95 + i * 115;
        const m = mean(T62[k]);
        return (
          <g key={k}>
            {T62[k].map((v, j) => <circle key={j} cx={x - 14 + j * 14} cy={Y(v)} r="5" opacity=".55" style={{ fill: col("brand") }} />)}
            <line x1={x - 26} x2={x + 26} y1={Y(m)} y2={Y(m)} strokeWidth="3" style={{ stroke: col("ok") }} />
            <text x={x} y="244" textAnchor="middle" fontSize="12" style={{ fill: col("ink") }}>{k}</text>
            <text x={x} y={Y(m) - 8} textAnchor="middle" fontSize="11" fontWeight="700" style={{ fill: col("ink") }}>{f2(m * 100)}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Lines63() {
  const Y = (v: number) => 220 - ((Math.max(v, 0.86) - 0.86) / (0.99 - 0.86)) * 190;
  const X = (lr: number) => 40 + ((Math.log10(lr) + 4) / 4) * 340;
  const colors: Record<string, string> = { sgd: "bad", rmsprop: "ok", adam: "pos" };
  return (
    <svg viewBox="0 0 400 260" className="w-full" role="img" aria-label="Accuracy versus learning rate per optimizer">
      {[0.88, 0.92, 0.96, 0.98].map((v) => (
        <g key={v}><line x1="40" x2="390" y1={Y(v)} y2={Y(v)} style={{ stroke: col("line") }} /><text x="36" y={Y(v) + 4} textAnchor="end" fontSize="10" style={{ fill: col("muted") }}>{f2(v * 100, 0)}</text></g>
      ))}
      {[0.0001, 0.001, 0.01, 0.1, 0.5].map((v) => <text key={v} x={X(v)} y="240" textAnchor="middle" fontSize="10" style={{ fill: col("muted") }}>{v}</text>)}
      {Object.entries(T63).map(([k, pts]) => (
        <g key={k}>
          <path d={pts.map(([lr, a], i) => `${i ? "L" : "M"}${X(lr)},${Y(a)}`).join("")} fill="none" strokeWidth="2.5" style={{ stroke: col(colors[k]) }} />
          {pts.map(([lr, a]) => <circle key={lr} cx={X(lr)} cy={Y(a)} r="4.5" style={{ fill: col(colors[k]) }} />)}
        </g>
      ))}
      <text x="385" y={Y(0.86) - 6} textAnchor="end" fontSize="10" style={{ fill: col("muted") }}>(0.1 for rmsprop/adam = 11.35%, off chart)</text>
      <g fontSize="11"><text x="48" y="14" style={{ fill: col("bad") }}>● sgd</text><text x="100" y="14" style={{ fill: col("ok") }}>● rmsprop</text><text x="175" y="14" style={{ fill: col("pos") }}>● adam</text></g>
    </svg>
  );
}

export default function Results() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Real numbers from the notebook run (MNIST test set, 10 000 images). Highlighted rows are the best.</p>
      <Demo title="Task 5: gender of Name 5">
        <Table head={["Run", "lr", "Epochs", "Final MSE", "Train acc", "Output Name 5", "Answer"]} rows={T5.map((r) => [...r])} best={4} />
        <p className="mt-2 text-sm text-muted">Conclusion: needs enough learning rate × epochs; then the answer is clearly <b className="text-ink">female (0)</b>.</p>
      </Demo>
      <Demo title="6.1 Number of layers and neurons (+ batch size, validation split)">
        <Table head={["Run", "Neurons", "Epochs", "Batch", "Val split", "Train acc", "Test acc", "Train loss", "Test loss"]} rows={T61.map((r) => [...r])} best={5} />
        <Bars61 />
        <p className="text-sm text-muted">Best: run 5 = four hidden layers 512-256-128-64, <b className="text-ink">98.16%</b> test accuracy, loss 0.0845. Batch 64 and validation 10%/30% were slightly worse. The test digit was recognised by all 8 models.</p>
      </Demo>
      <Grid>
        <Demo title="6.2 Activations (3 repeats each)">
          <Dots62 />
          <p className="text-sm text-muted">Differences are tiny (≈ the repeat-to-repeat spread). relu best accuracy 97.58%, sigmoid lowest loss 0.093.</p>
        </Demo>
        <Demo title="6.3 Optimizer × learning rate">
          <Lines63 />
          <p className="text-sm text-muted">Best: Adam 0.001 → <b className="text-ink">98.16%</b>. Learning rate mattered more than the optimizer.</p>
        </Demo>
      </Grid>
      <Callout tone="good" title="Proposed best model">
        Dense 512-256-128-64, relu, softmax output, Adam lr 0.001, batch 128, 15 epochs, validation 20% → 98.16% test accuracy. Early stopping around epoch 5 would give the same quality much faster.
      </Callout>
    </div>
  );
}
