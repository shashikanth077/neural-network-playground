import type { DeepDive } from "./types";

/**
 * Every file in `./items/` exports `deep: DeepDive`. They are found automatically (no list to edit) and each one
 * is loaded only when its concept page opens, so adding deep dives never slows the rest of the app.
 */
const modules = import.meta.glob<{ deep: DeepDive }>("./items/*.tsx");

const byId = new Map<string, () => Promise<{ deep: DeepDive }>>(
  Object.entries(modules).map(([path, load]) => [path.replace(/^.*\/([^/]+)\.tsx$/, "$1"), load]),
);

export const deepIds = (): string[] => [...byId.keys()].sort();
export const hasDeep = (id: string) => byId.has(id);
export async function loadDeep(id: string): Promise<DeepDive | null> {
  const load = byId.get(id);
  return load ? (await load()).deep : null;
}
