import { D as DevicePreset, B as BoundingBox, V as ViewportInfo, E as ElementComputedStyles, L as LayoutShiftItem, a as LayoutShiftResult, b as ViewportFitResult, T as TouchTargetIssue, R as ReadabilityIssue, O as OcclusionIssue, c as ElementCollisionIssue, S as ScrollTrapIssue, A as AccessibleNameIssue, F as FocusIndicatorIssue, C as ColorContrastIssue, d as ThumbZoneAnalysis, Z as ZoomReflowResult, U as UXGrade, e as OverflowIssue, f as UXScore, g as LayoutAuditResult, h as LayoutAuditOptions } from './matchers-BgW_BA4q.js';
export { i as UXCategoryScore, j as customMatchers } from './matchers-BgW_BA4q.js';
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

export { AccessibleNameIssue, BoundingBox, ColorContrastIssue, DEVICE_PRESETS, DevicePreset, ElementCollisionIssue, ElementComputedStyles, type ElementSnapshot, FocusIndicatorIssue, type InPageAuditData, LayoutAuditOptions, LayoutAuditResult, LayoutInspector, LayoutShiftItem, LayoutShiftResult, OcclusionIssue, OverflowIssue, type PointSample, ReadabilityIssue, ScrollTrapIssue, type ThumbZone, ThumbZoneAnalysis, TouchTargetIssue, UXGrade, UXScore, ViewportFitResult, ViewportInfo, ZoomReflowResult, calculateGrade, calculateOverflow, categorizeThumbZone, collectInPageAuditScript, computeAABBOverlapArea, computeElementDisplacement, computeUXScore, evaluateAccessibleName, evaluateColorContrast, evaluateElementCollisions, evaluateElementOcclusion, evaluateFocusIndicator, evaluateLayoutShift, evaluateScrollTrap, evaluateTextReadability, evaluateThumbZoneErgonomics, evaluateTouchTarget, evaluateViewportFit, evaluateZoomReflow, generateHtmlReport, generateOverflowRemediation, generateRaycastSamplePoints, getContrastRatio, getDevicePreset, getInPageAuditFunctionString, getRelativeLuminance, parseColor };
