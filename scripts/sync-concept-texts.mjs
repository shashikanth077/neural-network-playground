// Regenerates frontend/src/i18n/messages/concepts_text.ts from the concept registry.
//
//   node scripts/sync-concept-texts.mjs
//
// English rows always come from frontend/src/concepts/{registry,areas}.ts. Kannada and Lithuanian are hand-written:
// they are taken from the existing concepts_text.ts, and scripts/concept-texts-nlp.json ({ key: [kn, lt] }) overrides
// or adds rows (use it whenever the English of a concept changes). The script lists rows that are missing a
// translation or whose English changed without a new translation, and exits non-zero in that case.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = resolve(root, "frontend/src/i18n/messages/concepts_text.ts");
const { CONCEPTS } = await import(resolve(root, "frontend/src/concepts/registry.ts"));
const { AREAS } = await import(resolve(root, "frontend/src/concepts/areas.ts"));

const src = readFileSync(target, "utf8");
const marker = "export const conceptTexts = build([";
const head = src.slice(0, src.indexOf(marker) + marker.length);
const old = new Map();
for (const line of src.split("\n")) {
  if (!line.startsWith('  ["')) continue;
  const [key, en, kn, lt] = JSON.parse(line.trim().replace(/,$/, ""));
  old.set(key, { en, kn, lt });
}
const extra = JSON.parse(readFileSync(resolve(root, "scripts/concept-texts-nlp.json"), "utf8"));
const PLANNED = ["ಯೋಜಿತ.", "Planuojama."];

const problems = [];
const row = (key, en) => {
  let [kn, lt] = extra[key] ?? [];
  const prev = old.get(key);
  if (!kn && en === "Planned.") [kn, lt] = PLANNED;
  if (!kn && prev) {
    if (prev.en !== en) problems.push(`English changed, translation is stale: ${key}`);
    ({ kn, lt } = prev);
  }
  if (!kn || !lt) { problems.push(`missing translation: ${key}`); kn ??= en; lt ??= en; }
  return `  [${[key, en, kn, lt].map((x) => JSON.stringify(x)).join(", ")}],`;
};

const out = [];
for (const a of AREAS) { out.push(row(`area.${a.id}.title`, a.title)); out.push(row(`area.${a.id}.blurb`, a.blurb)); }
for (const c of CONCEPTS) {
  out.push("");
  out.push(row(`concept.${c.id}.title`, c.title));
  out.push(row(`concept.${c.id}.summary`, c.summary));
  out.push(row(`concept.${c.id}.why`, c.why));
  out.push(row(`concept.${c.id}.try`, c.tryIt));
  if (c.plan) out.push(row(`concept.${c.id}.plan`, c.plan));
}
writeFileSync(target, `${head}\n${out.join("\n")}\n]);\n`);
console.log(`wrote ${target}: ${AREAS.length} areas, ${CONCEPTS.length} concepts`);
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
