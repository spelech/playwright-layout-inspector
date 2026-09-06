import { LayoutAuditResult } from '../types';

// ANSI escape codes for clean terminal output formatting
const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

export function formatAuditFailureMessage(audit: LayoutAuditResult, minScore = 80): string {
  const score = audit.uxScore.totalScore;
  const grade = audit.uxScore.grade;

  const header = `${BOLD}${RED}✕ Layout Audit Failed:${RESET} UX Score ${RED}${score}/100${RESET} (Required: ≥ ${minScore}/100) — Grade ${BOLD}${RED}${grade}${RESET}\n`;

  const categoryLines = [
    `  • Viewport & Overflow:    ${audit.uxScore.categories.overflowAndFit.score}/${audit.uxScore.categories.overflowAndFit.maxScore} pts (${audit.uxScore.categories.overflowAndFit.issueCount} issues)`,
    `  • Stability & Shifts:     ${audit.uxScore.categories.stability.score}/${audit.uxScore.categories.stability.maxScore} pts`,
    `  • Touch Ergonomics:       ${audit.uxScore.categories.touchErgonomics.score}/${audit.uxScore.categories.touchErgonomics.maxScore} pts (${audit.uxScore.categories.touchErgonomics.issueCount} issues)`,
    `  • Readability & Occlusion:${audit.uxScore.categories.readabilityAndVisibility.score}/${audit.uxScore.categories.readabilityAndVisibility.maxScore} pts (${audit.uxScore.categories.readabilityAndVisibility.issueCount} issues)`,
    `  • Accessibility & Contrast:${audit.uxScore.categories.accessibilityAndFocus.score}/${audit.uxScore.categories.accessibilityAndFocus.maxScore} pts (${audit.uxScore.categories.accessibilityAndFocus.issueCount} issues)`
  ].join('\n');

  const topIssues: string[] = [];

  // Top viewport overflows
  for (const i of audit.overflowIssues.slice(0, 3)) {
    topIssues.push(`  ${RED}✖${RESET} [Viewport Bleed] ${BOLD}${i.selector}${RESET} bleeds by +${Math.round(i.overflowRightPx)}px\n    ${CYAN}Fix:${RESET} ${i.suggestedFix}`);
  }

  // Top container overflows
  for (const i of audit.containerOverflowIssues.slice(0, 3)) {
    topIssues.push(`  ${RED}✖${RESET} [Container Bleed] ${BOLD}${i.selector}${RESET} in ${i.containerSelector} (+${Math.round(i.overflowRightPx || i.overflowBottomPx || i.overflowLeftPx)}px)\n    ${CYAN}Fix:${RESET} ${i.suggestedFix}`);
  }

  // Top flex blowouts
  for (const i of (audit.flexBlowoutIssues || []).slice(0, 3)) {
    topIssues.push(`  ${RED}✖${RESET} [Flex Blowout] ${BOLD}${i.selector}${RESET} exceeds ${i.parentSelector} (+${Math.round(i.overflowPx)}px)\n    ${CYAN}Fix:${RESET} ${i.suggestion}`);
  }

  // Top sticky occlusions
  for (const i of (audit.stickyOcclusionIssues || []).slice(0, 3)) {
    topIssues.push(`  ${RED}✖${RESET} [Sticky Occlusion] ${BOLD}${i.stickySelector}${RESET} occludes ${i.occludedSelector} (${Math.round(i.overlapRect.width)}x${Math.round(i.overlapRect.height)}px)\n    ${CYAN}Fix:${RESET} ${i.suggestion}`);
  }

  // Top touch targets
  for (const i of audit.touchTargetIssues.slice(0, 3)) {
    topIssues.push(`  ${YELLOW}⚠${RESET} [Touch Target] ${BOLD}${i.selector}${RESET} (${Math.round(i.width)}x${Math.round(i.height)}px < ${i.minRequiredSize}px)\n    ${CYAN}Fix:${RESET} ${i.suggestion}`);
  }

  // Top contrast issues
  for (const i of audit.contrastIssues.slice(0, 3)) {
    topIssues.push(`  ${RED}✖${RESET} [Color Contrast] ${BOLD}${i.selector}${RESET} ratio ${i.contrastRatio}:1 < ${i.requiredRatio}:1\n    ${CYAN}Fix:${RESET} ${i.suggestion}`);
  }

  let result = `${header}\n${BOLD}Category Breakdown:${RESET}\n${categoryLines}\n`;

  if (topIssues.length > 0) {
    result += `\n${BOLD}Primary Detected Issues:${RESET}\n${topIssues.join('\n')}\n`;
  }

  return result;
}

export function formatOverflowFailureMessage(
  overflowIssues: Array<{ selector: string; overflowRightPx: number; suggestedFix: string }>,
  containerIssues: Array<{ selector: string; containerSelector: string; overflowRightPx?: number; overflowBottomPx?: number; suggestedFix: string }> = []
): string {
  const total = overflowIssues.length + containerIssues.length;
  let out = `${BOLD}${RED}✕ Layout Overflow Detected:${RESET} Found ${BOLD}${total}${RESET} overflowing element(s):\n`;

  for (const ov of overflowIssues) {
    out += `  ${RED}✖${RESET} [Viewport Bleed] ${BOLD}${ov.selector}${RESET} (+${Math.round(ov.overflowRightPx)}px)\n    ${CYAN}Fix:${RESET} ${ov.suggestedFix}\n`;
  }

  for (const co of containerIssues) {
    const px = Math.round(co.overflowRightPx || co.overflowBottomPx || 0);
    out += `  ${RED}✖${RESET} [Container Bleed] ${BOLD}${co.selector}${RESET} inside ${co.containerSelector} (+${px}px)\n    ${CYAN}Fix:${RESET} ${co.suggestedFix}\n`;
  }

  return out;
}

export function formatStickyOcclusionFailureMessage(
  issues: Array<{ stickySelector: string; occludedSelector: string; overlapRect: { width: number; height: number }; suggestion: string }>
): string {
  let out = `${BOLD}${RED}✕ Sticky Element Occlusion Detected:${RESET} Found ${BOLD}${issues.length}${RESET} occluded element(s):\n`;
  for (const issue of issues) {
    out += `  ${RED}✖${RESET} ${BOLD}${issue.stickySelector}${RESET} occludes ${BOLD}${issue.occludedSelector}${RESET} (${Math.round(issue.overlapRect.width)}x${Math.round(issue.overlapRect.height)}px)\n    ${CYAN}Fix:${RESET} ${issue.suggestion}\n`;
  }
  return out;
}

export function formatFlexBlowoutFailureMessage(
  issues: Array<{ selector: string; parentSelector: string; overflowPx: number; suggestion: string }>
): string {
  let out = `${BOLD}${RED}✕ Flexbox / Grid Blowout Detected:${RESET} Found ${BOLD}${issues.length}${RESET} blowout element(s):\n`;
  for (const issue of issues) {
    out += `  ${RED}✖${RESET} ${BOLD}${issue.selector}${RESET} blowing out container ${BOLD}${issue.parentSelector}${RESET} (+${Math.round(issue.overflowPx)}px)\n    ${CYAN}Fix:${RESET} ${issue.suggestion}\n`;
  }
  return out;
}
