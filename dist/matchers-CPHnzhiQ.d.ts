import { Page } from '@playwright/test';

interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
}
interface ViewportInfo {
    width: number;
    height: number;
    devicePixelRatio: number;
    scrollX: number;
    scrollY: number;
    scrollWidth: number;
    scrollHeight: number;
    metaViewport?: string | null;
}
interface ElementComputedStyles {
    overflow: string;
    overflowX: string;
    overflowY: string;
    width: string;
    minWidth: string;
    maxWidth: string;
    height: string;
    minHeight: string;
    maxHeight: string;
    transform: string;
    display: string;
    position: string;
    boxSizing: string;
    margin: string;
    padding: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    borderTopWidth?: string;
    borderRightWidth?: string;
    borderBottomWidth?: string;
    borderLeftWidth?: string;
    wordBreak?: string;
    overflowWrap?: string;
    whiteSpace?: string;
    textWrap?: string;
    flexDirection?: string;
    flexWrap?: string;
    flexShrink?: string;
    flexGrow?: string;
    flexBasis?: string;
    fontSize?: string;
    lineHeight?: string;
    zIndex?: string;
    outline?: string;
    outlineWidth?: string;
    outlineStyle?: string;
    outlineColor?: string;
    boxShadow?: string;
}
interface OverflowIssue {
    selector: string;
    tagName: string;
    id?: string;
    className?: string;
    boundingBox: BoundingBox;
    viewport: ViewportInfo;
    overflowRightPx: number;
    overflowBottomPx: number;
    overflowLeftPx: number;
    computedStyles: ElementComputedStyles;
    culpritDescription: string;
    suggestedFix: string;
    severity: 'critical' | 'warning';
}
interface ContainerInnerBox {
    top: number;
    right: number;
    bottom: number;
    left: number;
    width: number;
    height: number;
}
interface ContainerOverflowIssue {
    selector: string;
    tagName: string;
    id?: string;
    className?: string;
    boundingBox: BoundingBox;
    containerSelector: string;
    containerTagName: string;
    containerBoundingBox: BoundingBox;
    containerInnerBox: ContainerInnerBox;
    overflowRightPx: number;
    overflowBottomPx: number;
    overflowLeftPx: number;
    overflowTopPx: number;
    computedStyles: ElementComputedStyles;
    culpritDescription: string;
    suggestedFix: string;
    severity: 'critical' | 'warning';
}
type TextFlowAnomalyType = 'mid-word-break' | 'orphan-wrap' | 'broken-multiline-button' | 'crushed-flex-column';
interface TextFlowIssue {
    selector: string;
    tagName: string;
    textSnippet: string;
    anomalyType: TextFlowAnomalyType;
    details: string;
    lineCount?: number;
    lastLineWordCount?: number;
    orphanText?: string;
    computedStyles?: {
        wordBreak?: string;
        overflowWrap?: string;
        whiteSpace?: string;
        textWrap?: string;
        display?: string;
        flex?: string;
    };
    severity: 'critical' | 'warning';
    suggestedFix: string;
}
interface LayoutShiftItem {
    selector: string;
    tagName: string;
    id?: string;
    className?: string;
    textSnippet?: string;
    beforeRect: BoundingBox;
    afterRect: BoundingBox;
    deltaX: number;
    deltaY: number;
    distance: number;
    areaRatio: number;
    impactScore: number;
    isJarring: boolean;
    explanation: string;
}
interface LayoutShiftResult {
    totalShiftScore: number;
    totalDisplacedElements: number;
    maxDisplacementPx: number;
    jarringShiftCount: number;
    items: LayoutShiftItem[];
    isAcceptable: boolean;
    summary: string;
}
interface TouchTargetIssue {
    selector: string;
    tagName: string;
    id?: string;
    className?: string;
    text?: string;
    boundingBox: BoundingBox;
    width: number;
    height: number;
    standard: 'WCAG_AA' | 'WCAG_AAA' | 'MOBILE_RECOMMENDED';
    minRequiredSize: number;
    severity: 'critical' | 'warning';
    spacingIssues?: {
        adjacentSelector: string;
        distancePx: number;
    }[];
    suggestion: string;
}
interface ViewportFitResult {
    isValidMetaViewport: boolean;
    metaContent?: string | null;
    allowsUserZoom: boolean;
    isWidthDeviceWidth: boolean;
    initialScale: number;
    isMobileOptimized: boolean;
    pageScrollWidth: number;
    windowWidth: number;
    horizontalOverflowRatio: number;
    contentBleeds: boolean;
    issues: string[];
    suggestions: string[];
}
interface ReadabilityIssue {
    selector: string;
    textSnippet: string;
    fontSizePx: number;
    lineHeightPx?: number;
    isTruncated: boolean;
    isIllegibleOnMobile: boolean;
    hasAccessibleTooltip: boolean;
    severity: 'warning' | 'info';
    suggestion: string;
}
interface OcclusionIssue {
    selector: string;
    tagName: string;
    boundingBox: BoundingBox;
    occludedBySelector: string;
    occludedByTagName: string;
    occludedPointsCount: number;
    totalPointsChecked: number;
    occludedAreaRatio: number;
    isInteractive: boolean;
    severity: 'critical' | 'warning';
    suggestion: string;
}
interface ElementCollisionIssue {
    selectorA: string;
    selectorB: string;
    boundingBoxA: BoundingBox;
    boundingBoxB: BoundingBox;
    overlapAreaPx: number;
    isTextCollision: boolean;
    severity: 'critical' | 'warning';
    suggestion: string;
}
interface ScrollTrapIssue {
    selector: string;
    tagName: string;
    scrollHeight: number;
    clientHeight: number;
    scrollWidth: number;
    clientWidth: number;
    viewportRatio: number;
    isTrapRisk: boolean;
    severity: 'critical' | 'warning';
    suggestion: string;
}
interface AccessibleNameIssue {
    selector: string;
    tagName: string;
    isIconOnly: boolean;
    computedRole: string;
    textSnippet?: string;
    severity: 'critical' | 'warning';
    suggestion: string;
}
interface ColorContrastIssue {
    selector: string;
    tagName: string;
    textSnippet?: string;
    foregroundColor: string;
    backgroundColor: string;
    contrastRatio: number;
    requiredRatio: number;
    fontSizePx: number;
    isBold: boolean;
    severity: 'critical' | 'warning';
    suggestion: string;
}
interface FocusIndicatorIssue {
    selector: string;
    tagName: string;
    hasVisibleFocusRing: boolean;
    computedOutline: string;
    computedBoxShadow: string;
    severity: 'critical' | 'warning';
    suggestion: string;
}
interface ThumbZoneAnalysis {
    naturalZoneCount: number;
    reachZoneCount: number;
    hardZoneCount: number;
    totalInteractiveCount: number;
    hardZoneElements: {
        selector: string;
        text?: string;
        x: number;
        y: number;
    }[];
    ergonomicsScore: number;
    summary: string;
}
interface ZoomReflowResult {
    zoomFactor: number;
    passesReflow: boolean;
    hasHorizontalBleed: boolean;
    pageScrollWidth: number;
    windowWidth: number;
    collisionCount: number;
    issues: string[];
    summary: string;
}
type UXGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
interface UXCategoryScore {
    name: string;
    score: number;
    weight: number;
    maxScore: number;
    grade: UXGrade;
    passed: boolean;
    issueCount: number;
    summary: string;
}
interface UXScore {
    totalScore: number;
    grade: UXGrade;
    passed: boolean;
    categories: {
        overflowAndFit: UXCategoryScore;
        stability: UXCategoryScore;
        touchErgonomics: UXCategoryScore;
        readabilityAndVisibility: UXCategoryScore;
        accessibilityAndFocus: UXCategoryScore;
    };
}
interface DevicePreset {
    name: string;
    width: number;
    height: number;
    deviceScaleFactor: number;
    isMobile: boolean;
    hasTouch: boolean;
    userAgent?: string;
    category: 'mobile' | 'tablet' | 'desktop';
}
interface LayoutAuditOptions {
    device?: string | DevicePreset;
    checkTouchTargets?: boolean;
    minTouchTargetSize?: number;
    checkOverflow?: boolean;
    checkContainerOverflow?: boolean;
    checkTextFlow?: boolean;
    checkViewportFit?: boolean;
    checkReadability?: boolean;
    minFontSizePx?: number;
    checkContrast?: boolean;
    minContrastRatio?: number;
    checkOcclusion?: boolean;
    checkCollisions?: boolean;
    checkScrollTraps?: boolean;
    checkAccessibleNames?: boolean;
    checkFocusIndicators?: boolean;
    checkThumbZones?: boolean;
    test200PercentZoomReflow?: boolean;
    includeScreenshot?: boolean;
    highlightIssuesInScreenshot?: boolean;
    ignoreSelectors?: string[];
}
interface LayoutAuditResult {
    url: string;
    timestamp: string;
    device?: DevicePreset | {
        name: string;
        width: number;
        height: number;
    };
    viewport: ViewportInfo;
    uxScore: UXScore;
    overflowIssues: OverflowIssue[];
    containerOverflowIssues: ContainerOverflowIssue[];
    textFlowIssues: TextFlowIssue[];
    layoutShiftResult?: LayoutShiftResult;
    touchTargetIssues: TouchTargetIssue[];
    viewportFit: ViewportFitResult;
    readabilityIssues: ReadabilityIssue[];
    contrastIssues: ColorContrastIssue[];
    occlusionIssues: OcclusionIssue[];
    collisionIssues: ElementCollisionIssue[];
    scrollTrapIssues: ScrollTrapIssue[];
    accessibleNameIssues: AccessibleNameIssue[];
    focusIndicatorIssues: FocusIndicatorIssue[];
    thumbZoneAnalysis?: ThumbZoneAnalysis;
    zoomReflowResult?: ZoomReflowResult;
    screenshotBase64?: string;
    annotatedScreenshotBase64?: string;
    executionTimeMs: number;
}

declare const customMatchers: {
    /**
     * Asserts that no element on the page overflows or bleeds past viewport or parent container boundaries.
     */
    toHaveNoLayoutOverflow(page: Page, options?: LayoutAuditOptions): Promise<{
        pass: boolean;
        message: () => string;
        name: string;
    }>;
    /**
     * Asserts that no child element bleeds beyond its parent visual container's inner content/padding boundary.
     */
    toHaveNoContainerOverflow(page: Page, options?: LayoutAuditOptions): Promise<{
        pass: boolean;
        message: () => string;
        name: string;
    }>;
    /**
     * Asserts that text flows cleanly without awkward mid-word breaks, ragged orphan wraps on buttons/headings, or crushed flex columns.
     */
    toHaveCleanTextFlow(page: Page, options?: LayoutAuditOptions): Promise<{
        pass: boolean;
        message: () => string;
        name: string;
    }>;
    /**
     * Asserts that the page properly fits mobile viewport constraints and has valid mobile viewport meta.
     */
    toHaveMobileFit(page: Page, options?: LayoutAuditOptions): Promise<{
        pass: boolean;
        message: () => string;
        name: string;
    }>;
    /**
     * Asserts that all interactive touch targets meet the minimum size requirement (default 24px for AA, 44px for AAA).
     */
    toHaveTouchFriendlyTargets(page: Page, options?: {
        minSize?: number;
    }): Promise<{
        pass: boolean;
        message: () => string;
        name: string;
    }>;
    /**
     * Asserts that no interactive actions are occluded or tap-jacked by floating/sticky layers.
     */
    toHaveNoOccludedActions(page: Page, options?: LayoutAuditOptions): Promise<{
        pass: boolean;
        message: () => string;
        name: string;
    }>;
    /**
     * Asserts that no sibling elements or text labels collide with overlapping coordinates.
     */
    toHaveNoElementCollisions(page: Page, options?: LayoutAuditOptions): Promise<{
        pass: boolean;
        message: () => string;
        name: string;
    }>;
    /**
     * Asserts that no nested containers trap scrolling on mobile viewports.
     */
    toHaveNoNestedScrollTraps(page: Page, options?: LayoutAuditOptions): Promise<{
        pass: boolean;
        message: () => string;
        name: string;
    }>;
    /**
     * Asserts that all interactive buttons and inputs have accessible names (aria-label, title, or text).
     */
    toHaveAccessibleInteractiveNames(page: Page, options?: LayoutAuditOptions): Promise<{
        pass: boolean;
        message: () => string;
        name: string;
    }>;
    /**
     * Asserts that page reflows cleanly without horizontal scrolling at 200% text zoom (WCAG 1.4.10).
     */
    toPass200PercentZoomReflow(page: Page, zoomFactor?: number): Promise<{
        pass: boolean;
        message: () => string;
        name: string;
    }>;
    /**
     * Asserts that an asynchronous action does not introduce jarring layout shifts.
     */
    toHaveAcceptableLayoutShift(page: Page, action: () => Promise<void>, options?: {
        maxAcceptableScore?: number;
        maxAcceptableDisplacement?: number;
    }): Promise<{
        pass: boolean;
        message: () => string;
        name: string;
    }>;
    /**
     * Asserts that overall UX score meets or exceeds a target minimum (default 80/100, Grade B/A).
     */
    toPassLayoutAudit(page: Page, options?: LayoutAuditOptions & {
        minScore?: number;
    }): Promise<{
        pass: boolean;
        message: () => string;
        name: string;
    }>;
};
declare global {
    namespace PlaywrightTest {
        interface Matchers<R, T> {
            toHaveNoLayoutOverflow(options?: LayoutAuditOptions): Promise<R>;
            toHaveNoContainerOverflow(options?: LayoutAuditOptions): Promise<R>;
            toHaveCleanTextFlow(options?: LayoutAuditOptions): Promise<R>;
            toHaveMobileFit(options?: LayoutAuditOptions): Promise<R>;
            toHaveTouchFriendlyTargets(options?: {
                minSize?: number;
            }): Promise<R>;
            toHaveNoOccludedActions(options?: LayoutAuditOptions): Promise<R>;
            toHaveNoElementCollisions(options?: LayoutAuditOptions): Promise<R>;
            toHaveNoNestedScrollTraps(options?: LayoutAuditOptions): Promise<R>;
            toHaveAccessibleInteractiveNames(options?: LayoutAuditOptions): Promise<R>;
            toPass200PercentZoomReflow(zoomFactor?: number): Promise<R>;
            toHaveAcceptableLayoutShift(action: () => Promise<void>, options?: {
                maxAcceptableScore?: number;
                maxAcceptableDisplacement?: number;
            }): Promise<R>;
            toPassLayoutAudit(options?: LayoutAuditOptions & {
                minScore?: number;
            }): Promise<R>;
        }
    }
}

export { type AccessibleNameIssue as A, type BoundingBox as B, type ContainerInnerBox as C, type DevicePreset as D, type ElementComputedStyles as E, type FocusIndicatorIssue as F, type LayoutAuditOptions as L, type OcclusionIssue as O, type ReadabilityIssue as R, type ScrollTrapIssue as S, type TextFlowAnomalyType as T, type UXGrade as U, type ViewportInfo as V, type ZoomReflowResult as Z, type LayoutAuditResult as a, type LayoutShiftResult as b, type ContainerOverflowIssue as c, type TextFlowIssue as d, type LayoutShiftItem as e, type ViewportFitResult as f, type TouchTargetIssue as g, type ElementCollisionIssue as h, type ColorContrastIssue as i, type ThumbZoneAnalysis as j, type OverflowIssue as k, type UXScore as l, type UXCategoryScore as m, customMatchers as n };
