import { describe, it, expect } from 'vitest';
import { evaluateAccessibleName, evaluateFocusIndicator } from '../../src/core/accessibility';

describe('Accessibility and Focus Analyzer', () => {
  it('detects icon button missing accessible name', () => {
    const el = {
      selector: '#delete-btn',
      tagName: 'button',
      role: 'button',
      innerText: '',
      hasSvgOrImgChild: true
    };

    const issue = evaluateAccessibleName(el);
    expect(issue).not.toBeNull();
    expect(issue?.isIconOnly).toBe(true);
    expect(issue?.severity).toBe('critical');
  });

  it('passes icon button with aria-label', () => {
    const el = {
      selector: '#close-btn',
      tagName: 'button',
      role: 'button',
      ariaLabel: 'Close Dialog',
      innerText: '',
      hasSvgOrImgChild: true
    };

    const issue = evaluateAccessibleName(el);
    expect(issue).toBeNull();
  });

  it('detects missing focus ring when outline is none and no boxShadow', () => {
    const el = {
      selector: '#input-email',
      tagName: 'input',
      outlineWidth: '0px',
      outlineStyle: 'none',
      outlineColor: 'transparent',
      boxShadow: 'none',
      isFocused: false
    };

    const issue = evaluateFocusIndicator(el);
    expect(issue).not.toBeNull();
    expect(issue?.hasVisibleFocusRing).toBe(false);
  });
});
