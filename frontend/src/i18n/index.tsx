import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { common } from "./messages/common";
import { playground } from "./messages/playground";
import { lab1 } from "./messages/lab1";
import { lab2 } from "./messages/lab2";
import { cheatsheet } from "./messages/cheatsheet";
import { explorers } from "./messages/explorers";
import { concepts } from "./messages/concepts";
<<<<<<< HEAD
import { home } from "./messages/home";
import { labsetup } from "./messages/labsetup";
=======
import { runs } from "./messages/runs";
>>>>>>> worktree-agent-a5158db33f135e62a

export type Lang = "en" | "kn" | "lt";
export const LANGS: { id: Lang; label: string; native: string }[] = [
  { id: "en", label: "English", native: "English" },
  { id: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { id: "lt", label: "Lithuanian", native: "Lietuvių" },
];

/** A message namespace: the same keys in every language. English is the source of truth. */
export type Messages = Record<Lang, Record<string, string>>;

/** Add a namespace here; keys must be unique across namespaces (prefix them: `pg.`, `lab1.`, `cs.`). */
export const NAMESPACES: Record<string, Messages> = { common, playground, lab1, lab2, cheatsheet, explorers, concepts, home, labsetup, runs };

const merged: Record<Lang, Record<string, string>> = { en: {}, kn: {}, lt: {} };
for (const ns of Object.values(NAMESPACES)) for (const l of Object.keys(merged) as Lang[]) Object.assign(merged[l], ns[l]);

const STORAGE_KEY = "ailab.lang";

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "kn" || saved === "lt") return saved;
  } catch { /* storage may be unavailable */ }
  const nav = typeof navigator !== "undefined" ? navigator.language.slice(0, 2).toLowerCase() : "en";
  return nav === "kn" || nav === "lt" ? nav : "en";
}

export type TFn = (key: string, fallback?: string, vars?: Record<string, string | number>) => string;

interface Ctx { lang: Lang; setLang: (l: Lang) => void; t: TFn }
const I18nContext = createContext<Ctx>({
  lang: "en",
  setLang: () => undefined,
  t: (key, fallback) => merged.en[key] ?? fallback ?? key,
});

/** Look a key up in the language, then in English, then use the fallback (usually the English text in the data). */
export function translate(lang: Lang, key: string, fallback?: string, vars?: Record<string, string | number>): string {
  let s = merged[lang][key] ?? merged.en[key] ?? fallback ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

export function I18nProvider({ children, initial }: { children: ReactNode; initial?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initial ?? initialLang);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const t = useCallback<TFn>((key, fallback, vars) => translate(lang, key, fallback, vars), [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
export const useT = () => useContext(I18nContext).t;
export const useLang = () => { const { lang, setLang } = useContext(I18nContext); return { lang, setLang }; };

/** Pick a value from an inline `{ en, kn, lt }` object (en is required, others fall back to it). */
export type Loc<T = string> = { en: T; kn?: T; lt?: T };
export function useLoc() {
  const { lang } = useContext(I18nContext);
  return useCallback(<T,>(v: Loc<T>): T => v[lang] ?? v.en, [lang]);
}

/** Compact language picker for the top bar. */
export function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const t = useT();
  return (
    <label className="ml-1 flex items-center sm:ml-2">
      <span className="sr-only">{t("lang.label", "Language")}</span>
      <span aria-hidden className="mr-1 hidden text-sm sm:inline">🌐</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        aria-label={t("lang.label", "Language")}
        className="max-w-[5.5rem] rounded-lg border border-line bg-surface px-1.5 py-1 text-xs font-medium sm:max-w-none sm:text-sm"
      >
        {LANGS.map((l) => <option key={l.id} value={l.id}>{l.native}</option>)}
      </select>
    </label>
  );
}

/** Localised names for registry entries (the registries keep English text as the fallback). */
export function useMeta() {
  const t = useT();
  return useMemo(() => ({
    domainName: (d: { id: string; name: string }) => t(`domain.${d.id}.name`, d.name),
    domainBlurb: (d: { id: string; blurb: string }) => t(`domain.${d.id}.blurb`, d.blurb),
    labTitle: (l: { id: string; title: string }) => t(`lab.${l.id}.title`, l.title),
    labSubtitle: (l: { id: string; subtitle: string }) => t(`lab.${l.id}.subtitle`, l.subtitle),
    stepTitle: (labId: string, s: { id: string; title: string }) => t(`step.${labId}.${s.id}.title`, s.title),
    stepSummary: (labId: string, s: { id: string; summary: string }) => t(`step.${labId}.${s.id}.summary`, s.summary),
    toolTitle: (x: { id: string; title: string }) => t(`tool.${x.id}.title`, x.title),
    toolTagline: (x: { id: string; tagline: string }) => t(`tool.${x.id}.tagline`, x.tagline),
    sheetTitle: (x: { id: string; title: string }) => t(`sheet.${x.id}.title`, x.title),
    sheetSubtitle: (x: { id: string; subtitle: string }) => t(`sheet.${x.id}.subtitle`, x.subtitle),
  }), [t]);
}
