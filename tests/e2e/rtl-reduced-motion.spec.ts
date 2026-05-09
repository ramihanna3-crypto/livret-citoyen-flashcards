import { test, expect } from "@playwright/test";

test("Arabic spans are dir=rtl", async ({ page }) => {
  await page.goto("/#/study/valeurs");
  const ar = page.locator("[dir='rtl'][lang='ar']").first();
  await expect(ar).toBeVisible();
  await expect(ar).toHaveAttribute("dir", "rtl");
});

test.use({ reducedMotion: "reduce" });
test("flip works under reduced motion", async ({ page }) => {
  await page.goto("/#/study/valeurs");
  const card = page.getByTestId("flashcard");
  await expect(card).toBeVisible();
  await card.dispatchEvent("click");
  await expect(page.getByRole("button", { name: /je sais/i })).toBeVisible();
});
