import { ColorContrastIssue } from '../types';

interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function parseColor(colorStr: string): RGBA | null {
  if (!colorStr || colorStr === 'transparent') {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  // Handle rgb(r, g, b) and rgba(r, g, b, a)
  const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
      a: rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1,
    };
  }

  // Handle hex #rgb, #rgba, #rrggbb, #rrggbbaa
  if (colorStr.startsWith('#')) {
    const hex = colorStr.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1,
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1,
      };
    }
    if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255,
      };
    }
  }

  return null;
}

/**
 * Calculate WCAG relative luminance according to W3C definition.
 */
export function getRelativeLuminance(rgba: RGBA): number {
  const [rs, gs, bs] = [rgba.r / 255, rgba.g / 255, rgba.b / 255].map(val => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate WCAG contrast ratio between foreground and background.
 * Returns a ratio between 1 and 21.
 */
export function getContrastRatio(fgColorStr: string, bgColorStr: string): number {
  const fg = parseColor(fgColorStr);
  const bg = parseColor(bgColorStr) || { r: 255, g: 255, b: 255, a: 1 };

  if (!fg) return 21; // Default to passing if unparseable

  // Alpha blend foreground over background if foreground is translucent
  const effectiveFg = fg.a < 1 ? {
    r: Math.round(fg.r * fg.a + bg.r * (1 - fg.a)),
    g: Math.round(fg.g * fg.a + bg.g * (1 - fg.a)),
    b: Math.round(fg.b * fg.a + bg.b * (1 - fg.a)),
    a: 1,
  } : fg;

  const l1 = getRelativeLuminance(effectiveFg);
  const l2 = getRelativeLuminance(bg);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Evaluate element for WCAG 2.1 Level AA color contrast compliance.
 */
export function evaluateColorContrast(
  element: {
    selector: string;
    tagName: string;
    textSnippet?: string;
    color: string;
    backgroundColor: string;
    fontSizePx: number;
    fontWeight: string;
  },
  options?: { minRatio?: number }
): ColorContrastIssue | null {
  if (!element.textSnippet || element.textSnippet.trim().length === 0) {
    return null;
  }

  const isBold = parseInt(element.fontWeight, 10) >= 700 || element.fontWeight === 'bold';
  // Large text in WCAG is 18pt (24px) or 14pt (18.66px) bold
  const isLargeText = element.fontSizePx >= 24 || (element.fontSizePx >= 18.66 && isBold);
  const defaultRequiredRatio = isLargeText ? 3.0 : 4.5;
  const requiredRatio = options?.minRatio !== undefined ? options.minRatio : defaultRequiredRatio;

  const ratio = Math.round(getContrastRatio(element.color, element.backgroundColor) * 100) / 100;

  if (ratio >= requiredRatio) {
    return null;
  }

  const severity: 'critical' | 'warning' = ratio < 3.0 ? 'critical' : 'warning';
  const suggestion = `Text contrast ratio is ${ratio}:1 (${element.color} on ${element.backgroundColor}), which fails WCAG AA requirement of ${requiredRatio}:1 for ${isLargeText ? 'large' : 'normal'} text. Adjust text or background color to improve contrast.`;

  return {
    selector: element.selector,
    tagName: element.tagName,
    textSnippet: element.textSnippet.length > 50 ? element.textSnippet.substring(0, 47) + '...' : element.textSnippet,
    foregroundColor: element.color,
    backgroundColor: element.backgroundColor,
    contrastRatio: ratio,
    requiredRatio,
    fontSizePx: element.fontSizePx,
    isBold,
    severity,
    suggestion,
  };
}
