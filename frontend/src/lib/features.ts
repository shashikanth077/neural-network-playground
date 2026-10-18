export interface Tool {
  id: string;
  title: string;
  tagline: string;
  path: string;
  tags: string[];
}

/** Stand-alone interactive tools (labs live in `src/labs`). Add an entry here plus a route in App.tsx. */
export const TOOLS: Tool[] = [
  {
    id: "playground",
    title: "Neural Network Playground",
    tagline: "Design a network, train it on real data on the server and watch weights, loss and decision boundaries evolve live.",
    path: "/playground",
    tags: ["NumPy backprop", "Live training", "Learning center"],
  },
];
