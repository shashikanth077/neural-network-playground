import { useMemo } from "react";
import { useT } from "../i18n";

type Kind = "act" | "optim" | "loss" | "val" | "init";
interface Opt { value: string; label: string; note?: string }

/**
 * Localised labels and one-line notes for the option lists in `options.ts`. The English text stays in
 * `options.ts` (the cheatsheets read it directly) and is the fallback when a translation is missing.
 */
export function useOptionText() {
  const t = useT();
  return useMemo(
    () => ({
      label: (kind: Kind, o: Opt) => t(`pg.opt.${kind}.${o.value}.label`, o.label),
      note: (kind: Kind, o: Opt) => t(`pg.opt.${kind}.${o.value}.note`, o.note ?? ""),
      labelOf: (kind: Kind, list: Opt[], value: string) => {
        const o = list.find((x) => x.value === value);
        return o ? t(`pg.opt.${kind}.${o.value}.label`, o.label) : value;
      },
    }),
    [t],
  );
}
