import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AudioButton } from "@/components/flashcard/AudioButton";

class FakeAudio {
  src = "";
  paused = true;
  play = vi.fn(async () => {
    this.paused = false;
    this.listeners["play"]?.forEach((l) => l());
  });
  pause = vi.fn(() => {
    this.paused = true;
    this.listeners["pause"]?.forEach((l) => l());
  });
  listeners: Record<string, Array<() => void>> = {};
  addEventListener(ev: string, cb: () => void) {
    (this.listeners[ev] ||= []).push(cb);
  }
  removeEventListener() {}
}

beforeEach(() => {
  // @ts-expect-error -- FakeAudio is a minimal stub for HTMLAudioElement
  globalThis.Audio = FakeAudio;
});

describe("AudioButton", () => {
  it("renders with the right aria-label and is keyboard-accessible", async () => {
    const user = userEvent.setup();
    render(<AudioButton sha1={"a".repeat(40)} label="Écouter la question en français" />);
    const btn = screen.getByRole("button", { name: /écouter la question/i });
    expect(btn).toBeInTheDocument();
    await user.click(btn);
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });
});
