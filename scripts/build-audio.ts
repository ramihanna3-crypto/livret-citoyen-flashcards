import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { CardArray, type Card } from "../src/lib/card.ts";
import { sha1, tts as defaultTts, type TtsOptions } from "./lib/tts.ts";
import { env } from "./lib/env.ts";

export type BuildAudioOptions = {
  root?: string;
  apiKey?: string;
  voiceId?: string;
  modelId?: string;
  tts?: (text: string) => Promise<ArrayBuffer>;
  dryRun?: boolean;
  force?: boolean;
  theme?: string;
};

export type BuildAudioResult = {
  generated: number;
  reused: number;
  totalClips: number;
  dryRunChars: number;
};

export async function buildAudio(opts: BuildAudioOptions = {}): Promise<BuildAudioResult> {
  const root = opts.root ?? process.cwd();
  const cardsDir = join(root, "src/data/cards");
  const audioDir = join(root, "public/audio");
  mkdirSync(audioDir, { recursive: true });

  const apiKey = opts.apiKey ?? (opts.dryRun ? "" : env.elevenLabsKey());
  const voiceId = opts.voiceId ?? (opts.dryRun ? "" : env.elevenLabsVoiceId());
  const modelId = opts.modelId ?? (opts.dryRun ? "" : env.elevenLabsModelId());

  const tts =
    opts.tts ?? ((text: string) => defaultTts({ apiKey, voiceId, modelId, text } as TtsOptions));

  let generated = 0;
  let reused = 0;
  let dryRunChars = 0;
  let totalClips = 0;

  for (const file of readdirSync(cardsDir)) {
    if (!file.endsWith(".json")) continue;
    if (opts.theme && file !== `${opts.theme}.json`) continue;

    const path = join(cardsDir, file);
    const cards: Card[] = CardArray.parse(JSON.parse(readFileSync(path, "utf8")));
    let mutated = false;

    for (const card of cards) {
      for (const kind of ["fr_q", "fr_a"] as const) {
        const text = card[kind];
        const hash = sha1(text);
        const out = join(audioDir, `${hash}.mp3`);
        const fieldKey = `${kind}_sha1` as const;
        totalClips++;

        if (opts.dryRun) {
          dryRunChars += text.length;
          continue;
        }

        if (!opts.force && existsSync(out)) {
          reused++;
        } else {
          process.stdout.write(`  ${card.id} ${kind} (${text.length} chars) → ${hash}.mp3 ... `);
          const buf = await tts(text);
          writeFileSync(out, Buffer.from(buf));
          generated++;
          process.stdout.write("✓\n");
        }

        if (card.audio[fieldKey] !== hash) {
          card.audio[fieldKey] = hash;
          mutated = true;
        }
      }
    }

    if (mutated && !opts.dryRun) {
      writeFileSync(path, JSON.stringify(cards, null, 2));
    }
  }

  return { generated, reused, totalClips, dryRunChars };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");
  const themeIdx = args.indexOf("--theme");
  const theme = themeIdx >= 0 ? args[themeIdx + 1] : undefined;

  buildAudio({ dryRun, force, theme })
    .then((r) => {
      if (dryRun) {
        console.log(`Dry-run: ${r.totalClips} clips, ${r.dryRunChars} characters total.`);
        console.log(`Estimate cost from your ElevenLabs plan's per-character rate.`);
      } else {
        console.log(`Generated ${r.generated}, reused ${r.reused}. Total clips: ${r.totalClips}.`);
      }
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
