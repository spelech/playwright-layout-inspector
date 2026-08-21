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
  fontSize?: string;
  lineHeight?: string;
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
  severity: 'warning' | 'info';
  suggestion: string;
}

export interface OcclusionIssue {
  selector: string;
  occludedBySelector: string;
  occludedAreaRatio: number;
  isInteractive: boolean;
  severity: 'critical' | 'warning';
  suggestion: string;
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
    stability: UXCategoryScore;
    overflowAndFit: UXCategoryScore;
    touchErgonomics: UXCategoryScore;
    readabilityAndVisibility: UXCategoryScore;
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
  checkViewportFit?: boolean;
  checkReadability?: boolean;
  minFontSizePx?: number; // default 12
  checkOcclusion?: boolean;
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
  layoutShiftResult?: LayoutShiftResult;
  touchTargetIssues: TouchTargetIssue[];
  viewportFit: ViewportFitResult;
  readabilityIssues: ReadabilityIssue[];
  occlusionIssues: OcclusionIssue[];
  screenshotBase64?: string;
  annotatedScreenshotBase64?: string;
  executionTimeMs: number;
}
