# Playwright Layout Inspector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust, TypeScript-first Playwright layout & UX measurement library (`playwright-layout-inspector`) in `/containers/dev/playwright-layout-inspector` that audits DOM geometry, horizontal overflow/bleeding, layout shifts, pinch/zoom viewport readiness, and touch targets across mobile (e.g. Samsung Galaxy S25+) and desktop environments, complete with an interactive HTML reporter, CLI, Playwright matchers, and CI. Then test and verify mobile UX on `nelkop21webprint`, diagnosing and fixing the label canvas bleeding and drawer shifting issues.

**Architecture:** A modular DOM evaluation engine injected into Playwright browser contexts that measures geometric bounding boxes, computed styles, layout shifts, viewport constraints, and touch ergonomics, exposed via a fluent TypeScript `LayoutInspector` API, custom Playwright assertions (`expect(page)...`), an interactive standalone visual HTML report generator, and a CLI.

**Tech Stack:** TypeScript, Vite, Rollup/tsup, Vitest, Playwright, TailwindCSS/Vanilla for reporter, GitHub Actions CI.

## Global Constraints
- Target directory for tool: `/containers/dev/playwright-layout-inspector`
- Standalone Git repository with clean commits, README, LICENSE (MIT), and GitHub Actions CI workflow (`.github/workflows/ci.yml`).
- Complete test suite: Vitest for pure math/geometry/scoring algorithms, Playwright for browser e2e testing.
- Target Nelko repo to test & fix: `/containers/nelkop21webprint/frontend`
- Mobile device target for verification: Samsung Galaxy S25+ (412x915, DPR 3.0) and standard mobile viewports (375px - 412px).

---

### Task 1: Initialize `playwright-layout-inspector` Project Scaffolding
**Files:**
- Create: `/containers/dev/playwright-layout-inspector/package.json`
- Create: `/containers/dev/playwright-layout-inspector/tsconfig.json`
- Create: `/containers/dev/playwright-layout-inspector/tsup.config.ts`
- Create: `/containers/dev/playwright-layout-inspector/vitest.config.ts`
- Create: `/containers/dev/playwright-layout-inspector/playwright.config.ts`
- Create: `/containers/dev/playwright-layout-inspector/.gitignore`
- Create: `/containers/dev/playwright-layout-inspector/LICENSE`

**Interfaces:**
- Consumes: Node.js, npm, TypeScript, tsup, Vitest, Playwright
- Produces: Project build pipeline for ESM (`dist/index.mjs`), CJS (`dist/index.cjs`), and TypeScript declarations (`dist/index.d.ts`).

- [ ] **Step 1: Create directory and package.json with dependencies**
- [ ] **Step 2: Create TypeScript, tsup, vitest, and playwright configuration files**
- [ ] **Step 3: Run `npm install` and verify build setup**
- [ ] **Step 4: Initialize git repository and make initial commit**

---

### Task 2: Implement Core Geometry, Overflow, Viewport, and Shift Analyzers
**Files:**
- Create: `src/types/index.ts`
- Create: `src/core/devices.ts`
- Create: `src/core/overflow.ts`
- Create: `src/core/layoutShift.ts`
- Create: `src/core/viewportFit.ts`
- Create: `src/core/touchTargets.ts`
- Create: `src/core/readability.ts`
- Create: `src/core/score.ts`
- Create: `src/core/browserScript.ts`
- Test: `tests/unit/overflow.test.ts`
- Test: `tests/unit/layoutShift.test.ts`
- Test: `tests/unit/score.test.ts`
- Test: `tests/unit/devices.test.ts`

**Interfaces:**
- Consumes: DOM APIs (evaluated in browser context)
- Produces: `LayoutAuditResult`, `OverflowIssue`, `LayoutShiftResult`, `TouchTargetIssue`, `ViewportFitResult`, `UXScore`

- [ ] **Step 1: Write types and device definitions**
- [ ] **Step 2: Write unit tests for geometry calculations, displacement formulas, and scoring algorithms**
- [ ] **Step 3: Implement overflow detector, layout shift tracker, viewport fit auditor, touch target validator, and UX scorer**
- [ ] **Step 4: Implement browser script aggregator for in-page evaluation**
- [ ] **Step 5: Run Vitest tests and ensure all tests pass**

---

### Task 3: Implement Playwright Wrapper, Matchers, and Standalone HTML Reporter
**Files:**
- Create: `src/playwright/inspector.ts`
- Create: `src/playwright/matchers.ts`
- Create: `src/reporter/htmlReporter.ts`
- Create: `src/cli/cli.ts`
- Create: `src/index.ts`
- Test: `tests/unit/htmlReporter.test.ts`

**Interfaces:**
- Consumes: Core analyzers, Playwright `Page`
- Produces: `LayoutInspector` class, `expect(page).toHaveNoLayoutOverflow()`, `generateHtmlReport()`

- [ ] **Step 1: Implement `LayoutInspector` class wrapping Playwright `Page`**
- [ ] **Step 2: Implement custom Playwright matchers (`expect(page)...`)**
- [ ] **Step 3: Implement modern, interactive HTML report generator with visual bounding boxes, shift visualizer, and issue triage**
- [ ] **Step 4: Implement CLI runner (`playwright-layout-inspector audit <url>`)**
- [ ] **Step 5: Export all public APIs in `src/index.ts` and verify build with `npm run build`**

---

### Task 4: Create Interactive Demo Test Suite and Playwright E2E Tests
**Files:**
- Create: `demo/index.html`
- Create: `demo/src/main.ts`
- Create: `demo/src/style.css`
- Create: `tests/e2e/inspector.spec.ts`
- Create: `tests/e2e/matchers.spec.ts`
- Create: `tests/e2e/deviceScenarios.spec.ts`

**Interfaces:**
- Consumes: `playwright-layout-inspector` package, Playwright test runner
- Produces: Verified E2E test suite running against real browser pages testing overflow, shift, touch targets, and responsiveness.

- [ ] **Step 1: Create interactive demo application with intentional UX edge cases (bleeding canvas, variable drawer shifts, small touch targets, responsive layouts)**
- [ ] **Step 2: Write Playwright E2E tests validating detection of each UX failure case and passing on optimized layouts**
- [ ] **Step 3: Run `npx playwright test` and verify 100% test pass rate**

---

### Task 5: Test and Diagnose Nelko Web Print Mobile UX
**Files:**
- Create: `tests/e2e/nelkoWebprint.spec.ts` (in `playwright-layout-inspector`)
- Analyze: `/containers/nelkop21webprint/frontend/src/components/CanvasWorkspace.tsx`
- Analyze: `/containers/nelkop21webprint/frontend/src/hooks/useTouchZoom.ts`
- Analyze: `/containers/nelkop21webprint/frontend/src/App.tsx`

**Interfaces:**
- Consumes: Nelko Web Print frontend (running on Vite dev server)
- Produces: Baseline diagnostic report identifying:
  1. Label canvas 600px width bleeding off Samsung Galaxy S25+ (412px viewport).
  2. Touch event interception preventing pinch-to-zoom outside canvas boundaries.
  3. Canvas jumping and layout shift when switching mobile tabs / opening drawers with differing heights.

- [ ] **Step 1: Create Playwright test targeting Nelko Web Print mobile layout (Samsung Galaxy S25+)**
- [ ] **Step 2: Start Nelko frontend and run `playwright-layout-inspector` audit**
- [ ] **Step 3: Capture audit results and HTML diagnostic report showing precise layout shifts and overflow culprits**

---

### Task 6: Implement Mobile UX Fixes in Nelko Web Print Frontend
**Files:**
- Modify: `/containers/nelkop21webprint/frontend/src/components/CanvasWorkspace.tsx`
- Modify: `/containers/nelkop21webprint/frontend/src/hooks/useTouchZoom.ts`
- Modify: `/containers/nelkop21webprint/frontend/src/App.tsx`
- Modify: `/containers/nelkop21webprint/frontend/src/components/SidebarContent.tsx` (if needed for drawer stability)

**Interfaces:**
- Consumes: Responsive viewport dimensions, touch gestures
- Produces:
  1. Responsive initial zoom scaling (fits label comfortably within mobile viewport width without bleeding).
  2. Full-workspace touch gesture handling for smooth pinch-to-zoom and pan.
  3. Stable layout positioning preventing jarring canvas jumps when drawer/tabs open or change height.

- [ ] **Step 1: Update `useTouchZoom` to support viewport-aware auto-fit scaling, min/max clamping, and full-container gesture tracking**
- [ ] **Step 2: Update `CanvasWorkspace.tsx` to handle gestures gracefully, clamp canvas overflow, and provide visual zoom indicator**
- [ ] **Step 3: Stabilize mobile drawer layout in `App.tsx` and `CanvasWorkspace.tsx` to prevent canvas vertical jumping**
- [ ] **Step 4: Re-run Nelko frontend tests (`npm run test`) to ensure zero regressions**

---

### Task 7: Re-run Audit & Verify Nelko Web Print with `playwright-layout-inspector`
**Files:**
- Run: `tests/e2e/nelkoWebprint.spec.ts`

- [ ] **Step 1: Run `playwright-layout-inspector` against updated Nelko Web Print on Samsung Galaxy S25+**
- [ ] **Step 2: Verify zero horizontal overflow, stable canvas positioning across drawer toggles, and working touch zoom**
- [ ] **Step 3: Generate post-fix visual audit report confirming UX score improvement (100 / Grade A)**

---

### Task 8: Complete Public Repository Assets (Documentation, CI, GitHub Workflows)
**Files:**
- Create: `/containers/dev/playwright-layout-inspector/README.md`
- Create: `/containers/dev/playwright-layout-inspector/.github/workflows/ci.yml`
- Create: `/containers/dev/playwright-layout-inspector/examples/basic-audit.ts`
- Create: `/containers/dev/playwright-layout-inspector/examples/custom-matchers.spec.ts`

- [ ] **Step 1: Write comprehensive `README.md` with features, installation, API documentation, Playwright recipes, device presets, and HTML reporter screenshots/diagrams**
- [ ] **Step 2: Create GitHub Actions CI workflow (`.github/workflows/ci.yml`)**
- [ ] **Step 3: Create example scripts**
- [ ] **Step 4: Final build and test verification (`npm run build && npm test && npx playwright test`)**
- [ ] **Step 5: Git commit and summarize deliverables**
