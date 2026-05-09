import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { draftCards } from "./draft-cards";

const TMP = join(process.cwd(), "tmp-draft-test");

beforeEach(() => {
  mkdirSync(join(TMP, "raw"), { recursive: true });
  writeFileSync(
    join(TMP, "raw", "chunks.json"),
    JSON.stringify([
      {
        chunk_id: "valeurs-raw-001",
        source: "livret",
        page: 4,
        theme: "valeurs",
        fr_a: "La République garantit liberté, égalité, fraternité.",
      },
      {
        chunk_id: "valeurs-raw-002",
        source: "livret",
        page: 4,
        theme: "valeurs",
        fr_q: "Avez-vous le droit de tout dire ?",
        fr_a: "Oui, la liberté d'expression est un droit.",
        verbatim_question: true,
      },
      {
        chunk_id: "ddhc-raw-001",
        source: "livret",
        page: 24,
        theme: "ddhc",
        fr_a: "Art. 1er. Les hommes naissent libres et égaux.",
      },
    ]),
  );
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

function fakeClient(): { messages: { create: ReturnType<typeof vi.fn> } } {
  let n = 0;
  return {
    messages: {
      create: vi.fn(async () => {
        n++;
        return {
          content: [
            {
              type: "tool_use",
              name: "emit_card",
              input: {
                fr_q: `Generated FR Q ${n}`,
                ar_q: `[ar] q ${n}`,
                ar_a: `[ar] a ${n}`,
              },
            },
          ],
        };
      }),
    },
  };
}

describe("draftCards", () => {
  it("writes one JSON file per theme into data/cards-draft/", async () => {
    await draftCards({ root: TMP, client: fakeClient() as never, model: "test" });
    expect(existsSync(join(TMP, "data/cards-draft/valeurs.json"))).toBe(true);
    expect(existsSync(join(TMP, "data/cards-draft/ddhc.json"))).toBe(true);
    const valeurs = JSON.parse(readFileSync(join(TMP, "data/cards-draft/valeurs.json"), "utf8"));
    expect(valeurs).toHaveLength(2);
    expect(valeurs[0].id).toMatch(/^valeurs-\d{3}$/);
    expect(valeurs[0].translations.ar.q).toBeTruthy();
    expect(valeurs[0].translations.ar.a).toBeTruthy();
    expect(valeurs[0].audio).toEqual({
      fr_q_sha1: "0000000000000000000000000000000000000000",
      fr_a_sha1: "0000000000000000000000000000000000000000",
    });
  });

  it("preserves verbatim French questions", async () => {
    await draftCards({ root: TMP, client: fakeClient() as never, model: "test" });
    const valeurs = JSON.parse(readFileSync(join(TMP, "data/cards-draft/valeurs.json"), "utf8"));
    const verbatim = valeurs.find((c: { fr_q: string }) => c.fr_q.startsWith("Avez-vous"));
    expect(verbatim).toBeDefined();
  });

  it("validates each emitted card against the Card Zod schema", async () => {
    await draftCards({ root: TMP, client: fakeClient() as never, model: "test" });
    const { CardArray } = await import("../src/lib/card.ts");
    for (const theme of ["valeurs", "ddhc"]) {
      const cards = JSON.parse(readFileSync(join(TMP, `data/cards-draft/${theme}.json`), "utf8"));
      expect(() => CardArray.parse(cards)).not.toThrow();
    }
  });

  it("supports --resume by skipping cards already present in draft files", async () => {
    mkdirSync(join(TMP, "data/cards-draft"), { recursive: true });
    writeFileSync(
      join(TMP, "data/cards-draft/valeurs.json"),
      JSON.stringify([
        {
          id: "valeurs-001",
          theme: "valeurs",
          fr_q: "Already drafted ?",
          fr_a: "La République garantit liberté, égalité, fraternité.",
          source: "Livret p.4",
          translations: { ar: { q: "سؤال موجود مسبقاً", a: "إجابة موجودة مسبقاً" } },
          audio: { fr_q_sha1: "0".repeat(40), fr_a_sha1: "0".repeat(40) },
        },
      ]),
    );
    const fc = fakeClient();
    await draftCards({ root: TMP, client: fc as never, model: "test", resume: true });
    expect(fc.messages.create.mock.calls.length).toBeLessThanOrEqual(2);
  });
});

describe("draftCards CLI flags", () => {
  it("--theme filters chunks", async () => {
    const fc = fakeClient();
    await draftCards({ root: TMP, client: fc as never, model: "test", themeFilter: "ddhc" });
    expect(fc.messages.create.mock.calls.length).toBe(1);
    const ddhc = JSON.parse(readFileSync(join(TMP, "data/cards-draft/ddhc.json"), "utf8"));
    expect(ddhc).toHaveLength(1);
    expect(existsSync(join(TMP, "data/cards-draft/valeurs.json"))).toBe(false);
  });
});
