import { test, expect } from "@playwright/test";

test.use({ reducedMotion: "reduce" });

test("study a deck, mark cards, reload, progress survives, then reset", async ({ page }) => {
  await page.goto("/");

  // Open Valeurs deck
  await page
    .getByRole("button", { name: /valeurs/i })
    .first()
    .click();
  await expect(page).toHaveURL(/study\/valeurs/);

  const card = page.getByTestId("flashcard");
  await expect(card).toBeVisible();

  // Card 1: flip then Je sais → auto-advance
  await card.click();
  const knownBtn = page.getByRole("button", { name: /je sais/i });
  await expect(knownBtn).toBeVisible();
  await knownBtn.dispatchEvent("click");
  await expect(page.getByText(/2 \/ \d+/).first()).toBeVisible();

  // Card 2: flip then À revoir → auto-advance (symmetric with Je sais)
  await card.click();
  const reviewBtn = page.getByRole("button", { name: /à revoir/i });
  await expect(reviewBtn).toBeVisible();
  await reviewBtn.dispatchEvent("click");
  await expect(page.getByText(/3 \/ \d+/).first()).toBeVisible();

  // Reload — progress should persist
  await page.reload();
  // After reload, cursor resets but localStorage should remember Je sais on card 1.
  // Go home; deck tile shows "1 / N" (only "known" cards count toward the ring).
  await page.getByRole("link", { name: /retour/i }).click();
  await expect(page.getByText(/1 \/ \d+/).first()).toBeVisible();

  // Reset progress in About
  await page.getByRole("link", { name: /À propos/i }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: /réinitialiser le progrès/i }).click();

  // Back home — every theme should now read "0 / N"
  await page
    .getByRole("link", { name: /Livret du Citoyen/i })
    .first()
    .click();
  await expect(page.getByText(/0 \/ \d+/).first()).toBeVisible();
});
