import { Fragment, useCallback, type ReactNode } from "react";
import { translate, useI18n, type TFn } from "../../i18n";

/**
 * Like the platform `useT`, but always fills `{placeholders}` (the default context outside a provider,
 * used by some tests, does not), so a lab page renders the same with or without an I18nProvider.
 */
export function useT(): TFn {
  const { lang } = useI18n();
  return useCallback<TFn>((key, fallback, vars) => translate(lang, key, fallback, vars), [lang]);
}

/**
 * Tiny inline markup for translated strings, so a sentence with bold words or code stays ONE translatable
 * string (translators can reorder the words): `**bold**`, `__italic__`, `` `code` ``.
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

/** `const r = useRich()`, then `r(key, { n: 3 })`: the translated string rendered with its inline markup. */
export function useRich() {
  const t = useT();
  return (key: string, vars?: Record<string, string | number>) => renderRich(t(key, undefined, vars));
}
