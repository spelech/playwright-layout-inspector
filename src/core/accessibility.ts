import { AccessibleNameIssue, FocusIndicatorIssue } from '../types';

export function evaluateAccessibleName(element: {
  selector: string;
  tagName: string;
  role?: string | null;
  ariaLabel?: string | null;
  ariaLabelledBy?: string | null;
  title?: string | null;
  innerText: string;
  hasSvgOrImgChild: boolean;
}): AccessibleNameIssue | null {
  const role = element.role || element.tagName.toLowerCase();
  const isInteractive = ['button', 'a', 'input', 'select', 'textarea', 'tab', 'menuitem'].includes(role) || element.role === 'button';

  if (!isInteractive) {
    return null;
  }

  const hasAriaLabel = !!(element.ariaLabel && element.ariaLabel.trim().length > 0);
  const hasAriaLabelledBy = !!(element.ariaLabelledBy && element.ariaLabelledBy.trim().length > 0);
  const hasTitle = !!(element.title && element.title.trim().length > 0);
  const hasText = !!(element.innerText && element.innerText.trim().length > 0);

  const hasAccessibleName = hasAriaLabel || hasAriaLabelledBy || hasTitle || hasText;
  const isIconOnly = element.hasSvgOrImgChild && !hasText;

  if (hasAccessibleName) {
    return null;
  }

  const severity: 'critical' | 'warning' = isIconOnly ? 'critical' : 'warning';
  const suggestion = isIconOnly
    ? `Icon button <${element.tagName}> (${element.selector}) has no accessible text or label. Add 'aria-label="Action Name"' or 'title="Action Name"' for screen reader users.`
    : `Interactive element <${element.tagName}> (${element.selector}) is missing an accessible name. Add visible label or aria-label attribute.`;

  return {
    selector: element.selector,
    tagName: element.tagName,
    isIconOnly,
    computedRole: role,
    textSnippet: element.innerText || undefined,
    severity,
    suggestion
  };
}

export function evaluateFocusIndicator(element: {
  selector: string;
  tagName: string;
  outlineWidth: string;
  outlineStyle: string;
  outlineColor: string;
  boxShadow: string;
  isFocused: boolean;
}): FocusIndicatorIssue | null {
  const hasOutline = parseFloat(element.outlineWidth) > 0 && element.outlineStyle !== 'none' && element.outlineColor !== 'transparent';
  const hasBoxShadow = element.boxShadow && element.boxShadow !== 'none' && !element.boxShadow.includes('rgba(0, 0, 0, 0)');

  const hasVisibleFocusRing = hasOutline || hasBoxShadow;

  if (hasVisibleFocusRing) {
    return null;
  }

  return {
    selector: element.selector,
    tagName: element.tagName,
    hasVisibleFocusRing: false,
    computedOutline: `${element.outlineWidth} ${element.outlineStyle} ${element.outlineColor}`,
    computedBoxShadow: element.boxShadow,
    severity: 'warning',
    suggestion: `Element (${element.selector}) removes default focus ring ('outline: none') without providing a visible focus indicator (like 'focus-visible:ring-2 focus-visible:ring-indigo-500' or border). Keyboard users cannot track active focus.`
  };
}
