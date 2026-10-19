import type { LabSetup } from "../types";

/**
 * Lab 1 · Setup & run. Text lives in `i18n/messages/labsetup.ts` under `setup.lab1.*`.
 * `tested: ["linux"]` means the authors ran that command on Linux (Python 3.13, Node 22); nothing was run on macOS or Windows.
 */
export const lab1Setup: LabSetup = {
  needs: { python: "optional", backend: "optional", database: "no" },
  python: {
    version: "3.11+",
    packages: [{ name: "fastapi" }, { name: "uvicorn[standard]" }, { name: "numpy" }, { name: "pydantic" }, { name: "pytest" }, { name: "httpx" }, { name: "torch" }],
  },
  node: { version: "20+" },
  stages: [
    { id: "browser", check: true },
    {
      id: "frontend",
      optional: true,
      check: true,
      commands: [
        { id: "node", cmd: "node --version" },
        { id: "install", cmd: "cd frontend\nnpm install" },
        { id: "dev", cmd: "npm run dev", tested: ["linux"] },
      ],
    },
    {
      id: "backend",
      optional: true,
      check: true,
      commands: [
        { id: "venv", cmd: { linux: "cd backend\npython3 -m venv .venv", mac: "cd backend\npython3 -m venv .venv", windows: "cd backend\npy -3 -m venv .venv" }, tested: ["linux"] },
        { id: "activate", cmd: { linux: "source .venv/bin/activate", mac: "source .venv/bin/activate", windows: ".venv\\Scripts\\activate" }, tested: ["linux"] },
        { id: "install", cmd: "pip install -r requirements-dev.txt", tested: ["linux"] },
        { id: "run", cmd: "uvicorn app.main:app --reload --port 8000", tested: ["linux"] },
        { id: "health", cmd: { linux: "curl http://localhost:8000/api/health", mac: "curl http://localhost:8000/api/health", windows: "Invoke-RestMethod http://localhost:8000/api/health" }, tested: ["linux"] },
      ],
    },
    {
      id: "docker",
      optional: true,
      commands: [{ id: "up", cmd: "docker compose up --build" }],
    },
    {
      id: "torch",
      optional: true,
      check: true,
      commands: [
        { id: "install", cmd: "pip install torch" },
        { id: "test", cmd: "pytest -q" },
      ],
    },
    {
      id: "tests",
      optional: true,
      commands: [
        { id: "test", cmd: "cd frontend\nnpm test", tested: ["linux"] },
        { id: "types", cmd: "npm run typecheck", tested: ["linux"] },
      ],
    },
  ],
  folders: [
    { id: "labs", path: "frontend/src/labs/lab1/" },
    { id: "math", path: "frontend/src/labs/lab1/math.ts" },
    { id: "data", path: "frontend/src/labs/lab1/data.ts" },
    { id: "shell", path: "frontend/src/pages/LabPage.tsx" },
    { id: "proxy", path: "frontend/vite.config.ts" },
    { id: "nn", path: "backend/app/nn.py" },
    { id: "reqs", path: "backend/requirements.txt, backend/requirements-dev.txt" },
    { id: "env", path: ".env.example" },
    { id: "api", path: "docs/API.md" },
  ],
  data: [
    { id: "bundled", name: "frontend/src/labs/lab1/data.ts", auto: true },
    { id: "curves", name: "frontend/public/labs/lab1/learning-curves.png", auto: true },
  ],
  database: false,
  troubleshooting: [{ id: "proxy" }, { id: "cors" }, { id: "pyver" }, { id: "nodever" }, { id: "progress" }, { id: "torch" }],
  flow: {
    python: { state: "optional", detail: "backend/app/nn.py" },
    api: { state: "optional", detail: "FastAPI · /api" },
    ui: { state: "used", detail: "labs/lab1/math.ts" },
    db: { state: "unused" },
  },
};
