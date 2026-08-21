import { describe, it, expect } from 'vitest';
import { categorizeThumbZone, evaluateThumbZoneErgonomics } from '../../src/core/ergonomics';

describe('Thumb Zone Ergonomics Analyzer', () => {
  const mobileViewport = {
    width: 412,
    height: 915,
    devicePixelRatio: 3,
    scrollX: 0,
    scrollY: 0,
    scrollWidth: 412,
    scrollHeight: 915
  };

  it('correctly maps screen regions to thumb zones', () => {
    // Bottom navigation item (y = 800) -> natural
    const navItem = { x: 50, y: 800, width: 40, height: 40, top: 800, right: 90, bottom: 840, left: 50 };
    expect(categorizeThumbZone(navItem, mobileViewport)).toBe('natural');

    // Header item (y = 30) -> hard
    const headerItem = { x: 350, y: 30, width: 40, height: 40, top: 30, right: 390, bottom: 70, left: 350 };
    expect(categorizeThumbZone(headerItem, mobileViewport)).toBe('hard');
  });

  it('computes weighted ergonomics score', () => {
    const items = [
      { selector: '#bottom-nav-1', rect: { x: 50, y: 800, width: 40, height: 40, top: 800, right: 90, bottom: 840, left: 50 } },
      { selector: '#bottom-nav-2', rect: { x: 150, y: 800, width: 40, height: 40, top: 800, right: 190, bottom: 840, left: 150 } },
      { selector: '#middle-cta', rect: { x: 100, y: 400, width: 200, height: 48, top: 400, right: 300, bottom: 448, left: 100 } }
    ];

    const result = evaluateThumbZoneErgonomics(items, mobileViewport);
    expect(result.naturalZoneCount).toBe(2);
    expect(result.reachZoneCount).toBe(1);
    expect(result.hardZoneCount).toBe(0);
    expect(result.ergonomicsScore).toBeGreaterThanOrEqual(90);
  });
});
