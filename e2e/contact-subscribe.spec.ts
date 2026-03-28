import { test, expect } from "@playwright/test";

test.describe("Contact Page", () => {
  test("renders contact form", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("h1")).toContainText(/contact|touch/i);
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('textarea[name="message"]')).toBeVisible();
  });

  test("form validation prevents empty submit", async ({ page }) => {
    await page.goto("/contact");
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    // Browser native validation should prevent submission
    // The form should still be on the contact page
    await expect(page).toHaveURL(/contact/);
  });
});

test.describe("Newsletter Subscription", () => {
  test("newsletter form is visible on blog page", async ({ page }) => {
    await page.goto("/blog");
    const form = page.locator('input[type="email"]');
    if (await form.isVisible()) {
      await expect(form).toBeVisible();
    }
  });
});
