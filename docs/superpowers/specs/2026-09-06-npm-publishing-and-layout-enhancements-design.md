# Design Specification: NPM Publishing Readiness & Layout Inspection Enhancements

**Date**: 2026-09-06  
**Status**: Approved  
**Package Scope**: `@spelech/playwright-layout-inspector`

---

## 1. Overview & Objectives

This document specifies the architectural refactoring and feature enhancements for `@spelech/playwright-layout-inspector` to prepare it for official release to npm.

### Key Goals
1. **Source Modularization**: Refactor large files (`src/core/browserScript.ts` [824 lines], `src/playwright/inspector.ts` [533 lines]) so all files remain strictly under 300–400 lines (hard target: < 500 lines). Apply DRY patterns and modular decomposition.
2. **Advanced Layout Scenarios**:
   - **Sticky/Fixed Element Occlusion**: Identify fixed/sticky headers, banners, and floating buttons obscuring underlying text or interactive elements.
   - **Flexbox & Grid Blowout / Failed Truncation**: Detect flex and grid items expanding beyond boundaries due to `min-width: auto` / `flex-shrink: 0`, and unhandled text truncation.
   - **Responsive Breakpoint Matrix**: Audit across multiple viewports (`Samsung Galaxy S25+`, `iPad Air`, `Desktop 1080p`) in a single pass with aggregated reporting.
3. **Developer Ergonomics**:
   - **Playwright Test Fixtures (`test.extend`)**: Export `test` and `expect` from `@spelech/playwright-layout-inspector/fixture` with auto-registered matchers and pre-injected `layoutInspector`.
   - **Rich Terminal Matcher Diagnostics**: Colorized summary output with culprit selectors, bounding boxes, CSS fix recommendations, and direct file links to HTML reports on assertion failures.
   - **New Matchers**: `toHaveNoStickyOcclusion()` and `toHaveNoFlexBlowout()`.
4. **NPM Publishing Pipeline & Hygiene**:
   - Scoped package name `@spelech/playwright-layout-inspector` with `"publishConfig": { "access": "public" }`.
   - Complete package metadata (repository, bugs, homepage, engines).
   - Clean up repo artifacts (remove committed `.tgz`, ignore `*.tgz`, `audit.json`, `reports/`).
   - Add safe prepublish build script: `"prepublishOnly": "npm run typecheck && npm test && npm run build"`.
   - Configure automated GitHub Actions publish workflow (`.github/workflows/publish.yml`) triggered on tags `v*.*.*` and `workflow_dispatch`.

---

## 2. Architecture & File Modularization (< 500 Lines)

### 2.1 Refactoring `src/core/browserScript.ts` (824 lines -> modular components)
The browser evaluation script will be decomposed into dedicated modules under `src/core/browser/`:
- `src/core/browser/selectorGenerator.ts` (~80 lines): Canonical unique CSS selector generation (`div#app > header.nav:nth-of-type(1)`).
- `src/core/browser/colorUtils.ts` (~120 lines): RGB/RGBA parsing, relative luminance calculation, and hierarchical background alpha compositing.
- `src/core/browser/textTraverser.ts` (~120 lines): DOM text node walking, line count estimation, mid-word breaks, and orphan word detection.
- `src/core/browser/containerScanner.ts` (~160 lines): Scroll containers, modal inner bounds, and flex/grid blowout geometry extraction.
- `src/core/browser/stickyScanner.ts` (~110 lines): Geometry extraction for `position: fixed` and `position: sticky` elements and raycast target overlap checks.
- `src/core/browserScript.ts` (~180 lines): Slim coordinator bundling evaluation routines and returning `InPageAuditData`.

### 2.2 Refactoring `src/playwright/inspector.ts` (533 lines -> modular components)
Extract specialized responsibilities:
- `src/playwright/screenshotAnnotator.ts` (~120 lines): Screenshot capture, DOM element bounding box overlays, and base64 injection into reports.
- `src/playwright/matrixRunner.ts` (~140 lines): Viewport switching orchestration, multi-device matrix iteration, and aggregate result synthesis.
- `src/playwright/inspector.ts` (~220 lines): Core class orchestrating the audit lifecycle, calling modules, and returning `LayoutAuditResult`.

### 2.3 Developer Ergonomics Decomposition
- `src/playwright/matcherFormatters.ts` (~150 lines): ANSI/terminal styling, failure summary formatting, and HTML report path linking.
- `src/playwright/fixture.ts` (~60 lines): `test.extend` fixture implementation exporting `{ test, expect }`.
- `src/playwright/matchers.ts` (~250 lines): Custom Playwright matcher definitions using `matcherFormatters`.

---

## 3. Advanced Layout Engines

### 3.1 Sticky & Fixed Element Occlusion (`src/core/stickyOcclusion.ts`)
* **Types**:
  ```typescript
  export interface StickyOcclusionIssue {
    stickySelector: string;
    stickyTagName: string;
    positionType: 'fixed' | 'sticky';
    occludedSelector: string;
    occludedTagName: string;
    isInteractive: boolean;
    overlapRect: BoundingBox;
    severity: 'critical' | 'serious' | 'minor';
    suggestion: string;
  }
  ```
* **Evaluation**:
  - Filter visible elements where computed `position` is `fixed` or `sticky`.
  - Check for overlap against underlying interactive targets (`button`, `a`, `input`, `select`) and major textual elements (`h1`–`h6`).
  - Ignore backdrop overlays with transparent click listeners or intentional modal layers.
  - Severity: `critical` if interactive element is covered; `serious` if heading or primary text is covered.

### 3.2 Flexbox & Grid Blowout (`src/core/flexBlowout.ts`)
* **Types**:
  ```typescript
  export interface FlexBlowoutIssue {
    selector: string;
    tagName: string;
    parentSelector: string;
    layoutType: 'flex' | 'grid';
    childWidth: number;
    parentWidth: number;
    overflowPx: number;
    severity: 'critical' | 'serious';
    suggestion: string;
  }
  ```
* **Evaluation**:
  - Detect children within `display: flex` or `display: grid` containers whose rect exceeds the parent inner box or whose `scrollWidth > clientWidth`.
  - Check computed styles: `min-width: auto`, `flex-shrink: 0`, and absence of `text-overflow: ellipsis` / `overflow: hidden`.
  - Provide CSS remediation suggestions (e.g. `Set min-width: 0 and overflow: hidden on the flex child to permit shrinking and text truncation`).

### 3.3 Responsive Breakpoint Matrix (`src/playwright/matrixRunner.ts`)
* **Types**:
  ```typescript
  export interface ResponsiveMatrixAuditResult {
    devices: DevicePreset[];
    results: Record<string, LayoutAuditResult>;
    overallScore: number;
    deviceScores: Record<string, number>;
    matrixSummary: {
      globalIssues: Array<{ type: string; selector: string; count: number }>;
      breakpointSpecificIssues: Array<{ device: string; type: string; selector: string }>;
    };
  }
  ```
* **API**:
  `inspector.auditMatrix(options?: MatrixAuditOptions): Promise<ResponsiveMatrixAuditResult>`

---

## 4. UX Score Calculation Update

Update `src/core/score.ts` composite scoring to include:
- `stickyOcclusion`: -12 pts per critical issue, -6 per serious issue (max deduction: 20 pts).
- `flexBlowout`: -10 pts per critical issue, -5 per serious issue (max deduction: 15 pts).
- Preserve 100-point ceiling and baseline grading scale (A+ to F).

---

## 5. Playwright Matchers & Fixture API

* **Matcher Definitions**:
  - `toHaveNoStickyOcclusion()`
  - `toHaveNoFlexBlowout()`
  - `toHaveNoLayoutOverflow()` (updated with rich formatting)
  - `toPassLayoutAudit({ minScore?: number })` (updated with rich formatting)
* **Fixture Export**:
  ```typescript
  import { test, expect } from '@spelech/playwright-layout-inspector/fixture';
  ```

---

## 6. NPM Packaging & GitHub Actions Release Pipeline

### 6.1 `package.json`
- `"name": "@spelech/playwright-layout-inspector"`
- `"publishConfig": { "access": "public" }`
- `"exports"` includes `.`, `./matchers`, and `./fixture`.
- `"repository": { "type": "git", "url": "git+https://github.com/spelech/playwright-layout-inspector.git" }`
- `"homepage": "https://github.com/spelech/playwright-layout-inspector#readme"`
- `"bugs": { "url": "https://github.com/spelech/playwright-layout-inspector/issues" }`
- `"engines": { "node": ">=20.0.0" }`
- `"scripts": { "prepublishOnly": "npm run typecheck && npm test && npm run build" }`

### 6.2 GitHub Actions Release (`.github/workflows/publish.yml`)
- Trigger: `push: tags: ['v*.*.*']` and `workflow_dispatch`.
- Steps:
  1. `actions/checkout@v4`
  2. `actions/setup-node@v4` with `node-version: 22` and `registry-url: 'https://registry.npmjs.org'`
  3. `npm ci`
  4. `npm run typecheck`
  5. `npm test`
  6. `npm run build`
  7. `npm publish --provenance --access public` with `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`.

---

## 7. Verification & Testing

1. **Unit Tests (Vitest)**:
   - `tests/unit/stickyOcclusion.test.ts`
   - `tests/unit/flexBlowout.test.ts`
   - `tests/unit/browserModularization.test.ts`
   - `tests/unit/matcherFormatters.test.ts`
   - Update `tests/unit/score.test.ts` for new penalties.
2. **E2E Tests (Playwright)**:
   - `tests/e2e/stickyOcclusion.spec.ts`
   - `tests/e2e/flexBlowout.spec.ts`
   - `tests/e2e/matrixAudit.spec.ts`
   - `tests/e2e/fixture.spec.ts`
3. **Build & Packing Verification**:
   - `npm run typecheck`
   - `npm test`
   - `npm run test:e2e`
   - `npm run build`
   - `npm pack --dry-run` to verify package payload.
