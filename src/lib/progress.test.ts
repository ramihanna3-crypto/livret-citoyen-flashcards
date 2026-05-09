import { describe, it, expect, beforeEach } from "vitest";
import {
  getProgress,
  markKnown,
  markReview,
  getPrefs,
  setPref,
  resetProgress,
} from "@/lib/progress";

beforeEach(() => {
  localStorage.clear();
});

describe("progress adapter", () => {
  it("starts empty", () => {
    expect(getProgress()).toEqual({});
  });
  it("markKnown / markReview round-trip", () => {
    markKnown("valeurs-001");
    markReview("valeurs-002");
    const p = getProgress();
    expect(p["valeurs-001"].status).toBe("known");
    expect(p["valeurs-002"].status).toBe("review");
    expect(typeof p["valeurs-001"].lastSeenAt).toBe("number");
  });
  it("prefs default to system + auto-advance true", () => {
    expect(getPrefs()).toEqual({ darkMode: "system", autoAdvance: true });
  });
  it("setPref persists", () => {
    setPref("autoAdvance", false);
    expect(getPrefs().autoAdvance).toBe(false);
  });
  it("resetProgress clears card statuses but keeps prefs", () => {
    markKnown("valeurs-001");
    setPref("darkMode", "dark");
    resetProgress();
    expect(getProgress()).toEqual({});
    expect(getPrefs().darkMode).toBe("dark");
  });
  it("ignores stored data with unknown version", () => {
    localStorage.setItem("lc.progress.v1", JSON.stringify({ v: 999, cards: { foo: "bar" } }));
    expect(getProgress()).toEqual({});
  });
});
