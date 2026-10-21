import type { Concept, Evidence } from "./types";

const L1 = (step: string): Evidence => ({ kind: "lab", lab: "lab1", step });
const L2 = (step: string): Evidence => ({ kind: "lab", lab: "lab2", step });
const L3 = (step: string): Evidence => ({ kind: "lab", lab: "lab3", step });
const learn = (topic: string): Evidence => ({ kind: "learn", topic });
const sheet = (section: string): Evidence => ({ kind: "sheet", sheet: "neural-network", section });
const nlpSheet = (section: string): Evidence => ({ kind: "sheet", sheet: "nlp", section });
const trSheet = (section: string): Evidence => ({ kind: "sheet", sheet: "transformers", section });
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

  // ------------------------------------------------------------------ Transformers and NLP (Lab 3)
  {
    id: "tokenization", area: "sequences", level: "intermediate", title: "Tokens and sub-words (WordPiece)",
    summary: "Text is split into sub-word pieces: frequent words stay whole and rare ones break up, for example “unwatchable” becomes “un”, “##watch”, “##able”. [CLS] is added at the start and [SEP] at the end.",
    why: "The vocabulary stays small (about 30,000 units for BERT) and no word is ever unknown. What the model sees is these pieces, not your words.",
    tryIt: "Open Lab 3's tokens step and follow how WordPiece splits a sentence and which embedding row each piece looks up.",
    needs: ["text-encoding"], evidence: [L3("tokens"), trSheet("tokens"), nlpSheet("preprocessing")],
  },
  {
    id: "positional-encoding", area: "sequences", level: "intermediate", title: "Positional encoding",
    summary: "Self-attention treats a sentence as a bag of tokens, so word order is added to the embeddings: fixed sinusoids in the original Transformer, learned vectors in BERT.",
    why: "Without it “dog bites man” and “man bites dog” look identical to the attention layer.",
    tryIt: "Open Lab 3's position step and compare the sinusoidal encodings of different positions.",
    needs: ["tokenization"], evidence: [L3("position"), trSheet("positions")],
  },
  {
    id: "attention", area: "sequences", level: "advanced", title: "Attention and transformers",
    summary: "Each token scores every other token with a query and a key, turns the scores into weights with softmax and takes a weighted mix of the values. Stacked blocks of this make a Transformer.",
    why: "Every word sees every other word in one parallel step, which replaced recurrent cells for most text tasks. The cost grows with the square of the sentence length, which is fine for sentences.",
    tryIt: "Edit the queries, keys and values in Lab 3's attention step and watch the softmax weights move, then look at the real DistilBERT attention maps.",
    needs: ["tokenization", "positional-encoding", "softmax-output"],
    evidence: [L3("attention"), L3("heads"), L3("encoder"), trSheet("attention"), nlpSheet("attention-intro")],
  },
  {
    id: "multi-head-attention", area: "sequences", level: "advanced", title: "Multi-head attention",
    summary: "Several attention functions run in parallel on smaller slices of the vector and their results are joined. BERT-tiny uses 2 heads per layer, BERT-small 8 and DistilBERT 12.",
    why: "Different heads can specialise: one may link adjectives to their nouns, another a negation word to what it negates.",
    tryIt: "Open Lab 3's heads step and compare what different attention heads look for in the same sentence.",
    needs: ["attention"], evidence: [L3("heads"), trSheet("multihead")],
  },
  {
    id: "residual-layernorm", area: "sequences", level: "advanced", title: "Residual connections and layer normalisation in a block",
    summary: "A Transformer encoder block wraps attention and a feed-forward layer, each with a shortcut that adds the input to the output, followed by layer normalisation over the features of one token.",
    why: "The shortcuts and normalisation keep deep stacks trainable, and the block's shapes fix the parameter count: Lab 3's counter is checked against the real BERT-tiny, BERT-small and DistilBERT (4.4, 29 and 67 million).",
    tryIt: "Use the parameter counter in Lab 3's encoder step and compare its total with the real models.",
    needs: ["multi-head-attention", "batch-norm", "vanishing-gradients"], evidence: [L3("encoder"), trSheet("block"), trSheet("params")],
  },
  {
    id: "pretraining-finetuning", area: "sequences", level: "advanced", title: "Pre-training and fine-tuning",
    summary: "BERT is first pre-trained by masked language modelling: 15 % of the tokens are hidden and predicted from both sides. For a task, a small classification layer is put on the [CLS] vector and everything is fine-tuned with AdamW, warm-up and linear decay.",
    why: "Pre-training is far too expensive to repeat (days on many GPUs), so you download the weights and fine-tune. A model that already knows the language needs few labelled examples.",
    tryIt: "Open Lab 3's training step and follow masked language modelling, the [CLS] classification head and the warm-up and decay schedule.",
    needs: ["residual-layernorm", "optimizers"], evidence: [L3("training"), trSheet("objectives"), trSheet("finetune")],
  },
  {
    id: "bag-of-words-tfidf", area: "sequences", level: "beginner", title: "Bag of words and TF-IDF",
    summary: "A sentence becomes a vector of word counts weighted by how rare each word is, and a linear model (naive Bayes, logistic regression, SVM) reads the weights. Word order is ignored.",
    why: "It is a cheap, strong baseline: on SST-2 the classical models score 81.9 to 82.9 %, train in seconds and answer in about 0.05 ms.",
    tryIt: "Open Lab 3's baselines step and read the real weights of the classical models.",
    needs: ["text-encoding"], evidence: [L3("baselines"), nlpSheet("representations")],
  },
  {
    id: "zero-shot-nli", area: "sequences", level: "advanced", title: "Zero-shot classification with NLI",
    summary: "A model trained to say whether one sentence entails another can classify with no labelled examples: the review is the premise, “The sentiment of this movie review is positive” is the hypothesis, and the label with the highest entailment score wins.",
    why: "It reached 81.8 % on SST-2 without ever seeing a sentiment label, level with logistic regression trained on 65 thousand sentences, but it is the slowest model because each sentence runs once per label.",
    tryIt: "Look at the ready-made and zero-shot models in Lab 3's ready-made step and compare their accuracy and cost with the baselines.",
    needs: ["pretraining-finetuning", "softmax-output"], evidence: [L3("readymade"), nlpSheet("pretrained")],
  },
  {
    id: "model-comparison-statistics", area: "generalisation", level: "advanced", title: "Is one model really better? Bootstrap and McNemar",
    summary: "A 95 % bootstrap interval resamples the test set to show how much an accuracy could move. McNemar's test looks only at the sentences two models answer differently.",
    why: "With 872 test sentences the intervals are about ±2.5 points wide, so a one-point gap may be luck. In the paper BERT-small against the SVM (71 against 64 sentences, p = 0.61) is not a real difference.",
    tryIt: "Open Lab 3's results step and read the bootstrap intervals and McNemar tests of the ten models, recomputed from the real predictions.",
    needs: ["metrics", "validation-methods"], evidence: [L3("results"), trSheet("evaluation"), nlpSheet("metrics")],
  },
  {
    id: "cost-latency-tradeoff", area: "engineering", level: "intermediate", title: "Accuracy against cost and latency",
    summary: "Accuracy is only one axis: training time, milliseconds per sentence and model size matter too, and they differ by orders of magnitude between families.",
    why: "On a CPU the classical models need about 0.05 ms per sentence, BERT-small 14 ms and DistilBERT 39 ms; the ready-made large models need 45 to 107 ms. A real project pays this bill on every request.",
    tryIt: "Open Lab 3's cost step and compare training time, latency and size of the ten models, then find which are not worth their cost.",
    needs: ["pretraining-finetuning", "bag-of-words-tfidf"], evidence: [L3("cost"), trSheet("cost")],
  },
  {
    id: "data-efficiency", area: "generalisation", level: "advanced", title: "Data efficiency and learning curves",
    summary: "A learning curve trains on growing subsets and plots test accuracy. It shows how many labelled sentences each approach needs.",
    why: "With 500 sentences BERT-small scores 75.9 % against 61.8 % for TF-IDF. BERT-small on 4,000 sentences already matches the best classical model on all 65,349, about 16 times less labelled data, which matters for languages such as Lithuanian.",
    tryIt: "Open Lab 3's efficiency step and read the learning curves to find where the classical model catches up.",
    needs: ["pretraining-finetuning", "bag-of-words-tfidf", "over-underfitting"], evidence: [L3("efficiency")],
  },
  {
    id: "negation-error-analysis", area: "generalisation", level: "advanced", title: "Error analysis: negation and contrast",
    summary: "Accuracy is measured again on the sentences that contain negation (184) or contrast words such as “but” (130) to see where each model fails.",
    why: "Bag-of-words models lose 8 to 9 points on negation, because “not good” contains “good”. Large Transformers lose 2 to 4 points, but BERT-small loses 9.3, so robustness comes from size and pre-training together, not from the architecture alone.",
    tryIt: "Open Lab 3's errors step and compare how the ten models answer sentences with negation and contrast.",
    needs: ["bag-of-words-tfidf", "attention"], evidence: [L3("errors")],
  },
  {
    id: "choosing-a-model", area: "engineering", level: "advanced", title: "Choosing a model for a real task",
    summary: "Weigh accuracy, cost, labelled data, language and risk together: a cheap classical baseline, a compact fine-tuned Transformer, a ready-made in-domain model or a zero-shot model.",
    why: "A Transformer is not automatically better (BERT-tiny was the weakest model at 76.6 %), but a large enough pre-trained one beat the best classical model by about 6 points.",
    tryIt: "Answer the questions in Lab 3's decision helper for your own situation and see which model it suggests and why.",
    needs: ["cost-latency-tradeoff", "data-efficiency", "model-comparison-statistics", "zero-shot-nli"], evidence: [L3("decide"), nlpSheet("choose")],
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
    id: "residual-connections", area: "advanced", level: "advanced", title: "Residual connections in very deep nets (ResNet)",
    summary: "In a ResNet a shortcut adds a layer's input to its output so gradients flow through stacks of hundreds of convolutional layers.",
    why: "It is how very deep image networks became trainable. The same shortcut sits inside every Transformer block, which Lab 3's encoder step covers live.",
    tryIt: "Planned.", needs: ["vanishing-gradients"], evidence: [],
    plan: "Train a plain and a residual network of growing depth on the same data and plot gradient norms per layer.",
  },
  {
    id: "data-augmentation", area: "advanced", level: "advanced", title: "Data augmentation",
    summary: "Flip, crop, rotate or add noise to the training data to stretch a small dataset. Reusing a pre-trained network is covered under pre-training and fine-tuning.",
    why: "Most real projects have little data; augmentation is a cheap way to reduce overfitting.",
    tryIt: "Planned.", needs: ["cnn-parameters", "over-underfitting"], evidence: [],
    plan: "Preview flips, crops and noise on a few images, then train the same small CNN with and without augmentation and compare the validation curves.",
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
