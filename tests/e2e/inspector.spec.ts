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

  test('detects interactive action occluded by floating overlay', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=occlusion');
    await page.waitForSelector('#covered-submit-btn');

    const inspector = new LayoutInspector(page);
    const audit = await inspector.audit();

    expect(audit.occlusionIssues.length).toBeGreaterThan(0);
    const occ = audit.occlusionIssues.find(i => i.selector.includes('covered-submit-btn'));
    expect(occ).toBeDefined();
    expect(occ?.occludedBySelector).toContain('floating-banner-overlay');
  });

  test('detects 2D element text collisions between overlapping badges', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=collision');
    await page.waitForSelector('#badge-alpha');

    const inspector = new LayoutInspector(page);
    const audit = await inspector.audit();

    expect(audit.collisionIssues.length).toBeGreaterThan(0);
    expect(audit.collisionIssues.some(c => c.selectorA.includes('badge') || c.selectorB.includes('badge'))).toBe(true);
  });

  test('detects nested scroll trap on huge scrollable feed', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=scrolltrap');
    await page.waitForSelector('#trapping-feed');

    const inspector = new LayoutInspector(page);
    const audit = await inspector.audit();

    expect(audit.scrollTrapIssues.length).toBeGreaterThan(0);
    const trap = audit.scrollTrapIssues.find(t => t.selector.includes('trapping-feed'));
    expect(trap).toBeDefined();
  });

  test('detects icon-only buttons missing accessible names', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=missingaction');
    await page.waitForSelector('#unlabeled-icon-btn');

    const inspector = new LayoutInspector(page);
    const audit = await inspector.audit();

    expect(audit.accessibleNameIssues.length).toBeGreaterThan(0);
    const unlabeled = audit.accessibleNameIssues.find(a => a.selector.includes('unlabeled-icon-btn'));
    expect(unlabeled).toBeDefined();
    expect(unlabeled?.isIconOnly).toBe(true);
  });

  test('tests 200% zoom reflow compliance (WCAG 1.4.10)', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=clean');
    await page.waitForSelector('#responsive-canvas');

    const inspector = new LayoutInspector(page);
    const reflow = await inspector.test200PercentZoomReflow(2.0);

    expect(reflow.passesReflow).toBe(true);
    expect(reflow.hasHorizontalBleed).toBe(false);
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
    expect(audit.uxScore.totalScore).toBeGreaterThanOrEqual(70);
    expect(audit.uxScore.passed).toBe(true);
  });
});
