import { describe, expect, it } from "vitest";
import { cardCountByTheme, totalCardCount } from "./cardCounts";
import valeurs from "./cards/valeurs.json";
import droitsDevoirs from "./cards/droits-devoirs.json";
import institutions from "./cards/institutions.json";
import histoire from "./cards/histoire.json";
import geographie from "./cards/geographie.json";
import ddhc from "./cards/ddhc.json";

/**
 * Drift protection for cardCounts.ts.
 *
 * cardCounts.ts hand-codes the per-theme card totals so the Home page
 * can render counts without dragging the entire 388 KB of card content
 * into its bundle. The trade-off is that the constants can fall out of
 * sync if someone adds or removes a card without updating the file.
 *
 * These tests load the JSON content (only in the test environment — at
 * runtime the production bundle still skips it via the Home → cardCounts
 * import) and assert the constants match. If they don't, CI fails and
 * the dev sees a clear error pointing them at this file.
 */

describe("cardCounts", () => {
  it.each([
    ["valeurs", valeurs],
    ["droits-devoirs", droitsDevoirs],
    ["institutions", institutions],
    ["histoire", histoire],
    ["geographie", geographie],
    ["ddhc", ddhc],
  ] as const)("count for %s matches actual JSON length", (theme, data) => {
    expect(cardCountByTheme[theme]).toBe(data.length);
  });

  it("totalCardCount equals sum of all themes", () => {
    const sum =
      valeurs.length +
      droitsDevoirs.length +
      institutions.length +
      histoire.length +
      geographie.length +
      ddhc.length;
    expect(totalCardCount).toBe(sum);
  });
});
