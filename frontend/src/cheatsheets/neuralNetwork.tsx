import { ACT } from "../lib/activations";
import { OPTIMIZER_OPTIONS, VALIDATION_OPTIONS } from "../lib/options";
import { Calculators } from "./Calculators";
import type { Cheatsheet } from "./types";
import { Code, Note, Sub, T, Table } from "./ui";

const ACT_ROWS: [keyof typeof ACT, string, string, string][] = [
  ["sigmoid", "0 … 1", "Binary output (probability)", "Gradient ≤ 0.25 → vanishing gradients; not zero-centred"],
  ["tanh", "−1 … 1", "RNN / LSTM / GRU cells, small nets", "Zero-centred, gradient up to 1; still saturates"],
  ["relu", "0 … ∞", "Default for hidden layers", "Fast; neurons can die (up to ~40% in bad runs). Fix: lower LR, Leaky ReLU, ELU"],
  ["leaky_relu", "−∞ … ∞", "When ReLU neurons die", "Keeps a small slope (0.01) for x < 0"],
  ["elu", "−1 … ∞", "Smoother ReLU alternative", "Negative side e^x − 1, outputs nearer zero mean"],
  ["selu", "−1.76 … ∞", "Self-normalising nets", "Scaled ELU (λ ≈ 1.0507, α ≈ 1.6733)"],
  ["softplus", "0 … ∞", "Smooth ReLU", "ln(1 + eˣ), derivative is the sigmoid"],
  ["silu", "−0.28 … ∞", "Modern deep nets (Swish)", "x·σ(x); smooth, slightly non-monotonic"],
];

const OPT_ROWS: [string, string, string, string][] = [
  ["SGD", String.raw`\theta\leftarrow\theta-\eta g`, "lr 0.01 (Keras default)", "Simple; needs a tuned rate"],
  ["Momentum", String.raw`v\leftarrow\gamma v+\eta g;\ \theta\leftarrow\theta-v`, "γ ≈ 0.9", "Smooths the path"],
  ["Nesterov", String.raw`\theta\leftarrow\theta-(\gamma v+\eta g)`, "γ ≈ 0.9", "Look-ahead momentum"],
  ["Adagrad", String.raw`G\mathrel{+}=g^2;\ \theta\leftarrow\theta-\tfrac{\eta g}{\sqrt G+\varepsilon}`, "lr 0.01, ε 1e-7", "Good for sparse data; rate shrinks forever"],
  ["RMSprop", String.raw`v\leftarrow\rho v+(1-\rho)g^2;\ \theta\leftarrow\theta-\tfrac{\eta g}{\sqrt v+\varepsilon}`, "lr 0.001, ρ 0.9", "Fixes Adagrad's shrinking rate"],
  ["Adadelta", String.raw`\Delta\theta=-\tfrac{\mathrm{RMS}[\Delta\theta_{t-1}]}{\mathrm{RMS}[g_t]}g_t`, "ρ 0.95, ε 1e-6", "No hand-set rate in theory (use η≈1)"],
  ["Adam", String.raw`m,v\ \text{moving avgs};\ \theta\leftarrow\theta-\tfrac{\eta\hat m}{\sqrt{\hat v}+\varepsilon}`, "lr 0.001, β 0.9/0.999", "Strong default"],
  ["Nadam", String.raw`\text{Adam with Nesterov look-ahead}`, "lr 0.001, β 0.9/0.999", "Often a little smoother"],
];

export const neuralNetworkSheet: Cheatsheet = {
  id: "neural-network",
  domain: "dl",
  title: "Neural Network cheatsheet",
  subtitle: "Layers, activations, losses, optimizers, regularisation, validation, metrics, CNNs, RNNs and text: the formulas and rules of thumb from the lectures, in one page.",
  status: "live",
  sections: [
    {
      id: "blocks", title: "1 · Building blocks", keywords: "neuron weight bias dense layer input flatten shape parameters hyperparameters",
      render: () => (
        <>
          <p className="text-sm">A neuron computes <T>{String.raw`z=\sum_i w_ix_i+b,\ a=f(z)`}</T>. A dense (fully connected) layer connects every neuron to every neuron of the next layer: <T>{String.raw`a^{[l]}=f(W^{[l]}a^{[l-1]}+b^{[l]})`}</T>.</p>
          <Table head={["Layer", "What it does", "Shape / parameters"]} rows={[
            ["Input", "Describes the shape of ONE example (batch size is added automatically)", "(features,) tabular · (28, 28, 1) grey image · (32, 32, 3) RGB"],
            ["Flatten", "Turns a multi-dimensional example into a flat vector; no parameters", "(28, 28) → 784"],
            ["Dense(units)", "Every output neuron sees every input", <T key="d">{String.raw`(n_{\text{in}}+1)\times\text{units}`}</T>],
            ["Embedding(vocab, dim)", "Looks up a learned dense vector per token index", <T key="e">{String.raw`\text{vocab}\times\text{dim}`}</T>],
          ]} />
          <Sub>Parameters vs hyperparameters</Sub>
          <p className="text-sm"><b>Parameters</b> (weights, biases) are learned. <b>Hyperparameters</b> are chosen by you: number of layers and neurons, epochs, mini-batch size, learning rate, architecture. Tune hyperparameters on the <i>validation</i> set, never the test set.</p>
        </>
      ),
    },
    {
      id: "activations", title: "2 · Activation functions", keywords: "sigmoid tanh relu leaky elu selu softplus silu swish step vanishing gradient dead neurons softmax",
      render: () => (
        <>
          <p className="text-sm">Activations add the non-linearity that lets depth do something. Without them any stack of layers equals one linear model. Hidden layers usually share one activation.</p>
          <Table wide head={["Function", "Formula", "Derivative", "Range", "Typical use", "Notes"]} rows={ACT_ROWS.map(([k, range, use, note]) => [
            k.replace("_", " "), <T key="f">{ACT[k].tex}</T>, <T key="d">{ACT[k].dtex}</T>, range, use, note,
          ])} />
          <Note><b>Vanishing gradient.</b> Sigmoid's derivative is at most 1/4, so after 4 layers a gradient is scaled by ≤ (1/4)⁴ = 1/256 ≈ 0.0039 and is essentially 0 by layer 8–10. tanh helps but still saturates; ReLU's derivative is exactly 1 for x &gt; 0.</Note>
          <Sub>Softmax (multi-class output)</Sub>
          <p className="text-sm"><T>{String.raw`y_i=\dfrac{e^{s_i}}{\sum_j e^{s_j}}`}</T>: probabilities that sum to 1. Logits (2.5, 1.2, 0.8) → (0.70, 0.25, 0.05).</p>
        </>
      ),
    },
    {
      id: "output", title: "3 · Output layer & loss by task", keywords: "regression binary multiclass multilabel softmax sigmoid linear cross entropy mse",
      render: () => (
        <Table wide head={["Task", "Output layer", "Loss", "Labels"]} rows={[
          ["Regression (a number)", "1 neuron, linear (y = x)", "MSE, MAE, Huber", "real numbers"],
          ["Binary classification", "1 neuron, sigmoid", "Binary cross-entropy", "0 / 1"],
          ["Multi-class (one of K)", "K neurons, softmax", "Categorical cross-entropy (one-hot) or sparse CE (integers)", "one-hot or integer"],
          ["Multi-label (several of K)", "K neurons, sigmoid each", "Binary cross-entropy per label", "K binary flags"],
          ["Sequence labelling / alignment", "per step", "CTC, sequence loss", "sequences"],
          ["Segmentation", "per pixel", "Dice, Jaccard, Tversky", "masks"],
        ]} />
      ),
    },
    {
      id: "losses", title: "4 · Loss functions", keywords: "mae mse rmse msle mape huber log-cosh binary cross entropy categorical hinge focal kl entropy",
      render: () => (
        <>
          <Table wide head={["Loss", "Formula", "Notes"]} rows={[
            ["MAE", <T key="1">{String.raw`\frac1n\sum|y-\hat y|`}</T>, "Robust to outliers; y = (90, 105), ŷ = (95, 100) → 5"],
            ["MSE / RMSE", <T key="2">{String.raw`\frac1n\sum(y-\hat y)^2,\ \sqrt{\text{MSE}}`}</T>, "Punishes big errors; RMSE is in the units of y"],
            ["MSLE", <T key="3">{String.raw`\frac1n\sum(\ln(y+1)-\ln(\hat y+1))^2`}</T>, "Relative errors, positive targets"],
            ["MAPE", <T key="4">{String.raw`\frac{100}{n}\sum\frac{|y-\hat y|}{|y|}`}</T>, "Percent error, y ≠ 0; asymmetric: ŷ=10,y=20 → 50% but ŷ=20,y=10 → 100%"],
            ["Huber, Log-Cosh", "quadratic near 0, linear far away", "Smooth compromise between MSE and MAE"],
            ["Binary cross-entropy", <T key="5">{String.raw`-\frac1N\sum[y\ln p+(1-y)\ln(1-p)]`}</T>, "Stable form from logits: max(z,0) − zy + ln(1+e^{−|z|})"],
            ["Categorical cross-entropy", <T key="6">{String.raw`-\frac1N\sum_i\sum_j y_{ij}\ln p_{ij}`}</T>, "= −ln p(true class) for one-hot labels"],
            ["Hinge", <T key="7">{String.raw`\max(0,1-s\,z)`}</T>, "s = ±1; margin loss (SVM-style)"],
            ["Entropy", <T key="8">{String.raw`H=-\sum p\log_2 p`}</T>, "Uncertainty of a distribution; cross-entropy builds on it"],
          ]} />
          <Note>Squared error on a sigmoid output nearly stops learning when the model is confidently wrong (its gradient vanishes); cross-entropy keeps a strong gradient. Try it in the Playground's Learning Center.</Note>
        </>
      ),
    },
    {
      id: "optimizers", title: "5 · Gradient descent & optimizers", keywords: "sgd momentum nesterov adagrad rmsprop adadelta adam nadam learning rate batch mini-batch stochastic local minima saddle",
      render: () => (
        <>
          <Table wide head={["Variant", "Data per update", "Pros", "Cons"]} rows={[
            ["Batch GD", "all training data", "stable, deterministic", "slow, memory-heavy, can stick in local minima"],
            ["Stochastic (SGD)", "1 sample", "fast updates, can escape shallow minima", "noisy; shuffle the data"],
            ["Mini-batch", "m samples (e.g. 32)", "balance of both", "batch size must be tuned"],
          ]} />
          <p className="mt-2 text-sm"><T>{String.raw`\theta\leftarrow\theta-\eta\nabla_\theta L`}</T>; updates per epoch = <T>{String.raw`\lceil N_{\text{train}}/B\rceil`}</T>. The result depends on the initial weights; a learning rate that is too small is slow, too large overshoots or diverges.</p>
          <Sub>Optimizers</Sub>
          <Table wide head={["Optimizer", "Update", "Keras defaults", "Remark"]} rows={OPT_ROWS.map(([n, tex, d, r]) => [n, <T key="t">{tex}</T>, d, r])} />
          <Note>Adam: <T>{String.raw`\hat m=\frac{m}{1-\beta_1^t},\ \hat v=\frac{v}{1-\beta_2^t}`}</T>. The slides write ε inside the square root for Adagrad/RMSprop; Keras and PyTorch differ on where ε goes. It only matters when gradients are ≈ 0. Practical rates in the Playground: {OPTIMIZER_OPTIONS.map((o) => `${o.value} ${o.lr}`).join(" · ")}.</Note>
        </>
      ),
    },
    {
      id: "generalisation", title: "6 · Overfitting & regularisation", keywords: "underfitting overfitting l1 l2 lasso ridge elastic net dropout batch normalization early stopping weight decay",
      render: () => (
        <>
          <Table wide head={["Symptom (learning curves)", "Meaning", "Try"]} rows={[
            ["Both errors high and close", "Underfitting: model too simple / too little training", "More neurons or layers, train longer, raise learning rate"],
            ["Train falls, validation turns upward", "Overfitting: memorising noise", "Early stopping, dropout, L1/L2, smaller net, more data"],
            ["Both low and close", "Good fit", "Stop; evaluate once on the test set"],
          ]} />
          <Sub>Techniques</Sub>
          <Table wide head={["Technique", "Formula / rule", "Notes"]} rows={[
            ["L2 (ridge, weight decay)", <T key="1">{String.raw`L=L_0+\lambda\sum w^2`}</T>, "Smoothly shrinks all weights. Try λ = 0.01, 0.1, 1"],
            ["L1 (lasso)", <T key="2">{String.raw`L=L_0+\lambda\sum|w|`}</T>, "Pushes weights to exactly 0 (feature selection). Try 0.001–0.1"],
            ["Elastic net", <T key="3">{String.raw`L=L_0+\lambda_1\sum|w|+\lambda_2\sum w^2`}</T>, "Both penalties. Libraries disagree on how λ is split, so state it explicitly"],
            ["Dropout", <T key="4">{String.raw`\tilde a=\frac{m\odot a}{1-p},\ m\sim\text{Bern}(1-p)`}</T>, "Training only; Dropout(0.4) in Keras. Scale keeps the expected sum"],
            ["Batch normalization", <T key="5">{String.raw`\hat x=\frac{x-\mu_B}{\sqrt{\sigma_B^2+\epsilon}},\ y=\gamma\hat x+\beta`}</T>, "γ, β learned; inference uses running statistics. Bias before BN has zero gradient"],
            ["Early stopping", "stop at the validation-loss minimum", "Train enough epochs first: 2–3 epochs teaches nothing"],
          ]} />
          <Note>Regularisers act only during training and weights should be on a comparable scale first: normalise inputs (÷255 for pixels, min–max or standardise tabular data using <i>training</i> statistics only).</Note>
        </>
      ),
    },
    {
      id: "validation", title: "7 · Data splits & validation", keywords: "train validation test holdout k-fold stratified shuffle split time series leave one out cross validation leakage",
      render: () => (
        <>
          <p className="text-sm"><b>Train</b> fits parameters · <b>validation</b> tunes hyperparameters, selects the model and estimates generalisation during training · <b>test</b> is used once, at the end, on a fully specified model. Keras: <code>validation_split=0.2</code> shuffles by default; use <code>shuffle=False</code> for ordered/time data, or the future leaks into training.</p>
          <Table wide head={["Method", "How it works", "Use when"]} rows={VALIDATION_OPTIONS.map((o) => [o.label, o.note, o.value === "time_series" ? "forecasting, RNN/LSTM on ordered data" : o.value === "holdout" ? "large data, deep learning" : o.value === "leave_one_out" ? "tiny data only" : "small–medium data, classical ML"])} />
        </>
      ),
    },
    {
      id: "metrics", title: "8 · Classification metrics", keywords: "accuracy precision recall f1 confusion matrix roc auc sensitivity specificity threshold imbalance",
      render: () => (
        <>
          <Table head={["", "Predicted 1", "Predicted 0"]} rows={[["Actual 1", "TP", "FN (a miss)"], ["Actual 0", "FP (a false alarm)", "TN"]]} />
          <Table wide head={["Metric", "Formula", "Answers"]} rows={[
            ["Accuracy", <T key="1">{String.raw`\frac{TP+TN}{TP+TN+FP+FN}`}</T>, "How often am I right? Misleading with rare classes"],
            ["Precision", <T key="2">{String.raw`\frac{TP}{TP+FP}`}</T>, "Of the flagged, how many are real?"],
            ["Recall / TPR / sensitivity", <T key="3">{String.raw`\frac{TP}{TP+FN}`}</T>, "Of the real ones, how many did I find?"],
            ["Specificity", <T key="4">{String.raw`\frac{TN}{TN+FP}=1-\text{FPR}`}</T>, "Of the real negatives, how many did I clear?"],
            ["F1", <T key="5">{String.raw`\frac{2PR}{P+R}=\frac{TP}{TP+\frac{FN+FP}{2}}`}</T>, "Harmonic mean of precision and recall"],
            ["ROC / AUC", <T key="6">{String.raw`\text{TPR vs FPR over all thresholds}`}</T>, "AUC 0.5 = guessing, 1 = perfect; = P(positive ranks above negative)"],
          ]} />
          <Note>Raising the decision threshold raises precision and lowers recall. Example (digit 5): threshold low 75% / 100%, mid 80% / 67%, high 100% / 50% (precision / recall). Multi-class: rows actual, columns predicted; accuracy = sum of the diagonal / total.</Note>
        </>
      ),
    },
    {
      id: "cnn", title: "9 · Convolutional networks (CNN)", keywords: "convolution kernel filter stride padding pooling feature map lenet alexnet vgg resnet conv2d maxpooling",
      render: () => (
        <>
          <p className="text-sm">A CNN shares small kernels across the image (shared weights, local receptive fields). Early layers find edges and corners, deeper layers shapes and objects. Layers: convolution → (activation) → pooling → … → flatten → dense.</p>
          <Table wide head={["Quantity", "Formula", "Example"]} rows={[
            ["Output size", <T key="1">{String.raw`\left\lfloor\frac{W-F+2P}{S}\right\rfloor+1`}</T>, "(32 − 5 + 0)/1 + 1 = 28 (LeNet C1)"],
            ["“valid” / “same” padding", "none / zeros so the size is unchanged (stride 1)", "P = (F−1)/2 for odd F"],
            ["Conv2D parameters", <T key="2">{String.raw`\text{filters}\times(F\cdot F\cdot C_{\text{in}}+1)`}</T>, "32 × (3·3·1 + 1) = 320; 64 × (3·3·32 + 1) = 18,496"],
            ["Pooling (2×2, stride 2)", "keeps the max (or average) per window, per channel", "area ÷ 4; no parameters"],
            ["Convolution of a window", "dot product of the window and the kernel", "1-D: (2,4,5)·(0.2,0.2,0.2) = 2.2"],
          ]} />
          <Sub>Typical kernels</Sub>
          <Table wide head={["Kernel", "Matrix", "Effect"]} rows={[
            ["Vertical edges", "[−1 0 1; −2 0 2; −1 0 1]", "Detects vertical edges"],
            ["Blur", "1/9 in every cell", "Averages neighbours"],
            ["Edge separation", "[0 −1 0; −1 4 −1; 0 −1 0]", "Highlights boundaries"],
          ]} />
          <Sub>Famous architectures</Sub>
          <Table wide head={["Model", "Fact"]} rows={[
            ["LeNet-5 (LeCun)", "32×32 → conv5×5 ×6 (28×28) → pool (14×14) → conv5×5 ×16 (10×10) → pool (5×5) → 120 → 84 → 10"],
            ["AlexNet (2012)", "224×224×3, ReLU + dropout 0.5, dense 4096–4096–1000; ImageNet top-5 error 26.0% → 16.4%"],
            ["VGG-16 (2014)", "only 3×3 convolutions; three 3×3 layers see 7×7 with 27C² weights instead of 49C² (81% more)"],
            ["ResNet (2015)", "learns a residual F(x) = H(x) − x with a skip connection F(x) + x; easier optimisation, no extra parameters"],
          ]} />
          <Note>Keras Conv2D (and the lecture's “convolution”) is technically cross-correlation: the kernel is not flipped. Try it in the Convolution Explorer tool.</Note>
        </>
      ),
    },
    {
      id: "rnn", title: "10 · Recurrent networks (RNN, LSTM, GRU)", keywords: "recurrent rnn lstm gru gate memory cell bptt sequence many to one seq2seq vanishing hidden state",
      render: () => (
        <>
          <p className="text-sm">A recurrent neuron feeds its own previous output back in, so it keeps a memory of earlier steps and handles sequences of any length. Training unrolls the network in time (<b>BPTT</b>, backpropagation through time).</p>
          <Table wide head={["Cell", "Equations", "Remarks"]} rows={[
            ["Simple RNN", <T key="1">{String.raw`y_t=\varphi(W_x^{\top}x_t+W_y^{\top}y_{t-1}+b)`}</T>, "φ = tanh (or ReLU), y₀ = 0. Mini-batch: Y = φ(X·Wx + Y₋₁·Wy + b). Vanishing/exploding gradients on long sequences"],
            ["LSTM", <T key="2">{String.raw`\begin{aligned}f&=\sigma(W_f[h_{t-1},x_t]+b_f)\\ i&=\sigma(W_i[h_{t-1},x_t]+b_i)\\ \tilde C&=\tanh(W_C[h_{t-1},x_t]+b_c)\\ C_t&=f\!\cdot\!C_{t-1}+i\!\cdot\!\tilde C\\ o&=\sigma(W_o[h_{t-1},x_t]+b_o),\ h_t=o\cdot\tanh C_t\end{aligned}`}</T>, "Forget, input, output gates (0 = door closed, 1 = open); cell state C carries long-term memory"],
            ["GRU", <T key="3">{String.raw`\begin{aligned}r&=\sigma(W_rx_t+U_rh_{t-1})\\ z&=\sigma(W_zx_t+U_zh_{t-1})\\ \tilde h&=\tanh(Wx_t+U(r\odot h_{t-1}))\\ h_t&=(1-z)h_{t-1}+z\tilde h\end{aligned}`}</T>, "Reset and update gates, one state; fewer parameters than LSTM"],
          ]} />
          <Table wide head={["Sequence mode", "Meaning", "Keras"]} rows={[
            ["Many-to-one", "sequence → one answer (sentiment)", "return_sequences=False (last LSTM)"],
            ["Many-to-many", "sequence → sequence (forecasting)", "return_sequences=True"],
            ["One-to-many", "vector → sequence", "RepeatVector / decoder"],
            ["Encoder–decoder", "encode a sequence, decode another", "two stacked RNNs"],
          ]} />
          <Note>Fixes for vanishing/exploding gradients in RNNs: good initialisation, suitable activation, normalisation/regularisation, a suitable optimizer, truncated BPTT, or gated cells (LSTM/GRU). Try the Recurrent Cell Explorer tool.</Note>
        </>
      ),
    },
    {
      id: "text", title: "11 · Text preprocessing", keywords: "tokenizer token word index pad sequences one hot multi hot embedding imdb oov sentiment vectorise",
      render: () => (
        <Table wide head={["Step", "What", "Detail"]} rows={[
          ["Tokenise", "split text into words (or characters)", "Keras Tokenizer(num_words, lower=True, char_level=False, oov_token)"],
          ["Index", "word → integer by frequency", "IMDB: 0 padding, 1 start, 2 unknown, real words start at 3 (word_index + 3)"],
          ["Pad / truncate", "equal length", "pad_sequences(maxlen=200): short → zeros, long → cut"],
          ["One-hot / multi-hot", "length-10,000 vector with 1s at the word indices", "sparse, long, inflexible"],
          ["Embedding(vocab, dim)", "learned dense vectors (8, 64, 128, 256, 512)", "similar words end up close together; (200, 8) per review"],
          ["Labels", "IMDB ratings 1–4 → 0, 7–10 → 1", "binary → sigmoid + binary cross-entropy"],
        ]} />
      ),
    },
    {
      id: "keras", title: "12 · Keras quick reference", keywords: "keras sequential compile fit evaluate predict code snippet dense conv2d lstm dropout",
      render: () => (
        <div className="space-y-3">
          <Sub>Workflow</Sub>
          <p className="text-sm">import → load data → normalise / encode → build → compile → fit → plot history → evaluate on test → predict.</p>
          <Code label="Dense classifier">{`from tensorflow import keras
from tensorflow.keras.layers import Input, Flatten, Dense, Dropout

model = keras.Sequential([
    Input(shape=(28, 28, 1)),
    Flatten(),
    Dense(100, activation="relu"),
    Dropout(0.4),
    Dense(10, activation="softmax"),
])
model.compile(optimizer=keras.optimizers.Adam(learning_rate=0.001),
              loss="categorical_crossentropy", metrics=["accuracy"])
history = model.fit(x_train / 255, keras.utils.to_categorical(y_train, 10),
                    batch_size=32, epochs=6, validation_split=0.2)
model.evaluate(x_test / 255, keras.utils.to_categorical(y_test, 10))`}</Code>
          <Code label="Small CNN">{`model = keras.Sequential([
    Input(shape=(28, 28, 1)),
    Conv2D(32, (3, 3), padding="same", activation="relu"),
    MaxPooling2D((2, 2), strides=2),
    Conv2D(64, (3, 3), padding="same", activation="relu"),
    MaxPooling2D((2, 2), strides=2),
    Flatten(),
    Dense(100, activation="relu"),
    Dense(10, activation="softmax"),
])  # 333,526 parameters`}</Code>
          <Code label="LSTM sentiment model">{`model = keras.Sequential([
    Input(shape=(200,)),
    Embedding(10000, 128),
    LSTM(64, return_sequences=True),
    LSTM(24),
    Dense(1, activation="sigmoid"),
])
model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])`}</Code>
          <Code label="Regularisation and callbacks">{`from tensorflow.keras import regularizers
Dense(64, activation="relu", kernel_regularizer=regularizers.l2(0.01))
Dense(64, activation="relu", kernel_regularizer=regularizers.l1_l2(l1=0.001, l2=0.01))
keras.layers.BatchNormalization()
early = keras.callbacks.EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True)
model.fit(x, y, validation_split=0.2, epochs=100, callbacks=[early])`}</Code>
        </div>
      ),
    },
    {
      id: "calc", title: "13 · Calculators", keywords: "calculator parameters count output size conv dense lstm gru updates epoch",
      render: () => <Calculators />,
    },
    {
      id: "debug", title: "14 · Quick diagnosis", keywords: "troubleshooting loss not decreasing nan chance accuracy overfitting diverge",
      render: () => (
        <>
          <Table wide head={["What you see", "Likely cause", "First thing to try"]} rows={[
            ["Loss barely moves", "learning rate too small, too few epochs, symmetric/zero init, saturated sigmoid", "raise the rate, train longer, Xavier/He init, ReLU-family activation"],
            ["Loss jumps around or explodes / NaN", "learning rate too large", "lower the rate by 3–10×; check inputs are scaled"],
            ["Accuracy stuck at chance (e.g. 11.35% on 10 classes)", "step too large: Adam/RMSprop at 0.1 collapse to one class", "use ~0.001 for Adam/RMSprop, 0.1–0.5 for plain SGD"],
            ["Train good, validation bad", "overfitting", "early stopping, dropout, L2/L1, fewer parameters, more data"],
            ["Both bad", "underfitting", "bigger model, longer training, better features"],
            ["Great accuracy, useless model", "imbalanced classes", "look at precision, recall, F1, ROC/AUC"],
            ["Validation score too good to be true", "data leakage (shuffled time series, scaling on all data)", "split first, fit scalers on training data only, use a time-series split"],
          ]} />
          <Note>These are rules of thumb from the lectures and common practice, not guarantees; confirm with learning curves and validation.</Note>
        </>
      ),
    },
  ],
};
