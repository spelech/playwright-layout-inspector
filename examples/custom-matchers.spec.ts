import { test, expect } from '@playwright/test';
import 'playwright-layout-inspector/matchers';

test.describe('App Mobile Layout Quality Assurance', () => {
  test('home page passes UX audit on mobile', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // 1. Assert no horizontal viewport bleed
    await expect(page).toHaveNoLayoutOverflow();

    // 2. Assert valid mobile viewport and scaling
    await expect(page).toHaveMobileFit();

    // 3. Assert all touch targets meet WCAG 2.2 AA (≥ 24px)
    await expect(page).toHaveTouchFriendlyTargets({ minSize: 24 });

    // 4. Assert composite UX score meets high standard
    await expect(page).toPassLayoutAudit({ minScore: 85 });
  });

  test('drawer expansion does not cause jarring layout shift', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=shifting');

    // Measure layout stability across dynamic actions
    await expect(page).toHaveAcceptableLayoutShift(
      async () => {
        await page.click('#toggle-drawer-btn');
      },
      { maxAcceptableScore: 0.05, maxAcceptableDisplacement: 15 }
    );
  });
});
