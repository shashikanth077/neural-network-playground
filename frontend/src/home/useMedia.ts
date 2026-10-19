import { useEffect, useState } from "react";

const supported = () => typeof window !== "undefined" && typeof window.matchMedia === "function";

/** Live `matchMedia` flag. `fallback` is used where matchMedia does not exist (tests, very old browsers). */
export function useMediaQuery(query: string, fallback: boolean): boolean {
  const [matches, setMatches] = useState(() => (supported() ? window.matchMedia(query).matches : fallback));
  useEffect(() => {
    if (!supported()) return;
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, [query]);
  return matches;
}

export const usePrefersReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)", false);
