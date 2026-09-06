import { FlexBlowoutIssue } from '../types';
import { InPageAuditData } from './browserScript';

/**
 * Evaluates Flexbox and Grid blowout issues where children with min-width: auto
 * or flex-shrink: 0 blow out their parent container or viewport boundary.
 */
export function evaluateFlexBlowout(
  containerOverflows: InPageAuditData['containerOverflows'] = [],
  elements: InPageAuditData['elements'] = []
): FlexBlowoutIssue[] {
  const issuesMap = new Map<string, FlexBlowoutIssue>();
  const elementMap = new Map<string, InPageAuditData['elements'][0]>();

  for (const el of elements || []) {
    elementMap.set(el.selector, el);
  }

  // 1. Inspect containerOverflows for flex/grid containers
  for (const co of containerOverflows || []) {
    if (co.isExempt) continue;

    const containerEl = elementMap.get(co.containerSelector);
    const childEl = elementMap.get(co.childSelector);

    const containerDisplay = (
      co.containerStyles?.display ||
      containerEl?.computedStyles?.display ||
      ''
    ).toLowerCase();

    const isFlex = containerDisplay.includes('flex');
    const isGrid = containerDisplay.includes('grid');

    if (!isFlex && !isGrid) continue;

    const childMinWidth = (
      co.childStyles?.minWidth ||
      childEl?.computedStyles?.minWidth ||
      'auto'
    ).trim();

    const childFlexShrink = (
      co.childStyles?.flexShrink ||
      childEl?.computedStyles?.flexShrink ||
      '1'
    ).trim();

    const isCleanMinWidth = childMinWidth === '0' || childMinWidth === '0px';
    if (isCleanMinWidth && childFlexShrink !== '0') {
      continue;
    }

    const layoutType: 'flex' | 'grid' = isGrid ? 'grid' : 'flex';
    const childWidth = Math.round(
      (co.childRect?.width || (childEl ? Math.max(childEl.rect.width, childEl.scrollWidth) : 0)) * 100
    ) / 100;
    const parentWidth = Math.round(
      (co.containerInnerBox?.width || co.containerRect?.width || 0) * 100
    ) / 100;

    const overflowPx = Math.round(
      Math.max(
        co.overflowRightPx || 0,
        co.overflowLeftPx || 0,
        childWidth - parentWidth
      ) * 100
    ) / 100;

    if (overflowPx <= 0) continue;

    const isInteractive = Boolean(childEl?.isInteractive || (co as any).isInteractive);
    const severity: 'critical' | 'serious' = isInteractive || overflowPx > 20 ? 'critical' : 'serious';

    issuesMap.set(co.childSelector, {
      selector: co.childSelector,
      tagName: co.childTagName || childEl?.tagName || 'div',
      parentSelector: co.containerSelector,
      layoutType,
      childWidth,
      parentWidth,
      overflowPx,
      severity,
      suggestion: `Child element ${co.childSelector} is blowing out ${layoutType} container ${co.containerSelector} by ${overflowPx}px because min-width: auto or flex-shrink: 0 prevents shrinking. Set min-width: 0 and overflow: hidden; text-overflow: ellipsis on the child.`
    });
  }

  // 2. Inspect elements for flex/grid parent children blowout
  for (const child of elements || []) {
    const parentSelector = child.ancestors?.[0];
    if (!parentSelector) continue;

    const parentEl = elementMap.get(parentSelector);
    if (!parentEl) continue;

    const parentDisplay = (parentEl.computedStyles?.display || '').toLowerCase();
    const isFlex = parentDisplay.includes('flex');
    const isGrid = parentDisplay.includes('grid');

    if (!isFlex && !isGrid) continue;

    const minWidth = (child.computedStyles?.minWidth || 'auto').trim();
    const flexShrink = (child.computedStyles?.flexShrink || '1').trim();

    const isUnconstrained = minWidth === 'auto' || flexShrink === '0';
    if (!isUnconstrained) continue;

    const hasScrollBlowout = child.scrollWidth > child.clientWidth + 2;
    const parentWidth = Math.round((parentEl.clientWidth || parentEl.rect?.width || 0) * 100) / 100;
    const childWidth = Math.round(Math.max(child.scrollWidth, child.rect?.width || 0) * 100) / 100;
    const hasBoundaryBlowout = parentWidth > 0 && childWidth > parentWidth + 2;

    if (!hasScrollBlowout && !hasBoundaryBlowout) continue;

    const overflowPx = Math.round(
      Math.max(
        hasScrollBlowout ? child.scrollWidth - child.clientWidth : 0,
        hasBoundaryBlowout ? childWidth - parentWidth : 0
      ) * 100
    ) / 100;

    if (overflowPx <= 0) continue;

    const layoutType: 'flex' | 'grid' = isGrid ? 'grid' : 'flex';
    const severity: 'critical' | 'serious' = child.isInteractive || overflowPx > 20 ? 'critical' : 'serious';

    const existing = issuesMap.get(child.selector);
    if (!existing || overflowPx > existing.overflowPx) {
      issuesMap.set(child.selector, {
        selector: child.selector,
        tagName: child.tagName,
        parentSelector,
        layoutType,
        childWidth,
        parentWidth,
        overflowPx,
        severity,
        suggestion: `Child element ${child.selector} is blowing out ${layoutType} container ${parentSelector} by ${overflowPx}px because min-width: auto or flex-shrink: 0 prevents shrinking. Set min-width: 0 and overflow: hidden; text-overflow: ellipsis on the child.`
      });
    }
  }

  return Array.from(issuesMap.values());
}
