import { test, expect } from '@playwright/test';
import { LayoutInspector } from '../../src/playwright/inspector';
import { getDevicePreset } from '../../src/core/devices';

test.describe('Responsive Matrix Audits', () => {
  test('audits across multiple viewports and correlates issues', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Matrix Test</title>
        <style>
          body { margin: 0; font-family: sans-serif; }
          .desktop-only-bleed {
            width: 1500px;
            height: 50px;
            background: #eee;
          }
          @media (max-width: 900px) {
            .desktop-only-bleed { width: 100%; }
          }
          button {
            padding: 10px 16px;
            background: #0284c7;
            color: #fff;
            border: none;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>Responsive Matrix Audit Test</h1>
          <button id="btn-test">Click Me</button>
          <div class="desktop-only-bleed">Wide content</div>
        </main>
      </body>
      </html>
    `);

    const inspector = new LayoutInspector(page);
    const matrixResult = await inspector.auditMatrix({
      devices: [
        getDevicePreset('Samsung Galaxy S25+'),
        getDevicePreset('Desktop 1080p')
      ]
    });

    expect(matrixResult.devices).toHaveLength(2);
    expect(matrixResult.results['Samsung Galaxy S25+']).toBeDefined();
    expect(matrixResult.results['Desktop 1080p']).toBeDefined();
    expect(typeof matrixResult.overallScore).toBe('number');
    expect(matrixResult.overallScore).toBeGreaterThan(0);
    expect(matrixResult.matrixSummary).toBeDefined();
  });
});
