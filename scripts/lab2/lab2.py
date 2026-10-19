# %% Step 0 - imports, folders, helpers
import os, sys, json, time, re
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"          # keep the console readable
import tensorflow as tf
from tensorflow.keras import layers, models, optimizers, utils
from tensorflow.keras.datasets import mnist, imdb
from PIL import Image, ImageFilter

os.makedirs("results", exist_ok=True)
SEED = 42
summary = {}                                      # numbers for the report end up here
IN_NOTEBOOK = "ipykernel" in sys.modules          # show plots in a notebook, just save them in a script

gpus = tf.config.list_physical_devices("GPU")
summary["hardware"] = ("GPU: " + ", ".join(g.name for g in gpus)) if gpus else "CPU only (no GPU / TPU used)"
print("hardware:", summary["hardware"])


def save_json():
    with open("results/summary.json", "w") as f:
        json.dump(summary, f, indent=2)


def finish_plot(name):
    """Save the current figure into results/ and show it (notebook) or close it (script)."""
    plt.tight_layout()
    plt.savefig(f"results/{name}.png", dpi=150)
    plt.show() if IN_NOTEBOOK else plt.close()


def pick_best(rows):
    """Index of the best run: highest validation accuracy, lower validation loss breaks ties.
    Validation (not test) data is used so the test set stays untouched for the final comparison."""
    return max(range(len(rows)), key=lambda i: (rows[i]["val_acc"], -rows[i]["val_loss"]))

# %% Step 1 - load MNIST, reshape to (28, 28, 1) images
# A CNN keeps the 2D structure of the image, so no flattening to 784 here
# (that was the difference to the fully connected nets of Lab 1).
(x_tr_raw, y_tr_raw), (x_te_raw, y_te_raw) = mnist.load_data()
x_train = x_tr_raw.reshape(-1, 28, 28, 1).astype("float32") / 255    # pixels 0..1
x_test = x_te_raw.reshape(-1, 28, 28, 1).astype("float32") / 255
y_train_oh = utils.to_categorical(y_tr_raw, 10)
y_test_oh = utils.to_categorical(y_te_raw, 10)
print("train:", x_train.shape, " test:", x_test.shape)

# %% Step 2 - turn my own handwritten digit(s) into MNIST-style input
# MNIST digits are white on black, fit a 20x20 box and are centred by centre of mass
# inside 28x28. A photo of pen on paper has to be converted the same way, otherwise
# the network sees something it was never trained on.
def preprocess_digit(path):
    rgb = np.array(Image.open(path).convert("RGB"), dtype="float32")
    paper = np.median(rgb.reshape(-1, 3), axis=0)         # most common colour = the paper
    ink = np.abs(rgb - paper).max(axis=2)                 # how far each pixel is from the paper
    ink = np.clip(ink / ink.max(), 0, 1)
    ink[ink < 0.25] = 0                                   # drop paper texture and shadows
    ys, xs = np.where(ink > 0)
    ink = ink[ys.min():ys.max() + 1, xs.min():xs.max() + 1]   # crop to the drawn digit
    scale = 20 / max(ink.shape)
    size = (max(1, round(ink.shape[1] * scale)), max(1, round(ink.shape[0] * scale)))
    small = Image.fromarray((ink * 255).astype("uint8")).resize(size, Image.LANCZOS)
    small = np.array(small.filter(ImageFilter.MaxFilter(3)), dtype="float32") / 255   # thicker pen like MNIST
    canvas = np.zeros((28, 28), dtype="float32")
    top, left = (28 - small.shape[0]) // 2, (28 - small.shape[1]) // 2
    canvas[top:top + small.shape[0], left:left + small.shape[1]] = small
    cy = (canvas.sum(axis=1) @ np.arange(28)) / canvas.sum()
    cx = (canvas.sum(axis=0) @ np.arange(28)) / canvas.sum()
    return np.roll(canvas, (round(13.5 - cy), round(13.5 - cx)), axis=(0, 1))


# every handwritten/digitN.png is used; N in the file name is the true digit.
# To test more digits, just add files such as digit3.png, digit7.png to the folder.
my_digits, my_labels, my_names = [], [], []
for fname in sorted(os.listdir("handwritten")):
    m = re.fullmatch(r"digit(\d)\.(png|jpg|jpeg)", fname.lower())
    if m:
        my_digits.append(preprocess_digit(os.path.join("handwritten", fname)))
        my_labels.append(int(m.group(1)))
        my_names.append(fname)
my_digits = np.array(my_digits).reshape(-1, 28, 28, 1)
print("handwritten digits found:", list(zip(my_names, my_labels)))

fig, ax = plt.subplots(2, len(my_digits), figsize=(2.6 * len(my_digits), 5), squeeze=False)
for i, name in enumerate(my_names):
    ax[0, i].imshow(Image.open(os.path.join("handwritten", name))); ax[0, i].set_title("photo"); ax[0, i].axis("off")
    ax[1, i].imshow(my_digits[i, :, :, 0], cmap="gray"); ax[1, i].set_title("28x28 input"); ax[1, i].axis("off")
finish_plot("my_digit_preprocessing")

# %% Step 3 - the model builder and the training / evaluation helper
def build_cnn(filters=(32, 64), kernel=3, pool="max", dense=128, dropout=0.0, lr=0.001):
    """Conv2D -> pooling blocks, then Flatten -> Dense -> softmax.
    padding='same' keeps the size so that bigger kernels / more blocks always fit."""
    Pool = layers.MaxPooling2D if pool == "max" else layers.AveragePooling2D
    model = models.Sequential([layers.Input(shape=(28, 28, 1))])
    for f in filters:
        model.add(layers.Conv2D(f, kernel, activation="relu", padding="same"))
        model.add(Pool(2))
    model.add(layers.Flatten())
    if dropout:
        model.add(layers.Dropout(dropout))
    model.add(layers.Dense(dense, activation="relu"))
    model.add(layers.Dense(10, activation="softmax"))
    model.compile(optimizer=optimizers.Adam(learning_rate=lr),
                  loss="categorical_crossentropy", metrics=["accuracy"])
    return model


def run_cnn(epochs=5, batch=128, val=0.1, **arch):
    utils.set_random_seed(SEED)                           # same start for every run
    model = build_cnn(**arch)
    start = time.time()
    hist = model.fit(x_train, y_train_oh, epochs=epochs, batch_size=batch,
                     validation_split=val, verbose=0).history
    seconds = time.time() - start
    tr_loss, tr_acc = model.evaluate(x_train, y_train_oh, verbose=0)
    te_loss, te_acc = model.evaluate(x_test, y_test_oh, verbose=0)
    guesses = np.argmax(model.predict(my_digits, verbose=0), axis=1)
    ok = ", ".join(f"{t}: " + ("yes" if g == t else f"no (got {g})") for t, g in zip(my_labels, guesses))
    row = {"train_acc": round(tr_acc, 4), "test_acc": round(te_acc, 4),
           "train_loss": round(tr_loss, 4), "test_loss": round(te_loss, 4),
           "val_acc": round(hist["val_accuracy"][-1], 4), "val_loss": round(hist["val_loss"][-1], 4),
           "params": model.count_params(), "seconds": round(seconds), "my_digit_ok": ok}
    return model, hist, row

# %% Step 4 - five architecture variants
archs = [
    {"filters": (32,), "kernel": 3},
    {"filters": (32, 64), "kernel": 3},
    {"filters": (32, 64), "kernel": 5},
    {"filters": (32, 64, 128), "kernel": 3},
    {"filters": (64, 128), "kernel": 3},
]
rows11, hists11 = [], []
for a in archs:
    _, h, r = run_cnn(**a)
    rows11.append({"Change": "architecture", "Conv blocks": len(a["filters"]),
                   "Filters": "-".join(map(str, a["filters"])), "Kernel": a["kernel"], "Pool": "max",
                   "Dropout": 0.0, "LR": 0.001, "Epochs": 5, "Batch": 128, **r})
    hists11.append(h)
    print(rows11[-1])

best_arch_i = pick_best(rows11)
best_arch = archs[best_arch_i]
print("best architecture (validation accuracy):", best_arch)

# %% Step 5 - dropout, learning rate and epochs on the best architecture
# Each study changes exactly one setting; the rest is copied from the best architecture run.
studies = [("dropout", {"dropout": 0.3}), ("learning rate", {"lr": 0.0001}),
           ("learning rate", {"lr": 0.01}), ("epochs", {"epochs": 2}), ("epochs", {"epochs": 10})]
study_index = {}                                       # remember which row is which study
for what, change in studies:
    _, h, r = run_cnn(**{**best_arch, **change})
    rows11.append({"Change": what, "Conv blocks": len(best_arch["filters"]),
                   "Filters": "-".join(map(str, best_arch["filters"])), "Kernel": best_arch["kernel"],
                   "Pool": "max", "Dropout": change.get("dropout", 0.0), "LR": change.get("lr", 0.001),
                   "Epochs": change.get("epochs", 5), "Batch": 128, **r})
    hists11.append(h)
    study_index[(what, tuple(change.items()))] = len(rows11) - 1
    print(rows11[-1])

table11 = pd.DataFrame(rows11)
table11.insert(0, "Run", range(1, len(table11) + 1))
table11.to_csv("results/task11_table.csv", index=False)
table11

# %% Step 6 - learning curves: influence of learning rate and epochs
lr_low = study_index[("learning rate", (("lr", 0.0001),))]
lr_high = study_index[("learning rate", (("lr", 0.01),))]
ep_10 = study_index[("epochs", (("epochs", 10),))]
fig, ax = plt.subplots(1, 2, figsize=(10, 3.4))
for i, label in [(best_arch_i, "lr 0.001 (baseline)"), (lr_low, "lr 0.0001"), (lr_high, "lr 0.01")]:
    ax[0].plot(range(1, len(hists11[i]["val_accuracy"]) + 1), hists11[i]["val_accuracy"], "o-", label=label)
ax[0].set_xlabel("epoch"); ax[0].set_ylabel("validation accuracy"); ax[0].set_title("learning rate"); ax[0].legend()
h10 = hists11[ep_10]
ax[1].plot(range(1, 11), h10["loss"], label="train loss")
ax[1].plot(range(1, 11), h10["val_loss"], label="validation loss")
ax[1].set_xlabel("epoch"); ax[1].set_title("10 epochs: loss"); ax[1].legend()
finish_plot("task11_curves")

best_run = pick_best(rows11)
best_row = rows11[best_run]
best_cfg = {"filters": tuple(int(v) for v in best_row["Filters"].split("-")), "kernel": best_row["Kernel"],
            "dropout": best_row["Dropout"], "lr": best_row["LR"]}
best_epochs = best_row["Epochs"]
print("best CNN run:", best_run + 1, best_row)

# %% Step 7 - compare with the best fully connected network of Lab 1
# The Lab 1 numbers are read from its own results file, nothing is typed in by hand.
fc_path = os.path.join("..", "LabWork1", "results", "summary.json")
if os.path.exists(fc_path):
    with open(fc_path) as f:
        fc = json.load(f)["task61"]
else:
    # Lab 1 results are not in this checkout: skip the comparison instead of inventing numbers
    print("Lab 1 results not found at", fc_path, "- comparison skipped")
    fc, fc_params = None, None
if fc is not None:
    sizes = [784] + fc["neurons"] + [10]
    fc_params = sum(a_ * b_ + b_ for a_, b_ in zip(sizes[:-1], sizes[1:]))     # weights + biases per layer
    cmp11 = pd.DataFrame([
        {"Model": "Fully connected " + "-".join(map(str, fc["neurons"])) + " (Lab 1)",
         "Test accuracy": fc["test_acc"], "Test loss": fc["test_loss"], "Parameters": fc_params},
        {"Model": f"CNN {best_row['Filters']} (this lab, run {best_run + 1})",
         "Test accuracy": best_row["test_acc"], "Test loss": best_row["test_loss"], "Parameters": best_row["params"]},
    ])
    cmp11.to_csv("results/task11_vs_fc.csv", index=False)
    print(cmp11.to_string(index=False))
summary["task11"] = {"best_run": best_run + 1, "filters": list(best_cfg["filters"]), "kernel": best_cfg["kernel"],
                     "dropout": best_cfg["dropout"], "lr": best_cfg["lr"], "epochs": best_epochs,
                     "test_acc": best_row["test_acc"], "test_loss": best_row["test_loss"],
                     "fc_test_acc": fc["test_acc"] if fc else None, "fc_params": fc_params, "cnn_params": best_row["params"]}
save_json()

# %% Step 8 - average pooling
model_max, hist_max, r_max = run_cnn(epochs=best_epochs, pool="max", **best_cfg)
model_avg, hist_avg, r_avg = run_cnn(epochs=best_epochs, pool="avg", **best_cfg)
table12 = pd.DataFrame([
    {"Pooling": name, "Filters": best_row["Filters"], "Kernel": best_cfg["kernel"],
     "Dropout": best_cfg["dropout"], "LR": best_cfg["lr"], "Epochs": best_epochs, "Batch": 128, **r}
    for name, r in [("MaxPooling2D", r_max), ("AveragePooling2D", r_avg)]])
table12.to_csv("results/task12_table.csv", index=False)
summary["task12"] = {"max_test_acc": r_max["test_acc"], "avg_test_acc": r_avg["test_acc"],
                     "max_test_loss": r_max["test_loss"], "avg_test_loss": r_avg["test_loss"]}
save_json()
table12

# %% Step 9 - look inside the CNN: what does it say about my digit, and what do the filters see?
probs = model_max.predict(my_digits, verbose=0)
fig, ax = plt.subplots(1, 2, figsize=(9, 3.2))
ax[0].imshow(my_digits[0, :, :, 0], cmap="gray"); ax[0].axis("off")
ax[0].set_title(f"input (true {my_labels[0]}, predicted {int(np.argmax(probs[0]))})")
ax[1].bar(range(10), probs[0]); ax[1].set_xticks(range(10)); ax[1].set_xlabel("digit"); ax[1].set_ylabel("probability")
finish_plot("task11_my_digit_prediction")
print("probabilities for", my_names[0], np.round(probs[0], 3))

# the first Conv2D layer, 8 of its filters applied to my digit
first_conv = models.Model(model_max.inputs, model_max.layers[0].output)
maps = first_conv.predict(my_digits[:1], verbose=0)[0]
n_maps = min(8, maps.shape[-1])
fig, ax = plt.subplots(1, n_maps, figsize=(1.5 * n_maps, 1.8))
for k in range(n_maps):
    ax[k].imshow(maps[:, :, k], cmap="gray"); ax[k].axis("off"); ax[k].set_title(f"filter {k + 1}", fontsize=8)
finish_plot("task11_feature_maps")
summary["task11"]["my_digit_probs"] = [round(float(p), 4) for p in probs[0]]
save_json()

# %% Step 10 - load IMDB and prepare the two text representations
VOCAB, MAXLEN = 10000, 200            # keep the 10 000 most frequent words, cut / pad reviews to 200 words
(xt_raw, y_tr), (xe_raw, y_te) = imdb.load_data(num_words=VOCAB)
y_tr, y_te = y_tr.astype("float32"), y_te.astype("float32")
print("reviews:", len(xt_raw), len(xe_raw), " positive share in train:", y_tr.mean())

# (a) Embedding input: every review is a list of word numbers, padded/cut to the same length
x_tr_seq = utils.pad_sequences(xt_raw, maxlen=MAXLEN)
x_te_seq = utils.pad_sequences(xe_raw, maxlen=MAXLEN)


# (b) One-hot ("multi-hot") input: a 10 000-long vector with 1 for every word that occurs in the review
def multi_hot(seqs):
    out = np.zeros((len(seqs), VOCAB), dtype="float32")
    for i, s in enumerate(seqs):
        out[i, s] = 1.0
    return out


x_tr_hot, x_te_hot = multi_hot(xt_raw), multi_hot(xe_raw)
print("embedding input:", x_tr_seq.shape, " one-hot input:", x_tr_hot.shape)

# a decoded review, to see what the network really gets
word_index = imdb.get_word_index()
id_to_word = {i + 3: w for w, i in word_index.items()}      # Keras reserves 0 pad, 1 start, 2 unknown
id_to_word.update({0: "<pad>", 1: "<start>", 2: "<unk>"})
print("example review:", " ".join(id_to_word.get(i, "?") for i in xt_raw[0][:40]), "...  label:", int(y_tr[0]))

# %% Step 11 - shared helper for all text models
kept = []          # (validation accuracy, model, input kind, description): used for the final demo


def run_text(model, kind, desc, epochs, batch, val=0.2):
    """Train on one input kind ('hot' or 'seq'), return the table row and the history."""
    x_tr, x_te = (x_tr_hot, x_te_hot) if kind == "hot" else (x_tr_seq, x_te_seq)
    start = time.time()
    hist = model.fit(x_tr, y_tr, epochs=epochs, batch_size=batch, validation_split=val, verbose=0).history
    seconds = time.time() - start
    tr_loss, tr_acc = model.evaluate(x_tr, y_tr, verbose=0)
    te_loss, te_acc = model.evaluate(x_te, y_te, verbose=0)
    row = {"train_acc": round(tr_acc, 4), "test_acc": round(te_acc, 4),
           "train_loss": round(tr_loss, 4), "test_loss": round(te_loss, 4),
           "val_acc": round(hist["val_accuracy"][-1], 4), "val_loss": round(hist["val_loss"][-1], 4),
           "params": model.count_params(), "seconds": round(seconds)}
    kept.append((row["val_acc"], model, kind, desc))
    return row, hist


def compile_binary(model, opt="adam", lr=None):
    o = {"adam": optimizers.Adam, "rmsprop": optimizers.RMSprop, "sgd": optimizers.SGD}[opt]
    model.compile(optimizer=o() if lr is None else o(learning_rate=lr),
                  loss="binary_crossentropy", metrics=["accuracy"])
    return model

# %% Step 12 - six Dense models
EPOCHS_21, BATCH_21 = 5, 512
dense_archs = [(16,), (64,), (64, 32)]
rows21, hists21 = [], []
for encoding in ["one-hot", "embedding"]:
    for units in dense_archs:
        utils.set_random_seed(SEED)
        m = models.Sequential()
        if encoding == "one-hot":
            m.add(layers.Input(shape=(VOCAB,)))
        else:
            m.add(layers.Input(shape=(MAXLEN,)))
            m.add(layers.Embedding(VOCAB, 16))        # each word becomes a learned 16-number vector
            m.add(layers.Flatten())
        for u in units:
            m.add(layers.Dense(u, activation="relu"))
        m.add(layers.Dense(1, activation="sigmoid"))
        compile_binary(m)
        row, hist = run_text(m, "hot" if encoding == "one-hot" else "seq",
                             f"Dense {'-'.join(map(str, units))} / {encoding}", EPOCHS_21, BATCH_21)
        rows21.append({"Encoding": encoding, "Dense layers": "-".join(map(str, units)),
                       "Epochs": EPOCHS_21, "Batch": BATCH_21, "Val split": 0.2, **row})
        hists21.append(hist)
        print(rows21[-1])

best21 = pick_best(rows21)
table21 = pd.DataFrame(rows21)
table21.insert(0, "Run", range(1, len(table21) + 1))
table21.to_csv("results/task21_table.csv", index=False)
print("best 2.1 model: run", best21 + 1, rows21[best21]["Encoding"], rows21[best21]["Dense layers"])

h = hists21[best21]
fig, ax = plt.subplots(1, 2, figsize=(9, 3.2))
ax[0].plot(h["loss"], label="train"); ax[0].plot(h["val_loss"], label="validation")
ax[0].set_xlabel("epoch"); ax[0].set_ylabel("loss"); ax[0].legend()
ax[1].plot(h["accuracy"], label="train"); ax[1].plot(h["val_accuracy"], label="validation")
ax[1].set_xlabel("epoch"); ax[1].set_ylabel("accuracy"); ax[1].legend()
finish_plot("task21_curves")
summary["task21"] = {"best_run": best21 + 1, "encoding": rows21[best21]["Encoding"],
                     "dense": rows21[best21]["Dense layers"], "test_acc": rows21[best21]["test_acc"],
                     "test_loss": rows21[best21]["test_loss"], "epochs": EPOCHS_21, "batch": BATCH_21}
save_json()
table21

# %% Step 13 - three 1D CNNs
cnn_text = [
    {"name": "Conv1D 64x5 + GlobalMax", "blocks": [(64, 5, False)], "dense": 0},
    {"name": "Conv1D 64x5 + MaxPool + Conv1D 64x5 + GlobalMax + Dense 32",
     "blocks": [(64, 5, True), (64, 5, False)], "dense": 32},
    {"name": "Conv1D 128x3 + MaxPool + Conv1D 128x3 + GlobalMax",
     "blocks": [(128, 3, True), (128, 3, False)], "dense": 0},
]
rows22, hists22 = [], []
for cfg in cnn_text:
    utils.set_random_seed(SEED)
    m = models.Sequential([layers.Input(shape=(MAXLEN,)), layers.Embedding(VOCAB, 32)])
    for filters, k, pool_after in cfg["blocks"]:
        m.add(layers.Conv1D(filters, k, activation="relu"))
        m.add(layers.MaxPooling1D(2) if pool_after else layers.GlobalMaxPooling1D())
    if cfg["dense"]:
        m.add(layers.Dense(cfg["dense"], activation="relu"))
    m.add(layers.Dense(1, activation="sigmoid"))
    compile_binary(m)
    row, hist = run_text(m, "seq", cfg["name"], EPOCHS_21, BATCH_21)
    rows22.append({"Model": cfg["name"], "Embedding": 32, "Epochs": EPOCHS_21, "Batch": BATCH_21,
                   "Val split": 0.2, **row})
    hists22.append(hist)
    print(rows22[-1])

best22 = pick_best(rows22)
table22 = pd.DataFrame(rows22)
table22.insert(0, "Run", range(1, len(table22) + 1))
table22.to_csv("results/task22_table.csv", index=False)
summary["task22"] = {"best_run": best22 + 1, "model": rows22[best22]["Model"],
                     "test_acc": rows22[best22]["test_acc"], "test_loss": rows22[best22]["test_loss"]}
save_json()
table22

# %% Step 14 - LSTM and GRU runs
best_general = max([("2.1", rows21[best21]), ("2.2", rows22[best22])],
                   key=lambda p: (p[1]["val_acc"], -p[1]["val_loss"]))
EPOCHS_23, BATCH_23 = best_general[1]["Epochs"], best_general[1]["Batch"]
print(f"general settings taken from the best {best_general[0]} model: epochs {EPOCHS_23}, batch {BATCH_23}")

variants = [  # (units per layer, activation, optimizer)
    ((64,), "tanh", "adam"),            # base
    ((32,), "tanh", "adam"),            # fewer neurons
    ((64, 32), "tanh", "adam"),         # two layers
    ((64,), "relu", "adam"),            # other activation
    ((64,), "tanh", "rmsprop"),         # other optimizer
]
rows23 = []
for cell_name, Cell in [("LSTM", layers.LSTM), ("GRU", layers.GRU)]:
    for units, act, opt in variants:
        utils.set_random_seed(SEED)
        m = models.Sequential([layers.Input(shape=(MAXLEN,)), layers.Embedding(VOCAB, 32)])
        for i, u in enumerate(units):
            # every layer except the last passes the whole sequence on to the next one
            m.add(Cell(u, activation=act, return_sequences=(i < len(units) - 1)))
        m.add(layers.Dense(1, activation="sigmoid"))
        compile_binary(m, opt)
        desc = f"{cell_name} {'-'.join(map(str, units))} {act} {opt}"
        row, _ = run_text(m, "seq", desc, EPOCHS_23, BATCH_23)
        rows23.append({"Cell": cell_name, "Layers": len(units), "Neurons": "-".join(map(str, units)),
                       "Activation": act, "Optimizer": opt, "Epochs": EPOCHS_23, "Batch": BATCH_23,
                       "Val split": 0.2, **row})
        print(rows23[-1])

table23 = pd.DataFrame(rows23)
table23.insert(0, "Run", range(1, len(table23) + 1))
table23.to_csv("results/task23_table.csv", index=False)
best23 = pick_best(rows23)
summary["task23"] = {"best_run": best23 + 1, "cell": rows23[best23]["Cell"], "neurons": rows23[best23]["Neurons"],
                     "activation": rows23[best23]["Activation"], "optimizer": rows23[best23]["Optimizer"],
                     "test_acc": rows23[best23]["test_acc"], "seconds": rows23[best23]["seconds"],
                     "epochs": EPOCHS_23, "batch": BATCH_23}
save_json()
table23

# %% Step 15 - all text models side by side: accuracy and training time
all_text = pd.concat([
    table21.assign(Group="2.1 Dense", Name=table21["Encoding"] + " " + table21["Dense layers"]),
    table22.assign(Group="2.2 Conv1D", Name="CNN " + table22["Run"].astype(str)),
    table23.assign(Group="2.3 " + table23["Cell"],
                   Name=table23["Cell"] + " " + table23["Neurons"] + " " + table23["Activation"] + " " + table23["Optimizer"]),
], ignore_index=True)
all_text.to_csv("results/task2_all.csv", index=False)

fig, ax = plt.subplots(1, 2, figsize=(11, 4.2))
colors = {"2.1 Dense": "#8cc08c", "2.2 Conv1D": "#7aa6d6", "2.3 LSTM": "#e0a060", "2.3 GRU": "#c08cc0"}
ax[0].scatter(all_text["seconds"], all_text["test_acc"], c=all_text["Group"].map(colors), s=45)
for g, c in colors.items():
    ax[0].scatter([], [], c=c, label=g)
ax[0].set_xlabel("training time, s"); ax[0].set_ylabel("test accuracy"); ax[0].legend(); ax[0].set_title("accuracy vs time")
gap = all_text["train_acc"] - all_text["test_acc"]
ax[1].barh(range(len(all_text)), gap, color=all_text["Group"].map(colors))
ax[1].set_yticks(range(len(all_text))); ax[1].set_yticklabels(all_text["Name"], fontsize=6)
ax[1].set_xlabel("train accuracy - test accuracy (overfitting gap)")
finish_plot("task2_overview")

# %% Step 16 - a quick sentiment check on two reviews I wrote
# Demo only: two sentences are not an evaluation. The best model by validation accuracy is used.
best_kept = max(kept, key=lambda t: t[0])
print("model used:", best_kept[3], " validation accuracy:", best_kept[0])
samples = ["this movie was wonderful, great acting and a beautiful story",
           "terrible and boring film, i hated the plot and the acting"]


def encode_review(text):
    ids = [1]                                         # 1 = start of review
    for w in re.findall(r"[a-z']+", text.lower()):
        n = word_index.get(w, 10 ** 9) + 3            # Keras shifts word numbers by 3
        ids.append(n if n < VOCAB else 2)             # 2 = unknown / rare word
    return ids


enc = [encode_review(t) for t in samples]
x_demo = multi_hot(enc) if best_kept[2] == "hot" else utils.pad_sequences(enc, maxlen=MAXLEN)
p = best_kept[1].predict(x_demo, verbose=0).ravel()
for t, v in zip(samples, p):
    print(f"{v:.3f} -> {'positive' if v > 0.5 else 'negative'} : {t}")
summary["demo_reviews"] = {"model": best_kept[3], "scores": [round(float(v), 3) for v in p]}
save_json()
print("Done. Tables, figures and summary.json are in the results folder.")

