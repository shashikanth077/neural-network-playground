import type { LabSetup } from "../types";

/**
 * Lab 2 · Setup & run (the Keras homework script). Text lives in `i18n/messages/labsetup.ts` under `setup.lab2.*`.
 * `tested: ["linux"]` means the authors ran it on Linux with Python 3.12.3 and TensorFlow 2.21.0 (CPU only);
 * nothing was run on macOS or Windows.
 */
export const lab2Setup: LabSetup = {
  needs: { python: "yes", backend: "no", database: "no" },
  python: {
    version: "3.12",
    packages: [{ name: "tensorflow-cpu" }, { name: "pandas" }, { name: "matplotlib" }, { name: "pillow" }],
  },
  node: { version: "20+" },
  stages: [
    {
      id: "python",
      check: true,
      commands: [{ id: "version", cmd: { linux: "python3.12 --version", mac: "python3.12 --version", windows: "py -3.12 --version" } }],
    },
    {
      id: "venv",
      check: true,
      commands: [
        { id: "create", cmd: { linux: "python3.12 -m venv .venv-lab2", mac: "python3.12 -m venv .venv-lab2", windows: "py -3.12 -m venv .venv-lab2" } },
        { id: "activate", cmd: { linux: "source .venv-lab2/bin/activate", mac: "source .venv-lab2/bin/activate", windows: ".venv-lab2\\Scripts\\activate" } },
      ],
    },
    {
      id: "install",
      check: true,
      commands: [
        { id: "pip", cmd: "pip install tensorflow-cpu pandas matplotlib pillow", tested: ["linux"] },
        { id: "import", cmd: "python -c \"import tensorflow as tf; print(tf.__version__)\"" },
      ],
    },
    {
      id: "photos",
      check: true,
      commands: [
        {
          id: "copy",
          cmd: {
            linux: "cd scripts/lab2\nmkdir -p handwritten\ncp /path/to/your/photos/digit7.png handwritten/",
            mac: "cd scripts/lab2\nmkdir -p handwritten\ncp /path/to/your/photos/digit7.png handwritten/",
            windows: "cd scripts\\lab2\nmkdir handwritten\ncopy C:\\path\\to\\your\\photos\\digit7.png handwritten\\",
          },
        },
      ],
    },
    {
      id: "run",
      check: true,
      commands: [{ id: "run", cmd: "python lab2.py", tested: ["linux"] }],
    },
    {
      id: "results",
      check: true,
      commands: [{ id: "list", cmd: { linux: "ls results", mac: "ls results", windows: "dir results" } }],
    },
    { id: "lab1", optional: true, check: true },
    { id: "browser", optional: true, check: true, commands: [{ id: "dev", cmd: "cd frontend\nnpm install\nnpm run dev" }] },
  ],
  folders: [
    { id: "script", path: "scripts/lab2/lab2.py" },
    { id: "readme", path: "scripts/lab2/README.md" },
    { id: "photos", path: "scripts/lab2/handwritten/" },
    { id: "results", path: "scripts/lab2/results/" },
    { id: "lab1", path: "../LabWork1/results/summary.json" },
    { id: "recorded", path: "frontend/src/labs/lab2/data/results.ts" },
    { id: "pages", path: "frontend/src/labs/lab2/" },
    { id: "venv", path: ".venv-lab2/" },
  ],
  data: [
    { id: "mnist", name: "mnist.npz", bytes: 11_490_434, auto: true },
    { id: "imdb", name: "imdb.npz", bytes: 17_464_789, auto: true },
    { id: "words", name: "imdb_word_index.json", bytes: 1_641_221, auto: true },
    { id: "photos", name: "handwritten/digitN.png", auto: false },
  ],
  timeFor: [{ id: "cnn", vars: { a: 80, b: 220 } }, { id: "all" }],
  database: false,
  troubleshooting: [{ id: "py313" }, { id: "folder" }, { id: "slow" }, { id: "lab1" }, { id: "offline" }, { id: "label" }, { id: "numbers" }],
  flow: {
    python: { state: "used", detail: "scripts/lab2/lab2.py" },
    api: { state: "unused" },
    ui: { state: "used", detail: "labs/lab2/data/results.ts" },
    db: { state: "unused" },
  },
};
