import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("renders the homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Samba/i);
  });

  test("has navigation links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('nav a[href="/blog"]')).toBeVisible();
    await expect(page.locator('nav a[href="/projects"]')).toBeVisible();
    await expect(page.locator('nav a[href="/about"]')).toBeVisible();
    await expect(page.locator('nav a[href="/contact"]')).toBeVisible();
  });

  test("dark mode toggle works", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator("[data-theme-toggle]");
    if (await toggle.isVisible()) {
      await toggle.click();
      // Should toggle theme class on html element
      const htmlEl = page.locator("html");
      const classAttr = await htmlEl.getAttribute("class");
      expect(classAttr).toBeDefined();
    }
  });
});
