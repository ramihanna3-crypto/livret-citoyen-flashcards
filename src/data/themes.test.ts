import { describe, it, expect } from "vitest";
import { themes } from "@/data/themes";
import { ThemeId } from "@/lib/card";
import { themeI18n } from "@/lib/ui-strings";

describe("themes registry", () => {
  it("has exactly 6 themes matching ThemeId enum", () => {
    expect(themes).toHaveLength(6);
    const ids = new Set(themes.map((t) => t.id));
    for (const e of ThemeId.options) expect(ids.has(e)).toBe(true);
  });
  it("every theme has a French label and description", () => {
    for (const t of themes) {
      expect(t.label_fr.length).toBeGreaterThan(2);
      expect(t.description_fr.length).toBeGreaterThan(2);
    }
  });
  it("every theme has localized labels for all supported languages", () => {
    const langs = ["ar", "uk", "fa", "ps", "ht", "tr"] as const;
    for (const t of themes) {
      for (const lang of langs) {
        const tr = themeI18n(lang, t.id);
        expect(tr.label.length).toBeGreaterThan(2);
        expect(tr.description.length).toBeGreaterThan(2);
      }
    }
  });
});
