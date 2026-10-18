# Lecture notes (source material for the Playground and the cheatsheets)

Working notes taken from the five uploaded lecture PDFs. Facts only; formulas as stated in the slides.

## L4 · Activation & loss functions; batch / SGD / mini-batch (37 slides)
**Activation purpose:** adds non-linearity; hidden layers usually share one activation; output activation depends on task.
Without non-linearity, any depth collapses to one linear model.
**Classical:** step (1 if x>=T else 0); sigmoid 1/(1+e^-s), σ'=σ(1-σ), max 1/4 (0.25^2=0.0625, 0.25^4=1/256≈0.0039, ~0 by layer 8-10 → vanishing gradient);
tanh (e^2s-1)/(e^2s+1), f'=1-f², range -1..1, zero-centred, faster than sigmoid, still vanishing, can explode w/o init/normalisation; used in RNN/LSTM/GRU.
**ReLU** max(0,x); f'=1 for x>0; fast, avoids vanishing gradient; dead neurons (up to ~40%), more likely with high LR/poor init; fixes: lower LR, Leaky ReLU, ELU.
**Frontier:** Leaky ReLU, ELU(α), softplus, SiLU/Swish(β), E-Swish, T-Rec, FTS; trainable activations (PReLU, Swish); costs: compute, overfitting.
**Output layer by task:** regression→linear (y=x); binary→sigmoid (prob); multi-class→softmax; multi-label→sigmoid per label.
**Softmax:** y_i = e^{s_i}/Σ_j e^{s_j}; sums to 1. Example logits (2.5,1.2,0.8)→(0.70,0.25,0.05).
**Losses:** Regression: MAE, MSE, RMSE, MSLE, MPE, MAPE, Huber, Log-Cosh. Binary: BCE, hinge, squared hinge, focal. Multiclass: categorical CE (one-hot), sparse CE, KL.
Multilabel: BCE, focal. Sequence: CTC, sequence loss. Segmentation: Dice, Jaccard, Tversky.
MAE=1/n Σ|y-ŷ| ; MSE=1/n Σ(y-ŷ)² ; RMSE=√MSE ; MSLE=1/n Σ(log(y+1)-log(ŷ+1))² ; MPE=100/n Σ(y-ŷ)/y ; MAPE=100/n Σ|y-ŷ|/y (y≠0).
Worked example: y=(90,105), ŷ=(95,100): MAE=5, MAPE=5.16%. MAPE n=1: ŷ=10,y=20→50%; ŷ=20,y=10→100% (asymmetric).
Entropy H=-Σ p log2 p. BCE L=-1/N Σ[y log p+(1-y) log(1-p)]. Multi-class CE L=-1/N Σ_i Σ_j y_ij log p_ij.
**Gradient descent variants:** θ=θ-η∇L. Batch (all data; stable, slow, memory heavy, deterministic, can stick in local minima),
SGD (1 sample; noisy, fast, can escape local minima, needs shuffling), mini-batch (m samples; balance; needs batch-size tuning).
Local minima & saddle points (non-convex: many; convex: single global minimum). Result depends on initial weights; LR too small→slow, too large→overshoot.
**Optimizers:** Momentum v=γv+η∇L, θ=θ-v (γ≈0.9). Nesterov: gradient at θ-γv_{t-1}. Adagrad G+=g², θ-=η/√(G+ε) g.
RMSprop v=β2 v+(1-β2)g² (β2≈0.9), θ-=η g/√(v+ε). Adadelta: ratio of RMS of updates to RMS of grads, no LR. Adam: m=β1 m+(1-β1)g, v=β2 v+(1-β2)g², bias-corrected m̂,v̂ (β1=.9, β2=.999, η=.001).
Nadam = Adam + Nesterov look-ahead. Keras defaults: SGD lr .01 mom .9; Adagrad lr .01 eps 1e-7; RMSprop lr .001 rho .9; Adadelta rho .95 eps 1e-6; Adam lr .001; Nadam lr .001.
**Overfit/underfit:** underfit = too simple, errors everywhere; overfit = fits noise, doesn't generalise.

## L5 · Classification performance metrics (44 slides)
**Confusion matrix** (rows actual, cols predicted): TP, FN / FP, TN. Alternative layout transposed (sklearn-style). Multiclass: diagonal = correct, off-diagonal = errors; accuracy = ΣTP_k / total.
COVID example: FN = sick patient missed (dangerous); FP = healthy flagged sick.
**Accuracy** = (TP+TN)/(TP+TN+FP+FN). Limitation (imbalance): 9990 TN, 9 FN, 0 TP → accuracy 99.9% yet recall 0.
**Precision** = TP/(TP+FP); **Recall/TPR/Sensitivity** = TP/(TP+FN); **FPR** = FP/(FP+TN); **Specificity** = 1-FPR.
**Threshold trade-off:** raising the threshold raises precision, lowers recall (digit-5 example: 6/8=75% & 6/6=100%; 4/5=80% & 4/6=67%; 3/3=100% & 3/6=50%).
**F1** = 2PR/(P+R) = TP/(TP+(FN+FP)/2) (harmonic mean). **ROC**: TPR vs FPR over thresholds; **AUC** area under it (diagonal = chance).
**Data splits:** train fits parameters; validation tunes hyperparameters/selects model/estimates generalisation during training; test only at the end (Goodfellow et al.).
**Learning curves:** underfitting = both errors high & close; overfitting = train keeps falling, validation rises; good = both low and close. **Early stopping** at validation minimum ("beautiful free lunch", Hinton) – but train enough epochs first.
Parameters = weights (learned); hyperparameters set by hand: layers, epochs, mini-batch size, learning rate, architecture.
**Keras workflow:** import → load data → build (Sequential/Functional) → compile (optimizer, loss, metrics) → fit (batch_size, epochs, validation_split) → plot history → evaluate → predict.
MNIST: 60k train / 10k test, 28×28 = 784, normalise /255; one-hot labels (to_categorical); softmax output compared with one-hot via categorical cross-entropy.
Dense param count: (inputs+1)×units → 784→100: 78,500; 100→10: 1,010; total 79,510. Steps/epoch = 48000/32 = 1500 (validation_split .2 of 60000).
Example run: epoch 1 acc .9243 val .9520 … epoch 6 train .9759 val .9613; test acc .9629.
Hidden activations named in course: sigmoid, tanh, elu, selu, relu; output softmax; optimisers sgd, rmsprop, adam.

## L6 · Controlling overfitting; validation; text preprocessing & encoding (42 slides)
**Regularisation:** adds a penalty to the loss so large weights are discouraged. Applied only during training (no effect at prediction). Normalise features first.
L2/Ridge/Tikhonov/weight decay: L_total = L_orig + λ Σ w² (larger λ → simpler model; typical try 0.01, 0.1, 1; choose by manual / grid search / CV).
L1/Lasso: L_total = L_orig + λ Σ |w| (sparse weights, feature selection; typical 0.001–0.1; non-differentiable at 0).
Elastic Net: L_orig + λ(1-α) Σ|w| + λ α Σ w² per slide (α=1 → Lasso, α=0 → Ridge as written on slide; note: scikit-learn uses the opposite convention for l1_ratio).
L1 pros: feature selection, robust to outliers, interpretable; cons: non-differentiable at 0, may over-shrink, arbitrary pick among correlated features.
L2 pros: smooth, handles multicollinearity, stable; cons: no feature selection, sensitive to outliers, less interpretable.
Model-complexity picture: degree 1 underfit, 2 good, 300 overfit. **Early stopping**: stop at validation minimum (but train enough epochs).
**Dropout:** each neuron dropped with probability p (rate); q=1-p active; active outputs scaled by 1/q = 1/(1-p) so expected sum unchanged (inverted dropout); only during training. Keras Dropout(0.4).
**Batch normalisation:** per mini-batch μ_B, σ²_B; x̂=(x-μ_B)/√(σ²_B+ε); y=γx̂+β (γ, β learned).
**Validation methods:** hold-out (validation_split; shuffle=True default; use shuffle=False for ordered/time data to avoid leakage); K-fold (K models, each fold validates once; small–medium data; costly for DL);
Stratified K-fold (keeps class proportions; example 12 samples 4/8 → 3 folds); Shuffle-split (repeated random splits; may miss rare classes); Leave-one-out / Leave-p-out (tiny data, very slow);
Time-series split (training window grows; future never used: 0-19|20-39, 0-39|40-59, …). Test set kept separate; CV chooses best params, retrain, final evaluation on test.
**Text:** IMDB 50k reviews (25k/25k), ratings 1–4 → 0, 7–10 → 1. Token = word or char; tokenisation → vectorisation → encoding. Keras Tokenizer(num_words, filters, lower, split, char_level, oov_token).
IMDB index: 0 pad, 1 start, 2 unknown, words indexed from 3 (word_index+3). pad_sequences(maxlen=200, padding pre/post, truncating).
One-hot / multi-hot vectorisation: results[i, seq]=1 (dimension 10,000). Dense model 10000→16→16→1 sigmoid, BCE, Adam .001.
**Embeddings:** dense learned vectors (256/512/1024 dims vs 20,000 one-hot), similar words close; Embedding(vocab, dim). Model: Embedding(10000, 8) → Flatten (200×8=1600) → Dense32 → Dense16 → Dense1; 131,777 params (80,000 + 51,232 + 528 + 17).
Dense text model 200→100→50→1 = 20,100 + 5,050 + 51 = 25,201 params.

## L7 · Convolutional neural networks (42 slides)
History: LeNet (LeCun 1988/1998), AlexNet 2012 (ImageNet top-5 error 26.0 (2011) → 16.4 (AlexNet) → 11.7 ZF → 7.3 VGG → 6.7 GoogLeNet → human 5.0 → 3.6 ResNet 2015 → 3.1 2016); Hubel & Wiesel (Nobel 1981) local receptive fields, hierarchy; neocognitron 1980.
Uses: image search, video, self-driving, speech, NLP, medical imaging, face recognition.
**Core principles:** shared weights, local pixel relationships; layers: convolution, pooling (max/average), fully connected. Early layers edges/corners, deeper shapes/objects.
**1-D convolution:** signal 1,2,4,5,77,11,109; kernel 0.2,0.2,0.2; window (2,4,5): 2·0.2+4·0.2+5·0.2 = 2.2. Kernel = weights; output = dot product of slice and kernel. Slide kernel, multiply matching elements.
**Kernels:** vertical edges [[-1,0,1],[-2,0,2],[-1,0,1]], blur 1/9 everywhere, edge separation [[0,-1,0],[-1,4,-1],[0,-1,0]], sharpen/detail [[-1,0,1],[-2,0,2],[-1,0,1]] (as on slide). Learned automatically. Typical sizes 3×3, 5×5; 7×7, 9×9 less common. Output = feature map.
**Exercise A (stride 1, valid):** I = [[1,2,3,1,2,3],[-1,0,3,0,1,2],[1,2,-3,1,-1,0],[-1,2,3,0,-1,3],[1,0,-3,1,3,-2],[-2,1,0,1,2,1]], K = [[0,1,0],[1,0,1],[1,0,1]] → 4×4 output.
**Exercise B (stride 1, same padding):** I (pre-padded 5×5 shown) interior [[1,2,3],[-1,0,3],[1,2,-3]]… with ring of zeros as drawn; K as above; compare sizes (same → 3×3 out for 3×3 in).
**Padding:** valid = none (output smaller), same = zeros so output size = input size (stride 1). Neuron (i,j) sees rows i..i+f_h-1, cols j..j+f_w-1.
**Stride:** output region rows i·s_h .. i·s_h+f_h-1; bigger stride → smaller output. Output size (valid) = floor((W-F)/S)+1; with padding P: floor((W-F+2P)/S)+1. LeNet: (32-5+1)=28.
**Feature maps:** one filter → one map; neurons in a map share weights+bias; multiple maps stack into 3-D; input channels (RGB; satellite infrared) → translation invariance, fewer parameters.
**Pooling:** subsampling; reduces H,W, cost, overfitting; max pooling keeps largest; 2×2 stride 2 → area /4 (25% kept); per channel (depth unchanged).
**Exercise C:** max pool 2×2 stride 2 on I = [[1,2,3,1,2,3],[-1,0,3,0,1,2],[1,2,-3,1,-1,0],[-1,2,3,0,-1,3],[1,0,-3,1,3,-2],[-2,1,0,1,2,1]] → 3×3.
**LeNet-5:** input 32×32 → C1 conv 5×5 ×6 → 28×28×6 → S2 avg pool → 14×14×6 → C3 conv 5×5 ×16 → 10×10×16 → S4 → 5×5×16 → flatten → 120 → 84 → 10. (Slide LeNet diagram uses 28×28 input + padding 2, sigmoid, avg pool.) AlexNet: 224×224×3; 11×11/4 ×96 → 54×54(slide) ; ReLU, max pool 3×3/2; dense 4096,4096,1000 with dropout 0.5.
**Keras Conv2D:** filters, kernel_size, strides=(1,1), padding='valid', activation, use_bias, kernel_initializer glorot_uniform, bias zeros. MaxPooling1D/2D: pool_size, strides (default = pool_size), padding.
**MNIST CNN:** Input 28×28×1 → Conv2D(32,3,same,relu) → MaxPool(2,2) 14×14×32 → Conv2D(64,3,same,relu) → MaxPool 7×7×64 → Flatten 3136 → Dense100 → Dense10 softmax.
Params: conv1 32×(3·3+1)=320; conv2 64×(3·3·32+1)=18,496; dense 3136·100+100=313,700; out 1,010; total 333,526. Adam lr .01 (slide), batch 32, epochs 6, val .2.
**Text CNN (IMDB):** Embedding(10000,8) → Conv1D(100,5,relu) (196×100, 4,100 params) → MaxPool1D(2) 98×100 → Conv1D(200,5) 94×200 (100,200) → MaxPool 47×200 → Flatten 9,400 → Dense128 (1,203,328) → Dense1 (129); total 1,387,757. Run: train acc .9667 val .8616 (epoch 5), test acc .8502 loss .4896 → overfitting.
**VGG** (Simonyan & Zisserman 2014): all 3×3 convs; VGG-16 has 16 weight layers; 133–144M params. Three 3×3 layers = receptive field 7×7 with 3·(3²C²)=27C² weights vs 49C² (81% more) for one 7×7.
Keras VGG16(weights='imagenet', include_top=True); preprocess_input; expand_dims; argmax → 161 'basset hound'. **ResNet:** learn residual F(x)=H(x)-x; skip connection F(x)+x; easier optimisation, no extra params. Toy ResNet (functional API) CIFAR-10.
Model comparison chart: Top-1 accuracy vs GFLOPs (until 2018, Bianco et al.).

## L8 · Recurrent neural networks (30 slides)
Network types: feed-forward dense, feed-forward CNN, feedback/recurrent (RNN). Hopfield 1982, Elman 1990 (context/"cloned state" units). RNNs: variable-length sequences, keep information from earlier steps, time series/text/audio.
**Recurrent neuron:** at step t gets x(t) and its own previous output y(t-1); unrolled through time. Layer has two weight sets Wx and Wy (Wh).
**Output:** y(t) = φ(Wxᵀ x(t) + Wyᵀ y(t-1) + b); φ usually tanh (ReLU also); y0 = 0.
**Mini-batch:** Y(t) = φ(X(t)·Wx + Y(t-1)·Wy + b) = φ([X(t) Y(t-1)]·W + b), W = [Wx; Wy]. Shapes: Y m×n_neurons, X m×n_inputs, Wx n_inputs×n_neurons, Wy n_neurons×n_neurons, b n_neurons; stacked W (n_inputs+n_neurons)×n_neurons.
**Memory cell:** state h(t)=f(h(t-1), x(t)); output y(t) depends on state and current input.
**Sequence modes:** seq→seq (many-to-many, e.g. forecasting), seq→vector (many-to-one, e.g. sentiment; ignore earlier outputs), vector→seq (one-to-many), encoder–decoder.
**Training:** Backpropagation Through Time (BPTT): unroll, apply backprop; cost C(Y(tmin..tmax)).
**SimpleRNN Keras:** units, activation tanh, kernel_initializer glorot_uniform, recurrent_initializer orthogonal, return_sequences, return_state, dropout, recurrent_dropout.
**Simple-RNN problems:** long sequences → very deep unrolled net → vanishing/exploding gradients; fixes: init, activation, normalisation/regularisation, optimizer, truncated BPTT; forgets earliest inputs → LSTM.
**LSTM** (Hochreiter & Schmidhuber 1997): cell state C and hidden state h; gates (sigmoid, values 0..1 = "how open the door"):
f_t = σ(W_f·[h_{t-1}, x_t] + b_f); i_t = σ(W_i·[h_{t-1}, x_t] + b_i); C̃_t = tanh(W_C·[h_{t-1}, x_t] + b_c); C_t = f_t * C_{t-1} + i_t * C̃_t;
o_t = σ(W_o·[h_{t-1}, x_t] + b_o); h_t = o_t * tanh(C_t). Data-through-gates demo: x*0 = zeros (closed), x*1 = x (open), x*0.3, x*0.9 partial.
Keras LSTM: units, activation tanh, recurrent_activation sigmoid, unit_forget_bias True, return_sequences...
**GRU** (Cho et al. 2014): reset gate r and update gate z, single state h:
r_t = σ(W_r x_t + U_r h_{t-1}); h̃_t = tanh(W x_t + U (r_t ⊙ h_{t-1})); z_t = σ(W_z x_t + U_z h_{t-1}); h_t = (1-z_t) h_{t-1} + z_t h̃_t. Keras GRU has reset_after=True by default.
LSTM/GRU memory cell keeps gradient from dropping below a level.
**IMDB LSTM sentiment:** Embedding(10000,128) → LSTM(64, return_sequences=True) → LSTM(24) → Dense(1, sigmoid); BCE, Adam, 5 epochs, batch 128, val .1; GRU same with GRU layers. Measure time with time.time(). Learning curves 20 epochs: train acc → ~1.0, val acc ~.85, val loss rises to ~.7 (overfitting). Example prediction .204 for a negative review (mark 4).
