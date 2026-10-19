import type { Concept, Evidence } from "./types";

const L1 = (step: string): Evidence => ({ kind: "lab", lab: "lab1", step });
const L2 = (step: string): Evidence => ({ kind: "lab", lab: "lab2", step });
const learn = (topic: string): Evidence => ({ kind: "learn", topic });
const sheet = (section: string): Evidence => ({ kind: "sheet", sheet: "neural-network", section });
const pg = (section: Extract<Evidence, { kind: "playground" }>["section"], note: string): Evidence => ({ kind: "playground", section, note });
const exp = (id: string): Evidence => ({ kind: "experiment", id });

/**
 * Every AI concept the platform teaches, with the places that cover it.
 * Add a concept here (with real evidence links) and it appears in the concept map, its own page and the coverage report.
 * `evidence: []` means planned; the coverage test keeps these honest.
 */
export const CONCEPTS: Concept[] = [
  // ------------------------------------------------------------------ data
  {
    id: "missing-values", area: "data", level: "beginner", title: "Missing values",
    summary: "Real tables have gaps. Imputation replaces a missing value by a guess such as the mean or median of a sensible group.",
    why: "A model cannot read a blank. A careless guess (the mean of everybody) can add ten centimetres of error to a person's height.",
    tryIt: "In Lab 1, estimate the missing height of Name 11 using the same-gender group and then everyone, and compare the error.",
    needs: [], evidence: [L1("missing-values")],
  },
  {
    id: "outliers", area: "data", level: "beginner", title: "Anomalies and outliers",
    summary: "Z-score, Chauvenet's criterion and the IQR rule flag values that do not fit the rest of the data.",
    why: "One wild value can drag a mean, stretch a scale and mislead training. Each rule fails in a different way, and outliers can hide each other (masking).",
    tryIt: "Edit the 30 ages in Lab 1 and watch which of the three methods still catches the suspicious value.",
    needs: [], evidence: [L1("anomalies")],
  },
  {
    id: "scaling", area: "data", level: "beginner", title: "Normalisation and scaling",
    summary: "Min-max scaling squeezes a feature into [0, 1]; standardisation gives it mean 0 and standard deviation 1.",
    why: "Features in different units (centimetres and kilograms) make training slow and unstable unless they are put on one ruler.",
    tryIt: "Scale the height and weight columns in Lab 1 both ways and predict a new patient with the training min and max.",
    needs: [], evidence: [L1("scaling")],
  },
  {
    id: "data-splits", area: "data", level: "beginner", title: "Train, validation and test sets",
    summary: "The training set fits the weights, the validation set tunes choices, and the test set is touched once at the end.",
    why: "A model graded on data it trained on always looks good. Honest numbers need data it has never seen.",
    tryIt: "Change the validation split in the Playground and watch the training and validation curves separate.",
    needs: [], evidence: [learn("split"), pg("design", "Validation split slider"), sheet("validation")],
  },

  // ------------------------------------------------------------------ core
  {
    id: "neuron", area: "core", level: "beginner", title: "The neuron",
    summary: "A neuron multiplies each input by a weight, adds a bias and passes the sum through an activation.",
    why: "Everything else in a neural network is many copies of this one small calculation.",
    tryIt: "Hover a node in the Playground diagram to see its bias and the weights into it; open the Neurons topic for your own numbers.",
    needs: [], evidence: [learn("neurons"), L1("network"), pg("network", "Network diagram built from the real weights"), sheet("blocks")],
  },
  {
    id: "activation", area: "core", level: "beginner", title: "Activation functions",
    summary: "Sigmoid, tanh, ReLU and relatives bend a neuron's output so that stacked layers can learn curves, not just lines.",
    why: "Without a non-linear activation, any number of layers collapses into one linear model. The choice also decides how well gradients flow.",
    tryIt: "Switch between eight activations in the Playground designer and compare the decision boundary and the loss curve.",
    needs: ["neuron"], evidence: [learn("activation"), L1("activations"), pg("design", "Eight activations to choose from"), sheet("activations")],
  },
  {
    id: "forward-pass", area: "core", level: "beginner", title: "Layers and the forward pass",
    summary: "Data flows layer by layer: z = a·W + b, then a = f(z), until the last layer outputs a prediction.",
    why: "Shapes and parameter counts follow directly from the layer sizes, and every prediction is just this chain.",
    tryIt: "Step through the forward pass of the tiny 2-2-1 network in Lab 1 with editable weights.",
    needs: ["neuron"], evidence: [learn("forward"), L1("network"), pg("design", "Add layers and neurons, see the live parameter count")],
  },
  {
    id: "softmax-output", area: "core", level: "beginner", title: "Output layers and softmax",
    summary: "Sigmoid gives one probability, softmax gives ten that sum to one, and a linear output suits regression.",
    why: "The output activation and the loss must be paired correctly for the task, or training silently goes wrong.",
    tryIt: "Use the softmax calculator in Lab 1's MNIST step and see the ten probabilities sum to 1.",
    needs: ["activation"], evidence: [L1("mnist"), sheet("output")],
  },
  {
    id: "initialisation", area: "core", level: "intermediate", title: "Weight initialisation",
    summary: "Xavier and He initialisation pick starting weights whose spread suits the layer size and activation; all-zero weights never break symmetry.",
    why: "Bad starting weights make signals vanish or explode before learning even begins.",
    tryIt: "Train XOR with zero initialisation and see every hidden weight stay exactly 0 and the loss stuck at 0.69.",
    needs: ["neuron"], evidence: [pg("design", "Four initialisers; help panel explains each"), exp("depth")],
  },

  // ------------------------------------------------------------------ training
  {
    id: "loss", area: "training", level: "beginner", title: "Loss functions",
    summary: "A loss turns the gap between prediction and truth into one number: cross-entropy, mean squared error or hinge.",
    why: "Training means pushing this number down, so the loss defines what 'good' is.",
    tryIt: "Pick binary cross-entropy, MSE or hinge in the Playground and watch the loss curve and the decision boundary change.",
    needs: ["forward-pass"], evidence: [learn("loss"), pg("design", "Three losses to choose from"), sheet("losses")],
  },
  {
    id: "gradient-descent", area: "training", level: "beginner", title: "Gradient descent",
    summary: "Move every weight a small step downhill along the slope of the loss; repeat until the loss stops falling.",
    why: "It is the engine of all neural network training, from this toy to the largest models.",
    tryIt: "Run gradient descent on w² in Lab 2 or the hill in Lab 1 and change the learning rate and number of steps.",
    needs: ["loss"], evidence: [learn("gd"), L2("learning"), L1("train"), sheet("optimizers")],
  },
  {
    id: "backprop", area: "training", level: "intermediate", title: "Backpropagation",
    summary: "The chain rule passes the error backwards through the layers to give every weight its gradient.",
    why: "It computes all gradients in one backward sweep, which is why deep networks are trainable at all.",
    tryIt: "Run the one-iteration trace in the Playground (the model is not changed) and follow the backward pass in Lab 1's network step.",
    needs: ["gradient-descent", "forward-pass"], evidence: [learn("backprop"), L1("network"), pg("learn", "Real one-iteration trace of your network")],
  },
  {
    id: "learning-rate", area: "training", level: "beginner", title: "Learning rate",
    summary: "The learning rate scales each step: too small crawls, too large overshoots or diverges.",
    why: "It is usually the most important single setting to get right.",
    tryIt: "Apply the learning-rate experiment (Adam at 0.001, 0.03 and 10) and compare the three loss curves.",
    needs: ["gradient-descent"], evidence: [learn("lr"), exp("lr"), L2("learning")],
  },
  {
    id: "batches-epochs", area: "training", level: "beginner", title: "Batches, epochs and iterations",
    summary: "An epoch is one pass over the data; a batch is the slice used for one weight update.",
    why: "Batch size trades noisy-but-fast updates against smooth-but-slow ones, and decides how many updates an epoch contains.",
    tryIt: "Set the batch size to 1, 32 and the full dataset and compare how many updates an epoch makes.",
    needs: ["gradient-descent"], evidence: [learn("iteration"), pg("design", "Batch size and epochs controls"), sheet("calc")],
  },
  {
    id: "optimizers", area: "training", level: "intermediate", title: "Optimizers",
    summary: "Momentum, Nesterov, Adagrad, RMSprop, Adadelta, Adam and Nadam adapt the step using past gradients.",
    why: "They reach a good solution faster and more reliably than plain gradient descent on difficult surfaces.",
    tryIt: "Race SGD, momentum and Adam on the same data with the momentum experiment, or watch three optimizers in Lab 1.",
    needs: ["gradient-descent"], evidence: [learn("optim"), exp("momentum"), L1("optimizers"), sheet("optimizers")],
  },
  {
    id: "vanishing-gradients", area: "training", level: "intermediate", title: "Vanishing and exploding gradients",
    summary: "Multiplying many small (or large) derivatives layer after layer makes early layers learn extremely slowly (or blow up).",
    why: "It limits depth and explains why ReLU, careful initialisation and normalisation matter.",
    tryIt: "Run the deep-network experiment with sigmoid against ReLU and compare the gradient-norm chart; try the chain demo in Lab 1.",
    needs: ["activation", "backprop"], evidence: [learn("vanish"), exp("depth"), L1("activations")],
  },

  // ------------------------------------------------------------------ generalisation
  {
    id: "over-underfitting", area: "generalisation", level: "beginner", title: "Under- and over-fitting",
    summary: "Underfitting is too simple to learn the pattern; overfitting memorises noise, so validation loss rises while training loss falls.",
    why: "The goal is to do well on new data, not on the training set.",
    tryIt: "Apply the under-fit, good-fit and over-fit variants and read the automatic diagnosis under the charts.",
    needs: ["data-splits"], evidence: [learn("fit"), exp("fit"), pg("charts", "Curves plus an automatic diagnosis")],
  },
  {
    id: "l1-l2", area: "generalisation", level: "intermediate", title: "L1 and L2 regularisation",
    summary: "A penalty on large weights keeps the model simple: L2 shrinks them smoothly, L1 pushes many to exactly zero.",
    why: "It reduces overfitting without changing the network's size.",
    tryIt: "Raise L2 on the overfitting preset and watch the weights in the diagram thin out and the validation loss improve.",
    needs: ["over-underfitting"], evidence: [learn("reg"), pg("design", "L1 and L2 strength inputs"), sheet("generalisation")],
  },
  {
    id: "dropout", area: "generalisation", level: "intermediate", title: "Dropout",
    summary: "During training each hidden neuron is switched off at random with probability p, so the network cannot rely on any single unit.",
    why: "It is a cheap, effective regulariser; at prediction time all neurons are used.",
    tryIt: "Compare dropout 0, 0.3 and 0.5 on the noisy dataset with the dropout experiment.",
    needs: ["over-underfitting"], evidence: [learn("dropout"), exp("dropout")],
  },
  {
    id: "batch-norm", area: "generalisation", level: "intermediate", title: "Batch normalisation",
    summary: "Each layer's inputs are rescaled to zero mean and unit variance per batch, with learned scale and shift.",
    why: "It steadies training, tolerates larger learning rates and acts as a mild regulariser.",
    tryIt: "Switch batch norm on, train, and look at the extra gamma and beta parameters in the parameter count.",
    needs: ["scaling", "forward-pass"], evidence: [learn("bn"), pg("design", "Batch normalisation switch")],
  },
  {
    id: "early-stopping", area: "generalisation", level: "intermediate", title: "Early stopping",
    summary: "Stop when the validation loss has not improved for a number of epochs (patience) and keep the best weights.",
    why: "It finds the point just before overfitting starts, automatically.",
    tryIt: "Run the early-stopping experiment and see the best epoch marked on the loss chart.",
    needs: ["over-underfitting"], evidence: [learn("early"), exp("early")],
  },
  {
    id: "validation-methods", area: "generalisation", level: "intermediate", title: "Cross-validation",
    summary: "Hold-out, k-fold, stratified, shuffle, time-series and leave-one-out splits estimate how a model will do on unseen data.",
    why: "One lucky split can mislead; averaging several gives an estimate with a spread.",
    tryIt: "Run k-fold on your dataset and read the mean and standard deviation across folds.",
    needs: ["data-splits"], evidence: [learn("validation"), exp("cv"), pg("cv", "Cross-validation panel"), sheet("validation")],
  },
  {
    id: "metrics", area: "generalisation", level: "intermediate", title: "Classification metrics",
    summary: "Accuracy, precision, recall, F1, the confusion matrix, ROC and AUC describe different kinds of mistake.",
    why: "On imbalanced data a model can be 95 % accurate and useless. The decision threshold trades precision for recall.",
    tryIt: "Move the threshold slider in the evaluation panel and watch precision, recall and the ROC point move.",
    needs: ["data-splits"], evidence: [learn("metrics"), exp("threshold"), pg("eval", "Evaluation panel with ROC and threshold"), sheet("metrics")],
  },
  {
    id: "decision-boundary", area: "generalisation", level: "beginner", title: "Decision boundaries",
    summary: "A classifier splits the input plane into regions; the boundary shows what the network has actually learned.",
    why: "It makes abstract weights visible and reveals under- and over-fitting at a glance.",
    tryIt: "Train on circles with one neuron and then with eight, and compare the boundary.",
    needs: ["forward-pass"], evidence: [learn("boundary"), pg("boundary", "Live prediction grid with hover confidence")],
  },

  // ------------------------------------------------------------------ vision
  {
    id: "convolution", area: "vision", level: "intermediate", title: "Convolution",
    summary: "A small kernel slides over an image; at each position it multiplies and sums to make one pixel of a feature map.",
    why: "It detects local patterns such as edges with the same few weights at every position.",
    tryIt: "Pick the vertical-edge kernel on the bright-square image and hover a feature-map cell to see the exact calculation.",
    needs: ["neuron"], evidence: [{ kind: "tool", id: "convolution" }, L2("conv"), sheet("cnn")],
  },
  {
    id: "padding-stride", area: "vision", level: "intermediate", title: "Stride and padding",
    summary: "Stride is how far the kernel jumps; same padding adds zeros so the output keeps the input's size.",
    why: "They decide the output size: floor((W − F + 2P) / S) + 1.",
    tryIt: "Change stride and padding in the Convolution Explorer and check the size formula it prints.",
    needs: ["convolution"], evidence: [{ kind: "tool", id: "convolution" }, sheet("calc")],
  },
  {
    id: "pooling", area: "vision", level: "intermediate", title: "Pooling",
    summary: "Max or average over 2×2 blocks shrinks a feature map to a quarter of its size.",
    why: "It cuts computation and makes detection tolerant to small shifts.",
    tryIt: "Edit the cells of the pooling grid in Lab 2 and compare max with average.",
    needs: ["convolution"], evidence: [L2("pool"), { kind: "tool", id: "convolution" }],
  },
  {
    id: "receptive-field", area: "vision", level: "advanced", title: "Receptive field",
    summary: "The patch of the input that influences one output cell; it grows as layers are stacked.",
    why: "It tells you how much context a deep CNN sees, and why stacked 3×3 layers can replace one large kernel.",
    tryIt: "Hover a feature-map cell and see the nine input cells that fed it.",
    needs: ["convolution"], evidence: [{ kind: "tool", id: "convolution" }],
  },
  {
    id: "cnn-parameters", area: "vision", level: "intermediate", title: "Why CNNs need fewer parameters",
    summary: "A conv layer shares its small kernel everywhere, so its parameter count does not depend on the image size.",
    why: "Dense layers on images grow with every pixel. In Lab 2's recorded run the best CNN has 241,546 parameters against 575,050 for the fully connected network, and it is more accurate.",
    tryIt: "Count the lab's CNN layer by layer and compare it with a Dense network on the same digits.",
    needs: ["convolution", "forward-pass"], evidence: [L2("params"), { kind: "tool", id: "convolution" }, sheet("calc")],
  },
  {
    id: "image-preprocessing", area: "vision", level: "beginner", title: "Preparing an image for a network",
    summary: "Photos must look like the training data: ink only, 20×20 box, centred by centre of mass in 28×28.",
    why: "A network shown a thin, off-centre picture sees something it never trained on, so a wrong answer says little about the model.",
    tryIt: "Draw a digit in Lab 2 and watch the four preprocessing stages.",
    needs: [], evidence: [L2("digit"), L1("mnist")],
  },

  // ------------------------------------------------------------------ sequences
  {
    id: "text-encoding", area: "sequences", level: "beginner", title: "Text as numbers",
    summary: "Words become integers; one-hot vectors lose order and are huge, embeddings are short learned vectors that keep order.",
    why: "Networks only read numbers, and the representation decides what they can learn.",
    tryIt: "Type a review in Lab 2 and see its word numbers, its multi-hot vector and its embedding.",
    needs: [], evidence: [L2("text"), sheet("text")],
  },
  {
    id: "conv1d", area: "sequences", level: "intermediate", title: "Conv1D on text",
    summary: "A filter of width k reads k neighbouring words at once; global max pooling keeps its strongest match.",
    why: "It finds phrases such as 'not good' wherever they occur, and trains fast.",
    tryIt: "Change the window width in Lab 2's Conv1D toy and see which words fire.",
    needs: ["text-encoding", "convolution"], evidence: [L2("conv1d")],
  },
  {
    id: "recurrent-cells", area: "sequences", level: "advanced", title: "RNN, LSTM and GRU",
    summary: "A hidden state carries memory from step to step; LSTM and GRU gates decide what to keep, write and show.",
    why: "They read sequences of any length, and gates let information survive where a plain RNN forgets.",
    tryIt: "Send a single 1 followed by zeros through each cell in the Recurrent Cell Explorer and see how long it is remembered.",
    needs: ["text-encoding", "vanishing-gradients"], evidence: [{ kind: "tool", id: "recurrent" }, L2("rnn"), sheet("rnn")],
  },

  // ------------------------------------------------------------------ engineering
  {
    id: "keras-code", area: "engineering", level: "intermediate", title: "From idea to Keras code",
    summary: "Build, compile, fit and evaluate a model in a few lines; the lab walks through all 17 cells of the real script.",
    why: "Seeing how the maths becomes code is what makes the concepts usable.",
    tryIt: "Open Lab 2's code walkthrough and run the script on your own machine with the how-to in the repository.",
    needs: [], evidence: [L2("code"), sheet("keras")],
  },
  {
    id: "debugging-training", area: "engineering", level: "intermediate", title: "Diagnosing a failing run",
    summary: "Loss not falling, NaN, chance-level accuracy or a widening train/validation gap each point to specific causes.",
    why: "Most of the work in practice is working out why a run misbehaves.",
    tryIt: "Run the learning-rate experiment at 10 and read what the diagnosis says.",
    needs: ["over-underfitting", "learning-rate"], evidence: [pg("charts", "Automatic diagnosis under the charts"), sheet("debug")],
  },

  // ------------------------------------------------------------------ planned
  {
    id: "attention", area: "advanced", level: "advanced", title: "Attention and transformers",
    summary: "Each token looks at every other token and weights them by relevance; stacked, this is a transformer.",
    why: "It underlies modern language models and replaced recurrent cells for most text tasks.",
    tryIt: "Planned.", needs: ["text-encoding", "softmax-output"], evidence: [],
    plan: "A tiny transformer: type a sentence, see each token's attention weights as a heat map, with real computed values.",
  },
  {
    id: "residual-connections", area: "advanced", level: "advanced", title: "Residual connections and very deep nets",
    summary: "A shortcut adds a layer's input to its output so gradients flow through deep stacks (ResNet).",
    why: "It is how networks with hundreds of layers became trainable.",
    tryIt: "Planned.", needs: ["vanishing-gradients"], evidence: [],
    plan: "Train a plain and a residual network of growing depth on the same data and plot gradient norms per layer.",
  },
  {
    id: "transfer-learning", area: "advanced", level: "advanced", title: "Transfer learning and data augmentation",
    summary: "Reuse a network trained on a large dataset and flip, crop or noise the data to stretch a small one.",
    why: "Most real projects have little data; this is the standard remedy.",
    tryIt: "Planned.", needs: ["cnn-parameters", "over-underfitting"], evidence: [],
    plan: "Fine-tune a small pretrained CNN on a few images, with an augmentation preview.",
  },
  {
    id: "autoencoders", area: "advanced", level: "advanced", title: "Autoencoders and embeddings",
    summary: "A network squeezes data through a narrow code and rebuilds it; the code is a learned representation.",
    why: "It is the basis of compression, denoising and many embedding methods.",
    tryIt: "Planned.", needs: ["forward-pass", "loss"], evidence: [],
    plan: "Train an autoencoder on digits in the backend and plot the 2-D code coloured by label.",
  },
  {
    id: "generative-models", area: "advanced", level: "advanced", title: "Generative models",
    summary: "GANs, VAEs and diffusion models learn to produce new data that looks like the training set.",
    why: "They power image, audio and text generation.",
    tryIt: "Planned.", needs: ["autoencoders"], evidence: [],
    plan: "A tiny 1-D GAN whose generator and discriminator can be watched step by step.",
  },
  {
    id: "hyperparameter-search", area: "advanced", level: "intermediate", title: "Hyperparameter search",
    summary: "Grid and random search try many settings and keep the best by validation score.",
    why: "Good settings rarely come from guesses; search with cross-validation makes the choice honest.",
    tryIt: "Planned.", needs: ["validation-methods", "learning-rate"], evidence: [],
    plan: "Run a small random search in the backend, store every run in the database and plot validation score against each setting.",
  },
  {
    id: "explainability", area: "advanced", level: "advanced", title: "Explaining a prediction",
    summary: "Saliency maps and feature attributions show which inputs pushed a prediction.",
    why: "Trust, debugging and fairness need more than an accuracy number.",
    tryIt: "Planned.", needs: ["backprop"], evidence: [],
    plan: "Gradient saliency on the Playground's two inputs and on a digit.",
  },
  {
    id: "serving-models", area: "engineering", level: "intermediate", title: "Saving, serving and storing runs",
    summary: "Save a trained model, serve it behind an API and keep every experiment (settings and metrics) in a database.",
    why: "A model nobody can call, or whose settings nobody remembers, is not a product.",
    tryIt: "Experiment tracking is live: every finished Playground run and cross-validation is saved and can be compared on the My runs page. Model download and a prediction endpoint are still planned.", needs: ["keras-code"], evidence: [{ kind: "page", to: "/runs", title: "My runs: saved experiments" }],
    plan: "Experiment tracking is now live (a SQLite database of runs behind the My runs page). Still planned: a model download and a prediction endpoint, shown step by step.",
  },
];

export const getConcept = (id: string | undefined) => CONCEPTS.find((c) => c.id === id);

/** "live" = at least one hands-on example, "reference" = only a cheatsheet entry, "planned" = nothing yet. */
export type Coverage = "live" | "reference" | "planned";
export function coverageOf(c: Concept): Coverage {
  if (c.evidence.some((e) => e.kind !== "sheet")) return "live";
  return c.evidence.length ? "reference" : "planned";
}
