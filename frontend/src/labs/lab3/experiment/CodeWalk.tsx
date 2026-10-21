import { useMemo, useState } from "react";
import { Callout, Demo } from "../../ui";
import { CODE_FILES } from "../data/expCode";
import { useR, useTx } from "../rich";
import { INPUT } from "./shared";

/** Translation id of every file: rows lab3.e.cd.<id>.d (what it does), .r (reads) and .w (writes). */
const ID: Record<string, string> = {
  "01_prepare_data.py": "f1", "02_classical_baselines.py": "f2", "03_bilstm.py": "f3", "04_finetune_transformer.py": "f4",
  "05_pretrained_transformers.py": "f5", "06_learning_curve_classical.py": "f6", "07_attention_visualisation.py": "f7",
  "08_report.py": "f8", "09_diagrams.py": "f9", "utils.py": "fu", "run_all.sh": "fr", "requirements.txt": "fq",
};
const MAX_HITS = 30;

export default function CodeWalk() {
  const r = useR();
  const tx = useTx();
  const [q, setQ] = useState("");
  const pyLines = CODE_FILES.filter((f) => f.lang === "py").reduce((n, f) => n + f.lines, 0);
  const runAll = CODE_FILES.find((f) => f.file === "run_all.sh")!;
  const commands = useMemo(() => runAll.code.split("\n").filter((l) => /\$PY |^for |^cp /.test(l.trim())).map((l) => l.trim()), [runAll]);
  const hits = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [];
    const out: { file: string; line: number; text: string }[] = [];
    for (const f of CODE_FILES) f.code.split("\n").forEach((text, i) => { if (text.toLowerCase().includes(needle)) out.push({ file: f.file, line: i + 1, text }); });
    return out;
  }, [q]);
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{r("lab3.e.cd.lead", { lines: pyLines })}</p>
      <Demo title={tx("lab3.e.cd.facts.title")}>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
          <li>{r("lab3.e.cd.facts.0")}</li>
          <li>{r("lab3.e.cd.facts.1")}</li>
          <li>{r("lab3.e.cd.facts.2")}</li>
          <li>{r("lab3.e.cd.facts.3")}</li>
        </ul>
      </Demo>
      <Demo title={tx("lab3.e.cd.order.title")}>
        <p className="text-sm leading-relaxed text-muted">{r("lab3.e.cd.order.lead")}</p>
        <ol className="mt-3 list-decimal space-y-1 pl-6 font-mono text-[12px] leading-relaxed sm:text-[13px]" data-testid="cd-order">
          {commands.map((c) => <li key={c} className="break-words">{c}</li>)}
        </ol>
        <p className="mt-3 text-sm leading-relaxed text-muted">{r("lab3.e.cd.order.note")}</p>
      </Demo>
      <Demo title={tx("lab3.e.cd.find.title")}>
        <label htmlFor="cd-find" className="block text-xs font-medium text-muted">{tx("lab3.e.cd.find.label")}</label>
        <input id="cd-find" data-testid="cd-find" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="AdamW, predictions, hypothesis_template" className={`${INPUT} mt-1`} spellCheck={false} />
        {q.trim().length >= 2 && (
          <div role="status" aria-live="polite" className="mt-3 text-sm" data-testid="cd-hits">
            <p className="font-semibold">{tx("lab3.e.cd.find.count", { n: hits.length })}</p>
            <ul className="mt-1 space-y-0.5 font-mono text-[12px]">
              {hits.slice(0, MAX_HITS).map((h) => (
                <li key={h.file + h.line} className="break-words"><span className="text-brand">{h.file}:{h.line}</span> <span className="text-muted">{h.text.trim()}</span></li>
              ))}
            </ul>
          </div>
        )}
      </Demo>
      <div className="space-y-2">
        {CODE_FILES.map((f) => (
          <details key={f.file} className="card group p-4" data-file={f.file}>
            <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden">
              <span aria-hidden className="mr-2 inline-block text-brand transition group-open:rotate-90">▸</span>
              <span className="font-mono">{f.file}</span> <span className="ml-1 text-xs font-normal text-muted">{tx("lab3.e.cd.lines", { n: f.lines })}</span>
            </summary>
            <div className="mt-3 space-y-3 pl-5">
              <p className="text-sm leading-relaxed text-muted">{r(`lab3.e.cd.${ID[f.file]}.d`)}</p>
              <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
                <dt className="font-semibold">{tx("lab3.e.cd.reads")}</dt><dd className="text-muted">{r(`lab3.e.cd.${ID[f.file]}.r`)}</dd>
                <dt className="font-semibold">{tx("lab3.e.cd.writes")}</dt><dd className="text-muted">{r(`lab3.e.cd.${ID[f.file]}.w`)}</dd>
              </dl>
              <pre className="max-h-[28rem] overflow-auto rounded-xl border border-line bg-raised p-3 font-mono text-[12px] leading-relaxed" aria-label={tx("lab3.e.cd.codeLabel", { file: f.file })}>{f.code}</pre>
            </div>
          </details>
        ))}
      </div>
      <Callout tone="warn" title={tx("lab3.e.cd.honest.title")}>{r("lab3.e.cd.honest.body")}</Callout>
    </div>
  );
}
