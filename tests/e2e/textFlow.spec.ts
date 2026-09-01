import { test, expect } from '@playwright/test';
import { LayoutInspector } from '../../src/playwright/inspector';
import '../../src/playwright/matchers';

test.describe('Text Flow & Wrap Anomaly E2E', () => {
  test('detects mid-word breaks, button wraps, orphan words, and crushed columns', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=text-breaks');

    const inspector = new LayoutInspector(page);
    const audit = await inspector.audit();

    expect(audit.textFlowIssues.length).toBeGreaterThan(0);

    // 1. Check mid-word break
    const midWordIssue = audit.textFlowIssues.find(i => i.anomalyType === 'mid-word-break');
    expect(midWordIssue).toBeDefined();
    expect(midWordIssue?.suggestedFix).toContain('word-break');

    // 2. Check broken multi-line button
    const buttonIssue = audit.textFlowIssues.find(i => i.anomalyType === 'broken-multiline-button');
    expect(buttonIssue).toBeDefined();
    expect(buttonIssue?.suggestedFix).toContain('white-space: nowrap');

    // 3. Check orphan wrap on heading
    const orphanIssue = audit.textFlowIssues.find(i => i.anomalyType === 'orphan-wrap');
    expect(orphanIssue).toBeDefined();
    expect(orphanIssue?.suggestedFix).toContain('text-wrap');

    // 4. Check crushed flex column
    const crushedIssue = audit.textFlowIssues.find(i => i.anomalyType === 'crushed-flex-column');
    expect(crushedIssue).toBeDefined();
    expect(crushedIssue?.suggestedFix).toContain('flex: 1 1 0');
  });

  test('custom matcher toHaveCleanTextFlow fails on text-breaks and passes on clean layout', async ({ page }) => {
    await page.goto('http://localhost:5173/?scenario=text-breaks');
    await expect(expect(page).toHaveCleanTextFlow()).rejects.toThrow();

    await page.goto('http://localhost:5173/?scenario=clean');
    await expect(page).toHaveCleanTextFlow();
  });
});
