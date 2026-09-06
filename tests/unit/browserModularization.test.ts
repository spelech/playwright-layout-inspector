import { describe, it, expect } from 'vitest';
import { parseRgba, calculateLuminance, calculateContrastRatio } from '../../src/core/browser/colorUtils';
import { scanStickyOcclusions } from '../../src/core/browser/stickyScanner';

describe('browserModularization', () => {
  describe('colorUtils', () => {
    it('parses rgb and rgba strings correctly', () => {
      expect(parseRgba('rgb(255, 0, 128)')).toEqual({ r: 255, g: 0, b: 128, a: 1 });
      expect(parseRgba('rgba(10, 20, 30, 0.5)')).toEqual({ r: 10, g: 20, b: 30, a: 0.5 });
      expect(parseRgba('transparent')).toBeNull();
      expect(parseRgba('')).toBeNull();
    });

    it('calculates relative luminance and contrast ratio according to WCAG 2.1', () => {
      const whiteL = calculateLuminance(255, 255, 255);
      const blackL = calculateLuminance(0, 0, 0);
      expect(whiteL).toBeCloseTo(1.0, 2);
      expect(blackL).toBeCloseTo(0.0, 2);

      const contrast = calculateContrastRatio(whiteL, blackL);
      expect(contrast).toBeCloseTo(21.0, 1);
    });
  });

  describe('stickyScanner', () => {
    it('detects sticky/fixed elements occluding underlying interactive elements', () => {
      const elements = [
        {
          selector: 'header#fixed-nav',
          tagName: 'header',
          isInteractive: false,
          isTextOnly: false,
          rect: { top: 0, bottom: 60, left: 0, right: 400, width: 400, height: 60 },
          computedStyles: { position: 'fixed', zIndex: '100', display: 'block' }
        },
        {
          selector: 'button#cta',
          tagName: 'button',
          isInteractive: true,
          isTextOnly: false,
          rect: { top: 20, bottom: 50, left: 50, right: 150, width: 100, height: 30 },
          computedStyles: { position: 'static', zIndex: '0', display: 'block' }
        },
        {
          selector: 'button#safe-btn',
          tagName: 'button',
          isInteractive: true,
          isTextOnly: false,
          rect: { top: 120, bottom: 160, left: 50, right: 150, width: 100, height: 40 },
          computedStyles: { position: 'static', zIndex: '0', display: 'block' }
        }
      ];

      const occlusions = scanStickyOcclusions(elements);
      expect(occlusions).toHaveLength(1);
      expect(occlusions[0].stickySelector).toBe('header#fixed-nav');
      expect(occlusions[0].occludedSelector).toBe('button#cta');
      expect(occlusions[0].isInteractive).toBe(true);
      expect(occlusions[0].positionType).toBe('fixed');
    });

    it('returns empty when no sticky elements or no overlaps exist', () => {
      const elements = [
        {
          selector: 'div#card',
          tagName: 'div',
          isInteractive: false,
          isTextOnly: false,
          rect: { top: 10, bottom: 100, left: 10, right: 200, width: 190, height: 90 },
          computedStyles: { position: 'relative', zIndex: '1', display: 'block' }
        }
      ];

      const occlusions = scanStickyOcclusions(elements);
      expect(occlusions).toHaveLength(0);
    });
  });
});
