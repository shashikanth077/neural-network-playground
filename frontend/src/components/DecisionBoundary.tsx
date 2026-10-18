import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_VIEW, type View } from "../hooks/usePlayground";
import { useIsDark } from "../hooks/useTheme";
import { CLASS_COLORS, probabilityRGB } from "../lib/colors";
import type { DataPayload, GridPrediction } from "../types";

interface Props {
  data: DataPayload | null;
  grid: GridPrediction | null;
  view: View;
  onView: (v: View) => void;
  onProbe: (p: [number, number]) => void;
  hasModel: boolean;
}

const MIN_HALF = 0.35;
const MAX_HALF = 6;

/** Bilinear lookup of P(class 1) from the model's prediction grid. */
function sample(grid: GridPrediction, x: number, y: number): number | null {
  const n = grid.resolution;
  const fx = ((x - grid.x_min) / (grid.x_max - grid.x_min)) * (n - 1);
  const fy = ((y - grid.y_min) / (grid.y_max - grid.y_min)) * (n - 1);
  if (fx < 0 || fy < 0 || fx > n - 1 || fy > n - 1) return null;
  const x0 = Math.min(n - 2, Math.floor(fx)), y0 = Math.min(n - 2, Math.floor(fy));
  const tx = fx - x0, ty = fy - y0;
  const g = (i: number, j: number) => grid.probabilities[j * n + i];
  return (g(x0, y0) * (1 - tx) + g(x0 + 1, y0) * tx) * (1 - ty) + (g(x0, y0 + 1) * (1 - tx) + g(x0 + 1, y0 + 1) * tx) * ty;
}

function DecisionBoundaryImpl({ data, grid, view, onView, onProbe, hasModel }: Props) {
  const dark = useIsDark();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(480);
  const [hover, setHover] = useState<{ px: number; py: number; x: number; y: number; p: number | null; cls: number | null } | null>(null);
  const drag = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize(Math.max(240, Math.floor(el.clientWidth))));
    ro.observe(el);
    setSize(Math.max(240, Math.floor(el.clientWidth)));
    return () => ro.disconnect();
  }, []);

  // pixel <-> data transforms for the *current view*
  const toPx = useCallback((x: number, y: number) => [((x - (view.cx - view.half)) / (2 * view.half)) * size, ((view.cy + view.half - y) / (2 * view.half)) * size], [view, size]);
  const toData = useCallback((px: number, py: number) => [view.cx - view.half + (px / size) * 2 * view.half, view.cy + view.half - (py / size) * 2 * view.half], [view, size]);

  // The prediction heat-map is rendered to a small offscreen canvas once per grid, then scaled smoothly.
  const heat = useMemo(() => {
    if (!grid) return null;
    const n = grid.resolution;
    const off = document.createElement("canvas");
    off.width = n; off.height = n;
    const ctx = off.getContext("2d");
    if (!ctx) return null;
    const img = ctx.createImageData(n, n);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const p = grid.probabilities[j * n + i];
        const [r, g, b] = probabilityRGB(p, dark);
        const o = ((n - 1 - j) * n + i) * 4; // row 0 of the grid is y_min (bottom)
        img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b; img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return off;
  }, [grid, dark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr; canvas.height = size * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = dark ? "#121724" : "#ffffff";
    ctx.fillRect(0, 0, size, size);

    // heat-map positioned using the grid's own bounds (stays correct while a new grid is loading)
    if (heat && grid) {
      const [x0, y0] = toPx(grid.x_min, grid.y_max);
      const [x1, y1] = toPx(grid.x_max, grid.y_min);
      const n = grid.resolution;
      // each cell is centred on its sample, so pad the image by half a cell
      const cw = (x1 - x0) / (n - 1), ch = (y1 - y0) / (n - 1);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(heat, x0 - cw / 2, y0 - ch / 2, x1 - x0 + cw, y1 - y0 + ch);
    }

    // axes grid + ticks
    ctx.font = "11px Inter, sans-serif";
    ctx.lineWidth = 1;
    const step = view.half > 3 ? 2 : view.half > 1 ? 0.5 : 0.25;
    ctx.fillStyle = dark ? "rgba(200,210,230,.65)" : "rgba(60,70,90,.7)";
    for (let t = Math.ceil((view.cx - view.half) / step) * step; t <= view.cx + view.half; t += step) {
      const [px] = toPx(t, 0);
      ctx.strokeStyle = Math.abs(t) < 1e-9 ? "rgba(120,130,150,.55)" : "rgba(120,130,150,.15)";
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, size); ctx.stroke();
      ctx.fillText(t.toFixed(step < 0.5 ? 2 : 1), px + 3, size - 5);
    }
    for (let t = Math.ceil((view.cy - view.half) / step) * step; t <= view.cy + view.half; t += step) {
      const [, py] = toPx(0, t);
      ctx.strokeStyle = Math.abs(t) < 1e-9 ? "rgba(120,130,150,.55)" : "rgba(120,130,150,.15)";
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(size, py); ctx.stroke();
      ctx.fillText(t.toFixed(step < 0.5 ? 2 : 1), 4, py - 3);
    }

    // decision boundary p = 0.5 via marching squares on the prediction grid
    if (grid) {
      const n = grid.resolution;
      const gx = (i: number) => grid.x_min + (i / (n - 1)) * (grid.x_max - grid.x_min);
      const gy = (j: number) => grid.y_min + (j / (n - 1)) * (grid.y_max - grid.y_min);
      const P = (i: number, j: number) => grid.probabilities[j * n + i] - 0.5;
      ctx.strokeStyle = dark ? "#f1f5f9" : "#0f172a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let j = 0; j < n - 1; j++) {
        for (let i = 0; i < n - 1; i++) {
          const c = [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)];
          const pts: [number, number][] = [];
          const edge = (a: number, b: number, ax: number, ay: number, bx: number, by: number) => {
            if ((c[a] > 0) !== (c[b] > 0)) {
              const t = c[a] / (c[a] - c[b]);
              pts.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
            }
          };
          edge(0, 1, gx(i), gy(j), gx(i + 1), gy(j));
          edge(1, 2, gx(i + 1), gy(j), gx(i + 1), gy(j + 1));
          edge(2, 3, gx(i + 1), gy(j + 1), gx(i), gy(j + 1));
          edge(3, 0, gx(i), gy(j + 1), gx(i), gy(j));
          if (pts.length >= 2) {
            const [a, b] = [toPx(pts[0][0], pts[0][1]), toPx(pts[1][0], pts[1][1])];
            ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
            if (pts.length === 4) {
              const [c2, d] = [toPx(pts[2][0], pts[2][1]), toPx(pts[3][0], pts[3][1])];
              ctx.moveTo(c2[0], c2[1]); ctx.lineTo(d[0], d[1]);
            }
          }
        }
      }
      ctx.stroke();
    }

    // data points
    if (data) {
      for (let i = 0; i < data.labels.length; i++) {
        const [px, py] = toPx(data.points[i][0], data.points[i][1]);
        if (px < -6 || py < -6 || px > size + 6 || py > size + 6) continue;
        ctx.beginPath();
        ctx.arc(px, py, 4.2, 0, Math.PI * 2);
        ctx.fillStyle = CLASS_COLORS[data.labels[i] as 0 | 1];
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = dark ? "#0a0d16" : "#ffffff";
        ctx.stroke();
      }
    }
  }, [data, grid, heat, view, size, dark, toPx]);

  const pointer = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };
  const onMove = (e: React.PointerEvent) => {
    const [px, py] = pointer(e);
    if (drag.current) {
      const s = (2 * view.half) / size;
      onView({ ...view, cx: drag.current.cx - (px - drag.current.x) * s, cy: drag.current.cy + (py - drag.current.y) * s });
      return;
    }
    const [x, y] = toData(px, py);
    let cls: number | null = null;
    let hx = x, hy = y;
    if (data) {
      let best = 9;
      data.points.forEach((p, i) => {
        const [qx, qy] = toPx(p[0], p[1]);
        const d = Math.hypot(qx - px, qy - py);
        if (d < best) { best = d; cls = data.labels[i]; hx = p[0]; hy = p[1]; }
      });
    }
    const p = grid ? sample(grid, hx, hy) : null;
    setHover({ px, py, x: hx, y: hy, p, cls });
    onProbe([hx, hy]);
  };
  const zoomAt = (factor: number, px = size / 2, py = size / 2) => {
    const half = Math.min(MAX_HALF, Math.max(MIN_HALF, view.half * factor));
    const [x, y] = toData(px, py);
    const k = half / view.half;
    onView({ half, cx: x - (x - view.cx) * k, cy: y - (y - view.cy) * k });
  };
  const wheelRef = useRef<(e: WheelEvent) => void>();
  wheelRef.current = (e: WheelEvent) => {
    e.preventDefault();
    const r = canvasRef.current!.getBoundingClientRect();
    zoomAt(Math.exp(e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
  };
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const h = (e: WheelEvent) => wheelRef.current?.(e);
    c.addEventListener("wheel", h, { passive: false });
    return () => c.removeEventListener("wheel", h);
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    const s = view.half * 0.12;
    const map: Record<string, () => void> = {
      ArrowLeft: () => onView({ ...view, cx: view.cx - s }),
      ArrowRight: () => onView({ ...view, cx: view.cx + s }),
      ArrowUp: () => onView({ ...view, cy: view.cy + s }),
      ArrowDown: () => onView({ ...view, cy: view.cy - s }),
      "+": () => zoomAt(0.8), "=": () => zoomAt(0.8), "-": () => zoomAt(1.25), "0": () => onView(DEFAULT_VIEW),
    };
    if (map[e.key]) { e.preventDefault(); map[e.key](); }
  };

  const moved = view.cx !== DEFAULT_VIEW.cx || view.cy !== DEFAULT_VIEW.cy || view.half !== DEFAULT_VIEW.half;

  return (
    <div>
      <div ref={wrapRef} className="relative mx-auto w-full max-w-[640px]">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          role="img"
          aria-label="Decision boundary plot. Arrow keys pan, plus and minus zoom, zero resets the view."
          style={{ width: size, height: size, touchAction: "none" }}
          className={`rounded-xl border border-line ${drag.current ? "cursor-grabbing" : "cursor-crosshair"}`}
          onPointerDown={(e) => {
            const [px, py] = pointer(e);
            drag.current = { x: px, y: py, cx: view.cx, cy: view.cy };
            (e.target as Element).setPointerCapture(e.pointerId);
          }}
          onPointerUp={() => { drag.current = null; }}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKey}
        />
        {!hasModel && (
          <div className="absolute inset-0 grid place-items-center rounded-xl bg-surface/80 p-6 text-center text-sm text-muted">
            Choose a dataset with both classes and valid settings to see the model's predictions.
          </div>
        )}
        {hover && hasModel && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-card"
            style={{ left: Math.min(hover.px + 14, size - 170), top: Math.max(4, hover.py - 56) }}
          >
            <div className="font-mono">({hover.x.toFixed(2)}, {hover.y.toFixed(2)})</div>
            {hover.cls !== null && <div>True class: <b>{hover.cls}</b></div>}
            {hover.p !== null && (
              <div>
                P(class 1) = <b>{(hover.p * 100).toFixed(1)}%</b> → predicts class {hover.p >= 0.5 ? 1 : 0} (
                {(Math.max(hover.p, 1 - hover.p) * 100).toFixed(0)}% confident)
              </div>
            )}
          </div>
        )}
        <div className="absolute right-2 top-2 flex flex-col gap-1">
          <button className="btn-ghost !px-2 !py-0.5" aria-label="Zoom in" onClick={() => zoomAt(0.8)}>+</button>
          <button className="btn-ghost !px-2 !py-0.5" aria-label="Zoom out" onClick={() => zoomAt(1.25)}>−</button>
          {moved && <button className="btn-ghost !px-2 !py-0.5 !text-xs" onClick={() => onView(DEFAULT_VIEW)}>Reset</button>}
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-muted" aria-label="Legend">
        <li className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: CLASS_COLORS[0] }} />class 0 point</li>
        <li className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: CLASS_COLORS[1] }} />class 1 point</li>
        <li className="inline-flex items-center gap-1.5">
          <span className="h-3 w-28 rounded" style={{ background: "linear-gradient(90deg, rgb(249 115 22 / .7), rgb(248 249 252), rgb(59 130 246 / .7))" }} aria-hidden />
          predicted 0 → unsure → 1
        </li>
        <li className="inline-flex items-center gap-1.5"><span className="h-0.5 w-6 bg-ink" />decision boundary (p = 0.5)</li>
      </ul>
      <p className="mt-1 text-center text-xs text-muted">Drag to pan · scroll or +/− to zoom · hover for confidence</p>
    </div>
  );
}

export const DecisionBoundary = memo(DecisionBoundaryImpl);
