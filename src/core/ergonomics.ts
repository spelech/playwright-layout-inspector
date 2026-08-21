import { BoundingBox, ThumbZoneAnalysis, ViewportInfo } from '../types';

export type ThumbZone = 'natural' | 'reach' | 'hard';

export function categorizeThumbZone(rect: BoundingBox, viewport: ViewportInfo): ThumbZone {
  const centerY = rect.y + rect.height / 2;

  // On desktop / wide screens, thumb zones don't apply
  if (viewport.width >= 768) {
    return 'natural';
  }

  const screenHeight = viewport.height;
  const yRatio = centerY / screenHeight;

  // Bottom 45% of viewport is Natural zone
  if (yRatio >= 0.55 && yRatio <= 0.95) {
    return 'natural';
  }

  // Middle 30% is Reach zone
  if (yRatio >= 0.25 && yRatio < 0.55) {
    return 'reach';
  }

  // Top 25% is Hard zone (requires hand repositioning)
  return 'hard';
}

export function evaluateThumbZoneErgonomics(
  interactiveElements: Array<{
    selector: string;
    textSnippet?: string;
    rect: BoundingBox;
  }>,
  viewport: ViewportInfo
): ThumbZoneAnalysis {
  if (viewport.width >= 768 || interactiveElements.length === 0) {
    return {
      naturalZoneCount: interactiveElements.length,
      reachZoneCount: 0,
      hardZoneCount: 0,
      totalInteractiveCount: interactiveElements.length,
      hardZoneElements: [],
      ergonomicsScore: 100,
      summary: 'Desktop/tablet viewport: thumb zones not restricted to mobile reach radius.'
    };
  }

  let naturalCount = 0;
  let reachCount = 0;
  let hardCount = 0;
  const hardZoneElements: ThumbZoneAnalysis['hardZoneElements'] = [];

  for (const el of interactiveElements) {
    const zone = categorizeThumbZone(el.rect, viewport);
    if (zone === 'natural') {
      naturalCount++;
    } else if (zone === 'reach') {
      reachCount++;
    } else {
      hardCount++;
      hardZoneElements.push({
        selector: el.selector,
        text: el.textSnippet,
        x: el.rect.x,
        y: el.rect.y
      });
    }
  }

  const total = interactiveElements.length;
  // Natural: 1.0 weight, Reach: 0.8 weight, Hard: 0.5 weight
  const weightedScore = (naturalCount * 1.0 + reachCount * 0.8 + hardCount * 0.5) / total;
  const ergonomicsScore = Math.round(weightedScore * 100);

  let summary = `Mobile thumb ergonomics score: ${ergonomicsScore}/100 (${naturalCount} in Natural zone, ${reachCount} in Reach zone, ${hardCount} in Hard zone).`;
  if (hardCount > naturalCount) {
    summary += ` High concentration of actions at top of screen. Consider placing primary mobile CTAs in bottom navigation or bottom floating sheets.`;
  }

  return {
    naturalZoneCount: naturalCount,
    reachZoneCount: reachCount,
    hardZoneCount: hardCount,
    totalInteractiveCount: total,
    hardZoneElements,
    ergonomicsScore,
    summary
  };
}
