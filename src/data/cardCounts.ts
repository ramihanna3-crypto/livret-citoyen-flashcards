import type { ThemeId } from "@/lib/card";

/**
 * Per-theme card counts as plain constants.
 *
 * Why this file exists: the Home page only needs counts to render the
 * deck-tile badges (e.g. "12 / 25"). It does NOT need the card content
 * itself. If Home imported `cardsByTheme()` from `@/data`, the bundler
 * would pull all 388 KB of card JSON into Home's chunk — meaning every
 * first-time visitor downloads the full study material before clicking
 * anything. Splitting the counts out lets the Home chunk stay tiny while
 * Study (lazy-loaded) carries the actual content.
 *
 * Drift protection: cardCounts.test.ts loads the JSON files at test time
 * and asserts that each value here matches the file's true length. If
 * cards get added or removed without updating this file, the test fails
 * and CI blocks the merge.
 */
export const cardCountByTheme: Record<ThemeId, number> = {
  valeurs: 13,
  "droits-devoirs": 25,
  institutions: 12,
  histoire: 31,
  geographie: 15,
  ddhc: 17,
};

export const totalCardCount: number = Object.values(cardCountByTheme).reduce(
  (sum, n) => sum + n,
  0,
);
