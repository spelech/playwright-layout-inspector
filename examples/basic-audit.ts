import { chromium } from 'playwright';
import { LayoutInspector, getDevicePreset } from '../src';

async function run() {
  const device = getDevicePreset('Samsung Galaxy S25+');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: device.width, height: device.height },
    deviceScaleFactor: device.deviceScaleFactor,
    isMobile: device.isMobile,
    hasTouch: device.hasTouch,
    userAgent: device.userAgent
  });

  const page = await context.newPage();
  await page.goto('https://example.com');

  const inspector = new LayoutInspector(page);
  const audit = await inspector.audit({
    device,
    includeScreenshot: true,
    highlightIssuesInScreenshot: true
  });

  console.log(`Audited ${audit.url} on ${device.name}:`);
  console.log(`UX Score: ${audit.uxScore.totalScore}/100 (Grade ${audit.uxScore.grade})`);
  console.log(`Overflow Issues: ${audit.overflowIssues.length}`);
  console.log(`Touch Target Issues: ${audit.touchTargetIssues.length}`);

  // Generate interactive HTML report
  await inspector.generateReport(audit, './reports/example-audit.html');
  console.log('Report saved to ./reports/example-audit.html');

  await browser.close();
}

run().catch(console.error);
