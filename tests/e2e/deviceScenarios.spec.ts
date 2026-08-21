import { test, expect } from '@playwright/test';
import { LayoutInspector } from '../../src/playwright/inspector';
import { getDevicePreset } from '../../src/core/devices';

test.describe('Device Specific Layout Audits', () => {
  test('Samsung Galaxy S25+ viewport audit generates HTML report', async ({ page }) => {
    const s25plus = getDevicePreset('Samsung Galaxy S25+');
    await page.setViewportSize({ width: s25plus.width, height: s25plus.height });
    
    await page.goto('http://localhost:5173/?scenario=overflow');
    const inspector = new LayoutInspector(page);
    const audit = await inspector.audit({ device: s25plus, includeScreenshot: true });

    expect(audit.device?.name).toBe('Samsung Galaxy S25+');
    expect(audit.viewport.width).toBe(412);
    expect(audit.overflowIssues.length).toBeGreaterThan(0);

    const reportPath = await inspector.generateReport(audit, './playwright-report/s25plus-overflow-audit.html');
    expect(reportPath).toContain('s25plus-overflow-audit.html');
  });

  test('Desktop 1080p audit succeeds without mobile false positives', async ({ page }) => {
    const desktop = getDevicePreset('Desktop 1080p');
    await page.setViewportSize({ width: desktop.width, height: desktop.height });

    await page.goto('http://localhost:5173/?scenario=clean');
    const inspector = new LayoutInspector(page);
    const audit = await inspector.audit({ device: desktop });

    expect(audit.viewport.width).toBe(1920);
    expect(audit.uxScore.totalScore).toBeGreaterThanOrEqual(80);
  });
});
