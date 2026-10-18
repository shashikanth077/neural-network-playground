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
];
