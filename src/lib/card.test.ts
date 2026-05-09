import { describe, it, expect } from "vitest";
import { Card } from "@/lib/card";

const valid = {
  id: "valeurs-001",
  theme: "valeurs",
  fr_q: "Avez-vous le droit de tout dire publiquement ?",
  fr_a: "Oui, la liberté d'expression est un droit fondamental.",
  source: "Livret p.4",
  translations: {
    ar: {
      q: "هل يحق لك قول كل شيء علناً؟",
      a: "نعم، حرية التعبير حق أساسي.",
    },
  },
  audio: {
    fr_q_sha1: "a".repeat(40),
    fr_a_sha1: "b".repeat(40),
  },
};

describe("Card schema", () => {
  it("accepts a valid card", () => {
    expect(() => Card.parse(valid)).not.toThrow();
  });
  it("rejects bad id format", () => {
    expect(() => Card.parse({ ...valid, id: "BAD_ID" })).toThrow();
  });
  it("rejects unknown theme", () => {
    expect(() => Card.parse({ ...valid, theme: "nope" })).toThrow();
  });
  it("rejects too-short fr_q", () => {
    expect(() => Card.parse({ ...valid, fr_q: "ab" })).toThrow();
  });
  it("rejects malformed sha1", () => {
    expect(() => Card.parse({ ...valid, audio: { fr_q_sha1: "x", fr_a_sha1: "y" } })).toThrow();
  });
  it("requires Arabic translation", () => {
    expect(() => Card.parse({ ...valid, translations: {} })).toThrow();
  });
  it("accepts optional additional language translations", () => {
    expect(() =>
      Card.parse({
        ...valid,
        translations: {
          ar: { q: "هل يحق لك ذلك؟", a: "نعم، يحق لك ذلك." },
          uk: { q: "Чи маєте ви право?", a: "Так, ви маєте право." },
        },
      }),
    ).not.toThrow();
  });
});
