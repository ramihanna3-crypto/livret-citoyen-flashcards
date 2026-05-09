import { useCallback, useSyncExternalStore } from "react";
import * as p from "@/lib/progress";
import type { ThemeId } from "@/lib/card";

const subs = new Set<() => void>();
function notify() {
  subs.forEach((s) => s());
}

function subscribe(cb: () => void) {
  subs.add(cb);
  return () => subs.delete(cb);
}
function getSnapshot() {
  return JSON.stringify(p.getProgress()) + JSON.stringify(p.getPrefs());
}

export function useProgress() {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const cards = p.getProgress();
  const prefs = p.getPrefs();

  const markKnown = useCallback((id: string) => {
    p.markKnown(id);
    notify();
  }, []);
  const markReview = useCallback((id: string) => {
    p.markReview(id);
    notify();
  }, []);
  const setPref = useCallback(<K extends keyof p.Prefs>(k: K, v: p.Prefs[K]) => {
    p.setPref(k, v);
    notify();
  }, []);
  const reset = useCallback(() => {
    p.resetProgress();
    notify();
  }, []);

  function countByTheme(theme: ThemeId, status: "known" | "review") {
    return Object.entries(cards).filter(
      ([id, e]) => id.startsWith(`${theme}-`) && e.status === status,
    ).length;
  }

  return {
    cards,
    prefs,
    markKnown,
    markReview,
    setPref,
    reset,
    knownCount: (theme: ThemeId) => countByTheme(theme, "known"),
    reviewCount: (theme: ThemeId) => countByTheme(theme, "review"),
    statusOf: (id: string): "known" | "review" | undefined => cards[id]?.status,
  };
}
