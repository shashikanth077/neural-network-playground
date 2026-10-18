import { useCallback, useEffect, useState } from "react";

const KEY = "nnp-theme";
const isDarkNow = () => document.documentElement.classList.contains("dark");

/** Reads (and observes) the `dark` class on <html>; canvases use this to repaint on theme change. */
export function useIsDark(): boolean {
  const [dark, setDark] = useState(isDarkNow);
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(isDarkNow()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

export function useThemeToggle() {
  const dark = useIsDark();
  const toggle = useCallback(() => {
    const next = !isDarkNow();
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(KEY, next ? "dark" : "light");
    } catch {
      /* storage may be unavailable */
    }
  }, []);
  return { dark, toggle };
}
