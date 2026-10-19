import { useEffect, useMemo, useRef, useState } from "react";
import { Controls, Demo, f2, Grid, Out, Seg } from "../../ui";
import { brushStroke, convAt, conv2d, defaultDigit, KERNELS, type Img, type Pad, SIZE } from "../math";
import { getSharedDigit } from "../store";
import { useR, useTx } from "../rich";

const CELL = 252;

/** Draw a 28 × 28 picture (values 0..1) into a canvas. */
function paint(c: HTMLCanvasElement | null, arr: ArrayLike<number>) {
  const x = c?.getContext("2d");
  if (!c || !x) return;
  c.width = SIZE;
  c.height = SIZE;
  const im = x.createImageData(SIZE, SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    const v = Math.round(Math.min(1, Math.max(0, arr[i])) * 255);
    im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v;
    im.data[i * 4 + 3] = 255;
  }
  x.putImageData(im, 0, 0);
}

export default function ConvStep() {
  const r = useR();
  const tx = useTx();
  const [name, setName] = useState(KERNELS[0].name);
  const [kern, setKern] = useState<number[]>(() => KERNELS[0].w.slice());
  const [relu, setRelu] = useState(true);
  const [pad, setPad] = useState<Pad>("same");
  const [input, setInput] = useState<Img>(() => getSharedDigit() ?? defaultDigit());
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const inCanvas = useRef<HTMLCanvasElement>(null);
  const outCanvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const off = pad === "same" ? 1 : 0;
  const conv = useMemo(() => conv2d(input, kern, pad, relu), [input, kern, pad, relu]);
  const calc = hover ? convAt(input, kern, pad, hover.x, hover.y) : null;

  useEffect(() => { paint(inCanvas.current, input); }, [input]);

  useEffect(() => {
    const c = outCanvas.current;
    const x = c?.getContext("2d");
    if (!c || !x) return;
    const { n, out } = conv;
    let mn = Infinity, mx = -Infinity;
    out.forEach((v) => { mn = Math.min(mn, v); mx = Math.max(mx, v); });
    const span = mx - mn || 1;
    c.width = n;
    c.height = n;
    const im = x.createImageData(n, n);
    for (let i = 0; i < n * n; i++) {
      const v = Math.round(((out[i] - mn) / span) * 255);
      im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v;
      im.data[i * 4 + 3] = 255;
    }
    x.putImageData(im, 0, 0);
  }, [conv]);

  const choose = (n: string) => {
    const k = KERNELS.find((x) => x.name === n) ?? KERNELS[0];
    setName(k.name);
    setKern(k.w.slice());
  };
  const setWeight = (i: number, raw: string) => {
    setKern((cur) => cur.map((v, j) => (j === i ? parseFloat(raw) || 0 : v)));
  };

  const brush = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - b.left) / b.width) * SIZE;
    const y = ((e.clientY - b.top) / b.height) * SIZE;
    setInput((cur) => {
      const next = Float32Array.from(cur);
      brushStroke(next, x, y);
      return next;
    });
  };

  const onOut = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    const n = conv.n;
    const x = Math.min(n - 1, Math.floor(((e.clientX - b.left) / b.width) * n));
    const y = Math.min(n - 1, Math.floor(((e.clientY - b.top) / b.height) * n));
    setHover({ x, y });
  };

  const rows = calc ? [0, 1, 2].map((ry) => calc.cells.slice(ry * 3, ry * 3 + 3).map((c) => `${f2(c.v)}*${f2(c.k)}`.padEnd(12)).join("")) : [];

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{r("lab2.conv.lead")}</p>
      <Demo title={tx("lab2.conv.title")}>
        <Controls>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            {tx("lab2.conv.kernel")}
            <select className="field !py-1.5 text-sm" value={name} onChange={(e) => choose(e.target.value)}>
              {KERNELS.map((k) => <option key={k.name} value={k.name}>{k.name}</option>)}
            </select>
          </label>
          <div className="flex flex-col gap-1 text-xs font-medium text-muted">
            <span>{tx("lab2.conv.padding")}</span>
            <Seg<Pad>
              label={tx("lab2.conv.padding")}
              value={pad}
              onChange={setPad}
              options={[{ value: "same", label: tx("lab2.conv.same") }, { value: "valid", label: tx("lab2.conv.valid") }]}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-brand" checked={relu} onChange={(e) => setRelu(e.target.checked)} />
            {tx("lab2.conv.relu")}
          </label>
        </Controls>
        <div className="mb-4 grid grid-cols-3 gap-2 sm:max-w-xs" role="group" aria-label={tx("lab2.conv.weights")}>
          {kern.map((v, i) => (
            <input
              key={i}
              type="number"
              step="0.1"
              aria-label={tx("lab2.conv.weight", { n: i + 1 })}
              value={Number(v.toFixed(3))}
              onChange={(e) => setWeight(i, e.target.value)}
              className="field !py-1 text-center font-mono text-sm"
            />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-[auto_auto_minmax(0,1fr)]">
          <figure>
            <figcaption className="mb-1 text-xs text-muted">{tx("lab2.conv.input")}</figcaption>
            <div className="relative" style={{ width: CELL, maxWidth: "100%" }}>
              <canvas
                ref={inCanvas}
                width={SIZE}
                height={SIZE}
                aria-label={tx("lab2.conv.inputLabel")}
                className="block h-auto w-full touch-none [image-rendering:pixelated]"
                style={{ cursor: "crosshair", border: "1px solid var(--line)", borderRadius: 8 }}
                onPointerDown={(e) => { drawing.current = true; e.currentTarget.setPointerCapture(e.pointerId); brush(e); }}
                onPointerMove={(e) => { if (drawing.current) brush(e); }}
                onPointerUp={() => { drawing.current = false; }}
              />
              {hover && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute border-2 border-bad"
                  style={{
                    left: `${((hover.x - off) / SIZE) * 100}%`,
                    top: `${((hover.y - off) / SIZE) * 100}%`,
                    width: `${(3 / SIZE) * 100}%`,
                    height: `${(3 / SIZE) * 100}%`,
                  }}
                />
              )}
            </div>
          </figure>
          <figure>
            <figcaption className="mb-1 text-xs text-muted">{tx("lab2.conv.output")}</figcaption>
            <canvas
              ref={outCanvas}
              width={conv.n}
              height={conv.n}
              aria-label={tx("lab2.conv.outputLabel")}
              className="block h-auto [image-rendering:pixelated]"
              style={{ width: CELL, maxWidth: "100%", border: "1px solid var(--line)", borderRadius: 8, cursor: "crosshair" }}
              onPointerMove={onOut}
              onPointerLeave={() => setHover(null)}
            />
          </figure>
          <figure className="min-w-0">
            <figcaption className="mb-1 text-xs text-muted">{tx("lab2.conv.calc")}</figcaption>
            <pre className="min-h-[190px] overflow-x-auto rounded-xl border border-line bg-raised/70 p-3 font-mono text-xs leading-relaxed" aria-live="polite">
              {calc && hover
                ? [
                    tx("lab2.conv.at", { x: hover.x, y: hover.y }),
                    tx("lab2.conv.pm"),
                    ...rows,
                    `${tx("lab2.conv.sum")} = ${f2(calc.sum, 3)}`,
                    ...(relu ? [`ReLU -> ${f2(Math.max(0, calc.sum), 3)}`] : []),
                  ].join("\n")
                : tx("lab2.conv.hoverHint")}
            </pre>
          </figure>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-ghost !py-1.5 !text-xs" onClick={() => setInput(getSharedDigit() ?? defaultDigit())}>
            {tx("lab2.conv.useDigit")}
          </button>
          <button type="button" className="btn-ghost !py-1.5 !text-xs" onClick={() => setInput(defaultDigit())}>
            {tx("lab2.conv.ring")}
          </button>
        </div>
      </Demo>
      <Grid>
        <Out>{r("lab2.conv.note1")}</Out>
        <Out>{r("lab2.conv.note2")}</Out>
      </Grid>
    </div>
  );
}
