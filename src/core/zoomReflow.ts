import { ZoomReflowResult } from '../types';

export function evaluateZoomReflow(params: {
  pageScrollWidth: number;
  windowWidth: number;
  collisionCount: number;
  zoomFactor?: number;
}): ZoomReflowResult {
  const zoomFactor = params.zoomFactor ?? 2.0;
  const issues: string[] = [];

  const hasHorizontalBleed = params.pageScrollWidth > params.windowWidth + 5;
  if (hasHorizontalBleed) {
    const bleedPx = Math.round(params.pageScrollWidth - params.windowWidth);
    issues.push(`Page content width (${params.pageScrollWidth}px) exceeds window width (${params.windowWidth}px) by ${bleedPx}px at ${Math.round(zoomFactor * 100)}% text scale, requiring two-dimensional scrolling.`);
  }

  if (params.collisionCount > 0) {
    issues.push(`${params.collisionCount} text collision(s) detected at ${Math.round(zoomFactor * 100)}% text scale.`);
  }

  const passesReflow = !hasHorizontalBleed && params.collisionCount === 0;

  let summary = `Complies with WCAG 1.4.10 Reflow standard at ${Math.round(zoomFactor * 100)}% text zoom (no horizontal scroll or collisions).`;
  if (!passesReflow) {
    summary = `Failed WCAG 1.4.10 Reflow at ${Math.round(zoomFactor * 100)}% text zoom: ${issues.join(' ')}`;
  }

  return {
    zoomFactor,
    passesReflow,
    hasHorizontalBleed,
    pageScrollWidth: params.pageScrollWidth,
    windowWidth: params.windowWidth,
    collisionCount: params.collisionCount,
    issues,
    summary
  };
}
