import { BoundingBox, TouchTargetIssue } from '../types';

export function evaluateTouchTarget(
  target: {
    selector: string;
    tagName: string;
    id?: string;
    className?: string;
    text?: string;
    boundingBox: BoundingBox;
  },
  adjacentTargets?: { selector: string; boundingBox: BoundingBox }[],
  options?: { minTargetSize?: number; standard?: 'WCAG_AA' | 'WCAG_AAA' | 'MOBILE_RECOMMENDED' }
): TouchTargetIssue | null {
  const standard = options?.standard ?? 'WCAG_AA';
  const minTargetSize = options?.minTargetSize ?? (standard === 'WCAG_AAA' ? 44 : standard === 'MOBILE_RECOMMENDED' ? 48 : 24);

  const width = Math.round(target.boundingBox.width * 100) / 100;
  const height = Math.round(target.boundingBox.height * 100) / 100;

  // Ignore completely invisible elements
  if (width <= 0 || height <= 0) return null;

  const failsWidth = width < minTargetSize;
  const failsHeight = height < minTargetSize;

  if (!failsWidth && !failsHeight) {
    return null;
  }

  const spacingIssues: { adjacentSelector: string; distancePx: number }[] = [];

  if (adjacentTargets && adjacentTargets.length > 0) {
    const centerA = {
      x: target.boundingBox.x + target.boundingBox.width / 2,
      y: target.boundingBox.y + target.boundingBox.height / 2
    };

    for (const adj of adjacentTargets) {
      if (adj.selector === target.selector) continue;

      const centerB = {
        x: adj.boundingBox.x + adj.boundingBox.width / 2,
        y: adj.boundingBox.y + adj.boundingBox.height / 2
      };

      const centerDist = Math.hypot(centerA.x - centerB.x, centerA.y - centerB.y);
      const edgeDist = centerDist - (Math.max(width, height) / 2 + Math.max(adj.boundingBox.width, adj.boundingBox.height) / 2);

      if (edgeDist < 8 && centerDist < minTargetSize) {
        spacingIssues.push({
          adjacentSelector: adj.selector,
          distancePx: Math.max(0, Math.round(edgeDist))
        });
      }
    }
  }

  const severity: 'critical' | 'warning' = (width < 20 || height < 20 || spacingIssues.length > 0) ? 'critical' : 'warning';

  let suggestion = `Increase interactive target size to at least ${minTargetSize}x${minTargetSize}px (currently ${Math.round(width)}x${Math.round(height)}px) using padding (e.g. 'p-2' or 'p-3') or min-h-[${minTargetSize}px] min-w-[${minTargetSize}px].`;
  if (spacingIssues.length > 0) {
    suggestion += ` Add spacing/gap between this element and adjacent interactive target (${spacingIssues[0].adjacentSelector}) to prevent mis-taps.`;
  }

  return {
    selector: target.selector,
    tagName: target.tagName,
    id: target.id,
    className: target.className,
    text: target.text,
    boundingBox: target.boundingBox,
    width,
    height,
    standard,
    minRequiredSize: minTargetSize,
    severity,
    spacingIssues: spacingIssues.length > 0 ? spacingIssues : undefined,
    suggestion
  };
}
