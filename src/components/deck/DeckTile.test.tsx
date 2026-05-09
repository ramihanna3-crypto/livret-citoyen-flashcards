import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeckTile } from "@/components/deck/DeckTile";
import { themes } from "@/data/themes";

describe("DeckTile", () => {
  it("renders bilingual labels and total", () => {
    render(<DeckTile theme={themes[0]} known={2} total={3} onClick={() => {}} />);
    expect(screen.getByText(/valeurs/i)).toBeInTheDocument();
    expect(screen.getByText("القيم والمبادئ")).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });
  it("calls onClick", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<DeckTile theme={themes[0]} known={0} total={3} onClick={onClick} />);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });
});
