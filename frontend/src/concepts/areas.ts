import type { Area } from "./types";

/** The concept map is grouped by area. Add an area here and concepts can use it. */
export const AREAS: Area[] = [
  { id: "data", title: "Data", glyph: "🗂️", blurb: "Get the numbers ready: missing values, outliers, scaling and honest splits." },
  { id: "core", title: "Neural network core", glyph: "🧠", blurb: "Neurons, layers, activations and the forward pass." },
  { id: "training", title: "Training", glyph: "⚙️", blurb: "Loss, gradients, backpropagation, optimizers and the learning rate." },
  { id: "generalisation", title: "Generalisation & evaluation", glyph: "🎯", blurb: "Over- and under-fitting, regularisation, validation and metrics." },
  { id: "vision", title: "Vision (CNN)", glyph: "🖼️", blurb: "Convolution, pooling and why CNNs need fewer parameters." },
  { id: "sequences", title: "Language & sequences", glyph: "💬", blurb: "Text as numbers, embeddings, Conv1D, recurrent cells and Transformers." },
  { id: "advanced", title: "Beyond the basics", glyph: "🚀", blurb: "Very deep nets, augmentation, autoencoders, generative models and more. Planned." },
  { id: "engineering", title: "From Python to a product", glyph: "🏗️", blurb: "Environments, saving models, APIs, databases and deployment." },
];

export const getArea = (id: string) => AREAS.find((a) => a.id === id)!;
