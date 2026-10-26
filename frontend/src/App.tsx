import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { Home } from "./pages/Home";
import { LabsIndex } from "./pages/LabsIndex";
import { ToolsIndex } from "./pages/ToolsIndex";
import { CheatsheetsIndex } from "./pages/CheatsheetsIndex";
import { ConceptsHub } from "./pages/ConceptsHub";
import { ConceptPage } from "./pages/ConceptPage";
import { CoveragePage } from "./pages/CoveragePage";
import { useT } from "./i18n";

const Playground = lazy(() => import("./pages/Playground").then((m) => ({ default: m.Playground })));
const CheatsheetPage = lazy(() => import("./pages/CheatsheetPage").then((m) => ({ default: m.CheatsheetPage })));
const ConvolutionExplorer = lazy(() => import("./pages/ConvolutionExplorer").then((m) => ({ default: m.ConvolutionExplorer })));
const RecurrentExplorer = lazy(() => import("./pages/RecurrentExplorer").then((m) => ({ default: m.RecurrentExplorer })));
const RunsPage = lazy(() => import("./pages/RunsPage").then((m) => ({ default: m.RunsPage })));
const TransformersPaper = lazy(() => import("./pages/TransformersPaper").then((m) => ({ default: m.TransformersPaper })));
const TransformersSlides = lazy(() => import("./pages/TransformersSlides").then((m) => ({ default: m.TransformersSlides })));
const LabPage = lazy(() => import("./pages/LabPage").then((m) => ({ default: m.LabPage })));

export default function App() {
  const t = useT();
  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:p-2">
        {t("nav.skip")}
      </a>
      <NavBar />
      <div id="main">
        <Suspense fallback={<p className="p-8 text-center text-sm text-muted" role="status">…</p>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/concepts" element={<ConceptsHub />} />
            <Route path="/concepts/:conceptId" element={<ConceptPage />} />
            <Route path="/coverage" element={<CoveragePage />} />
            <Route path="/labs" element={<LabsIndex />} />
            <Route path="/labs/:labId" element={<LabPage />} />
            <Route path="/labs/:labId/:stepId" element={<LabPage />} />
            <Route path="/tools" element={<ToolsIndex />} />
            <Route path="/cheatsheets" element={<CheatsheetsIndex />} />
            <Route path="/cheatsheets/:sheetId" element={<CheatsheetPage />} />
            <Route path="/tools/convolution" element={<ConvolutionExplorer />} />
            <Route path="/tools/recurrent" element={<RecurrentExplorer />} />
            <Route path="/tools/transformers" element={<TransformersPaper />} />
            <Route path="/tools/transformers/slides" element={<TransformersSlides />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="/runs" element={<RunsPage />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}
