import { describe, it, expect } from 'vitest';
import { evaluateElementOcclusion, generateRaycastSamplePoints } from '../../src/core/occlusion';

describe('Occlusion and Raycasting Analyzer', () => {
  it('generates 5 sample points (center + 4 insets)', () => {
    const rect = { x: 100, y: 100, width: 200, height: 100, top: 100, right: 300, bottom: 200, left: 100 };
    const points = generateRaycastSamplePoints(rect);

    expect(points).toHaveLength(5);
    expect(points[0]).toEqual({ x: 200, y: 150 }); // Center
  });

  it('detects critical occlusion when 80% of click area is covered by overlay', () => {
    const target = {
      selector: '#submit-button',
      tagName: 'button',
      boundingBox: { x: 10, y: 10, width: 100, height: 40, top: 10, right: 110, bottom: 50, left: 10 },
      isInteractive: true
    };

    const raycastResults = [
      { point: { x: 60, y: 30 }, topSelector: '#sticky-header', topTagName: 'header', isTargetOrDescendant: false },
      { point: { x: 14, y: 14 }, topSelector: '#sticky-header', topTagName: 'header', isTargetOrDescendant: false },
      { point: { x: 106, y: 14 }, topSelector: '#sticky-header', topTagName: 'header', isTargetOrDescendant: false },
      { point: { x: 14, y: 46 }, topSelector: '#sticky-header', topTagName: 'header', isTargetOrDescendant: false },
      { point: { x: 106, y: 46 }, topSelector: '#submit-button', topTagName: 'button', isTargetOrDescendant: true }
    ];

    const issue = evaluateElementOcclusion(target, raycastResults);
    expect(issue).not.toBeNull();
    expect(issue?.severity).toBe('critical');
    expect(issue?.occludedAreaRatio).toBe(0.8);
    expect(issue?.occludedBySelector).toBe('#sticky-header');
  });

  it('returns null when interactive element is completely unoccluded', () => {
    const target = {
      selector: '#submit-button',
      tagName: 'button',
      boundingBox: { x: 10, y: 10, width: 100, height: 40, top: 10, right: 110, bottom: 50, left: 10 },
      isInteractive: true
    };

    const raycastResults = [
      { point: { x: 60, y: 30 }, topSelector: '#submit-button', topTagName: 'button', isTargetOrDescendant: true },
      { point: { x: 14, y: 14 }, topSelector: '#submit-button', topTagName: 'button', isTargetOrDescendant: true }
    ];

    const issue = evaluateElementOcclusion(target, raycastResults);
    expect(issue).toBeNull();
  });
});
