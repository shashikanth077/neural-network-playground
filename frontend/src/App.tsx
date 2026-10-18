import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { Home } from "./pages/Home";
const Playground = lazy(() => import("./pages/Playground").then((m) => ({ default: m.Playground })));

export default function App() {
  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:p-2">
        Skip to content
      </a>
      <NavBar />
      <div id="main">
        <Suspense fallback={<p className="p-8 text-center text-sm text-muted">Loading…</p>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="*" element={<Home />} />
        </Routes>
        </Suspense>
      </div>
    </div>
  );
}
