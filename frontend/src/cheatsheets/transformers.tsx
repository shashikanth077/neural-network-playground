import type { Cheatsheet } from "./types";

/** Transformers cheatsheet. Section ids are fixed (the concept map links to them); the content is filled in section by section. */
export const transformersSheet: Cheatsheet = {
  id: "transformers",
  domain: "nlp",
  title: "Transformers cheatsheet",
  subtitle: "The Transformer end to end: tokens, attention, the encoder block, parameter counts, pre-training, fine-tuning, cost and evaluation.",
  status: "live",
  sections: [
    { id: "big-picture", title: "1 · The Transformer in one picture", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "tokens", title: "2 · Tokens and embeddings", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "positions", title: "3 · Positional encoding", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "attention", title: "4 · Scaled dot-product attention", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "multihead", title: "5 · Multi-head attention", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "block", title: "6 · The encoder block", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "params", title: "7 · Shapes and parameter counts", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "complexity", title: "8 · Complexity", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "objectives", title: "9 · Pre-training objectives", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "families", title: "10 · Model families", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "finetune", title: "11 · Fine-tuning recipe", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "optimizer", title: "12 · AdamW, warm-up and clipping", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "cost", title: "13 · Cost on a CPU (measured)", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "evaluation", title: "14 · Evaluating honestly", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "hf-code", title: "15 · Hugging Face quick reference", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "pitfalls", title: "16 · Pitfalls and quick diagnosis", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
    { id: "glossary", title: "17 · Glossary", keywords: "", render: () => <p className="text-sm text-muted">This section is being written.</p> },
  ],
};
