import { expect as baseExpect, Page } from '@playwright/test';
import { LayoutInspector } from './inspector';
import { LayoutAuditOptions } from '../types';
import {
  formatAuditFailureMessage,
  formatOverflowFailureMessage,
  formatStickyOcclusionFailureMessage,
  formatFlexBlowoutFailureMessage
} from './matcherFormatters';

export const customMatchers = {
  /**
   * Asserts that no element on the page overflows or bleeds past viewport or parent container boundaries.
   */
  async toHaveNoLayoutOverflow(page: Page, options?: LayoutAuditOptions) {
    const inspector = new LayoutInspector(page, options);
    const audit = await inspector.audit({
      checkTouchTargets: false,
      checkReadability: false,
      checkOcclusion: false,
      ...options
    });

    const hasViewportOverflow = audit.overflowIssues.length > 0 || audit.viewportFit.contentBleeds;
    const hasContainerOverflow = audit.containerOverflowIssues.length > 0;
    const pass = !hasViewportOverflow && !hasContainerOverflow;

    const message = () => {
      if (pass) {
        return `Expected page to have layout overflow issues, but none were detected (Page width: ${audit.viewport.width}px, Scroll width: ${audit.viewport.scrollWidth}px).`;
      }
      return formatOverflowFailureMessage(audit.overflowIssues, audit.containerOverflowIssues);
    };

    return {
      pass,
      message,
      name: 'toHaveNoLayoutOverflow'
    };
  },

  /**
   * Asserts that no child element bleeds beyond its parent visual container's inner content/padding boundary.
   */
  async toHaveNoContainerOverflow(page: Page, options?: LayoutAuditOptions) {
    const inspector = new LayoutInspector(page, options);
    const audit = await inspector.audit({
      checkTouchTargets: false,
      checkReadability: false,
      checkOcclusion: false,
      ...options
    });

    const pass = audit.containerOverflowIssues.length === 0;
    const message = () => {
      if (pass) {
        return `Expected page to have container overflow issues, but all elements were cleanly contained.`;
      }
      const issueSummary = audit.containerOverflowIssues
        .map(i => `  - Child ${i.selector} overflows container ${i.containerSelector} by +${Math.round(i.overflowRightPx || i.overflowBottomPx || i.overflowLeftPx)}px (fix: ${i.suggestedFix})`)
        .join('\n');
      return `Expected no child elements to overflow their parent containers, but found ${audit.containerOverflowIssues.length} container overflow issue(s):\n${issueSummary}`;
    };

    return {
      pass,
      message,
      name: 'toHaveNoContainerOverflow'
    };
  },

  /**
   * Asserts that text flows cleanly without awkward mid-word breaks, ragged orphan wraps on buttons/headings, or crushed flex columns.
   */
  async toHaveCleanTextFlow(page: Page, options?: LayoutAuditOptions) {
    const inspector = new LayoutInspector(page, options);
    const audit = await inspector.audit({
      checkTouchTargets: false,
      checkOcclusion: false,
      checkCollisions: false,
      ...options
    });

    const pass = audit.textFlowIssues.length === 0;
    const message = () => {
      if (pass) {
        return `Expected text flow issues, but all text wrapped cleanly without mid-word breaks or orphan wraps.`;
      }
      const issueSummary = audit.textFlowIssues
        .map(i => `  - [${i.anomalyType}] ${i.selector}: ${i.details} (fix: ${i.suggestedFix})`)
        .join('\n');
      return `Expected clean text flow, but found ${audit.textFlowIssues.length} text flow & wrap anomaly issue(s):\n${issueSummary}`;
    };

    return {
      pass,
      message,
      name: 'toHaveCleanTextFlow'
    };
  },

  /**
   * Asserts that the page properly fits mobile viewport constraints and has valid mobile viewport meta.
   */
  async toHaveMobileFit(page: Page, options?: LayoutAuditOptions) {
    const inspector = new LayoutInspector(page, options);
    const audit = await inspector.audit(options);

    const fit = audit.viewportFit;
    const pass = fit.isMobileOptimized && !fit.contentBleeds && fit.allowsUserZoom;

    const message = () => {
      if (pass) {
        return `Expected page to fail mobile fit check, but mobile fit was compliant.`;
      }
      return `Expected page to comply with mobile responsive fit standards, but encountered issues:\n${fit.issues.map(i => `  - ${i}`).join('\n')}`;
    };

    return {
      pass,
      message,
      name: 'toHaveMobileFit'
    };
  },

  /**
   * Asserts that all interactive touch targets meet the minimum size requirement (default 24px for AA, 44px for AAA).
   */
  async toHaveTouchFriendlyTargets(page: Page, options?: { minSize?: number }) {
    const inspector = new LayoutInspector(page);
    const audit = await inspector.audit({ minTouchTargetSize: options?.minSize || 24 });

    const pass = audit.touchTargetIssues.length === 0;
    const message = () => {
      if (pass) {
        return `Expected page to have touch target sizing issues, but all interactive elements met requirements.`;
      }
      const issueSummary = audit.touchTargetIssues
        .map(i => `  - ${i.selector} (${Math.round(i.width)}x${Math.round(i.height)}px < ${i.minRequiredSize}px)`)
        .join('\n');
      return `Expected all touch targets to be at least ${options?.minSize || 24}px, but found ${audit.touchTargetIssues.length} undersized target(s):\n${issueSummary}`;
    };

    return {
      pass,
      message,
      name: 'toHaveTouchFriendlyTargets'
    };
  },

  /**
   * Asserts that no interactive actions are occluded or tap-jacked by floating/sticky layers.
   */
  async toHaveNoOccludedActions(page: Page, options?: LayoutAuditOptions) {
    const inspector = new LayoutInspector(page, options);
    const audit = await inspector.audit({ checkOcclusion: true, ...options });

    const pass = audit.occlusionIssues.length === 0;
    const message = () => {
      if (pass) {
        return `Expected page to have occluded interactive elements, but all buttons/inputs were accessible.`;
      }
      const issueSummary = audit.occlusionIssues
        .map(i => `  - ${i.selector} (occluded by: ${i.occludedBySelector}, ratio: ${Math.round(i.occludedAreaRatio * 100)}%)`)
        .join('\n');
      return `Expected all interactive elements to be clickable, but found ${audit.occlusionIssues.length} occluded action(s):\n${issueSummary}`;
    };

    return {
      pass,
      message,
      name: 'toHaveNoOccludedActions'
    };
  },

  /**
   * Asserts that no sibling elements or text labels collide with overlapping coordinates.
   */
  async toHaveNoElementCollisions(page: Page, options?: LayoutAuditOptions) {
    const inspector = new LayoutInspector(page, options);
    const audit = await inspector.audit({ checkCollisions: true, ...options });

    const pass = audit.collisionIssues.length === 0;
    const message = () => {
      if (pass) {
        return `Expected page to have element collisions, but none were detected.`;
      }
      const issueSummary = audit.collisionIssues
        .map(i => `  - ${i.selectorA} collides with ${i.selectorB} (overlap: ${Math.round(i.overlapAreaPx)}px²)`)
        .join('\n');
      return `Expected no element collisions, but found ${audit.collisionIssues.length} colliding pair(s):\n${issueSummary}`;
    };

    return {
      pass,
      message,
      name: 'toHaveNoElementCollisions'
    };
  },

  /**
   * Asserts that no nested containers trap scrolling on mobile viewports.
   */
  async toHaveNoNestedScrollTraps(page: Page, options?: LayoutAuditOptions) {
    const inspector = new LayoutInspector(page, options);
    const audit = await inspector.audit({ checkScrollTraps: true, ...options });

    const criticalTraps = audit.scrollTrapIssues.filter(t => t.isTrapRisk);
    const pass = criticalTraps.length === 0;
    const message = () => {
      if (pass) {
        return `Expected page to have nested scroll traps, but none were detected.`;
      }
      const issueSummary = criticalTraps
        .map(i => `  - ${i.selector} (${i.suggestion})`)
        .join('\n');
      return `Expected no nested scroll traps, but found ${criticalTraps.length} trapping container(s):\n${issueSummary}`;
    };

    return {
      pass,
      message,
      name: 'toHaveNoNestedScrollTraps'
    };
  },

  /**
   * Asserts that all interactive buttons and inputs have accessible names (aria-label, title, or text).
   */
  async toHaveAccessibleInteractiveNames(page: Page, options?: LayoutAuditOptions) {
    const inspector = new LayoutInspector(page, options);
    const audit = await inspector.audit({ checkAccessibleNames: true, ...options });

    const pass = audit.accessibleNameIssues.length === 0;
    const message = () => {
      if (pass) {
        return `Expected interactive elements to be missing accessible names, but all were labeled.`;
      }
      const issueSummary = audit.accessibleNameIssues
        .map(i => `  - ${i.selector} (<${i.tagName}>, icon-only: ${i.isIconOnly})`)
        .join('\n');
      return `Expected all interactive buttons/links to have accessible names, but found ${audit.accessibleNameIssues.length} unlabeled element(s):\n${issueSummary}`;
    };

    return {
      pass,
      message,
      name: 'toHaveAccessibleInteractiveNames'
    };
  },

  /**
   * Asserts that page reflows cleanly without horizontal scrolling at 200% text zoom (WCAG 1.4.10).
   */
  async toPass200PercentZoomReflow(page: Page, zoomFactor = 2.0) {
    const inspector = new LayoutInspector(page);
    const reflow = await inspector.test200PercentZoomReflow(zoomFactor);

    const pass = reflow.passesReflow;
    const message = () => {
      if (pass) {
        return `Expected page to fail 200% zoom reflow, but page reflowed cleanly.`;
      }
      return `Page failed WCAG 1.4.10 Reflow at ${Math.round(zoomFactor * 100)}% zoom:\n${reflow.issues.map(i => `  - ${i}`).join('\n')}`;
    };

    return {
      pass,
      message,
      name: 'toPass200PercentZoomReflow'
    };
  },

  /**
   * Asserts that an asynchronous action does not introduce jarring layout shifts.
   */
  async toHaveAcceptableLayoutShift(
    page: Page,
    action: () => Promise<void>,
    options?: { maxAcceptableScore?: number; maxAcceptableDisplacement?: number }
  ) {
    const inspector = new LayoutInspector(page);
    const shiftResult = await inspector.trackShifts(action, options);

    const pass = shiftResult.isAcceptable;
    const message = () => {
      if (pass) {
        return `Expected layout shift to fail stability threshold, but layout remained stable (Score: ${shiftResult.totalShiftScore}).`;
      }
      return `Layout shift threshold exceeded!\n${shiftResult.summary}\n` +
        shiftResult.items.slice(0, 5).map(i => `  - ${i.selector}: Δx=${i.deltaX}px, Δy=${i.deltaY}px (Impact: ${i.impactScore})`).join('\n');
    };

    return {
      pass,
      message,
      name: 'toHaveAcceptableLayoutShift'
    };
  },

  /**
   * Asserts that no sticky or fixed elements occlude underlying interactive elements or headings.
   */
  async toHaveNoStickyOcclusion(page: Page, options?: LayoutAuditOptions) {
    const inspector = new LayoutInspector(page, options);
    const audit = await inspector.audit({
      checkTouchTargets: false,
      checkReadability: false,
      ...options
    });

    const issues = audit.stickyOcclusionIssues || [];
    const pass = issues.length === 0;
    const message = () => {
      if (pass) {
        return `Expected page to have sticky element occlusions, but none were detected.`;
      }
      return formatStickyOcclusionFailureMessage(issues);
    };

    return {
      pass,
      message,
      name: 'toHaveNoStickyOcclusion'
    };
  },

  /**
   * Asserts that no flexbox or grid child elements blowout their parent container boundaries.
   */
  async toHaveNoFlexBlowout(page: Page, options?: LayoutAuditOptions) {
    const inspector = new LayoutInspector(page, options);
    const audit = await inspector.audit({
      checkTouchTargets: false,
      checkReadability: false,
      ...options
    });

    const issues = audit.flexBlowoutIssues || [];
    const pass = issues.length === 0;
    const message = () => {
      if (pass) {
        return `Expected page to have flex blowout issues, but all elements fit within boundaries.`;
      }
      return formatFlexBlowoutFailureMessage(issues);
    };

    return {
      pass,
      message,
      name: 'toHaveNoFlexBlowout'
    };
  },

  /**
   * Asserts that overall UX score meets or exceeds a target minimum (default 80/100, Grade B/A).
   */
  async toPassLayoutAudit(page: Page, options?: LayoutAuditOptions & { minScore?: number }) {
    const minScore = options?.minScore ?? 80;
    const inspector = new LayoutInspector(page, options);
    const audit = await inspector.audit(options);

    const pass = audit.uxScore.totalScore >= minScore && audit.uxScore.passed;
    const message = () => {
      if (pass) {
        return `Expected layout audit score to be below ${minScore}, but scored ${audit.uxScore.totalScore} (Grade ${audit.uxScore.grade}).`;
      }
      return formatAuditFailureMessage(audit, minScore);
    };

    return {
      pass,
      message,
      name: 'toPassLayoutAudit'
    };
  }
};

// Register custom matchers with Playwright test
baseExpect.extend(customMatchers);

declare global {
  namespace PlaywrightTest {
    interface Matchers<R, T> {
      toHaveNoLayoutOverflow(options?: LayoutAuditOptions): Promise<R>;
      toHaveNoContainerOverflow(options?: LayoutAuditOptions): Promise<R>;
      toHaveNoStickyOcclusion(options?: LayoutAuditOptions): Promise<R>;
      toHaveNoFlexBlowout(options?: LayoutAuditOptions): Promise<R>;
      toHaveCleanTextFlow(options?: LayoutAuditOptions): Promise<R>;
      toHaveMobileFit(options?: LayoutAuditOptions): Promise<R>;
      toHaveTouchFriendlyTargets(options?: { minSize?: number }): Promise<R>;
      toHaveNoOccludedActions(options?: LayoutAuditOptions): Promise<R>;
      toHaveNoElementCollisions(options?: LayoutAuditOptions): Promise<R>;
      toHaveNoNestedScrollTraps(options?: LayoutAuditOptions): Promise<R>;
      toHaveAccessibleInteractiveNames(options?: LayoutAuditOptions): Promise<R>;
      toPass200PercentZoomReflow(zoomFactor?: number): Promise<R>;
      toHaveAcceptableLayoutShift(
        action: () => Promise<void>,
        options?: { maxAcceptableScore?: number; maxAcceptableDisplacement?: number }
      ): Promise<R>;
      toPassLayoutAudit(options?: LayoutAuditOptions & { minScore?: number }): Promise<R>;
    }
  }
}
