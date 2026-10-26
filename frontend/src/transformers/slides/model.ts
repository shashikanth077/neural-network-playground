/**
 * The structure of the presentation and every number shown on the slides.
 * Numbers are never typed in here: they are computed from the recorded results of Lab 3 (labs/lab3/data/expModels.ts),
 * so the slides, the paper page and the lab cannot drift apart. The tests compare them with the original deck.
 */
import { CURVE, DATASET, MODELS, SUBSETS, type Family, type ModelRec } from "../../labs/lab3/data/expModels";

export type Presenter = "shashikanth" | "shaeed";

export interface SlideMeta {
  n: number;
  id: string;
  /** Rows `ts.<id>.title` and `ts.<id>.notes`. */
  presenter: Presenter;
  /** Seconds planned for this slide, from the speaker notes of the deck ("≈45 s"). */
  budget: number;
  /** Section id of the paper page this slide links to (null = top of the paper). */
  paper: string | null;
}

export const SLIDES: SlideMeta[] = [
  { n: 1, id: "s1", presenter: "shashikanth", budget: 30, paper: null },
  { n: 2, id: "s2", presenter: "shashikanth", budget: 45, paper: "architecture" },
  { n: 3, id: "s3", presenter: "shashikanth", budget: 60, paper: "architecture" },
  { n: 4, id: "s4", presenter: "shaeed", budget: 60, paper: "review" },
  { n: 5, id: "s5", presenter: "shaeed", budget: 45, paper: "competitors" },
  { n: 6, id: "s6", presenter: "shashikanth", budget: 40, paper: "program" },
  { n: 7, id: "s7", presenter: "shashikanth", budget: 60, paper: "results-overall" },
  { n: 8, id: "s8", presenter: "shashikanth", budget: 45, paper: "results-cost" },
  { n: 9, id: "s9", presenter: "shaeed", budget: 50, paper: "results-data" },
  { n: 10, id: "s10", presenter: "shaeed", budget: 45, paper: "results-errors" },
  { n: 11, id: "s11", presenter: "shaeed", budget: 60, paper: "conclusions" },
];

export const SLIDE_COUNT = SLIDES.length;
export const TOTAL_BUDGET = SLIDES.reduce((s, x) => s + x.budget, 0);
/** The talk should last 7 to 10 minutes. */
export const TARGET_MIN = 7 * 60;
export const TARGET_MAX = 10 * 60;

export const PRESENTER_NAME: Record<Presenter, string> = { shashikanth: "Shashikanth", shaeed: "Shaeed" };

/** Where "Read the full explanation" leads. */
export const paperHref = (m: SlideMeta) => (m.paper ? `/tools/transformers#${m.paper}` : "/tools/transformers");

// ---------------------------------------------------------------------------------------------------- numbers
export const byTag = (tag: string): ModelRec => {
  const m = MODELS.find((x) => x.tag === tag);
  if (!m) throw new Error(`unknown model ${tag}`);
  return m;
};

/** One decimal, as printed on the slides (88.76... -> "88.8"). */
export const p1 = (acc: number) => (acc * 100).toFixed(1);

const FT = byTag("ft_distilbert_8000"), SVM = byTag("tfidf_svm"), LSTM = byTag("bilstm"), ZS = byTag("zs_nli_distilroberta"), SST2 = byTag("pt_distilbert_sst2");

/** Best classical model = highest accuracy among the classical family. */
export const BEST_CLASSICAL = MODELS.filter((m) => m.family === "classical").reduce((a, b) => (b.accuracy > a.accuracy ? b : a));

/**
 * The gain on the slide: difference of the two numbers AS PRINTED (88.8 - 82.9 = 5.9). The unrounded difference is
 * 5.85 points, which rounds to 5.8 or 5.9 depending on how it is computed, so the printed figures are subtracted.
 */
export const GAIN = Math.round((Number(p1(FT.accuracy)) - Number(p1(BEST_CLASSICAL.accuracy))) * 10) / 10;

/** "x710": inference latency of fine-tuned DistilBERT divided by that of the TF-IDF + linear SVM. */
export const LATENCY_RATIO = Math.round(FT.latencyMs / SVM.latencyMs);

export const HEADLINE = {
  ft: p1(FT.accuracy), svm: p1(BEST_CLASSICAL.accuracy), lstm: p1(LSTM.accuracy), zs: p1(ZS.accuracy), sst2: p1(SST2.accuracy),
  gain: GAIN.toFixed(1), ratio: LATENCY_RATIO, ftLatency: FT.latencyMs.toFixed(0),
};

/** "65k / 2k / 872". */
export const SPLITS = `${Math.round(DATASET.train / 1000)}k / ${Math.round(DATASET.dev / 1000)}k / ${DATASET.test}`;

// ---------------------------------------------------------------------------------------------------- formatting for the table
export function fmtTrain(m: ModelRec): string {
  if (m.trainSeconds <= 0) return "–";
  if (m.trainSeconds < 60) return `${Math.round(m.trainSeconds)} s`;
  if (m.trainSeconds < 3600) return `${Math.round(m.trainSeconds / 60)} min`;
  return `${(m.trainSeconds / 3600).toFixed(1)} h`;
}
export const fmtLat = (ms: number) => (ms < 1 ? ms.toFixed(2) : ms.toFixed(1));
export const fmtParam = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} M` : `${Math.round(n / 1e3)} k`);

/** The seven rows of the cost table of the deck, in its order. */
export const COST_TAGS = ["tfidf_svm", "bilstm", "ft_bert-tiny_8000", "ft_bert-small_8000", "ft_distilbert_8000", "pt_distilbert_sst2", "zs_nli_distilroberta"];
export const COST_ROWS = COST_TAGS.map((t) => {
  const m = byTag(t);
  return { tag: t, name: m.name, family: m.family, acc: p1(m.accuracy), train: fmtTrain(m), latency: fmtLat(m.latencyMs), params: fmtParam(m.params) };
});
/** Range of the fine-tuning times on the laptop (BERT-tiny to DistilBERT): "2 min" to "2.6 h". */
export const FT_TIMES = (() => {
  const ft = MODELS.filter((m) => m.kind === "transformer-finetuned").sort((a, b) => a.trainSeconds - b.trainSeconds);
  return { lo: fmtTrain(ft[0]), hi: fmtTrain(ft[ft.length - 1]) };
})();

/** The ten models sorted by accuracy for the bar chart of slide 7. */
export const RANKING = MODELS.slice().sort((a, b) => b.accuracy - a.accuracy);

// ---------------------------------------------------------------------------------------------------- slide 9 and 10 data
export const CURVE_SMALL = CURVE["bert-small"], CURVE_LR = CURVE["tfidf-lr"];
const at = (rows: { n: number; accuracy: number }[], n: number) => rows.find((r) => r.n === n)!.accuracy;
export const DATA_EFF = {
  small4000: p1(at(CURVE_SMALL, 4000)),
  /** Percentage points between BERT-small and TF-IDF LR with 500 labels. */
  gap500: Math.round((at(CURVE_SMALL, 500) - at(CURVE_LR, 500)) * 100),
};

export const SUBSET_TAGS = ["tfidf_svm", "bilstm", "ft_distilbert_8000", "pt_distilbert_sst2"];
export const SUBSET_ROWS = SUBSET_TAGS.map((t) => ({ tag: t, name: byTag(t).short, ...SUBSETS[t] }));

export const FAMILY_ORDER: Family[] = ["classical", "recurrent", "transformer"];

/** The decorative 4 x 4 attention tile of the title slide (opacity in %, as in the deck): "not good but great". */
export const TITLE_TILE = [[95, 56, 8, 8], [95, 48, 8, 8], [16, 32, 48, 64], [8, 8, 48, 95]];
export const TITLE_WORDS = ["not", "good", "but", "great"];
