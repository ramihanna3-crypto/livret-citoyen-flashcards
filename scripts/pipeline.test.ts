import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { extractSource } from "./extract-source";
import { draftCards } from "./draft-cards";
import { buildAudio } from "./build-audio";
import { CardArray } from "../src/lib/card";

const TMP = join(process.cwd(), "tmp-pipeline-test");

beforeEach(() => {
  mkdirSync(join(TMP, "raw"), { recursive: true });
  const realLivret = join(process.cwd(), "raw/livret.txt");
  const realCharte = join(process.cwd(), "raw/charte.txt");
  if (existsSync(realLivret)) copyFileSync(realLivret, join(TMP, "raw/livret.txt"));
  else
    writeFileSync(
      join(TMP, "raw/livret.txt"),
      "===== PAGE 4 =====\nLa République garantit liberté, égalité, fraternité.",
    );
  if (existsSync(realCharte)) copyFileSync(realCharte, join(TMP, "raw/charte.txt"));
  else
    writeFileSync(
      join(TMP, "raw/charte.txt"),
      "===== PAGE 1 =====\nTout être humain possède des droits.",
    );
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe("pipeline (extract → draft → build-audio)", () => {
  it("runs end-to-end with mocked APIs and produces valid Cards + MP3s", async () => {
    const ext = await extractSource({ root: TMP });
    expect(ext.count).toBeGreaterThan(0);

    let n = 0;
    const fakeClient = {
      messages: {
        create: vi.fn(async () => {
          n++;
          return {
            content: [
              {
                type: "tool_use",
                name: "emit_card",
                input: {
                  fr_q: `Generated Q ${n} ?`,
                  ar_q: `سؤال ${n}؟`,
                  ar_a: `إجابة رقم ${n}.`,
                },
              },
            ],
          };
        }),
      },
    };
    await draftCards({ root: TMP, client: fakeClient as never, model: "test" });

    mkdirSync(join(TMP, "src/data/cards"), { recursive: true });
    const drafts = ["valeurs", "droits-devoirs", "ddhc"];
    for (const t of drafts) {
      const draftPath = join(TMP, `data/cards-draft/${t}.json`);
      if (existsSync(draftPath)) {
        copyFileSync(draftPath, join(TMP, `src/data/cards/${t}.json`));
      }
    }

    const fakeTts = vi.fn(
      async (text: string) => new TextEncoder().encode(`audio:${text}`).buffer,
    );
    const audio = await buildAudio({
      root: TMP,
      apiKey: "k",
      voiceId: "v",
      modelId: "m",
      tts: fakeTts,
    });
    expect(audio.generated).toBeGreaterThan(0);

    for (const t of drafts) {
      const path = join(TMP, `src/data/cards/${t}.json`);
      if (!existsSync(path)) continue;
      const cards = CardArray.parse(JSON.parse(readFileSync(path, "utf8")));
      for (const card of cards) {
        expect(card.audio.fr_q_sha1).not.toBe("0".repeat(40));
        expect(card.audio.fr_a_sha1).not.toBe("0".repeat(40));
        expect(existsSync(join(TMP, `public/audio/${card.audio.fr_q_sha1}.mp3`))).toBe(true);
      }
    }
  }, 30_000);
});
