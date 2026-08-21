import type { Page } from '@playwright/test';
import {
  BoundingBox,
  DevicePreset,
  ElementComputedStyles,
  LayoutAuditOptions,
  LayoutAuditResult,
  LayoutShiftResult,
  OcclusionIssue,
  OverflowIssue,
  ReadabilityIssue,
  TouchTargetIssue,
  ViewportFitResult
} from '../types';
import { getDevicePreset } from '../core/devices';
import { calculateOverflow, generateOverflowRemediation } from '../core/overflow';
import { computeElementDisplacement, evaluateLayoutShift, ElementSnapshot } from '../core/layoutShift';
import { evaluateViewportFit } from '../core/viewportFit';
import { evaluateTouchTarget } from '../core/touchTargets';
import { evaluateTextReadability } from '../core/readability';
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
      checkOcclusion: true,
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
    if (mergedOptions.checkTouchTargets !== false) {
      const interactiveElements = inPageData.elements.filter(e => e.isInteractive);
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

    // 5. Occlusion Issues
    const occlusionIssues: OcclusionIssue[] = [];
    if (mergedOptions.checkOcclusion !== false) {
      for (const occ of inPageData.occlusions) {
        occlusionIssues.push({
          selector: occ.selector,
          occludedBySelector: occ.occludedBySelector,
          occludedAreaRatio: occ.occludedAreaRatio,
          isInteractive: occ.isInteractive,
          severity: 'critical',
          suggestion: `Element ${occ.selector} is visually occluded by floating/fixed layer ${occ.occludedBySelector}, preventing user interaction.`
        });
      }
    }

    // 6. Screenshot capture
    let screenshotBase64: string | undefined;
    if (mergedOptions.includeScreenshot) {
      try {
        const buffer = await this.page.screenshot({ fullPage: false });
        screenshotBase64 = buffer.toString('base64');
      } catch {
        // Screenshot capture failed or not supported in mock
      }
    }

    // 7. Compute UX Score
    const uxScore = computeUXScore({
      overflowIssues,
      viewportFit,
      touchTargetIssues,
      readabilityIssues,
      occlusionIssues
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
      occlusionIssues,
      screenshotBase64,
      executionTimeMs: Date.now() - startTime
    };
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

    // Small delay to allow CSS transitions / DOM reflows to settle
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
