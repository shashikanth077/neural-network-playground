import type { LabSetup } from "../types";
import { MODELS } from "./data/expModels";

const classical = MODELS.filter((m) => m.family === "classical").map((m) => m.trainSeconds);

/**
 * Lab 3 · Setup & run. The lesson pages of the lab run in the browser on recorded results; this guide is for reproducing
 * the team's experiment (github.com/shashikanth077/Transformers-NLP): Python 3.11, the CPU build of PyTorch, `bash run_all.sh`
 * in `code/`. Text lives in `i18n/messages/labsetup3.ts` under `setup.lab3.*`.
 * No command is marked `tested`: the experiment was run by the paper's team on Windows 11; the commands below were written
 * from the repository's README and were NOT run by the authors of this lab, so the panel says "not run" for all of them.
 */
export const lab3Setup: LabSetup = {
  needs: { python: "optional", backend: "no", database: "no" },
  python: {
    version: "3.11",
    packages: [{ name: "torch" }, { name: "transformers" }, { name: "datasets" }, { name: "scikit-learn" }, { name: "pandas" }, { name: "matplotlib" }, { name: "accelerate" }],
  },
  node: { version: "20+" },
  stages: [
    {
      id: "python",
      check: true,
      commands: [{ id: "version", cmd: { linux: "python3.11 --version", mac: "python3.11 --version", windows: "py -3.11 --version" } }],
    },
    {
      id: "clone",
      check: true,
      commands: [
        { id: "clone", cmd: "git clone https://github.com/shashikanth077/Transformers-NLP.git" },
        { id: "cd", cmd: { linux: "cd Transformers-NLP/code", mac: "cd Transformers-NLP/code", windows: "cd Transformers-NLP\\code" } },
      ],
    },
    {
      id: "venv",
      check: true,
      commands: [
        { id: "create", cmd: { linux: "python3.11 -m venv .venv", mac: "python3.11 -m venv .venv", windows: "py -3.11 -m venv .venv" } },
        { id: "activate", cmd: { linux: "source .venv/bin/activate", mac: "source .venv/bin/activate", windows: ".venv\\Scripts\\activate" } },
      ],
    },
    {
      id: "torch",
      check: true,
      commands: [{ id: "pip", cmd: "pip install torch --index-url https://download.pytorch.org/whl/cpu" }],
    },
    {
      id: "install",
      check: true,
      commands: [
        { id: "pip", cmd: "pip install -r requirements.txt" },
        { id: "import", cmd: "python -c \"import torch, transformers, sklearn; print(torch.__version__, transformers.__version__)\"" },
      ],
    },
    {
      id: "quick",
      optional: true,
      check: true,
      commands: [
        { id: "prepare", cmd: "python 01_prepare_data.py" },
        { id: "baselines", cmd: "python 02_classical_baselines.py" },
      ],
    },
    {
      id: "run",
      check: true,
      commands: [{ id: "run", cmd: "bash run_all.sh" }],
    },
    {
      id: "results",
      check: true,
      commands: [{ id: "list", cmd: { linux: "ls results", mac: "ls results", windows: "dir results" } }],
    },
    { id: "browser", optional: true, check: true, commands: [{ id: "dev", cmd: "cd frontend\nnpm install\nnpm run dev" }] },
  ],
  folders: [
    { id: "code", path: "Transformers-NLP/code/" },
    { id: "runall", path: "Transformers-NLP/code/run_all.sh" },
    { id: "req", path: "Transformers-NLP/code/requirements.txt" },
    { id: "data", path: "Transformers-NLP/code/data/" },
    { id: "results", path: "Transformers-NLP/code/results/" },
    { id: "figures", path: "Transformers-NLP/code/figures/" },
    { id: "recorded", path: "frontend/src/labs/lab3/data/" },
    { id: "generator", path: "scripts/make_lab3_data.py" },
    { id: "pages", path: "frontend/src/labs/lab3/" },
    { id: "venv", path: ".venv/" },
  ],
  data: [
    { id: "sst2", name: "SST-2 (nyu-mll/glue)", auto: true },
    { id: "models", name: "Hugging Face Hub models", auto: true },
  ],
  timeFor: [{ id: "all" }, { id: "classical", vars: { a: Math.min(...classical).toFixed(1), b: Math.max(...classical).toFixed(1) } }],
  database: false,
  troubleshooting: [{ id: "torch" }, { id: "slow" }, { id: "offline" }, { id: "tokenizer" }, { id: "datasets" }, { id: "windows" }, { id: "numbers" }],
  flow: {
    python: { state: "used", detail: "Transformers-NLP/code/*.py" },
    api: { state: "unused" },
    ui: { state: "used", detail: "labs/lab3/data/exp*.ts" },
    db: { state: "unused" },
  },
};
