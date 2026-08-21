import { BoundingBox, ElementCollisionIssue } from '../types';

export function computeAABBOverlapArea(a: BoundingBox, b: BoundingBox): number {
  const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return Math.round(overlapX * overlapY * 100) / 100;
}

export function evaluateElementCollisions(
  elements: Array<{
    selector: string;
    tagName: string;
    textSnippet?: string;
    rect: BoundingBox;
    isInteractive: boolean;
    isTextOnly: boolean;
    parentId?: string;
    ancestors?: string[];
  }>,
  minOverlapAreaPx = 25
): ElementCollisionIssue[] {
  const issues: ElementCollisionIssue[] = [];

  for (let i = 0; i < elements.length; i++) {
    const elA = elements[i];
    if (elA.rect.width <= 0 || elA.rect.height <= 0) continue;

    for (let j = i + 1; j < elements.length; j++) {
      const elB = elements[j];
      if (elB.rect.width <= 0 || elB.rect.height <= 0) continue;

      // Use ancestors list for accurate ancestor-descendant detection (primary method).
      // This prevents false positives where a parent container overlaps its own children.
      if (elA.ancestors || elB.ancestors) {
        const aIsAncestorOfB = elB.ancestors?.includes(elA.selector) ?? false;
        const bIsAncestorOfA = elA.ancestors?.includes(elB.selector) ?? false;
        if (aIsAncestorOfB || bIsAncestorOfA) continue;
      } else {
        // Fallback for callers that don't provide ancestors (legacy unit tests, etc.)
        if (elA.selector.includes(elB.selector) || elB.selector.includes(elA.selector)) {
          continue;
        }
      }

      const overlapArea = computeAABBOverlapArea(elA.rect, elB.rect);
      if (overlapArea >= minOverlapAreaPx) {
        const isTextCollision = elA.isTextOnly && elB.isTextOnly;
        const severity: 'critical' | 'warning' =
          isTextCollision || (elA.isInteractive && elB.isInteractive) ? 'critical' : 'warning';

        let suggestion = `Element (${elA.selector}) collides with (${elB.selector}) with ${Math.round(overlapArea)}px² overlap. Check flex-wrap, margin, or position absolute constraints.`;
        if (isTextCollision) {
          suggestion = `Text labels (${elA.selector}) and (${elB.selector}) overlap by ${Math.round(overlapArea)}px², making characters illegible. Add flex gap or line wrapping.`;
        }

        issues.push({
          selectorA: elA.selector,
          selectorB: elB.selector,
          boundingBoxA: elA.rect,
          boundingBoxB: elB.rect,
          overlapAreaPx: overlapArea,
          isTextCollision,
          severity,
          suggestion
        });
      }
    }
  }

  return issues;
}
