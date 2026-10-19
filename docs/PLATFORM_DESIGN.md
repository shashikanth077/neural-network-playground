# AI Lab: platform design

AI Lab is a place to **learn AI by operating it**, not a single neural-network app. It is built so that a new
topic, lab or tool is a small addition, and so that the platform can say honestly what it covers.

## Five kinds of content

| Layer | What it is | Where it lives | Add one by |
|---|---|---|---|
| **Concepts** | One idea (for example dropout), what it is, why it matters, something to try, prerequisites, and links to where it is practised | `frontend/src/concepts/registry.ts` | adding an entry with real evidence links |
| **Labs** | A guided, multi-step project with demos, a guide, quiz and recorded results | `frontend/src/labs/<lab>/` + `labs/registry.ts` | folder + registry line |
| **Tools** | A stand-alone interactive app (Playground, Convolution Explorer, Recurrent Cell Explorer) | `pages/` + `lib/features.ts` | page + route + registry line |
| **Cheatsheets** | Searchable, printable reference | `frontend/src/cheatsheets/` | file + registry line |
| **Backend** | Python (NumPy network today; Keras scripts for Lab 2) behind FastAPI | `backend/`, `scripts/lab2/` | endpoint + tests |

The concept registry is the spine. A concept names its **evidence**: a Learning Center topic, a Playground
section, a guided experiment, a lab step, a tool or a cheatsheet section. Hands-on evidence counts as a
*live example*; a cheatsheet alone counts as *reference only*; no evidence means *planned*.

`/concepts` is the map (filter by area, level, coverage), `/concepts/:id` is one concept with its prerequisites and
what it leads to, and `/coverage` is a generated table of every concept against every kind of place.
`src/test/concepts.test.ts` fails if any evidence link points at something that does not exist, if prerequisites
form a cycle, or if a planned concept has no description of its future live example, so the coverage claim cannot
quietly rot.

## Coverage of the neural-network material (from the five lectures)

Live example: neuron, activation functions, layers and the forward pass, output layers and softmax, weight
initialisation, loss functions, gradient descent, backpropagation, learning rate, batches and epochs, optimizers,
vanishing gradients, under/over-fitting, L1/L2, dropout, batch norm, early stopping, cross-validation, metrics,
decision boundaries, convolution, stride and padding, pooling, receptive field, CNN parameter counts, preparing an
image, text as numbers, Conv1D, RNN/LSTM/GRU, Keras code, diagnosing a failing run, plus the data-preparation
concepts of Lab 1.

Planned (each has its intended live example written in the registry): attention and transformers, residual
connections, transfer learning and augmentation, autoencoders, generative models, hyperparameter search,
explainability, and saving/serving models with an experiment database.

## Python to frontend (how a lab is wired)

1. **Python** does the work: the NumPy network (`backend/app/nn.py`) or a Keras script (`scripts/lab2/lab2.py`).
2. **API**: FastAPI exposes training, evaluation and cross-validation (`docs/API.md`). Sessions are in memory, so
   run one backend process.
3. **Frontend**: React pages call the API (Playground) or display recorded results and run the toy maths in the
   browser (labs).
4. **Database**: not used yet. The planned "experiment tracking" work stores each run (settings, metrics, time) in
   a database so runs can be listed, compared and re-opened; it is the first item for *Saving, serving and
   storing runs*.

## Languages

English, Kannada and Lithuanian. Each message namespace (`src/i18n/messages/*`) must have exactly the same keys in
all three languages (tested). Concept titles and descriptions currently fall back to English; the page says so.

## Not done yet

* Experiment database and a "my runs" page.
* A visual redesign of the home page around the concept map.
* A lab template with Setup (Python environment), Code, Run and Deploy tabs for every lab.
* Translation of the concept texts into Kannada and Lithuanian.
* Live Keras training from the browser (TensorFlow is heavy and slow on CPU; today the lab shows recorded runs).
