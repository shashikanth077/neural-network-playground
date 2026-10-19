import { createContext, Fragment, useContext, useId, useState } from "react";
import { useT } from "../i18n";
import { Tex } from "./Tex";

/** Page-wide switch for every explanation panel (the Playground provides it; elsewhere panels are shown). */
const HelpContext = createContext<boolean>(true);
export const HelpProvider = HelpContext.Provider;
export const useHelpEnabled = () => useContext(HelpContext);

/** Renders `**bold**` spans from a translated string (the only markup the catalogue uses). */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("**").map((part, i) => (i % 2 === 1 ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

/** The text parts a panel can have, in reading order. Each is optional: a missing key simply hides that part. */
export const HELP_PARTS = ["what", "why", "how", "try", "mistake"] as const;
export type HelpPart = (typeof HELP_PARTS)[number];

interface Props {
  /** Key stem: texts live at `pg.help.<id>.name | what | why | how | try | mistake | ref`. */
  id: string;
  /** Optional KaTeX formula(s) shown under "Formula". Formulas are language independent. */
  formula?: string | string[];
  /** "option" is used for the panel that explains the currently selected choice of a dropdown. */
  kind?: "section" | "option";
  className?: string;
}

/**
 * Collapsible "About this section" panel. The toggle is a real button (aria-expanded, aria-controls) and the
 * content is a labelled region, so screen-reader and keyboard users get the same help as everyone else.
 */
export function SectionHelp({ id, formula, kind = "section", className = "" }: Props) {
  const enabled = useHelpEnabled();
  const t = useT();
  const [open, setOpen] = useState(false);
  const uid = useId();
  if (!enabled) return null;

  const get = (part: string) => t(`pg.help.${id}.${part}`, "");
  const name = get("name");
  const ref = get("ref");
  const formulas = formula === undefined ? [] : Array.isArray(formula) ? formula : [formula];
  const buttonId = `${uid}-btn`;
  const panelId = `${uid}-panel`;

  return (
    <div className={`section-help rounded-xl border border-brand/25 bg-brand/5 text-sm ${className}`} data-help={id}>
      <button
        type="button"
        id={buttonId}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-left text-xs font-semibold text-brand hover:bg-brand/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
      >
        <span aria-hidden className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-brand/60 text-[10px] leading-none">i</span>
        <span className="min-w-0 flex-1">
          {t(kind === "option" ? "pg.help.aboutChoice" : "pg.help.about")}
          {name && <span className="sr-only">: {name}</span>}
        </span>
        <span aria-hidden className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && (
        <div id={panelId} role="region" aria-labelledby={buttonId} className="space-y-2.5 border-t border-brand/20 px-3 py-2.5">
          {name && <p className="text-sm font-semibold text-ink">{name}</p>}
          <dl className="space-y-2">
            {HELP_PARTS.map((part) => {
              const text = get(part);
              if (!text) return null;
              return (
                <div key={part} data-part={part}>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t(`pg.help.part.${part}`)}</dt>
                  <dd className="mt-0.5 text-[13px] leading-relaxed text-ink"><Rich text={text} /></dd>
                </div>
              );
            })}
            {formulas.length > 0 && (
              <div data-part="formula">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("pg.help.part.formula")}</dt>
                <dd className="mt-1 space-y-1 overflow-x-auto rounded-lg bg-surface/70 px-2 py-1.5 text-[13px]">
                  {formulas.map((f, i) => <div key={i}><Tex>{f}</Tex></div>)}
                </dd>
              </div>
            )}
          </dl>
          {ref && (
            <p data-part="ref">
              <span className="chip !border-brand/30 !bg-surface !text-brand" title={t("pg.help.part.ref")}>
                <span aria-hidden className="mr-1">▤</span>{ref}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
