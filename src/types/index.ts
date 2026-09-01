export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ViewportInfo {
  width: number;
  height: number;
  devicePixelRatio: number;
  scrollX: number;
  scrollY: number;
  scrollWidth: number;
  scrollHeight: number;
  metaViewport?: string | null;
}

export interface ElementComputedStyles {
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

export interface OverflowIssue {
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

export interface ContainerInnerBox {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

export interface ContainerOverflowIssue {
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

export type TextFlowAnomalyType =
  | 'mid-word-break'
  | 'orphan-wrap'
  | 'broken-multiline-button'
  | 'crushed-flex-column';

export interface TextFlowIssue {
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

export interface LayoutShiftItem {
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

export interface LayoutShiftResult {
  totalShiftScore: number;
  totalDisplacedElements: number;
  maxDisplacementPx: number;
  jarringShiftCount: number;
  items: LayoutShiftItem[];
  isAcceptable: boolean;
  summary: string;
}

export interface TouchTargetIssue {
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

export interface ViewportFitResult {
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

export interface ReadabilityIssue {
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

export interface OcclusionIssue {
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

export interface ElementCollisionIssue {
  selectorA: string;
  selectorB: string;
  boundingBoxA: BoundingBox;
  boundingBoxB: BoundingBox;
  overlapAreaPx: number;
  isTextCollision: boolean;
  severity: 'critical' | 'warning';
  suggestion: string;
}

export interface ScrollTrapIssue {
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

export interface AccessibleNameIssue {
  selector: string;
  tagName: string;
  isIconOnly: boolean;
  computedRole: string;
  textSnippet?: string;
  severity: 'critical' | 'warning';
  suggestion: string;
}

export interface ColorContrastIssue {
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

export interface FocusIndicatorIssue {
  selector: string;
  tagName: string;
  hasVisibleFocusRing: boolean;
  computedOutline: string;
  computedBoxShadow: string;
  severity: 'critical' | 'warning';
  suggestion: string;
}

export interface ThumbZoneAnalysis {
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

export interface ZoomReflowResult {
  zoomFactor: number;
  passesReflow: boolean;
  hasHorizontalBleed: boolean;
  pageScrollWidth: number;
  windowWidth: number;
  collisionCount: number;
  issues: string[];
  summary: string;
}

export type UXGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface UXCategoryScore {
  name: string;
  score: number;
  weight: number;
  maxScore: number;
  grade: UXGrade;
  passed: boolean;
  issueCount: number;
  summary: string;
}

export interface UXScore {
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

export interface DevicePreset {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
  userAgent?: string;
  category: 'mobile' | 'tablet' | 'desktop';
}

export interface LayoutAuditOptions {
  device?: string | DevicePreset;
  checkTouchTargets?: boolean;
  minTouchTargetSize?: number; // default 24 for AA, 44 for AAA
  checkOverflow?: boolean;
  checkContainerOverflow?: boolean;
  checkTextFlow?: boolean;
  checkViewportFit?: boolean;
  checkReadability?: boolean;
  minFontSizePx?: number; // default 12
  checkContrast?: boolean;
  minContrastRatio?: number; // default 4.5 for AA normal text, 3.0 for large text
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

export interface LayoutAuditResult {
  url: string;
  timestamp: string;
  device?: DevicePreset | { name: string; width: number; height: number };
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
