import type { DomainId } from "../labs/domains";

/** A stand-alone interactive app (labs are guided step paths and live in `src/labs`). */
export interface Tool {
  id: string;
  domain: DomainId;
  title: string;
  tagline: string;
  path: string;
  tags: string[];
  /** Needs the FastAPI backend (false = runs entirely in the browser). */
  needsBackend: boolean;
}

/** Add an entry here plus a route in App.tsx and it appears in the Tools menu, Tools page and home. */
export const TOOLS: Tool[] = [
  {
    id: "playground",
    domain: "dl",
    title: "Neural Network Playground",
    tagline: "Design a network, train it on real data on the server and watch weights, loss and decision boundaries evolve live.",
    path: "/playground",
    tags: ["NumPy backprop", "Live training", "Learning center"],
    needsBackend: true,
  },
  {
    id: "convolution",
    domain: "dl",
    title: "Convolution Explorer",
    tagline: "Slide kernels over an image with stride, padding, ReLU and pooling, then size the lecture's MNIST CNN layer by layer.",
    path: "/tools/convolution",
    tags: ["Kernels", "Receptive field", "Pooling", "Parameter count"],
    needsBackend: false,
  },
  {
    id: "recurrent",
    domain: "dl",
    title: "Recurrent Cell Explorer",
    tagline: "Run a SimpleRNN, LSTM or GRU over a short sequence and watch the state and every gate at each step.",
    path: "/tools/recurrent",
    tags: ["RNN", "LSTM", "GRU", "Gates"],
    needsBackend: false,
  },
  {
    id: "transformers",
    domain: "nlp",
    title: "Transformers in NLP: the project paper, end to end",
    tagline: "How a Transformer works and what ten sentiment classifiers show on a laptop CPU, section by section as in the paper, with every figure and number live, plus the presentation.",
    path: "/tools/transformers",
    tags: ["Paper", "Self-attention", "SST-2", "Presentation"],
    needsBackend: false,
  },
];
