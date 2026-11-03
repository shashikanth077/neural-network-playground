import { CURVE, DATASET, MODELS, SUBSETS, SUBSET_SIZES } from "../../labs/lab3/data/expModels";

/** Section ids of the page. The first eighteen are fixed (the presentation links to them); `implementation` (§3.1) is an extra. */
export const SECTION_IDS = [
  "intro", "review", "problem", "dataset", "competitors", "criteria", "program", "architecture", "math", "protocol",
  "implementation", "results-overall", "results-cost", "results-data", "results-ready", "results-errors", "results-prev", "conclusions", "references",
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

/** The eighteen ids of the brief, in order (the extra `implementation` removed). */
export const FIXED_IDS = SECTION_IDS.filter((s) => s !== "implementation");

/** Outline: paper number of each section; `chapter` groups the outline (2 = Research methodology, 3 = Practical part). */
export const OUTLINE: { id: SectionId; num: string; chapter: 0 | 1 | 2 | 3 }[] = [
  { id: "intro", num: "", chapter: 0 },
  { id: "review", num: "1", chapter: 1 },
  { id: "problem", num: "2.1", chapter: 2 },
  { id: "dataset", num: "2.2", chapter: 2 },
  { id: "competitors", num: "2.3", chapter: 2 },
  { id: "criteria", num: "2.4", chapter: 2 },
  { id: "program", num: "2.5", chapter: 2 },
  { id: "architecture", num: "2.6", chapter: 2 },
  { id: "math", num: "2.7", chapter: 2 },
  { id: "protocol", num: "2.8", chapter: 2 },
  { id: "implementation", num: "3.1", chapter: 3 },
  { id: "results-overall", num: "3.2", chapter: 3 },
  { id: "results-cost", num: "3.3", chapter: 3 },
  { id: "results-data", num: "3.4", chapter: 3 },
  { id: "results-ready", num: "3.5", chapter: 3 },
  { id: "results-errors", num: "3.6", chapter: 3 },
  { id: "results-prev", num: "3.7", chapter: 3 },
  { id: "conclusions", num: "", chapter: 0 },
  { id: "references", num: "", chapter: 0 },
];

/** Table 3 (paper): data splits (typed from the paper; the Lab 3 data module keeps train and test statistics only, which are cross-checked in the tests). */
export const TABLE3 = [
  { split: "tp.t3.split.train", source: "tp.t3.src.train", size: 65349, pos: 55.8, len: 9.4 },
  { split: "tp.t3.split.dev", source: "tp.t3.src.dev", size: 2000, pos: 55.8, len: 9.6 },
  { split: "tp.t3.split.test", source: "tp.t3.src.test", size: 872, pos: 50.9, len: 19.5 },
] as const;

/** Table 4 (paper): the ten competitors. `params` is the text printed in the paper. */
export const TABLE4: { family: "classical" | "recurrent" | "ft" | "ready" | "zs"; model: string; pre: boolean; trained: string; params: string; tag: string }[] = [
  { family: "classical", model: "TF-IDF + Multinomial Naive Bayes", pre: false, trained: "65k", params: "0.1 M*", tag: "tfidf_nb" },
  { family: "classical", model: "TF-IDF + Logistic Regression", pre: false, trained: "65k", params: "74 k*", tag: "tfidf_logreg" },
  { family: "classical", model: "TF-IDF + Linear SVM", pre: false, trained: "65k", params: "74 k*", tag: "tfidf_svm" },
  { family: "recurrent", model: "BiLSTM, random embeddings", pre: false, trained: "65k", params: "2.0 M", tag: "bilstm" },
  { family: "ft", model: "BERT-tiny (Turc et al., 2019)", pre: true, trained: "8k", params: "4.4 M", tag: "ft_bert-tiny_8000" },
  { family: "ft", model: "BERT-small (Turc et al., 2019)", pre: true, trained: "8k", params: "28.8 M", tag: "ft_bert-small_8000" },
  { family: "ft", model: "DistilBERT-base-uncased", pre: true, trained: "8k", params: "67.0 M", tag: "ft_distilbert_8000" },
  { family: "ready", model: "DistilBERT fine-tuned on SST-2 (public)", pre: true, trained: "", params: "67.0 M", tag: "pt_distilbert_sst2" },
  { family: "ready", model: "Twitter-RoBERTa sentiment (public)", pre: true, trained: "", params: "124.6 M", tag: "pt_twitter_roberta" },
  { family: "zs", model: "NLI DistilRoBERTa cross-encoder", pre: true, trained: "", params: "82.1 M", tag: "zs_nli_distilroberta" },
];

/** Table 5 (paper): fine-tuning hyper-parameters, columns BERT-tiny, BERT-small, DistilBERT. */
export const TABLE5: { key: string; v: [string, string, string] }[] = [
  { key: "tp.t5.r.arch", v: ["2 / 128 / 2", "4 / 512 / 8", "6 / 768 / 12"] },
  { key: "tp.t5.r.n", v: ["8 000", "8 000", "8 000"] },
  { key: "tp.t5.r.epochs", v: ["3", "3", "2"] },
  { key: "tp.t5.r.lr", v: ["2·10⁻⁴", "1·10⁻⁴", "5·10⁻⁵"] },
  { key: "tp.t5.r.batch", v: ["32 / 64", "32 / 64", "32 / 64"] },
  { key: "tp.t5.r.warm", v: ["10% / linear", "10% / linear", "10% / linear"] },
  { key: "tp.t5.r.wd", v: ["0.01 / 1.0", "0.01 / 1.0", "0.01 / 1.0"] },
];

/** Table 2 (paper): reviewed works. Authors are kept as printed; the other three cells are translated (`tp.t2.<i>.model|task|result`). */
export const TABLE2_AUTHORS = [
  "Socher et al. (2013)", "Vaswani et al. (2017)", "Devlin et al. (2019)", "Liu et al. (2019)", "Sanh et al. (2019)", "Turc et al. (2019)", "Yin et al. (2019)",
  "Brown et al. (2020)", "Kapočiūtė-Dzikienė et al. (2019)", "Ulčar & Robnik-Šikonja (2021)", "Vileikytė et al. (2024)", "Nakvosas et al. (2024)", "Zhang et al. (2024)",
];

/** p-value text as printed in the paper's Table 7. */
export const fmtP7 = (p: number) => (p < 0.001 ? "< 0.001" : p.toFixed(3));

export { CURVE, DATASET, MODELS, SUBSETS, SUBSET_SIZES };
