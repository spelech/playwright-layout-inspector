import type { Page } from '@playwright/test';
import {
  DevicePreset,
  FocusIndicatorIssue,
  LayoutAuditOptions,
  LayoutAuditResult,
  LayoutShiftResult,
  MatrixAuditOptions,
  ResponsiveMatrixAuditResult,
  ThumbZoneAnalysis,
  ZoomReflowResult
} from '../types';
import { getDevicePreset } from '../core/devices';
import { computeElementDisplacement, evaluateLayoutShift, ElementSnapshot } from '../core/layoutShift';
import { evaluateElementCollisions } from '../core/collisions';
import { evaluateFocusIndicator } from '../core/accessibility';
import { evaluateThumbZoneErgonomics } from '../core/ergonomics';
import { evaluateZoomReflow } from '../core/zoomReflow';
import { computeUXScore } from '../core/score';
import { collectInPageAuditScript } from '../core/browserScript';
import { generateHtmlReport } from '../reporter/htmlReporter';
import { captureAndAnnotateScreenshot } from './screenshotAnnotator';
import { runResponsiveMatrixAudit } from './matrixRunner';
import { evaluateAuditIssues } from './auditEvaluator';
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
      checkContainerOverflow: true,
      checkFlexBlowout: true,
      checkTextFlow: true,
      checkViewportFit: true,
      checkReadability: true,
      checkContrast: true,
      checkOcclusion: true,
      checkStickyOcclusion: true,
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

    // Evaluate all visual, geometric, and flow issues
    const issues = evaluateAuditIssues(inPageData, mergedOptions, viewport, isMobile);

    // Active focus indicator sampling via Playwright
    const focusIndicatorIssues: FocusIndicatorIssue[] = [];
    if (mergedOptions.checkFocusIndicators !== false) {
      const candidates = inPageData.elements.filter(e => e.isInteractive).slice(0, 5);
      for (const el of candidates) {
        const focusData = await this.page.evaluate((sel: string) => {
          const target = document.querySelector(sel) as HTMLElement;
          if (!target || typeof target.focus !== 'function') return null;
          target.focus();
          const comp = window.getComputedStyle(target);
          return {
            outlineWidth: comp.outlineWidth,
            outlineStyle: comp.outlineStyle,
            outlineColor: comp.outlineColor,
            boxShadow: comp.boxShadow
          };
        }, el.selector).catch(() => null);

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
        if (issue) focusIndicatorIssues.push(issue);
      }
    }

    // Mobile Thumb-Zone Ergonomics
    let thumbZoneAnalysis: ThumbZoneAnalysis | undefined;
    if (mergedOptions.checkThumbZones !== false) {
      const interactiveElements = inPageData.elements.filter(e => e.isInteractive);
      thumbZoneAnalysis = evaluateThumbZoneErgonomics(
        interactiveElements.map(e => ({
          selector: e.selector,
          textSnippet: e.textSnippet,
          rect: e.rect
        })),
        viewport
      );
    }

    // Optional 200% Zoom Reflow
    let zoomReflowResult: ZoomReflowResult | undefined;
    if (mergedOptions.test200PercentZoomReflow) {
      zoomReflowResult = await this.test200PercentZoomReflow();
    }

    // Screenshot capture
    const { screenshotBase64 } = await captureAndAnnotateScreenshot(this.page, mergedOptions);

    // Compute Composite UX Score
    const uxScore = computeUXScore({
      ...issues,
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
      ...issues,
      focusIndicatorIssues,
      thumbZoneAnalysis,
      zoomReflowResult,
      screenshotBase64,
      executionTimeMs: Date.now() - startTime
    };
  }

  /**
   * Run multi-device responsive matrix audit across mobile, tablet, and desktop viewports.
   */
  async auditMatrix(options: MatrixAuditOptions = {}): Promise<ResponsiveMatrixAuditResult> {
    return runResponsiveMatrixAudit(this.page, this, options);
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
    const beforeData = await this.page.evaluate(collectInPageAuditScript, '{}');
    const beforeSnapshots: ElementSnapshot[] = beforeData.elements.map(e => ({
      selector: e.selector,
      tagName: e.tagName,
      id: e.id,
      className: e.className,
      textSnippet: e.textSnippet,
      rect: e.rect
    }));

    await action();
    await this.page.waitForTimeout(200);

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
