import { test, expect } from '../../src/playwright/fixture';

test.describe('Playwright Layout Inspector Fixture', () => {
  test('provides pre-configured layoutInspector fixture with auto-registered matchers', async ({
    page,
    layoutInspector
  }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fixture Test</title>
        <style>
          body { font-family: sans-serif; margin: 0; padding: 20px; }
          button { padding: 10px 18px; font-size: 14px; background: #0284c7; color: white; border: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <main>
          <h1>Playwright Fixture Audit</h1>
          <button id="fixture-btn">Action Button</button>
        </main>
      </body>
      </html>
    `);

    // 1. Verify layoutInspector fixture is injected and functional
    expect(layoutInspector).toBeDefined();
    const audit = await layoutInspector.audit();
    expect(audit.uxScore.totalScore).toBeGreaterThanOrEqual(80);

    // 2. Verify auto-registered custom matchers work directly
    await expect(page).toHaveNoLayoutOverflow();
    await expect(page).toHaveNoStickyOcclusion();
    await expect(page).toHaveNoFlexBlowout();
    await expect(page).toPassLayoutAudit({ minScore: 80 });
  });
});
