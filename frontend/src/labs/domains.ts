/**
 * The areas AI Lab covers. Every lab and tool belongs to exactly one domain.
 * To add a domain, add an entry here; filters, menus and the home page pick it up.
 * Tailwind class names are written out in full so the compiler can see them.
 */
export type DomainId = "ml" | "dl" | "nlp";

export interface Domain {
  id: DomainId;
  name: string;
  short: string;
  blurb: string;
  glyph: string;
  text: string;
  tint: string;
  ring: string;
}

export const DOMAINS: Domain[] = [
  {
    id: "ml", name: "Machine Learning", short: "ML", glyph: "📊",
    blurb: "Learn patterns from data with classical models: preparing data, regression, classification and honest evaluation.",
    text: "text-c-teal", tint: "bg-c-teal/10", ring: "border-c-teal/40",
  },
  {
    id: "dl", name: "Deep Learning", short: "DL", glyph: "🧠",
    blurb: "Build and train neural networks: backpropagation, optimizers, convolutions and what happens inside the layers.",
    text: "text-brand", tint: "bg-brand/10", ring: "border-brand/40",
  },
  {
    id: "nlp", name: "Natural Language Processing", short: "NLP", glyph: "💬",
    blurb: "Teach machines to work with text: tokens, embeddings, sequence models and attention.",
    text: "text-c-purple", tint: "bg-c-purple/10", ring: "border-c-purple/40",
  },
];

export const getDomain = (id: DomainId) => DOMAINS.find((d) => d.id === id)!;
