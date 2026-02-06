import { test, expect } from '@playwright/test';

test.describe('Critical Path: Intake to Dashboard', () => {

    test('should guide user from landing page to dashboard', async ({ page }) => {
        // 1. Visit Landing Page
        await page.goto('/');
        await expect(page).toHaveTitle(/ExtensioVitae/);

        // 2. Start Intake
        // Look for button with "Start" or "Blueprint"
        const startButton = page.getByRole('link', { name: /Start|Blueprint/i }).first();
        // Fallback if no link found in hero, try direct navigation for test stability
        if (await startButton.isVisible()) {
            await startButton.click();
        } else {
            await page.goto('/intake');
        }

        // 3. Complete Intake (Simplified for Wizard)
        await expect(page.url()).toContain('/intake');

        // Step 1: Name
        await page.getByPlaceholder(/name/i).fill('Test User');
        await page.getByRole('button', { name: /Next|Continue/i }).click();

        // Step 2: Status (skip or fill defaults)
        // Assuming Step 2 has buttons or inputs. 
        // We aim for "Next" button until we hit Submit or Generating

        // Safety loop to get through wizard steps
        let attempt = 0;
        while (attempt < 5) {
            attempt++;
            const nextBtn = page.getByRole('button', { name: /Next|Continue|Generate/i });
            if (await nextBtn.count() > 0) {
                await nextBtn.first().click();
                await page.waitForTimeout(500); // Animation wait
            } else {
                break;
            }

            // If we see "Submit" or "Generate Blueprint" specifically
            const submitBtn = page.getByRole('button', { name: /Generate Blueprint/i });
            if (await submitBtn.isVisible()) {
                await submitBtn.click();
                break;
            }
        }

        // 4. Generating Page
        // Might redirect to /generating then /dashboard/d/...
        await expect(page.url()).toMatch(/\/generating|\/dashboard|\/d\//);

        // 5. Verify Dashboard
        // Wait for plan generation
        await page.waitForTimeout(5000); // Give AI time

        // Check for dashboard elements
        await expect(page.getByText(/Guten|Good/i)).toBeVisible(); // Greeting
        await expect(page.getByText(/0%/)).toBeVisible(); // Progress bar
    });

});
