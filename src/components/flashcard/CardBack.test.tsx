import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardBack } from "@/components/flashcard/CardBack";

class FakeAudio {
  paused = true;
  play = vi.fn(async () => {});
  pause = vi.fn();
  addEventListener() {}
  removeEventListener() {}
}
beforeEach(() => {
  // @ts-expect-error -- override global Audio for test
  globalThis.Audio = FakeAudio;
});

const card = {
  id: "valeurs-001",
  theme: "valeurs" as const,
  fr_q: "Q?",
  ar_q: "س؟",
  fr_a: "Réponse en français.",
  ar_a: "إجابة بالعربية.",
  source: "Livret p.4",
  audio: { fr_q_sha1: "a".repeat(40), fr_a_sha1: "b".repeat(40) },
};

describe("CardBack", () => {
  it("renders French answer with serif font class and Arabic with rtl", () => {
    render(<CardBack card={card} position={1} total={3} onKnown={() => {}} onReview={() => {}} />);
    expect(screen.getByText(/réponse en français/i)).toBeInTheDocument();
    expect(screen.getByText("إجابة بالعربية.")).toHaveAttribute("dir", "rtl");
  });
  it("forwards onKnown/onReview from ResponseButtons", async () => {
    const onKnown = vi.fn();
    const onReview = vi.fn();
    const user = userEvent.setup();
    render(<CardBack card={card} position={1} total={3} onKnown={onKnown} onReview={onReview} />);
    await user.click(screen.getByRole("button", { name: /je sais/i }));
    expect(onKnown).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /à revoir/i }));
    expect(onReview).toHaveBeenCalled();
  });
});
