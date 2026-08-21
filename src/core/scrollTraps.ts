import { ScrollTrapIssue, ViewportInfo } from '../types';

export function evaluateScrollTrap(
  container: {
    selector: string;
    tagName: string;
    scrollHeight: number;
    clientHeight: number;
    scrollWidth: number;
    clientWidth: number;
    overflowY: string;
    overflowX: string;
    overscrollBehavior?: string;
  },
  viewport: ViewportInfo
): ScrollTrapIssue | null {
  const hasVerticalScroll = (container.overflowY === 'auto' || container.overflowY === 'scroll') && container.scrollHeight > container.clientHeight + 5;
  const hasHorizontalScroll = (container.overflowX === 'auto' || container.overflowX === 'scroll') && container.scrollWidth > container.clientWidth + 5;

  if (!hasVerticalScroll && !hasHorizontalScroll) {
    return null;
  }

  // Viewport ratio (how much screen height the nested container takes up)
  const viewportRatio = Math.round((container.clientHeight / viewport.height) * 100) / 100;
  
  // A scroll trap risk occurs when an inner container covers a huge portion of mobile screen (> 65% of screen height)
  // and has nested scrolling, making it very difficult for the user to touch-scroll past the container.
  const isTrapRisk = viewportRatio >= 0.65 && hasVerticalScroll;

  if (!isTrapRisk && container.clientHeight < 120 && hasVerticalScroll) {
    // Unintentionally tiny scroll area
    return {
      selector: container.selector,
      tagName: container.tagName,
      scrollHeight: container.scrollHeight,
      clientHeight: container.clientHeight,
      scrollWidth: container.scrollWidth,
      clientWidth: container.clientWidth,
      viewportRatio,
      isTrapRisk: false,
      severity: 'warning',
      suggestion: `Nested scroll container (${container.selector}) has very small height (${container.clientHeight}px) causing awkward scrolling. Consider increasing height or using pagination.`
    };
  }

  if (!isTrapRisk) {
    return null;
  }

  return {
    selector: container.selector,
    tagName: container.tagName,
    scrollHeight: container.scrollHeight,
    clientHeight: container.clientHeight,
    scrollWidth: container.scrollWidth,
    clientWidth: container.clientWidth,
    viewportRatio,
    isTrapRisk: true,
    severity: 'critical',
    suggestion: `Nested scroll container (${container.selector}) occupies ${Math.round(viewportRatio * 100)}% of the viewport and traps mobile touch-scroll. Add 'overscroll-behavior: contain' and provide visible scroll affordance/padding so users can scroll the outer page.`
  };
}
