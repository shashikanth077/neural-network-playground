import { col } from "../labs/ui";
import { useT } from "../i18n";

/** Decorative, static illustration of the three domains. No data is implied. */
export function HeroArt() {
  const t = useT();
  const pts: [number, number, 0 | 1][] = [[20, 52, 0], [34, 40, 0], [26, 60, 0], [46, 48, 0], [58, 28, 1], [70, 36, 1], [64, 18, 1], [80, 24, 1], [50, 62, 0], [86, 40, 1]];
  const row = "flex items-center gap-4 rounded-2xl border border-line bg-surface p-3";
  const label = (cls: string, short: string, name: string) => (
    <div className="w-24 shrink-0">
      <span className={`chip !text-xs font-bold ${cls}`}>{short}</span>
      <p className="mt-1 text-[11px] leading-tight text-muted">{name}</p>
    </div>
  );
  return (
    <div className="space-y-3" role="img" aria-label={t("hero.alt")}>
      <div className={row}>
        {label("text-c-teal", "ML", t("hero.ml"))}
        <svg viewBox="0 0 100 80" className="h-24 flex-1">
          <line x1="12" y1="62" x2="92" y2="20" strokeWidth="2" strokeDasharray="4 3" style={{ stroke: col("c-teal") }} />
          {pts.map(([x, y, c], i) => <circle key={i} cx={x} cy={y} r="3.2" style={{ fill: c ? col("pos") : col("neg") }} />)}
        </svg>
      </div>
      <div className={row}>
        {label("text-brand", "DL", t("hero.dl"))}
        <svg viewBox="0 0 160 80" className="h-24 flex-1">
          {[0, 1, 2].map((i) => [0, 1, 2, 3].map((j) => <line key={`${i}${j}`} x1="20" y1={20 + i * 20} x2="80" y2={12 + j * 19} strokeOpacity=".4" style={{ stroke: col("brand") }} />))}
          {[0, 1, 2, 3].map((i) => [0, 1].map((j) => <line key={`b${i}${j}`} x1="80" y1={12 + i * 19} x2="140" y2={30 + j * 22} strokeOpacity=".4" style={{ stroke: col("brand") }} />))}
          {[0, 1, 2].map((i) => <circle key={`i${i}`} cx="20" cy={20 + i * 20} r="5" style={{ fill: col("surface"), stroke: col("brand") }} strokeWidth="2" />)}
          {[0, 1, 2, 3].map((i) => <circle key={`h${i}`} cx="80" cy={12 + i * 19} r="5" style={{ fill: col("surface"), stroke: col("brand") }} strokeWidth="2" />)}
          {[0, 1].map((i) => <circle key={`o${i}`} cx="140" cy={30 + i * 22} r="5" style={{ fill: col("brand") }} />)}
        </svg>
      </div>
      <div className={row}>
        {label("text-c-purple", "NLP", t("hero.nlp"))}
        <svg viewBox="0 0 160 80" className="h-24 flex-1">
          {["Learn", "from", "text"].map((w, i) => (
            <g key={w}>
              <rect x={10 + i * 50} y="46" width="44" height="22" rx="6" strokeWidth="1.5" style={{ fill: col("raised"), stroke: col("c-purple") }} />
              <text x={32 + i * 50} y="61" textAnchor="middle" fontSize="11" style={{ fill: col("ink") }}>{w}</text>
            </g>
          ))}
          <path d="M32 46 C 32 12, 82 12, 82 46" fill="none" strokeWidth="1.6" style={{ stroke: col("c-purple") }} />
          <path d="M82 46 C 82 22, 132 22, 132 46" fill="none" strokeWidth="1.6" strokeOpacity=".6" style={{ stroke: col("c-purple") }} />
          <path d="M32 46 C 32 4, 132 4, 132 46" fill="none" strokeWidth="1.2" strokeOpacity=".35" style={{ stroke: col("c-purple") }} />
        </svg>
      </div>
    </div>
  );
}
