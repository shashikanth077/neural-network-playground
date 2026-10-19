import { useState } from "react";
import { Callout, Controls, Demo, Grid, Seg, Slider } from "../../ui";
import { cnnBreakdown, denseParams, LAB1_SIZES } from "../math";
import { TASK11 } from "../data/results";
import { useR, useTx } from "../rich";

/** The recorded CNN runs that use these settings (blocks, first filters, kernel) → run number. */
const RECORDED: { run: number; blocks: number; first: number; kernel: number }[] = [
  { run: 1, blocks: 1, first: 32, kernel: 3 },
  { run: 2, blocks: 2, first: 32, kernel: 3 },
  { run: 3, blocks: 2, first: 32, kernel: 5 },
  { run: 4, blocks: 3, first: 32, kernel: 3 },
  { run: 5, blocks: 2, first: 64, kernel: 3 },
];

const fmt = (n: number) => n.toLocaleString("en-US");

export default function ParamsStep() {
  const r = useR();
  const tx = useTx();
  const [blocks, setBlocks] = useState(2);
  const [first, setFirst] = useState(32);
  const [kernel, setKernel] = useState(3);
  const b = cnnBreakdown({ blocks, firstFilters: first, kernel });
  const dense = denseParams(LAB1_SIZES);
  const match = RECORDED.find((x) => x.blocks === blocks && x.first === first && x.kernel === kernel);
  const recorded = match ? TASK11.find((x) => x.Run === match.run) : undefined;
  const max = Math.max(b.total, dense);

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{r("lab2.par.lead")}</p>
      <Demo title={tx("lab2.par.title")}>
        <Controls>
          <Slider id="p-blocks" label={tx("lab2.par.blocks")} min={1} max={3} step={1} value={blocks} onChange={setBlocks} />
          <Slider id="p-filters" label={tx("lab2.par.filters")} min={8} max={128} step={8} value={first} onChange={setFirst} />
          <div className="flex flex-col gap-1 text-xs font-medium text-muted">
            <span>{tx("lab2.par.kernel")}</span>
            <Seg<string>
              label={tx("lab2.par.kernel")}
              value={String(kernel)}
              onChange={(v) => setKernel(Number(v))}
              options={[{ value: "3", label: "3 × 3" }, { value: "5", label: "5 × 5" }]}
            />
          </div>
        </Controls>
        <pre className="overflow-x-auto rounded-xl border border-line bg-raised/70 p-3 font-mono text-xs leading-relaxed" aria-live="polite">
          {[
            ...b.conv.map((c, i) => `Conv2D #${i + 1}: (${kernel}x${kernel} x ${c.cin} in + 1 bias) x ${c.filters} filters = ${fmt(c.params)}`),
            `Flatten: ${b.size}x${b.size}x${b.channels} = ${fmt(b.flat)} values`,
            `Dense 128: ${fmt(b.flat)} x 128 + 128 = ${fmt(b.dense1)}`,
            `Dense 10: 128 x 10 + 10 = ${fmt(b.dense2)}`,
            `${tx("lab2.par.total")} = ${fmt(b.total)}`,
          ].join("\n")}
        </pre>
        <div className="mt-4 space-y-2" aria-live="polite">
          <p className="text-xs text-muted">{tx("lab2.par.compare")}</p>
          <Bar label={tx("lab2.par.cnnBar")} value={b.total} max={max} tone="bg-brand" />
          <Bar label={tx("lab2.par.denseBar", { n: fmt(dense) })} value={dense} max={max} tone="bg-c-amber" />
        </div>
        <p className="mt-3 text-sm text-muted" role="status">
          {recorded
            ? tx("lab2.par.matches", { n: recorded.Run, p: fmt(recorded.params as number) })
            : tx("lab2.par.noMatch")}
        </p>
      </Demo>
      <Grid>
        <Callout tone="info" title={tx("lab2.par.share.title")}>{r("lab2.par.share.body")}</Callout>
        <Callout tone="warn" title={tx("lab2.par.flatten.title")}>{r("lab2.par.flatten.body")}</Callout>
      </Grid>
    </div>
  );
}

function Bar({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <div className="mt-1 h-3 overflow-hidden rounded-full bg-raised" role="img" aria-label={`${label}: ${fmt(value)}`}>
        <div className={`h-full rounded-full ${tone} transition-[width]`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}
