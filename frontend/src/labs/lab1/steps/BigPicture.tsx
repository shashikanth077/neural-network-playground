import { Link } from "react-router-dom";
import { Callout, Demo } from "../../ui";
import { useT, useRich } from "../rich";

const FLOW = [
  { icon: "🧩", to: "missing-values" },
  { icon: "🚨", to: "anomalies" },
  { icon: "📏", to: "scaling" },
  { icon: "🧠", to: "network" },
  { icon: "🔢", to: "mnist" },
  { icon: "🎛️", to: "optimizers" },
];

export default function BigPicture() {
  const t = useT();
  const r = useRich();
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{t("lab1.big.intro")}</p>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FLOW.map((s, i) => (
          <li key={s.to} className="card relative p-4">
            <span className="chip">{t(`lab1.big.f${i}.tag`)}</span>
            <div className="mt-2 text-2xl" aria-hidden>{s.icon}</div>
            <p className="mt-1 font-semibold">
              <span className="mr-1.5 font-mono text-xs text-muted">{i + 1}.</span>
              {t(`lab1.big.f${i}.title`)}
            </p>
            <p className="mt-0.5 text-sm text-muted">{t(`lab1.big.f${i}.text`)}</p>
            <Link to={`/labs/lab1/${s.to}`} className="mt-2 inline-block text-sm font-semibold text-brand underline-offset-2 hover:underline">
              {t("lab1.big.open")}
            </Link>
          </li>
        ))}
      </ol>
      <Demo title={t("lab1.big.ruleTitle")}>
        <p className="text-sm leading-relaxed">{r("lab1.big.rule")}</p>
      </Demo>
      <Callout title={t("lab1.big.howTitle")}>{r("lab1.big.how")}</Callout>
    </div>
  );
}
