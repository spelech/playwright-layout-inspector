import { test, expect } from '@playwright/test';
import { LayoutInspector } from '../../src/playwright/inspector';
import { getDevicePreset } from '../../src/core/devices';
import * as path from 'path';

const NELKO_URL = process.env.NELKO_DEV_URL ?? 'http://localhost:3001';

test.describe('Nelko Web Print Mobile UX Audit', () => {
  const s25plus = getDevicePreset('Samsung Galaxy S25+');

  test.use({
    viewport: { width: s25plus.width, height: s25plus.height },
    deviceScaleFactor: s25plus.deviceScaleFactor,
    isMobile: s25plus.isMobile,
    hasTouch: s25plus.hasTouch,
    userAgent: s25plus.userAgent,
  });

  // Skip the entire describe block if the Nelko dev server is not reachable.
  test.beforeEach(async ({ page }, testInfo) => {
    try {
      await page.goto(NELKO_URL, { timeout: 5000 });
    } catch {
      testInfo.skip(true, `Nelko dev server not running at ${NELKO_URL}. Set NELKO_DEV_URL env var or start the server.`);
    }
  });

  test('audits Nelko web print mobile layout on Samsung Galaxy S25+', async ({ page }) => {
    // Navigate to Nelko Web Print frontend
    await page.waitForSelector('main');

    const inspector = new LayoutInspector(page);
    const audit = await inspector.audit({
      device: s25plus,
      includeScreenshot: true,
      highlightIssuesInScreenshot: true
    });

    console.log('\n======================================================');
    console.log('--- Nelko Web Print Mobile Layout Audit (S25+) ---');
    console.log(`UX Score: ${audit.uxScore.totalScore}/100 (Grade: ${audit.uxScore.grade})`);
    console.log(`Passed: ${audit.uxScore.passed}`);
    console.log(`Overflow Issues Count: ${audit.overflowIssues.length}`);
    for (const iss of audit.overflowIssues) {
      console.log(`  - Selector: ${iss.selector}`);
      console.log(`    Right Bleed: +${iss.overflowRightPx}px (Width: ${iss.boundingBox.width}px vs Screen: ${iss.viewport.width}px)`);
      console.log(`    Culprit: ${iss.culpritDescription}`);
      console.log(`    Fix: ${iss.suggestedFix}`);
    }
    console.log(`Touch Target Issues Count: ${audit.touchTargetIssues.length}`);
    for (const t of audit.touchTargetIssues.slice(0, 5)) {
      console.log(`  - Target: ${t.selector} (${t.width}x${t.height}px < ${t.minRequiredSize}px)`);
    }
    console.log('======================================================\n');

    // Generate diagnostic report
    const reportFile = path.resolve(__dirname, '../../reports/nelko-mobile-audit.html');
    await inspector.generateReport(audit, reportFile);
    console.log(`Report generated at: ${reportFile}`);
  });

  test('tracks layout shifts when switching mobile drawer tabs', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForSelector('main');

    const inspector = new LayoutInspector(page);

    // Track shift when opening 'Add' drawer
    const addShift = await inspector.trackShifts(async () => {
      const addTabBtn = page.locator('nav button:has-text("Add")');
      await addTabBtn.click();
    });

    console.log('\n--- Nelko Tab Switch: Canvas -> Add ---');
    console.log(`Total Shift Score: ${addShift.totalShiftScore}`);
    console.log(`Max Displacement: ${addShift.maxDisplacementPx}px`);
    console.log(`Jarring Shifts: ${addShift.jarringShiftCount}`);
    for (const item of addShift.items.slice(0, 5)) {
      console.log(`  - ${item.selector}: Δy=${item.deltaY}px (${item.explanation})`);
    }

    // Track shift when switching to 'Inspector' drawer
    const inspectorShift = await inspector.trackShifts(async () => {
      const inspectorTabBtn = page.locator('nav button:has-text("Inspector")');
      await inspectorTabBtn.click();
    });

    console.log('\n--- Nelko Tab Switch: Add -> Inspector ---');
    console.log(`Total Shift Score: ${inspectorShift.totalShiftScore}`);
    console.log(`Max Displacement: ${inspectorShift.maxDisplacementPx}px`);
    console.log(`Jarring Shifts: ${inspectorShift.jarringShiftCount}`);
    for (const item of inspectorShift.items.slice(0, 5)) {
      console.log(`  - ${item.selector}: Δy=${item.deltaY}px (${item.explanation})`);
    }
  });
});
