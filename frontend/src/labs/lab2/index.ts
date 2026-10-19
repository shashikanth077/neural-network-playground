import { lazy } from "react";
import type { Lab } from "../types";
import { GuideIntro, GuideOutro } from "./StepGuide";

/** Lab 2 · Convolutional and recurrent networks in Keras (VGTU, Neural Networks). */
export const lab2: Lab = {
  id: "lab2",
  number: 2,
  domain: "dl",
  title: "Convolutional and recurrent networks in Keras",
  subtitle: "Digits and reviews: draw a digit, follow a convolution, count parameters, step through an LSTM and read the recorded Keras results.",
  course: "VGTU · Neural Networks · Laboratory work No. 2",
  status: "live",
  tags: ["Conv2D", "Pooling", "MNIST", "Embedding", "Conv1D", "LSTM / GRU"],
  Intro: GuideIntro,
  Outro: GuideOutro,
  steps: [
    { id: "pipeline", group: "Orientation", minutes: 4, title: "The whole pipeline", summary: "Ten stages from MNIST to the final comparison, and where each one lives in the code.", Component: lazy(() => import("./steps/Pipeline")) },
    { id: "digit", group: "Images (Task 1)", minutes: 6, title: "Task 1 · From a drawing to a 28 × 28 input", summary: "Draw a digit and watch the four preprocessing stages.", Component: lazy(() => import("./steps/Digit")) },
    { id: "conv", group: "Images (Task 1)", minutes: 6, title: "Task 1 · What a Conv2D layer does", summary: "A 3 × 3 kernel slides over the picture: edges, blur and the hover calculation.", Component: lazy(() => import("./steps/ConvStep")) },
    { id: "pool", group: "Images (Task 1)", minutes: 4, title: "Pooling: max against average", summary: "2 × 2 blocks with editable cells.", Component: lazy(() => import("./steps/PoolStep")) },
    { id: "params", group: "Images (Task 1)", minutes: 5, title: "Why a CNN has fewer parameters", summary: "Count the lab's CNN and compare it with the Dense network of Lab 1.", Component: lazy(() => import("./steps/ParamsStep")) },
    { id: "learning", group: "Images (Task 1)", minutes: 5, title: "Learning rate and epochs", summary: "Gradient descent on w²: too small, right, or too large.", Component: lazy(() => import("./steps/LearningStep")) },
    { id: "text", group: "Text (Task 2)", minutes: 6, title: "Task 2 · Text as numbers", summary: "Word numbers, one-hot vectors and embeddings for one review.", Component: lazy(() => import("./steps/TextEncoding")) },
    { id: "conv1d", group: "Text (Task 2)", minutes: 5, title: "Task 2.2 · Conv1D on text", summary: "A filter of width k reads neighbouring words; global max pooling keeps the strongest match.", Component: lazy(() => import("./steps/Conv1DText")) },
    { id: "rnn", group: "Text (Task 2)", minutes: 6, title: "Task 2.3 · Inside an LSTM and a GRU", summary: "Step a toy cell word by word and watch its gates.", Component: lazy(() => import("./steps/RnnCell")) },
    { id: "results", group: "Wrap-up", minutes: 6, title: "Results of the recorded run", summary: "The tables from the Keras run, with the best model of each task.", Component: lazy(() => import("./steps/Results")) },
    { id: "code", group: "Wrap-up", minutes: 8, title: "Code walkthrough", summary: "The 17 cells of lab2.py, one by one.", Component: lazy(() => import("./steps/CodeWalk")) },
    { id: "checklist", group: "Wrap-up", minutes: 3, title: "What you need to learn", summary: "A saved checklist of the concepts behind the lab.", Component: lazy(() => import("./steps/Checklist")) },
    { id: "defense", group: "Wrap-up", minutes: 6, title: "Defense Q&A", summary: "Likely questions with short answers and the numbers to quote.", Component: lazy(() => import("./steps/Defense")) },
  ],
};
