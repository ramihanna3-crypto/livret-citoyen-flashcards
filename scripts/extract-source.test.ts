import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { extractSource } from "./extract-source";

const TMP = join(process.cwd(), "tmp-extract-test");

beforeEach(() => {
  mkdirSync(join(TMP, "raw"), { recursive: true });
  writeFileSync(
    join(TMP, "raw", "livret.txt"),
    [
      "===== PAGE 4 =====",
      "Avez-vous le droit de tout dire publiquement ?",
      "Oui, la liberté d'expression est un droit fondamental. Elle a des limites.",
      "",
      "La République est une démocratie",
      "Le Président de la République est élu au suffrage universel.",
      "",
      "===== PAGE 24 =====",
      "Art. 1er. Les hommes naissent et demeurent libres et égaux en droits.",
    ].join("\n"),
  );
  writeFileSync(
    join(TMP, "raw", "charte.txt"),
    [
      "===== PAGE 1 =====",
      "RÉPUBLIQUE FRANÇAISE",
      "CHARTE DES DROITS ET DEVOIRS DU CITOYEN FRANÇAIS",
      "",
      "Le peuple français se reconnaît dans la Déclaration des droits de l'homme.",
    ].join("\n"),
  );
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe("extractSource", () => {
  it("emits chunks tagged by theme and source", async () => {
    const { chunks } = await extractSource({ root: TMP });
    expect(chunks.length).toBeGreaterThan(0);
    const themes = new Set(chunks.map((c) => c.theme));
    expect(themes.has("valeurs")).toBe(true);
    expect(themes.has("ddhc")).toBe(true);
    expect(themes.has("droits-devoirs")).toBe(true);
  });

  it("flags official Q&A boxes with verbatim_question", async () => {
    const { chunks } = await extractSource({ root: TMP });
    const qa = chunks.find((c) => c.verbatim_question === true);
    expect(qa).toBeDefined();
    expect(qa!.fr_q).toMatch(/Avez-vous le droit de tout dire/);
    expect(qa!.fr_a).toMatch(/liberté d'expression/);
  });

  it("writes chunks.json to raw/ with stable structure", async () => {
    await extractSource({ root: TMP });
    const path = join(TMP, "raw", "chunks.json");
    expect(existsSync(path)).toBe(true);
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]).toHaveProperty("chunk_id");
    expect(parsed[0]).toHaveProperty("theme");
    expect(parsed[0]).toHaveProperty("source");
    expect(parsed[0]).toHaveProperty("fr_a");
  });
});
