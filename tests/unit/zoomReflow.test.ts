import { describe, it, expect } from 'vitest';
import { evaluateZoomReflow } from '../../src/core/zoomReflow';

describe('200% Zoom Reflow Analyzer', () => {
  it('passes when content reflows within window width without collision', () => {
    const result = evaluateZoomReflow({
      pageScrollWidth: 412,
      windowWidth: 412,
      collisionCount: 0
    });

    expect(result.passesReflow).toBe(true);
    expect(result.hasHorizontalBleed).toBe(false);
    expect(result.issues).toHaveLength(0);
  });

  it('fails when font scaling introduces horizontal bleed', () => {
    const result = evaluateZoomReflow({
      pageScrollWidth: 550,
      windowWidth: 412,
      collisionCount: 1
    });

    expect(result.passesReflow).toBe(false);
    expect(result.hasHorizontalBleed).toBe(true);
    expect(result.issues).toHaveLength(2);
  });
});
