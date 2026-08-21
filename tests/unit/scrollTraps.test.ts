import { describe, it, expect } from 'vitest';
import { evaluateScrollTrap } from '../../src/core/scrollTraps';

describe('Scroll Trap Analyzer', () => {
  const viewport = {
    width: 412,
    height: 915,
    devicePixelRatio: 3,
    scrollX: 0,
    scrollY: 0,
    scrollWidth: 412,
    scrollHeight: 915
  };

  it('detects critical scroll trap on large nested scroll area', () => {
    const container = {
      selector: '#nested-feed',
      tagName: 'div',
      scrollHeight: 2500,
      clientHeight: 700, // 700 / 915 = 76% of viewport
      scrollWidth: 400,
      clientWidth: 400,
      overflowY: 'auto',
      overflowX: 'hidden'
    };

    const trap = evaluateScrollTrap(container, viewport);
    expect(trap).not.toBeNull();
    expect(trap?.isTrapRisk).toBe(true);
    expect(trap?.severity).toBe('critical');
    expect(trap?.viewportRatio).toBe(0.77);
  });

  it('returns null when container is fully visible without scrolling', () => {
    const container = {
      selector: '#static-card',
      tagName: 'div',
      scrollHeight: 200,
      clientHeight: 200,
      scrollWidth: 300,
      clientWidth: 300,
      overflowY: 'visible',
      overflowX: 'visible'
    };

    const trap = evaluateScrollTrap(container, viewport);
    expect(trap).toBeNull();
  });
});
