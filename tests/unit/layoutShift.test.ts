import { describe, it, expect } from 'vitest';
import { computeElementDisplacement, evaluateLayoutShift, ElementSnapshot } from '../../src/core/layoutShift';
import { ViewportInfo } from '../../src/types';

describe('Layout Shift Analyzer', () => {
  const viewport: ViewportInfo = {
    width: 412,
    height: 915,
    devicePixelRatio: 3.0,
    scrollX: 0,
    scrollY: 0,
    scrollWidth: 412,
    scrollHeight: 915
  };

  it('computes displacement and flags jarring vertical drawer jumps', () => {
    const before: ElementSnapshot = {
      selector: '#canvas-container',
      tagName: 'div',
      id: 'canvas-container',
      rect: { x: 0, y: 150, width: 400, height: 300, top: 150, right: 400, bottom: 450, left: 0 }
    };

    // Canvas displaced vertically by 140px when drawer opened
    const after: ElementSnapshot = {
      selector: '#canvas-container',
      tagName: 'div',
      id: 'canvas-container',
      rect: { x: 0, y: 290, width: 400, height: 300, top: 290, right: 400, bottom: 590, left: 0 }
    };

    const shift = computeElementDisplacement(before, after, viewport);
    expect(shift).not.toBeNull();
    expect(shift?.deltaY).toBe(140);
    expect(shift?.distance).toBe(140);
    expect(shift?.isJarring).toBe(true);
    expect(shift?.explanation).toContain('Vertical jump of 140px detected');
  });

  it('evaluates overall layout stability across multiple element snapshots', () => {
    const beforeList: ElementSnapshot[] = [
      {
        selector: '#header',
        tagName: 'header',
        rect: { x: 0, y: 0, width: 412, height: 50, top: 0, right: 412, bottom: 50, left: 0 }
      },
      {
        selector: '#canvas',
        tagName: 'div',
        rect: { x: 20, y: 80, width: 372, height: 250, top: 80, right: 392, bottom: 330, left: 20 }
      }
    ];

    const afterList: ElementSnapshot[] = [
      {
        selector: '#header',
        tagName: 'header',
        rect: { x: 0, y: 0, width: 412, height: 50, top: 0, right: 412, bottom: 50, left: 0 }
      },
      {
        selector: '#canvas',
        tagName: 'div',
        rect: { x: 20, y: 220, width: 372, height: 250, top: 220, right: 392, bottom: 470, left: 20 } // jumped by 140px
      }
    ];

    const result = evaluateLayoutShift(beforeList, afterList, viewport);
    expect(result.isAcceptable).toBe(false);
    expect(result.jarringShiftCount).toBe(1);
    expect(result.maxDisplacementPx).toBe(140);
    expect(result.items.length).toBe(1);
  });
});
