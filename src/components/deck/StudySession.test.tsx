import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { StudySession } from "@/components/deck/StudySession";
import { cardsByTheme } from "@/data";

class FakeAudio {
  paused = true;
  play = vi.fn(async () => {});
  pause = vi.fn();
  addEventListener() {}
  removeEventListener() {}
}
beforeEach(() => {
  // @ts-expect-error -- override global Audio for tests
  globalThis.Audio = FakeAudio;
  localStorage.clear();
});

const wrap = (ui: React.ReactNode) => <MemoryRouter>{ui}</MemoryRouter>;

describe("StudySession", () => {
  it("flip → Je sais auto-advances to next card", async () => {
    const user = userEvent.setup();
    render(
      wrap(<StudySession cards={cardsByTheme("valeurs")} backHref="/" themeLabel="Valeurs" />),
    );
    expect(screen.getAllByText(/1 \/ 3/).length).toBeGreaterThan(0);
    await user.click(screen.getByTestId("flashcard"));
    await user.click(screen.getByRole("button", { name: /je sais/i }));
    expect(screen.getAllByText(/2 \/ 3/).length).toBeGreaterThan(0);
  });

  it("flip → À revoir stays on the same card", async () => {
    const user = userEvent.setup();
    render(
      wrap(<StudySession cards={cardsByTheme("valeurs")} backHref="/" themeLabel="Valeurs" />),
    );
    await user.click(screen.getByTestId("flashcard"));
    await user.click(screen.getByRole("button", { name: /à revoir/i }));
    expect(screen.getAllByText(/1 \/ 3/).length).toBeGreaterThan(0);
  });
});
