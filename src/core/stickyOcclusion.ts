import { StickyOcclusionIssue, BoundingBox } from '../types';
import { InPageStickyOcclusionData } from './browser/stickyScanner';

/**
 * Evaluates in-page sticky and fixed occlusion data into structured layout issues.
 *
 * @param data Array of raw in-page sticky occlusion records collected by stickyScanner.
 * @returns Array of StickyOcclusionIssue reports with severity and actionable recommendations.
 */
export function evaluateStickyOcclusion(
  data: InPageStickyOcclusionData[]
): StickyOcclusionIssue[] {
  if (!data || data.length === 0) {
    return [];
  }

  return data.map((item): StickyOcclusionIssue => {
    const severity: 'critical' | 'serious' = item.isInteractive ? 'critical' : 'serious';
    const positionLabel = item.positionType === 'fixed' ? 'Fixed' : 'Sticky';
    const interactiveLabel = item.isInteractive ? 'interactive ' : '';
    const suggestion = `${positionLabel} element ${item.stickySelector} occludes ${interactiveLabel}${item.occludedTagName} ${item.occludedSelector} (${item.overlapRect.width}x${item.overlapRect.height}px overlap). Adjust z-index, add scroll-padding-top/bottom, or increase container padding.`;

    const overlapRect: BoundingBox = {
      x: item.overlapRect.x,
      y: item.overlapRect.y,
      width: item.overlapRect.width,
      height: item.overlapRect.height,
      top: item.overlapRect.top,
      right: item.overlapRect.right,
      bottom: item.overlapRect.bottom,
      left: item.overlapRect.left
    };

    return {
      stickySelector: item.stickySelector,
      stickyTagName: item.stickyTagName,
      positionType: item.positionType,
      occludedSelector: item.occludedSelector,
      occludedTagName: item.occludedTagName,
      isInteractive: item.isInteractive,
      overlapRect,
      severity,
      suggestion
    };
  });
}
