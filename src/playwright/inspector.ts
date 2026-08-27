import type { Page } from '@playwright/test';
import {
  AccessibleNameIssue,
  BoundingBox,
  ColorContrastIssue,
  DevicePreset,
  ElementCollisionIssue,
  ElementComputedStyles,
  FocusIndicatorIssue,
  LayoutAuditOptions,
  LayoutAuditResult,
  LayoutShiftResult,
  OcclusionIssue,
  OverflowIssue,
  ReadabilityIssue,
  ScrollTrapIssue,
  ThumbZoneAnalysis,
  TouchTargetIssue,
  ViewportFitResult,
  ZoomReflowResult
} from '../types';
import { getDevicePreset } from '../core/devices';
import { calculateOverflow, generateOverflowRemediation } from '../core/overflow';
import { computeElementDisplacement, evaluateLayoutShift, ElementSnapshot } from '../core/layoutShift';
import { evaluateViewportFit } from '../core/viewportFit';
import { evaluateTouchTarget } from '../core/touchTargets';
import { evaluateTextReadability } from '../core/readability';
import { evaluateColorContrast } from '../core/contrast';
import { evaluateElementOcclusion } from '../core/occlusion';
import { evaluateElementCollisions } from '../core/collisions';
import { evaluateScrollTrap } from '../core/scrollTraps';
import { evaluateAccessibleName, evaluateFocusIndicator } from '../core/accessibility';
import { evaluateThumbZoneErgonomics } from '../core/ergonomics';
import { evaluateZoomReflow } from '../core/zoomReflow';
import { computeUXScore } from '../core/score';
import { collectInPageAuditScript } from '../core/browserScript';
import { generateHtmlReport } from '../reporter/htmlReporter';
import * as fs from 'fs';
import * as path from 'path';

export class LayoutInspector {
  private page: Page;
  private defaultOptions: LayoutAuditOptions;

  constructor(page: Page, defaultOptions: LayoutAuditOptions = {}) {
    this.page = page;
    this.defaultOptions = defaultOptions;
  }

  /**
   * Run a comprehensive UX & layout audit on the current page state.
   */
  async audit(options: LayoutAuditOptions = {}): Promise<LayoutAuditResult> {
    const startTime = Date.now();
    const mergedOptions: LayoutAuditOptions = {
      checkTouchTargets: true,
      checkOverflow: true,
      checkViewportFit: true,
      checkReadability: true,
      checkContrast: true,
      checkOcclusion: true,
      checkCollisions: true,
      checkScrollTraps: true,
      checkAccessibleNames: true,
      checkFocusIndicators: true,
      checkThumbZones: true,
      minTouchTargetSize: 24,
      minFontSizePx: 12,
      includeScreenshot: true,
      highlightIssuesInScreenshot: true,
      ...this.defaultOptions,
      ...options
    };

    // Inject in-page audit collector
    const inPageData = await this.page.evaluate(
      collectInPageAuditScript,
      JSON.stringify({ ignoreSelectors: mergedOptions.ignoreSelectors || [] })
    );

    const viewport = inPageData.viewport;
    const url = this.page.url();
    const isMobile = viewport.width < 768;

    // 1. Viewport Fit Evaluation
    const viewportFit: ViewportFitResult = evaluateViewportFit(viewport.metaViewport, viewport);

    // 2. Overflow Issues Evaluation
    const overflowIssues: OverflowIssue[] = [];
    if (mergedOptions.checkOverflow !== false) {
      for (const el of inPageData.elements) {
        const over = calculateOverflow(el.rect, viewport);
        if (over.hasOverflow) {
          const remediation = generateOverflowRemediation({
            tagName: el.tagName,
            selector: el.selector,
            boundingBox: el.rect,
            viewport,
            styles: el.computedStyles,
            overflowRightPx: over.overflowRightPx
          });

          overflowIssues.push({
            selector: el.selector,
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            boundingBox: el.rect,
            viewport,
            overflowRightPx: over.overflowRightPx,
            overflowBottomPx: over.overflowBottomPx,
            overflowLeftPx: over.overflowLeftPx,
            computedStyles: el.computedStyles,
            culpritDescription: remediation.culpritDescription,
            suggestedFix: remediation.suggestedFix,
            severity: over.overflowRightPx > 10 ? 'critical' : 'warning'
          });
        }
      }
    }

    // 3. Touch Targets Evaluation
    const touchTargetIssues: TouchTargetIssue[] = [];
    const interactiveElements = inPageData.elements.filter(e => e.isInteractive);
    if (mergedOptions.checkTouchTargets !== false) {
      const allTargets = interactiveElements.map(e => ({ selector: e.selector, boundingBox: e.rect }));

      for (const el of interactiveElements) {
        const issue = evaluateTouchTarget(
          {
            selector: el.selector,
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            text: el.textSnippet,
            boundingBox: el.rect
          },
          allTargets,
          { minTargetSize: mergedOptions.minTouchTargetSize }
        );
        if (issue) {
          touchTargetIssues.push(issue);
        }
      }
    }

    // 4. Readability Issues Evaluation
    const readabilityIssues: ReadabilityIssue[] = [];
    if (mergedOptions.checkReadability !== false) {
      for (const el of inPageData.elements) {
        if (!el.textSnippet || el.textSnippet.length === 0) continue;
        const fontSizePx = parseFloat(el.computedStyles.fontSize) || 16;
        const lineHeightPx = parseFloat(el.computedStyles.lineHeight) || undefined;

        const issue = evaluateTextReadability(
          {
            selector: el.selector,
            text: el.textSnippet,
            fontSizePx,
            lineHeightPx,
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            textOverflow: el.computedStyles.overflow,
            overflow: el.computedStyles.overflow
          },
          isMobile,
          mergedOptions.minFontSizePx
        );
        if (issue) {
          readabilityIssues.push(issue);
        }
      }
    }

    // 4b. WCAG 2.1 AA Color Contrast Evaluation
    const contrastIssues: ColorContrastIssue[] = [];
    if (mergedOptions.checkContrast !== false) {
      for (const el of inPageData.elements) {
        if (!el.hasDirectText) continue;
        if (!el.textSnippet || el.textSnippet.trim().length === 0) continue;
        const fontSizePx = parseFloat(el.computedStyles.fontSize) || 16;
        const color = el.computedStyles.color || 'rgb(0, 0, 0)';
        const backgroundColor = el.computedStyles.backgroundColor || 'rgb(255, 255, 255)';
        const fontWeight = el.computedStyles.fontWeight || '400';

        const issue = evaluateColorContrast(
          {
            selector: el.selector,
            tagName: el.tagName,
            textSnippet: el.textSnippet,
            color,
            backgroundColor,
            fontSizePx,
            fontWeight
          },
          { minRatio: mergedOptions.minContrastRatio }
        );
        if (issue) {
          contrastIssues.push(issue);
        }
      }
    }

    // 5. Multi-Point Occlusion Issues
    const occlusionIssues: OcclusionIssue[] = [];
    if (mergedOptions.checkOcclusion !== false) {
      for (const occ of inPageData.occlusions) {
        const target = inPageData.elements.find(e => e.selector === occ.selector);
        if (target) {
          const issue = evaluateElementOcclusion(
            {
              selector: target.selector,
              tagName: target.tagName,
              boundingBox: target.rect,
              isInteractive: target.isInteractive
            },
            occ.raycastResults
          );
          if (issue) {
            occlusionIssues.push(issue);
          }
        }
      }
    }

    // 6. Element & Text 2D Collisions
    let collisionIssues: ElementCollisionIssue[] = [];
    if (mergedOptions.checkCollisions !== false) {
      collisionIssues = evaluateElementCollisions(
        inPageData.elements.map(e => ({
          selector: e.selector,
          tagName: e.tagName,
          textSnippet: e.textSnippet,
          rect: e.rect,
          isInteractive: e.isInteractive,
          isTextOnly: e.isTextOnly,
          ancestors: e.ancestors
        }))
      );
    }

    // 7. Nested Scroll Traps
    const scrollTrapIssues: ScrollTrapIssue[] = [];
    if (mergedOptions.checkScrollTraps !== false) {
      for (const el of inPageData.elements) {
        const trap = evaluateScrollTrap(
          {
            selector: el.selector,
            tagName: el.tagName,
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            overflowY: el.computedStyles.overflowY,
            overflowX: el.computedStyles.overflowX
          },
          viewport
        );
        if (trap) {
          scrollTrapIssues.push(trap);
        }
      }
    }

    // 8. Accessible Interactive Names
    const accessibleNameIssues: AccessibleNameIssue[] = [];
    if (mergedOptions.checkAccessibleNames !== false) {
      for (const el of inPageData.elements) {
        const issue = evaluateAccessibleName({
          selector: el.selector,
          tagName: el.tagName,
          role: el.role,
          ariaLabel: el.ariaLabel,
          ariaLabelledBy: el.ariaLabelledBy,
          title: el.title,
          innerText: el.textSnippet,
          hasSvgOrImgChild: el.hasSvgOrImgChild
        });
        if (issue) {
          accessibleNameIssues.push(issue);
        }
      }
    }

    // 9. Focus Ring Visibility — programmatically focus each element and measure computed style
    const focusIndicatorIssues: FocusIndicatorIssue[] = [];
    if (mergedOptions.checkFocusIndicators !== false) {
      for (const el of interactiveElements) {
        // Use Playwright to focus the element and read computed focus style at that moment.
        // This correctly handles :focus-visible, :focus, and CSS class-based focus rings.
        const focusData = await this.page.evaluate((selector: string) => {
          const el = document.querySelector(selector) as HTMLElement | null;
          if (!el) return null;
          el.focus({ preventScroll: true });
          const comp = window.getComputedStyle(el);
          const result = {
            outlineWidth: comp.outlineWidth,
            outlineStyle: comp.outlineStyle,
            outlineColor: comp.outlineColor,
            boxShadow: comp.boxShadow
          };
          el.blur();
          return result;
        }, el.selector);

        if (!focusData) continue;

        const issue = evaluateFocusIndicator({
          selector: el.selector,
          tagName: el.tagName,
          outlineWidth: focusData.outlineWidth || '0px',
          outlineStyle: focusData.outlineStyle || 'none',
          outlineColor: focusData.outlineColor || 'transparent',
          boxShadow: focusData.boxShadow || 'none',
          isFocused: true
        });
        if (issue) {
          focusIndicatorIssues.push(issue);
        }
      }
    }

    // 10. Mobile Thumb-Zone Ergonomics
    let thumbZoneAnalysis: ThumbZoneAnalysis | undefined;
    if (mergedOptions.checkThumbZones !== false) {
      thumbZoneAnalysis = evaluateThumbZoneErgonomics(
        interactiveElements.map(e => ({
          selector: e.selector,
          textSnippet: e.textSnippet,
          rect: e.rect
        })),
        viewport
      );
    }

    // 11. 200% Zoom Reflow (Optional)
    let zoomReflowResult: ZoomReflowResult | undefined;
    if (mergedOptions.test200PercentZoomReflow) {
      zoomReflowResult = await this.test200PercentZoomReflow();
    }

    // 12. Screenshot capture
    let screenshotBase64: string | undefined;
    if (mergedOptions.includeScreenshot) {
      try {
        const buffer = await this.page.screenshot({ fullPage: false });
        screenshotBase64 = buffer.toString('base64');
      } catch {
        // Screenshot capture not supported or skipped
      }
    }

    // 13. Compute UX Score
    const uxScore = computeUXScore({
      overflowIssues,
      viewportFit,
      touchTargetIssues,
      readabilityIssues,
      contrastIssues,
      occlusionIssues,
      collisionIssues,
      scrollTrapIssues,
      accessibleNameIssues,
      focusIndicatorIssues,
      thumbZoneAnalysis
    });

    let devicePreset: DevicePreset | undefined;
    if (mergedOptions.device) {
      devicePreset = getDevicePreset(mergedOptions.device);
    }

    return {
      url,
      timestamp: new Date().toISOString(),
      device: devicePreset,
      viewport,
      uxScore,
      overflowIssues,
      touchTargetIssues,
      viewportFit,
      readabilityIssues,
      contrastIssues,
      occlusionIssues,
      collisionIssues,
      scrollTrapIssues,
      accessibleNameIssues,
      focusIndicatorIssues,
      thumbZoneAnalysis,
      zoomReflowResult,
      screenshotBase64,
      executionTimeMs: Date.now() - startTime
    };
  }

  /**
   * Test WCAG 1.4.10 Reflow at 200% zoom.
   */
  async test200PercentZoomReflow(zoomFactor = 2.0): Promise<ZoomReflowResult> {
    const originalFontSize = await this.page.evaluate(() => {
      const current = document.documentElement.style.fontSize;
      document.documentElement.style.fontSize = '200%';
      return current;
    });

    await this.page.waitForTimeout(200);

    const data = await this.page.evaluate(collectInPageAuditScript, '{}');
    const collisions = evaluateElementCollisions(
      data.elements.map(e => ({
        selector: e.selector,
        tagName: e.tagName,
        textSnippet: e.textSnippet,
        rect: e.rect,
        isInteractive: e.isInteractive,
        isTextOnly: e.isTextOnly,
        ancestors: e.ancestors
      }))
    );

    // Restore original font size
    await this.page.evaluate((orig) => {
      document.documentElement.style.fontSize = orig || '';
    }, originalFontSize);

    return evaluateZoomReflow({
      pageScrollWidth: data.viewport.scrollWidth,
      windowWidth: data.viewport.width,
      collisionCount: collisions.length,
      zoomFactor
    });
  }

  /**
   * Track layout shift and element displacement occurring during an asynchronous action.
   */
  async trackShifts(
    action: () => Promise<void>,
    options?: { maxAcceptableScore?: number; maxAcceptableDisplacement?: number }
  ): Promise<LayoutShiftResult> {
    // Capture before snapshot
    const beforeData = await this.page.evaluate(collectInPageAuditScript, '{}');
    const beforeSnapshots: ElementSnapshot[] = beforeData.elements.map(e => ({
      selector: e.selector,
      tagName: e.tagName,
      id: e.id,
      className: e.className,
      textSnippet: e.textSnippet,
      rect: e.rect
    }));

    // Perform action
    await action();

    // Delay to allow CSS transitions to settle
    await this.page.waitForTimeout(200);

    // Capture after snapshot
    const afterData = await this.page.evaluate(collectInPageAuditScript, '{}');
    const afterSnapshots: ElementSnapshot[] = afterData.elements.map(e => ({
      selector: e.selector,
      tagName: e.tagName,
      id: e.id,
      className: e.className,
      textSnippet: e.textSnippet,
      rect: e.rect
    }));

    return evaluateLayoutShift(beforeSnapshots, afterSnapshots, afterData.viewport, options);
  }

  /**
   * Generate and write an interactive HTML report to disk.
   */
  async generateReport(result: LayoutAuditResult, outputPath: string): Promise<string> {
    const html = generateHtmlReport(result);
    const resolvedPath = path.resolve(outputPath);
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(resolvedPath, html, 'utf-8');
    return resolvedPath;
  }
}
