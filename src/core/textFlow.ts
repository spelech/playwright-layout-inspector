import { TextFlowAnomalyType, TextFlowIssue } from '../types';

export interface RawTextFlowAnomaly {
  selector: string;
  tagName: string;
  textSnippet: string;
  anomalyType: TextFlowAnomalyType;
  word?: string;
  orphanText?: string;
  lineCount?: number;
  lastLineWordCount?: number;
  elementWidth?: number;
  scrollWidth?: number;
  clientWidth?: number;
  computedStyles?: {
    wordBreak?: string;
    overflowWrap?: string;
    whiteSpace?: string;
    textWrap?: string;
    display?: string;
    flex?: string;
  };
}

export function generateTextFlowRemediation(anomaly: RawTextFlowAnomaly): {
  details: string;
  suggestedFix: string;
  severity: 'critical' | 'warning';
} {
  const {
    selector,
    tagName,
    textSnippet,
    anomalyType,
    word,
    orphanText,
    lineCount,
    elementWidth,
    computedStyles
  } = anomaly;

  switch (anomalyType) {
    case 'mid-word-break': {
      const brokenWord = word || textSnippet;
      const details = `Word "${brokenWord}" in <${tagName}> (${selector}) is awkwardly broken across multiple lines without a hyphen due to 'word-break: break-all' or insufficient container width.`;
      const suggestedFix = `Remove 'word-break: break-all' and use 'overflow-wrap: break-word' or 'hyphens: auto'. Ensure container has sufficient min-width (e.g., 'min-width: fit-content').`;
      const severity: 'critical' | 'warning' =
        computedStyles?.wordBreak === 'break-all' ? 'critical' : 'warning';
      return { details, suggestedFix, severity };
    }

    case 'broken-multiline-button': {
      const details = `Interactive button <${tagName}> (${selector}) has text "${textSnippet}" that awkwardly wraps across ${lineCount || 2} lines (trailing: "${orphanText || ''}").`;
      const suggestedFix = `Set 'white-space: nowrap' or increase button min-width / padding (e.g. min-w-fit, px-4) so the button label stays on a single line.`;
      return { details, suggestedFix, severity: 'critical' };
    }

    case 'orphan-wrap': {
      const details = `<${tagName}> (${selector}) text leaves a single orphan word ("${orphanText || ''}") on the last line.`;
      const suggestedFix = `Apply 'text-wrap: balance' or 'text-wrap: pretty' to balance line lengths, or widen the container boundary.`;
      return { details, suggestedFix, severity: 'warning' };
    }

    case 'crushed-flex-column': {
      const width = elementWidth ? Math.round(elementWidth) : 0;
      const details = `Flex column <${tagName}> (${selector}) is crushed to ${width}px width, causing text clipping or overflowing content in a multi-column row.`;
      const suggestedFix = `Set 'flex: 1 1 0; min-width: 120px;' on flex items, or add 'flex-wrap: wrap' on the parent container.`;
      return { details, suggestedFix, severity: 'critical' };
    }

    default: {
      return {
        details: `Text flow anomaly detected in <${tagName}> (${selector}).`,
        suggestedFix: `Check line wrapping and container constraints.`,
        severity: 'warning'
      };
    }
  }
}

export function evaluateTextFlow(anomaly: RawTextFlowAnomaly): TextFlowIssue {
  const remediation = generateTextFlowRemediation(anomaly);

  return {
    selector: anomaly.selector,
    tagName: anomaly.tagName,
    textSnippet: anomaly.textSnippet,
    anomalyType: anomaly.anomalyType,
    details: remediation.details,
    lineCount: anomaly.lineCount,
    lastLineWordCount: anomaly.lastLineWordCount,
    orphanText: anomaly.orphanText,
    computedStyles: anomaly.computedStyles,
    severity: remediation.severity,
    suggestedFix: remediation.suggestedFix
  };
}
