import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { CardArray, type Card, type ThemeId } from "../src/lib/card.ts";
import type { Chunk } from "./extract-source.ts";
import { translateChunk } from "./lib/translator.ts";
import { env } from "./lib/env.ts";

type AnyClient = Pick<Anthropic, "messages">;

const PLACEHOLDER_SHA1 = "0".repeat(40);

export type DraftOptions = {
  root?: string;
  client?: AnyClient;
  model?: string;
  resume?: boolean;
  themeFilter?: ThemeId;
};

export async function draftCards(opts: DraftOptions = {}) {
  const root = opts.root ?? process.cwd();
  const model = opts.model ?? env.anthropicModel();
  const client: AnyClient = opts.client ?? new Anthropic({ apiKey: env.anthropicKey() });

  const chunksPath = join(root, "raw/chunks.json");
  const chunks: Chunk[] = JSON.parse(readFileSync(chunksPath, "utf8"));

  const draftDir = join(root, "data/cards-draft");
  mkdirSync(draftDir, { recursive: true });

  const existing: Record<string, Card[]> = {};
  for (const c of chunks) {
    if (existing[c.theme]) continue;
    const path = join(draftDir, `${c.theme}.json`);
    if (existsSync(path)) {
      try {
        existing[c.theme] = JSON.parse(readFileSync(path, "utf8"));
      } catch {
        existing[c.theme] = [];
      }
    } else {
      existing[c.theme] = [];
    }
  }

  const drafted = new Set<string>();
  if (opts.resume) {
    for (const arr of Object.values(existing)) {
      for (const card of arr) drafted.add(card.fr_a);
    }
  }

  const counters: Record<string, number> = {};
  for (const theme of Object.keys(existing)) {
    counters[theme] = existing[theme].length;
  }

  let processed = 0;
  let skipped = 0;
  const total = chunks.filter((c) => !opts.themeFilter || c.theme === opts.themeFilter).length;

  for (const chunk of chunks) {
    if (opts.themeFilter && chunk.theme !== opts.themeFilter) continue;
    if (drafted.has(chunk.fr_a)) {
      skipped++;
      continue;
    }
    counters[chunk.theme] = (counters[chunk.theme] ?? 0) + 1;
    const id = `${chunk.theme}-${String(counters[chunk.theme]).padStart(3, "0")}`;

    process.stdout.write(`  drafting ${id} (${++processed}/${total - skipped}) ... `);

    const out = await translateChunk(client, model, chunk);
    const card: Card = {
      id,
      theme: chunk.theme,
      fr_q: out.fr_q,
      fr_a: chunk.fr_a,
      source: chunk.source === "livret" ? `Livret p.${chunk.page}` : `Charte`,
      translations: { ar: { q: out.ar_q, a: out.ar_a } },
      audio: { fr_q_sha1: PLACEHOLDER_SHA1, fr_a_sha1: PLACEHOLDER_SHA1 },
    };

    CardArray.parse([card]);

    existing[chunk.theme].push(card);
    writeFileSync(
      join(draftDir, `${chunk.theme}.json`),
      JSON.stringify(existing[chunk.theme], null, 2),
    );
    process.stdout.write("✓\n");
  }

  return { processed, skipped, byTheme: counters };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const args = process.argv.slice(2);
  const resume = args.includes("--resume");
  const themeIdx = args.indexOf("--theme");
  const themeFilter = themeIdx >= 0 ? (args[themeIdx + 1] as ThemeId | undefined) : undefined;

  draftCards({ resume, themeFilter })
    .then((r) => {
      console.log(`\nDrafted ${r.processed} new cards (skipped ${r.skipped} existing).`);
      console.log("By theme:");
      for (const [t, n] of Object.entries(r.byTheme).sort()) {
        console.log(`  ${t.padEnd(18)} ${n}`);
      }
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
