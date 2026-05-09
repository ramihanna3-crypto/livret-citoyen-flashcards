import { describe, it, expect } from "vitest";
import { sessionReducer, initSession } from "@/components/deck/sessionReducer";
import type { Card } from "@/lib/card";

const c = (id: string): Card => ({
  id,
  theme: "valeurs",
  fr_q: "Question?",
  fr_a: "Réponse",
  source: "Livret",
  translations: { ar: { q: "س؟", a: "إجابة" } },
  audio: { fr_q_sha1: "a".repeat(40), fr_a_sha1: "b".repeat(40) },
});

const deck = [c("valeurs-001"), c("valeurs-002"), c("valeurs-003")];

describe("sessionReducer", () => {
  it("FLIP toggles", () => {
    const s = initSession(deck);
    const s2 = sessionReducer(s, { type: "FLIP" });
    expect(s2.flipped).toBe(true);
    const s3 = sessionReducer(s2, { type: "FLIP" });
    expect(s3.flipped).toBe(false);
  });
  it("NEXT advances and resets flipped", () => {
    const s = sessionReducer({ ...initSession(deck), flipped: true }, { type: "NEXT" });
    expect(s.cursor).toBe(1);
    expect(s.flipped).toBe(false);
  });
  it("PREV does not go below 0", () => {
    const s = sessionReducer(initSession(deck), { type: "PREV" });
    expect(s.cursor).toBe(0);
  });
  it("NEXT clamps at end", () => {
    let s = initSession(deck);
    s = sessionReducer(s, { type: "JUMP", to: 2 });
    s = sessionReducer(s, { type: "NEXT" });
    expect(s.cursor).toBe(2);
    expect(s.finished).toBe(true);
  });
  it("SHUFFLE preserves length and resets cursor", () => {
    const s = sessionReducer(initSession(deck), { type: "SHUFFLE" });
    expect(s.deck).toHaveLength(3);
    expect(s.cursor).toBe(0);
    expect(s.shuffled).toBe(true);
  });
  it("RESTART resets cursor and unflips", () => {
    let s = initSession(deck);
    s = sessionReducer(s, { type: "JUMP", to: 2 });
    s = sessionReducer(s, { type: "FLIP" });
    s = sessionReducer(s, { type: "RESTART" });
    expect(s.cursor).toBe(0);
    expect(s.flipped).toBe(false);
    expect(s.finished).toBe(false);
  });
});
