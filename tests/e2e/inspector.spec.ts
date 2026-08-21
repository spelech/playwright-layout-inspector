import { test, expect } from '@playwright/test';
import { LayoutInspector } from '../../src/playwright/inspector';

test.describe('LayoutInspector E2E Tests', () => {
  test('accurately detects horizontal overflow and identifies culprit element', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=overflow');
    await page.waitForSelector('#oversized-canvas');

    const inspector = new LayoutInspector(page);
    const audit = await inspector.audit();

    expect(audit.overflowIssues.length).toBeGreaterThan(0);
    const canvasIssue = audit.overflowIssues.find(i => i.selector.includes('oversized-canvas'));
    expect(canvasIssue).toBeDefined();
    expect(canvasIssue?.boundingBox.width).toBeGreaterThanOrEqual(600);
    expect(canvasIssue?.overflowRightPx).toBeGreaterThan(0);
    expect(canvasIssue?.culpritDescription).toContain('extends');
    expect(audit.uxScore.passed).toBe(false);
  });

  test('tracks dynamic layout shift and identifies displaced elements', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=shifting');
    await page.waitForSelector('#canvas-card');

    const inspector = new LayoutInspector(page);
    const shiftResult = await inspector.trackShifts(async () => {
      await page.click('#toggle-drawer-btn');
    });

    expect(shiftResult.isAcceptable).toBe(false);
    expect(shiftResult.totalDisplacedElements).toBeGreaterThan(0);
    expect(shiftResult.maxDisplacementPx).toBeGreaterThan(100);
    expect(shiftResult.items.some(i => i.selector.includes('canvas'))).toBe(true);
  });

  test('detects undersized touch targets violating WCAG 2.2', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=tiny-touch');
    await page.waitForSelector('#tiny-close-btn');

    const inspector = new LayoutInspector(page);
    const audit = await inspector.audit({ minTouchTargetSize: 24 });

    expect(audit.touchTargetIssues.length).toBeGreaterThan(0);
    const tinyClose = audit.touchTargetIssues.find(i => i.selector.includes('tiny-close-btn'));
    expect(tinyClose).toBeDefined();
    expect(tinyClose?.width).toBeLessThan(20);
  });

  test('detects restrictive viewport meta tag blocking pinch zoom', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=bad-viewport');

    const inspector = new LayoutInspector(page);
    const audit = await inspector.audit();

    expect(audit.viewportFit.allowsUserZoom).toBe(false);
    expect(audit.viewportFit.issues.some(i => i.includes('user-scalable'))).toBe(true);
  });

  test('passes clean, responsive layout with high UX score', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=clean');
    await page.waitForSelector('#responsive-canvas');

    const inspector = new LayoutInspector(page);
    const audit = await inspector.audit();

    expect(audit.overflowIssues.length).toBe(0);
    expect(audit.touchTargetIssues.length).toBe(0);
    expect(audit.viewportFit.contentBleeds).toBe(false);
    expect(audit.uxScore.totalScore).toBeGreaterThanOrEqual(90);
    expect(audit.uxScore.passed).toBe(true);
  });
});
