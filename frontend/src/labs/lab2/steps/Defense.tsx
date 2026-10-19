import { SUMMARY, TASK11 } from "../data/results";
import { useR, useTx } from "../rich";

/** The question numbers, in order (keys lab2.def.q<i> / lab2.def.a<i>). */
const QUESTIONS = [0, 1, 2, 3, 4, 5, 6, 7];

export default function Defense() {
  const r = useR();
  const tx = useTx();
  const cnnRun = TASK11.find((x) => x.Run === SUMMARY.task11.best_run);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{r("lab2.def.lead")}</p>
      <div className="space-y-2">
        {QUESTIONS.map((i) => (
          <details key={i} className="card group p-4">
            <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden">
              <span aria-hidden className="mr-2 inline-block text-brand transition group-open:rotate-90">▸</span>{tx(`lab2.def.q${i}`)}
            </summary>
            <p className="mt-2 pl-5 text-sm leading-relaxed text-muted">{r(`lab2.def.a${i}`, {
              cnn: (SUMMARY.task11.test_acc * 100).toFixed(2),
              lab1: (SUMMARY.task11.fc_test_acc * 100).toFixed(2),
              run: SUMMARY.task11.best_run,
              params: cnnRun ? String(cnnRun.params) : "",
            })}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
