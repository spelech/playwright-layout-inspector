import { BoundingBox, LayoutShiftItem, LayoutShiftResult, ViewportInfo } from '../types';

export interface ElementSnapshot {
  selector: string;
  tagName: string;
  id?: string;
  className?: string;
  textSnippet?: string;
  rect: BoundingBox;
}

export function computeElementDisplacement(
  before: ElementSnapshot,
  after: ElementSnapshot,
  viewport: ViewportInfo
): LayoutShiftItem | null {
  const deltaX = after.rect.x - before.rect.x;
  const deltaY = after.rect.y - before.rect.y;
  const distance = Math.hypot(deltaX, deltaY);

  // If movement is negligible (< 1px), ignore
  if (distance < 1.0) {
    return null;
  }

  const viewportArea = viewport.width * viewport.height;
  const elementArea = before.rect.width * before.rect.height;
  const areaRatio = Math.min(1.0, elementArea / viewportArea);

  // Distance fraction relative to viewport max dimension
  const maxViewportDim = Math.max(viewport.width, viewport.height);
  const distanceFraction = distance / maxViewportDim;

  // Impact score formula inspired by Web Vitals CLS: area ratio * distance fraction
  const impactScore = Math.round((areaRatio * distanceFraction) * 10000) / 10000;

  // Jarring threshold: movement > 20px or impact score > 0.02
  const isJarring = distance > 20 || impactScore > 0.02;

  let explanation = `Element shifted by Δx: ${Math.round(deltaX)}px, Δy: ${Math.round(deltaY)}px (total distance: ${Math.round(distance)}px).`;
  if (Math.abs(deltaY) > 20 && Math.abs(deltaX) <= 5) {
    explanation = `Vertical jump of ${Math.round(Math.abs(deltaY))}px detected (likely caused by accordion, drawer, or modal expanding/collapsing).`;
  } else if (Math.abs(deltaX) > 20 && Math.abs(deltaY) <= 5) {
    explanation = `Horizontal slide/jump of ${Math.round(Math.abs(deltaX))}px detected.`;
  }

  return {
    selector: before.selector,
    tagName: before.tagName,
    id: before.id,
    className: before.className,
    textSnippet: before.textSnippet,
    beforeRect: before.rect,
    afterRect: after.rect,
    deltaX: Math.round(deltaX * 100) / 100,
    deltaY: Math.round(deltaY * 100) / 100,
    distance: Math.round(distance * 100) / 100,
    areaRatio: Math.round(areaRatio * 1000) / 1000,
    impactScore,
    isJarring,
    explanation
  };
}

export function evaluateLayoutShift(
  beforeSnapshots: ElementSnapshot[],
  afterSnapshots: ElementSnapshot[],
  viewport: ViewportInfo,
  options?: { maxAcceptableScore?: number; maxAcceptableDisplacement?: number }
): LayoutShiftResult {
  const maxAcceptableScore = options?.maxAcceptableScore ?? 0.05;
  const maxAcceptableDisplacement = options?.maxAcceptableDisplacement ?? 15;

  const afterMap = new Map<string, ElementSnapshot>();
  for (const snap of afterSnapshots) {
    afterMap.set(snap.selector, snap);
  }

  const items: LayoutShiftItem[] = [];
  let totalShiftScore = 0;
  let maxDisplacementPx = 0;
  let jarringShiftCount = 0;

  for (const before of beforeSnapshots) {
    const after = afterMap.get(before.selector);
    if (!after) continue;

    const shift = computeElementDisplacement(before, after, viewport);
    if (shift) {
      items.push(shift);
      totalShiftScore += shift.impactScore;
      if (shift.distance > maxDisplacementPx) {
        maxDisplacementPx = shift.distance;
      }
      if (shift.isJarring) {
        jarringShiftCount++;
      }
    }
  }

  // Sort by impact score descending
  items.sort((a, b) => b.impactScore - a.impactScore);

  const roundedScore = Math.round(totalShiftScore * 10000) / 10000;
  const isAcceptable = roundedScore <= maxAcceptableScore && maxDisplacementPx <= maxAcceptableDisplacement && jarringShiftCount === 0;

  let summary = `Layout is visually stable (Shift Score: ${roundedScore}, Max Jump: ${Math.round(maxDisplacementPx)}px).`;
  if (!isAcceptable) {
    summary = `Jarring layout instability detected: ${items.length} elements shifted, max displacement was ${Math.round(maxDisplacementPx)}px with ${jarringShiftCount} jarring shifts (Score: ${roundedScore}).`;
  }

  return {
    totalShiftScore: roundedScore,
    totalDisplacedElements: items.length,
    maxDisplacementPx: Math.round(maxDisplacementPx * 100) / 100,
    jarringShiftCount,
    items,
    isAcceptable,
    summary
  };
}
