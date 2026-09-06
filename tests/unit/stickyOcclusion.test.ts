import { describe, it, expect } from 'vitest';
import { evaluateStickyOcclusion } from '../../src/core/stickyOcclusion';
import { InPageStickyOcclusionData } from '../../src/core/browser/stickyScanner';

describe('Sticky & Fixed Element Occlusion Engine', () => {
  it('evaluates sticky occlusion data for interactive button -> severity critical', () => {
    const data: InPageStickyOcclusionData[] = [
      {
        stickySelector: 'header.navbar',
        stickyTagName: 'header',
        positionType: 'fixed',
        occludedSelector: 'button#submit-btn',
        occludedTagName: 'button',
        isInteractive: true,
        overlapRect: {
          x: 20,
          y: 10,
          width: 100,
          height: 30,
          top: 10,
          right: 120,
          bottom: 40,
          left: 20
        }
      }
    ];

    const issues = evaluateStickyOcclusion(data);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('critical');
    expect(issues[0].isInteractive).toBe(true);
    expect(issues[0].stickySelector).toBe('header.navbar');
    expect(issues[0].occludedSelector).toBe('button#submit-btn');
    expect(issues[0].suggestion).toContain('Fixed element header.navbar occludes interactive button button#submit-btn');
    expect(issues[0].suggestion).toContain('100x30px overlap');
  });

  it('evaluates sticky occlusion data for heading h2 -> severity serious', () => {
    const data: InPageStickyOcclusionData[] = [
      {
        stickySelector: 'nav.sticky-bar',
        stickyTagName: 'nav',
        positionType: 'sticky',
        occludedSelector: 'h2#section-title',
        occludedTagName: 'h2',
        isInteractive: false,
        overlapRect: {
          x: 0,
          y: 50,
          width: 300,
          height: 25,
          top: 50,
          right: 300,
          bottom: 75,
          left: 0
        }
      }
    ];

    const issues = evaluateStickyOcclusion(data);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('serious');
    expect(issues[0].isInteractive).toBe(false);
    expect(issues[0].stickySelector).toBe('nav.sticky-bar');
    expect(issues[0].occludedSelector).toBe('h2#section-title');
    expect(issues[0].suggestion).toContain('Sticky element nav.sticky-bar occludes h2 h2#section-title');
    expect(issues[0].suggestion).toContain('300x25px overlap');
  });

  it('empty array returns empty issues', () => {
    expect(evaluateStickyOcclusion([])).toEqual([]);
  });
});
