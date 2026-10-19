import { CODE_STEPS } from "../data/code";
import { useR, useTx } from "../rich";

export default function CodeWalk() {
  const r = useR();
  const tx = useTx();
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{r("lab2.code.lead")}</p>
      <div className="space-y-2">
        {CODE_STEPS.map((s, i) => (
          <details key={i} className="card group p-4">
            <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden">
              <span aria-hidden className="mr-2 inline-block text-brand transition group-open:rotate-90">▸</span>{s.title}
            </summary>
            <div className="mt-3 space-y-3 pl-5">
              <p className="text-sm leading-relaxed text-muted">{r(`lab2.code.s${i}`)}</p>
              <pre className="overflow-x-auto rounded-xl border border-line bg-raised p-3 font-mono text-[12px] leading-relaxed" aria-label={tx("lab2.code.codeLabel", { n: i })}>
                {s.code}
              </pre>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
