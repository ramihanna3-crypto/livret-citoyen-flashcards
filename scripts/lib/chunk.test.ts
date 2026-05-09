import { describe, it, expect } from "vitest";
import { splitPages, splitParagraphs, themeForPage } from "./chunk";

describe("splitPages", () => {
  it("groups text by '===== PAGE N =====' markers", () => {
    const raw = "\n===== PAGE 1 =====\nfoo\nbar\n\n===== PAGE 2 =====\nbaz";
    const pages = splitPages(raw);
    expect(pages).toHaveLength(2);
    expect(pages[0]).toEqual({ page: 1, text: "foo\nbar" });
    expect(pages[1]).toEqual({ page: 2, text: "baz" });
  });
});

describe("splitParagraphs", () => {
  it("splits on blank lines, trims, and collapses internal whitespace", () => {
    // Wrapped lines within a paragraph become a single space-joined string
    // (PDF extraction keeps visual line breaks; we want logical paragraphs).
    expect(splitParagraphs("foo\nbar\n\nbaz\n\n   \n\nqux")).toEqual(["foo bar", "baz", "qux"]);
  });
  it("drops paragraphs shorter than minLen", () => {
    expect(splitParagraphs("ok\n\nA\n\nlong enough text", 5)).toEqual(["long enough text"]);
  });
});

describe("themeForPage", () => {
  it("maps livret pages to themes per spec §7.1", () => {
    expect(themeForPage("livret", 4)).toBe("valeurs");
    expect(themeForPage("livret", 7)).toBe("valeurs"); // 7 boundary: still valeurs (laïcité)
    expect(themeForPage("livret", 8)).toBe("droits-devoirs");
    expect(themeForPage("livret", 11)).toBe("institutions");
    expect(themeForPage("livret", 16)).toBe("histoire");
    expect(themeForPage("livret", 22)).toBe("geographie");
    expect(themeForPage("livret", 24)).toBe("ddhc");
    expect(themeForPage("livret", 25)).toBe("ddhc");
  });
  it("returns null for cover/blank pages", () => {
    expect(themeForPage("livret", 1)).toBeNull();
    expect(themeForPage("livret", 27)).toBeNull();
  });
  it("maps charte page 1 to droits-devoirs", () => {
    expect(themeForPage("charte", 1)).toBe("droits-devoirs");
    expect(themeForPage("charte", 2)).toBe("droits-devoirs");
  });
});
