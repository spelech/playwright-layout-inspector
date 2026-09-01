import { describe, it, expect } from 'vitest';
import { generateHtmlReport } from '../../src/reporter/htmlReporter';
import { LayoutAuditResult } from '../../src/types';

describe('HTML Reporter', () => {
  it('generates a valid HTML document string containing report sections', () => {
    const mockResult: LayoutAuditResult = {
      url: 'http://localhost:5173',
      timestamp: new Date().toISOString(),
      viewport: {
        width: 412,
        height: 915,
        devicePixelRatio: 3.0,
        scrollX: 0,
        scrollY: 0,
        scrollWidth: 600,
        scrollHeight: 915,
        metaViewport: 'width=device-width, initial-scale=1.0'
      },
      uxScore: {
        totalScore: 78,
        grade: 'B',
        passed: false,
        categories: {
          overflowAndFit: {
            name: 'Overflow & Viewport Fit',
            score: 20,
            weight: 35,
            maxScore: 35,
            grade: 'C',
            passed: false,
            issueCount: 1,
            summary: '1 overflow issue found'
          },
          stability: {
            name: 'Layout Stability & Transitions',
            score: 25,
            weight: 25,
            maxScore: 25,
            grade: 'A+',
            passed: true,
            issueCount: 0,
            summary: 'Layout stable'
          },
          touchErgonomics: {
            name: 'Touch Ergonomics & Accessibility',
            score: 18,
            weight: 20,
            maxScore: 20,
            grade: 'A',
            passed: true,
            issueCount: 1,
            summary: '1 minor touch target issue'
          },
          readabilityAndVisibility: {
            name: 'Readability & Visual Clarity',
            score: 15,
            weight: 20,
            maxScore: 20,
            grade: 'B',
            passed: true,
            issueCount: 1,
            summary: '1 readability warning'
          },
          accessibilityAndFocus: {
            name: 'Accessibility & Keyboard Navigation',
            score: 15,
            weight: 15,
            maxScore: 15,
            grade: 'A+',
            passed: true,
            issueCount: 0,
            summary: 'Accessible names on all icon buttons and visible keyboard focus rings.'
          }
        }
      },
      overflowIssues: [
        {
          selector: '#canvas',
          tagName: 'div',
          boundingBox: { x: 0, y: 100, width: 600, height: 400, top: 100, right: 600, bottom: 500, left: 0 },
          viewport: { width: 412, height: 915, devicePixelRatio: 3, scrollX: 0, scrollY: 0, scrollWidth: 600, scrollHeight: 915 },
          overflowRightPx: 188,
          overflowBottomPx: 0,
          overflowLeftPx: 0,
          computedStyles: {
            overflow: 'visible', overflowX: 'visible', overflowY: 'visible',
            width: '600px', minWidth: '0', maxWidth: 'none', height: '400px', minHeight: '0', maxHeight: 'none',
            transform: 'none', display: 'block', position: 'relative', boxSizing: 'border-box', margin: '0', padding: '0'
          },
          culpritDescription: 'Element overflows right by 188px',
          suggestedFix: 'Use max-width: 100%',
          severity: 'critical'
        }
      ],
      containerOverflowIssues: [
        {
          selector: '.auth-input-group',
          tagName: 'div',
          boundingBox: { x: 50, y: 100, width: 620, height: 44, top: 100, right: 670, bottom: 144, left: 50 },
          containerSelector: '.modal-card',
          containerTagName: 'div',
          containerBoundingBox: { x: 50, y: 50, width: 550, height: 400, top: 50, right: 600, bottom: 450, left: 50 },
          containerInnerBox: { top: 70, right: 580, bottom: 430, left: 70, width: 510, height: 360 },
          overflowRightPx: 90,
          overflowBottomPx: 0,
          overflowLeftPx: 0,
          overflowTopPx: 0,
          computedStyles: {
            overflow: 'visible', overflowX: 'visible', overflowY: 'visible',
            width: '620px', minWidth: '0', maxWidth: 'none', height: '44px', minHeight: '0', maxHeight: 'none',
            transform: 'none', display: 'flex', position: 'relative', boxSizing: 'border-box', margin: '0', padding: '0'
          },
          culpritDescription: 'Child .auth-input-group exceeds container .modal-card inner boundary by 90px on the right.',
          suggestedFix: 'Set flex-wrap: wrap on container or use responsive grid.',
          severity: 'critical'
        }
      ],
      textFlowIssues: [
        {
          selector: 'h2.heading',
          tagName: 'h2',
          textSnippet: 'Welcome to our platform now',
          anomalyType: 'orphan-wrap',
          details: 'Heading text leaves a single orphan word ("now") on the last line.',
          orphanText: 'now',
          lineCount: 2,
          lastLineWordCount: 1,
          severity: 'warning',
          suggestedFix: 'Apply text-wrap: balance'
        }
      ],
      touchTargetIssues: [],
      viewportFit: {
        isValidMetaViewport: true,
        metaContent: 'width=device-width, initial-scale=1.0',
        allowsUserZoom: true,
        isWidthDeviceWidth: true,
        initialScale: 1.0,
        isMobileOptimized: true,
        pageScrollWidth: 600,
        windowWidth: 412,
        horizontalOverflowRatio: 1.45,
        contentBleeds: true,
        issues: ['Content bleeds past viewport'],
        suggestions: ['Set overflow-x: hidden']
      },
      readabilityIssues: [],
      contrastIssues: [],
      occlusionIssues: [],
      collisionIssues: [],
      scrollTrapIssues: [],
      accessibleNameIssues: [],
      focusIndicatorIssues: [],
      executionTimeMs: 120
    };

    const html = generateHtmlReport(mockResult);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Playwright Layout Inspector');
    expect(html).toContain('78');
    expect(html).toContain('Grade B');
    expect(html).toContain('#canvas');
    expect(html).toContain('Horizontal Viewport Bleed (+188px)');
    expect(html).toContain('Container Geometric Bleed (+90px)');
    expect(html).toContain('.auth-input-group');
    expect(html).toContain('.modal-card');
    expect(html).toContain('orphan wrap');
    expect(html).toContain('Welcome to our platform now');
  });
});
