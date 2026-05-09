import { test, expect } from "@playwright/test";

test("home renders deck picker with 6 tiles", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 2 })).toContainText(/choisissez un thème/i);
  const tiles = page.getByRole("button", { name: /valeurs|droits|institutions|histoire|géographie|droits de l'homme/i });
  await expect(tiles).toHaveCount(6);
});
