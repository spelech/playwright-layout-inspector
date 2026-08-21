import { describe, it, expect } from 'vitest';
import { calculateOverflow, generateOverflowRemediation } from '../../src/core/overflow';
import { BoundingBox, ViewportInfo, ElementComputedStyles } from '../../src/types';

describe('Overflow Analyzer', () => {
  const viewport: ViewportInfo = {
    width: 412, // Samsung Galaxy S25+
    height: 915,
    devicePixelRatio: 3.0,
    scrollX: 0,
    scrollY: 0,
    scrollWidth: 600,
    scrollHeight: 915
  };

  it('detects elements bleeding over right edge of mobile viewport', () => {
    const rect: BoundingBox = {
      x: 0,
      y: 100,
      width: 600, // 600px canvas on 412px screen
      height: 400,
      top: 100,
      right: 600,
      bottom: 500,
      left: 0
    };

    const result = calculateOverflow(rect, viewport);
    expect(result.hasOverflow).toBe(true);
    expect(result.overflowRightPx).toBe(188); // 600 - 412 = 188px
  });

  it('passes elements perfectly fitting within viewport', () => {
    const rect: BoundingBox = {
      x: 0,
      y: 50,
      width: 380,
      height: 200,
      top: 50,
      right: 380,
      bottom: 250,
      left: 0
    };

    const result = calculateOverflow(rect, viewport);
    expect(result.hasOverflow).toBe(false);
    expect(result.overflowRightPx).toBe(0);
  });

  it('generates helpful remediation for CSS transform scaling issues', () => {
    const rect: BoundingBox = {
      x: 0,
      y: 100,
      width: 600,
      height: 400,
      top: 100,
      right: 600,
      bottom: 500,
      left: 0
    };

    const styles: ElementComputedStyles = {
      overflow: 'visible',
      overflowX: 'visible',
      overflowY: 'visible',
      width: '400px',
      minWidth: '0px',
      maxWidth: 'none',
      height: '300px',
      minHeight: '0px',
      maxHeight: 'none',
      transform: 'matrix(1.5, 0, 0, 1.5, 0, 0)',
      display: 'block',
      position: 'relative',
      boxSizing: 'border-box',
      margin: '0px',
      padding: '0px'
    };

    const remediation = generateOverflowRemediation({
      tagName: 'div',
      selector: '.canvas-wrapper',
      boundingBox: rect,
      viewport,
      styles,
      overflowRightPx: 188
    });

    expect(remediation.culpritDescription).toContain('CSS transform applied');
    expect(remediation.suggestedFix).toContain('compute dynamic scale based on viewport width');
  });
});
