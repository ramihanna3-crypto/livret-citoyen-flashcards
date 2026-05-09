/**
 * Merge translations-<lang>.json files (produced by per-language translation
 * subagents) into src/data/cards/*.json card translations maps.
 *
 * Usage: pnpm exec tsx scripts/merge-translations.ts
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { CardArray, type LanguageId } from "../src/lib/card.ts";

const root = process.cwd();
const cardsDir = join(root, "src/data/cards");
const dataDir = join(root, "data");

const NEW_LANGS: LanguageId[] = ["uk", "fa", "ps", "ht", "tr"];

// 1. Load each language's translations file (if present)
const byLang: Partial<Record<LanguageId, Record<string, { q: string; a: string }>>> = {};
for (const lang of NEW_LANGS) {
  const path = join(dataDir, `translations-${lang}.json`);
  if (!existsSync(path)) {
    console.warn(`! ${lang}: ${path} not found — skipping`);
    continue;
  }
  byLang[lang] = JSON.parse(readFileSync(path, "utf8"));
  console.log(`✓ ${lang}: ${Object.keys(byLang[lang]!).length} translations loaded`);
}

// 2. Merge into each card file
let totalCards = 0;
let totalAdded = 0;
for (const file of readdirSync(cardsDir)) {
  if (!file.endsWith(".json")) continue;
  const path = join(cardsDir, file);
  const cards = JSON.parse(readFileSync(path, "utf8"));

  for (const card of cards) {
    totalCards++;
    for (const lang of NEW_LANGS) {
      const tr = byLang[lang]?.[card.id];
      if (tr && tr.q && tr.a) {
        card.translations[lang] = { q: tr.q, a: tr.a };
        totalAdded++;
      }
    }
  }

  // Validate against schema
  CardArray.parse(cards);

  writeFileSync(path, JSON.stringify(cards, null, 2) + "\n");
  console.log(`✓ ${file}: ${cards.length} cards updated`);
}

console.log(`\n${totalCards} cards processed; ${totalAdded} translation entries added.`);
