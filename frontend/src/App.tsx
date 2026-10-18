import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { Home } from "./pages/Home";
import { LabsIndex } from "./pages/LabsIndex";
import { ToolsIndex } from "./pages/ToolsIndex";

const Playground = lazy(() => import("./pages/Playground").then((m) => ({ default: m.Playground })));
const LabPage = lazy(() => import("./pages/LabPage").then((m) => ({ default: m.LabPage })));

export default function App() {
  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:p-2">
        Skip to content
      </a>
      <NavBar />
      <div id="main">
        <Suspense fallback={<p className="p-8 text-center text-sm text-muted" role="status">Loading…</p>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/labs" element={<LabsIndex />} />
            <Route path="/labs/:labId" element={<LabPage />} />
            <Route path="/labs/:labId/:stepId" element={<LabPage />} />
            <Route path="/tools" element={<ToolsIndex />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}
