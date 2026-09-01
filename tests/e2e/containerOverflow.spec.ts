import { test, expect } from '@playwright/test';
import { LayoutInspector } from '../../src/playwright/inspector';
import '../../src/playwright/matchers';

test.describe('Container Geometric Containment E2E', () => {
  test('detects 3-column auth inputs bleeding outside a 550px modal container on desktop viewport', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=container-overflow');

    const inspector = new LayoutInspector(page);
    const audit = await inspector.audit();

    // Check container overflow issues
    expect(audit.containerOverflowIssues.length).toBeGreaterThan(0);

    const issue = audit.containerOverflowIssues.find(i => i.selector.includes('auth-input-row') || i.selector.includes('auth-row'));
    expect(issue).toBeDefined();
    expect(issue?.containerSelector).toContain('auth-modal');
    expect(issue?.overflowRightPx).toBeGreaterThan(30);
    expect(issue?.suggestedFix).toContain('flex-wrap');

    // Verify close button and tooltip are exempted
    const closeBtnIssue = audit.containerOverflowIssues.find(i => i.selector.includes('modal-close-btn'));
    expect(closeBtnIssue).toBeUndefined();

    const tooltipIssue = audit.containerOverflowIssues.find(i => i.selector.includes('auth-tooltip'));
    expect(tooltipIssue).toBeUndefined();
  });

  test('custom matcher toHaveNoContainerOverflow fails on modal bleed and passes on clean layout', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=container-overflow');
    await expect(expect(page).toHaveNoContainerOverflow()).rejects.toThrow();

    await page.goto('http://localhost:5173/?scenario=clean');
    await expect(page).toHaveNoContainerOverflow();
  });
});
