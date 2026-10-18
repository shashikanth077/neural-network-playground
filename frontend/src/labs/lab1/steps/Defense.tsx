import { Demo } from "../../ui";
import { QA } from "../data";

const MAP: string[][] = [
  ["1", "imputation, groupby", "“Task 1” cells", "165.83 / 166 cm"],
  ["2", "Z-score", "z = (A−mean)/std", "88, z = 5.22"],
  ["3", "Chauvenet", "erfc, n·P < 0.5", "88, n·P = 5.4e-6"],
  ["4", "IQR", "np.percentile", "limits 4.625 / 19.625"],
  ["5", "backprop from scratch", "class SmallNet", "Name 5 → female"],
  ["6.1", "depth, width, batch, validation", "run_model(...)", "98.16%, 512-256-128-64"],
  ["6.2", "activations", "loop over act × 3 repeats", "relu 97.58%"],
  ["6.3", "optimizers", "grid sgd / rmsprop / adam", "Adam 0.001, 98.16%"],
];

export default function Defense() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Short answers you can say out loud, with numbers from this lab. Remember: you must have the code open and be able to explain every cell.</p>
      <div className="space-y-2">
        {QA.map(([q, a]) => (
          <details key={q} className="card group p-4">
            <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden">
              <span aria-hidden className="mr-2 inline-block text-brand transition group-open:rotate-90">▸</span>{q}
            </summary>
            <p className="mt-2 pl-5 text-sm leading-relaxed text-muted">{a}</p>
          </details>
        ))}
      </div>
      <Demo title="Quick map: what to open for each task">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead><tr>{["Task", "Concept", "Where in the notebook", "Key output"].map((h) => <th key={h} scope="col" className="border-b border-line px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">{h}</th>)}</tr></thead>
            <tbody>{MAP.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i} className="border-b border-line px-2 py-1.5">{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </Demo>
    </div>
  );
}
