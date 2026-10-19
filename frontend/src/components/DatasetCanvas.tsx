import { useRef } from "react";
import { useT } from "../i18n";
import { CLASS_COLORS } from "../lib/colors";
import type { DataPayload } from "../types";

const LIM = 1.6;
interface Props {
  data: DataPayload | null;
  editable: boolean;
  activeClass: 0 | 1;
  onAdd: (x: number, y: number, label: 0 | 1) => void;
}

/** 2-D scatter of the dataset. In custom mode a click places a point of the selected class. */
export function DatasetCanvas({ data, editable, activeClass, onAdd }: Props) {
  const t = useT();
  const ref = useRef<SVGSVGElement>(null);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!editable || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 * LIM - LIM;
    const y = LIM - ((e.clientY - r.top) / r.height) * 2 * LIM;
    onAdd(+x.toFixed(3), +y.toFixed(3), activeClass);
  };
  const sx = (x: number) => ((x + LIM) / (2 * LIM)) * 100;
  const sy = (y: number) => ((LIM - y) / (2 * LIM)) * 100;
  const empty = !data || data.labels.length === 0;

  return (
    <div className="relative">
      <svg
        ref={ref}
        viewBox="0 0 100 100"
        role="img"
        aria-label={t("pg.ds.scatter", undefined, { n: data?.labels.length ?? 0 })}
        onClick={handleClick}
        className={`aspect-square w-full rounded-xl border border-line bg-raised/50 ${editable ? "cursor-crosshair" : ""}`}
      >
        <line x1="50" y1="0" x2="50" y2="100" className="stroke-line" strokeWidth=".4" />
        <line x1="0" y1="50" x2="100" y2="50" className="stroke-line" strokeWidth=".4" />
        {data?.points.map((p, i) => (
          <circle
            key={i}
            cx={sx(p[0])}
            cy={sy(p[1])}
            r={1.7}
            fill={CLASS_COLORS[data.labels[i] as 0 | 1]}
            stroke="white"
            strokeWidth=".4"
          />
        ))}
      </svg>
      {empty && (
        <p className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted">
          {editable ? t("pg.ds.canvas.edit") : t("pg.ds.canvas.gen")}
        </p>
      )}
    </div>
  );
}
