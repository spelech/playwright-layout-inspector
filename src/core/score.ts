import {
  AccessibleNameIssue,
  ElementCollisionIssue,
  FocusIndicatorIssue,
  LayoutShiftResult,
  OcclusionIssue,
  OverflowIssue,
  ReadabilityIssue,
  ScrollTrapIssue,
  ThumbZoneAnalysis,
  TouchTargetIssue,
  UXCategoryScore,
  UXGrade,
  UXScore,
  ViewportFitResult
} from '../types';

export function calculateGrade(score: number): UXGrade {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export function computeUXScore(params: {
  overflowIssues: OverflowIssue[];
  viewportFit: ViewportFitResult;
  layoutShiftResult?: LayoutShiftResult;
  touchTargetIssues: TouchTargetIssue[];
  readabilityIssues: ReadabilityIssue[];
  occlusionIssues: OcclusionIssue[];
  collisionIssues?: ElementCollisionIssue[];
  scrollTrapIssues?: ScrollTrapIssue[];
  accessibleNameIssues?: AccessibleNameIssue[];
  focusIndicatorIssues?: FocusIndicatorIssue[];
  thumbZoneAnalysis?: ThumbZoneAnalysis;
}): UXScore {
  const {
    overflowIssues,
    viewportFit,
    layoutShiftResult,
    touchTargetIssues,
    readabilityIssues,
    occlusionIssues,
    collisionIssues = [],
    scrollTrapIssues = [],
    accessibleNameIssues = [],
    focusIndicatorIssues = [],
    thumbZoneAnalysis
  } = params;

  // 1. Overflow & Fit Category (25% weight)
  const maxOverflowScore = 25;
  let overflowPenalty = 0;

  if (viewportFit.contentBleeds) overflowPenalty += 12;
  if (!viewportFit.isValidMetaViewport) overflowPenalty += 8;
  if (!viewportFit.allowsUserZoom) overflowPenalty += 6;

  for (const issue of overflowIssues) {
    overflowPenalty += (issue.severity === 'critical' ? 8 : 3);
  }
  for (const trap of scrollTrapIssues) {
    overflowPenalty += (trap.severity === 'critical' ? 6 : 2);
  }

  const overflowScoreVal = Math.max(0, Math.min(maxOverflowScore, maxOverflowScore - overflowPenalty));
  const overflowCategory: UXCategoryScore = {
    name: 'Overflow & Viewport Fit',
    score: Math.round(overflowScoreVal * 10) / 10,
    weight: maxOverflowScore,
    maxScore: maxOverflowScore,
    grade: calculateGrade((overflowScoreVal / maxOverflowScore) * 100),
    passed: overflowScoreVal >= maxOverflowScore * 0.8,
    issueCount: overflowIssues.length + scrollTrapIssues.length + viewportFit.issues.length,
    summary: overflowIssues.length === 0 && scrollTrapIssues.length === 0 && !viewportFit.contentBleeds
      ? 'Perfect viewport fit without horizontal overflow or scroll traps.'
      : `${overflowIssues.length} overflow, ${scrollTrapIssues.length} scroll trap issues detected.`
  };

  // 2. Stability & Layout Shift Category (20% weight)
  const maxStabilityScore = 20;
  let stabilityScoreVal = maxStabilityScore;

  if (layoutShiftResult) {
    let shiftPenalty = 0;
    shiftPenalty += layoutShiftResult.jarringShiftCount * 6;
    shiftPenalty += Math.min(12, layoutShiftResult.totalShiftScore * 100);
    if (!layoutShiftResult.isAcceptable) {
      shiftPenalty = Math.max(shiftPenalty, 8);
    }
    stabilityScoreVal = Math.max(0, Math.min(maxStabilityScore, maxStabilityScore - shiftPenalty));
  }

  const stabilityCategory: UXCategoryScore = {
    name: 'Layout Stability & Shifts',
    score: Math.round(stabilityScoreVal * 10) / 10,
    weight: maxStabilityScore,
    maxScore: maxStabilityScore,
    grade: calculateGrade((stabilityScoreVal / maxStabilityScore) * 100),
    passed: stabilityScoreVal >= maxStabilityScore * 0.8,
    issueCount: layoutShiftResult ? layoutShiftResult.items.length : 0,
    summary: layoutShiftResult ? layoutShiftResult.summary : 'Visual layout is stable without jarring element jumps.'
  };

  // 3. Touch Ergonomics & Reachability (20% weight)
  const maxTouchScore = 20;
  let touchPenalty = 0;

  for (const issue of touchTargetIssues) {
    touchPenalty += (issue.severity === 'critical' ? 4 : 2);
  }
  if (thumbZoneAnalysis && thumbZoneAnalysis.ergonomicsScore < 70) {
    touchPenalty += 3;
  }

  const touchScoreVal = Math.max(0, Math.min(maxTouchScore, maxTouchScore - touchPenalty));
  const touchCategory: UXCategoryScore = {
    name: 'Touch Ergonomics & Reachability',
    score: Math.round(touchScoreVal * 10) / 10,
    weight: maxTouchScore,
    maxScore: maxTouchScore,
    grade: calculateGrade((touchScoreVal / maxTouchScore) * 100),
    passed: touchScoreVal >= maxTouchScore * 0.8,
    issueCount: touchTargetIssues.length,
    summary: touchTargetIssues.length === 0
      ? 'All interactive touch targets meet WCAG sizing standards (≥ 24px/44px).'
      : `${touchTargetIssues.length} touch target sizing or collision issues detected.`
  };

  // 4. Readability, Collisions & Visibility (20% weight)
  const maxReadabilityScore = 20;
  let readabilityPenalty = 0;

  for (const issue of readabilityIssues) {
    readabilityPenalty += (issue.severity === 'warning' ? 2 : 1);
  }
  for (const occ of occlusionIssues) {
    readabilityPenalty += (occ.severity === 'critical' ? 5 : 2);
  }
  for (const col of collisionIssues) {
    readabilityPenalty += (col.severity === 'critical' ? 5 : 2);
  }

  const readabilityScoreVal = Math.max(0, Math.min(maxReadabilityScore, maxReadabilityScore - readabilityPenalty));
  const totalVisibilityIssues = readabilityIssues.length + occlusionIssues.length + collisionIssues.length;
  const readabilityCategory: UXCategoryScore = {
    name: 'Readability & Visual Hierarchy',
    score: Math.round(readabilityScoreVal * 10) / 10,
    weight: maxReadabilityScore,
    maxScore: maxReadabilityScore,
    grade: calculateGrade((readabilityScoreVal / maxReadabilityScore) * 100),
    passed: readabilityScoreVal >= maxReadabilityScore * 0.8,
    issueCount: totalVisibilityIssues,
    summary: totalVisibilityIssues === 0
      ? 'Clean visual hierarchy without element occlusion, text collision, or unreadable truncation.'
      : `${totalVisibilityIssues} text, occlusion, or collision issue(s) detected.`
  };

  // 5. Accessibility & Keyboard Navigation (15% weight)
  const maxA11yScore = 15;
  let a11yPenalty = 0;

  for (const acc of accessibleNameIssues) {
    a11yPenalty += (acc.severity === 'critical' ? 4 : 2);
  }
  for (const foc of focusIndicatorIssues) {
    a11yPenalty += (foc.severity === 'critical' ? 4 : 2);
  }

  const a11yScoreVal = Math.max(0, Math.min(maxA11yScore, maxA11yScore - a11yPenalty));
  const totalA11yIssues = accessibleNameIssues.length + focusIndicatorIssues.length;
  const a11yCategory: UXCategoryScore = {
    name: 'Accessibility & Keyboard Navigation',
    score: Math.round(a11yScoreVal * 10) / 10,
    weight: maxA11yScore,
    maxScore: maxA11yScore,
    grade: calculateGrade((a11yScoreVal / maxA11yScore) * 100),
    passed: a11yScoreVal >= maxA11yScore * 0.8,
    issueCount: totalA11yIssues,
    summary: totalA11yIssues === 0
      ? 'Accessible names on all icon buttons and visible keyboard focus rings.'
      : `${totalA11yIssues} missing label or focus ring issue(s) detected.`
  };

  // Total Score
  const totalScoreVal = Math.round((overflowScoreVal + stabilityScoreVal + touchScoreVal + readabilityScoreVal + a11yScoreVal) * 10) / 10;
  const overallGrade = calculateGrade(totalScoreVal);
  const passed = totalScoreVal >= 70 && overflowScoreVal >= (maxOverflowScore * 0.6) && touchScoreVal >= (maxTouchScore * 0.6);

  return {
    totalScore: totalScoreVal,
    grade: overallGrade,
    passed,
    categories: {
      overflowAndFit: overflowCategory,
      stability: stabilityCategory,
      touchErgonomics: touchCategory,
      readabilityAndVisibility: readabilityCategory,
      accessibilityAndFocus: a11yCategory
    }
  };
}
