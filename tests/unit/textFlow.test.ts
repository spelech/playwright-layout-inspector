import { describe, it, expect } from 'vitest';
import { evaluateTextFlow, generateTextFlowRemediation } from '../../src/core/textFlow';

describe('Text Flow & Wrap Anomaly Engine', () => {
  it('detects awkward mid-word breaks and generates remediations', () => {
    const issue = evaluateTextFlow({
      selector: '.unconstrained-text',
      tagName: 'p',
      textSnippet: 'Authentica tion process completed',
      anomalyType: 'mid-word-break',
      word: 'Authentication',
      computedStyles: {
        wordBreak: 'break-all',
        overflowWrap: 'anywhere'
      }
    });

    expect(issue.anomalyType).toBe('mid-word-break');
    expect(issue.severity).toBe('critical');
    expect(issue.details).toContain('Authentication');
    expect(issue.details).toContain('word-break: break-all');
    expect(issue.suggestedFix).toContain('Remove \'word-break: break-all\'');
    expect(issue.suggestedFix).toContain('overflow-wrap: break-word');
  });

  it('detects broken multi-line buttons and suggests white-space: nowrap', () => {
    const issue = evaluateTextFlow({
      selector: '#submit-btn',
      tagName: 'button',
      textSnippet: 'Submit Order Now',
      anomalyType: 'broken-multiline-button',
      lineCount: 2,
      orphanText: 'Now',
      lastLineWordCount: 1,
      computedStyles: {
        whiteSpace: 'normal'
      }
    });

    expect(issue.anomalyType).toBe('broken-multiline-button');
    expect(issue.severity).toBe('critical');
    expect(issue.details).toContain('Submit Order Now');
    expect(issue.details).toContain('wraps across 2 lines');
    expect(issue.suggestedFix).toContain('white-space: nowrap');
  });

  it('detects orphan wrap on headings and suggests text-wrap: balance', () => {
    const issue = evaluateTextFlow({
      selector: 'h1.hero-title',
      tagName: 'h1',
      textSnippet: 'Build Beautiful Scalable Web Apps Fast',
      anomalyType: 'orphan-wrap',
      orphanText: 'Fast',
      lineCount: 2,
      lastLineWordCount: 1,
      computedStyles: {
        textWrap: 'normal',
        whiteSpace: 'normal'
      }
    });

    expect(issue.anomalyType).toBe('orphan-wrap');
    expect(issue.severity).toBe('warning');
    expect(issue.details).toContain('orphan word ("Fast")');
    expect(issue.suggestedFix).toContain('text-wrap: balance');
  });

  it('detects crushed flex columns with truncated content', () => {
    const issue = evaluateTextFlow({
      selector: '.form-col-email',
      tagName: 'div',
      textSnippet: 'user.primary.email@enterprise.corp',
      anomalyType: 'crushed-flex-column',
      elementWidth: 42,
      scrollWidth: 260,
      clientWidth: 42,
      computedStyles: {
        display: 'flex',
        flex: '0 1 auto'
      }
    });

    expect(issue.anomalyType).toBe('crushed-flex-column');
    expect(issue.severity).toBe('critical');
    expect(issue.details).toContain('crushed to 42px width');
    expect(issue.suggestedFix).toContain('flex: 1 1 0; min-width: 120px;');
  });
});
