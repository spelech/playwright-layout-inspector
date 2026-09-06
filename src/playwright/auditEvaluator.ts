import {
  AccessibleNameIssue,
  ColorContrastIssue,
  ContainerOverflowIssue,
  ElementCollisionIssue,
  FlexBlowoutIssue,
  LayoutAuditOptions,
  OcclusionIssue,
  OverflowIssue,
  ReadabilityIssue,
  ScrollTrapIssue,
  StickyOcclusionIssue,
  TextFlowIssue,
  TouchTargetIssue,
  ViewportFitResult,
  ViewportInfo
} from '../types';
import { calculateOverflow, generateOverflowRemediation } from '../core/overflow';
import { evaluateContainerOverflow } from '../core/containerOverflow';
import { evaluateFlexBlowout } from '../core/flexBlowout';
import { evaluateStickyOcclusion } from '../core/stickyOcclusion';
import { evaluateTextFlow } from '../core/textFlow';
import { evaluateViewportFit } from '../core/viewportFit';
import { evaluateTouchTarget } from '../core/touchTargets';
import { evaluateTextReadability } from '../core/readability';
import { evaluateColorContrast } from '../core/contrast';
import { evaluateElementOcclusion } from '../core/occlusion';
import { evaluateElementCollisions } from '../core/collisions';
import { evaluateScrollTrap } from '../core/scrollTraps';
import { evaluateAccessibleName } from '../core/accessibility';
import type { InPageAuditData } from '../core/browserScript';

export interface EvaluatedAuditIssues {
  viewportFit: ViewportFitResult;
  overflowIssues: OverflowIssue[];
  containerOverflowIssues: ContainerOverflowIssue[];
  flexBlowoutIssues: FlexBlowoutIssue[];
  stickyOcclusionIssues: StickyOcclusionIssue[];
  textFlowIssues: TextFlowIssue[];
  touchTargetIssues: TouchTargetIssue[];
  readabilityIssues: ReadabilityIssue[];
  contrastIssues: ColorContrastIssue[];
  occlusionIssues: OcclusionIssue[];
  collisionIssues: ElementCollisionIssue[];
  scrollTrapIssues: ScrollTrapIssue[];
  accessibleNameIssues: AccessibleNameIssue[];
}

export function evaluateAuditIssues(
  inPageData: InPageAuditData,
  mergedOptions: LayoutAuditOptions,
  viewport: ViewportInfo,
  isMobile: boolean
): EvaluatedAuditIssues {
  // 1. Viewport Fit Evaluation
  const viewportFit: ViewportFitResult = evaluateViewportFit(viewport.metaViewport, viewport);

  // 2. Viewport Overflow Issues Evaluation
  const overflowIssues: OverflowIssue[] = [];
  if (mergedOptions.checkOverflow !== false) {
    for (const el of inPageData.elements) {
      const over = calculateOverflow(el.rect, viewport);
      if (over.hasOverflow) {
        const remediation = generateOverflowRemediation({
          selector: el.selector,
          computedStyles: el.computedStyles,
          boundingBox: el.rect,
          viewport,
          overflowAmountPx: over.overflowRightPx
        });
        overflowIssues.push({
          selector: el.selector,
          tagName: el.tagName,
          boundingBox: el.rect,
          viewport,
          overflowRightPx: over.overflowRightPx,
          overflowBottomPx: over.overflowBottomPx,
          overflowLeftPx: over.overflowLeftPx,
          computedStyles: el.computedStyles,
          culpritDescription: remediation.description,
          suggestedFix: remediation.cssSuggestion,
          severity: remediation.severity
        });
      }
    }
  }

  // 3. Container Overflow Evaluation
  const containerOverflowIssues: ContainerOverflowIssue[] = [];
  if (mergedOptions.checkContainerOverflow !== false && inPageData.containerOverflows) {
    for (const cov of inPageData.containerOverflows) {
      if (cov.isExempt) continue;
      const issue = evaluateContainerOverflow({
        child: {
          selector: cov.childSelector,
          tagName: cov.childTagName,
          id: cov.childId,
          className: cov.childClassName,
          rect: cov.childRect,
          computedStyles: cov.childStyles,
          role: cov.childRole
        },
        container: {
          selector: cov.containerSelector,
          tagName: cov.containerTagName,
          rect: cov.containerRect,
          innerBox: cov.containerInnerBox,
          computedStyles: cov.containerStyles
        }
      });
      if (issue) containerOverflowIssues.push(issue);
    }
  }

  // 4. Flexbox & Grid Blowout Evaluation
  let flexBlowoutIssues: FlexBlowoutIssue[] = [];
  if (mergedOptions.checkFlexBlowout !== false) {
    flexBlowoutIssues = evaluateFlexBlowout(inPageData.containerOverflows || [], inPageData.elements);
  }

  // 5. Sticky & Fixed Element Occlusion Evaluation
  let stickyOcclusionIssues: StickyOcclusionIssue[] = [];
  if (mergedOptions.checkStickyOcclusion !== false && inPageData.stickyOcclusions) {
    stickyOcclusionIssues = evaluateStickyOcclusion(inPageData.stickyOcclusions);
  }

  // 6. Text Flow Anomaly Evaluation
  const textFlowIssues: TextFlowIssue[] = [];
  if (mergedOptions.checkTextFlow !== false && inPageData.textFlowAnomalies) {
    for (const anomaly of inPageData.textFlowAnomalies) {
      const issue = evaluateTextFlow(anomaly);
      if (issue) textFlowIssues.push(issue);
    }
  }

  // 7. Touch Target Ergonomics Evaluation
  const touchTargetIssues: TouchTargetIssue[] = [];
  const interactiveElements = inPageData.elements.filter(e => e.isInteractive);
  if (mergedOptions.checkTouchTargets !== false) {
    const allTargets = interactiveElements.map(e => ({ selector: e.selector, boundingBox: e.rect }));
    for (const el of interactiveElements) {
      const issue = evaluateTouchTarget(
        {
          selector: el.selector,
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          text: el.textSnippet,
          boundingBox: el.rect
        },
        allTargets,
        { minTargetSize: mergedOptions.minTouchTargetSize }
      );
      if (issue) touchTargetIssues.push(issue);
    }
  }

  // 8. Text Readability Evaluation
  const readabilityIssues: ReadabilityIssue[] = [];
  if (mergedOptions.checkReadability !== false) {
    for (const el of inPageData.elements) {
      if (!el.textSnippet || el.textSnippet.length === 0) continue;
      const fontSizePx = parseFloat(el.computedStyles.fontSize) || 16;
      const lineHeightPx = parseFloat(el.computedStyles.lineHeight) || undefined;
      const issue = evaluateTextReadability(
        {
          selector: el.selector,
          text: el.textSnippet,
          fontSizePx,
          lineHeightPx,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          textOverflow: el.computedStyles.overflow,
          overflow: el.computedStyles.overflow
        },
        isMobile,
        mergedOptions.minFontSizePx
      );
      if (issue) readabilityIssues.push(issue);
    }
  }

  // 9. Color Contrast Evaluation
  const contrastIssues: ColorContrastIssue[] = [];
  if (mergedOptions.checkContrast !== false) {
    for (const el of inPageData.elements) {
      if (el.textSnippet && el.computedStyles.color && el.computedStyles.backgroundColor) {
        const issue = evaluateColorContrast(
          {
            selector: el.selector,
            tagName: el.tagName,
            textSnippet: el.textSnippet,
            color: el.computedStyles.color,
            backgroundColor: el.computedStyles.backgroundColor,
            fontSize: el.computedStyles.fontSize,
            fontWeight: el.computedStyles.fontWeight,
            hasDirectText: el.hasDirectText
          },
          { minContrastRatio: mergedOptions.minContrastRatio || 4.5 }
        );
        if (issue) contrastIssues.push(issue);
      }
    }
  }

  // 10. Multi-point Raycast Occlusion Evaluation
  const occlusionIssues: OcclusionIssue[] = [];
  if (mergedOptions.checkOcclusion !== false && inPageData.occlusions) {
    for (const occ of inPageData.occlusions) {
      const issue = evaluateElementOcclusion(
        {
          selector: occ.selector,
          tagName: occ.tagName,
          boundingBox: occ.boundingBox,
          isInteractive: true
        },
        occ.raycastResults
      );
      if (issue) occlusionIssues.push(issue);
    }
  }

  // 11. 2D Element Collisions Evaluation
  let collisionIssues: ElementCollisionIssue[] = [];
  if (mergedOptions.checkCollisions !== false) {
    collisionIssues = evaluateElementCollisions(
      inPageData.elements.map(e => ({
        selector: e.selector,
        tagName: e.tagName,
        textSnippet: e.textSnippet,
        rect: e.rect,
        isInteractive: e.isInteractive,
        isTextOnly: e.isTextOnly,
        ancestors: e.ancestors
      }))
    );
  }

  // 12. Nested Scroll Traps Evaluation
  const scrollTrapIssues: ScrollTrapIssue[] = [];
  if (mergedOptions.checkScrollTraps !== false) {
    for (const el of inPageData.elements) {
      const issue = evaluateScrollTrap(
        {
          selector: el.selector,
          tagName: el.tagName,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          overflowX: el.computedStyles.overflowX,
          overflowY: el.computedStyles.overflowY
        },
        viewport
      );
      if (issue) scrollTrapIssues.push(issue);
    }
  }

  // 13. Accessible Names Evaluation
  const accessibleNameIssues: AccessibleNameIssue[] = [];
  if (mergedOptions.checkAccessibleNames !== false) {
    for (const el of inPageData.elements) {
      if (el.isInteractive) {
        const issue = evaluateAccessibleName({
          selector: el.selector,
          tagName: el.tagName,
          hasAccessibleName: el.hasAccessibleName,
          textSnippet: el.textSnippet,
          hasSvgOrImgChild: el.hasSvgOrImgChild,
          role: el.role
        });
        if (issue) accessibleNameIssues.push(issue);
      }
    }
  }

  return {
    viewportFit,
    overflowIssues,
    containerOverflowIssues,
    flexBlowoutIssues,
    stickyOcclusionIssues,
    textFlowIssues,
    touchTargetIssues,
    readabilityIssues,
    contrastIssues,
    occlusionIssues,
    collisionIssues,
    scrollTrapIssues,
    accessibleNameIssues
  };
}
