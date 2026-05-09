import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { buildAudio } from "./build-audio";
import { sha1 } from "./lib/tts";

const TMP = join(process.cwd(), "tmp-build-audio-test");

const ZERO = "0".repeat(40);

const sampleCard = (id: string, fr_q: string, fr_a: string) => ({
  id,
  theme: "valeurs",
  fr_q,
  ar_q: "سؤال؟",
  fr_a,
  ar_a: "إجابة.",
  source: "Livret p.4",
  audio: { fr_q_sha1: ZERO, fr_a_sha1: ZERO },
});

beforeEach(() => {
  mkdirSync(join(TMP, "src/data/cards"), { recursive: true });
  mkdirSync(join(TMP, "public/audio"), { recursive: true });
  writeFileSync(
    join(TMP, "src/data/cards/valeurs.json"),
    JSON.stringify([
      sampleCard("valeurs-001", "Question 1 ?", "Réponse 1."),
      sampleCard("valeurs-002", "Question 2 ?", "Réponse 2."),
    ]),
  );
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe("buildAudio", () => {
  it("generates one MP3 per unique French text and rewrites card sha1s", async () => {
    const fakeTts = vi.fn(async (text: string) => new TextEncoder().encode(`audio:${text}`).buffer);
    const r = await buildAudio({
      root: TMP,
      apiKey: "k",
      voiceId: "v",
      modelId: "m",
      tts: fakeTts,
    });
    expect(fakeTts).toHaveBeenCalledTimes(4);
    expect(r.generated).toBe(4);
    expect(r.reused).toBe(0);

    const cards = JSON.parse(readFileSync(join(TMP, "src/data/cards/valeurs.json"), "utf8"));
    expect(cards[0].audio.fr_q_sha1).toBe(sha1("Question 1 ?"));
    expect(cards[0].audio.fr_a_sha1).toBe(sha1("Réponse 1."));
    expect(existsSync(join(TMP, `public/audio/${sha1("Question 1 ?")}.mp3`))).toBe(true);
  });

  it("skips clips whose MP3 already exists", async () => {
    writeFileSync(join(TMP, `public/audio/${sha1("Question 1 ?")}.mp3`), "existing");
    const fakeTts = vi.fn(async (text: string) => new TextEncoder().encode(`audio:${text}`).buffer);
    const r = await buildAudio({
      root: TMP,
      apiKey: "k",
      voiceId: "v",
      modelId: "m",
      tts: fakeTts,
    });
    expect(r.generated).toBe(3);
    expect(r.reused).toBe(1);
  });

  it("--dry-run does not call TTS or write files", async () => {
    const fakeTts = vi.fn();
    const r = await buildAudio({
      root: TMP,
      apiKey: "k",
      voiceId: "v",
      modelId: "m",
      tts: fakeTts as never,
      dryRun: true,
    });
    expect(fakeTts).not.toHaveBeenCalled();
    expect(r.generated).toBe(0);
    expect(r.dryRunChars).toBeGreaterThan(0);
    expect(readdirSync(join(TMP, "public/audio"))).toHaveLength(0);
  });

  it("--force regenerates even if MP3 exists", async () => {
    writeFileSync(join(TMP, `public/audio/${sha1("Question 1 ?")}.mp3`), "old");
    const fakeTts = vi.fn(async (text: string) => new TextEncoder().encode(`audio:${text}`).buffer);
    const r = await buildAudio({
      root: TMP,
      apiKey: "k",
      voiceId: "v",
      modelId: "m",
      tts: fakeTts,
      force: true,
    });
    expect(r.generated).toBe(4);
    expect(r.reused).toBe(0);
  });

  it("--theme limits to one theme JSON", async () => {
    writeFileSync(
      join(TMP, "src/data/cards/histoire.json"),
      JSON.stringify([sampleCard("histoire-001", "QQ ?", "AA.")]),
    );
    const fakeTts = vi.fn(async (text: string) => new TextEncoder().encode(`audio:${text}`).buffer);
    await buildAudio({
      root: TMP,
      apiKey: "k",
      voiceId: "v",
      modelId: "m",
      tts: fakeTts,
      theme: "valeurs",
    });
    expect(fakeTts).toHaveBeenCalledTimes(4);
  });
});
