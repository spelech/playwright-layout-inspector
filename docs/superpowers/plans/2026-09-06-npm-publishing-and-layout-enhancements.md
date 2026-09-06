# NPM Publishing Readiness & Layout Inspection Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform `@spelech/playwright-layout-inspector` into an officially published NPM package by modularizing source files under 500 lines, implementing sticky element occlusion, flex/grid blowout detection, responsive matrix auditing, Playwright test fixtures (`test.extend`), rich terminal matcher failure diagnostics, and a GitHub Actions NPM release pipeline.

**Architecture:** Decompose monolithic modules (`src/core/browserScript.ts` and `src/playwright/inspector.ts`) into specialized single-responsibility units under `src/core/browser/` and `src/playwright/`. Add standalone analyzers for sticky occlusion and flexbox blowout with composite score updates. Introduce a Playwright fixture wrapper and ANSI terminal formatters for failure output. Wire `publishConfig` and `.github/workflows/publish.yml` with provenance and tag triggers.

**Tech Stack:** TypeScript 5.7, Playwright 1.50, tsup 8, Vitest 2.1, Node.js 22/24.

## Global Constraints

- Every source file in `src/` MUST be strictly under 500 lines (target: 100–350 lines).
- Package name: `@spelech/playwright-layout-inspector` with `"publishConfig": { "access": "public" }`.
- Zero broken existing tests: all 39 unit tests and existing e2e tests must pass.
- No `TBD` or placeholders.

---

### Task 1: Repository Hygiene & Packaging Scaffolding

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`
- Delete: `playwright-layout-inspector-1.0.0.tgz`
- Modify: `tsup.config.ts`

**Interfaces:**
- Consumes: Existing build configuration
- Produces: Updated `@spelech/playwright-layout-inspector` package config with `./fixture` export, metadata, and prepublish safety scripts.

- [ ] **Step 1: Update `.gitignore` and delete committed `.tgz` and generated test files**
Add `*.tgz`, `audit.json`, and `layout-audit-report.html` to `.gitignore`. Remove `playwright-layout-inspector-1.0.0.tgz` from git tracking.

- [ ] **Step 2: Update `package.json` with scoped name, metadata, publishConfig, and prepublish script**
Set:
- `"name": "@spelech/playwright-layout-inspector"`
- `"publishConfig": { "access": "public" }`
- `"repository": { "type": "git", "url": "git+https://github.com/spelech/playwright-layout-inspector.git" }`
- `"homepage": "https://github.com/spelech/playwright-layout-inspector#readme"`
- `"bugs": { "url": "https://github.com/spelech/playwright-layout-inspector/issues" }`
- `"engines": { "node": ">=20.0.0" }`
- Add `"./fixture"` to `"exports"`:
  ```json
  "./fixture": {
    "types": "./dist/fixture.d.ts",
    "import": "./dist/fixture.mjs",
    "require": "./dist/fixture.js"
  }
  ```
- Add `"prepublishOnly": "npm run typecheck && npm test && npm run build"` to `"scripts"`.

- [ ] **Step 3: Update `tsup.config.ts` to include `fixture: 'src/playwright/fixture.ts'`**
Add the `fixture` entry point so it compiles to ESM/CJS/DTS in `dist/`.

- [ ] **Step 4: Commit Task 1 changes**
```bash
git add package.json .gitignore tsup.config.ts
git rm -f playwright-layout-inspector-1.0.0.tgz
git commit -m "chore: configure @spelech scoped package, prepublish hooks, and clean repo hygiene"
```

---

### Task 2: Modularize Browser Script (`src/core/browser/`)

**Files:**
- Create: `src/core/browser/selectorGenerator.ts`
- Create: `src/core/browser/colorUtils.ts`
- Create: `src/core/browser/textTraverser.ts`
- Create: `src/core/browser/containerScanner.ts`
- Modify: `src/core/browserScript.ts`
- Test: `tests/unit/browserModularization.test.ts`

**Interfaces:**
- Consumes: DOM Node / Element in page context
- Produces:
  - `generateUniqueSelector(el: Element): string`
  - `getEffectiveBackgroundColor(el: Element): { r: number; g: number; b: number; a: number }`
  - `calculateLuminance(r: number, g: number, b: number): number`
  - `calculateContrastRatio(l1: number, l2: number): number`
  - `scanContainerOverflows(root: Element | Document): ContainerOverflowData[]`
  - `scanTextFlow(root: Element | Document): TextFlowData[]`

- [ ] **Step 1: Write unit tests for browser module logic**
Create `tests/unit/browserModularization.test.ts` testing luminance, contrast ratio calculation, and selector generator edge cases.

- [ ] **Step 2: Run test to verify failure**
Run: `npx vitest run tests/unit/browserModularization.test.ts` (Expected: FAIL because modules do not exist yet).

- [ ] **Step 3: Implement `src/core/browser/selectorGenerator.ts` (< 120 lines)**
Extract canonical selector generation with ID, unique classes, and `:nth-of-type` fallback.

- [ ] **Step 4: Implement `src/core/browser/colorUtils.ts` (< 160 lines)**
Extract RGB/RGBA parsing, alpha compositing across ancestor elements, and relative luminance calculations.

- [ ] **Step 5: Implement `src/core/browser/textTraverser.ts` (< 180 lines)**
Extract text node iteration, line break analysis, hyphenation detection, and word wrap analysis.

- [ ] **Step 6: Implement `src/core/browser/containerScanner.ts` (< 180 lines)**
Extract container overflow boundary checks and inner scroll box computation.

- [ ] **Step 7: Refactor `src/core/browserScript.ts` (< 200 lines)**
Import the new modular helpers into `browserScript.ts` and bundle `collectInPageAuditScript`.

- [ ] **Step 8: Run unit tests and e2e tests to ensure zero regressions**
Run: `npm test && npx playwright test tests/e2e/containerOverflow.spec.ts`
Verify all pass.

- [ ] **Step 9: Commit Task 2 changes**
```bash
git add src/core/browser/ src/core/browserScript.ts tests/unit/browserModularization.test.ts
git commit -m "refactor(core): modularize browser script into focused submodules under 200 lines"
```

---

### Task 3: Sticky & Fixed Element Occlusion Engine

**Files:**
- Create: `src/core/stickyOcclusion.ts`
- Create: `src/core/browser/stickyScanner.ts`
- Modify: `src/types/index.ts`
- Modify: `src/core/browserScript.ts`
- Test: `tests/unit/stickyOcclusion.test.ts`
- Test: `tests/e2e/stickyOcclusion.spec.ts`

**Interfaces:**
- Consumes: `InPageAuditData.stickyElements` and `InPageAuditData.elements`
- Produces: `evaluateStickyOcclusion(stickyElements, interactiveElements): StickyOcclusionIssue[]`

- [ ] **Step 1: Define `StickyOcclusionIssue` in `src/types/index.ts`**
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

- [ ] **Step 2: Write unit test in `tests/unit/stickyOcclusion.test.ts`**
Test cases:
1. Fixed header overlapping a CTA button generates a `critical` issue.
2. Sticky footer overlapping a paragraph text generates a `serious` issue.
3. Element with zero opacity or `display: none` produces no issue.

- [ ] **Step 3: Run unit test to verify failure**
Run: `npx vitest run tests/unit/stickyOcclusion.test.ts` (Expected: FAIL)

- [ ] **Step 4: Implement `src/core/browser/stickyScanner.ts` (< 120 lines)**
Scan for elements where `getComputedStyle(el).position` is `fixed` or `sticky`, record bounding boxes and z-index.

- [ ] **Step 5: Implement `src/core/stickyOcclusion.ts` (< 130 lines)**
Calculate intersection rectangles between sticky/fixed elements and underlying interactive/text elements. Generate actionable remediation suggestions (`scroll-padding-top`, `padding-bottom`, `z-index`).

- [ ] **Step 6: Write e2e test in `tests/e2e/stickyOcclusion.spec.ts`**
Launch page with a fixed header (`position: fixed; top: 0; height: 60px; z-index: 100`) covering an `<input type="text">` or button. Verify `evaluateStickyOcclusion` catches it.

- [ ] **Step 7: Run unit and e2e tests**
Run: `npx vitest run tests/unit/stickyOcclusion.test.ts && npx playwright test tests/e2e/stickyOcclusion.spec.ts`
Expected: PASS.

- [ ] **Step 8: Commit Task 3 changes**
```bash
git add src/core/stickyOcclusion.ts src/core/browser/stickyScanner.ts src/types/index.ts src/core/browserScript.ts tests/unit/stickyOcclusion.test.ts tests/e2e/stickyOcclusion.spec.ts
git commit -m "feat(core): add sticky and fixed element occlusion detection engine"
```

---

### Task 4: Flexbox & Grid Blowout Engine

**Files:**
- Create: `src/core/flexBlowout.ts`
- Modify: `src/core/browser/containerScanner.ts`
- Modify: `src/types/index.ts`
- Test: `tests/unit/flexBlowout.test.ts`
- Test: `tests/e2e/flexBlowout.spec.ts`

**Interfaces:**
- Consumes: Flex/Grid container geometry and computed styles
- Produces: `evaluateFlexBlowout(inPageData): FlexBlowoutIssue[]`

- [ ] **Step 1: Define `FlexBlowoutIssue` in `src/types/index.ts`**
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

- [ ] **Step 2: Write unit test in `tests/unit/flexBlowout.test.ts`**
Test cases:
1. Flex child with `min-width: auto` and wide text overflowing parent returns `critical` blowout issue.
2. Flex child with `min-width: 0` and `overflow: hidden; text-overflow: ellipsis` returns no issue.

- [ ] **Step 3: Run unit test to verify failure**
Run: `npx vitest run tests/unit/flexBlowout.test.ts` (Expected: FAIL)

- [ ] **Step 4: Implement `src/core/flexBlowout.ts` (< 150 lines)**
Identify flex/grid children whose `scrollWidth > clientWidth` or rect extends beyond parent inner box when `minWidth === 'auto'` or `flexShrink === '0'`. Generate CSS remediation suggestions.

- [ ] **Step 5: Write e2e test in `tests/e2e/flexBlowout.spec.ts`**
Render a flex container `display: flex; width: 300px;` containing an unconstrained child with long text. Assert blowout detection.

- [ ] **Step 6: Run tests to verify pass**
Run: `npx vitest run tests/unit/flexBlowout.test.ts && npx playwright test tests/e2e/flexBlowout.spec.ts`
Expected: PASS.

- [ ] **Step 7: Commit Task 4 changes**
```bash
git add src/core/flexBlowout.ts src/core/browser/containerScanner.ts src/types/index.ts tests/unit/flexBlowout.test.ts tests/e2e/flexBlowout.spec.ts
git commit -m "feat(core): add flexbox and grid blowout detection engine"
```

---

### Task 5: UX Composite Score Engine Update

**Files:**
- Modify: `src/core/score.ts`
- Modify: `src/types/index.ts`
- Modify: `tests/unit/score.test.ts`

**Interfaces:**
- Consumes: `LayoutAuditIssues` including `stickyOcclusionIssues` and `flexBlowoutIssues`
- Produces: Updated composite `UXScore` with balanced penalty deductions

- [ ] **Step 1: Write test case in `tests/unit/score.test.ts` for sticky & flex blowout deductions**
Assert that critical sticky occlusion issues deduct 12 points and flex blowout issues deduct 10 points, bounded by maximum category caps.

- [ ] **Step 2: Run test to verify failure**
Run: `npx vitest run tests/unit/score.test.ts` (Expected: FAIL)

- [ ] **Step 3: Update `src/core/score.ts` (< 250 lines)**
Incorporate `stickyOcclusion` (max deduction: 20 pts) and `flexBlowout` (max deduction: 15 pts) into the composite penalty calculation and score breakdown.

- [ ] **Step 4: Run unit tests to verify pass**
Run: `npx vitest run tests/unit/score.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit Task 5 changes**
```bash
git add src/core/score.ts src/types/index.ts tests/unit/score.test.ts
git commit -m "feat(score): incorporate sticky occlusion and flex blowout into UX composite scoring"
```

---

### Task 6: Playwright Inspector Modularization & Matrix Runner

**Files:**
- Create: `src/playwright/screenshotAnnotator.ts`
- Create: `src/playwright/matrixRunner.ts`
- Modify: `src/playwright/inspector.ts` (bring from 533 lines down to < 250 lines)
- Test: `tests/e2e/matrixAudit.spec.ts`

**Interfaces:**
- Consumes: Playwright `Page`, `LayoutAuditOptions`, and `DevicePreset[]`
- Produces:
  - `annotateScreenshot(page, issues)` in `screenshotAnnotator.ts`
  - `runResponsiveMatrixAudit(inspector, options)` in `matrixRunner.ts`
  - Refactored `LayoutInspector` class (< 250 lines)

- [ ] **Step 1: Implement `src/playwright/screenshotAnnotator.ts` (< 150 lines)**
Extract screenshot capture and canvas overlay logic for bounding boxes and issue badges.

- [ ] **Step 2: Implement `src/playwright/matrixRunner.ts` (< 160 lines)**
Implement multi-device viewport switching, running audits sequentially across presets, and synthesizing `ResponsiveMatrixAuditResult`.

- [ ] **Step 3: Refactor `src/playwright/inspector.ts` (< 250 lines)**
Wire `audit()`, `auditMatrix()`, `generateReport()`, and delegate screenshot annotation and matrix execution.

- [ ] **Step 4: Write e2e test `tests/e2e/matrixAudit.spec.ts`**
Test `inspector.auditMatrix({ devices: [s25, ipad, desktop] })` verifying all 3 viewports run and produce aggregated scores.

- [ ] **Step 5: Run tests**
Run: `npx playwright test tests/e2e/matrixAudit.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit Task 6 changes**
```bash
git add src/playwright/screenshotAnnotator.ts src/playwright/matrixRunner.ts src/playwright/inspector.ts tests/e2e/matrixAudit.spec.ts
git commit -m "refactor(playwright): modularize inspector under 250 lines and implement matrix runner"
```

---

### Task 7: Rich Matcher Terminal Diagnostics & New Matchers

**Files:**
- Create: `src/playwright/matcherFormatters.ts`
- Modify: `src/playwright/matchers.ts` (bring down to < 300 lines)
- Test: `tests/unit/matcherFormatters.test.ts`
- Test: `tests/e2e/matchers.spec.ts`

**Interfaces:**
- Consumes: Audit issues and thresholds
- Produces:
  - `formatAuditFailureMessage(auditResult, options): string`
  - `formatOverflowFailureMessage(issues, url): string`
  - `expect(page).toHaveNoStickyOcclusion()`
  - `expect(page).toHaveNoFlexBlowout()`

- [ ] **Step 1: Write unit tests in `tests/unit/matcherFormatters.test.ts`**
Test formatting helper produces ANSI-colored visual summary banners, issue counts, and remedy recommendations.

- [ ] **Step 2: Run test to verify failure**
Run: `npx vitest run tests/unit/matcherFormatters.test.ts` (Expected: FAIL)

- [ ] **Step 3: Implement `src/playwright/matcherFormatters.ts` (< 180 lines)**
Build clean ANSI-colored terminal summaries with category breakdown, culprit selectors, computed box geometry, and clickable report links.

- [ ] **Step 4: Update `src/playwright/matchers.ts` (< 300 lines)**
Add `toHaveNoStickyOcclusion` and `toHaveNoFlexBlowout`, and update existing matchers to use `matcherFormatters`.

- [ ] **Step 5: Run unit and e2e matcher tests**
Run: `npx vitest run tests/unit/matcherFormatters.test.ts && npx playwright test tests/e2e/matchers.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit Task 7 changes**
```bash
git add src/playwright/matcherFormatters.ts src/playwright/matchers.ts tests/unit/matcherFormatters.test.ts tests/e2e/matchers.spec.ts
git commit -m "feat(matchers): add rich terminal diagnostics, toHaveNoStickyOcclusion, and toHaveNoFlexBlowout"
```

---

### Task 8: Playwright Test Fixture (`test.extend`)

**Files:**
- Create: `src/playwright/fixture.ts`
- Modify: `src/index.ts`
- Test: `tests/e2e/fixture.spec.ts`

**Interfaces:**
- Consumes: Playwright `test` and `expect`
- Produces: `test` fixture with pre-injected `layoutInspector: LayoutInspector` and auto-registered matchers.

- [ ] **Step 1: Implement `src/playwright/fixture.ts` (< 60 lines)**
```typescript
import { test as baseTest, expect as baseExpect } from '@playwright/test';
import { LayoutInspector } from './inspector';
import './matchers';

export interface LayoutInspectorFixtures {
  layoutInspector: LayoutInspector;
}

export const test = baseTest.extend<LayoutInspectorFixtures>({
  layoutInspector: async ({ page }, use) => {
    const inspector = new LayoutInspector(page);
    await use(inspector);
  }
});

export const expect = baseExpect;
```

- [ ] **Step 2: Write e2e test `tests/e2e/fixture.spec.ts`**
Write a Playwright test using `import { test, expect } from '../../src/playwright/fixture';` asserting `layoutInspector` is injected and ready.

- [ ] **Step 3: Run e2e test**
Run: `npx playwright test tests/e2e/fixture.spec.ts`
Expected: PASS.

- [ ] **Step 4: Commit Task 8 changes**
```bash
git add src/playwright/fixture.ts src/index.ts tests/e2e/fixture.spec.ts
git commit -m "feat(fixture): export zero-boilerplate test.extend fixture"
```

---

### Task 9: GitHub Actions Release Workflow & Documentation

**Files:**
- Create: `.github/workflows/publish.yml`
- Modify: `README.md`

**Interfaces:**
- Consumes: Git tag push `v*.*.*` or `workflow_dispatch`
- Produces: Automated build, test, and npm publication with provenance using `NPM_TOKEN`.

- [ ] **Step 1: Create `.github/workflows/publish.yml`**
Configure workflow with:
- Triggers on `push: tags: ['v*.*.*']` and `workflow_dispatch`.
- Steps: Checkout, Setup Node 22 with npm registry url, `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, `npm publish --provenance --access public` using secret `NPM_TOKEN`.

- [ ] **Step 2: Update `README.md`**
Update installation to `npm install -D @spelech/playwright-layout-inspector`, document the new Playwright fixture (`import { test, expect } from '@spelech/playwright-layout-inspector/fixture'`), document new matchers, and document `inspector.auditMatrix()`.

- [ ] **Step 3: Commit Task 9 changes**
```bash
git add .github/workflows/publish.yml README.md
git commit -m "ci: add GitHub Actions publish workflow and update documentation"
```

---

### Task 10: Complete Verification & Packaging Dry-Run

**Files:**
- All files across the repo

- [ ] **Step 1: Verify all source files are under 500 lines**
Run: `wc -l src/**/*.ts src/*.ts` and verify maximum line length across all files is < 500.

- [ ] **Step 2: Run full unit test suite**
Run: `npm test`
Verify all unit test files pass.

- [ ] **Step 3: Run full Playwright E2E suite**
Run: `npm run test:e2e`
Verify all E2E specs pass.

- [ ] **Step 4: Run typecheck and production build**
Run: `npm run typecheck && npm run build`
Verify clean compilation without errors.

- [ ] **Step 5: Verify npm pack dry-run**
Run: `npm pack --dry-run`
Inspect the package tarball output to verify included files (`dist`, `README.md`, `LICENSE`) and verify tarball size is lean and does not contain test reports or `.tgz`.

- [ ] **Step 6: Commit any final polish and push to main**
```bash
git status
git commit -m "chore: finalize release readiness verification"
```
