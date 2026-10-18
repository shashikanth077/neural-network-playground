import type { Patient } from "./math";

/** (gender, height cm); gender 0 = female, 1 = male; null = the missing value of Name 11. */
export const PATIENTS: Patient[] = [
  [0, 165], [1, 183], [0, 171], [1, 194], [1, 178], [1, 185], [0, 160], [1, 175],
  [0, 169], [1, 180], [0, null], [1, 182], [0, 167], [1, 190], [0, 163], [1, 177],
];
/** Index 10 is the suspicious entry (88). */
export const AGES = [8, 10, 9, 12, 11, 14, 13, 15, 10, 9, 88, 12, 11, 13, 14, 15, 16, 12, 10, 13, 11, 14, 15, 9, 8, 12, 13, 14, 15, 16];
export const SUSPECT_INDEX = 10;

export const HEIGHTS = [165, 183, 171, 194, 158, 185, 160, 175, 169, 180, 164, 182, 167, 190, 163, 177];
export const WEIGHTS = [55, 95, 60, 102, 54, 90, 52, 78, 63, 85, 52, 92, 58, 98, 54, 77];
/** Known labels of the 16 patients; index 4 (Name 5) is the unknown one. */
export const GENDER_LABELS: (number | null)[] = [0, 1, 0, 1, null, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1];

// ---- results copied from the lab notebook run (MNIST test set, 10 000 images)
export const T5 = [
  [1, 0.01, 100, 0.25548, 0.533, 0.5611, "male ✘"], [2, 0.01, 1000, 0.18746, 0.867, 0.4465, "female"],
  [3, 0.1, 100, 0.18677, 0.867, 0.4469, "female"], [4, 0.1, 1000, 0.00481, 1, 0.0248, "female"],
  [5, 0.5, 100, 0.01392, 1, 0.0582, "female"], [6, 0.5, 1000, 0.00052, 1, 0.0051, "female"],
  [7, 1.0, 1000, 0.00022, 1, 0.0029, "female"], [8, 2.0, 1000, 0.0001, 1, 0.0017, "female"],
] as const;

export const T61 = [
  [1, "128", 15, 128, 0.2, 0.9938, 0.9763, 0.0272, 0.0842], [2, "512", 15, 128, 0.2, 0.9938, 0.978, 0.0246, 0.0914],
  [3, "256-128", 15, 128, 0.2, 0.9934, 0.9778, 0.03, 0.1044], [4, "256-128-64", 15, 128, 0.2, 0.9923, 0.9798, 0.0326, 0.0974],
  [5, "512-256-128-64", 15, 128, 0.2, 0.9937, 0.9816, 0.0296, 0.0845], [6, "512-256-128-64", 15, 64, 0.2, 0.9933, 0.9805, 0.0317, 0.1025],
  [7, "512-256-128-64", 15, 128, 0.1, 0.99, 0.9765, 0.0371, 0.1097], [8, "512-256-128-64", 15, 128, 0.3, 0.989, 0.9772, 0.0456, 0.1008],
] as const;

export const T62: Record<string, number[]> = {
  sigmoid: [0.9731, 0.9726, 0.976],
  tanh: [0.9744, 0.9761, 0.9725],
  relu: [0.9764, 0.9771, 0.974],
};

export const T63: Record<string, [number, number][]> = {
  sgd: [[0.001, 0.8862], [0.01, 0.9601], [0.1, 0.9787], [0.5, 0.9813]],
  rmsprop: [[0.0001, 0.9747], [0.001, 0.9815], [0.01, 0.9624], [0.1, 0.1135]],
  adam: [[0.0001, 0.9748], [0.001, 0.9816], [0.01, 0.9618], [0.1, 0.1135]],
};

export const ROADMAP: [string, [string, string][]][] = [
  ["Foundations", [
    ["Python, numpy arrays, pandas DataFrames", "All six tasks are code; indexing, boolean masks and groupby are used constantly"],
    ["matplotlib basics", "Plot z-scores, loss curves, learning curves"],
    ["Mean, median, standard deviation, percentiles", "The vocabulary of Tasks 1-4"],
    ["Normal (bell) distribution and probability", "Why “3 standard deviations” is rare; Chauvenet uses it directly"],
    ["Vectors, dot product, matrix multiply", "A Dense layer is exactly x · W + b"],
  ]],
  ["Data preparation", [
    ["Missing values and imputation", "Task 1: mean vs median, per group"],
    ["Outliers: Z-score, Chauvenet, IQR", "Tasks 2-4, and when each one fails (masking)"],
    ["Normalization: min-max and standardization", "Why scale; fit on train data only"],
    ["Train / validation / test split", "Honest evaluation; validation_split in Keras"],
    ["One-hot encoding of labels", "Needed for categorical_crossentropy"],
  ]],
  ["Neural network core", [
    ["Neuron: weights, bias, activation", "Task 5 diagram"],
    ["Sigmoid, tanh, relu, softmax", "6.2, and why softmax at the output"],
    ["Forward pass", "How a prediction is made"],
    ["Loss functions: MSE, binary and categorical cross-entropy", "What the network tries to minimise"],
    ["Gradient descent and backpropagation", "How weights are updated (chain rule)"],
    ["Learning rate, epochs, batch size", "The main knobs studied in 6.1-6.3"],
  ]],
  ["Keras and MNIST", [
    ["Sequential, Dense, Input", "Building the model in a few lines"],
    ["compile / fit / evaluate / predict", "The whole Keras workflow"],
    ["Optimizers: SGD, RMSprop, Adam", "Task 6.3"],
    ["Overfitting and learning curves", "Reading train vs validation curves"],
    ["Designing fair experiments", "Change one hyperparameter at a time, repeat to see noise (6.2)"],
  ]],
  ["Reporting and defense", [
    ["Writing a results table and conclusion", "Report requirement: epochs, accuracy, loss, batch, split"],
    ["Explaining your own code line by line", "You must have the code available at the defense"],
    ["Honest limits", "Test set used to choose the model; one test digit; 3 repeats only"],
  ]],
];

export const QA: [string, string][] = [
  ["Why do you use the gender when imputing the height?", "Heights differ strongly by gender (women ≈ 165.8 cm, men ≈ 182.7 cm). The overall mean (~175 cm) would be about 9 cm wrong for a woman, so I use only the values of the same group."],
  ["Mean or median for imputation?", "Both gave nearly the same result (165.83 vs 166 cm). The median is safer when outliers exist because one extreme value does not move it."],
  ["What is the difference between the three anomaly methods?", "Z-score and Chauvenet use mean and standard deviation (assume a normal distribution); the outlier itself inflates σ. Chauvenet also accounts for sample size n. The IQR rule uses quartiles, which the outlier cannot distort. All three found 88 here."],
  ["Why can the Z-score miss an outlier?", "Masking: a big outlier increases σ, which shrinks its own z-score. With 88, σ = 14.04 but without it only 2.4. With a smaller outlier (about 21 or below, for these 30 ages) the z-score rule with threshold 3 stops flagging it while Chauvenet and IQR still do."],
  ["Why normalize inputs to [0,1]?", "Height and weight have different units and ranges. Scaling keeps weights and gradients in a similar size so training is stable and faster. Min and max come from training data and are reused for new data."],
  ["Explain backpropagation in one minute.", "Forward pass computes the output; the loss compares it with the truth; the chain rule gives the gradient of the loss for every weight, going from the output backwards; each weight is moved a little (learning rate) in the direction that lowers the loss."],
  ["What does the bias do?", "It shifts the activation threshold, like the intercept of a line. In Task 5 it is an extra input fixed to 1 with its own weight, initialised randomly."],
  ["What happened with different learning rates and epochs in Task 5?", "lr 0.01 / 100 epochs barely trained (accuracy 53%, wrong answer). From lr 0.1 with 1000 epochs, loss ≈ 0.005 and accuracy 100%; Name 5 is female (output ≈ 0.02). Higher lr or more epochs lowers the loss further."],
  ["Why softmax and categorical cross-entropy for MNIST?", "10 mutually exclusive classes: softmax gives probabilities that sum to 1, and cross-entropy = −ln(probability of the true class) punishes confident wrong answers strongly."],
  ["Which model is best in 6.1 and how do you know?", "512-256-128-64 with relu and Adam: 98.16% test accuracy, loss 0.0845. It had the highest accuracy of 8 runs. Differences between runs are small (≈ 0.5%), so the claim is “slightly better”, not “much better”."],
  ["What does the learning curve show?", "Training loss keeps decreasing; validation loss is lowest near epoch 4 and then stays flat around 0.1. That is overfitting: the network starts to memorise the training set."],
  ["Which activation is best?", "relu had the best mean accuracy (97.58%) vs tanh 97.43% and sigmoid 97.39%, but the gap is about the size of the repeat-to-repeat noise. Sigmoid had the lowest loss (0.093). So conclusions must be careful."],
  ["Why did Adam and RMSprop fail with learning rate 0.1?", "The step is far too large; the weights jump over the minimum and training becomes unstable, ending at chance level (11.35% ≈ always predicting one digit). SGD needs larger rates (0.1-0.5) because its raw gradient steps are small."],
  ["What are the weaknesses of your experiments?", "The best model was chosen on the test set (as the assignment asks), only 3 repeats per activation, a single random split, fixed 15 epochs, and one test digit. In a real project I would use a separate validation set for choosing and the test set once."],
];
