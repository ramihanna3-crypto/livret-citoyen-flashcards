import { describe, it, expect } from "vitest";
import { audioUrl } from "@/lib/audio";

describe("audioUrl", () => {
  it("returns a relative path under /audio", () => {
    expect(audioUrl("a".repeat(40))).toBe(`${import.meta.env.BASE_URL}audio/${"a".repeat(40)}.mp3`);
  });
});
