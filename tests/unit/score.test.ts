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

    expect(score.totalScore).toBeLessThan(70);
    expect(score.passed).toBe(false);
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
