import { ViewportFitResult, ViewportInfo } from '../types';

export function evaluateViewportFit(
  metaContent: string | null | undefined,
  viewport: ViewportInfo
): ViewportFitResult {
  const issues: string[] = [];
  const suggestions: string[] = [];

  let isValidMetaViewport = false;
  let allowsUserZoom = true;
  let isWidthDeviceWidth = false;
  let initialScale = 1.0;
  let isMobileOptimized = false;

  if (metaContent) {
    isValidMetaViewport = true;
    const parts = metaContent.toLowerCase().split(',').map(s => s.trim());

    for (const part of parts) {
      if (part.includes('width=device-width')) {
        isWidthDeviceWidth = true;
      }
      if (part.includes('user-scalable=no') || part.includes('user-scalable=0')) {
        allowsUserZoom = false;
        issues.push('Viewport meta tag explicitly disables user pinch-to-zoom (user-scalable=no/0), violating WCAG 1.4.4 resize standard.');
        suggestions.push('Remove "user-scalable=no" and allow users to zoom content freely.');
      }
      if (part.includes('maximum-scale=1') || part.includes('maximum-scale=1.0')) {
        allowsUserZoom = false;
        issues.push('Viewport meta tag restricts maximum zoom scale to 1.0 (maximum-scale=1), preventing users from zooming.');
        suggestions.push('Set maximum-scale to 5.0 or remove maximum-scale constraint.');
      }
      if (part.startsWith('initial-scale=')) {
        const val = parseFloat(part.replace('initial-scale=', ''));
        if (!isNaN(val)) initialScale = val;
      }
    }

    if (isWidthDeviceWidth && initialScale >= 0.9 && initialScale <= 1.1) {
      isMobileOptimized = true;
    }
  } else {
    issues.push('Missing <meta name="viewport"> tag. Mobile browsers will render page in desktop emulation mode (980px viewport).');
    suggestions.push('Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> to your HTML <head>.');
  }

  const pageScrollWidth = viewport.scrollWidth;
  const windowWidth = viewport.width;
  const horizontalOverflowRatio = Math.round((pageScrollWidth / windowWidth) * 1000) / 1000;
  const contentBleeds = horizontalOverflowRatio > 1.01;

  if (contentBleeds) {
    const bleedPx = Math.round(pageScrollWidth - windowWidth);
    issues.push(`Page content width (${pageScrollWidth}px) exceeds viewport width (${windowWidth}px) by ${bleedPx}px, causing unwanted horizontal scroll.`);
    suggestions.push(`Inspect overflowing child elements, ensure max-w-full and overflow-x: hidden/clip on page body.`);
  }

  return {
    isValidMetaViewport,
    metaContent,
    allowsUserZoom,
    isWidthDeviceWidth,
    initialScale,
    isMobileOptimized,
    pageScrollWidth,
    windowWidth,
    horizontalOverflowRatio,
    contentBleeds,
    issues,
    suggestions
  };
}
