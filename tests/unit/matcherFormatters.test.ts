import { describe, it, expect } from 'vitest';
import {
  formatAuditFailureMessage,
  formatOverflowFailureMessage,
  formatStickyOcclusionFailureMessage,
  formatFlexBlowoutFailureMessage
} from '../../src/playwright/matcherFormatters';

describe('matcherFormatters', () => {
  it('formats audit failure message with score and breakdown', () => {
    const mockAudit: any = {
      uxScore: {
        totalScore: 62,
        grade: 'D',
        categories: {
          overflowAndFit: { score: 15, maxScore: 25, issueCount: 2 },
          stability: { score: 20, maxScore: 20, issueCount: 0 },
          touchErgonomics: { score: 12, maxScore: 20, issueCount: 3 },
          readabilityAndVisibility: { score: 8, maxScore: 20, issueCount: 2 },
          accessibilityAndFocus: { score: 7, maxScore: 15, issueCount: 1 }
        }
      },
      overflowIssues: [
        { selector: '#hero-img', overflowRightPx: 84, suggestedFix: 'max-width: 100%' }
      ],
      containerOverflowIssues: [],
      flexBlowoutIssues: [],
      stickyOcclusionIssues: [],
      touchTargetIssues: [
        { selector: 'button#icon', width: 18, height: 18, minRequiredSize: 24, suggestion: 'Increase size' }
      ],
      contrastIssues: []
    };

    const msg = formatAuditFailureMessage(mockAudit, 80);
    expect(msg).toContain('Layout Audit Failed');
    expect(msg).toContain('62/100');
    expect(msg).toContain('Grade');
    expect(msg).toContain('#hero-img');
    expect(msg).toContain('max-width: 100%');
  });

  it('formats overflow failure message', () => {
    const msg = formatOverflowFailureMessage(
      [{ selector: '.card', overflowRightPx: 25, suggestedFix: 'overflow: hidden' }],
      []
    );
    expect(msg).toContain('Layout Overflow Detected');
    expect(msg).toContain('.card');
    expect(msg).toContain('+25px');
  });

  it('formats sticky occlusion failure message', () => {
    const msg = formatStickyOcclusionFailureMessage([
      {
        stickySelector: 'header.navbar',
        occludedSelector: 'input#search',
        overlapRect: { width: 120, height: 35 },
        suggestion: 'Add padding'
      }
    ]);
    expect(msg).toContain('Sticky Element Occlusion Detected');
    expect(msg).toContain('header.navbar');
    expect(msg).toContain('input#search');
  });

  it('formats flex blowout failure message', () => {
    const msg = formatFlexBlowoutFailureMessage([
      {
        selector: 'div.sidebar',
        parentSelector: 'div.container',
        overflowPx: 50,
        suggestion: 'min-width: 0'
      }
    ]);
    expect(msg).toContain('Flexbox / Grid Blowout Detected');
    expect(msg).toContain('div.sidebar');
    expect(msg).toContain('min-width: 0');
  });
});
