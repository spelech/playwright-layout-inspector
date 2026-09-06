/**
 * Visual container detection and container overflow boundary scanning.
 */
export interface VisualContainerInfo {
  element: Element;
  selector: string;
  tagName: string;
  rect: DOMRect;
  innerBox: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    width: number;
    height: number;
  };
  comp: CSSStyleDeclaration;
}

export function isVisualContainer(targetEl: Element, style: CSSStyleDeclaration): boolean {
  const t = targetEl.tagName.toLowerCase();
  if (t === 'body' || t === 'html') return false;

  // 1. Semantic container tags
  const semantic = ['dialog', 'fieldset', 'form', 'aside', 'section', 'article', 'main', 'nav', 'details', 'table'];
  if (semantic.includes(t)) return true;

  // 2. Container ARIA roles
  const r = targetEl.getAttribute('role');
  if (r && ['dialog', 'alertdialog', 'region', 'tabpanel', 'group', 'form'].includes(r)) return true;

  // 3. Container class names
  const c = (typeof targetEl.className === 'string' ? targetEl.className : '').toLowerCase();
  if (/modal|card|panel|dialog|drawer|sheet|popup|box|container|wrapper|frame|window|tabpanel/.test(c)) {
    return true;
  }

  // 4. Styled boundaries (explicit background, visible border, shadow, radius, or constrained layout)
  const hasBg = !!(style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent');
  const hasBorder = !!((parseFloat(style.borderTopWidth || '0') > 0 || parseFloat(style.borderWidth || '0') > 0) && style.borderStyle !== 'none');
  const hasShadow = !!(style.boxShadow && style.boxShadow !== 'none');
  const hasRadius = parseFloat(style.borderRadius || '0') > 0;
  const hasOverflow = style.overflow !== 'visible' || style.overflowX !== 'visible' || style.overflowY !== 'visible';
  const hasConstrainedWidth = !!((style.width && style.width.includes('px')) || (style.maxWidth && style.maxWidth !== 'none'));

  return Boolean((hasBg || hasBorder || hasShadow || hasRadius || hasOverflow) && hasConstrainedWidth);
}

export function getClosestVisualContainer(
  el: Element,
  selectorFn: (el: Element) => string
): VisualContainerInfo | null {
  let curr = el.parentElement;
  while (curr && curr.tagName.toLowerCase() !== 'html' && curr.tagName.toLowerCase() !== 'body') {
    const comp = window.getComputedStyle(curr);
    if (isVisualContainer(curr, comp)) {
      const cRect = curr.getBoundingClientRect();
      const pt = parseFloat(comp.paddingTop) || 0;
      const pr = parseFloat(comp.paddingRight) || 0;
      const pb = parseFloat(comp.paddingBottom) || 0;
      const pl = parseFloat(comp.paddingLeft) || 0;
      const bt = parseFloat(comp.borderTopWidth) || 0;
      const br = parseFloat(comp.borderRightWidth) || 0;
      const bb = parseFloat(comp.borderBottomWidth) || 0;
      const bl = parseFloat(comp.borderLeftWidth) || 0;

      const innerTop = cRect.top + bt + pt;
      const innerRight = cRect.right - br - pr;
      const innerBottom = cRect.bottom - bb - pb;
      const innerLeft = cRect.left + bl + pl;

      return {
        element: curr,
        selector: selectorFn(curr),
        tagName: curr.tagName.toLowerCase(),
        rect: cRect,
        innerBox: {
          top: Math.round(innerTop * 100) / 100,
          right: Math.round(innerRight * 100) / 100,
          bottom: Math.round(innerBottom * 100) / 100,
          left: Math.round(innerLeft * 100) / 100,
          width: Math.round(Math.max(0, innerRight - innerLeft) * 100) / 100,
          height: Math.round(Math.max(0, innerBottom - innerTop) * 100) / 100
        },
        comp
      };
    }
    curr = curr.parentElement;
  }
  return null;
}

export function checkExemption(
  el: Element,
  comp: CSSStyleDeclaration,
  containerComp: CSSStyleDeclaration
): boolean {
  if (comp.position === 'fixed') return true;

  // Popover / Tooltip / Dropdown check
  if (el.hasAttribute('popover') || (el as any).popover) return true;
  const role = el.getAttribute('role') || '';
  if (['tooltip', 'menu', 'listbox', 'dialog', 'alertdialog'].includes(role)) return true;

  const cls = (typeof el.className === 'string' ? el.className : '').toLowerCase();
  if (/tooltip|popover|dropdown|menu|toast|floating|popper|modal-backdrop|select-options|tippy-box/.test(cls)) {
    return true;
  }

  // Corner controls (e.g. .btn-close, .close-btn, [aria-label="Close"])
  const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
  if (
    /close|btn-close|dismiss|badge|indicator|pill|tag/.test(cls) ||
    ariaLabel.includes('close') ||
    ariaLabel.includes('dismiss')
  ) {
    if (comp.position === 'absolute') {
      return true;
    }
  }

  // Container scrollable in both dimensions
  if (
    (containerComp.overflowX === 'auto' || containerComp.overflowX === 'scroll') &&
    (containerComp.overflowY === 'auto' || containerComp.overflowY === 'scroll')
  ) {
    return true;
  }

  // Decorative / sr-only / aria-hidden
  if (el.getAttribute('aria-hidden') === 'true' && comp.pointerEvents === 'none') {
    return true;
  }

  return false;
}
