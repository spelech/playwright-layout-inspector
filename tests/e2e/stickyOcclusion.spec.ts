import { test, expect } from '@playwright/test';
import { collectInPageAuditScript } from '../../src/core/browserScript';
import { evaluateStickyOcclusion } from '../../src/core/stickyOcclusion';

test.describe('Sticky & Fixed Element Occlusion E2E', () => {
  test('detects sticky occlusion when fixed header overlaps input#username', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; }
            header {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              height: 60px;
              z-index: 100;
              background: #333;
            }
            #username {
              margin-top: 10px;
              display: block;
              width: 200px;
              height: 35px;
            }
          </style>
        </head>
        <body>
          <header id="fixed-nav">Fixed Header</header>
          <main>
            <input type="text" id="username" placeholder="Username">
          </main>
        </body>
      </html>
    `);

    const inPageData = await page.evaluate(collectInPageAuditScript, '{}');
    const issues = evaluateStickyOcclusion(inPageData.stickyOcclusions || []);

    expect(issues.length).toBeGreaterThanOrEqual(1);
    const usernameIssue = issues.find(issue => issue.occludedSelector.includes('username'));
    expect(usernameIssue).toBeDefined();
    expect(usernameIssue?.occludedTagName).toBe('input');
    expect(usernameIssue?.isInteractive).toBe(true);
    expect(usernameIssue?.severity).toBe('critical');
    expect(usernameIssue?.positionType).toBe('fixed');
    expect(usernameIssue?.suggestion).toContain('Fixed element');
    expect(usernameIssue?.suggestion).toContain('occludes interactive input #username');
  });

  test('asserts 0 sticky occlusion issues on clean layout with margin-top: 80px', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; }
            header {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              height: 60px;
              z-index: 100;
              background: #333;
            }
            #username {
              margin-top: 80px;
              display: block;
              width: 200px;
              height: 35px;
            }
          </style>
        </head>
        <body>
          <header id="fixed-nav">Fixed Header</header>
          <main>
            <input type="text" id="username" placeholder="Username">
          </main>
        </body>
      </html>
    `);

    const inPageData = await page.evaluate(collectInPageAuditScript, '{}');
    const issues = evaluateStickyOcclusion(inPageData.stickyOcclusions || []);

    expect(issues).toHaveLength(0);
  });
});
