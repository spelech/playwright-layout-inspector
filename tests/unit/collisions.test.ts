import { describe, it, expect } from 'vitest';
import { computeAABBOverlapArea, evaluateElementCollisions } from '../../src/core/collisions';

describe('Element and Text Collision Analyzer', () => {
  it('correctly calculates 2D AABB overlap area', () => {
    const a = { x: 0, y: 0, width: 100, height: 100, top: 0, right: 100, bottom: 100, left: 0 };
    const b = { x: 50, y: 50, width: 100, height: 100, top: 50, right: 150, bottom: 150, left: 50 };

    // Overlap: 50x50 = 2500
    const overlap = computeAABBOverlapArea(a, b);
    expect(overlap).toBe(2500);
  });

  it('detects collision between overlapping sibling text elements', () => {
    const elements = [
      {
        selector: '#label-first-name',
        tagName: 'label',
        textSnippet: 'First Name',
        rect: { x: 10, y: 10, width: 100, height: 20, top: 10, right: 110, bottom: 30, left: 10 },
        isInteractive: false,
        isTextOnly: true
      },
      {
        selector: '#label-last-name',
        tagName: 'label',
        textSnippet: 'Last Name',
        rect: { x: 50, y: 10, width: 100, height: 20, top: 10, right: 150, bottom: 30, left: 50 },
        isInteractive: false,
        isTextOnly: true
      }
    ];

    const issues = evaluateElementCollisions(elements);
    expect(issues).toHaveLength(1);
    expect(issues[0].isTextCollision).toBe(true);
    expect(issues[0].overlapAreaPx).toBe(1200); // 60 width * 20 height
    expect(issues[0].severity).toBe('critical');
  });

  it('ignores elements that do not overlap', () => {
    const elements = [
      {
        selector: '#item-1',
        tagName: 'div',
        rect: { x: 0, y: 0, width: 50, height: 50, top: 0, right: 50, bottom: 50, left: 0 },
        isInteractive: false,
        isTextOnly: false
      },
      {
        selector: '#item-2',
        tagName: 'div',
        rect: { x: 100, y: 0, width: 50, height: 50, top: 0, right: 150, bottom: 50, left: 100 },
        isInteractive: false,
        isTextOnly: false
      }
    ];

    const issues = evaluateElementCollisions(elements);
    expect(issues).toHaveLength(0);
  });
});
