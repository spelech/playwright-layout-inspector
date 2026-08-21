import { BoundingBox, ElementComputedStyles, OverflowIssue, ViewportInfo } from '../types';

export function calculateOverflow(
  rect: BoundingBox,
  viewport: ViewportInfo
): { overflowRightPx: number; overflowBottomPx: number; overflowLeftPx: number; hasOverflow: boolean } {
  const overflowRightPx = Math.max(0, rect.right - viewport.width);
  const overflowBottomPx = Math.max(0, rect.bottom - viewport.height);
  const overflowLeftPx = Math.max(0, -rect.left);

  const hasOverflow = overflowRightPx > 1 || overflowLeftPx > 1;

  return {
    overflowRightPx: Math.round(overflowRightPx * 100) / 100,
    overflowBottomPx: Math.round(overflowBottomPx * 100) / 100,
    overflowLeftPx: Math.round(overflowLeftPx * 100) / 100,
    hasOverflow
  };
}

export function generateOverflowRemediation(
  issue: {
    tagName: string;
    selector: string;
    boundingBox: BoundingBox;
    viewport: ViewportInfo;
    styles: ElementComputedStyles;
    overflowRightPx: number;
  }
): { culpritDescription: string; suggestedFix: string } {
  const { tagName, selector, boundingBox, viewport, styles, overflowRightPx } = issue;
  const widthPx = boundingBox.width;
  const viewportWidth = viewport.width;

  let culpritDescription = `Element <${tagName}> (${selector}) has width ${Math.round(widthPx)}px and extends ${Math.round(overflowRightPx)}px beyond viewport width (${viewportWidth}px).`;
  let suggestedFix = `Set max-width: 100% or overflow-x: auto on parent container.`;

  if (styles.transform && styles.transform !== 'none' && styles.transform.includes('matrix')) {
    culpritDescription += ` Element has a CSS transform applied (${styles.transform}) which scales it past the screen boundary.`;
    suggestedFix = `Ensure transformed container has 'overflow: hidden' or compute dynamic scale based on viewport width: scale = Math.min(1.0, (viewportWidth - padding) / contentWidth).`;
  } else if (styles.width && styles.width.includes('px') && parseFloat(styles.width) > viewportWidth) {
    culpritDescription += ` Explicit fixed width of ${styles.width} exceeds viewport (${viewportWidth}px).`;
    suggestedFix = `Replace fixed width '${styles.width}' with responsive max-width (e.g. max-w-full, width: 100%, or fit-content) or add media queries.`;
  } else if (styles.minWidth && styles.minWidth !== 'auto' && parseFloat(styles.minWidth) > viewportWidth) {
    culpritDescription += ` Fixed min-width '${styles.minWidth}' forces element to overflow.`;
    suggestedFix = `Set 'min-width: 0' or 'min-width: 100%' for responsive layout.`;
  }

  return { culpritDescription, suggestedFix };
}
