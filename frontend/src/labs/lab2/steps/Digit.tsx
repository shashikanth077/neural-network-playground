import { useEffect, useRef, useState } from "react";
import { Callout, Demo, f2 } from "../../ui";
import { inkFromRgba, preprocessInk, SIZE, type Img } from "../math";
import { setSharedDigit } from "../store";
import { useR, useTx } from "../rich";

const W = 200;
const PAPER = "#d9d8d2";

/** Draw a 28 × 28 greyscale picture into a canvas (values 0..1). */
function showStage(c: HTMLCanvasElement | null, arr: Img | Float32Array) {
  const x = c?.getContext("2d");
  if (!c || !x) return;
  const im = x.createImageData(SIZE, SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    const v = Math.round(Math.min(1, Math.max(0, arr[i])) * 255);
    im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v;
    im.data[i * 4 + 3] = 255;
  }
  x.putImageData(im, 0, 0);
}

type Info = { kind: "empty" } | { kind: "ok"; cy: number; cx: number; dy: number; dx: number };

export default function Digit() {
  const r = useR();
  const tx = useTx();
  const paper = useRef<HTMLCanvasElement>(null);
  const s1 = useRef<HTMLCanvasElement>(null);
  const s2 = useRef<HTMLCanvasElement>(null);
  const s3 = useRef<HTMLCanvasElement>(null);
  const s4 = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [info, setInfo] = useState<Info>({ kind: "empty" });
  const [sent, setSent] = useState(false);

  /** Re-run the four preprocessing stages on whatever is on the paper. */
  const update = () => {
    const pc = paper.current?.getContext("2d");
    if (!pc) return;
    const d = pc.getImageData(0, 0, W, W).data;
    const { ink, max } = inkFromRgba(d, W);
    const p = max < 30 ? null : preprocessInk(ink, W);
    if (!p) {
      const blank = new Float32Array(SIZE * SIZE);
      [s1, s2, s3, s4].forEach((c) => showStage(c.current, blank));
      setSharedDigit(blank);
      setInfo({ kind: "empty" });
      return;
    }
    showStage(s1.current, p.full);
    showStage(s2.current, p.stage2);
    showStage(s3.current, p.stage3);
    showStage(s4.current, p.stage4);
    setSharedDigit(p.stage4);
    setInfo({ kind: "ok", cy: p.centre.cy, cx: p.centre.cx, dy: p.shift.dy, dx: p.shift.dx });
  };

  const clearPaper = () => {
    const pc = paper.current?.getContext("2d");
    if (pc) {
      pc.fillStyle = PAPER;
      pc.fillRect(0, 0, W, W);
    }
    update();
  };

  /** A hand-drawn-looking sample 9: an ellipse with a tail. */
  const samplePaper = () => {
    clearPaper();
    const pc = paper.current?.getContext("2d");
    if (!pc) return;
    pc.strokeStyle = "#d03040";
    pc.lineWidth = 5;
    pc.lineCap = "round";
    pc.beginPath();
    pc.ellipse(100, 75, 38, 32, 0, 0, Math.PI * 2);
    pc.stroke();
    pc.beginPath();
    pc.moveTo(137, 78);
    pc.bezierCurveTo(140, 110, 136, 140, 132, 170);
    pc.stroke();
    update();
  };

  useEffect(() => { samplePaper(); }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = e.currentTarget;
    const b = c.getBoundingClientRect();
    return [((e.clientX - b.left) * c.width) / b.width, ((e.clientY - b.top) * c.height) / b.height];
  };
  const dot = (x: number, y: number) => {
    const pc = paper.current?.getContext("2d");
    if (!pc) return;
    pc.fillStyle = "#222";
    pc.beginPath();
    pc.arc(x, y, 3, 0, 7);
    pc.fill();
    update();
  };

  const info2 = info.kind === "ok"
    ? tx("lab2.dig.centre", { cy: f2(info.cy, 1), cx: f2(info.cx, 1), dy: info.dy, dx: info.dx })
    : tx("lab2.dig.empty");

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{r("lab2.dig.lead")}</p>
      <Demo title={tx("lab2.dig.drawTitle")}>
        <div className="grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)]">
          <div>
            <canvas
              ref={paper}
              width={W}
              height={W}
              aria-label={tx("lab2.dig.paperLabel")}
              className="h-[200px] w-[200px] max-w-full touch-none rounded-xl border border-line"
              style={{ cursor: "crosshair" }}
              onPointerDown={(e) => { drawing.current = true; e.currentTarget.setPointerCapture(e.pointerId); const [x, y] = pos(e); dot(x, y); }}
              onPointerMove={(e) => { if (!drawing.current) return; const [x, y] = pos(e); dot(x, y); }}
              onPointerUp={() => { drawing.current = false; }}
              onPointerLeave={() => { drawing.current = false; }}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-ghost !py-1.5 !text-xs" onClick={clearPaper}>{tx("lab2.dig.clear")}</button>
              <button type="button" className="btn-ghost !py-1.5 !text-xs" onClick={samplePaper}>{tx("lab2.dig.sample")}</button>
            </div>
          </div>
          <div className="min-w-0">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { ref: s1, t: "lab2.dig.st1" },
                { ref: s2, t: "lab2.dig.st2" },
                { ref: s3, t: "lab2.dig.st3" },
                { ref: s4, t: "lab2.dig.st4" },
              ].map((s) => (
                <figure key={s.t} className="text-center">
                  <canvas ref={s.ref} width={SIZE} height={SIZE} className="mx-auto h-28 w-28 rounded-lg border border-line bg-black [image-rendering:pixelated]" aria-hidden />
                  <figcaption className="mt-1.5 text-xs leading-snug text-muted">{r(s.t)}</figcaption>
                </figure>
              ))}
            </div>
            <p className="mt-3 rounded-xl border border-line bg-raised/70 px-3 py-2 font-mono text-xs leading-relaxed" role="status" aria-live="polite">{info2}</p>
            <div className="mt-3">
              <button
                type="button"
                className="btn-primary !py-1.5 !text-sm"
                onClick={() => { setSent(true); }}
              >
                {tx("lab2.dig.send")}
              </button>
              {sent && <span className="ml-3 text-sm text-ok" role="status">{tx("lab2.dig.sent")}</span>}
            </div>
          </div>
        </div>
      </Demo>
      <Callout title={tx("lab2.dig.why.title")}>{r("lab2.dig.why.body")}</Callout>
    </div>
  );
}
