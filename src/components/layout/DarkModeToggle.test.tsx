import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DarkModeToggle } from "@/components/layout/DarkModeToggle";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

describe("DarkModeToggle", () => {
  it("cycles system → light → dark → system", async () => {
    const user = userEvent.setup();
    render(<DarkModeToggle />);
    const btn = screen.getByRole("button", { name: /thème/i });
    expect(btn).toHaveAttribute("data-mode", "system");
    await user.click(btn);
    expect(btn).toHaveAttribute("data-mode", "light");
    await user.click(btn);
    expect(btn).toHaveAttribute("data-mode", "dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    await user.click(btn);
    expect(btn).toHaveAttribute("data-mode", "system");
  });
});
