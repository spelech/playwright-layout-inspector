import { expect as baseExpect, Page } from '@playwright/test';
import { LayoutInspector } from './inspector';
import { LayoutAuditOptions } from '../types';

export const customMatchers = {
  /**
   * Asserts that no element on the page overflows or bleeds past the viewport boundaries.
   */
  async toHaveNoLayoutOverflow(page: Page, options?: LayoutAuditOptions) {
    const inspector = new LayoutInspector(page, options);
    const audit = await inspector.audit({ checkTouchTargets: false, checkReadability: false, checkOcclusion: false, ...options });

    const pass = audit.overflowIssues.length === 0 && !audit.viewportFit.contentBleeds;
    const message = () => {
      if (pass) {
        return `Expected page to have layout overflow issues, but none were detected (Page width: ${audit.viewport.width}px, Scroll width: ${audit.viewport.scrollWidth}px).`;
      }
      const issueSummary = audit.overflowIssues
        .map(i => `  - ${i.selector} (overflow right: +${Math.round(i.overflowRightPx)}px, fix: ${i.suggestedFix})`)
        .join('\n');
      return `Expected page to have NO layout overflow, but found ${audit.overflowIssues.length} overflowing element(s):\n${issueSummary}`;
    };

    return {
      pass,
      message,
      name: 'toHaveNoLayoutOverflow'
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
      return `Layout audit failed! Score: ${audit.uxScore.totalScore}/100 (Grade ${audit.uxScore.grade}, minimum required: ${minScore}).\n` +
        `  - Overflow & Fit: ${audit.uxScore.categories.overflowAndFit.score}/${audit.uxScore.categories.overflowAndFit.maxScore}\n` +
        `  - Stability: ${audit.uxScore.categories.stability.score}/${audit.uxScore.categories.stability.maxScore}\n` +
        `  - Touch Ergonomics: ${audit.uxScore.categories.touchErgonomics.score}/${audit.uxScore.categories.touchErgonomics.maxScore}\n` +
        `  - Readability: ${audit.uxScore.categories.readabilityAndVisibility.score}/${audit.uxScore.categories.readabilityAndVisibility.maxScore}`;
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
      toHaveMobileFit(options?: LayoutAuditOptions): Promise<R>;
      toHaveTouchFriendlyTargets(options?: { minSize?: number }): Promise<R>;
      toHaveAcceptableLayoutShift(
        action: () => Promise<void>,
        options?: { maxAcceptableScore?: number; maxAcceptableDisplacement?: number }
      ): Promise<R>;
      toPassLayoutAudit(options?: LayoutAuditOptions & { minScore?: number }): Promise<R>;
    }
  }
}
