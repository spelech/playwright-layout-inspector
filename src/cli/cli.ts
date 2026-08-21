#!/usr/bin/env node
import { chromium } from 'playwright';
import { LayoutInspector } from '../playwright/inspector';
import { getDevicePreset, DEVICE_PRESETS } from '../core/devices';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h' || command === 'help') {
    console.log(`
Playwright Layout Inspector CLI

Usage:
  playwright-layout-inspector audit <url> [options]
  playwright-layout-inspector list-devices

Options:
  --device, -d       Device preset name (default: "Samsung Galaxy S25+")
  --output, -o       HTML report output path (default: "./layout-audit-report.html")
  --json             JSON report output path
  --min-score, -s    Minimum UX score threshold to pass (default: 80)
  --no-screenshot    Disable screenshot capture in report
  --help, -h         Show help

Examples:
  playwright-layout-inspector audit http://localhost:5173 --device "Samsung Galaxy S25+"
  playwright-layout-inspector audit https://example.com --output ./reports/audit.html --min-score 85
`);
    process.exit(0);
  }

  if (command === 'list-devices') {
    console.log('\nAvailable Device Presets:');
    for (const [name, p] of Object.entries(DEVICE_PRESETS)) {
      console.log(`  - ${name.padEnd(22)} (${p.width}x${p.height}px, DPR: ${p.deviceScaleFactor}x, ${p.category})`);
    }
    console.log('');
    process.exit(0);
  }

  if (command === 'audit') {
    const url = args[1];
    if (!url) {
      console.error('Error: Missing target URL for audit.');
      process.exit(1);
    }

    let deviceName = 'Samsung Galaxy S25+';
    let outputPath = './layout-audit-report.html';
    let jsonPath: string | null = null;
    let minScore = 80;
    let includeScreenshot = true;

    for (let i = 2; i < args.length; i++) {
      if (args[i] === '--device' || args[i] === '-d') deviceName = args[++i];
      else if (args[i] === '--output' || args[i] === '-o') outputPath = args[++i];
      else if (args[i] === '--json') jsonPath = args[++i];
      else if (args[i] === '--min-score' || args[i] === '-s') minScore = parseFloat(args[++i]);
      else if (args[i] === '--no-screenshot') includeScreenshot = false;
    }

    const device = getDevicePreset(deviceName);
    console.log(`\n🚀 Auditing ${url} on [${device.name} - ${device.width}x${device.height}]...`);

    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        deviceScaleFactor: device.deviceScaleFactor,
        isMobile: device.isMobile,
        hasTouch: device.hasTouch,
        userAgent: device.userAgent
      });

      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(500);

      const inspector = new LayoutInspector(page);
      const audit = await inspector.audit({
        device,
        includeScreenshot,
        highlightIssuesInScreenshot: true
      });

      // Save HTML report
      await inspector.generateReport(audit, outputPath);
      console.log(`📄 HTML Report generated: ${path.resolve(outputPath)}`);

      if (jsonPath) {
        fs.writeFileSync(path.resolve(jsonPath), JSON.stringify(audit, null, 2), 'utf-8');
        console.log(`📊 JSON Report saved: ${path.resolve(jsonPath)}`);
      }

      // Print terminal summary
      const score = audit.uxScore;
      console.log('\n========================================');
      console.log(`UX Score: ${score.totalScore}/100 (Grade: ${score.grade}) — ${score.passed ? 'PASSED ✅' : 'FAILED ❌'}`);
      console.log('----------------------------------------');
      console.log(`  🌊 Overflow & Fit:  ${score.categories.overflowAndFit.score}/${score.categories.overflowAndFit.maxScore} (Issues: ${audit.overflowIssues.length})`);
      console.log(`  👆 Touch Targets:   ${score.categories.touchErgonomics.score}/${score.categories.touchErgonomics.maxScore} (Issues: ${audit.touchTargetIssues.length})`);
      console.log(`  👁️  Readability:     ${score.categories.readabilityAndVisibility.score}/${score.categories.readabilityAndVisibility.maxScore} (Issues: ${audit.readabilityIssues.length})`);
      console.log('========================================\n');

      if (audit.overflowIssues.length > 0) {
        console.log('🚨 Overflow Culprits:');
        for (const iss of audit.overflowIssues) {
          console.log(`  - ${iss.selector} (+${Math.round(iss.overflowRightPx)}px bleed)`);
          console.log(`    Fix: ${iss.suggestedFix}`);
        }
        console.log('');
      }

      if (score.totalScore < minScore || !score.passed) {
        console.error(`❌ Audit failed minimum score threshold of ${minScore}/100.`);
        process.exit(1);
      } else {
        console.log(`✨ All UX & layout standards passed successfully!`);
        process.exit(0);
      }
    } finally {
      await browser.close();
    }
  }

  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
