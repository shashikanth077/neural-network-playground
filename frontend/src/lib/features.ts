export interface Feature {
  id: string;
  title: string;
  tagline: string;
  status: "live" | "roadmap";
  path?: string;
  tags: string[];
}

/** Add a feature here (and a route in App.tsx) and it appears on the home page automatically. */
export const FEATURES: Feature[] = [
  {
    id: "playground",
    title: "Neural Network Playground",
    tagline: "Design a network, train it on real data and watch weights, loss and decision boundaries evolve live.",
    status: "live",
    path: "/playground",
    tags: ["NumPy backprop", "Live training", "Learning center"],
  },
  {
    id: "gradient-landscape",
    title: "Loss Landscape Explorer",
    tagline: "Fly over the loss surface and see how optimizers roll toward minima.",
    status: "roadmap",
    tags: ["Optimization", "3-D"],
  },
  {
    id: "cnn",
    title: "Convolution Lab",
    tagline: "Slide filters over images and inspect feature maps layer by layer.",
    status: "roadmap",
    tags: ["CNN", "Vision"],
  },
  {
    id: "attention",
    title: "Attention Visualizer",
    tagline: "Peek inside a tiny transformer and watch tokens attend to each other.",
    status: "roadmap",
    tags: ["Transformers", "NLP"],
  },
];
