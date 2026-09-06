import { test, expect } from '@playwright/test';
import { collectInPageAuditScript } from '../../src/core/browserScript';
import { evaluateFlexBlowout } from '../../src/core/flexBlowout';

test.describe('Flexbox & Grid Blowout E2E', () => {
  test('identifies div#unconstrained-child blowing out flex parent container', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 20px; font-family: sans-serif; }
          </style>
        </head>
        <body>
          <div id="flex-parent" style="display: flex; width: 250px; border: 1px solid #ccc;">
            <div id="unconstrained-child" style="min-width: auto; flex-shrink: 0; width: 400px;">Long unwrapped content that blows out flex parent</div>
          </div>
        </body>
      </html>
    `);

    const inPageData = await page.evaluate(collectInPageAuditScript, '{}');
    const issues = evaluateFlexBlowout(inPageData.containerOverflows, inPageData.elements);

    expect(issues.length).toBeGreaterThan(0);
    const blowout = issues.find(i => i.selector.includes('unconstrained-child'));
    expect(blowout).toBeDefined();
    expect(blowout?.tagName).toBe('div');
    expect(blowout?.parentSelector).toContain('flex-parent');
    expect(blowout?.layoutType).toBe('flex');
    expect(blowout?.overflowPx).toBeGreaterThan(100);
    expect(blowout?.severity).toBe('critical');
    expect(blowout?.suggestion).toContain('min-width: 0 and overflow: hidden; text-overflow: ellipsis');
  });

  test('reports 0 blowout issues on clean layout with min-width: 0 and overflow: hidden', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 20px; font-family: sans-serif; }
          </style>
        </head>
        <body>
          <div id="flex-parent" style="display: flex; width: 250px; border: 1px solid #ccc;">
            <div id="clean-child" style="min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Long unwrapped content that blows out flex parent</div>
          </div>
        </body>
      </html>
    `);

    const inPageData = await page.evaluate(collectInPageAuditScript, '{}');
    const issues = evaluateFlexBlowout(inPageData.containerOverflows, inPageData.elements);

    expect(issues).toHaveLength(0);
  });
});
