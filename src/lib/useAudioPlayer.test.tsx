import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAudioPlayer } from "@/lib/useAudioPlayer";

class FakeAudio {
  src = "";
  paused = true;
  currentTime = 0;
  listeners: Record<string, Array<() => void>> = {};
  play = vi.fn(async () => {
    this.paused = false;
    this.listeners["play"]?.forEach((l) => l());
  });
  pause = vi.fn(() => {
    this.paused = true;
    this.listeners["pause"]?.forEach((l) => l());
  });
  addEventListener(ev: string, cb: () => void) {
    (this.listeners[ev] ||= []).push(cb);
  }
  removeEventListener() {}
}

beforeEach(() => {
  // @ts-expect-error override global Audio
  globalThis.Audio = FakeAudio;
});

describe("useAudioPlayer", () => {
  it("starts paused, plays on toggle", async () => {
    const { result } = renderHook(() => useAudioPlayer("/audio/x.mp3"));
    expect(result.current.state).toBe("idle");
    await act(async () => {
      await result.current.toggle();
    });
    expect(result.current.state).toBe("playing");
  });

  it("only one player can be playing at a time globally", async () => {
    const a = renderHook(() => useAudioPlayer("/audio/a.mp3"));
    const b = renderHook(() => useAudioPlayer("/audio/b.mp3"));
    await act(async () => {
      await a.result.current.toggle();
    });
    expect(a.result.current.state).toBe("playing");
    await act(async () => {
      await b.result.current.toggle();
    });
    expect(a.result.current.state).toBe("idle");
    expect(b.result.current.state).toBe("playing");
  });
});
