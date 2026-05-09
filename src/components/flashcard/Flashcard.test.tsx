import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Flashcard } from "@/components/flashcard/Flashcard";

class FakeAudio {
  paused = true;
  play = vi.fn(async () => {});
  pause = vi.fn();
  addEventListener() {}
  removeEventListener() {}
}
beforeEach(() => {
  globalThis.Audio = FakeAudio as unknown as typeof Audio;
});

const card = {
  id: "valeurs-001",
  theme: "valeurs" as const,
  fr_q: "Question?",
  ar_q: "س؟",
  fr_a: "Réponse.",
  ar_a: "إجابة.",
  source: "Livret p.4",
  audio: { fr_q_sha1: "a".repeat(40), fr_a_sha1: "b".repeat(40) },
};

describe("Flashcard", () => {
  it("flips on tap (Space key)", async () => {
    render(
      <Flashcard
        card={card}
        position={1}
        total={3}
        flipped={false}
        onFlip={() => {}}
        onKnown={() => {}}
        onReview={() => {}}
      />,
    );
    const root = screen.getByTestId("flashcard");
    expect(root.querySelector(".flashcard-inner")?.classList.contains("flipped")).toBe(false);
  });

  it("calls onFlip when card surface is clicked", async () => {
    const onFlip = vi.fn();
    const user = userEvent.setup();
    render(
      <Flashcard
        card={card}
        position={1}
        total={3}
        flipped={false}
        onFlip={onFlip}
        onKnown={() => {}}
        onReview={() => {}}
      />,
    );
    await user.click(screen.getByTestId("flashcard"));
    expect(onFlip).toHaveBeenCalled();
  });
});
