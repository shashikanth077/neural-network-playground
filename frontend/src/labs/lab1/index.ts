import { lazy } from "react";
import type { Lab } from "../types";

/** Lab 1 · From messy data to a working neural network (VGTU, Neural Networks). */
export const lab1: Lab = {
  id: "lab1",
  number: 1,
  domain: "dl",
  title: "From messy data to a working neural network",
  subtitle: "Clean the data, find anomalies, scale the numbers, train a network and read handwritten digits, with a live demo at every step.",
  course: "VGTU · Neural Networks · Laboratory work No. 1",
  status: "live",
  tags: ["Data cleaning", "Anomaly detection", "Backpropagation", "MNIST", "Optimizers"],
  steps: [
    { id: "big-picture", group: "Orientation", minutes: 3, title: "The big picture", summary: "Six tasks, one story: why every step exists.", Component: lazy(() => import("./steps/BigPicture")) },
    { id: "real-world", group: "Orientation", minutes: 4, title: "How it works in the real world", summary: "Hospitals, sports lists and post offices: each task in real life.", Component: lazy(() => import("./steps/RealWorld")) },
    { id: "missing-values", group: "Data preparation", minutes: 5, title: "Task 1 · Missing values", summary: "Estimate a missing height and see why the group matters.", Component: lazy(() => import("./steps/Missing")) },
    { id: "anomalies", group: "Data preparation", minutes: 8, title: "Tasks 2-4 · Anomaly detection", summary: "Z-score, Chauvenet and IQR on 30 children's ages, and how outliers hide.", Component: lazy(() => import("./steps/Anomalies")) },
    { id: "scaling", group: "Data preparation", minutes: 4, title: "Normalization", summary: "Put height and weight on one ruler: min-max vs standardize.", Component: lazy(() => import("./steps/Scaling")) },
    { id: "network", group: "Neural network", minutes: 5, title: "Task 5 · A network you can see", summary: "The 2-2-1 network, its forward pass and its backward pass.", Component: lazy(() => import("./steps/Network")) },
    { id: "train", group: "Neural network", minutes: 8, title: "Train it yourself", summary: "Run real backpropagation in your browser; explore the learning rate.", Component: lazy(() => import("./steps/Train")) },
    { id: "mnist", group: "MNIST", minutes: 10, title: "Task 6 · MNIST digits", summary: "From 784 pixels to 10 probabilities: flatten, network, softmax, overfitting.", Component: lazy(() => import("./steps/Mnist")) },
    { id: "activations", group: "MNIST", minutes: 5, title: "6.2 · Activation functions", summary: "Sigmoid, tanh, relu and their gradients.", Component: lazy(() => import("./steps/Activations")) },
    { id: "optimizers", group: "MNIST", minutes: 6, title: "6.3 · Optimizers and learning rate", summary: "SGD, RMSprop and Adam race down the same valley.", Component: lazy(() => import("./steps/Optimizers")) },
    { id: "results", group: "Wrap-up", minutes: 5, title: "Lab results at a glance", summary: "Tables and charts from the notebook run, with the best model.", Component: lazy(() => import("./steps/Results")) },
    { id: "checklist", group: "Wrap-up", minutes: 3, title: "What you need to learn", summary: "A saved checklist of the concepts behind the lab.", Component: lazy(() => import("./steps/Checklist")) },
    { id: "defense", group: "Wrap-up", minutes: 6, title: "Defense Q&A", summary: "Likely questions with short answers and the numbers to quote.", Component: lazy(() => import("./steps/Defense")) },
  ],
};
