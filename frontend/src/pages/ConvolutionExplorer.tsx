import { useMemo, useState } from "react";
import { Grid } from "../explorers/Grid";
import {
  conv2d, EXERCISE_IMAGE, KERNELS, mnistCnn, pad, pool2d, receptiveField, relu, shape, SQUARE_IMAGE, type Padding,
} from "../explorers/conv";
import { samePad } from "../cheatsheets/calc";
import { useT } from "../i18n";

const IMAGES = {
  square: { label: "Bright square (8×8)", m: SQUARE_IMAGE },
  exercise: { label: "Lecture exercise (6×6)", m: EXERCISE_IMAGE },
};

const Sel = ({ id, label, value, onChange, children }: { id: string; label: string; value: string | number; onChange: (v: string) => void; children: React.ReactNode }) => (
  <label htmlFor={id} className="block text-sm">
    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5">{children}</select>
  </label>
);

export function ConvolutionExplorer() {
  const t = useT();
  const [img, setImg] = useState<keyof typeof IMAGES>("exercise");
  const [kernel, setKernel] = useState<keyof typeof KERNELS>("lecture");
  const [stride, setStride] = useState(1);
  const [padding, setPadding] = useState<Padding>("valid");
  const [useRelu, setUseRelu] = useState(false);
  const [poolMode, setPoolMode] = useState<"none" | "max" | "avg">("max");
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [f1, setF1] = useState(32);
  const [f2, setF2] = useState(64);
  const [dense, setDense] = useState(100);

  const image = IMAGES[img].m;
  const k = KERNELS[kernel].k;
  const p = padding === "same" ? samePad(k.length) : 0;
  const padded = useMemo(() => pad(image, p), [image, p]);
  const conv = useMemo(() => conv2d(image, k, stride, padding), [image, k, stride, padding]);
  const act = useRelu ? relu(conv) : conv;
  const pooled = useMemo(() => (poolMode === "none" || Math.min(...shape(act)) < 2 ? null : pool2d(act, 2, 2, poolMode)), [act, poolMode]);
  const [ih, iw] = shape(image);

  const hot = useMemo(() => {
    if (!hover) return new Set<string>();
    return new Set(receptiveField(hover[0], hover[1], k.length, k[0].length, stride, p, ih, iw).map(([r, c]) => `${r},${c}`));
  }, [hover, k, stride, p, ih, iw]);

  const net = useMemo(() => mnistCnn(f1, f2, dense), [f1, f2, dense]);
  const [oh, ow] = shape(conv);

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10">
      <p className="font-mono text-sm text-brand">{t("ex.eyebrow")}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{t("cv.title")}</h1>
      <p className="mt-2 max-w-3xl text-muted">
        {t("cv.intro")}
      </p>

      <section className="card mt-6 p-5" aria-label={t("ex.controls")}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Sel id="img" label={t("cv.image")} value={img} onChange={(v) => { setImg(v as keyof typeof IMAGES); setHover(null); }}>
            {Object.entries(IMAGES).map(([id, v]) => <option key={id} value={id}>{t(`cv.img.${id}`, v.label)}</option>)}
          </Sel>
          <Sel id="kernel" label={t("cv.kernel")} value={kernel} onChange={(v) => { setKernel(v as keyof typeof KERNELS); setHover(null); }}>
            {Object.entries(KERNELS).map(([id, v]) => <option key={id} value={id}>{t(`cv.k.${id}`, v.label)}</option>)}
          </Sel>
          <Sel id="stride" label={t("cv.stride")} value={stride} onChange={(v) => { setStride(Number(v)); setHover(null); }}>
            {[1, 2, 3].map((s) => <option key={s} value={s}>{s}</option>)}
          </Sel>
          <Sel id="padding" label={t("cv.padding")} value={padding} onChange={(v) => { setPadding(v as Padding); setHover(null); }}>
            <option value="valid">{t("cv.valid")}</option>
            <option value="same">{t("cv.same")}</option>
          </Sel>
          <Sel id="pool" label={t("cv.pool")} value={poolMode} onChange={(v) => setPoolMode(v as "none" | "max" | "avg")}>
            <option value="max">{t("cv.pool.max")}</option>
            <option value="avg">{t("cv.pool.avg")}</option>
            <option value="none">{t("cv.pool.off")}</option>
          </Sel>
          <label className="flex items-center gap-2 self-end pb-1.5 text-sm">
            <input type="checkbox" checked={useRelu} onChange={(e) => setUseRelu(e.target.checked)} /> {t("cv.relu")}
          </label>
        </div>
        <p className="mt-3 text-sm text-muted">{t(`cv.n.${kernel}`, KERNELS[kernel].note)}</p>
        <p className="mt-1 font-mono text-xs text-muted" data-testid="size-line">
          {t("cv.out")} = ⌊({ih} − {k.length} + 2·{p}) / {stride}⌋ + 1 = {oh}×{ow}
        </p>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-4" aria-label="Pipeline">
        <div className="card overflow-x-auto p-4">
          <h2 className="mb-2 text-sm font-semibold">{p > 0 ? t("cv.inputPad", undefined, { p }) : t("cv.input")}</h2>
          <Grid m={p > 0 ? padded : image} label={t("cv.input")} hot={p > 0 ? new Set([...hot].map((s) => { const [r, c] = s.split(",").map(Number); return `${r + p},${c + p}`; })) : hot} />
        </div>
        <div className="card overflow-x-auto p-4">
          <h2 className="mb-2 text-sm font-semibold">{t("cv.kernelSize", undefined, { a: k.length, b: k[0].length })}</h2>
          <Grid m={k} label={t("cv.kernel")} />
        </div>
        <div className="card overflow-x-auto p-4">
          <h2 className="mb-2 text-sm font-semibold">{useRelu ? t("cv.featureMapRelu") : t("cv.featureMap")}</h2>
          {oh === 0 ? <p className="text-sm text-muted">{t("cv.noFit")}</p> : (
            <Grid m={act} label={t("cv.featureMap")} hot={hover ? new Set([`${hover[0]},${hover[1]}`]) : undefined} onHover={(r, c) => setHover([r, c])} onLeave={() => setHover(null)} />
          )}
        </div>
        <div className="card overflow-x-auto p-4">
          <h2 className="mb-2 text-sm font-semibold">{t("cv.pooled")}</h2>
          {pooled ? <Grid m={pooled} label={t("cv.pooled")} /> : <p className="text-sm text-muted">{poolMode === "none" ? t("cv.poolOff") : t("cv.poolSmall")}</p>}
        </div>
      </section>

      <section className="card mt-8 p-5" aria-labelledby="cnn-h">
        <h2 id="cnn-h" className="text-lg font-bold tracking-tight">{t("cv.net.title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("cv.net.intro")}</p>
        <div className="mt-3 grid max-w-xl gap-4 sm:grid-cols-3">
          <Sel id="f1" label={t("cv.net.f1")} value={f1} onChange={(v) => setF1(Number(v))}>{[8, 16, 32, 64].map((v) => <option key={v}>{v}</option>)}</Sel>
          <Sel id="f2" label={t("cv.net.f2")} value={f2} onChange={(v) => setF2(Number(v))}>{[16, 32, 64, 128].map((v) => <option key={v}>{v}</option>)}</Sel>
          <Sel id="dense" label={t("cv.net.dense")} value={dense} onChange={(v) => setDense(Number(v))}>{[50, 100, 200].map((v) => <option key={v}>{v}</option>)}</Sel>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-line text-xs uppercase tracking-wide text-muted"><th className="py-1.5">{t("cv.net.layer")}</th><th>{t("cv.net.output")}</th><th className="text-right">{t("cv.net.params")}</th></tr></thead>
            <tbody>
              {net.rows.map((r, i) => (
                <tr key={i} className="border-b border-line/60"><td className="py-1.5">{r.name}</td><td className="font-mono">{r.out}</td><td className="text-right font-mono">{r.params.toLocaleString()}</td></tr>
              ))}
              <tr className="font-semibold"><td className="py-1.5">{t("cv.net.total")}</td><td /><td className="text-right font-mono" data-testid="cnn-total">{net.total.toLocaleString()}</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
