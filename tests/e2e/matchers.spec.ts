import { test, expect } from '@playwright/test';
import '../../src/playwright/matchers';

test.describe('Playwright Custom Matchers', () => {
  test('toHaveNoLayoutOverflow passes on clean layout and fails on bleeding layout', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=clean');
    await expect(page).toHaveNoLayoutOverflow();

    await page.goto('http://localhost:5173/?scenario=overflow');
    await expect(expect(page).toHaveNoLayoutOverflow()).rejects.toThrow();
  });

  test('toHaveMobileFit validates mobile responsiveness', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=clean');
    await expect(page).toHaveMobileFit();
  });

  test('toHaveTouchFriendlyTargets validates interactive touch sizing', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=clean');
    await expect(page).toHaveTouchFriendlyTargets({ minSize: 24 });

    await page.goto('http://localhost:5173/?scenario=tiny-touch');
    await expect(expect(page).toHaveTouchFriendlyTargets({ minSize: 24 })).rejects.toThrow();
  });

  test('toHaveAcceptableLayoutShift catches jarring jumps', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=shifting');
    
    // Expect failure on drawer toggle
    await expect(
      expect(page).toHaveAcceptableLayoutShift(async () => {
        await page.click('#toggle-drawer-btn');
      })
    ).rejects.toThrow();
  });

  test('toPassLayoutAudit scores clean page above 80', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=clean');
    await expect(page).toPassLayoutAudit({ minScore: 85 });
  });
});
