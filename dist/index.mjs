import * as fs from 'fs';
import * as path from 'path';
import { expect } from '@playwright/test';

// src/core/devices.ts
var DEVICE_PRESETS = {
  "Samsung Galaxy S25+": {
    name: "Samsung Galaxy S25+",
    width: 412,
    height: 915,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    category: "mobile",
    userAgent: "Mozilla/5.0 (Linux; Android 15; SM-S936B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36"
  },
  "Samsung Galaxy S25": {
    name: "Samsung Galaxy S25",
    width: 384,
    height: 832,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    category: "mobile",
    userAgent: "Mozilla/5.0 (Linux; Android 15; SM-S931B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36"
  },
  "iPhone 16 Pro": {
    name: "iPhone 16 Pro",
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    category: "mobile",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1"
  },
  "iPhone 16": {
    name: "iPhone 16",
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    category: "mobile",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1"
  },
  "iPhone SE": {
    name: "iPhone SE",
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    category: "mobile",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
  },
  "Google Pixel 9 Pro": {
    name: "Google Pixel 9 Pro",
    width: 412,
    height: 915,
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    category: "mobile",
    userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36"
  },
  "iPad Air": {
    name: "iPad Air",
    width: 820,
    height: 1180,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    category: "tablet",
    userAgent: "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
  },
  "Desktop 1080p": {
    name: "Desktop 1080p",
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    category: "desktop",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
  },
  "Desktop 1440p": {
    name: "Desktop 1440p",
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: false,
    category: "desktop",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
  }
};
function getDevicePreset(nameOrDevice) {
  if (typeof nameOrDevice === "object" && nameOrDevice !== null && "name" in nameOrDevice && "width" in nameOrDevice && "height" in nameOrDevice) {
    return nameOrDevice;
  }
  if (typeof nameOrDevice === "string") {
    const match = DEVICE_PRESETS[nameOrDevice];
    if (match) return match;
    const lower = nameOrDevice.toLowerCase();
    for (const [key, val] of Object.entries(DEVICE_PRESETS)) {
      if (key.toLowerCase() === lower || key.toLowerCase().includes(lower)) {
        return val;
      }
    }
  }
  return DEVICE_PRESETS["Samsung Galaxy S25+"];
}

// src/core/overflow.ts
function calculateOverflow(rect, viewport) {
  const overflowRightPx = Math.max(0, rect.right - viewport.width);
  const overflowBottomPx = Math.max(0, rect.bottom - viewport.height);
  const overflowLeftPx = Math.max(0, -rect.left);
  const hasOverflow = overflowRightPx > 1 || overflowLeftPx > 1;
  return {
    overflowRightPx: Math.round(overflowRightPx * 100) / 100,
    overflowBottomPx: Math.round(overflowBottomPx * 100) / 100,
    overflowLeftPx: Math.round(overflowLeftPx * 100) / 100,
    hasOverflow
  };
}
function generateOverflowRemediation(issue) {
  const tagName = issue.tagName || "element";
  const selector = issue.selector || "";
  const widthPx = issue.boundingBox ? issue.boundingBox.width : 0;
  const viewportWidth = issue.viewport ? issue.viewport.width : 0;
  const overflowRightPx = issue.overflowRightPx ?? issue.overflowAmountPx ?? 0;
  const styles = issue.styles || issue.computedStyles || {};
  let culpritDescription = `Element <${tagName}> (${selector}) has width ${Math.round(widthPx)}px and extends ${Math.round(overflowRightPx)}px beyond viewport width (${viewportWidth}px).`;
  let suggestedFix = `Set max-width: 100% or overflow-x: auto on parent container.`;
  if (styles.transform && styles.transform !== "none" && styles.transform.includes("matrix")) {
    culpritDescription += ` Element has a CSS transform applied (${styles.transform}) which scales it past the screen boundary.`;
    suggestedFix = `Ensure transformed container has 'overflow: hidden' or compute dynamic scale based on viewport width: scale = Math.min(1.0, (viewportWidth - padding) / contentWidth).`;
  } else if (styles.width && styles.width.includes("px") && parseFloat(styles.width) > viewportWidth) {
    culpritDescription += ` Explicit fixed width of ${styles.width} exceeds viewport (${viewportWidth}px).`;
    suggestedFix = `Replace fixed width '${styles.width}' with responsive max-width (e.g. max-w-full, width: 100%, or fit-content) or add media queries.`;
  } else if (styles.minWidth && styles.minWidth !== "auto" && parseFloat(styles.minWidth) > viewportWidth) {
    culpritDescription += ` Fixed min-width '${styles.minWidth}' forces element to overflow.`;
    suggestedFix = `Set 'min-width: 0' or 'min-width: 100%' for responsive layout.`;
  }
  return { culpritDescription, suggestedFix };
}

// src/core/containerOverflow.ts
function calculateContainerOverflow(childRect, containerInnerBox, thresholdPx = 1.5) {
  const overflowRightPx = Math.max(0, childRect.right - containerInnerBox.right);
  const overflowBottomPx = Math.max(0, childRect.bottom - containerInnerBox.bottom);
  const overflowLeftPx = Math.max(0, containerInnerBox.left - childRect.left);
  const overflowTopPx = Math.max(0, containerInnerBox.top - childRect.top);
  const hasOverflow = overflowRightPx > thresholdPx || overflowLeftPx > thresholdPx || overflowBottomPx > thresholdPx;
  return {
    overflowRightPx: Math.round(overflowRightPx * 100) / 100,
    overflowBottomPx: Math.round(overflowBottomPx * 100) / 100,
    overflowLeftPx: Math.round(overflowLeftPx * 100) / 100,
    overflowTopPx: Math.round(overflowTopPx * 100) / 100,
    hasOverflow
  };
}
function isExemptFromContainerOverflow(element) {
  const {
    tagName,
    className = "",
    role,
    position = "static",
    isPopoverOrTooltip,
    isCornerControl,
    isDecorative,
    containerStyles
  } = element;
  if (isPopoverOrTooltip || isCornerControl || isDecorative) {
    return true;
  }
  if (position === "fixed") {
    return true;
  }
  tagName.toLowerCase();
  const classLower = (className || "").toLowerCase();
  const roleLower = (role || "").toLowerCase();
  const floatingRoles = ["tooltip", "menu", "listbox", "dialog", "alertdialog"];
  if (roleLower && floatingRoles.includes(roleLower)) {
    return true;
  }
  const floatingClassKeywords = [
    "tooltip",
    "popover",
    "dropdown",
    "menu",
    "toast",
    "floating",
    "popper",
    "modal-backdrop",
    "select-options",
    "tippy-box"
  ];
  if (floatingClassKeywords.some((keyword) => classLower.includes(keyword))) {
    return true;
  }
  const cornerClassKeywords = [
    "btn-close",
    "close-btn",
    "modal-close",
    "dialog-close",
    "badge",
    "indicator",
    "chip-corner",
    "pill"
  ];
  if (cornerClassKeywords.some((keyword) => classLower.includes(keyword))) {
    return true;
  }
  if (containerStyles) {
    const isScrollableX = containerStyles.overflowX === "auto" || containerStyles.overflowX === "scroll";
    const isScrollableY = containerStyles.overflowY === "auto" || containerStyles.overflowY === "scroll";
    if (isScrollableX && isScrollableY) {
      return true;
    }
  }
  return false;
}
function generateContainerOverflowRemediation(params) {
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
  culpritDescription += ".";
  if (childStyles.display === "flex" || childStyles.display === "inline-flex" || childStyles.flexWrap === "nowrap") {
    culpritDescription += ` Multi-item flex row has 'flex-wrap: nowrap' forcing children past container edge.`;
    suggestedFix = `Set 'flex-wrap: wrap' on flex parent or use responsive grid 'grid-template-columns: repeat(auto-fit, minmax(140px, 1fr))'.`;
  } else if (childStyles.width && childStyles.width.includes("px") && parseFloat(childStyles.width) > containerInnerWidth) {
    culpritDescription += ` Explicit fixed width of ${childStyles.width} exceeds container width (${containerInnerWidth}px).`;
    suggestedFix = `Replace fixed width '${childStyles.width}' with 'width: 100%' / 'max-width: 100%' or responsive layout constraints.`;
  } else if (childStyles.minWidth && childStyles.minWidth !== "auto" && parseFloat(childStyles.minWidth) > containerInnerWidth) {
    culpritDescription += ` Fixed min-width '${childStyles.minWidth}' forces element outside parent boundary.`;
    suggestedFix = `Set 'min-width: 0' or 'min-width: 100%' to allow responsive resizing within container.`;
  } else if (["input", "select", "textarea", "table", "img", "canvas"].includes(childTagName.toLowerCase())) {
    suggestedFix = `Ensure <${childTagName}> has 'max-width: 100%; box-sizing: border-box;' and flex children have 'min-width: 0;'.`;
  }
  return { culpritDescription, suggestedFix };
}
function evaluateContainerOverflow(params) {
  const { child, container } = params;
  if (isExemptFromContainerOverflow({
    tagName: child.tagName,
    className: child.className,
    id: child.id,
    role: child.role,
    position: child.computedStyles.position,
    isPopoverOrTooltip: child.isPopoverOrTooltip,
    isCornerControl: child.isCornerControl,
    isDecorative: child.isDecorative,
    containerStyles: container.computedStyles
  })) {
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
  const severity = overflow.overflowRightPx > 10 || overflow.overflowLeftPx > 10 || overflow.overflowBottomPx > 20 ? "critical" : "warning";
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

// src/core/textFlow.ts
function generateTextFlowRemediation(anomaly) {
  const {
    selector,
    tagName,
    textSnippet,
    anomalyType,
    word,
    orphanText,
    lineCount,
    elementWidth,
    computedStyles
  } = anomaly;
  switch (anomalyType) {
    case "mid-word-break": {
      const brokenWord = word || textSnippet;
      const details = `Word "${brokenWord}" in <${tagName}> (${selector}) is awkwardly broken across multiple lines without a hyphen due to 'word-break: break-all' or insufficient container width.`;
      const suggestedFix = `Remove 'word-break: break-all' and use 'overflow-wrap: break-word' or 'hyphens: auto'. Ensure container has sufficient min-width (e.g., 'min-width: fit-content').`;
      const severity = computedStyles?.wordBreak === "break-all" ? "critical" : "warning";
      return { details, suggestedFix, severity };
    }
    case "broken-multiline-button": {
      const details = `Interactive button <${tagName}> (${selector}) has text "${textSnippet}" that awkwardly wraps across ${lineCount || 2} lines (trailing: "${orphanText || ""}").`;
      const suggestedFix = `Set 'white-space: nowrap' or increase button min-width / padding (e.g. min-w-fit, px-4) so the button label stays on a single line.`;
      return { details, suggestedFix, severity: "critical" };
    }
    case "orphan-wrap": {
      const details = `<${tagName}> (${selector}) text leaves a single orphan word ("${orphanText || ""}") on the last line.`;
      const suggestedFix = `Apply 'text-wrap: balance' or 'text-wrap: pretty' to balance line lengths, or widen the container boundary.`;
      return { details, suggestedFix, severity: "warning" };
    }
    case "crushed-flex-column": {
      const width = elementWidth ? Math.round(elementWidth) : 0;
      const details = `Flex column <${tagName}> (${selector}) is crushed to ${width}px width, causing text clipping or overflowing content in a multi-column row.`;
      const suggestedFix = `Set 'flex: 1 1 0; min-width: 120px;' on flex items, or add 'flex-wrap: wrap' on the parent container.`;
      return { details, suggestedFix, severity: "critical" };
    }
    default: {
      return {
        details: `Text flow anomaly detected in <${tagName}> (${selector}).`,
        suggestedFix: `Check line wrapping and container constraints.`,
        severity: "warning"
      };
    }
  }
}
function evaluateTextFlow(anomaly) {
  const remediation = generateTextFlowRemediation(anomaly);
  return {
    selector: anomaly.selector,
    tagName: anomaly.tagName,
    textSnippet: anomaly.textSnippet,
    anomalyType: anomaly.anomalyType,
    details: remediation.details,
    lineCount: anomaly.lineCount,
    lastLineWordCount: anomaly.lastLineWordCount,
    orphanText: anomaly.orphanText,
    computedStyles: anomaly.computedStyles,
    severity: remediation.severity,
    suggestedFix: remediation.suggestedFix
  };
}

// src/core/layoutShift.ts
function computeElementDisplacement(before, after, viewport) {
  const deltaX = after.rect.x - before.rect.x;
  const deltaY = after.rect.y - before.rect.y;
  const distance = Math.hypot(deltaX, deltaY);
  if (distance < 1) {
    return null;
  }
  const viewportArea = viewport.width * viewport.height;
  const elementArea = before.rect.width * before.rect.height;
  const areaRatio = Math.min(1, elementArea / viewportArea);
  const maxViewportDim = Math.max(viewport.width, viewport.height);
  const distanceFraction = distance / maxViewportDim;
  const impactScore = Math.round(areaRatio * distanceFraction * 1e4) / 1e4;
  const isJarring = distance > 20 || impactScore > 0.02;
  let explanation = `Element shifted by \u0394x: ${Math.round(deltaX)}px, \u0394y: ${Math.round(deltaY)}px (total distance: ${Math.round(distance)}px).`;
  if (Math.abs(deltaY) > 20 && Math.abs(deltaX) <= 5) {
    explanation = `Vertical jump of ${Math.round(Math.abs(deltaY))}px detected (likely caused by accordion, drawer, or modal expanding/collapsing).`;
  } else if (Math.abs(deltaX) > 20 && Math.abs(deltaY) <= 5) {
    explanation = `Horizontal slide/jump of ${Math.round(Math.abs(deltaX))}px detected.`;
  }
  return {
    selector: before.selector,
    tagName: before.tagName,
    id: before.id,
    className: before.className,
    textSnippet: before.textSnippet,
    beforeRect: before.rect,
    afterRect: after.rect,
    deltaX: Math.round(deltaX * 100) / 100,
    deltaY: Math.round(deltaY * 100) / 100,
    distance: Math.round(distance * 100) / 100,
    areaRatio: Math.round(areaRatio * 1e3) / 1e3,
    impactScore,
    isJarring,
    explanation
  };
}
function evaluateLayoutShift(beforeSnapshots, afterSnapshots, viewport, options) {
  const maxAcceptableScore = options?.maxAcceptableScore ?? 0.05;
  const maxAcceptableDisplacement = options?.maxAcceptableDisplacement ?? 15;
  const afterMap = /* @__PURE__ */ new Map();
  for (const snap of afterSnapshots) {
    afterMap.set(snap.selector, snap);
  }
  const items = [];
  let totalShiftScore = 0;
  let maxDisplacementPx = 0;
  let jarringShiftCount = 0;
  for (const before of beforeSnapshots) {
    const after = afterMap.get(before.selector);
    if (!after) continue;
    const shift = computeElementDisplacement(before, after, viewport);
    if (shift) {
      items.push(shift);
      totalShiftScore += shift.impactScore;
      if (shift.distance > maxDisplacementPx) {
        maxDisplacementPx = shift.distance;
      }
      if (shift.isJarring) {
        jarringShiftCount++;
      }
    }
  }
  items.sort((a, b) => b.impactScore - a.impactScore);
  const roundedScore = Math.round(totalShiftScore * 1e4) / 1e4;
  const isAcceptable = roundedScore <= maxAcceptableScore && maxDisplacementPx <= maxAcceptableDisplacement && jarringShiftCount === 0;
  let summary = `Layout is visually stable (Shift Score: ${roundedScore}, Max Jump: ${Math.round(maxDisplacementPx)}px).`;
  if (!isAcceptable) {
    summary = `Jarring layout instability detected: ${items.length} elements shifted, max displacement was ${Math.round(maxDisplacementPx)}px with ${jarringShiftCount} jarring shifts (Score: ${roundedScore}).`;
  }
  return {
    totalShiftScore: roundedScore,
    totalDisplacedElements: items.length,
    maxDisplacementPx: Math.round(maxDisplacementPx * 100) / 100,
    jarringShiftCount,
    items,
    isAcceptable,
    summary
  };
}

// src/core/viewportFit.ts
function evaluateViewportFit(metaContent, viewport) {
  const issues = [];
  const suggestions = [];
  let isValidMetaViewport = false;
  let allowsUserZoom = true;
  let isWidthDeviceWidth = false;
  let initialScale = 1;
  let isMobileOptimized = false;
  if (metaContent) {
    isValidMetaViewport = true;
    const parts = metaContent.toLowerCase().split(",").map((s) => s.trim());
    for (const part of parts) {
      if (part.includes("width=device-width")) {
        isWidthDeviceWidth = true;
      }
      if (part.includes("user-scalable=no") || part.includes("user-scalable=0")) {
        allowsUserZoom = false;
        issues.push("Viewport meta tag explicitly disables user pinch-to-zoom (user-scalable=no/0), violating WCAG 1.4.4 resize standard.");
        suggestions.push('Remove "user-scalable=no" and allow users to zoom content freely.');
      }
      if (part.includes("maximum-scale=1") || part.includes("maximum-scale=1.0")) {
        allowsUserZoom = false;
        issues.push("Viewport meta tag restricts maximum zoom scale to 1.0 (maximum-scale=1), preventing users from zooming.");
        suggestions.push("Set maximum-scale to 5.0 or remove maximum-scale constraint.");
      }
      if (part.startsWith("initial-scale=")) {
        const val = parseFloat(part.replace("initial-scale=", ""));
        if (!isNaN(val)) initialScale = val;
      }
    }
    if (isWidthDeviceWidth && initialScale >= 0.9 && initialScale <= 1.1) {
      isMobileOptimized = true;
    }
  } else {
    issues.push('Missing <meta name="viewport"> tag. Mobile browsers will render page in desktop emulation mode (980px viewport).');
    suggestions.push('Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> to your HTML <head>.');
  }
  const pageScrollWidth = viewport.scrollWidth;
  const windowWidth = viewport.width;
  const horizontalOverflowRatio = Math.round(pageScrollWidth / windowWidth * 1e3) / 1e3;
  const contentBleeds = horizontalOverflowRatio > 1.01;
  if (contentBleeds) {
    const bleedPx = Math.round(pageScrollWidth - windowWidth);
    issues.push(`Page content width (${pageScrollWidth}px) exceeds viewport width (${windowWidth}px) by ${bleedPx}px, causing unwanted horizontal scroll.`);
    suggestions.push(`Inspect overflowing child elements, ensure max-w-full and overflow-x: hidden/clip on page body.`);
  }
  return {
    isValidMetaViewport,
    metaContent,
    allowsUserZoom,
    isWidthDeviceWidth,
    initialScale,
    isMobileOptimized,
    pageScrollWidth,
    windowWidth,
    horizontalOverflowRatio,
    contentBleeds,
    issues,
    suggestions
  };
}

// src/core/touchTargets.ts
function evaluateTouchTarget(target, adjacentTargets, options) {
  const standard = options?.standard ?? "WCAG_AA";
  const minTargetSize = options?.minTargetSize ?? (standard === "WCAG_AAA" ? 44 : standard === "MOBILE_RECOMMENDED" ? 48 : 24);
  const width = Math.round(target.boundingBox.width * 100) / 100;
  const height = Math.round(target.boundingBox.height * 100) / 100;
  if (width <= 0 || height <= 0) return null;
  const failsWidth = width < minTargetSize;
  const failsHeight = height < minTargetSize;
  if (!failsWidth && !failsHeight) {
    return null;
  }
  const spacingIssues = [];
  if (adjacentTargets && adjacentTargets.length > 0) {
    const centerA = {
      x: target.boundingBox.x + target.boundingBox.width / 2,
      y: target.boundingBox.y + target.boundingBox.height / 2
    };
    for (const adj of adjacentTargets) {
      if (adj.selector === target.selector) continue;
      const centerB = {
        x: adj.boundingBox.x + adj.boundingBox.width / 2,
        y: adj.boundingBox.y + adj.boundingBox.height / 2
      };
      const centerDist = Math.hypot(centerA.x - centerB.x, centerA.y - centerB.y);
      const edgeDist = centerDist - (Math.max(width, height) / 2 + Math.max(adj.boundingBox.width, adj.boundingBox.height) / 2);
      if (edgeDist < 8 && centerDist < minTargetSize) {
        spacingIssues.push({
          adjacentSelector: adj.selector,
          distancePx: Math.max(0, Math.round(edgeDist))
        });
      }
    }
  }
  const severity = width < 20 || height < 20 || spacingIssues.length > 0 ? "critical" : "warning";
  let suggestion = `Increase interactive target size to at least ${minTargetSize}x${minTargetSize}px (currently ${Math.round(width)}x${Math.round(height)}px) using padding (e.g. 'p-2' or 'p-3') or min-h-[${minTargetSize}px] min-w-[${minTargetSize}px].`;
  if (spacingIssues.length > 0) {
    suggestion += ` Add spacing/gap between this element and adjacent interactive target (${spacingIssues[0].adjacentSelector}) to prevent mis-taps.`;
  }
  return {
    selector: target.selector,
    tagName: target.tagName,
    id: target.id,
    className: target.className,
    text: target.text,
    boundingBox: target.boundingBox,
    width,
    height,
    standard,
    minRequiredSize: minTargetSize,
    severity,
    spacingIssues: spacingIssues.length > 0 ? spacingIssues : void 0,
    suggestion
  };
}

// src/core/readability.ts
function evaluateTextReadability(element, isMobile, minFontSizePx = 12) {
  const isIllegibleOnMobile = isMobile && element.fontSizePx < minFontSizePx;
  const isTruncated = element.scrollWidth > element.clientWidth + 2 && (element.overflow === "hidden" || element.textOverflow === "ellipsis");
  const hasAccessibleTooltip = !!element.hasAccessibleTooltip;
  if (!isIllegibleOnMobile && !isTruncated) {
    return null;
  }
  if (isTruncated && hasAccessibleTooltip && !isIllegibleOnMobile) {
    return null;
  }
  const severity = isIllegibleOnMobile && element.fontSizePx < 10 ? "warning" : "info";
  let suggestion = "";
  if (isIllegibleOnMobile && isTruncated) {
    suggestion = `Font size (${Math.round(element.fontSizePx)}px) is too small on mobile (< ${minFontSizePx}px) and text is truncated (${element.scrollWidth}px > ${element.clientWidth}px). Increase font-size to text-xs/text-sm and provide adequate width or wrapping.`;
  } else if (isIllegibleOnMobile) {
    suggestion = `Font size (${Math.round(element.fontSizePx)}px) is below mobile readability threshold (${minFontSizePx}px). Increase to at least 12px (text-xs/text-sm).`;
  } else if (isTruncated) {
    suggestion = `Text is overflowing and clipped/truncated without full expansion. Consider adding title/tooltip attribute or flexible wrapping.`;
  }
  return {
    selector: element.selector,
    textSnippet: element.text.length > 50 ? element.text.substring(0, 47) + "..." : element.text,
    fontSizePx: Math.round(element.fontSizePx * 10) / 10,
    lineHeightPx: element.lineHeightPx ? Math.round(element.lineHeightPx * 10) / 10 : void 0,
    isTruncated,
    isIllegibleOnMobile,
    hasAccessibleTooltip,
    severity,
    suggestion
  };
}

// src/core/occlusion.ts
function generateRaycastSamplePoints(rect) {
  const insetX = Math.min(4, rect.width * 0.1);
  const insetY = Math.min(4, rect.height * 0.1);
  return [
    { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
    // Center
    { x: rect.x + insetX, y: rect.y + insetY },
    // Top-Left
    { x: rect.right - insetX, y: rect.y + insetY },
    // Top-Right
    { x: rect.x + insetX, y: rect.bottom - insetY },
    // Bottom-Left
    { x: rect.right - insetX, y: rect.bottom - insetY }
    // Bottom-Right
  ];
}
function evaluateElementOcclusion(target, raycastResults) {
  if (!target.isInteractive || raycastResults.length === 0) {
    return null;
  }
  const occludedPoints = raycastResults.filter((r) => !r.isTargetOrDescendant);
  if (occludedPoints.length === 0) {
    return null;
  }
  const occludedAreaRatio = Math.round(occludedPoints.length / raycastResults.length * 100) / 100;
  const primaryOccluder = occludedPoints[0];
  const severity = occludedAreaRatio >= 0.5 ? "critical" : "warning";
  const suggestion = `Element <${target.tagName}> (${target.selector}) has ${Math.round(occludedAreaRatio * 100)}% of its interactive click area occluded by <${primaryOccluder.topTagName}> (${primaryOccluder.topSelector}). Check z-index, fixed/sticky navigation overlays, or pointer-events: none.`;
  return {
    selector: target.selector,
    tagName: target.tagName,
    boundingBox: target.boundingBox,
    occludedBySelector: primaryOccluder.topSelector,
    occludedByTagName: primaryOccluder.topTagName,
    occludedPointsCount: occludedPoints.length,
    totalPointsChecked: raycastResults.length,
    occludedAreaRatio,
    isInteractive: target.isInteractive,
    severity,
    suggestion
  };
}

// src/core/collisions.ts
function computeAABBOverlapArea(a, b) {
  const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return Math.round(overlapX * overlapY * 100) / 100;
}
function evaluateElementCollisions(elements, minOverlapAreaPx = 25) {
  const issues = [];
  for (let i = 0; i < elements.length; i++) {
    const elA = elements[i];
    if (elA.rect.width <= 0 || elA.rect.height <= 0) continue;
    for (let j = i + 1; j < elements.length; j++) {
      const elB = elements[j];
      if (elB.rect.width <= 0 || elB.rect.height <= 0) continue;
      if (elA.ancestors || elB.ancestors) {
        const aIsAncestorOfB = elB.ancestors?.includes(elA.selector) ?? false;
        const bIsAncestorOfA = elA.ancestors?.includes(elB.selector) ?? false;
        if (aIsAncestorOfB || bIsAncestorOfA) continue;
      } else {
        if (elA.selector.includes(elB.selector) || elB.selector.includes(elA.selector)) {
          continue;
        }
      }
      const overlapArea = computeAABBOverlapArea(elA.rect, elB.rect);
      if (overlapArea >= minOverlapAreaPx) {
        const isTextCollision = elA.isTextOnly && elB.isTextOnly;
        const severity = isTextCollision || elA.isInteractive && elB.isInteractive ? "critical" : "warning";
        let suggestion = `Element (${elA.selector}) collides with (${elB.selector}) with ${Math.round(overlapArea)}px\xB2 overlap. Check flex-wrap, margin, or position absolute constraints.`;
        if (isTextCollision) {
          suggestion = `Text labels (${elA.selector}) and (${elB.selector}) overlap by ${Math.round(overlapArea)}px\xB2, making characters illegible. Add flex gap or line wrapping.`;
        }
        issues.push({
          selectorA: elA.selector,
          selectorB: elB.selector,
          boundingBoxA: elA.rect,
          boundingBoxB: elB.rect,
          overlapAreaPx: overlapArea,
          isTextCollision,
          severity,
          suggestion
        });
      }
    }
  }
  return issues;
}

// src/core/scrollTraps.ts
function evaluateScrollTrap(container, viewport) {
  const hasVerticalScroll = (container.overflowY === "auto" || container.overflowY === "scroll") && container.scrollHeight > container.clientHeight + 5;
  const hasHorizontalScroll = (container.overflowX === "auto" || container.overflowX === "scroll") && container.scrollWidth > container.clientWidth + 5;
  if (!hasVerticalScroll && !hasHorizontalScroll) {
    return null;
  }
  const viewportRatio = Math.round(container.clientHeight / viewport.height * 100) / 100;
  const isTrapRisk = viewportRatio >= 0.65 && hasVerticalScroll;
  if (!isTrapRisk && container.clientHeight < 120 && hasVerticalScroll) {
    return {
      selector: container.selector,
      tagName: container.tagName,
      scrollHeight: container.scrollHeight,
      clientHeight: container.clientHeight,
      scrollWidth: container.scrollWidth,
      clientWidth: container.clientWidth,
      viewportRatio,
      isTrapRisk: false,
      severity: "warning",
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
    severity: "critical",
    suggestion: `Nested scroll container (${container.selector}) occupies ${Math.round(viewportRatio * 100)}% of the viewport and traps mobile touch-scroll. Add 'overscroll-behavior: contain' and provide visible scroll affordance/padding so users can scroll the outer page.`
  };
}

// src/core/accessibility.ts
function evaluateAccessibleName(element) {
  const role = element.role || element.tagName.toLowerCase();
  const isInteractive = ["button", "a", "input", "select", "textarea", "tab", "menuitem"].includes(role) || element.role === "button";
  if (!isInteractive) {
    return null;
  }
  const hasAriaLabel = !!(element.ariaLabel && element.ariaLabel.trim().length > 0);
  const hasAriaLabelledBy = !!(element.ariaLabelledBy && element.ariaLabelledBy.trim().length > 0);
  const hasTitle = !!(element.title && element.title.trim().length > 0);
  const hasText = !!(element.innerText && element.innerText.trim().length > 0);
  const hasAccessibleName = hasAriaLabel || hasAriaLabelledBy || hasTitle || hasText;
  const isIconOnly = element.hasSvgOrImgChild && !hasText;
  if (hasAccessibleName) {
    return null;
  }
  const severity = isIconOnly ? "critical" : "warning";
  const suggestion = isIconOnly ? `Icon button <${element.tagName}> (${element.selector}) has no accessible text or label. Add 'aria-label="Action Name"' or 'title="Action Name"' for screen reader users.` : `Interactive element <${element.tagName}> (${element.selector}) is missing an accessible name. Add visible label or aria-label attribute.`;
  return {
    selector: element.selector,
    tagName: element.tagName,
    isIconOnly,
    computedRole: role,
    textSnippet: element.innerText || void 0,
    severity,
    suggestion
  };
}
function evaluateFocusIndicator(element) {
  const hasOutline = parseFloat(element.outlineWidth) > 0 && element.outlineStyle !== "none" && element.outlineColor !== "transparent";
  const hasBoxShadow = element.boxShadow && element.boxShadow !== "none" && !element.boxShadow.includes("rgba(0, 0, 0, 0)");
  const hasVisibleFocusRing = hasOutline || hasBoxShadow;
  if (hasVisibleFocusRing) {
    return null;
  }
  return {
    selector: element.selector,
    tagName: element.tagName,
    hasVisibleFocusRing: false,
    computedOutline: `${element.outlineWidth} ${element.outlineStyle} ${element.outlineColor}`,
    computedBoxShadow: element.boxShadow,
    severity: "warning",
    suggestion: `Element (${element.selector}) removes default focus ring ('outline: none') without providing a visible focus indicator (like 'focus-visible:ring-2 focus-visible:ring-indigo-500' or border). Keyboard users cannot track active focus.`
  };
}

// src/core/contrast.ts
function parseColor(colorStr) {
  if (!colorStr || colorStr === "transparent") {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
      a: rgbMatch[4] !== void 0 ? parseFloat(rgbMatch[4]) : 1
    };
  }
  if (colorStr.startsWith("#")) {
    const hex = colorStr.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1
      };
    }
    if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255
      };
    }
  }
  return null;
}
function getRelativeLuminance(rgba) {
  const [rs, gs, bs] = [rgba.r / 255, rgba.g / 255, rgba.b / 255].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}
function getContrastRatio(fgColorStr, bgColorStr) {
  const fg = parseColor(fgColorStr);
  const bg = parseColor(bgColorStr) || { r: 255, g: 255, b: 255};
  if (!fg) return 21;
  const effectiveFg = fg.a < 1 ? {
    r: Math.round(fg.r * fg.a + bg.r * (1 - fg.a)),
    g: Math.round(fg.g * fg.a + bg.g * (1 - fg.a)),
    b: Math.round(fg.b * fg.a + bg.b * (1 - fg.a))} : fg;
  const l1 = getRelativeLuminance(effectiveFg);
  const l2 = getRelativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
function evaluateColorContrast(element, options) {
  if (!element.textSnippet || element.textSnippet.trim().length === 0) {
    return null;
  }
  const isBold = parseInt(element.fontWeight, 10) >= 700 || element.fontWeight === "bold";
  const isLargeText = element.fontSizePx >= 24 || element.fontSizePx >= 18.66 && isBold;
  const defaultRequiredRatio = isLargeText ? 3 : 4.5;
  const requiredRatio = options?.minRatio !== void 0 ? options.minRatio : defaultRequiredRatio;
  const ratio = Math.round(getContrastRatio(element.color, element.backgroundColor) * 100) / 100;
  if (ratio >= requiredRatio) {
    return null;
  }
  const severity = ratio < 3 ? "critical" : "warning";
  const suggestion = `Text contrast ratio is ${ratio}:1 (${element.color} on ${element.backgroundColor}), which fails WCAG AA requirement of ${requiredRatio}:1 for ${isLargeText ? "large" : "normal"} text. Adjust text or background color to improve contrast.`;
  return {
    selector: element.selector,
    tagName: element.tagName,
    textSnippet: element.textSnippet.length > 50 ? element.textSnippet.substring(0, 47) + "..." : element.textSnippet,
    foregroundColor: element.color,
    backgroundColor: element.backgroundColor,
    contrastRatio: ratio,
    requiredRatio,
    fontSizePx: element.fontSizePx,
    isBold,
    severity,
    suggestion
  };
}

// src/core/ergonomics.ts
function categorizeThumbZone(rect, viewport) {
  const centerY = rect.y + rect.height / 2;
  if (viewport.width >= 768) {
    return "natural";
  }
  const screenHeight = viewport.height;
  const yRatio = centerY / screenHeight;
  if (yRatio >= 0.55 && yRatio <= 0.95) {
    return "natural";
  }
  if (yRatio >= 0.25 && yRatio < 0.55) {
    return "reach";
  }
  return "hard";
}
function evaluateThumbZoneErgonomics(interactiveElements, viewport) {
  if (viewport.width >= 768 || interactiveElements.length === 0) {
    return {
      naturalZoneCount: interactiveElements.length,
      reachZoneCount: 0,
      hardZoneCount: 0,
      totalInteractiveCount: interactiveElements.length,
      hardZoneElements: [],
      ergonomicsScore: 100,
      summary: "Desktop/tablet viewport: thumb zones not restricted to mobile reach radius."
    };
  }
  let naturalCount = 0;
  let reachCount = 0;
  let hardCount = 0;
  const hardZoneElements = [];
  for (const el of interactiveElements) {
    const zone = categorizeThumbZone(el.rect, viewport);
    if (zone === "natural") {
      naturalCount++;
    } else if (zone === "reach") {
      reachCount++;
    } else {
      hardCount++;
      hardZoneElements.push({
        selector: el.selector,
        text: el.textSnippet,
        x: el.rect.x,
        y: el.rect.y
      });
    }
  }
  const total = interactiveElements.length;
  const weightedScore = (naturalCount * 1 + reachCount * 0.8 + hardCount * 0.5) / total;
  const ergonomicsScore = Math.round(weightedScore * 100);
  let summary = `Mobile thumb ergonomics score: ${ergonomicsScore}/100 (${naturalCount} in Natural zone, ${reachCount} in Reach zone, ${hardCount} in Hard zone).`;
  if (hardCount > naturalCount) {
    summary += ` High concentration of actions at top of screen. Consider placing primary mobile CTAs in bottom navigation or bottom floating sheets.`;
  }
  return {
    naturalZoneCount: naturalCount,
    reachZoneCount: reachCount,
    hardZoneCount: hardCount,
    totalInteractiveCount: total,
    hardZoneElements,
    ergonomicsScore,
    summary
  };
}

// src/core/zoomReflow.ts
function evaluateZoomReflow(params) {
  const zoomFactor = params.zoomFactor ?? 2;
  const issues = [];
  const hasHorizontalBleed = params.pageScrollWidth > params.windowWidth + 5;
  if (hasHorizontalBleed) {
    const bleedPx = Math.round(params.pageScrollWidth - params.windowWidth);
    issues.push(`Page content width (${params.pageScrollWidth}px) exceeds window width (${params.windowWidth}px) by ${bleedPx}px at ${Math.round(zoomFactor * 100)}% text scale, requiring two-dimensional scrolling.`);
  }
  if (params.collisionCount > 0) {
    issues.push(`${params.collisionCount} text collision(s) detected at ${Math.round(zoomFactor * 100)}% text scale.`);
  }
  const passesReflow = !hasHorizontalBleed && params.collisionCount === 0;
  let summary = `Complies with WCAG 1.4.10 Reflow standard at ${Math.round(zoomFactor * 100)}% text zoom (no horizontal scroll or collisions).`;
  if (!passesReflow) {
    summary = `Failed WCAG 1.4.10 Reflow at ${Math.round(zoomFactor * 100)}% text zoom: ${issues.join(" ")}`;
  }
  return {
    zoomFactor,
    passesReflow,
    hasHorizontalBleed,
    pageScrollWidth: params.pageScrollWidth,
    windowWidth: params.windowWidth,
    collisionCount: params.collisionCount,
    issues,
    summary
  };
}

// src/core/score.ts
function calculateGrade(score) {
  if (score >= 95) return "A+";
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}
function computeUXScore(params) {
  const {
    overflowIssues,
    containerOverflowIssues = [],
    flexBlowoutIssues = [],
    textFlowIssues = [],
    viewportFit,
    layoutShiftResult,
    touchTargetIssues,
    readabilityIssues,
    contrastIssues = [],
    occlusionIssues,
    stickyOcclusionIssues = [],
    collisionIssues = [],
    scrollTrapIssues = [],
    accessibleNameIssues = [],
    focusIndicatorIssues = [],
    thumbZoneAnalysis
  } = params;
  const maxOverflowScore = 25;
  let overflowPenalty = 0;
  if (viewportFit.contentBleeds) overflowPenalty += 12;
  if (!viewportFit.isValidMetaViewport) overflowPenalty += 8;
  if (!viewportFit.allowsUserZoom) overflowPenalty += 6;
  for (const issue of overflowIssues) {
    overflowPenalty += issue.severity === "critical" ? 8 : 3;
  }
  for (const cIssue of containerOverflowIssues) {
    overflowPenalty += cIssue.severity === "critical" ? 8 : 3;
  }
  for (const fIssue of flexBlowoutIssues) {
    overflowPenalty += fIssue.severity === "critical" ? 8 : 4;
  }
  for (const trap of scrollTrapIssues) {
    overflowPenalty += trap.severity === "critical" ? 6 : 2;
  }
  const overflowScoreVal = Math.max(0, Math.min(maxOverflowScore, maxOverflowScore - overflowPenalty));
  const totalOverflowIssues = overflowIssues.length + containerOverflowIssues.length + flexBlowoutIssues.length + scrollTrapIssues.length + viewportFit.issues.length;
  const overflowCategory = {
    name: "Overflow & Viewport Fit",
    score: Math.round(overflowScoreVal * 10) / 10,
    weight: maxOverflowScore,
    maxScore: maxOverflowScore,
    grade: calculateGrade(overflowScoreVal / maxOverflowScore * 100),
    passed: overflowScoreVal >= maxOverflowScore * 0.8,
    issueCount: totalOverflowIssues,
    summary: overflowIssues.length === 0 && containerOverflowIssues.length === 0 && flexBlowoutIssues.length === 0 && scrollTrapIssues.length === 0 && !viewportFit.contentBleeds ? "Perfect viewport and container containment fit without horizontal bleed or scroll traps." : `${overflowIssues.length} viewport overflow, ${containerOverflowIssues.length} container bleed, ${flexBlowoutIssues.length} flex blowout, ${scrollTrapIssues.length} scroll trap issues detected.`
  };
  const maxStabilityScore = 20;
  let stabilityScoreVal = maxStabilityScore;
  if (layoutShiftResult) {
    let shiftPenalty = 0;
    shiftPenalty += layoutShiftResult.jarringShiftCount * 6;
    shiftPenalty += Math.min(12, layoutShiftResult.totalShiftScore * 100);
    if (!layoutShiftResult.isAcceptable) {
      shiftPenalty = Math.max(shiftPenalty, 8);
    }
    stabilityScoreVal = Math.max(0, Math.min(maxStabilityScore, maxStabilityScore - shiftPenalty));
  }
  const stabilityCategory = {
    name: "Layout Stability & Shifts",
    score: Math.round(stabilityScoreVal * 10) / 10,
    weight: maxStabilityScore,
    maxScore: maxStabilityScore,
    grade: calculateGrade(stabilityScoreVal / maxStabilityScore * 100),
    passed: stabilityScoreVal >= maxStabilityScore * 0.8,
    issueCount: layoutShiftResult ? layoutShiftResult.items.length : 0,
    summary: layoutShiftResult ? layoutShiftResult.summary : "Visual layout is stable without jarring element jumps."
  };
  const maxTouchScore = 20;
  let touchPenalty = 0;
  for (const issue of touchTargetIssues) {
    touchPenalty += issue.severity === "critical" ? 4 : 2;
  }
  if (thumbZoneAnalysis && thumbZoneAnalysis.ergonomicsScore < 70) {
    touchPenalty += 3;
  }
  const touchScoreVal = Math.max(0, Math.min(maxTouchScore, maxTouchScore - touchPenalty));
  const touchCategory = {
    name: "Touch Ergonomics & Reachability",
    score: Math.round(touchScoreVal * 10) / 10,
    weight: maxTouchScore,
    maxScore: maxTouchScore,
    grade: calculateGrade(touchScoreVal / maxTouchScore * 100),
    passed: touchScoreVal >= maxTouchScore * 0.8,
    issueCount: touchTargetIssues.length,
    summary: touchTargetIssues.length === 0 ? "All interactive touch targets meet WCAG sizing standards (\u2265 24px/44px)." : `${touchTargetIssues.length} touch target sizing or collision issues detected.`
  };
  const maxReadabilityScore = 20;
  let readabilityPenalty = 0;
  for (const issue of readabilityIssues) {
    readabilityPenalty += issue.severity === "warning" ? 2 : 1;
  }
  for (const tf of textFlowIssues) {
    readabilityPenalty += tf.severity === "critical" ? 5 : 2;
  }
  for (const occ of occlusionIssues) {
    readabilityPenalty += occ.severity === "critical" ? 5 : 2;
  }
  for (const sOcc of stickyOcclusionIssues) {
    readabilityPenalty += sOcc.severity === "critical" ? 6 : 3;
  }
  for (const col of collisionIssues) {
    readabilityPenalty += col.severity === "critical" ? 5 : 2;
  }
  const readabilityScoreVal = Math.max(0, Math.min(maxReadabilityScore, maxReadabilityScore - readabilityPenalty));
  const totalVisibilityIssues = readabilityIssues.length + textFlowIssues.length + occlusionIssues.length + stickyOcclusionIssues.length + collisionIssues.length;
  const readabilityCategory = {
    name: "Readability & Visual Hierarchy",
    score: Math.round(readabilityScoreVal * 10) / 10,
    weight: maxReadabilityScore,
    maxScore: maxReadabilityScore,
    grade: calculateGrade(readabilityScoreVal / maxReadabilityScore * 100),
    passed: readabilityScoreVal >= maxReadabilityScore * 0.8,
    issueCount: totalVisibilityIssues,
    summary: totalVisibilityIssues === 0 ? "Clean visual hierarchy without element occlusion, text collision, awkward word breaks, or unreadable truncation." : `${totalVisibilityIssues} text, flow anomaly, occlusion, or collision issue(s) detected.`
  };
  const maxA11yScore = 15;
  let a11yPenalty = 0;
  for (const acc of accessibleNameIssues) {
    a11yPenalty += acc.severity === "critical" ? 4 : 2;
  }
  for (const foc of focusIndicatorIssues) {
    a11yPenalty += foc.severity === "critical" ? 4 : 2;
  }
  for (const con of contrastIssues) {
    a11yPenalty += con.severity === "critical" ? 5 : 2;
  }
  const a11yScoreVal = Math.max(0, Math.min(maxA11yScore, maxA11yScore - a11yPenalty));
  const totalA11yIssues = accessibleNameIssues.length + focusIndicatorIssues.length + contrastIssues.length;
  const a11yCategory = {
    name: "Accessibility & Keyboard Navigation",
    score: Math.round(a11yScoreVal * 10) / 10,
    weight: maxA11yScore,
    maxScore: maxA11yScore,
    grade: calculateGrade(a11yScoreVal / maxA11yScore * 100),
    passed: a11yScoreVal >= maxA11yScore * 0.8,
    issueCount: totalA11yIssues,
    summary: totalA11yIssues === 0 ? "Fully compliant accessibility semantics, focus rings, and WCAG color contrast ratios." : `${totalA11yIssues} accessibility, contrast, or focus indicator issue(s) detected.`
  };
  const totalScoreVal = Math.round((overflowScoreVal + stabilityScoreVal + touchScoreVal + readabilityScoreVal + a11yScoreVal) * 10) / 10;
  const overallGrade = calculateGrade(totalScoreVal);
  const passed = totalScoreVal >= 70 && overflowScoreVal >= maxOverflowScore * 0.6 && touchScoreVal >= maxTouchScore * 0.6;
  return {
    totalScore: totalScoreVal,
    grade: overallGrade,
    passed,
    categories: {
      overflowAndFit: overflowCategory,
      stability: stabilityCategory,
      touchErgonomics: touchCategory,
      readabilityAndVisibility: readabilityCategory,
      accessibilityAndFocus: a11yCategory
    }
  };
}

// src/core/browserScript.ts
function collectInPageAuditScript(optionsJson = "{}") {
  const options = JSON.parse(optionsJson || "{}");
  const ignoreSelectors = options.ignoreSelectors || [];
  const round2 = (n) => Math.round(n * 100) / 100;
  const toRect = (r) => ({
    x: round2(r.x ?? r.left),
    y: round2(r.y ?? r.top),
    width: round2(r.width),
    height: round2(r.height),
    top: round2(r.top),
    right: round2(r.right),
    bottom: round2(r.bottom),
    left: round2(r.left)
  });
  function getCssSelector(el) {
    if (el.id) return `#${CSS.escape(el.id)}`;
    const path2 = [];
    let current = el;
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        selector += `#${CSS.escape(current.id)}`;
        path2.unshift(selector);
        break;
      } else {
        let sibling = current;
        let nth = 1;
        while (sibling = sibling.previousElementSibling) {
          if (sibling.tagName === current.tagName) nth++;
        }
        if (current.className && typeof current.className === "string" && current.className.trim()) {
          const firstClass = current.className.trim().split(/\s+/)[0];
          if (firstClass && !firstClass.includes(":") && !firstClass.includes("/") && !firstClass.includes("[")) {
            selector += `.${CSS.escape(firstClass)}`;
          }
        }
        if (nth > 1) selector += `:nth-of-type(${nth})`;
      }
      path2.unshift(selector);
      current = current.parentElement;
      if (path2.length > 5) break;
    }
    return path2.join(" > ");
  }
  function parseRgba(str) {
    if (!str || str === "transparent") return null;
    const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return null;
    return {
      r: parseInt(m[1], 10),
      g: parseInt(m[2], 10),
      b: parseInt(m[3], 10),
      a: m[4] !== void 0 ? parseFloat(m[4]) : 1
    };
  }
  function isVisualContainer(targetEl, style) {
    const t = targetEl.tagName.toLowerCase();
    if (t === "body" || t === "html") return false;
    const semantic = ["dialog", "fieldset", "form", "aside", "section", "article", "main", "nav", "details", "table"];
    if (semantic.includes(t)) return true;
    const r = targetEl.getAttribute("role");
    if (r && ["dialog", "alertdialog", "region", "tabpanel", "group", "form"].includes(r)) return true;
    const c = (typeof targetEl.className === "string" ? targetEl.className : "").toLowerCase();
    if (/modal|card|panel|dialog|drawer|sheet|popup|box|container|wrapper|frame|window|tabpanel/.test(c)) return true;
    const hasBg = !!(style.backgroundColor && style.backgroundColor !== "rgba(0, 0, 0, 0)" && style.backgroundColor !== "transparent");
    const hasBorder = !!((parseFloat(style.borderTopWidth || "0") > 0 || parseFloat(style.borderWidth || "0") > 0) && style.borderStyle !== "none");
    const hasShadow = !!(style.boxShadow && style.boxShadow !== "none");
    const hasRadius = parseFloat(style.borderRadius || "0") > 0;
    const hasOverflow = style.overflow !== "visible" || style.overflowX !== "visible" || style.overflowY !== "visible";
    const hasConstrainedWidth = !!(style.width && style.width.includes("px") || style.maxWidth && style.maxWidth !== "none");
    return Boolean((hasBg || hasBorder || hasShadow || hasRadius || hasOverflow) && hasConstrainedWidth);
  }
  function getClosestVisualContainer(el) {
    let curr = el.parentElement;
    while (curr && curr.tagName.toLowerCase() !== "html" && curr.tagName.toLowerCase() !== "body") {
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
          selector: getCssSelector(curr),
          tagName: curr.tagName.toLowerCase(),
          rect: cRect,
          innerBox: toRect({
            top: innerTop,
            right: innerRight,
            bottom: innerBottom,
            left: innerLeft,
            width: Math.max(0, innerRight - innerLeft),
            height: Math.max(0, innerBottom - innerTop)
          }),
          comp
        };
      }
      curr = curr.parentElement;
    }
    return null;
  }
  function checkExemption(el, comp, containerComp) {
    if (comp.position === "fixed") return true;
    if (el.hasAttribute("popover") || el.popover) return true;
    const role = el.getAttribute("role") || "";
    if (["tooltip", "menu", "listbox", "dialog", "alertdialog"].includes(role)) return true;
    const cls = (typeof el.className === "string" ? el.className : "").toLowerCase();
    if (/tooltip|popover|dropdown|menu|toast|floating|popper|modal-backdrop|select-options|tippy-box/.test(cls)) return true;
    const ariaLabel = (el.getAttribute("aria-label") || "").toLowerCase();
    if ((/close|btn-close|dismiss|badge|indicator|pill|tag/.test(cls) || ariaLabel.includes("close") || ariaLabel.includes("dismiss")) && comp.position === "absolute") {
      return true;
    }
    if ((containerComp.overflowX === "auto" || containerComp.overflowX === "scroll") && (containerComp.overflowY === "auto" || containerComp.overflowY === "scroll")) {
      return true;
    }
    return el.getAttribute("aria-hidden") === "true" && comp.pointerEvents === "none";
  }
  const metaEl = document.querySelector('meta[name="viewport"]');
  const metaViewport = metaEl ? metaEl.getAttribute("content") : null;
  const vpWidth = window.visualViewport ? window.visualViewport.width : document.documentElement.clientWidth || window.innerWidth;
  const vpHeight = window.visualViewport ? window.visualViewport.height : document.documentElement.clientHeight || window.innerHeight;
  const vp = {
    width: round2(vpWidth),
    height: round2(vpHeight),
    devicePixelRatio: window.devicePixelRatio || 1,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body ? document.body.scrollWidth : 0),
    scrollHeight: Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0),
    metaViewport
  };
  const allElements = Array.from(document.querySelectorAll("body *"));
  const collectedElements = [];
  const containerOverflows = [];
  const textFlowAnomalies = [];
  const reportedOverflowParentSelectors = /* @__PURE__ */ new Set();
  for (const el of allElements) {
    const tag = el.tagName.toLowerCase();
    if (["script", "style", "noscript", "path", "g", "defs", "clippath", "symbol", "use", "br", "hr"].includes(tag)) continue;
    const selector = getCssSelector(el);
    if (ignoreSelectors.some((ign) => selector.includes(ign))) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 && rect.height <= 0) continue;
    const comp = window.getComputedStyle(el);
    if (comp.display === "none" || comp.visibility === "hidden" || parseFloat(comp.opacity) === 0) continue;
    const role = el.getAttribute("role");
    const isButton = tag === "button" || role === "button" || role === "tab" || role === "menuitem" || typeof el.className === "string" && el.className.includes("btn");
    const isLink = tag === "a" && el.hasAttribute("href");
    const isInput = ["input", "select", "textarea"].includes(tag);
    const hasCursorPointer = comp.cursor === "pointer";
    const hasExplicitClickHandler = el.hasAttribute("onclick") || typeof el.onclick === "function";
    const interactiveAncestor = el.parentElement ? el.parentElement.closest('button, a[href], [role="button"], [role="tab"], label') : null;
    const isDirectInteractive = (isButton || isLink || isInput || hasExplicitClickHandler || hasCursorPointer && ["div", "span", "li"].includes(tag)) && comp.pointerEvents !== "none" && el.getAttribute("aria-hidden") !== "true";
    const isInteractive = isDirectInteractive && !interactiveAncestor;
    const textContent = (el.textContent || "").trim().replace(/\s+/g, " ");
    const textSnippet = textContent.length > 60 ? textContent.substring(0, 57) + "..." : textContent;
    const isTextOnly = ["p", "span", "h1", "h2", "h3", "h4", "h5", "h6", "label", "strong", "em", "b", "i", "small"].includes(tag);
    const hasSvgOrImgChild = !!el.querySelector("svg, img");
    const ariaLabel = el.getAttribute("aria-label");
    const ariaLabelledBy = el.getAttribute("aria-labelledby");
    const title = el.getAttribute("title");
    const hasAccessibleName = !!(ariaLabel?.trim() || ariaLabelledBy?.trim() || title?.trim() || textContent.length > 0);
    const isVisuallyHidden = comp.display === "none" || comp.visibility === "hidden" || parseFloat(comp.opacity) === 0 || el.classList.contains("sr-only") || rect.width <= 1 && rect.height <= 1 && comp.overflow === "hidden";
    let hasDirectText = false;
    if (!isVisuallyHidden) {
      for (let i = 0; i < el.childNodes.length; i++) {
        const node = el.childNodes[i];
        if (node.nodeType === Node.TEXT_NODE && (node.nodeValue || "").trim().length > 0) {
          hasDirectText = true;
          break;
        }
      }
      if (tag === "input" || tag === "textarea" || tag === "select" || isTextOnly) hasDirectText = true;
    }
    const ancestors = [];
    let p = el.parentElement;
    while (p && p.tagName.toLowerCase() !== "html") {
      ancestors.push(getCssSelector(p));
      p = p.parentElement;
    }
    const bgStack = [];
    let currBgEl = el;
    while (currBgEl) {
      const bgStyle = window.getComputedStyle(currBgEl).backgroundColor;
      const parsed = parseRgba(bgStyle);
      if (parsed && parsed.a > 0) bgStack.unshift(parsed);
      currBgEl = currBgEl.parentElement;
    }
    let compBg = { r: 255, g: 255, b: 255};
    for (const bgLayer of bgStack) {
      if (bgLayer.a >= 1) {
        compBg = { r: bgLayer.r, g: bgLayer.g, b: bgLayer.b, a: 1 };
      } else {
        compBg = {
          r: Math.round(bgLayer.r * bgLayer.a + compBg.r * (1 - bgLayer.a)),
          g: Math.round(bgLayer.g * bgLayer.a + compBg.g * (1 - bgLayer.a)),
          b: Math.round(bgLayer.b * bgLayer.a + compBg.b * (1 - bgLayer.a)),
          a: 1
        };
      }
    }
    const effectiveBg = `rgb(${compBg.r}, ${compBg.g}, ${compBg.b})`;
    const computedStylesObj = {
      overflow: comp.overflow,
      overflowX: comp.overflowX,
      overflowY: comp.overflowY,
      width: comp.width,
      minWidth: comp.minWidth,
      maxWidth: comp.maxWidth,
      height: comp.height,
      minHeight: comp.minHeight,
      maxHeight: comp.maxHeight,
      transform: comp.transform,
      display: comp.display,
      position: comp.position,
      boxSizing: comp.boxSizing,
      margin: comp.margin,
      padding: comp.padding,
      paddingTop: comp.paddingTop,
      paddingRight: comp.paddingRight,
      paddingBottom: comp.paddingBottom,
      paddingLeft: comp.paddingLeft,
      borderTopWidth: comp.borderTopWidth,
      borderRightWidth: comp.borderRightWidth,
      borderBottomWidth: comp.borderBottomWidth,
      borderLeftWidth: comp.borderLeftWidth,
      wordBreak: comp.wordBreak,
      overflowWrap: comp.overflowWrap,
      whiteSpace: comp.whiteSpace,
      textWrap: comp.textWrap || comp.whiteSpace,
      flexDirection: comp.flexDirection,
      flexWrap: comp.flexWrap,
      flexShrink: comp.flexShrink,
      flexGrow: comp.flexGrow,
      flexBasis: comp.flexBasis,
      fontSize: comp.fontSize,
      lineHeight: comp.lineHeight,
      fontWeight: comp.fontWeight,
      color: comp.color,
      backgroundColor: effectiveBg,
      zIndex: comp.zIndex,
      outlineWidth: comp.outlineWidth,
      outlineStyle: comp.outlineStyle,
      outlineColor: comp.outlineColor,
      boxShadow: comp.boxShadow
    };
    collectedElements.push({
      selector,
      tagName: tag,
      id: el.id || "",
      className: typeof el.className === "string" ? el.className : "",
      textSnippet,
      ancestors,
      hasDirectText,
      rect: toRect(rect),
      computedStyles: computedStylesObj,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      isInteractive,
      isTextOnly,
      hasAccessibleName,
      hasSvgOrImgChild,
      role,
      ariaLabel,
      ariaLabelledBy,
      title
    });
    const visualContainer = getClosestVisualContainer(el);
    if (visualContainer && visualContainer.element !== el) {
      const isExempt = checkExemption(el, comp, visualContainer.comp);
      const inner = visualContainer.innerBox;
      const overRight = Math.max(0, rect.right - inner.right);
      const overLeft = Math.max(0, inner.left - rect.left);
      const overBottom = Math.max(0, rect.bottom - inner.bottom);
      const overTop = Math.max(0, inner.top - rect.top);
      if ((overRight > 1.5 || overLeft > 1.5 || overBottom > 2) && !isExempt) {
        if (!ancestors.some((anc) => reportedOverflowParentSelectors.has(anc))) {
          reportedOverflowParentSelectors.add(selector);
          containerOverflows.push({
            childSelector: selector,
            childTagName: tag,
            childId: el.id || "",
            childClassName: typeof el.className === "string" ? el.className : "",
            childRect: toRect(rect),
            childStyles: computedStylesObj,
            childRole: role,
            containerSelector: visualContainer.selector,
            containerTagName: visualContainer.tagName,
            containerRect: toRect(visualContainer.rect),
            containerInnerBox: inner,
            containerStyles: { overflowX: visualContainer.comp.overflowX, overflowY: visualContainer.comp.overflowY },
            overflowRightPx: round2(overRight),
            overflowBottomPx: round2(overBottom),
            overflowLeftPx: round2(overLeft),
            overflowTopPx: round2(overTop),
            isExempt
          });
        }
      }
    }
    if (!["pre", "code", "kbd", "samp", "textarea", "input", "style", "script"].includes(tag)) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let textNode;
      while (textNode = walker.nextNode()) {
        const val = textNode.nodeValue || "";
        if (!val.trim()) continue;
        const regex = /[a-zA-Z]{4,}/g;
        let match;
        while ((match = regex.exec(val)) !== null) {
          const word = match[0];
          try {
            const range = document.createRange();
            range.setStart(textNode, match.index);
            range.setEnd(textNode, match.index + word.length);
            const rects = range.getClientRects();
            if (rects.length > 1 && Math.abs(rects[rects.length - 1].top - rects[0].top) > 3) {
              textFlowAnomalies.push({
                selector,
                tagName: tag,
                textSnippet,
                anomalyType: "mid-word-break",
                word,
                computedStyles: { wordBreak: comp.wordBreak, overflowWrap: comp.overflowWrap }
              });
              break;
            }
          } catch {
          }
        }
      }
    }
    const isHeadingTag = ["h1", "h2", "h3", "h4", "h5", "h6"].includes(tag);
    const isLabelTag = tag === "label" || typeof el.className === "string" && /badge|chip|pill|tag/.test(el.className);
    if ((isButton || isHeadingTag || isLabelTag) && textContent && textContent.length >= 5) {
      const words = textContent.split(/\s+/).filter((w) => w.length > 0);
      if (words.length >= 2) {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        const measuredWords = [];
        let tNode = null;
        while (tNode = walker.nextNode()) {
          const val = tNode.nodeValue || "";
          const nodeWords = val.trim().split(/\s+/).filter((w) => w.length > 0);
          let searchPos = 0;
          for (const w of nodeWords) {
            const wordStart = val.indexOf(w, searchPos);
            if (wordStart === -1) continue;
            searchPos = wordStart + w.length;
            try {
              const r = document.createRange();
              r.setStart(tNode, wordStart);
              r.setEnd(tNode, wordStart + w.length);
              const rRect = r.getBoundingClientRect();
              if (rRect.width > 0 && rRect.height > 0) measuredWords.push({ top: rRect.top, word: w });
            } catch {
            }
          }
        }
        const lineGroups = [];
        for (const item of measuredWords) {
          let grp = lineGroups.find((g) => Math.abs(item.top - g.top) < 6);
          if (grp) {
            grp.words.push(item.word);
          } else {
            lineGroups.push({ top: item.top, words: [item.word] });
          }
        }
        const lines = lineGroups.map((g) => g.words);
        if (lines.length > 1) {
          const lastLine = lines[lines.length - 1];
          const lastLineText = lastLine.join(" ");
          if (isButton && textContent.length < 40) {
            textFlowAnomalies.push({
              selector,
              tagName: tag,
              textSnippet,
              anomalyType: "broken-multiline-button",
              lineCount: lines.length,
              orphanText: lastLineText,
              lastLineWordCount: lastLine.length,
              computedStyles: { whiteSpace: comp.whiteSpace, textWrap: comp.textWrap }
            });
          } else if ((isHeadingTag || isLabelTag) && lastLine.length === 1 && lines[0].length >= 2) {
            textFlowAnomalies.push({
              selector,
              tagName: tag,
              textSnippet,
              anomalyType: "orphan-wrap",
              lineCount: lines.length,
              orphanText: lastLineText,
              lastLineWordCount: 1,
              computedStyles: { textWrap: comp.textWrap || "normal", whiteSpace: comp.whiteSpace }
            });
          }
        }
      }
    }
    const parentEl = el.parentElement;
    if (parentEl) {
      const parentComp = window.getComputedStyle(parentEl);
      if (parentComp.display === "flex" || parentComp.display === "inline-flex") {
        const isRow = !parentComp.flexDirection || parentComp.flexDirection.startsWith("row");
        if (isRow && rect.width < 75 && el.scrollWidth > el.clientWidth + 3 && textContent.length > 8) {
          textFlowAnomalies.push({
            selector,
            tagName: tag,
            textSnippet,
            anomalyType: "crushed-flex-column",
            elementWidth: rect.width,
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            computedStyles: { display: comp.display, flex: comp.flex }
          });
        }
      }
    }
  }
  const occlusions = [];
  for (const item of collectedElements) {
    if (!item.isInteractive) continue;
    const r = item.rect;
    if (r.right < 0 || r.left > vp.width || r.bottom < 0 || r.top > vp.height) continue;
    const insetX = Math.min(4, r.width * 0.1);
    const insetY = Math.min(4, r.height * 0.1);
    const points = [
      { x: r.x + r.width / 2, y: r.y + r.height / 2 },
      { x: r.x + insetX, y: r.y + insetY },
      { x: r.right - insetX, y: r.y + insetY },
      { x: r.x + insetX, y: r.bottom - insetY },
      { x: r.right - insetX, y: r.bottom - insetY }
    ];
    const targetDomEl = document.querySelector(item.selector);
    if (!targetDomEl) continue;
    const raycastResults = [];
    for (const pt of points) {
      if (pt.x >= 0 && pt.x <= vp.width && pt.y >= 0 && pt.y <= vp.height) {
        const topEl = document.elementFromPoint(pt.x, pt.y);
        if (topEl) {
          raycastResults.push({
            point: pt,
            topSelector: getCssSelector(topEl),
            topTagName: topEl.tagName.toLowerCase(),
            isTargetOrDescendant: topEl === targetDomEl || targetDomEl.contains(topEl) || topEl.contains(targetDomEl)
          });
        }
      }
    }
    if (raycastResults.some((res) => !res.isTargetOrDescendant)) {
      occlusions.push({ selector: item.selector, tagName: item.tagName, boundingBox: item.rect, raycastResults });
    }
  }
  const stickyItems = collectedElements.filter((el) => {
    const pos = el.computedStyles.position;
    return (pos === "fixed" || pos === "sticky") && el.rect.width > 20 && el.rect.height > 10;
  });
  const stickyOcclusions = [];
  for (const sticky of stickyItems) {
    const sRect = sticky.rect;
    const sZ = parseInt(sticky.computedStyles.zIndex || "0", 10) || 0;
    for (const target of collectedElements) {
      if (target.selector === sticky.selector || target.ancestors?.includes(sticky.selector)) continue;
      const isHeading = ["h1", "h2", "h3", "h4", "h5", "h6"].includes(target.tagName.toLowerCase());
      if (!target.isInteractive && !isHeading) continue;
      const tRect = target.rect;
      if ((parseInt(target.computedStyles.zIndex || "0", 10) || 0) > sZ) continue;
      const interLeft = Math.max(sRect.left, tRect.left);
      const interTop = Math.max(sRect.top, tRect.top);
      const interRight = Math.min(sRect.right, tRect.right);
      const interBottom = Math.min(sRect.bottom, tRect.bottom);
      if (interRight > interLeft + 2 && interBottom > interTop + 2) {
        const overlapWidth = round2(interRight - interLeft);
        const overlapHeight = round2(interBottom - interTop);
        const overlapArea = overlapWidth * overlapHeight;
        if (overlapArea / Math.max(1, tRect.width * tRect.height) > 0.15 || overlapArea > 100) {
          stickyOcclusions.push({
            stickySelector: sticky.selector,
            stickyTagName: sticky.tagName,
            positionType: sticky.computedStyles.position,
            occludedSelector: target.selector,
            occludedTagName: target.tagName,
            isInteractive: target.isInteractive,
            overlapRect: toRect({
              x: interLeft,
              y: interTop,
              width: overlapWidth,
              height: overlapHeight,
              top: interTop,
              right: interRight,
              bottom: interBottom,
              left: interLeft
            })
          });
        }
      }
    }
  }
  return {
    viewport: vp,
    elements: collectedElements,
    containerOverflows,
    textFlowAnomalies,
    occlusions,
    stickyOcclusions
  };
}
function getInPageAuditFunctionString() {
  return `(${collectInPageAuditScript.toString()})`;
}

// src/reporter/htmlReporter.ts
function generateHtmlReport(result) {
  const {
    url,
    timestamp,
    device,
    viewport,
    uxScore,
    overflowIssues = [],
    containerOverflowIssues = [],
    textFlowIssues = [],
    touchTargetIssues = [],
    viewportFit,
    readabilityIssues = [],
    occlusionIssues = [],
    collisionIssues = [],
    scrollTrapIssues = [],
    accessibleNameIssues = [],
    focusIndicatorIssues = [],
    thumbZoneAnalysis,
    layoutShiftResult,
    screenshotBase64,
    executionTimeMs
  } = result;
  const totalIssues = overflowIssues.length + containerOverflowIssues.length + textFlowIssues.length + touchTargetIssues.length + readabilityIssues.length + occlusionIssues.length + collisionIssues.length + scrollTrapIssues.length + accessibleNameIssues.length + focusIndicatorIssues.length + (viewportFit ? viewportFit.issues.length : 0);
  const scoreColor = uxScore.totalScore >= 85 ? "#10b981" : uxScore.totalScore >= 70 ? "#f59e0b" : "#ef4444";
  const gradeBadgeClass = uxScore.grade.startsWith("A") ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : uxScore.grade.startsWith("B") ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-rose-500/20 text-rose-300 border-rose-500/40";
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Layout & UX Audit Report \u2014 ${escapeHtml(url)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#eef2ff',
              500: '#6366f1',
              600: '#4f46e5',
              900: '#312e81',
            }
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
    body { font-family: 'Inter', sans-serif; }
    code, pre { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen antialiased p-4 md:p-8">
  <div class="max-w-7xl mx-auto space-y-8">
    
    <!-- Top Header -->
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl shadow-xl">
      <div class="space-y-1">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
            \u{1F4D0}
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-white">Playwright Layout Inspector</h1>
          <span class="px-2.5 py-0.5 text-xs font-semibold rounded-full border ${gradeBadgeClass}">
            Grade ${uxScore.grade}
          </span>
        </div>
        <p class="text-sm text-slate-400 font-mono break-all">${escapeHtml(url)}</p>
      </div>

      <div class="flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <div class="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          \u{1F4F1} <span class="font-semibold text-slate-200">${escapeHtml(device?.name || `${viewport.width}x${viewport.height}`)}</span>
        </div>
        <div class="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          \u23F1\uFE0F <span class="font-semibold text-slate-200">${executionTimeMs}ms</span>
        </div>
        <div class="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          \u{1F4C5} <span class="font-semibold text-slate-200">${new Date(timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    </header>

    <!-- Score & Overview Hero -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      
      <!-- Primary UX Score Gauge -->
      <div class="md:col-span-1 p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
        <div class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Overall UX Score</div>
        <div class="relative flex items-center justify-center w-36 h-36">
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path class="text-slate-800" stroke-width="3.5" stroke="currentColor" fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path stroke="${scoreColor}" stroke-width="3.5" stroke-dasharray="${uxScore.totalScore}, 100" stroke-linecap="round" fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div class="absolute flex flex-col items-center">
            <span class="text-4xl font-extrabold text-white">${Math.round(uxScore.totalScore)}</span>
            <span class="text-xs font-bold text-slate-400">/ 100</span>
          </div>
        </div>
        <div class="mt-4 text-xs font-medium text-slate-400">
          ${uxScore.passed ? '<span class="text-emerald-400 font-semibold">\u2713 Pass UX Standards</span>' : '<span class="text-rose-400 font-semibold">\u2717 Fails UX Standards</span>'}
        </div>
      </div>

      <!-- Category Breakdown Cards -->
      <div class="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        ${renderCategoryCard(uxScore.categories.overflowAndFit, "\u{1F30A}")}
        ${renderCategoryCard(uxScore.categories.stability, "\u2696\uFE0F")}
        ${renderCategoryCard(uxScore.categories.touchErgonomics, "\u{1F446}")}
        ${renderCategoryCard(uxScore.categories.readabilityAndVisibility, "\u{1F441}\uFE0F")}
        ${renderCategoryCard(uxScore.categories.accessibilityAndFocus, "\u267F")}
      </div>
    </div>

    <!-- Thumb Zone Ergonomics Advisory (if mobile) -->
    ${thumbZoneAnalysis ? `
    <section class="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-white flex items-center gap-2">
          <span>\u{1F44D}</span> Mobile Thumb-Zone Ergonomics
        </h2>
        <span class="text-xs font-mono font-bold px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          Ergonomics Score: ${thumbZoneAnalysis.ergonomicsScore}/100
        </span>
      </div>
      <p class="text-xs text-slate-400">${escapeHtml(thumbZoneAnalysis.summary)}</p>
      <div class="grid grid-cols-3 gap-4 text-center text-xs">
        <div class="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30">
          <div class="text-emerald-400 font-bold text-lg">${thumbZoneAnalysis.naturalZoneCount}</div>
          <div class="text-slate-400">Natural Zone (Easy)</div>
        </div>
        <div class="bg-amber-950/40 p-3 rounded-xl border border-amber-500/30">
          <div class="text-amber-400 font-bold text-lg">${thumbZoneAnalysis.reachZoneCount}</div>
          <div class="text-slate-400">Reach Zone (Moderate)</div>
        </div>
        <div class="bg-rose-950/40 p-3 rounded-xl border border-rose-500/30">
          <div class="text-rose-400 font-bold text-lg">${thumbZoneAnalysis.hardZoneCount}</div>
          <div class="text-slate-400">Hard Zone (Stretch)</div>
        </div>
      </div>
    </section>
    ` : ""}

    <!-- Issues Triage Section -->
    <section class="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span>\u{1F6E0}\uFE0F</span> Issues & Remediation (${totalIssues})
          </h2>
          <p class="text-xs text-slate-400">Actionable layout, container overflow, text wrap, collision, and accessibility fixes</p>
        </div>
      </div>

      ${totalIssues === 0 ? `
        <div class="py-12 text-center text-slate-400 space-y-2">
          <div class="text-4xl">\u{1F389}</div>
          <p class="text-base font-semibold text-slate-200">No layout or UX issues detected!</p>
          <p class="text-xs">Your layout complies with responsive viewport fit, container containment, text flow, touch target standards, accessibility, and stability rules.</p>
        </div>
      ` : `
        <div class="space-y-4">
          <!-- Viewport Fit Issues -->
          ${viewportFit ? viewportFit.issues.map((iss) => `
            <div class="p-4 bg-rose-950/30 border border-rose-500/30 rounded-xl space-y-2">
              <div class="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <span>\u{1F6A8} Viewport Constraint Issue</span>
              </div>
              <p class="text-sm text-slate-200">${escapeHtml(iss)}</p>
            </div>
          `).join("") : ""}

          <!-- Viewport Overflow Issues -->
          ${overflowIssues.map((issue) => `
            <div class="p-4 bg-slate-950/80 border border-red-500/30 rounded-xl space-y-3">
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                      ${issue.severity}
                    </span>
                    <span class="text-sm font-semibold text-slate-100">Horizontal Viewport Bleed (+${Math.round(issue.overflowRightPx)}px)</span>
                  </div>
                  <div class="text-xs font-mono text-indigo-400 bg-indigo-950/40 px-2 py-1 rounded border border-indigo-500/20 inline-block">
                    ${escapeHtml(issue.selector)}
                  </div>
                </div>
              </div>
              <p class="text-xs text-slate-300">${escapeHtml(issue.culpritDescription)}</p>
              <div class="text-xs text-emerald-300 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20 font-mono">
                \u{1F4A1} <span class="font-bold text-emerald-400">Fix:</span> ${escapeHtml(issue.suggestedFix)}
              </div>
            </div>
          `).join("")}

          <!-- Container Overflow Issues -->
          ${containerOverflowIssues.map((cIssue) => `
            <div class="p-4 bg-slate-950/80 border border-orange-500/30 rounded-xl space-y-3">
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      ${cIssue.severity}
                    </span>
                    <span class="text-sm font-semibold text-slate-100">Container Geometric Bleed (+${Math.round(cIssue.overflowRightPx || cIssue.overflowBottomPx || cIssue.overflowLeftPx)}px)</span>
                  </div>
                  <div class="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span class="text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/20">
                      Child: ${escapeHtml(cIssue.selector)}
                    </span>
                    <span class="text-slate-500">inside</span>
                    <span class="text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/20">
                      Container: ${escapeHtml(cIssue.containerSelector)}
                    </span>
                  </div>
                </div>
              </div>
              <p class="text-xs text-slate-300">${escapeHtml(cIssue.culpritDescription)}</p>
              <div class="text-xs text-emerald-300 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20 font-mono">
                \u{1F4A1} <span class="font-bold text-emerald-400">Fix:</span> ${escapeHtml(cIssue.suggestedFix)}
              </div>
            </div>
          `).join("")}

          <!-- Text Flow & Wrap Anomaly Issues -->
          ${textFlowIssues.map((tf) => `
            <div class="p-4 bg-slate-950/80 border border-yellow-500/30 rounded-xl space-y-3">
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      ${tf.anomalyType.replace(/-/g, " ")}
                    </span>
                    <span class="text-sm font-semibold text-slate-100">Text Flow / Wrapping Anomaly</span>
                  </div>
                  <div class="text-xs font-mono text-indigo-400 bg-indigo-950/40 px-2 py-1 rounded border border-indigo-500/20 inline-block">
                    ${escapeHtml(tf.selector)}
                  </div>
                  ${tf.textSnippet ? `<span class="text-xs text-slate-400 italic font-mono ml-2">&ldquo;${escapeHtml(tf.textSnippet)}&rdquo;</span>` : ""}
                </div>
              </div>
              <p class="text-xs text-slate-300">${escapeHtml(tf.details)}</p>
              <div class="text-xs text-emerald-300 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20 font-mono">
                \u{1F4A1} <span class="font-bold text-emerald-400">Fix:</span> ${escapeHtml(tf.suggestedFix)}
              </div>
            </div>
          `).join("")}

          <!-- Occlusion Issues -->
          ${occlusionIssues.map((occ) => `
            <div class="p-4 bg-slate-950/80 border border-rose-500/30 rounded-xl space-y-2">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Tap-Jacking / Occlusion
                </span>
                <span class="text-sm font-semibold text-slate-100">Interactive Element Click-Blocked</span>
              </div>
              <p class="text-xs text-slate-300">${escapeHtml(occ.suggestion)}</p>
            </div>
          `).join("")}

          <!-- Collision Issues -->
          ${collisionIssues.map((col) => `
            <div class="p-4 bg-slate-950/80 border border-amber-500/30 rounded-xl space-y-2">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  ${col.isTextCollision ? "Text Collision" : "Element Overlap"}
                </span>
                <span class="text-sm font-semibold text-slate-100">${Math.round(col.overlapAreaPx)}px\xB2 Overlapping Area</span>
              </div>
              <p class="text-xs text-slate-300">${escapeHtml(col.suggestion)}</p>
            </div>
          `).join("")}

          <!-- Scroll Trap Issues -->
          ${scrollTrapIssues.map((trap) => `
            <div class="p-4 bg-slate-950/80 border border-purple-500/30 rounded-xl space-y-2">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  Nested Scroll Trap
                </span>
                <span class="text-sm font-semibold text-slate-100">${Math.round(trap.viewportRatio * 100)}% Viewport Coverage</span>
              </div>
              <p class="text-xs text-slate-300">${escapeHtml(trap.suggestion)}</p>
            </div>
          `).join("")}

          <!-- Accessible Name Issues -->
          ${accessibleNameIssues.map((acc) => `
            <div class="p-4 bg-slate-950/80 border border-indigo-500/30 rounded-xl space-y-2">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Missing Accessible Name
                </span>
                <span class="text-sm font-semibold text-slate-100"><${acc.tagName}> ${acc.isIconOnly ? "(Icon Only)" : ""}</span>
              </div>
              <p class="text-xs text-slate-300">${escapeHtml(acc.suggestion)}</p>
            </div>
          `).join("")}

          <!-- Touch Target Issues -->
          ${touchTargetIssues.map((issue) => `
            <div class="p-4 bg-slate-950/80 border border-amber-500/30 rounded-xl space-y-3">
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Touch Target Too Small
                    </span>
                    <span class="text-sm font-semibold text-slate-100">${Math.round(issue.width)}x${Math.round(issue.height)}px (Min: ${issue.minRequiredSize}px)</span>
                  </div>
                  <div class="text-xs font-mono text-indigo-400 bg-indigo-950/40 px-2 py-1 rounded border border-indigo-500/20 inline-block">
                    ${escapeHtml(issue.selector)}
                  </div>
                </div>
              </div>
              <p class="text-xs text-slate-300">${escapeHtml(issue.suggestion)}</p>
            </div>
          `).join("")}
        </div>
      `}
    </section>

    <!-- Footer -->
    <footer class="text-center text-xs text-slate-600 py-6 border-t border-slate-900">
      Generated by <strong class="text-slate-400">Playwright Layout Inspector</strong> \u2022 Automated UX & Layout Quality Assurance
    </footer>
  </div>
</body>
</html>`;
}
function renderCategoryCard(cat, icon) {
  if (!cat) return "";
  const gradeClass = cat.grade.startsWith("A") ? "text-emerald-400" : cat.grade.startsWith("B") ? "text-amber-400" : "text-rose-400";
  const progressPct = Math.round(cat.score / cat.maxScore * 100);
  return `
    <div class="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-3 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span>${icon}</span>
          <h3 class="text-xs font-semibold text-slate-200 uppercase tracking-wider">${escapeHtml(cat.name)}</h3>
        </div>
        <span class="text-sm font-extrabold ${gradeClass}">${cat.score} / ${cat.maxScore}</span>
      </div>
      <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
        <div class="h-full bg-indigo-500 rounded-full" style="width: ${progressPct}%"></div>
      </div>
      <p class="text-xs text-slate-400 leading-relaxed">${escapeHtml(cat.summary)}</p>
    </div>
  `;
}
function escapeHtml(str) {
  return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// src/playwright/screenshotAnnotator.ts
async function captureAndAnnotateScreenshot(page, options = {}) {
  if (!options.includeScreenshot) {
    return {};
  }
  try {
    const buffer = await page.screenshot({ fullPage: false });
    const screenshotBase64 = buffer.toString("base64");
    return { screenshotBase64 };
  } catch {
    return {};
  }
}

// src/playwright/matrixRunner.ts
var DEFAULT_MATRIX_PRESETS = [
  "Samsung Galaxy S25+",
  "iPad Air",
  "Desktop 1080p"
];
async function runResponsiveMatrixAudit(page, inspector, options = {}) {
  const deviceNames = options.devices && options.devices.length > 0 ? options.devices : DEFAULT_MATRIX_PRESETS;
  const devices = deviceNames.map((d) => {
    if (typeof d === "string") {
      return getDevicePreset(d) || {
        name: d,
        width: 1280,
        height: 720,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        category: "desktop"
      };
    }
    const customDev = d;
    return {
      name: customDev.name,
      width: customDev.width,
      height: customDev.height,
      deviceScaleFactor: customDev.deviceScaleFactor ?? 1,
      isMobile: customDev.isMobile ?? customDev.width < 768,
      hasTouch: customDev.hasTouch ?? customDev.width < 768,
      category: customDev.category ?? (customDev.width < 768 ? "mobile" : "desktop")
    };
  });
  const originalViewport = page.viewportSize();
  const results = {};
  const deviceScores = {};
  try {
    for (const dev of devices) {
      await page.setViewportSize({ width: dev.width, height: dev.height });
      await page.waitForTimeout(150);
      const auditResult = await inspector.audit({
        ...options,
        device: dev
      });
      results[dev.name] = auditResult;
      deviceScores[dev.name] = auditResult.uxScore.totalScore;
    }
  } finally {
    if (originalViewport) {
      await page.setViewportSize(originalViewport);
    }
  }
  const issueDeviceMap = /* @__PURE__ */ new Map();
  for (const [deviceName, res] of Object.entries(results)) {
    for (const ov of res.overflowIssues) {
      const key = `overflow:${ov.selector}`;
      if (!issueDeviceMap.has(key)) {
        issueDeviceMap.set(key, { category: "Viewport Overflow", selector: ov.selector, description: ov.culpritDescription, devices: /* @__PURE__ */ new Set() });
      }
      issueDeviceMap.get(key).devices.add(deviceName);
    }
    for (const co of res.containerOverflowIssues) {
      const key = `containerOverflow:${co.selector}`;
      if (!issueDeviceMap.has(key)) {
        issueDeviceMap.set(key, { category: "Container Overflow", selector: co.selector, description: co.culpritDescription, devices: /* @__PURE__ */ new Set() });
      }
      issueDeviceMap.get(key).devices.add(deviceName);
    }
    for (const fb of res.flexBlowoutIssues || []) {
      const key = `flexBlowout:${fb.selector}`;
      if (!issueDeviceMap.has(key)) {
        issueDeviceMap.set(key, { category: "Flex Blowout", selector: fb.selector, description: fb.suggestion, devices: /* @__PURE__ */ new Set() });
      }
      issueDeviceMap.get(key).devices.add(deviceName);
    }
    for (const so of res.stickyOcclusionIssues || []) {
      const key = `stickyOcclusion:${so.occludedSelector}`;
      if (!issueDeviceMap.has(key)) {
        issueDeviceMap.set(key, { category: "Sticky Occlusion", selector: so.occludedSelector, description: so.suggestion, devices: /* @__PURE__ */ new Set() });
      }
      issueDeviceMap.get(key).devices.add(deviceName);
    }
    for (const tt of res.touchTargetIssues) {
      const key = `touchTarget:${tt.selector}`;
      if (!issueDeviceMap.has(key)) {
        issueDeviceMap.set(key, { category: "Touch Target", selector: tt.selector, description: tt.suggestion, devices: /* @__PURE__ */ new Set() });
      }
      issueDeviceMap.get(key).devices.add(deviceName);
    }
    for (const cc of res.contrastIssues) {
      const key = `contrast:${cc.selector}`;
      if (!issueDeviceMap.has(key)) {
        issueDeviceMap.set(key, { category: "Contrast", selector: cc.selector, description: cc.suggestion, devices: /* @__PURE__ */ new Set() });
      }
      issueDeviceMap.get(key).devices.add(deviceName);
    }
  }
  const globalIssues = [];
  const breakpointSpecificIssues = [];
  for (const item of issueDeviceMap.values()) {
    if (item.devices.size === devices.length) {
      globalIssues.push({
        category: item.category,
        selector: item.selector,
        description: item.description,
        count: item.devices.size
      });
    } else {
      for (const devName of item.devices) {
        breakpointSpecificIssues.push({
          device: devName,
          category: item.category,
          selector: item.selector,
          description: item.description
        });
      }
    }
  }
  const scores = Object.values(deviceScores);
  const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : 100;
  return {
    devices,
    results,
    overallScore,
    deviceScores,
    matrixSummary: {
      globalIssues,
      breakpointSpecificIssues
    }
  };
}

// src/core/flexBlowout.ts
function evaluateFlexBlowout(containerOverflows = [], elements = []) {
  const issuesMap = /* @__PURE__ */ new Map();
  const elementMap = /* @__PURE__ */ new Map();
  for (const el of elements || []) {
    elementMap.set(el.selector, el);
  }
  for (const co of containerOverflows || []) {
    if (co.isExempt) continue;
    const containerEl = elementMap.get(co.containerSelector);
    const childEl = elementMap.get(co.childSelector);
    const containerDisplay = (co.containerStyles?.display || containerEl?.computedStyles?.display || "").toLowerCase();
    const isFlex = containerDisplay.includes("flex");
    const isGrid = containerDisplay.includes("grid");
    if (!isFlex && !isGrid) continue;
    const childMinWidth = (co.childStyles?.minWidth || childEl?.computedStyles?.minWidth || "auto").trim();
    const childFlexShrink = (co.childStyles?.flexShrink || childEl?.computedStyles?.flexShrink || "1").trim();
    const isCleanMinWidth = childMinWidth === "0" || childMinWidth === "0px";
    if (isCleanMinWidth && childFlexShrink !== "0") {
      continue;
    }
    const layoutType = isGrid ? "grid" : "flex";
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
    const isInteractive = Boolean(childEl?.isInteractive || co.isInteractive);
    const severity = isInteractive || overflowPx > 20 ? "critical" : "serious";
    issuesMap.set(co.childSelector, {
      selector: co.childSelector,
      tagName: co.childTagName || childEl?.tagName || "div",
      parentSelector: co.containerSelector,
      layoutType,
      childWidth,
      parentWidth,
      overflowPx,
      severity,
      suggestion: `Child element ${co.childSelector} is blowing out ${layoutType} container ${co.containerSelector} by ${overflowPx}px because min-width: auto or flex-shrink: 0 prevents shrinking. Set min-width: 0 and overflow: hidden; text-overflow: ellipsis on the child.`
    });
  }
  for (const child of elements || []) {
    const parentSelector = child.ancestors?.[0];
    if (!parentSelector) continue;
    const parentEl = elementMap.get(parentSelector);
    if (!parentEl) continue;
    const parentDisplay = (parentEl.computedStyles?.display || "").toLowerCase();
    const isFlex = parentDisplay.includes("flex");
    const isGrid = parentDisplay.includes("grid");
    if (!isFlex && !isGrid) continue;
    const minWidth = (child.computedStyles?.minWidth || "auto").trim();
    const flexShrink = (child.computedStyles?.flexShrink || "1").trim();
    const isUnconstrained = minWidth === "auto" || flexShrink === "0";
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
    const layoutType = isGrid ? "grid" : "flex";
    const severity = child.isInteractive || overflowPx > 20 ? "critical" : "serious";
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

// src/core/stickyOcclusion.ts
function evaluateStickyOcclusion(data) {
  if (!data || data.length === 0) {
    return [];
  }
  return data.map((item) => {
    const severity = item.isInteractive ? "critical" : "serious";
    const positionLabel = item.positionType === "fixed" ? "Fixed" : "Sticky";
    const interactiveLabel = item.isInteractive ? "interactive " : "";
    const suggestion = `${positionLabel} element ${item.stickySelector} occludes ${interactiveLabel}${item.occludedTagName} ${item.occludedSelector} (${item.overlapRect.width}x${item.overlapRect.height}px overlap). Adjust z-index, add scroll-padding-top/bottom, or increase container padding.`;
    const overlapRect = {
      x: item.overlapRect.x,
      y: item.overlapRect.y,
      width: item.overlapRect.width,
      height: item.overlapRect.height,
      top: item.overlapRect.top,
      right: item.overlapRect.right,
      bottom: item.overlapRect.bottom,
      left: item.overlapRect.left
    };
    return {
      stickySelector: item.stickySelector,
      stickyTagName: item.stickyTagName,
      positionType: item.positionType,
      occludedSelector: item.occludedSelector,
      occludedTagName: item.occludedTagName,
      isInteractive: item.isInteractive,
      overlapRect,
      severity,
      suggestion
    };
  });
}

// src/playwright/auditEvaluator.ts
function evaluateAuditIssues(inPageData, mergedOptions, viewport, isMobile) {
  const viewportFit = evaluateViewportFit(viewport.metaViewport, viewport);
  const overflowIssues = [];
  if (mergedOptions.checkOverflow !== false) {
    for (const el of inPageData.elements) {
      const over = calculateOverflow(el.rect, viewport);
      if (over.hasOverflow) {
        const remediation = generateOverflowRemediation({
          tagName: el.tagName,
          selector: el.selector,
          styles: el.computedStyles,
          boundingBox: el.rect,
          viewport,
          overflowRightPx: over.overflowRightPx
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
          culpritDescription: remediation.culpritDescription || remediation.description,
          suggestedFix: remediation.suggestedFix || remediation.cssSuggestion,
          severity: remediation.severity || (over.overflowRightPx > 50 ? "critical" : "warning")
        });
      }
    }
  }
  const containerOverflowIssues = [];
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
  let flexBlowoutIssues = [];
  if (mergedOptions.checkFlexBlowout !== false) {
    flexBlowoutIssues = evaluateFlexBlowout(inPageData.containerOverflows || [], inPageData.elements);
  }
  let stickyOcclusionIssues = [];
  if (mergedOptions.checkStickyOcclusion !== false && inPageData.stickyOcclusions) {
    stickyOcclusionIssues = evaluateStickyOcclusion(inPageData.stickyOcclusions);
  }
  const textFlowIssues = [];
  if (mergedOptions.checkTextFlow !== false && inPageData.textFlowAnomalies) {
    for (const anomaly of inPageData.textFlowAnomalies) {
      const issue = evaluateTextFlow(anomaly);
      if (issue) textFlowIssues.push(issue);
    }
  }
  const touchTargetIssues = [];
  const interactiveElements = inPageData.elements.filter((e) => e.isInteractive);
  if (mergedOptions.checkTouchTargets !== false) {
    const allTargets = interactiveElements.map((e) => ({ selector: e.selector, boundingBox: e.rect }));
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
  const readabilityIssues = [];
  if (mergedOptions.checkReadability !== false) {
    for (const el of inPageData.elements) {
      if (!el.textSnippet || el.textSnippet.length === 0) continue;
      const fontSizePx = parseFloat(el.computedStyles.fontSize) || 16;
      const lineHeightPx = parseFloat(el.computedStyles.lineHeight) || void 0;
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
  const contrastIssues = [];
  if (mergedOptions.checkContrast !== false) {
    for (const el of inPageData.elements) {
      if (el.textSnippet && el.computedStyles.color && el.computedStyles.backgroundColor) {
        const issue = evaluateColorContrast(
          {
            selector: el.selector,
            tagName: el.tagName,
            textSnippet: el.textSnippet,
            color: el.computedStyles.color || "#000000",
            backgroundColor: el.computedStyles.backgroundColor || "#ffffff",
            fontSizePx: parseFloat(el.computedStyles.fontSize) || 16,
            fontWeight: el.computedStyles.fontWeight || "400"
          },
          { minRatio: mergedOptions.minContrastRatio || 4.5 }
        );
        if (issue) contrastIssues.push(issue);
      }
    }
  }
  const occlusionIssues = [];
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
  let collisionIssues = [];
  if (mergedOptions.checkCollisions !== false) {
    collisionIssues = evaluateElementCollisions(
      inPageData.elements.map((e) => ({
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
  const scrollTrapIssues = [];
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
  const accessibleNameIssues = [];
  if (mergedOptions.checkAccessibleNames !== false) {
    for (const el of inPageData.elements) {
      if (el.isInteractive) {
        const issue = evaluateAccessibleName({
          selector: el.selector,
          tagName: el.tagName,
          role: el.role,
          ariaLabel: el.ariaLabel,
          ariaLabelledBy: el.ariaLabelledBy,
          title: el.title,
          innerText: el.textSnippet,
          hasSvgOrImgChild: el.hasSvgOrImgChild
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
var LayoutInspector = class {
  page;
  defaultOptions;
  constructor(page, defaultOptions = {}) {
    this.page = page;
    this.defaultOptions = defaultOptions;
  }
  /**
   * Run a comprehensive UX & layout audit on the current page state.
   */
  async audit(options = {}) {
    const startTime = Date.now();
    const mergedOptions = {
      checkTouchTargets: true,
      checkOverflow: true,
      checkContainerOverflow: true,
      checkFlexBlowout: true,
      checkTextFlow: true,
      checkReadability: true,
      checkContrast: true,
      checkOcclusion: true,
      checkStickyOcclusion: true,
      checkCollisions: true,
      checkScrollTraps: true,
      checkAccessibleNames: true,
      checkFocusIndicators: true,
      checkThumbZones: true,
      minTouchTargetSize: 24,
      minFontSizePx: 12,
      includeScreenshot: true,
      ...this.defaultOptions,
      ...options
    };
    const inPageData = await this.page.evaluate(
      collectInPageAuditScript,
      JSON.stringify({ ignoreSelectors: mergedOptions.ignoreSelectors || [] })
    );
    const viewport = inPageData.viewport;
    const url = this.page.url();
    const isMobile = viewport.width < 768;
    const issues = evaluateAuditIssues(inPageData, mergedOptions, viewport, isMobile);
    const focusIndicatorIssues = [];
    if (mergedOptions.checkFocusIndicators !== false) {
      const candidates = inPageData.elements.filter((e) => e.isInteractive).slice(0, 5);
      for (const el of candidates) {
        const focusData = await this.page.evaluate((sel) => {
          const target = document.querySelector(sel);
          if (!target || typeof target.focus !== "function") return null;
          target.focus();
          const comp = window.getComputedStyle(target);
          return {
            outlineWidth: comp.outlineWidth,
            outlineStyle: comp.outlineStyle,
            outlineColor: comp.outlineColor,
            boxShadow: comp.boxShadow
          };
        }, el.selector).catch(() => null);
        if (!focusData) continue;
        const issue = evaluateFocusIndicator({
          selector: el.selector,
          tagName: el.tagName,
          outlineWidth: focusData.outlineWidth || "0px",
          outlineStyle: focusData.outlineStyle || "none",
          outlineColor: focusData.outlineColor || "transparent",
          boxShadow: focusData.boxShadow || "none"});
        if (issue) focusIndicatorIssues.push(issue);
      }
    }
    let thumbZoneAnalysis;
    if (mergedOptions.checkThumbZones !== false) {
      const interactiveElements = inPageData.elements.filter((e) => e.isInteractive);
      thumbZoneAnalysis = evaluateThumbZoneErgonomics(
        interactiveElements.map((e) => ({
          selector: e.selector,
          textSnippet: e.textSnippet,
          rect: e.rect
        })),
        viewport
      );
    }
    let zoomReflowResult;
    if (mergedOptions.test200PercentZoomReflow) {
      zoomReflowResult = await this.test200PercentZoomReflow();
    }
    const { screenshotBase64 } = await captureAndAnnotateScreenshot(this.page, mergedOptions);
    const uxScore = computeUXScore({
      ...issues,
      focusIndicatorIssues,
      thumbZoneAnalysis
    });
    let devicePreset;
    if (mergedOptions.device) {
      devicePreset = getDevicePreset(mergedOptions.device);
    }
    return {
      url,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      device: devicePreset,
      viewport,
      uxScore,
      ...issues,
      focusIndicatorIssues,
      thumbZoneAnalysis,
      zoomReflowResult,
      screenshotBase64,
      executionTimeMs: Date.now() - startTime
    };
  }
  /**
   * Run multi-device responsive matrix audit across mobile, tablet, and desktop viewports.
   */
  async auditMatrix(options = {}) {
    return runResponsiveMatrixAudit(this.page, this, options);
  }
  /**
   * Test WCAG 1.4.10 Reflow at 200% zoom.
   */
  async test200PercentZoomReflow(zoomFactor = 2) {
    const originalFontSize = await this.page.evaluate(() => {
      const current = document.documentElement.style.fontSize;
      document.documentElement.style.fontSize = "200%";
      return current;
    });
    await this.page.waitForTimeout(200);
    const data = await this.page.evaluate(collectInPageAuditScript, "{}");
    const collisions = evaluateElementCollisions(
      data.elements.map((e) => ({
        selector: e.selector,
        tagName: e.tagName,
        textSnippet: e.textSnippet,
        rect: e.rect,
        isInteractive: e.isInteractive,
        isTextOnly: e.isTextOnly,
        ancestors: e.ancestors
      }))
    );
    await this.page.evaluate((orig) => {
      document.documentElement.style.fontSize = orig || "";
    }, originalFontSize);
    return evaluateZoomReflow({
      pageScrollWidth: data.viewport.scrollWidth,
      windowWidth: data.viewport.width,
      collisionCount: collisions.length,
      zoomFactor
    });
  }
  /**
   * Track layout shift and element displacement occurring during an asynchronous action.
   */
  async trackShifts(action, options) {
    const beforeData = await this.page.evaluate(collectInPageAuditScript, "{}");
    const beforeSnapshots = beforeData.elements.map((e) => ({
      selector: e.selector,
      tagName: e.tagName,
      id: e.id,
      className: e.className,
      textSnippet: e.textSnippet,
      rect: e.rect
    }));
    await action();
    await this.page.waitForTimeout(200);
    const afterData = await this.page.evaluate(collectInPageAuditScript, "{}");
    const afterSnapshots = afterData.elements.map((e) => ({
      selector: e.selector,
      tagName: e.tagName,
      id: e.id,
      className: e.className,
      textSnippet: e.textSnippet,
      rect: e.rect
    }));
    return evaluateLayoutShift(beforeSnapshots, afterSnapshots, afterData.viewport, options);
  }
  /**
   * Generate and write an interactive HTML report to disk.
   */
  async generateReport(result, outputPath) {
    const html = generateHtmlReport(result);
    const resolvedPath = path.resolve(outputPath);
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(resolvedPath, html, "utf-8");
    return resolvedPath;
  }
};

// src/playwright/matcherFormatters.ts
var BOLD = "\x1B[1m";
var RED = "\x1B[31m";
var YELLOW = "\x1B[33m";
var CYAN = "\x1B[36m";
var RESET = "\x1B[0m";
function formatAuditFailureMessage(audit, minScore = 80) {
  const score = audit.uxScore.totalScore;
  const grade = audit.uxScore.grade;
  const header = `${BOLD}${RED}\u2715 Layout Audit Failed:${RESET} UX Score ${RED}${score}/100${RESET} (Required: \u2265 ${minScore}/100) \u2014 Grade ${BOLD}${RED}${grade}${RESET}
`;
  const categoryLines = [
    `  \u2022 Viewport & Overflow:    ${audit.uxScore.categories.overflowAndFit.score}/${audit.uxScore.categories.overflowAndFit.maxScore} pts (${audit.uxScore.categories.overflowAndFit.issueCount} issues)`,
    `  \u2022 Stability & Shifts:     ${audit.uxScore.categories.stability.score}/${audit.uxScore.categories.stability.maxScore} pts`,
    `  \u2022 Touch Ergonomics:       ${audit.uxScore.categories.touchErgonomics.score}/${audit.uxScore.categories.touchErgonomics.maxScore} pts (${audit.uxScore.categories.touchErgonomics.issueCount} issues)`,
    `  \u2022 Readability & Occlusion:${audit.uxScore.categories.readabilityAndVisibility.score}/${audit.uxScore.categories.readabilityAndVisibility.maxScore} pts (${audit.uxScore.categories.readabilityAndVisibility.issueCount} issues)`,
    `  \u2022 Accessibility & Contrast:${audit.uxScore.categories.accessibilityAndFocus.score}/${audit.uxScore.categories.accessibilityAndFocus.maxScore} pts (${audit.uxScore.categories.accessibilityAndFocus.issueCount} issues)`
  ].join("\n");
  const topIssues = [];
  for (const i of audit.overflowIssues.slice(0, 3)) {
    topIssues.push(`  ${RED}\u2716${RESET} [Viewport Bleed] ${BOLD}${i.selector}${RESET} bleeds by +${Math.round(i.overflowRightPx)}px
    ${CYAN}Fix:${RESET} ${i.suggestedFix}`);
  }
  for (const i of audit.containerOverflowIssues.slice(0, 3)) {
    topIssues.push(`  ${RED}\u2716${RESET} [Container Bleed] ${BOLD}${i.selector}${RESET} in ${i.containerSelector} (+${Math.round(i.overflowRightPx || i.overflowBottomPx || i.overflowLeftPx)}px)
    ${CYAN}Fix:${RESET} ${i.suggestedFix}`);
  }
  for (const i of (audit.flexBlowoutIssues || []).slice(0, 3)) {
    topIssues.push(`  ${RED}\u2716${RESET} [Flex Blowout] ${BOLD}${i.selector}${RESET} exceeds ${i.parentSelector} (+${Math.round(i.overflowPx)}px)
    ${CYAN}Fix:${RESET} ${i.suggestion}`);
  }
  for (const i of (audit.stickyOcclusionIssues || []).slice(0, 3)) {
    topIssues.push(`  ${RED}\u2716${RESET} [Sticky Occlusion] ${BOLD}${i.stickySelector}${RESET} occludes ${i.occludedSelector} (${Math.round(i.overlapRect.width)}x${Math.round(i.overlapRect.height)}px)
    ${CYAN}Fix:${RESET} ${i.suggestion}`);
  }
  for (const i of audit.touchTargetIssues.slice(0, 3)) {
    topIssues.push(`  ${YELLOW}\u26A0${RESET} [Touch Target] ${BOLD}${i.selector}${RESET} (${Math.round(i.width)}x${Math.round(i.height)}px < ${i.minRequiredSize}px)
    ${CYAN}Fix:${RESET} ${i.suggestion}`);
  }
  for (const i of audit.contrastIssues.slice(0, 3)) {
    topIssues.push(`  ${RED}\u2716${RESET} [Color Contrast] ${BOLD}${i.selector}${RESET} ratio ${i.contrastRatio}:1 < ${i.requiredRatio}:1
    ${CYAN}Fix:${RESET} ${i.suggestion}`);
  }
  let result = `${header}
${BOLD}Category Breakdown:${RESET}
${categoryLines}
`;
  if (topIssues.length > 0) {
    result += `
${BOLD}Primary Detected Issues:${RESET}
${topIssues.join("\n")}
`;
  }
  return result;
}
function formatOverflowFailureMessage(overflowIssues, containerIssues = []) {
  const total = overflowIssues.length + containerIssues.length;
  let out = `${BOLD}${RED}\u2715 Layout Overflow Detected:${RESET} Found ${BOLD}${total}${RESET} overflowing element(s):
`;
  for (const ov of overflowIssues) {
    out += `  ${RED}\u2716${RESET} [Viewport Bleed] ${BOLD}${ov.selector}${RESET} (+${Math.round(ov.overflowRightPx)}px)
    ${CYAN}Fix:${RESET} ${ov.suggestedFix}
`;
  }
  for (const co of containerIssues) {
    const px = Math.round(co.overflowRightPx || co.overflowBottomPx || 0);
    out += `  ${RED}\u2716${RESET} [Container Bleed] ${BOLD}${co.selector}${RESET} inside ${co.containerSelector} (+${px}px)
    ${CYAN}Fix:${RESET} ${co.suggestedFix}
`;
  }
  return out;
}
function formatStickyOcclusionFailureMessage(issues) {
  let out = `${BOLD}${RED}\u2715 Sticky Element Occlusion Detected:${RESET} Found ${BOLD}${issues.length}${RESET} occluded element(s):
`;
  for (const issue of issues) {
    out += `  ${RED}\u2716${RESET} ${BOLD}${issue.stickySelector}${RESET} occludes ${BOLD}${issue.occludedSelector}${RESET} (${Math.round(issue.overlapRect.width)}x${Math.round(issue.overlapRect.height)}px)
    ${CYAN}Fix:${RESET} ${issue.suggestion}
`;
  }
  return out;
}
function formatFlexBlowoutFailureMessage(issues) {
  let out = `${BOLD}${RED}\u2715 Flexbox / Grid Blowout Detected:${RESET} Found ${BOLD}${issues.length}${RESET} blowout element(s):
`;
  for (const issue of issues) {
    out += `  ${RED}\u2716${RESET} ${BOLD}${issue.selector}${RESET} blowing out container ${BOLD}${issue.parentSelector}${RESET} (+${Math.round(issue.overflowPx)}px)
    ${CYAN}Fix:${RESET} ${issue.suggestion}
`;
  }
  return out;
}

// src/playwright/matchers.ts
var customMatchers = {
  /**
   * Asserts that no element on the page overflows or bleeds past viewport or parent container boundaries.
   */
  async toHaveNoLayoutOverflow(page, options) {
    const inspector = new LayoutInspector(page, options);
    const audit = await inspector.audit({
      checkTouchTargets: false,
      checkReadability: false,
      checkOcclusion: false,
      ...options
    });
    const hasViewportOverflow = audit.overflowIssues.length > 0 || audit.viewportFit.contentBleeds;
    const hasContainerOverflow = audit.containerOverflowIssues.length > 0;
    const pass = !hasViewportOverflow && !hasContainerOverflow;
    const message = () => {
      if (pass) {
        return `Expected page to have layout overflow issues, but none were detected (Page width: ${audit.viewport.width}px, Scroll width: ${audit.viewport.scrollWidth}px).`;
      }
      return formatOverflowFailureMessage(audit.overflowIssues, audit.containerOverflowIssues);
    };
    return {
      pass,
      message,
      name: "toHaveNoLayoutOverflow"
    };
  },
  /**
   * Asserts that no child element bleeds beyond its parent visual container's inner content/padding boundary.
   */
  async toHaveNoContainerOverflow(page, options) {
    const inspector = new LayoutInspector(page, options);
    const audit = await inspector.audit({
      checkTouchTargets: false,
      checkReadability: false,
      checkOcclusion: false,
      ...options
    });
    const pass = audit.containerOverflowIssues.length === 0;
    const message = () => {
      if (pass) {
        return `Expected page to have container overflow issues, but all elements were cleanly contained.`;
      }
      const issueSummary = audit.containerOverflowIssues.map((i) => `  - Child ${i.selector} overflows container ${i.containerSelector} by +${Math.round(i.overflowRightPx || i.overflowBottomPx || i.overflowLeftPx)}px (fix: ${i.suggestedFix})`).join("\n");
      return `Expected no child elements to overflow their parent containers, but found ${audit.containerOverflowIssues.length} container overflow issue(s):
${issueSummary}`;
    };
    return {
      pass,
      message,
      name: "toHaveNoContainerOverflow"
    };
  },
  /**
   * Asserts that text flows cleanly without awkward mid-word breaks, ragged orphan wraps on buttons/headings, or crushed flex columns.
   */
  async toHaveCleanTextFlow(page, options) {
    const inspector = new LayoutInspector(page, options);
    const audit = await inspector.audit({
      checkTouchTargets: false,
      checkOcclusion: false,
      checkCollisions: false,
      ...options
    });
    const pass = audit.textFlowIssues.length === 0;
    const message = () => {
      if (pass) {
        return `Expected text flow issues, but all text wrapped cleanly without mid-word breaks or orphan wraps.`;
      }
      const issueSummary = audit.textFlowIssues.map((i) => `  - [${i.anomalyType}] ${i.selector}: ${i.details} (fix: ${i.suggestedFix})`).join("\n");
      return `Expected clean text flow, but found ${audit.textFlowIssues.length} text flow & wrap anomaly issue(s):
${issueSummary}`;
    };
    return {
      pass,
      message,
      name: "toHaveCleanTextFlow"
    };
  },
  /**
   * Asserts that the page properly fits mobile viewport constraints and has valid mobile viewport meta.
   */
  async toHaveMobileFit(page, options) {
    const inspector = new LayoutInspector(page, options);
    const audit = await inspector.audit(options);
    const fit = audit.viewportFit;
    const pass = fit.isMobileOptimized && !fit.contentBleeds && fit.allowsUserZoom;
    const message = () => {
      if (pass) {
        return `Expected page to fail mobile fit check, but mobile fit was compliant.`;
      }
      return `Expected page to comply with mobile responsive fit standards, but encountered issues:
${fit.issues.map((i) => `  - ${i}`).join("\n")}`;
    };
    return {
      pass,
      message,
      name: "toHaveMobileFit"
    };
  },
  /**
   * Asserts that all interactive touch targets meet the minimum size requirement (default 24px for AA, 44px for AAA).
   */
  async toHaveTouchFriendlyTargets(page, options) {
    const inspector = new LayoutInspector(page);
    const audit = await inspector.audit({ minTouchTargetSize: options?.minSize || 24 });
    const pass = audit.touchTargetIssues.length === 0;
    const message = () => {
      if (pass) {
        return `Expected page to have touch target sizing issues, but all interactive elements met requirements.`;
      }
      const issueSummary = audit.touchTargetIssues.map((i) => `  - ${i.selector} (${Math.round(i.width)}x${Math.round(i.height)}px < ${i.minRequiredSize}px)`).join("\n");
      return `Expected all touch targets to be at least ${options?.minSize || 24}px, but found ${audit.touchTargetIssues.length} undersized target(s):
${issueSummary}`;
    };
    return {
      pass,
      message,
      name: "toHaveTouchFriendlyTargets"
    };
  },
  /**
   * Asserts that no interactive actions are occluded or tap-jacked by floating/sticky layers.
   */
  async toHaveNoOccludedActions(page, options) {
    const inspector = new LayoutInspector(page, options);
    const audit = await inspector.audit({ checkOcclusion: true, ...options });
    const pass = audit.occlusionIssues.length === 0;
    const message = () => {
      if (pass) {
        return `Expected page to have occluded interactive elements, but all buttons/inputs were accessible.`;
      }
      const issueSummary = audit.occlusionIssues.map((i) => `  - ${i.selector} (occluded by: ${i.occludedBySelector}, ratio: ${Math.round(i.occludedAreaRatio * 100)}%)`).join("\n");
      return `Expected all interactive elements to be clickable, but found ${audit.occlusionIssues.length} occluded action(s):
${issueSummary}`;
    };
    return {
      pass,
      message,
      name: "toHaveNoOccludedActions"
    };
  },
  /**
   * Asserts that no sibling elements or text labels collide with overlapping coordinates.
   */
  async toHaveNoElementCollisions(page, options) {
    const inspector = new LayoutInspector(page, options);
    const audit = await inspector.audit({ checkCollisions: true, ...options });
    const pass = audit.collisionIssues.length === 0;
    const message = () => {
      if (pass) {
        return `Expected page to have element collisions, but none were detected.`;
      }
      const issueSummary = audit.collisionIssues.map((i) => `  - ${i.selectorA} collides with ${i.selectorB} (overlap: ${Math.round(i.overlapAreaPx)}px\xB2)`).join("\n");
      return `Expected no element collisions, but found ${audit.collisionIssues.length} colliding pair(s):
${issueSummary}`;
    };
    return {
      pass,
      message,
      name: "toHaveNoElementCollisions"
    };
  },
  /**
   * Asserts that no nested containers trap scrolling on mobile viewports.
   */
  async toHaveNoNestedScrollTraps(page, options) {
    const inspector = new LayoutInspector(page, options);
    const audit = await inspector.audit({ checkScrollTraps: true, ...options });
    const criticalTraps = audit.scrollTrapIssues.filter((t) => t.isTrapRisk);
    const pass = criticalTraps.length === 0;
    const message = () => {
      if (pass) {
        return `Expected page to have nested scroll traps, but none were detected.`;
      }
      const issueSummary = criticalTraps.map((i) => `  - ${i.selector} (${i.suggestion})`).join("\n");
      return `Expected no nested scroll traps, but found ${criticalTraps.length} trapping container(s):
${issueSummary}`;
    };
    return {
      pass,
      message,
      name: "toHaveNoNestedScrollTraps"
    };
  },
  /**
   * Asserts that all interactive buttons and inputs have accessible names (aria-label, title, or text).
   */
  async toHaveAccessibleInteractiveNames(page, options) {
    const inspector = new LayoutInspector(page, options);
    const audit = await inspector.audit({ checkAccessibleNames: true, ...options });
    const pass = audit.accessibleNameIssues.length === 0;
    const message = () => {
      if (pass) {
        return `Expected interactive elements to be missing accessible names, but all were labeled.`;
      }
      const issueSummary = audit.accessibleNameIssues.map((i) => `  - ${i.selector} (<${i.tagName}>, icon-only: ${i.isIconOnly})`).join("\n");
      return `Expected all interactive buttons/links to have accessible names, but found ${audit.accessibleNameIssues.length} unlabeled element(s):
${issueSummary}`;
    };
    return {
      pass,
      message,
      name: "toHaveAccessibleInteractiveNames"
    };
  },
  /**
   * Asserts that page reflows cleanly without horizontal scrolling at 200% text zoom (WCAG 1.4.10).
   */
  async toPass200PercentZoomReflow(page, zoomFactor = 2) {
    const inspector = new LayoutInspector(page);
    const reflow = await inspector.test200PercentZoomReflow(zoomFactor);
    const pass = reflow.passesReflow;
    const message = () => {
      if (pass) {
        return `Expected page to fail 200% zoom reflow, but page reflowed cleanly.`;
      }
      return `Page failed WCAG 1.4.10 Reflow at ${Math.round(zoomFactor * 100)}% zoom:
${reflow.issues.map((i) => `  - ${i}`).join("\n")}`;
    };
    return {
      pass,
      message,
      name: "toPass200PercentZoomReflow"
    };
  },
  /**
   * Asserts that an asynchronous action does not introduce jarring layout shifts.
   */
  async toHaveAcceptableLayoutShift(page, action, options) {
    const inspector = new LayoutInspector(page);
    const shiftResult = await inspector.trackShifts(action, options);
    const pass = shiftResult.isAcceptable;
    const message = () => {
      if (pass) {
        return `Expected layout shift to fail stability threshold, but layout remained stable (Score: ${shiftResult.totalShiftScore}).`;
      }
      return `Layout shift threshold exceeded!
${shiftResult.summary}
` + shiftResult.items.slice(0, 5).map((i) => `  - ${i.selector}: \u0394x=${i.deltaX}px, \u0394y=${i.deltaY}px (Impact: ${i.impactScore})`).join("\n");
    };
    return {
      pass,
      message,
      name: "toHaveAcceptableLayoutShift"
    };
  },
  /**
   * Asserts that no sticky or fixed elements occlude underlying interactive elements or headings.
   */
  async toHaveNoStickyOcclusion(page, options) {
    const inspector = new LayoutInspector(page, options);
    const audit = await inspector.audit({
      checkTouchTargets: false,
      checkReadability: false,
      ...options
    });
    const issues = audit.stickyOcclusionIssues || [];
    const pass = issues.length === 0;
    const message = () => {
      if (pass) {
        return `Expected page to have sticky element occlusions, but none were detected.`;
      }
      return formatStickyOcclusionFailureMessage(issues);
    };
    return {
      pass,
      message,
      name: "toHaveNoStickyOcclusion"
    };
  },
  /**
   * Asserts that no flexbox or grid child elements blowout their parent container boundaries.
   */
  async toHaveNoFlexBlowout(page, options) {
    const inspector = new LayoutInspector(page, options);
    const audit = await inspector.audit({
      checkTouchTargets: false,
      checkReadability: false,
      ...options
    });
    const issues = audit.flexBlowoutIssues || [];
    const pass = issues.length === 0;
    const message = () => {
      if (pass) {
        return `Expected page to have flex blowout issues, but all elements fit within boundaries.`;
      }
      return formatFlexBlowoutFailureMessage(issues);
    };
    return {
      pass,
      message,
      name: "toHaveNoFlexBlowout"
    };
  },
  /**
   * Asserts that overall UX score meets or exceeds a target minimum (default 80/100, Grade B/A).
   */
  async toPassLayoutAudit(page, options) {
    const minScore = options?.minScore ?? 80;
    const inspector = new LayoutInspector(page, options);
    const audit = await inspector.audit(options);
    const pass = audit.uxScore.totalScore >= minScore && audit.uxScore.passed;
    const message = () => {
      if (pass) {
        return `Expected layout audit score to be below ${minScore}, but scored ${audit.uxScore.totalScore} (Grade ${audit.uxScore.grade}).`;
      }
      return formatAuditFailureMessage(audit, minScore);
    };
    return {
      pass,
      message,
      name: "toPassLayoutAudit"
    };
  }
};
expect.extend(customMatchers);

export { DEVICE_PRESETS, LayoutInspector, calculateContainerOverflow, calculateGrade, calculateOverflow, categorizeThumbZone, collectInPageAuditScript, computeAABBOverlapArea, computeElementDisplacement, computeUXScore, customMatchers, evaluateAccessibleName, evaluateColorContrast, evaluateContainerOverflow, evaluateElementCollisions, evaluateElementOcclusion, evaluateFocusIndicator, evaluateLayoutShift, evaluateScrollTrap, evaluateTextFlow, evaluateTextReadability, evaluateThumbZoneErgonomics, evaluateTouchTarget, evaluateViewportFit, evaluateZoomReflow, generateContainerOverflowRemediation, generateHtmlReport, generateOverflowRemediation, generateRaycastSamplePoints, generateTextFlowRemediation, getContrastRatio, getDevicePreset, getInPageAuditFunctionString, getRelativeLuminance, isExemptFromContainerOverflow, parseColor };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map