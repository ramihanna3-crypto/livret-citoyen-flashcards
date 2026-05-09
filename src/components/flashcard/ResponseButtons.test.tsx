import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResponseButtons } from "@/components/flashcard/ResponseButtons";

describe("ResponseButtons", () => {
  it("calls onKnown / onReview", async () => {
    const onKnown = vi.fn();
    const onReview = vi.fn();
    const user = userEvent.setup();
    render(<ResponseButtons onKnown={onKnown} onReview={onReview} />);
    await user.click(screen.getByRole("button", { name: /je sais/i }));
    expect(onKnown).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: /à revoir/i }));
    expect(onReview).toHaveBeenCalledOnce();
  });
});
