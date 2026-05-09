import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CardFront } from "@/components/flashcard/CardFront";

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
  fr_q: "Question en français ?",
  ar_q: "سؤال بالعربية؟",
  fr_a: "Réponse",
  ar_a: "إجابة",
  source: "Livret p.4",
  audio: { fr_q_sha1: "a".repeat(40), fr_a_sha1: "b".repeat(40) },
};

describe("CardFront", () => {
  it("renders French question with dir=ltr and Arabic with dir=rtl lang=ar", () => {
    render(<CardFront card={card} position={3} total={18} />);
    const fr = screen.getByText(/question en français/i);
    expect(fr).toBeInTheDocument();
    const ar = screen.getByText("سؤال بالعربية؟");
    expect(ar).toHaveAttribute("dir", "rtl");
    expect(ar).toHaveAttribute("lang", "ar");
  });
  it("shows position indicator like '3 / 18'", () => {
    render(<CardFront card={card} position={3} total={18} />);
    expect(screen.getByText(/3 \/ 18/)).toBeInTheDocument();
  });
});
