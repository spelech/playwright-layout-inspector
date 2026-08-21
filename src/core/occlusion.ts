import { BoundingBox, OcclusionIssue } from '../types';

export interface PointSample {
  x: number;
  y: number;
}

export function generateRaycastSamplePoints(rect: BoundingBox): PointSample[] {
  const insetX = Math.min(4, rect.width * 0.1);
  const insetY = Math.min(4, rect.height * 0.1);

  return [
    { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }, // Center
    { x: rect.x + insetX, y: rect.y + insetY }, // Top-Left
    { x: rect.right - insetX, y: rect.y + insetY }, // Top-Right
    { x: rect.x + insetX, y: rect.bottom - insetY }, // Bottom-Left
    { x: rect.right - insetX, y: rect.bottom - insetY } // Bottom-Right
  ];
}

export function evaluateElementOcclusion(
  target: {
    selector: string;
    tagName: string;
    boundingBox: BoundingBox;
    isInteractive: boolean;
  },
  raycastResults: {
    point: PointSample;
    topSelector: string;
    topTagName: string;
    isTargetOrDescendant: boolean;
  }[]
): OcclusionIssue | null {
  if (!target.isInteractive || raycastResults.length === 0) {
    return null;
  }

  const occludedPoints = raycastResults.filter(r => !r.isTargetOrDescendant);
  if (occludedPoints.length === 0) {
    return null;
  }

  const occludedAreaRatio = Math.round((occludedPoints.length / raycastResults.length) * 100) / 100;
  const primaryOccluder = occludedPoints[0];

  const severity: 'critical' | 'warning' = occludedAreaRatio >= 0.5 ? 'critical' : 'warning';
  const suggestion = `Element <${target.tagName}> (${target.selector}) has ${Math.round(occludedAreaRatio * 100)}% of its interactive click area occluded by <${primaryOccluder.topTagName}> (${primaryOccluder.topSelector}). Check z-index, fixed/sticky navigation overlays, or pointer-events: none.`;

  return {
    selector: target.selector,
    tagName: target.tagName,
    boundingBox: target.boundingBox,
    occludedBySelector: primaryOccluder.topSelector,
    occludedByTagName: primaryOccluder.topTagName,
    occludedPointsCount: occludedPoints.length,
    totalPointsChecked: raycastResults.length,
    occludedAreaRatio,
    isInteractive: target.isInteractive,
    severity,
    suggestion
  };
}
