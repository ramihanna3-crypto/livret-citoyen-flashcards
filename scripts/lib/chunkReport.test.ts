import { describe, it, expect } from "vitest";
import { reportChunks } from "./chunkReport";

describe("reportChunks", () => {
  it("returns per-theme + total + verbatim count", () => {
    const r = reportChunks([
      {
        chunk_id: "valeurs-raw-001",
        source: "livret",
        page: 4,
        theme: "valeurs",
        fr_a: "x",
        verbatim_question: true,
        fr_q: "?",
      },
      { chunk_id: "valeurs-raw-002", source: "livret", page: 4, theme: "valeurs", fr_a: "y" },
      { chunk_id: "histoire-raw-001", source: "livret", page: 12, theme: "histoire", fr_a: "z" },
    ]);
    expect(r.total).toBe(3);
    expect(r.verbatim).toBe(1);
    expect(r.byTheme.valeurs).toBe(2);
    expect(r.byTheme.histoire).toBe(1);
  });
});
