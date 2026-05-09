import { describe, it, expect } from "vitest";
import { shuffled } from "@/lib/shuffle";

describe("shuffled", () => {
  it("preserves length and elements", () => {
    const a = [1, 2, 3, 4, 5];
    const b = shuffled(a);
    expect(b).toHaveLength(a.length);
    expect([...b].sort()).toEqual([...a].sort());
  });
  it("does not mutate the input", () => {
    const a = [1, 2, 3];
    const orig = [...a];
    shuffled(a);
    expect(a).toEqual(orig);
  });
});
