/**
 * Sticky and Fixed element occlusion scanning in the browser DOM.
 */
export interface InPageStickyOcclusionData {
  stickySelector: string;
  stickyTagName: string;
  positionType: 'fixed' | 'sticky';
  occludedSelector: string;
  occludedTagName: string;
  isInteractive: boolean;
  overlapRect: {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export function scanStickyOcclusions(
  elements: Array<{
    selector: string;
    tagName: string;
    isInteractive: boolean;
    isTextOnly: boolean;
    rect: { top: number; right: number; bottom: number; left: number; width: number; height: number };
    ancestors?: string[];
    computedStyles: { position: string; zIndex?: string; display: string };
  }>
): InPageStickyOcclusionData[] {
  const stickyItems = elements.filter(el => {
    const pos = el.computedStyles.position;
    return (pos === 'fixed' || pos === 'sticky') && el.rect.width > 20 && el.rect.height > 10;
  });

  if (stickyItems.length === 0) return [];

  const results: InPageStickyOcclusionData[] = [];

  for (const sticky of stickyItems) {
    const sRect = sticky.rect;
    const sZ = parseInt(sticky.computedStyles.zIndex || '0', 10) || 0;

    for (const target of elements) {
      if (target.selector === sticky.selector) continue;
      if (target.ancestors && target.ancestors.includes(sticky.selector)) continue;
      // We are interested in sticky elements occluding interactive elements or headings
      const isHeading = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(target.tagName.toLowerCase());
      if (!target.isInteractive && !isHeading) continue;

      const tRect = target.rect;
      const tZ = parseInt(target.computedStyles.zIndex || '0', 10) || 0;

      // If target is in front of sticky element, no occlusion
      if (tZ > sZ) continue;

      // Compute intersection bounding box
      const interLeft = Math.max(sRect.left, tRect.left);
      const interTop = Math.max(sRect.top, tRect.top);
      const interRight = Math.min(sRect.right, tRect.right);
      const interBottom = Math.min(sRect.bottom, tRect.bottom);

      if (interRight > interLeft + 2 && interBottom > interTop + 2) {
        const overlapWidth = Math.round((interRight - interLeft) * 100) / 100;
        const overlapHeight = Math.round((interBottom - interTop) * 100) / 100;

        // Check if overlap covers a meaningful portion (e.g. > 20% of target or > 50px area)
        const targetArea = Math.max(1, tRect.width * tRect.height);
        const overlapArea = overlapWidth * overlapHeight;
        if (overlapArea / targetArea > 0.15 || overlapArea > 100) {
          results.push({
            stickySelector: sticky.selector,
            stickyTagName: sticky.tagName,
            positionType: sticky.computedStyles.position as 'fixed' | 'sticky',
            occludedSelector: target.selector,
            occludedTagName: target.tagName,
            isInteractive: target.isInteractive,
            overlapRect: {
              x: Math.round(interLeft * 100) / 100,
              y: Math.round(interTop * 100) / 100,
              width: overlapWidth,
              height: overlapHeight,
              top: Math.round(interTop * 100) / 100,
              right: Math.round(interRight * 100) / 100,
              bottom: Math.round(interBottom * 100) / 100,
              left: Math.round(interLeft * 100) / 100
            }
          });
        }
      }
    }
  }

  return results;
}
