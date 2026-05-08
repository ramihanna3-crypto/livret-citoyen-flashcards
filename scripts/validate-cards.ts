import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { CardArray } from "../src/lib/card.ts";

const root = resolve(import.meta.dirname, "..");
const cardsDir = join(root, "src/data/cards");
const audioDir = join(root, "public/audio");

let totalCards = 0;
const missingAudio: string[] = [];

for (const file of readdirSync(cardsDir)) {
  if (!file.endsWith(".json")) continue;
  const json = JSON.parse(readFileSync(join(cardsDir, file), "utf8"));
  let cards;
  try {
    cards = CardArray.parse(json);
  } catch (err) {
    console.error(`✗ ${file} failed schema validation:`);
    console.error(err);
    process.exit(1);
  }
  totalCards += cards.length;
  for (const c of cards) {
    for (const sha of [c.audio.fr_q_sha1, c.audio.fr_a_sha1]) {
      const f = join(audioDir, `${sha}.mp3`);
      if (!existsSync(f)) missingAudio.push(`${c.id} → ${sha}.mp3`);
    }
  }
  console.log(`✓ ${file}: ${cards.length} cards`);
}

console.log(`\n${totalCards} cards total`);

if (process.env.SKIP_AUDIO_CHECK === "1") {
  console.log("(audio file existence check skipped via SKIP_AUDIO_CHECK=1)");
} else if (missingAudio.length > 0) {
  console.error(`\n✗ ${missingAudio.length} audio files missing:`);
  for (const m of missingAudio) console.error(`  ${m}`);
  console.error(
    "\nGenerate missing audio with `pnpm build:audio` (Plan 2). " +
      "To skip this check during Plan 1 development set SKIP_AUDIO_CHECK=1.",
  );
  process.exit(1);
} else {
  console.log("✓ all audio files present");
}
