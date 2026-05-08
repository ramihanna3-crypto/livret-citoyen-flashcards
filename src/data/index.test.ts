import { describe, it, expect } from "vitest";
import { allCards, cardsByTheme } from "@/data";

describe("card data", () => {
  it("loads at least 18 cards (3 per 6 themes)", () => {
    expect(allCards.length).toBeGreaterThanOrEqual(18);
  });
  it("every theme has at least 3 cards", () => {
    for (const theme of [
      "valeurs",
      "droits-devoirs",
      "institutions",
      "histoire",
      "geographie",
      "ddhc",
    ] as const) {
      expect(cardsByTheme(theme).length).toBeGreaterThanOrEqual(3);
    }
  });
  it("all card ids are unique", () => {
    const ids = allCards.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
