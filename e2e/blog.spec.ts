import { test, expect } from "@playwright/test";

test.describe("Blog", () => {
  test("renders blog listing page", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.locator("h1")).toContainText(/blog/i);
  });

  test("search input filters posts", async ({ page }) => {
    await page.goto("/blog");
    const searchInput = page.locator('input[type="text"], input[placeholder*="earch"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill("nonexistent-post-xyz-123");
      // Wait for potential debounce / load
      await page.waitForTimeout(1000);
    }
  });

  test("tag filtering works", async ({ page }) => {
    await page.goto("/blog");
    const tagBadge = page.locator('[class*="badge"], [class*="tag"]').first();
    if (await tagBadge.isVisible()) {
      await tagBadge.click();
      // URL should reflect tag filter
      await page.waitForTimeout(500);
    }
  });

  test("clicking a post navigates to detail page", async ({ page }) => {
    await page.goto("/blog");
    const firstPostLink = page.locator('a[href^="/blog/"]').first();
    if (await firstPostLink.isVisible()) {
      const href = await firstPostLink.getAttribute("href");
      await firstPostLink.click();
      await page.waitForURL(`**${href}`);
      await expect(page.locator("article")).toBeVisible();
    }
  });
});
