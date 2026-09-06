# 📐 Playwright Layout Inspector

[![CI](https://github.com/spelech/playwright-layout-inspector/actions/workflows/ci.yml/badge.svg)](https://github.com/spelech/playwright-layout-inspector/actions)
[![Publish](https://github.com/spelech/playwright-layout-inspector/actions/workflows/publish.yml/badge.svg)](https://github.com/spelech/playwright-layout-inspector/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.50+-green.svg)](https://playwright.dev/)

> **Comprehensive DOM layout and visual UX measurement tooling for Playwright.**
> Audit viewport bleeding, layout stability, jarring layout shifts, pinch-to-zoom readiness, sticky element occlusions, flex blowouts, and touch ergonomics across mobile (e.g. Samsung Galaxy S25+) and desktop viewports.

---

## 🌟 Why Playwright Layout Inspector?

Traditional visual regression tools (like Pixelmatch or screenshot diffing) compare pixel buffers, but they fail to explain **why** a layout broke:
- *Why is there an unwanted horizontal scrollbar on mobile screens?*
- *Which exact CSS rule (`width: 600px`, unconstrained `transform: scale(1.5)`, or `min-width`) caused the canvas to bleed past the edge?*
- *Did an expanding drawer or accordion cause a jarring 300px visual jump for the user?*
- *Did a fixed navbar or floating banner occlude an interactive button or input element?*
- *Did an unconstrained flex child (`min-width: auto`) cause a flex container blowout?*
- *Are mobile touch targets too small (< 24px/44px) or too close together for human thumbs?*
- *Is pinch-to-zoom locked by an inaccessible viewport meta tag?*

**Playwright Layout Inspector** extracts live DOM geometry, computes bounding boxes, analyzes layout displacement deltas, validates WCAG 2.2 accessibility rules, and generates actionable reports with an automated **UX Score (0–100)** and letter grade (A+ to F).

---

## ✨ Features

- 🌊 **Horizontal Overflow & Bleed Detection**: Pinpoints the exact element hierarchy causing unwanted horizontal scrolling, with computed style diffs and remediation recommendations.
- 📌 **Sticky & Fixed Layer Occlusion**: Detects when headers, footers, or floating overlays tap-jack or obscure interactive inputs, action buttons, and text flow (`expect(page).toHaveNoStickyOcclusion()`).
- 📐 **Flexbox & Grid Blowout Detection**: Uncovers unconstrained children (`min-width: auto`, `flex-shrink: 0`) causing runaway horizontal growth and container blowouts (`expect(page).toHaveNoFlexBlowout()`).
- ⚖️ **Layout Shift & Stability Tracker**: Measures element displacement vectors ($\Delta x, \Delta y$), Euclidean jump distance, and Web Vitals–inspired impact scores across state changes (e.g., drawer toggling, tab switches, dynamic loading).
- 👆 **Touch Target Ergonomics (WCAG 2.2)**: Audits interactive elements (`button`, `a`, `input`, custom clickable items) against 24px (AA), 44px (AAA), and 48px (Mobile) standards with adjacent touch collision detection.
- 🔍 **Viewport & Pinch-Zoom Readiness**: Audits `<meta name="viewport">` compliance (`width=device-width`, `initial-scale`, `user-scalable`), ensuring mobile users can freely pinch and zoom.
- 📱 **Multi-Viewport Matrix Audits**: Run tests across mobile, tablet, and desktop viewports in one call with `inspector.auditMatrix()` to surface breakpoint-specific bugs.
- 📱 **Built-in Device Presets**: Ready-to-use profiles for Samsung Galaxy S25+ (412x915), Samsung Galaxy S25 (384x832), iPhone 16 Pro, iPhone SE, Pixel 9 Pro, iPad, and Desktop 1080p/1440p.
- 📊 **Standalone Interactive HTML Reporter**: Dark-mode dashboard with circular score gauge, category breakdowns, embedded screenshots with visual bounding box overlays, and issue drill-downs.
- 🧪 **Zero-Boilerplate Test Fixture & Matchers**: Seamless `test` fixture with pre-injected inspector and rich assertions like `toHaveNoLayoutOverflow()`, `toHaveNoStickyOcclusion()`, `toHaveNoFlexBlowout()`, and `toPassLayoutAudit()`.
- 💻 **Standalone CLI**: Run audits against any live URL from your terminal or CI pipeline.

---

## 📦 Installation

```bash
npm install -D @spelech/playwright-layout-inspector @playwright/test
```

---

## 🚀 Quick Start

### 1. Zero-Boilerplate Test Fixture (`test.extend`)

The fastest way to get started is with the pre-configured test fixture, which provides an injected `layoutInspector` instance and automatically loads all custom Playwright assertions:

```typescript
import { test, expect } from '@spelech/playwright-layout-inspector/fixture';

test('audit layout compliance', async ({ page, layoutInspector }) => {
  await page.goto('https://myapp.com');
  await expect(page).toHaveNoLayoutOverflow();
  await expect(page).toHaveNoStickyOcclusion();
  await expect(page).toHaveNoFlexBlowout();
  await expect(page).toPassLayoutAudit({ minScore: 85 });
});
```

### 2. Using Custom Playwright Matchers Standalone

Alternatively, import the custom matchers into existing standard Playwright tests:

```typescript
import { test, expect } from '@playwright/test';
import '@spelech/playwright-layout-inspector/matchers';

test('verify mobile layout compliance on Samsung Galaxy S25+', async ({ page }) => {
  await page.goto('https://myapp.com');

  // 1. Assert zero horizontal overflow / canvas bleed
  await expect(page).toHaveNoLayoutOverflow();

  // 2. Assert sticky / fixed headers and footers do not occlude interactive elements
  await expect(page).toHaveNoStickyOcclusion();

  // 3. Assert flexbox and grid children do not blow out containers
  await expect(page).toHaveNoFlexBlowout();

  // 4. Assert mobile viewport & zoom compliance
  await expect(page).toHaveMobileFit();

  // 5. Assert touch targets meet WCAG standards (≥ 24px)
  await expect(page).toHaveTouchFriendlyTargets({ minSize: 24 });

  // 6. Assert composite UX score is at least 85/100 (Grade A)
  await expect(page).toPassLayoutAudit({ minScore: 85 });
});
```

### 3. Measuring Layout Shifts across Actions

Catch jarring layout jumps when drawers, modals, or accordions open:

```typescript
test('drawer toggle does not cause jarring canvas shift', async ({ page }) => {
  await page.goto('https://myapp.com');

  // Tracks element positions before and after the action
  await expect(page).toHaveAcceptableLayoutShift(
    async () => {
      await page.click('#toggle-drawer-button');
    },
    { maxAcceptableScore: 0.05, maxAcceptableDisplacement: 20 }
  );
});
```

### 4. Multi-Viewport Matrix Audit (`inspector.auditMatrix()`)

Audit your application across multiple device viewports simultaneously in a single call, aggregating UX scores and identifying breakpoint-specific anomalies:

```typescript
import { test } from '@playwright/test';
import { LayoutInspector, getDevicePreset } from '@spelech/playwright-layout-inspector';

test('audit responsive layout matrix across devices', async ({ page }) => {
  await page.goto('https://myapp.com');

  const inspector = new LayoutInspector(page);
  const matrixResult = await inspector.auditMatrix({
    devices: [
      getDevicePreset('Samsung Galaxy S25+'),
      getDevicePreset('iPhone 16 Pro'),
      getDevicePreset('iPad Air'),
      getDevicePreset('Desktop 1080p'),
    ],
  });

  console.log(`Overall Matrix UX Score: ${matrixResult.overallScore}/100`);
  for (const [device, score] of Object.entries(matrixResult.deviceScores)) {
    console.log(`  ${device}: ${score}/100`);
  }

  // Inspect breakpoint-specific issues
  for (const issue of matrixResult.matrixSummary.breakpointSpecificIssues) {
    console.warn(`[${issue.device}] ${issue.type} on ${issue.selector}`);
  }
});
```

### 5. Using the Fluent `LayoutInspector` API & Generating Reports

```typescript
import { test } from '@playwright/test';
import { LayoutInspector, getDevicePreset } from '@spelech/playwright-layout-inspector';

test('generate comprehensive UX audit report', async ({ page }) => {
  const s25plus = getDevicePreset('Samsung Galaxy S25+');
  await page.goto('https://myapp.com');

  const inspector = new LayoutInspector(page);
  const audit = await inspector.audit({
    device: s25plus,
    includeScreenshot: true,
    highlightIssuesInScreenshot: true,
  });

  console.log(`UX Score: ${audit.uxScore.totalScore}/100 (Grade ${audit.uxScore.grade})`);

  // Generate interactive HTML report
  await inspector.generateReport(audit, './playwright-report/layout-audit.html');
});
```

---

## 🛠️ Standalone CLI Usage

Run audits directly from the terminal against any local or staging URL:

```bash
# Audit on Samsung Galaxy S25+ (default)
npx @spelech/playwright-layout-inspector audit http://localhost:3000

# Audit on iPhone 16 Pro and output HTML + JSON reports
npx @spelech/playwright-layout-inspector audit https://myapp.com \
  --device "iPhone 16 Pro" \
  --output ./reports/mobile-audit.html \
  --json ./reports/mobile-audit.json \
  --min-score 85

# List all available device presets
npx @spelech/playwright-layout-inspector list-devices
```

---

## 📱 Supported Device Presets

| Device Preset | Viewport (CSS px) | Device Pixel Ratio | Type |
| :--- | :--- | :--- | :--- |
| **Samsung Galaxy S25+** | 412 × 915 | 3.0x | Mobile |
| **Samsung Galaxy S25** | 384 × 832 | 3.0x | Mobile |
| **iPhone 16 Pro** | 393 × 852 | 3.0x | Mobile |
| **iPhone 16** | 393 × 852 | 3.0x | Mobile |
| **iPhone SE** | 375 × 667 | 2.0x | Mobile |
| **Google Pixel 9 Pro** | 412 × 915 | 2.625x | Mobile |
| **iPad Air** | 820 × 1180 | 2.0x | Tablet |
| **Desktop 1080p** | 1920 × 1080 | 1.0x | Desktop |
| **Desktop 1440p** | 1440 × 900 | 2.0x | Desktop |

---

## 🔬 Real-World Case Study: Nelko Web Print Studio

During validation on the **Nelko P21 Web Print Studio** frontend:

1. **Initial Audit Findings (Samsung Galaxy S25+ — 412×915 viewport)**:
   - 🚨 **Canvas Viewport Bleed**: Hardcoded zoom of `1.5x` scaled the 400px canvas to 600px width, bleeding past the screen edge by 188px.
   - 🚨 **Jarring Drawer Jumps**: Switching drawer tabs (`Canvas` → `Add` → `Inspector`) produced a jarring 388px vertical canvas jump due to fluctuating drawer heights (Impact Score: 0.4446).
   - 🚨 **Touch Gestures Trapped**: Gesture listeners were attached only to the inner canvas element rather than the workspace container.
   - 📊 **Initial UX Score**: **38/100 (Grade F)**.

2. **Remediation & Fixes Applied**:
   - Implemented viewport-aware responsive auto-fit scaling (`scale = Math.min(1.0, (viewportWidth - 32) / canvasWidth)`).
   - Promoted touch gesture handling to the full workspace container with smooth pinch-to-zoom clamping and floating zoom pill controls.
   - Stabilized drawer sheets with consistent height (`h-[45vh] max-h-[380px]`) and top-anchored workspace positioning.

3. **Post-Fix Audit Results**:
   - ✅ **0 Overflow / Bleed Issues**.
   - ✅ **0 Displacement & 0 Jarring Layout Shifts**.
   - ✅ **100% WCAG 2.2 Compliant Touch Targets**.
   - 📊 **Post-Fix UX Score**: **92/100 (Grade A, Passed)**.

---

## 🏗️ Architecture

```
@spelech/playwright-layout-inspector/
├── src/
│   ├── core/
│   │   ├── browser/          # Modular in-page DOM collectors (<200 lines each)
│   │   ├── devices.ts        # Device presets & viewport database
│   │   ├── overflow.ts       # Viewport boundary & bleed analyzer
│   │   ├── containerOverflow.ts # Child container boundary validator
│   │   ├── stickyOcclusion.ts # Sticky & fixed element occlusion detector
│   │   ├── flexBlowout.ts    # Flexbox & grid blowout analyzer
│   │   ├── layoutShift.ts    # Stability & displacement delta engine
│   │   ├── viewportFit.ts    # Meta viewport & scaling validator
│   │   ├── touchTargets.ts   # WCAG 2.2 touch target & spacing auditor
│   │   ├── readability.ts    # Text legibility & truncation checker
│   │   ├── textFlow.ts       # Awkward line breaks & orphan wraps
│   │   ├── score.ts          # Composite 0-100 UX scoring algorithm
│   │   └── browserScript.ts  # Script injection orchestrator
│   ├── playwright/
│   │   ├── fixture.ts        # Zero-boilerplate test.extend fixture
│   │   ├── inspector.ts      # Main LayoutInspector Playwright wrapper
│   │   ├── matchers.ts       # Custom expect(page) Playwright assertions
│   │   ├── matcherFormatters.ts # Rich ANSI terminal failure formatters
│   │   ├── matrixRunner.ts   # Multi-viewport responsive audit matrix
│   │   └── screenshotAnnotator.ts # Canvas bounding box visual overlays
│   ├── reporter/
│   │   └── htmlReporter.ts   # Standalone dark-mode HTML report generator
│   ├── cli/
│   │   └── cli.ts            # Standalone CLI binary
│   └── index.ts              # Public library exports
├── demo/                     # Interactive test harness playground
├── tests/
│   ├── unit/                 # Vitest unit tests for geometry & scoring
│   └── e2e/                  # Playwright E2E scenario test matrix
└── .github/workflows/
    ├── ci.yml                # GitHub Actions CI matrix pipeline
    └── publish.yml           # Automated NPM release workflow
```

---

## 🤝 Contributing & License

Contributions are welcome! Please open an issue or pull request.

MIT License © 2026 Steven T. Pelech
