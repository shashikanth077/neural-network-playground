import { CURVE } from "../data/expModels";
import { byTag, curveAt, memoryMB } from "../expMath";
import { useR, useTx } from "../rich";
import { fmtMs, pct } from "./shared";

/** The question numbers, in order (keys lab3.e.df.q<i> / lab3.e.df.a<i>). */
const QUESTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export default function Defense() {
  const r = useR();
  const tx = useTx();
  const svm = byTag("tfidf_svm"), ft = byTag("ft_distilbert_8000"), sst2 = byTag("pt_distilbert_sst2"), small = byTag("ft_bert-small_8000");
  const vars = {
    ft: pct(ft.accuracy), svm: pct(svm.accuracy), sst2: pct(sst2.accuracy), tiny: pct(byTag("ft_bert-tiny_8000").accuracy),
    small: pct(small.accuracy), lstm: pct(byTag("bilstm").accuracy), zs: pct(byTag("zs_nli_distilroberta").accuracy), tw: pct(byTag("pt_twitter_roberta").accuracy),
    lr: pct(byTag("tfidf_logreg").accuracy),
    latSvm: fmtMs(svm.latencyMs), latFt: fmtMs(ft.latencyMs), latZs: fmtMs(byTag("zs_nli_distilroberta").latencyMs), latLstm: fmtMs(byTag("bilstm").latencyMs),
    hFt: (ft.trainSeconds / 3600).toFixed(1), minSmall: (small.trainSeconds / 60).toFixed(0), minLstm: (byTag("bilstm").trainSeconds / 60).toFixed(1),
    g500: ((curveAt("bert-small", 500) - curveAt("tfidf-lr", 500)) * 100).toFixed(1),
    b4: pct(CURVE["bert-small"][3].accuracy), mem: memoryMB(byTag("pt_twitter_roberta").params).toFixed(0), memTiny: memoryMB(byTag("ft_bert-tiny_8000").params).toFixed(0),
    drop: ((byTag("pt_distilbert_sst2").accuracy - byTag("pt_twitter_roberta").accuracy) * 100).toFixed(1),
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{r("lab3.e.df.lead")}</p>
      <div className="space-y-2">
        {QUESTIONS.map((i) => (
          <details key={i} className="card group p-4">
            <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden">
              <span aria-hidden className="mr-2 inline-block text-brand transition group-open:rotate-90">▸</span>{tx(`lab3.e.df.q${i}`)}
            </summary>
            <p className="mt-2 pl-5 text-sm leading-relaxed text-muted">{r(`lab3.e.df.a${i}`, vars)}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
