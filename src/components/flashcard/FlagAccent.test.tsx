import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { FlagAccent } from "@/components/flashcard/FlagAccent";

describe("FlagAccent", () => {
  it("renders three colored segments", () => {
    const { container } = render(<FlagAccent />);
    const segments = container.querySelectorAll("[data-flag-segment]");
    expect(segments).toHaveLength(3);
    expect(segments[0]).toHaveAttribute("data-flag-segment", "blue");
    expect(segments[1]).toHaveAttribute("data-flag-segment", "white");
    expect(segments[2]).toHaveAttribute("data-flag-segment", "red");
  });
});
