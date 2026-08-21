import { ReadabilityIssue } from '../types';

export function evaluateTextReadability(
  element: {
    selector: string;
    text: string;
    fontSizePx: number;
    lineHeightPx?: number;
    scrollWidth: number;
    clientWidth: number;
    textOverflow: string;
    overflow: string;
  },
  isMobile: boolean,
  minFontSizePx = 12
): ReadabilityIssue | null {
  const isIllegibleOnMobile = isMobile && element.fontSizePx < minFontSizePx;
  const isTruncated = element.scrollWidth > element.clientWidth + 2 && (element.overflow === 'hidden' || element.textOverflow === 'ellipsis');

  if (!isIllegibleOnMobile && !isTruncated) {
    return null;
  }

  const severity: 'warning' | 'info' = (isIllegibleOnMobile && element.fontSizePx < 10) ? 'warning' : 'info';
  let suggestion = '';

  if (isIllegibleOnMobile && isTruncated) {
    suggestion = `Font size (${Math.round(element.fontSizePx)}px) is too small on mobile (< ${minFontSizePx}px) and text is truncated (${element.scrollWidth}px > ${element.clientWidth}px). Increase font-size to text-xs/text-sm and provide adequate width or wrapping.`;
  } else if (isIllegibleOnMobile) {
    suggestion = `Font size (${Math.round(element.fontSizePx)}px) is below mobile readability threshold (${minFontSizePx}px). Increase to at least 12px (text-xs/text-sm).`;
  } else if (isTruncated) {
    suggestion = `Text is overflowing and clipped/truncated without full expansion. Consider adding title/tooltip attribute or flexible wrapping.`;
  }

  return {
    selector: element.selector,
    textSnippet: element.text.length > 50 ? element.text.substring(0, 47) + '...' : element.text,
    fontSizePx: Math.round(element.fontSizePx * 10) / 10,
    lineHeightPx: element.lineHeightPx ? Math.round(element.lineHeightPx * 10) / 10 : undefined,
    isTruncated,
    isIllegibleOnMobile,
    severity,
    suggestion
  };
}
