import { lazy } from "react";
import type { Lab } from "../types";
import { GuideIntro, GuideOutro } from "./StepGuide";
import { lab3Setup } from "./setup";

/**
 * Lab 3 · Transformers in NLP (VGTU group project: Shashikanth Hosur Ramegowda, Shaeed Khan, Rimsha Tariq).
 * Theory steps live in `theory/` and the experiment steps in `experiment/`; the real data comes from the team's
 * public repository (github.com/shashikanth077/Transformers-NLP).
 */
export const lab3: Lab = {
  id: "lab3",
  number: 3,
  domain: "nlp",
  title: "Transformers in NLP: from attention to a ten-model comparison",
  subtitle: "How a Transformer works, step by step, and what it really buys you for sentiment analysis: ten models compared on quality, cost, data efficiency and difficult sentences.",
  course: "VGTU · Engineering of Artificial Intelligence · Group project",
  status: "live",
  setup: lab3Setup,
  tags: ["Self-attention", "BERT", "DistilBERT", "SST-2", "Fine-tuning", "Zero-shot"],
  Intro: GuideIntro,
  Outro: GuideOutro,
  steps: [
    { id: "overview", group: "Orientation", minutes: 5, title: "Why Transformers, and what this lab asks", summary: "The research problem, five research questions and the ten models at a glance.", Component: lazy(() => import("./theory/Overview")) },
    { id: "history", group: "Orientation", minutes: 5, title: "From word vectors to the Transformer", summary: "Static vectors, attention, ELMo and ULMFiT, then the three Transformer families.", Component: lazy(() => import("./theory/History")) },
    { id: "tokens", group: "Architecture", minutes: 6, title: "Tokens and embeddings", summary: "WordPiece sub-words, [CLS] and [SEP], and the embedding lookup.", Component: lazy(() => import("./theory/Tokens")) },
    { id: "position", group: "Architecture", minutes: 5, title: "Positional encoding", summary: "Attention ignores order, so position is added: sinusoids and learned vectors.", Component: lazy(() => import("./theory/Position")) },
    { id: "attention", group: "Architecture", minutes: 8, title: "Scaled dot-product attention", summary: "Queries, keys and values with editable numbers, plus real DistilBERT attention maps.", Component: lazy(() => import("./theory/Attention")) },
    { id: "heads", group: "Architecture", minutes: 6, title: "Multi-head attention", summary: "Several attention functions in parallel, each looking for a different relation.", Component: lazy(() => import("./theory/Heads")) },
    { id: "encoder", group: "Architecture", minutes: 8, title: "The encoder block and its parameters", summary: "Feed-forward layer, residual connections, layer normalisation, and a parameter counter checked against the real models.", Component: lazy(() => import("./theory/Encoder")) },
    { id: "complexity", group: "Architecture", minutes: 5, title: "Cost of attention against recurrence", summary: "O(n\u00b2\u00b7d) against O(n\u00b7d\u00b2), and why parallel beats sequential for sentences.", Component: lazy(() => import("./theory/Complexity")) },
    { id: "training", group: "Architecture", minutes: 8, title: "Pre-training, fine-tuning and AdamW", summary: "Masked language modelling, the classification head, and the warm-up and decay schedule.", Component: lazy(() => import("./theory/Training")) },
    { id: "baselines", group: "Experiment", minutes: 8, title: "The classical and recurrent baselines", summary: "TF-IDF, naive Bayes, logistic regression, linear SVM and the BiLSTM, with real weights.", Component: lazy(() => import("./experiment/Baselines")) },
    { id: "design", group: "Experiment", minutes: 7, title: "Experiment design", summary: "SST-2 splits, the ten competitors, the criteria and the threats to validity.", Component: lazy(() => import("./experiment/Design")) },
    { id: "results", group: "Experiment", minutes: 9, title: "Results of the ten models", summary: "Accuracy, bootstrap confidence intervals and McNemar tests, recomputed from the real predictions.", Component: lazy(() => import("./experiment/Results")) },
    { id: "cost", group: "Experiment", minutes: 6, title: "Cost: time, latency and size", summary: "What the accuracy costs on a CPU: training time, latency per sentence and parameters.", Component: lazy(() => import("./experiment/Cost")) },
    { id: "efficiency", group: "Experiment", minutes: 7, title: "Data efficiency", summary: "Learning curves: how many labelled sentences each approach needs.", Component: lazy(() => import("./experiment/Efficiency")) },
    { id: "readymade", group: "Experiment", minutes: 6, title: "Ready-made and zero-shot models", summary: "Reuse a public model, or classify with natural-language inference and no labels.", Component: lazy(() => import("./experiment/ReadyMade")) },
    { id: "errors", group: "Experiment", minutes: 9, title: "Negation, contrast and the sentence lab", summary: "Where models fail, and every test sentence with every model's answer.", Component: lazy(() => import("./experiment/Errors")) },
    { id: "decide", group: "Experiment", minutes: 5, title: "Which model would you choose?", summary: "A decision helper that turns the paper's recommendations into questions.", Component: lazy(() => import("./experiment/Decide")) },
    { id: "code", group: "Wrap-up", minutes: 8, title: "Code walkthrough", summary: "The nine scripts of the experiment, one by one, with the real code.", Component: lazy(() => import("./experiment/CodeWalk")) },
    { id: "checklist", group: "Wrap-up", minutes: 3, title: "What you need to learn", summary: "A saved checklist of the concepts behind the lab.", Component: lazy(() => import("./experiment/Checklist")) },
    { id: "defense", group: "Wrap-up", minutes: 6, title: "Defense Q&A", summary: "Likely questions with short answers and the numbers to quote.", Component: lazy(() => import("./experiment/Defense")) },
  ],
};
