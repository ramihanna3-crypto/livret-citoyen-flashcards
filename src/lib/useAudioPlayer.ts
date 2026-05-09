import { useCallback, useEffect, useRef, useState } from "react";

type State = "idle" | "loading" | "playing" | "error";

const subscribers = new Set<() => void>();
let currentlyPlaying: HTMLAudioElement | AudioLike | null = null;

interface AudioLike {
  src: string;
  paused: boolean;
  play(): Promise<void>;
  pause(): void;
  addEventListener(ev: string, cb: () => void): void;
  removeEventListener(ev: string, cb: () => void): void;
}

function broadcastStop() {
  for (const fn of subscribers) fn();
}

export function useAudioPlayer(url: string) {
  const [state, setState] = useState<State>("idle");
  const audioRef = useRef<AudioLike | null>(null);

  useEffect(() => {
    const a = new Audio(url) as unknown as AudioLike;
    audioRef.current = a;
    const onPlay = () => setState("playing");
    const onPause = () => setState("idle");
    const onEnded = () => setState("idle");
    const onError = () => setState("error");
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);
    a.addEventListener("error", onError);

    const unsubscribe = () => {
      if (currentlyPlaying === a) currentlyPlaying = null;
      try {
        a.pause();
      } catch {
        /* element may already be torn down — ignore */
      }
    };
    subscribers.add(unsubscribe);

    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("error", onError);
      subscribers.delete(unsubscribe);
      try {
        a.pause();
      } catch {
        /* element may already be torn down — ignore */
      }
      if (currentlyPlaying === a) currentlyPlaying = null;
    };
  }, [url]);

  const toggle = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;
    if (!a.paused) {
      a.pause();
      return;
    }
    if (currentlyPlaying && currentlyPlaying !== a) {
      try {
        currentlyPlaying.pause();
      } catch {
        /* prior element may already be torn down — ignore */
      }
      broadcastStop();
    }
    currentlyPlaying = a;
    try {
      setState("loading");
      await a.play();
    } catch {
      setState("error");
    }
  }, []);

  return { state, toggle };
}
