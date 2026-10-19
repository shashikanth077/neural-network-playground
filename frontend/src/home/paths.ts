/**
 * Curated learning paths: ordered concept ids from the concept registry.
 * Add a path here (and its `homev2.path.<id>.*` texts) and it appears on the home page.
 * A test checks that every id exists and that each path has translations.
 */
export interface LearningPath { id: string; concepts: string[] }

export const PATHS: LearningPath[] = [
  { id: "nn-basics", concepts: ["neuron", "activation", "forward-pass", "softmax-output", "loss", "gradient-descent", "backprop"] },
  { id: "training", concepts: ["learning-rate", "batches-epochs", "optimizers", "over-underfitting", "l1-l2", "dropout", "early-stopping"] },
  { id: "vision-sequences", concepts: ["convolution", "padding-stride", "pooling", "cnn-parameters", "text-encoding", "conv1d", "recurrent-cells"] },
];
