import {
  LayoutShiftResult,
  OcclusionIssue,
  OverflowIssue,
  ReadabilityIssue,
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
}): UXScore {
  const {
    overflowIssues,
    viewportFit,
    layoutShiftResult,
    touchTargetIssues,
    readabilityIssues,
    occlusionIssues
  } = params;

  // 1. Overflow & Fit Category (35% weight)
  const maxOverflowScore = 35;
  let overflowPenalty = 0;

  if (viewportFit.contentBleeds) {
    overflowPenalty += 15;
  }
  if (!viewportFit.isValidMetaViewport) {
    overflowPenalty += 10;
  }
  if (!viewportFit.allowsUserZoom) {
    overflowPenalty += 8;
  }

  for (const issue of overflowIssues) {
    if (issue.severity === 'critical') {
      overflowPenalty += 10;
    } else {
      overflowPenalty += 4;
    }
  }

  const overflowScoreVal = Math.max(0, Math.min(maxOverflowScore, maxOverflowScore - overflowPenalty));
  const overflowGrade = calculateGrade((overflowScoreVal / maxOverflowScore) * 100);
  const totalOverflowIssues = overflowIssues.length + (viewportFit.issues.length);

  const overflowCategory: UXCategoryScore = {
    name: 'Overflow & Viewport Fit',
    score: Math.round(overflowScoreVal * 10) / 10,
    weight: maxOverflowScore,
    maxScore: maxOverflowScore,
    grade: overflowGrade,
    passed: overflowScoreVal >= maxOverflowScore * 0.8,
    issueCount: totalOverflowIssues,
    summary: totalOverflowIssues === 0
      ? 'Perfect viewport fit: no horizontal bleed or clipping detected.'
      : `${totalOverflowIssues} viewport/overflow issues found (bleeds: ${viewportFit.contentBleeds ? 'yes' : 'no'}).`
  };

  // 2. Stability & Layout Shift Category (25% weight)
  const maxStabilityScore = 25;
  let stabilityScoreVal = maxStabilityScore;

  if (layoutShiftResult) {
    let shiftPenalty = 0;
    shiftPenalty += layoutShiftResult.jarringShiftCount * 8;
    shiftPenalty += Math.min(15, layoutShiftResult.totalShiftScore * 100);
    if (!layoutShiftResult.isAcceptable) {
      shiftPenalty = Math.max(shiftPenalty, 10);
    }
    stabilityScoreVal = Math.max(0, Math.min(maxStabilityScore, maxStabilityScore - shiftPenalty));
  }

  const stabilityGrade = calculateGrade((stabilityScoreVal / maxStabilityScore) * 100);
  const stabilityCategory: UXCategoryScore = {
    name: 'Layout Stability & Transitions',
    score: Math.round(stabilityScoreVal * 10) / 10,
    weight: maxStabilityScore,
    maxScore: maxStabilityScore,
    grade: stabilityGrade,
    passed: stabilityScoreVal >= maxStabilityScore * 0.8,
    issueCount: layoutShiftResult ? layoutShiftResult.items.length : 0,
    summary: layoutShiftResult
      ? layoutShiftResult.summary
      : 'Visual layout is stable with no tracked jarring shifts.'
  };

  // 3. Touch Ergonomics Category (20% weight)
  const maxTouchScore = 20;
  let touchPenalty = 0;

  for (const issue of touchTargetIssues) {
    if (issue.severity === 'critical') {
      touchPenalty += 5;
    } else {
      touchPenalty += 2;
    }
  }

  const touchScoreVal = Math.max(0, Math.min(maxTouchScore, maxTouchScore - touchPenalty));
  const touchGrade = calculateGrade((touchScoreVal / maxTouchScore) * 100);
  const touchCategory: UXCategoryScore = {
    name: 'Touch Ergonomics & Accessibility',
    score: Math.round(touchScoreVal * 10) / 10,
    weight: maxTouchScore,
    maxScore: maxTouchScore,
    grade: touchGrade,
    passed: touchScoreVal >= maxTouchScore * 0.8,
    issueCount: touchTargetIssues.length,
    summary: touchTargetIssues.length === 0
      ? 'All interactive touch targets meet accessibility standards (≥ 24px/44px).'
      : `${touchTargetIssues.length} touch target sizing or spacing issues detected.`
  };

  // 4. Readability & Occlusion Category (20% weight)
  const maxReadabilityScore = 20;
  let readabilityPenalty = 0;

  for (const issue of readabilityIssues) {
    if (issue.severity === 'warning') {
      readabilityPenalty += 3;
    } else {
      readabilityPenalty += 1;
    }
  }

  for (const issue of occlusionIssues) {
    if (issue.severity === 'critical') {
      readabilityPenalty += 6;
    } else {
      readabilityPenalty += 3;
    }
  }

  const readabilityScoreVal = Math.max(0, Math.min(maxReadabilityScore, maxReadabilityScore - readabilityPenalty));
  const readabilityGrade = calculateGrade((readabilityScoreVal / maxReadabilityScore) * 100);
  const totalReadabilityIssues = readabilityIssues.length + occlusionIssues.length;

  const readabilityCategory: UXCategoryScore = {
    name: 'Readability & Visual Clarity',
    score: Math.round(readabilityScoreVal * 10) / 10,
    weight: maxReadabilityScore,
    maxScore: maxReadabilityScore,
    grade: readabilityGrade,
    passed: readabilityScoreVal >= maxReadabilityScore * 0.8,
    issueCount: totalReadabilityIssues,
    summary: totalReadabilityIssues === 0
      ? 'Text is legible across viewports without unintentional truncation or occlusion.'
      : `${totalReadabilityIssues} readability or element occlusion issues found.`
  };

  // Calculate total score
  const totalScoreVal = Math.round((overflowScoreVal + stabilityScoreVal + touchScoreVal + readabilityScoreVal) * 10) / 10;
  const overallGrade = calculateGrade(totalScoreVal);
  const passed = totalScoreVal >= 80 && overflowScoreVal >= (maxOverflowScore * 0.7) && touchScoreVal >= (maxTouchScore * 0.7);

  return {
    totalScore: totalScoreVal,
    grade: overallGrade,
    passed,
    categories: {
      overflowAndFit: overflowCategory,
      stability: stabilityCategory,
      touchErgonomics: touchCategory,
      readabilityAndVisibility: readabilityCategory
    }
  };
}
