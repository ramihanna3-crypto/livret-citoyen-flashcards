import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeckProgressRing } from "@/components/deck/DeckProgressRing";

describe("DeckProgressRing", () => {
  it("shows 'X / Y' label", () => {
    render(<DeckProgressRing value={3} max={18} />);
    expect(screen.getByText("3 / 18")).toBeInTheDocument();
  });
  it("clamps value to [0, max]", () => {
    render(<DeckProgressRing value={99} max={18} />);
    expect(screen.getByText("18 / 18")).toBeInTheDocument();
  });
});
