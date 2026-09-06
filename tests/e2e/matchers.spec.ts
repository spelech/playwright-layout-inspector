import { test, expect } from '@playwright/test';
import '../../src/playwright/matchers';

test.describe('Playwright Custom Matchers', () => {
  test('toHaveNoLayoutOverflow passes on clean layout and fails on bleeding layout', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=clean');
    await expect(page).toHaveNoLayoutOverflow();

    await page.goto('http://localhost:5173/?scenario=overflow');
    await expect(expect(page).toHaveNoLayoutOverflow()).rejects.toThrow();

    await page.goto('http://localhost:5173/?scenario=container-overflow');
    await expect(expect(page).toHaveNoLayoutOverflow()).rejects.toThrow();
  });

  test('toHaveNoContainerOverflow validates visual container containment', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=clean');
    await expect(page).toHaveNoContainerOverflow();

    await page.goto('http://localhost:5173/?scenario=container-overflow');
    await expect(expect(page).toHaveNoContainerOverflow()).rejects.toThrow();
  });

  test('toHaveCleanTextFlow validates clean text wrapping and formatting', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=clean');
    await expect(page).toHaveCleanTextFlow();

    await page.goto('http://localhost:5173/?scenario=text-breaks');
    await expect(expect(page).toHaveCleanTextFlow()).rejects.toThrow();
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

  test('toHaveNoOccludedActions catches floating overlay tap-jacking', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=clean');
    await expect(page).toHaveNoOccludedActions();

    await page.goto('http://localhost:5173/?scenario=occlusion');
    await expect(expect(page).toHaveNoOccludedActions()).rejects.toThrow();
  });

  test('toHaveNoElementCollisions catches overlapping text labels', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=clean');
    await expect(page).toHaveNoElementCollisions();

    await page.goto('http://localhost:5173/?scenario=collision');
    await expect(expect(page).toHaveNoElementCollisions()).rejects.toThrow();
  });

  test('toHaveNoNestedScrollTraps catches massive scrollable feed', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=clean');
    await expect(page).toHaveNoNestedScrollTraps();

    await page.goto('http://localhost:5173/?scenario=scrolltrap');
    await expect(expect(page).toHaveNoNestedScrollTraps()).rejects.toThrow();
  });

  test('toHaveAccessibleInteractiveNames catches unlabeled icon buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=clean');
    await expect(page).toHaveAccessibleInteractiveNames();

    await page.goto('http://localhost:5173/?scenario=missingaction');
    await expect(expect(page).toHaveAccessibleInteractiveNames()).rejects.toThrow();
  });

  test('toPass200PercentZoomReflow validates WCAG 1.4.10 compliance', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=clean');
    await expect(page).toPass200PercentZoomReflow();
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

  test('toPassLayoutAudit scores clean page above 70', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=clean');
    await expect(page).toPassLayoutAudit({ minScore: 70 });
  });

  test('toHaveNoStickyOcclusion passes on clean and fails when fixed header covers button', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <body>
        <div style="height: 100px; padding: 20px;">
          <button id="btn-free">Safe Button</button>
        </div>
      </body>
      </html>
    `);
    await expect(page).toHaveNoStickyOcclusion();

    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <body style="margin: 0;">
        <header style="position: fixed; top: 0; left: 0; right: 0; height: 60px; z-index: 100; background: #333;"></header>
        <button id="btn-covered" style="position: absolute; top: 10px; left: 20px;">Covered Button</button>
      </body>
      </html>
    `);
    await expect(expect(page).toHaveNoStickyOcclusion()).rejects.toThrow();
  });

  test('toHaveNoFlexBlowout passes on clean and fails on unconstrained flex blowout', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <body>
        <div style="display: flex; width: 300px;">
          <div style="min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            Clean contained content
          </div>
        </div>
      </body>
      </html>
    `);
    await expect(page).toHaveNoFlexBlowout();

    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <body>
        <div id="parent" style="display: flex; width: 200px; border: 1px solid #ccc;">
          <div id="blowout-child" style="min-width: auto; flex-shrink: 0; width: 350px;">
            Unconstrained wide child blowing out flex parent
          </div>
        </div>
      </body>
      </html>
    `);
    await expect(expect(page).toHaveNoFlexBlowout()).rejects.toThrow();
  });
});

