import { useEffect, useReducer } from "react";

/**
 * Rating prompt state — persisted in localStorage, consistent with the rest
 * of the app's privacy posture (no server-side tracking).
 *
 * Trigger contract (per user spec):
 *   "Display the rating modal after the user clicks on a card for the first
 *    time and has interacted with twenty-five cards."
 *
 * Interpretation: count UNIQUE card flips (revealing the back of a card the
 * user hasn't seen before in any session). When the count reaches 25 and the
 * user has neither rated nor dismissed, the modal mounts on the next render
 * cycle.
 *
 * Why unique cards rather than total flips: a user flipping the same card
 * back and forth ten times shouldn't trip the threshold. The trigger is
 * meant to signal "this person has engaged enough to have an opinion."
 *
 * Storage keys (lc.* namespace matches the rest of the app):
 *   lc.rating.cardsSeen   JSON array of card IDs (the deduplicated set)
 *   lc.rating.value       "1"-"5" once the user submits a rating
 *   lc.rating.dismissed   "1" once the user clicks the × to dismiss
 *
 * Cross-component communication uses a custom DOM event ("lc.rating.update")
 * dispatched after every state mutation. The RatingPrompt mounted at the
 * App level subscribes via useRatingState() and re-renders. This avoids
 * pulling in a context provider for a single piece of global state.
 */

const KEY_CARDS_SEEN = "lc.rating.cardsSeen";
const KEY_VALUE = "lc.rating.value";
const KEY_DISMISSED = "lc.rating.dismissed";
const EVENT_NAME = "lc.rating.update";

/** Card count after which the rating prompt becomes eligible to appear. */
export const RATING_THRESHOLD = 25;

function readCardIds(): string[] {
  try {
    const raw = localStorage.getItem(KEY_CARDS_SEEN);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Corrupt JSON — reset.
    return [];
  }
}

/** Record that the user has flipped a given card. Idempotent per card id. */
export function recordCardInteraction(cardId: string): void {
  if (!cardId) return;
  // Short-circuit once we're well past the threshold AND the user has
  // already given a verdict — avoids unbounded localStorage growth for
  // long-time users who've already rated or dismissed.
  if (hasRated() || hasDismissed()) return;

  const ids = readCardIds();
  if (ids.includes(cardId)) return;
  ids.push(cardId);
  localStorage.setItem(KEY_CARDS_SEEN, JSON.stringify(ids));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function getInteractionCount(): number {
  return readCardIds().length;
}

export function hasRated(): boolean {
  return !!localStorage.getItem(KEY_VALUE);
}

export function hasDismissed(): boolean {
  return localStorage.getItem(KEY_DISMISSED) === "1";
}

/** Single source of truth for "should the modal be visible right now?". */
export function shouldShowRatingPrompt(): boolean {
  if (hasRated() || hasDismissed()) return false;
  return getInteractionCount() >= RATING_THRESHOLD;
}

/** User submitted a star rating. Clamps to [1, 5]; ignores invalid input. */
export function submitRating(value: number): void {
  const v = Math.round(value);
  if (!Number.isFinite(v) || v < 1 || v > 5) return;
  localStorage.setItem(KEY_VALUE, String(v));
  window.dispatchEvent(new Event(EVENT_NAME));
}

/** User clicked the × to close without rating. */
export function dismissRatingPrompt(): void {
  localStorage.setItem(KEY_DISMISSED, "1");
  window.dispatchEvent(new Event(EVENT_NAME));
}

/**
 * React hook: subscribe to rating-state changes anywhere in the tree.
 * Returns a fresh snapshot of all derived booleans on every update.
 */
export function useRatingState() {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const handler = () => force();
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);
  return {
    count: getInteractionCount(),
    shouldShow: shouldShowRatingPrompt(),
    rated: hasRated(),
    dismissed: hasDismissed(),
  };
}
