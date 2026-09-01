import { BoundingBox, ContainerInnerBox, ContainerOverflowIssue, ElementComputedStyles } from '../types';

export function calculateContainerOverflow(
  childRect: BoundingBox,
  containerInnerBox: ContainerInnerBox,
  thresholdPx = 1.5
): {
  overflowRightPx: number;
  overflowBottomPx: number;
  overflowLeftPx: number;
  overflowTopPx: number;
  hasOverflow: boolean;
} {
  const overflowRightPx = Math.max(0, childRect.right - containerInnerBox.right);
  const overflowBottomPx = Math.max(0, childRect.bottom - containerInnerBox.bottom);
  const overflowLeftPx = Math.max(0, containerInnerBox.left - childRect.left);
  const overflowTopPx = Math.max(0, containerInnerBox.top - childRect.top);

  // Horizontal bleed or vertical bleed exceeding threshold
  const hasOverflow =
    overflowRightPx > thresholdPx ||
    overflowLeftPx > thresholdPx ||
    overflowBottomPx > thresholdPx;

  return {
    overflowRightPx: Math.round(overflowRightPx * 100) / 100,
    overflowBottomPx: Math.round(overflowBottomPx * 100) / 100,
    overflowLeftPx: Math.round(overflowLeftPx * 100) / 100,
    overflowTopPx: Math.round(overflowTopPx * 100) / 100,
    hasOverflow
  };
}

export function isExemptFromContainerOverflow(element: {
  tagName: string;
  className?: string;
  id?: string;
  role?: string | null;
  position?: string;
  isPopoverOrTooltip?: boolean;
  isCornerControl?: boolean;
  isDecorative?: boolean;
  containerStyles?: {
    overflowX?: string;
    overflowY?: string;
  };
}): boolean {
  const {
    tagName,
    className = '',
    role,
    position = 'static',
    isPopoverOrTooltip,
    isCornerControl,
    isDecorative,
    containerStyles
  } = element;

  // 1. Explicitly flagged popovers/tooltips or corner controls
  if (isPopoverOrTooltip || isCornerControl || isDecorative) {
    return true;
  }

  // 2. Fixed/absolute floating overlays, tooltips, menus, dialogs
  if (position === 'fixed') {
    return true;
  }

  const tagLower = tagName.toLowerCase();
  const classLower = (className || '').toLowerCase();
  const roleLower = (role || '').toLowerCase();

  const floatingRoles = ['tooltip', 'menu', 'listbox', 'dialog', 'alertdialog'];
  if (roleLower && floatingRoles.includes(roleLower)) {
    return true;
  }

  const floatingClassKeywords = [
    'tooltip',
    'popover',
    'dropdown',
    'menu',
    'toast',
    'floating',
    'popper',
    'modal-backdrop',
    'select-options',
    'tippy-box'
  ];
  if (floatingClassKeywords.some(keyword => classLower.includes(keyword))) {
    return true;
  }

  // 3. Intentional corner controls & badges (e.g. close buttons hanging on container corner)
  const cornerClassKeywords = [
    'btn-close',
    'close-btn',
    'modal-close',
    'dialog-close',
    'badge',
    'indicator',
    'chip-corner',
    'pill'
  ];
  if (cornerClassKeywords.some(keyword => classLower.includes(keyword))) {
    return true;
  }

  // 4. If container is explicitly scrollable in the overflow axis, overflow is allowed
  if (containerStyles) {
    const isScrollableX =
      containerStyles.overflowX === 'auto' ||
      containerStyles.overflowX === 'scroll';
    const isScrollableY =
      containerStyles.overflowY === 'auto' ||
      containerStyles.overflowY === 'scroll';

    if (isScrollableX && isScrollableY) {
      return true;
    }
  }

  return false;
}

export function generateContainerOverflowRemediation(params: {
  childTagName: string;
  childSelector: string;
  childRect: BoundingBox;
  childStyles: ElementComputedStyles;
  containerTagName: string;
  containerSelector: string;
  containerInnerBox: ContainerInnerBox;
  overflowRightPx: number;
  overflowBottomPx: number;
  overflowLeftPx: number;
}): { culpritDescription: string; suggestedFix: string } {
  const {
    childTagName,
    childSelector,
    childRect,
    childStyles,
    containerTagName,
    containerSelector,
    containerInnerBox,
    overflowRightPx,
    overflowBottomPx,
    overflowLeftPx
  } = params;

  const childWidth = Math.round(childRect.width);
  const containerInnerWidth = Math.round(containerInnerBox.width);

  let culpritDescription = `Child <${childTagName}> (${childSelector}) of width ${childWidth}px exceeds container <${containerTagName}> (${containerSelector}) inner content boundary (${containerInnerWidth}px)`;
  let suggestedFix = `Apply 'flex-wrap: wrap' on container or 'max-width: 100%' / 'min-width: 0' on children.`;

  if (overflowRightPx > 0) {
    culpritDescription += ` by ${Math.round(overflowRightPx)}px on the right`;
  }
  if (overflowLeftPx > 0) {
    culpritDescription += ` by ${Math.round(overflowLeftPx)}px on the left`;
  }
  if (overflowBottomPx > 0) {
    culpritDescription += ` and ${Math.round(overflowBottomPx)}px on the bottom`;
  }
  culpritDescription += '.';

  // Multi-column flex or fixed width children (like 3-column auth inputs in a 550px modal)
  if (
    childStyles.display === 'flex' ||
    childStyles.display === 'inline-flex' ||
    childStyles.flexWrap === 'nowrap'
  ) {
    culpritDescription += ` Multi-item flex row has 'flex-wrap: nowrap' forcing children past container edge.`;
    suggestedFix = `Set 'flex-wrap: wrap' on flex parent or use responsive grid 'grid-template-columns: repeat(auto-fit, minmax(140px, 1fr))'.`;
  } else if (
    childStyles.width &&
    childStyles.width.includes('px') &&
    parseFloat(childStyles.width) > containerInnerWidth
  ) {
    culpritDescription += ` Explicit fixed width of ${childStyles.width} exceeds container width (${containerInnerWidth}px).`;
    suggestedFix = `Replace fixed width '${childStyles.width}' with 'width: 100%' / 'max-width: 100%' or responsive layout constraints.`;
  } else if (
    childStyles.minWidth &&
    childStyles.minWidth !== 'auto' &&
    parseFloat(childStyles.minWidth) > containerInnerWidth
  ) {
    culpritDescription += ` Fixed min-width '${childStyles.minWidth}' forces element outside parent boundary.`;
    suggestedFix = `Set 'min-width: 0' or 'min-width: 100%' to allow responsive resizing within container.`;
  } else if (['input', 'select', 'textarea', 'table', 'img', 'canvas'].includes(childTagName.toLowerCase())) {
    suggestedFix = `Ensure <${childTagName}> has 'max-width: 100%; box-sizing: border-box;' and flex children have 'min-width: 0;'.`;
  }

  return { culpritDescription, suggestedFix };
}

export function evaluateContainerOverflow(params: {
  child: {
    selector: string;
    tagName: string;
    id?: string;
    className?: string;
    rect: BoundingBox;
    computedStyles: ElementComputedStyles;
    role?: string | null;
    isPopoverOrTooltip?: boolean;
    isCornerControl?: boolean;
    isDecorative?: boolean;
  };
  container: {
    selector: string;
    tagName: string;
    rect: BoundingBox;
    innerBox: ContainerInnerBox;
    computedStyles?: {
      overflowX?: string;
      overflowY?: string;
    };
  };
}): ContainerOverflowIssue | null {
  const { child, container } = params;

  if (
    isExemptFromContainerOverflow({
      tagName: child.tagName,
      className: child.className,
      id: child.id,
      role: child.role,
      position: child.computedStyles.position,
      isPopoverOrTooltip: child.isPopoverOrTooltip,
      isCornerControl: child.isCornerControl,
      isDecorative: child.isDecorative,
      containerStyles: container.computedStyles
    })
  ) {
    return null;
  }

  const overflow = calculateContainerOverflow(child.rect, container.innerBox);
  if (!overflow.hasOverflow) {
    return null;
  }

  const remediation = generateContainerOverflowRemediation({
    childTagName: child.tagName,
    childSelector: child.selector,
    childRect: child.rect,
    childStyles: child.computedStyles,
    containerTagName: container.tagName,
    containerSelector: container.selector,
    containerInnerBox: container.innerBox,
    overflowRightPx: overflow.overflowRightPx,
    overflowBottomPx: overflow.overflowBottomPx,
    overflowLeftPx: overflow.overflowLeftPx
  });

  const severity: 'critical' | 'warning' =
    overflow.overflowRightPx > 10 || overflow.overflowLeftPx > 10 || overflow.overflowBottomPx > 20
      ? 'critical'
      : 'warning';

  return {
    selector: child.selector,
    tagName: child.tagName,
    id: child.id,
    className: child.className,
    boundingBox: child.rect,
    containerSelector: container.selector,
    containerTagName: container.tagName,
    containerBoundingBox: container.rect,
    containerInnerBox: container.innerBox,
    overflowRightPx: overflow.overflowRightPx,
    overflowBottomPx: overflow.overflowBottomPx,
    overflowLeftPx: overflow.overflowLeftPx,
    overflowTopPx: overflow.overflowTopPx,
    computedStyles: child.computedStyles,
    culpritDescription: remediation.culpritDescription,
    suggestedFix: remediation.suggestedFix,
    severity
  };
}
