import { D as DevicePreset, B as BoundingBox, V as ViewportInfo, E as ElementComputedStyles, C as ContainerInnerBox, a as ContainerOverflowIssue, T as TextFlowAnomalyType, b as TextFlowIssue, L as LayoutShiftItem, c as LayoutShiftResult, d as ViewportFitResult, e as TouchTargetIssue, R as ReadabilityIssue, O as OcclusionIssue, f as ElementCollisionIssue, S as ScrollTrapIssue, A as AccessibleNameIssue, F as FocusIndicatorIssue, g as ColorContrastIssue, h as ThumbZoneAnalysis, Z as ZoomReflowResult, U as UXGrade, i as OverflowIssue, j as UXScore, k as LayoutAuditResult, l as LayoutAuditOptions } from './matchers-CLiGOt2H.js';
export { m as UXCategoryScore, n as customMatchers } from './matchers-CLiGOt2H.js';
import { Page } from '@playwright/test';

declare const DEVICE_PRESETS: Record<string, DevicePreset>;
declare function getDevicePreset(nameOrDevice: string | DevicePreset): DevicePreset;

declare function calculateOverflow(rect: BoundingBox, viewport: ViewportInfo): {
    overflowRightPx: number;
    overflowBottomPx: number;
    overflowLeftPx: number;
    hasOverflow: boolean;
};
declare function generateOverflowRemediation(issue: {
    tagName: string;
    selector: string;
    boundingBox: BoundingBox;
    viewport: ViewportInfo;
    styles: ElementComputedStyles;
    overflowRightPx: number;
}): {
    culpritDescription: string;
    suggestedFix: string;
};

declare function calculateContainerOverflow(childRect: BoundingBox, containerInnerBox: ContainerInnerBox, thresholdPx?: number): {
    overflowRightPx: number;
    overflowBottomPx: number;
    overflowLeftPx: number;
    overflowTopPx: number;
    hasOverflow: boolean;
};
declare function isExemptFromContainerOverflow(element: {
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
}): boolean;
declare function generateContainerOverflowRemediation(params: {
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
}): {
    culpritDescription: string;
    suggestedFix: string;
};
declare function evaluateContainerOverflow(params: {
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
}): ContainerOverflowIssue | null;

interface RawTextFlowAnomaly {
    selector: string;
    tagName: string;
    textSnippet: string;
    anomalyType: TextFlowAnomalyType;
    word?: string;
    orphanText?: string;
    lineCount?: number;
    lastLineWordCount?: number;
    elementWidth?: number;
    scrollWidth?: number;
    clientWidth?: number;
    computedStyles?: {
        wordBreak?: string;
        overflowWrap?: string;
        whiteSpace?: string;
        textWrap?: string;
        display?: string;
        flex?: string;
    };
}
declare function generateTextFlowRemediation(anomaly: RawTextFlowAnomaly): {
    details: string;
    suggestedFix: string;
    severity: 'critical' | 'warning';
};
declare function evaluateTextFlow(anomaly: RawTextFlowAnomaly): TextFlowIssue;

interface ElementSnapshot {
    selector: string;
    tagName: string;
    id?: string;
    className?: string;
    textSnippet?: string;
    rect: BoundingBox;
}
declare function computeElementDisplacement(before: ElementSnapshot, after: ElementSnapshot, viewport: ViewportInfo): LayoutShiftItem | null;
declare function evaluateLayoutShift(beforeSnapshots: ElementSnapshot[], afterSnapshots: ElementSnapshot[], viewport: ViewportInfo, options?: {
    maxAcceptableScore?: number;
    maxAcceptableDisplacement?: number;
}): LayoutShiftResult;

declare function evaluateViewportFit(metaContent: string | null | undefined, viewport: ViewportInfo): ViewportFitResult;

declare function evaluateTouchTarget(target: {
    selector: string;
    tagName: string;
    id?: string;
    className?: string;
    text?: string;
    boundingBox: BoundingBox;
}, adjacentTargets?: {
    selector: string;
    boundingBox: BoundingBox;
}[], options?: {
    minTargetSize?: number;
    standard?: 'WCAG_AA' | 'WCAG_AAA' | 'MOBILE_RECOMMENDED';
}): TouchTargetIssue | null;

declare function evaluateTextReadability(element: {
    selector: string;
    text: string;
    fontSizePx: number;
    lineHeightPx?: number;
    scrollWidth: number;
    clientWidth: number;
    textOverflow: string;
    overflow: string;
    hasAccessibleTooltip?: boolean;
}, isMobile: boolean, minFontSizePx?: number): ReadabilityIssue | null;

interface PointSample {
    x: number;
    y: number;
}
declare function generateRaycastSamplePoints(rect: BoundingBox): PointSample[];
declare function evaluateElementOcclusion(target: {
    selector: string;
    tagName: string;
    boundingBox: BoundingBox;
    isInteractive: boolean;
}, raycastResults: {
    point: PointSample;
    topSelector: string;
    topTagName: string;
    isTargetOrDescendant: boolean;
}[]): OcclusionIssue | null;

declare function computeAABBOverlapArea(a: BoundingBox, b: BoundingBox): number;
declare function evaluateElementCollisions(elements: Array<{
    selector: string;
    tagName: string;
    textSnippet?: string;
    rect: BoundingBox;
    isInteractive: boolean;
    isTextOnly: boolean;
    parentId?: string;
    ancestors?: string[];
}>, minOverlapAreaPx?: number): ElementCollisionIssue[];

declare function evaluateScrollTrap(container: {
    selector: string;
    tagName: string;
    scrollHeight: number;
    clientHeight: number;
    scrollWidth: number;
    clientWidth: number;
    overflowY: string;
    overflowX: string;
    overscrollBehavior?: string;
}, viewport: ViewportInfo): ScrollTrapIssue | null;

declare function evaluateAccessibleName(element: {
    selector: string;
    tagName: string;
    role?: string | null;
    ariaLabel?: string | null;
    ariaLabelledBy?: string | null;
    title?: string | null;
    innerText: string;
    hasSvgOrImgChild: boolean;
}): AccessibleNameIssue | null;
declare function evaluateFocusIndicator(element: {
    selector: string;
    tagName: string;
    outlineWidth: string;
    outlineStyle: string;
    outlineColor: string;
    boxShadow: string;
    isFocused: boolean;
}): FocusIndicatorIssue | null;

interface RGBA {
    r: number;
    g: number;
    b: number;
    a: number;
}
declare function parseColor(colorStr: string): RGBA | null;
/**
 * Calculate WCAG relative luminance according to W3C definition.
 */
declare function getRelativeLuminance(rgba: RGBA): number;
/**
 * Calculate WCAG contrast ratio between foreground and background.
 * Returns a ratio between 1 and 21.
 */
declare function getContrastRatio(fgColorStr: string, bgColorStr: string): number;
/**
 * Evaluate element for WCAG 2.1 Level AA color contrast compliance.
 */
declare function evaluateColorContrast(element: {
    selector: string;
    tagName: string;
    textSnippet?: string;
    color: string;
    backgroundColor: string;
    fontSizePx: number;
    fontWeight: string;
}, options?: {
    minRatio?: number;
}): ColorContrastIssue | null;

type ThumbZone = 'natural' | 'reach' | 'hard';
declare function categorizeThumbZone(rect: BoundingBox, viewport: ViewportInfo): ThumbZone;
declare function evaluateThumbZoneErgonomics(interactiveElements: Array<{
    selector: string;
    textSnippet?: string;
    rect: BoundingBox;
}>, viewport: ViewportInfo): ThumbZoneAnalysis;

declare function evaluateZoomReflow(params: {
    pageScrollWidth: number;
    windowWidth: number;
    collisionCount: number;
    zoomFactor?: number;
}): ZoomReflowResult;

declare function calculateGrade(score: number): UXGrade;
declare function computeUXScore(params: {
    overflowIssues: OverflowIssue[];
    containerOverflowIssues?: ContainerOverflowIssue[];
    textFlowIssues?: TextFlowIssue[];
    viewportFit: ViewportFitResult;
    layoutShiftResult?: LayoutShiftResult;
    touchTargetIssues: TouchTargetIssue[];
    readabilityIssues: ReadabilityIssue[];
    contrastIssues?: ColorContrastIssue[];
    occlusionIssues: OcclusionIssue[];
    collisionIssues?: ElementCollisionIssue[];
    scrollTrapIssues?: ScrollTrapIssue[];
    accessibleNameIssues?: AccessibleNameIssue[];
    focusIndicatorIssues?: FocusIndicatorIssue[];
    thumbZoneAnalysis?: ThumbZoneAnalysis;
}): UXScore;

interface InPageAuditData {
    viewport: {
        width: number;
        height: number;
        devicePixelRatio: number;
        scrollX: number;
        scrollY: number;
        scrollWidth: number;
        scrollHeight: number;
        metaViewport: string | null;
    };
    elements: Array<{
        selector: string;
        tagName: string;
        id: string;
        className: string;
        textSnippet: string;
        rect: {
            x: number;
            y: number;
            width: number;
            height: number;
            top: number;
            right: number;
            bottom: number;
            left: number;
        };
        computedStyles: {
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
            fontSize: string;
            lineHeight: string;
            fontWeight?: string;
            color?: string;
            backgroundColor?: string;
            zIndex?: string;
            outlineWidth?: string;
            outlineStyle?: string;
            outlineColor?: string;
            boxShadow?: string;
        };
        scrollWidth: number;
        clientWidth: number;
        scrollHeight: number;
        clientHeight: number;
        isInteractive: boolean;
        isTextOnly: boolean;
        hasDirectText?: boolean;
        hasAccessibleName: boolean;
        hasSvgOrImgChild: boolean;
        ancestors?: string[];
        role?: string | null;
        ariaLabel?: string | null;
        ariaLabelledBy?: string | null;
        title?: string | null;
    }>;
    containerOverflows: Array<{
        childSelector: string;
        childTagName: string;
        childId: string;
        childClassName: string;
        childRect: {
            x: number;
            y: number;
            width: number;
            height: number;
            top: number;
            right: number;
            bottom: number;
            left: number;
        };
        childStyles: any;
        childRole?: string | null;
        containerSelector: string;
        containerTagName: string;
        containerRect: {
            x: number;
            y: number;
            width: number;
            height: number;
            top: number;
            right: number;
            bottom: number;
            left: number;
        };
        containerInnerBox: {
            top: number;
            right: number;
            bottom: number;
            left: number;
            width: number;
            height: number;
        };
        containerStyles: any;
        overflowRightPx: number;
        overflowBottomPx: number;
        overflowLeftPx: number;
        overflowTopPx: number;
        isExempt: boolean;
    }>;
    textFlowAnomalies: Array<{
        selector: string;
        tagName: string;
        textSnippet: string;
        anomalyType: 'mid-word-break' | 'orphan-wrap' | 'broken-multiline-button' | 'crushed-flex-column';
        word?: string;
        orphanText?: string;
        lineCount?: number;
        lastLineWordCount?: number;
        elementWidth?: number;
        scrollWidth?: number;
        clientWidth?: number;
        computedStyles?: {
            wordBreak?: string;
            overflowWrap?: string;
            whiteSpace?: string;
            textWrap?: string;
            display?: string;
            flex?: string;
        };
    }>;
    occlusions: Array<{
        selector: string;
        tagName: string;
        boundingBox: {
            x: number;
            y: number;
            width: number;
            height: number;
            top: number;
            right: number;
            bottom: number;
            left: number;
        };
        raycastResults: Array<{
            point: {
                x: number;
                y: number;
            };
            topSelector: string;
            topTagName: string;
            isTargetOrDescendant: boolean;
        }>;
    }>;
}
declare function collectInPageAuditScript(optionsJson?: string): InPageAuditData;
declare function getInPageAuditFunctionString(): string;

declare function generateHtmlReport(result: LayoutAuditResult): string;

declare class LayoutInspector {
    private page;
    private defaultOptions;
    constructor(page: Page, defaultOptions?: LayoutAuditOptions);
    /**
     * Run a comprehensive UX & layout audit on the current page state.
     */
    audit(options?: LayoutAuditOptions): Promise<LayoutAuditResult>;
    /**
     * Test WCAG 1.4.10 Reflow at 200% zoom.
     */
    test200PercentZoomReflow(zoomFactor?: number): Promise<ZoomReflowResult>;
    /**
     * Track layout shift and element displacement occurring during an asynchronous action.
     */
    trackShifts(action: () => Promise<void>, options?: {
        maxAcceptableScore?: number;
        maxAcceptableDisplacement?: number;
    }): Promise<LayoutShiftResult>;
    /**
     * Generate and write an interactive HTML report to disk.
     */
    generateReport(result: LayoutAuditResult, outputPath: string): Promise<string>;
}

export { AccessibleNameIssue, BoundingBox, ColorContrastIssue, ContainerInnerBox, ContainerOverflowIssue, DEVICE_PRESETS, DevicePreset, ElementCollisionIssue, ElementComputedStyles, type ElementSnapshot, FocusIndicatorIssue, type InPageAuditData, LayoutAuditOptions, LayoutAuditResult, LayoutInspector, LayoutShiftItem, LayoutShiftResult, OcclusionIssue, OverflowIssue, type PointSample, type RawTextFlowAnomaly, ReadabilityIssue, ScrollTrapIssue, TextFlowAnomalyType, TextFlowIssue, type ThumbZone, ThumbZoneAnalysis, TouchTargetIssue, UXGrade, UXScore, ViewportFitResult, ViewportInfo, ZoomReflowResult, calculateContainerOverflow, calculateGrade, calculateOverflow, categorizeThumbZone, collectInPageAuditScript, computeAABBOverlapArea, computeElementDisplacement, computeUXScore, evaluateAccessibleName, evaluateColorContrast, evaluateContainerOverflow, evaluateElementCollisions, evaluateElementOcclusion, evaluateFocusIndicator, evaluateLayoutShift, evaluateScrollTrap, evaluateTextFlow, evaluateTextReadability, evaluateThumbZoneErgonomics, evaluateTouchTarget, evaluateViewportFit, evaluateZoomReflow, generateContainerOverflowRemediation, generateHtmlReport, generateOverflowRemediation, generateRaycastSamplePoints, generateTextFlowRemediation, getContrastRatio, getDevicePreset, getInPageAuditFunctionString, getRelativeLuminance, isExemptFromContainerOverflow, parseColor };
