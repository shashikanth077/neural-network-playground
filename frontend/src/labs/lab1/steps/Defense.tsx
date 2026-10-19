import { useT } from "../rich";
import { Demo } from "../../ui";
import { QA } from "../data";

/** Task id, then keys for the three text columns live under `lab1.def.map.<index>.*`. */
const MAP_IDS = ["1", "2", "3", "4", "5", "6.1", "6.2", "6.3"];

export default function Defense() {
  const t = useT();
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("lab1.def.intro")}</p>
      <div className="space-y-2">
        {QA.map(([q, a], i) => (
          <details key={q} className="card group p-4">
            <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden">
              <span aria-hidden className="mr-2 inline-block text-brand transition group-open:rotate-90">▸</span>{t(`lab1.def.q${i}.q`, q)}
            </summary>
            <p className="mt-2 pl-5 text-sm leading-relaxed text-muted">{t(`lab1.def.q${i}.a`, a)}</p>
          </details>
        ))}
      </div>
      <Demo title={t("lab1.def.map.title")}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead><tr>{["task", "concept", "where", "out"].map((h) => <th key={h} scope="col" className="border-b border-line px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">{t(`lab1.def.map.h.${h}`)}</th>)}</tr></thead>
            <tbody>
              {MAP_IDS.map((id, i) => (
                <tr key={id}>
                  <td className="border-b border-line px-2 py-1.5">{id}</td>
                  <td className="border-b border-line px-2 py-1.5">{t(`lab1.def.map.${i}.c`)}</td>
                  <td className="border-b border-line px-2 py-1.5">{t(`lab1.def.map.${i}.w`)}</td>
                  <td className="border-b border-line px-2 py-1.5">{t(`lab1.def.map.${i}.k`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Demo>
    </div>
  );
}
