import type { Cheatsheet } from "./types";

/** NLP cheatsheet. Section ids are fixed (the concept map links to them); the content is filled in section by section. */
export const nlpSheet: Cheatsheet = {
  id: "nlp",
  domain: "nlp",
  title: "NLP cheatsheet",
  subtitle: "Tokens, representations, embeddings, language models, sequence models, attention, pre-trained models, metrics and code: natural language processing on one page.",
  status: "live",
  sections: [
    { id: "tasks", title: "1 · NLP task map", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "preprocessing", title: "2 · Text preprocessing", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "representations", title: "3 · Text representations", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "embeddings", title: "4 · Word and sentence embeddings", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "language-models", title: "5 · Language models", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "sequence-models", title: "6 · Sequence models (RNN, LSTM, GRU)", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "attention-intro", title: "7 · Attention in one page", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "pretrained", title: "8 · Pre-trained models", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "metrics", title: "9 · Evaluation metrics", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "hf-code", title: "10 · Hugging Face quick reference", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "data", title: "11 · Datasets and benchmarks", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "choose", title: "12 · Which approach to choose", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "lithuanian", title: "13 · Lithuanian and small languages", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "pitfalls", title: "14 · Pitfalls and quick diagnosis", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
  ],
};
