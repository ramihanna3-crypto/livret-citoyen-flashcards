import { describe, it, expect } from "vitest";
import { themes } from "@/data/themes";
import { ThemeId } from "@/lib/card";

describe("themes registry", () => {
  it("has exactly 6 themes matching ThemeId enum", () => {
    expect(themes).toHaveLength(6);
    const ids = new Set(themes.map((t) => t.id));
    for (const e of ThemeId.options) expect(ids.has(e)).toBe(true);
  });
  it("every theme has French and Arabic labels", () => {
    for (const t of themes) {
      expect(t.label_fr.length).toBeGreaterThan(2);
      expect(t.label_ar.length).toBeGreaterThan(2);
    }
  });
});
