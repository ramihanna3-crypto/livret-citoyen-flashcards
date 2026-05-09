import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DeckPicker } from "@/components/deck/DeckPicker";

describe("DeckPicker", () => {
  it("renders 6 deck tiles + Tout mélanger button", () => {
    render(
      <MemoryRouter>
        <DeckPicker />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole("button")).toHaveLength(7);
    expect(screen.getByRole("button", { name: /tout mélanger/i })).toBeInTheDocument();
  });
});
