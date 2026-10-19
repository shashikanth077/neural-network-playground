import { useState } from "react";
import { Callout, Demo } from "../../ui";
import { useT, useRich } from "../rich";

const SCENES = [
  { icon: "🏥", tagColor: "c-teal", tone: "warn" as const },
  { icon: "🏅", tagColor: "bad", tone: "info" as const },
  { icon: "✉️", tagColor: "c-purple", tone: "good" as const },
];

export default function RealWorld() {
  const t = useT();
  const r = useRich();
  const [pick, setPick] = useState(0);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("lab1.rw.intro")}</p>
      {SCENES.map((s, i) => (
        <div key={i} className="card flex gap-4 p-4 sm:p-5">
          <div className="text-3xl" aria-hidden>{s.icon}</div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold">
              {t(`lab1.rw.s${i}.title`)}
              <span className="chip ml-2 align-middle" style={{ color: `rgb(var(--${s.tagColor}))` }}>{t(`lab1.rw.s${i}.tag`)}</span>
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed">{r(`lab1.rw.s${i}.body`)}</p>
            <Callout tone={s.tone} title={t(`lab1.rw.s${i}.ct`)}>{r(`lab1.rw.s${i}.cx`)}</Callout>
          </div>
        </div>
      ))}
      <Demo title={t("lab1.rw.pipeTitle")}>
        <ol className="flex flex-col gap-2 md:flex-row md:items-stretch" aria-label={t("lab1.rw.pipeAria")}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <li key={i} className="flex flex-1 items-center gap-2 md:flex-col md:text-center">
              <button
                type="button"
                aria-pressed={pick === i}
                onClick={() => setPick(i)}
                className={`w-full rounded-xl border p-3 text-left transition md:text-center ${pick === i ? "border-brand bg-brand text-white dark:text-bg" : "border-line bg-raised/60 hover:bg-raised"}`}
              >
                <span className="block text-sm font-semibold">{t(`lab1.rw.p${i}.t`)}</span>
                <span className={`block text-xs ${pick === i ? "opacity-85" : "text-muted"}`}>{t(`lab1.rw.p${i}.s`)}</span>
                {i < 5 && <span className={`mt-1 block text-[11px] ${pick === i ? "opacity-80" : "text-muted"}`}>{t(`lab1.rw.p${i}.task`)}</span>}
              </button>
              {i < 5 && <span aria-hidden className="text-muted md:hidden">↓</span>}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-muted">{t("lab1.rw.pipeHint")}</p>
        <div className="mt-2 rounded-xl border border-line bg-raised/70 px-3 py-2 text-sm leading-relaxed" aria-live="polite">
          <b>{t(`lab1.rw.p${pick}.t`)}.</b> {r(`lab1.rw.d${pick}`)}
        </div>
      </Demo>
    </div>
  );
}
