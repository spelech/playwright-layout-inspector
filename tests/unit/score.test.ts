import { describe, it, expect } from 'vitest';
import { computeUXScore, calculateGrade } from '../../src/core/score';
import { ViewportFitResult } from '../../src/types';

describe('UX Score Calculator', () => {
  it('assigns Grade A+ to pristine layouts with 0 issues', () => {
    const perfectFit: ViewportFitResult = {
      isValidMetaViewport: true,
      metaContent: 'width=device-width, initial-scale=1.0',
      allowsUserZoom: true,
      isWidthDeviceWidth: true,
      initialScale: 1.0,
      isMobileOptimized: true,
      pageScrollWidth: 412,
      windowWidth: 412,
      horizontalOverflowRatio: 1.0,
      contentBleeds: false,
      issues: [],
      suggestions: []
    };

    const score = computeUXScore({
      overflowIssues: [],
      containerOverflowIssues: [],
      textFlowIssues: [],
      viewportFit: perfectFit,
      touchTargetIssues: [],
      readabilityIssues: [],
      occlusionIssues: []
    });

    expect(score.totalScore).toBe(100);
    expect(score.grade).toBe('A+');
    expect(score.passed).toBe(true);
  });

  it('penalizes horizontal overflow and missing meta viewport', () => {
    const bleedingFit: ViewportFitResult = {
      isValidMetaViewport: false,
      metaContent: null,
      allowsUserZoom: false,
      isWidthDeviceWidth: false,
      initialScale: 1.0,
      isMobileOptimized: false,
      pageScrollWidth: 600,
      windowWidth: 412,
      horizontalOverflowRatio: 1.45,
      contentBleeds: true,
      issues: ['Page content width (600px) exceeds viewport width (412px)'],
      suggestions: []
    };

    const score = computeUXScore({
      overflowIssues: [
        {
          selector: '#canvas',
          tagName: 'div',
          boundingBox: { x: 0, y: 0, width: 600, height: 400, top: 0, right: 600, bottom: 400, left: 0 },
          viewport: { width: 412, height: 915, devicePixelRatio: 3, scrollX: 0, scrollY: 0, scrollWidth: 600, scrollHeight: 915 },
          overflowRightPx: 188,
          overflowBottomPx: 0,
          overflowLeftPx: 0,
          computedStyles: {
            overflow: 'visible', overflowX: 'visible', overflowY: 'visible',
            width: '600px', minWidth: '0', maxWidth: 'none', height: '400px', minHeight: '0', maxHeight: 'none',
            transform: 'none', display: 'block', position: 'relative', boxSizing: 'border-box', margin: '0', padding: '0'
          },
          culpritDescription: 'Bleeds by 188px',
          suggestedFix: 'Fix width',
          severity: 'critical'
        }
      ],
      viewportFit: bleedingFit,
      touchTargetIssues: [],
      readabilityIssues: [],
      occlusionIssues: []
    });

    expect(score.totalScore).toBeLessThanOrEqual(75);
    expect(score.passed).toBe(false);
  });

  it('penalizes container overflow issues and text flow wrap anomalies', () => {
    const cleanFit: ViewportFitResult = {
      isValidMetaViewport: true,
      metaContent: 'width=device-width, initial-scale=1.0',
      allowsUserZoom: true,
      isWidthDeviceWidth: true,
      initialScale: 1.0,
      isMobileOptimized: true,
      pageScrollWidth: 1280,
      windowWidth: 1280,
      horizontalOverflowRatio: 1.0,
      contentBleeds: false,
      issues: [],
      suggestions: []
    };

    const score = computeUXScore({
      overflowIssues: [],
      containerOverflowIssues: [
        {
          selector: '.auth-row',
          tagName: 'div',
          boundingBox: { x: 100, y: 100, width: 620, height: 40, top: 100, right: 720, bottom: 140, left: 100 },
          containerSelector: '.modal-card',
          containerTagName: 'div',
          containerBoundingBox: { x: 100, y: 50, width: 550, height: 400, top: 50, right: 650, bottom: 450, left: 100 },
          containerInnerBox: { top: 70, right: 630, bottom: 430, left: 120, width: 510, height: 360 },
          overflowRightPx: 90,
          overflowBottomPx: 0,
          overflowLeftPx: 0,
          overflowTopPx: 0,
          computedStyles: {
            overflow: 'visible', overflowX: 'visible', overflowY: 'visible',
            width: '620px', minWidth: '0', maxWidth: 'none', height: '40px', minHeight: '0', maxHeight: 'none',
            transform: 'none', display: 'flex', position: 'relative', boxSizing: 'border-box', margin: '0', padding: '0'
          },
          culpritDescription: 'Auth row bleeds 90px past modal card',
          suggestedFix: 'Set flex-wrap: wrap',
          severity: 'critical'
        }
      ],
      textFlowIssues: [
        {
          selector: '.broken-word',
          tagName: 'p',
          textSnippet: 'Authentica tion error',
          anomalyType: 'mid-word-break',
          details: 'Word Authentication broken across lines',
          severity: 'critical',
          suggestedFix: 'Remove word-break: break-all'
        }
      ],
      viewportFit: cleanFit,
      touchTargetIssues: [],
      readabilityIssues: [],
      occlusionIssues: []
    });

    expect(score.totalScore).toBeLessThan(90);
    expect(score.categories.overflowAndFit.score).toBeLessThan(25);
    expect(score.categories.readabilityAndVisibility.score).toBeLessThan(20);
  });

  it('penalizes flex blowout and sticky element occlusion', () => {
    const cleanFit: ViewportFitResult = {
      isValidMetaViewport: true,
      metaContent: 'width=device-width, initial-scale=1.0',
      allowsUserZoom: true,
      isWidthDeviceWidth: true,
      initialScale: 1.0,
      isMobileOptimized: true,
      pageScrollWidth: 412,
      windowWidth: 412,
      horizontalOverflowRatio: 1.0,
      contentBleeds: false,
      issues: [],
      suggestions: []
    };

    const score = computeUXScore({
      overflowIssues: [],
      containerOverflowIssues: [],
      flexBlowoutIssues: [
        {
          selector: 'div#unconstrained-child',
          tagName: 'div',
          parentSelector: 'div#flex-parent',
          layoutType: 'flex',
          childWidth: 400,
          parentWidth: 250,
          overflowPx: 150,
          severity: 'critical',
          suggestion: 'Set min-width: 0'
        }
      ],
      stickyOcclusionIssues: [
        {
          stickySelector: 'header#sticky-nav',
          stickyTagName: 'header',
          positionType: 'fixed',
          occludedSelector: 'button#cta',
          occludedTagName: 'button',
          isInteractive: true,
          overlapRect: { x: 0, y: 0, width: 100, height: 40, top: 0, right: 100, bottom: 40, left: 0 },
          severity: 'critical',
          suggestion: 'Add scroll-padding-top'
        }
      ],
      textFlowIssues: [],
      viewportFit: cleanFit,
      touchTargetIssues: [],
      readabilityIssues: [],
      occlusionIssues: []
    });

    expect(score.totalScore).toBeLessThan(90);
    expect(score.categories.overflowAndFit.score).toBe(17); // 25 - 8 = 17
    expect(score.categories.readabilityAndVisibility.score).toBe(14); // 20 - 6 = 14
  });

  it('calculates grades correctly', () => {
    expect(calculateGrade(97)).toBe('A+');
    expect(calculateGrade(88)).toBe('A');
    expect(calculateGrade(75)).toBe('B');
    expect(calculateGrade(60)).toBe('C');
    expect(calculateGrade(45)).toBe('D');
    expect(calculateGrade(30)).toBe('F');
  });
});
