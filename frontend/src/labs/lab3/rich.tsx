import { Fragment, useCallback, type ReactNode } from "react";
import { translate, useI18n } from "../../i18n";

/**
 * Tiny inline markup for translated strings, so a sentence with bold words or code stays ONE translatable string:
 * `**bold**`, `__italic__`, `` `code` ``.
 */
export function renderRich(s: string): ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) return <b key={i} className="text-ink">{p.slice(2, -2)}</b>;
    if (p.startsWith("__") && p.endsWith("__") && p.length > 4) return <i key={i}>{p.slice(2, -2)}</i>;
    if (p.startsWith("`") && p.endsWith("`") && p.length > 2) return <code key={i} className="rounded bg-raised px-1.5 font-mono text-[0.92em]">{p.slice(1, -1)}</code>;
    return <Fragment key={i}>{p}</Fragment>;
  });
}

/** `const r = useR()`, then `r(<key>, { n: 3 })`: the translated string with its inline markup. Fills {placeholders}. */
export function useR() {
  const { lang } = useI18n();
  return useCallback((key: string, vars?: Record<string, string | number>) => renderRich(translate(lang, key, undefined, vars)), [lang]);
}

/** `const tx = useTx()`, then `tx(<key>)`: the plain translated string (for labels and attributes). */
export function useTx() {
  const { lang } = useI18n();
  return useCallback((key: string, vars?: Record<string, string | number>) => translate(lang, key, undefined, vars), [lang]);
}
