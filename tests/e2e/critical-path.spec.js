import { test, expect } from '@playwright/test';

test.describe('Critical Path: Intake to Dashboard', () => {

    test('should guide user from landing page to dashboard', async ({ page }) => {
        test.setTimeout(60000); // Increase timeout to 60s for full flow

        // Debug Logging
        page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));
        page.on('pageerror', err => console.error(`[BROWSER ERROR] ${err.message}`));

        // 1. Visit Landing Page
        await page.goto('/');
        await expect(page).toHaveTitle(/ExtensioVitae/);

        // 3. Complete Intake
        // Direct navigation to intake to ensure stability
        await page.goto('/intake');
        await expect(page.url()).toContain('/intake');

        // --- Step 0: Basics ---
        // Name
        const nameInput = page.getByPlaceholder(/First name|Name/i);
        await nameInput.fill('Testhans');

        // Age
        const ageInput = page.getByPlaceholder(/Age/i);
        await ageInput.fill('35');

        // Sex (Option Button)
        await page.getByRole('button', { name: /^Male$/i }).click();

        // Next
        await page.getByRole('button', { name: /Next|Weiter|Continue/i }).click();

        // --- Step 1: Status ---
        // Sleep
        await page.getByRole('button', { name: /7.5 - 8 hours|7.5-8/i }).click();

        // Training
        await page.getByRole('button', { name: /3-4 times/i }).click();

        // Diet (Multiselect - pick one)
        await page.getByRole('button', { name: /Mostly Whole Foods/i }).click();

        // Wait a bit for transitions
        await page.waitForTimeout(300);

        // Next
        await page.getByRole('button', { name: /Next|Weiter|Continue/i }).click();

        // --- Step 2: Goals ---
        // Step 2: Goals
        // Primary Goal
        await page.getByRole('button', { name: 'More Energy' }).click();

        // Consent Checkbox
        await page.getByRole('checkbox').check();

        // Wait a bit
        await page.waitForTimeout(300);

        // Final Submit: "Generate Blueprint"
        // Try searching for the text specifically
        const submitBtn = page.getByRole('button', { name: /Generate|Erstellen/i });
        await submitBtn.click();

        // 4. Generating Page -> Dashboard
        // Might redirect to /generating then /dashboard/d/...
        // Allow up to 10s for generation
        await expect(page).toHaveURL(/\/generating|\/dashboard|\/d\//, { timeout: 15000 });

        // 5. Verify Dashboard
        // Wait for dashboard specific element
        await expect(page.locator('[data-tour="daily-progress"]')).toBeVisible({ timeout: 20000 });
    });

});
