/**
 * Color parsing, alpha compositing, and luminance utilities for in-page evaluation.
 */
export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function parseRgba(str: string): RgbaColor | null {
  if (!str || str === 'transparent') return null;
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!m) return null;
  return {
    r: parseInt(m[1], 10),
    g: parseInt(m[2], 10),
    b: parseInt(m[3], 10),
    a: m[4] !== undefined ? parseFloat(m[4]) : 1
  };
}

export function getEffectiveBackgroundColor(el: Element): string {
  const bgStack: RgbaColor[] = [];
  let currBgEl: Element | null = el;
  while (currBgEl) {
    const bgStyle = window.getComputedStyle(currBgEl).backgroundColor;
    const parsed = parseRgba(bgStyle);
    if (parsed && parsed.a > 0) {
      bgStack.unshift(parsed);
    }
    currBgEl = currBgEl.parentElement;
  }

  let compBg = { r: 255, g: 255, b: 255, a: 1 };
  for (const bgLayer of bgStack) {
    if (bgLayer.a >= 1) {
      compBg = { r: bgLayer.r, g: bgLayer.g, b: bgLayer.b, a: 1 };
    } else {
      compBg = {
        r: Math.round(bgLayer.r * bgLayer.a + compBg.r * (1 - bgLayer.a)),
        g: Math.round(bgLayer.g * bgLayer.a + compBg.g * (1 - bgLayer.a)),
        b: Math.round(bgLayer.b * bgLayer.a + compBg.b * (1 - bgLayer.a)),
        a: 1
      };
    }
  }
  return `rgb(${compBg.r}, ${compBg.g}, ${compBg.b})`;
}

export function calculateLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(val => {
    const v = val / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function calculateContrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
