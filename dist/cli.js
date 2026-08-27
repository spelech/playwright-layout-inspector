#!/usr/bin/env node
'use strict';

var playwright = require('playwright');
var fs = require('fs');
var path2 = require('path');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var fs__namespace = /*#__PURE__*/_interopNamespace(fs);
var path2__namespace = /*#__PURE__*/_interopNamespace(path2);

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
  const { tagName, selector, boundingBox, viewport, styles, overflowRightPx } = issue;
  const widthPx = boundingBox.width;
  const viewportWidth = viewport.width;
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

// src/core/occlusion.ts
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
    viewportFit,
    layoutShiftResult,
    touchTargetIssues,
    readabilityIssues,
    contrastIssues = [],
    occlusionIssues,
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
  for (const trap of scrollTrapIssues) {
    overflowPenalty += trap.severity === "critical" ? 6 : 2;
  }
  const overflowScoreVal = Math.max(0, Math.min(maxOverflowScore, maxOverflowScore - overflowPenalty));
  const overflowCategory = {
    name: "Overflow & Viewport Fit",
    score: Math.round(overflowScoreVal * 10) / 10,
    weight: maxOverflowScore,
    maxScore: maxOverflowScore,
    grade: calculateGrade(overflowScoreVal / maxOverflowScore * 100),
    passed: overflowScoreVal >= maxOverflowScore * 0.8,
    issueCount: overflowIssues.length + scrollTrapIssues.length + viewportFit.issues.length,
    summary: overflowIssues.length === 0 && scrollTrapIssues.length === 0 && !viewportFit.contentBleeds ? "Perfect viewport fit without horizontal overflow or scroll traps." : `${overflowIssues.length} overflow, ${scrollTrapIssues.length} scroll trap issues detected.`
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
  for (const occ of occlusionIssues) {
    readabilityPenalty += occ.severity === "critical" ? 5 : 2;
  }
  for (const col of collisionIssues) {
    readabilityPenalty += col.severity === "critical" ? 5 : 2;
  }
  const readabilityScoreVal = Math.max(0, Math.min(maxReadabilityScore, maxReadabilityScore - readabilityPenalty));
  const totalVisibilityIssues = readabilityIssues.length + occlusionIssues.length + collisionIssues.length;
  const readabilityCategory = {
    name: "Readability & Visual Hierarchy",
    score: Math.round(readabilityScoreVal * 10) / 10,
    weight: maxReadabilityScore,
    maxScore: maxReadabilityScore,
    grade: calculateGrade(readabilityScoreVal / maxReadabilityScore * 100),
    passed: readabilityScoreVal >= maxReadabilityScore * 0.8,
    issueCount: totalVisibilityIssues,
    summary: totalVisibilityIssues === 0 ? "Clean visual hierarchy without element occlusion, text collision, or unreadable truncation." : `${totalVisibilityIssues} text, occlusion, or collision issue(s) detected.`
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
  function getCssSelector(el) {
    if (el.id) {
      return `#${CSS.escape(el.id)}`;
    }
    const path3 = [];
    let current = el;
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        selector += `#${CSS.escape(current.id)}`;
        path3.unshift(selector);
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
        if (nth > 1) {
          selector += `:nth-of-type(${nth})`;
        }
      }
      path3.unshift(selector);
      current = current.parentElement;
      if (path3.length > 5) break;
    }
    return path3.join(" > ");
  }
  const metaEl = document.querySelector('meta[name="viewport"]');
  const metaViewport = metaEl ? metaEl.getAttribute("content") : null;
  const vpWidth = window.visualViewport ? window.visualViewport.width : document.documentElement.clientWidth || window.innerWidth;
  const vpHeight = window.visualViewport ? window.visualViewport.height : document.documentElement.clientHeight || window.innerHeight;
  const vp = {
    width: Math.round(vpWidth * 100) / 100,
    height: Math.round(vpHeight * 100) / 100,
    devicePixelRatio: window.devicePixelRatio || 1,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body ? document.body.scrollWidth : 0),
    scrollHeight: Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0),
    metaViewport
  };
  const allElements = Array.from(document.querySelectorAll("body *"));
  const collectedElements = [];
  for (const el of allElements) {
    let parseRgba2 = function(str) {
      if (!str || str === "transparent") return null;
      const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!m) return null;
      return {
        r: parseInt(m[1], 10),
        g: parseInt(m[2], 10),
        b: parseInt(m[3], 10),
        a: m[4] !== void 0 ? parseFloat(m[4]) : 1
      };
    };
    const tag = el.tagName.toLowerCase();
    if (["script", "style", "noscript", "path", "g", "defs", "clippath", "symbol", "use", "br", "hr"].includes(tag)) {
      continue;
    }
    const selector = getCssSelector(el);
    if (ignoreSelectors.some((ign) => selector.includes(ign))) {
      continue;
    }
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 && rect.height <= 0) {
      continue;
    }
    const comp = window.getComputedStyle(el);
    if (comp.display === "none" || comp.visibility === "hidden" || parseFloat(comp.opacity) === 0) {
      continue;
    }
    const role = el.getAttribute("role");
    const isButton = tag === "button" || role === "button" || role === "tab" || role === "menuitem";
    const isLink = tag === "a" && el.hasAttribute("href");
    const isInput = ["input", "select", "textarea"].includes(tag);
    const hasCursorPointer = comp.cursor === "pointer";
    const hasExplicitClickHandler = el.hasAttribute("onclick") || typeof el.onclick === "function";
    const interactiveAncestor = el.parentElement ? el.parentElement.closest('button, a[href], [role="button"], [role="tab"]') : null;
    const isDirectInteractive = isButton || isLink || isInput || hasExplicitClickHandler || hasCursorPointer && ["div", "span", "li"].includes(tag);
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
      if (tag === "input" || tag === "textarea" || tag === "select" || isTextOnly) {
        hasDirectText = true;
      }
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
      const parsed = parseRgba2(bgStyle);
      if (parsed && parsed.a > 0) {
        bgStack.unshift(parsed);
      }
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
    collectedElements.push({
      selector,
      tagName: tag,
      id: el.id || "",
      className: typeof el.className === "string" ? el.className : "",
      textSnippet,
      ancestors,
      hasDirectText,
      rect: {
        x: Math.round(rect.x * 100) / 100,
        y: Math.round(rect.y * 100) / 100,
        width: Math.round(rect.width * 100) / 100,
        height: Math.round(rect.height * 100) / 100,
        top: Math.round(rect.top * 100) / 100,
        right: Math.round(rect.right * 100) / 100,
        bottom: Math.round(rect.bottom * 100) / 100,
        left: Math.round(rect.left * 100) / 100
      },
      computedStyles: {
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
      },
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
  }
  const occlusions = [];
  for (const item of collectedElements) {
    if (!item.isInteractive) continue;
    const r = item.rect;
    if (r.right < 0 || r.left > vp.width || r.bottom < 0 || r.top > vp.height) {
      continue;
    }
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
          const topSelector = getCssSelector(topEl);
          const isTargetOrDescendant = topEl === targetDomEl || targetDomEl.contains(topEl);
          raycastResults.push({
            point: pt,
            topSelector,
            topTagName: topEl.tagName.toLowerCase(),
            isTargetOrDescendant
          });
        }
      }
    }
    if (raycastResults.some((res) => !res.isTargetOrDescendant)) {
      occlusions.push({
        selector: item.selector,
        tagName: item.tagName,
        boundingBox: item.rect,
        raycastResults
      });
    }
  }
  return {
    viewport: vp,
    elements: collectedElements,
    occlusions
  };
}

// src/reporter/htmlReporter.ts
function generateHtmlReport(result) {
  const {
    url,
    timestamp,
    device,
    viewport,
    uxScore,
    overflowIssues,
    touchTargetIssues,
    viewportFit,
    readabilityIssues,
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
  const totalIssues = overflowIssues.length + touchTargetIssues.length + readabilityIssues.length + occlusionIssues.length + collisionIssues.length + scrollTrapIssues.length + accessibleNameIssues.length + focusIndicatorIssues.length + viewportFit.issues.length;
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
          <p class="text-xs text-slate-400">Actionable layout, overflow, collision, and accessibility fixes</p>
        </div>
      </div>

      ${totalIssues === 0 ? `
        <div class="py-12 text-center text-slate-400 space-y-2">
          <div class="text-4xl">\u{1F389}</div>
          <p class="text-base font-semibold text-slate-200">No layout or UX issues detected!</p>
          <p class="text-xs">Your layout complies with responsive viewport fit, touch target standards, accessibility, and stability rules.</p>
        </div>
      ` : `
        <div class="space-y-4">
          <!-- Viewport Fit Issues -->
          ${viewportFit.issues.map((iss) => `
            <div class="p-4 bg-rose-950/30 border border-rose-500/30 rounded-xl space-y-2">
              <div class="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <span>\u{1F6A8} Viewport Constraint Issue</span>
              </div>
              <p class="text-sm text-slate-200">${escapeHtml(iss)}</p>
            </div>
          `).join("")}

          <!-- Overflow Issues -->
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
      checkReadability: true,
      checkContrast: true,
      checkOcclusion: true,
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
    const viewportFit = evaluateViewportFit(viewport.metaViewport, viewport);
    const overflowIssues = [];
    if (mergedOptions.checkOverflow !== false) {
      for (const el of inPageData.elements) {
        const over = calculateOverflow(el.rect, viewport);
        if (over.hasOverflow) {
          const remediation = generateOverflowRemediation({
            tagName: el.tagName,
            selector: el.selector,
            boundingBox: el.rect,
            viewport,
            styles: el.computedStyles,
            overflowRightPx: over.overflowRightPx
          });
          overflowIssues.push({
            selector: el.selector,
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            boundingBox: el.rect,
            viewport,
            overflowRightPx: over.overflowRightPx,
            overflowBottomPx: over.overflowBottomPx,
            overflowLeftPx: over.overflowLeftPx,
            computedStyles: el.computedStyles,
            culpritDescription: remediation.culpritDescription,
            suggestedFix: remediation.suggestedFix,
            severity: over.overflowRightPx > 10 ? "critical" : "warning"
          });
        }
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
        if (issue) {
          touchTargetIssues.push(issue);
        }
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
        if (issue) {
          readabilityIssues.push(issue);
        }
      }
    }
    const contrastIssues = [];
    if (mergedOptions.checkContrast !== false) {
      for (const el of inPageData.elements) {
        if (!el.hasDirectText) continue;
        if (!el.textSnippet || el.textSnippet.trim().length === 0) continue;
        const fontSizePx = parseFloat(el.computedStyles.fontSize) || 16;
        const color = el.computedStyles.color || "rgb(0, 0, 0)";
        const backgroundColor = el.computedStyles.backgroundColor || "rgb(255, 255, 255)";
        const fontWeight = el.computedStyles.fontWeight || "400";
        const issue = evaluateColorContrast(
          {
            selector: el.selector,
            tagName: el.tagName,
            textSnippet: el.textSnippet,
            color,
            backgroundColor,
            fontSizePx,
            fontWeight
          },
          { minRatio: mergedOptions.minContrastRatio }
        );
        if (issue) {
          contrastIssues.push(issue);
        }
      }
    }
    const occlusionIssues = [];
    if (mergedOptions.checkOcclusion !== false) {
      for (const occ of inPageData.occlusions) {
        const target = inPageData.elements.find((e) => e.selector === occ.selector);
        if (target) {
          const issue = evaluateElementOcclusion(
            {
              selector: target.selector,
              tagName: target.tagName,
              boundingBox: target.rect,
              isInteractive: target.isInteractive
            },
            occ.raycastResults
          );
          if (issue) {
            occlusionIssues.push(issue);
          }
        }
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
        const trap = evaluateScrollTrap(
          {
            selector: el.selector,
            tagName: el.tagName,
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            overflowY: el.computedStyles.overflowY,
            overflowX: el.computedStyles.overflowX
          },
          viewport
        );
        if (trap) {
          scrollTrapIssues.push(trap);
        }
      }
    }
    const accessibleNameIssues = [];
    if (mergedOptions.checkAccessibleNames !== false) {
      for (const el of inPageData.elements) {
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
        if (issue) {
          accessibleNameIssues.push(issue);
        }
      }
    }
    const focusIndicatorIssues = [];
    if (mergedOptions.checkFocusIndicators !== false) {
      for (const el of interactiveElements) {
        const focusData = await this.page.evaluate((selector) => {
          const el2 = document.querySelector(selector);
          if (!el2) return null;
          el2.focus({ preventScroll: true });
          const comp = window.getComputedStyle(el2);
          const result = {
            outlineWidth: comp.outlineWidth,
            outlineStyle: comp.outlineStyle,
            outlineColor: comp.outlineColor,
            boxShadow: comp.boxShadow
          };
          el2.blur();
          return result;
        }, el.selector);
        if (!focusData) continue;
        const issue = evaluateFocusIndicator({
          selector: el.selector,
          tagName: el.tagName,
          outlineWidth: focusData.outlineWidth || "0px",
          outlineStyle: focusData.outlineStyle || "none",
          outlineColor: focusData.outlineColor || "transparent",
          boxShadow: focusData.boxShadow || "none"});
        if (issue) {
          focusIndicatorIssues.push(issue);
        }
      }
    }
    let thumbZoneAnalysis;
    if (mergedOptions.checkThumbZones !== false) {
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
    let screenshotBase64;
    if (mergedOptions.includeScreenshot) {
      try {
        const buffer = await this.page.screenshot({ fullPage: false });
        screenshotBase64 = buffer.toString("base64");
      } catch {
      }
    }
    const uxScore = computeUXScore({
      overflowIssues,
      viewportFit,
      touchTargetIssues,
      readabilityIssues,
      contrastIssues,
      occlusionIssues,
      collisionIssues,
      scrollTrapIssues,
      accessibleNameIssues,
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
      overflowIssues,
      touchTargetIssues,
      viewportFit,
      readabilityIssues,
      contrastIssues,
      occlusionIssues,
      collisionIssues,
      scrollTrapIssues,
      accessibleNameIssues,
      focusIndicatorIssues,
      thumbZoneAnalysis,
      zoomReflowResult,
      screenshotBase64,
      executionTimeMs: Date.now() - startTime
    };
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
    const resolvedPath = path2__namespace.resolve(outputPath);
    const dir = path2__namespace.dirname(resolvedPath);
    if (!fs__namespace.existsSync(dir)) {
      fs__namespace.mkdirSync(dir, { recursive: true });
    }
    fs__namespace.writeFileSync(resolvedPath, html, "utf-8");
    return resolvedPath;
  }
};
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  if (!command || command === "--help" || command === "-h" || command === "help") {
    console.log(`
Playwright Layout Inspector CLI

Usage:
  playwright-layout-inspector audit <url> [options]
  playwright-layout-inspector list-devices

Options:
  --device, -d       Device preset name (default: "Samsung Galaxy S25+")
  --output, -o       HTML report output path (default: "./layout-audit-report.html")
  --json             JSON report output path
  --min-score, -s    Minimum UX score threshold to pass (default: 80)
  --no-screenshot    Disable screenshot capture in report
  --help, -h         Show help

Examples:
  playwright-layout-inspector audit http://localhost:5173 --device "Samsung Galaxy S25+"
  playwright-layout-inspector audit https://example.com --output ./reports/audit.html --min-score 85
`);
    process.exit(0);
  }
  if (command === "list-devices") {
    console.log("\nAvailable Device Presets:");
    for (const [name, p] of Object.entries(DEVICE_PRESETS)) {
      console.log(`  - ${name.padEnd(22)} (${p.width}x${p.height}px, DPR: ${p.deviceScaleFactor}x, ${p.category})`);
    }
    console.log("");
    process.exit(0);
  }
  if (command === "audit") {
    const url = args[1];
    if (!url) {
      console.error("Error: Missing target URL for audit.");
      process.exit(1);
    }
    let deviceName = "Samsung Galaxy S25+";
    let outputPath = "./layout-audit-report.html";
    let jsonPath = null;
    let minScore = 80;
    let includeScreenshot = true;
    for (let i = 2; i < args.length; i++) {
      if (args[i] === "--device" || args[i] === "-d") deviceName = args[++i];
      else if (args[i] === "--output" || args[i] === "-o") outputPath = args[++i];
      else if (args[i] === "--json") jsonPath = args[++i];
      else if (args[i] === "--min-score" || args[i] === "-s") minScore = parseFloat(args[++i]);
      else if (args[i] === "--no-screenshot") includeScreenshot = false;
    }
    const device = getDevicePreset(deviceName);
    console.log(`
\u{1F680} Auditing ${url} on [${device.name} - ${device.width}x${device.height}]...`);
    const browser = await playwright.chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        deviceScaleFactor: device.deviceScaleFactor,
        isMobile: device.isMobile,
        hasTouch: device.hasTouch,
        userAgent: device.userAgent
      });
      const page = await context.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 3e4 });
      await page.waitForTimeout(500);
      const inspector = new LayoutInspector(page);
      const audit = await inspector.audit({
        device,
        includeScreenshot,
        highlightIssuesInScreenshot: true
      });
      await inspector.generateReport(audit, outputPath);
      console.log(`\u{1F4C4} HTML Report generated: ${path2__namespace.resolve(outputPath)}`);
      if (jsonPath) {
        fs__namespace.writeFileSync(path2__namespace.resolve(jsonPath), JSON.stringify(audit, null, 2), "utf-8");
        console.log(`\u{1F4CA} JSON Report saved: ${path2__namespace.resolve(jsonPath)}`);
      }
      const score = audit.uxScore;
      console.log("\n========================================");
      console.log(`UX Score: ${score.totalScore}/100 (Grade: ${score.grade}) \u2014 ${score.passed ? "PASSED \u2705" : "FAILED \u274C"}`);
      console.log("----------------------------------------");
      console.log(`  \u{1F30A} Overflow & Fit:  ${score.categories.overflowAndFit.score}/${score.categories.overflowAndFit.maxScore} (Issues: ${audit.overflowIssues.length})`);
      console.log(`  \u{1F446} Touch Targets:   ${score.categories.touchErgonomics.score}/${score.categories.touchErgonomics.maxScore} (Issues: ${audit.touchTargetIssues.length})`);
      console.log(`  \u{1F441}\uFE0F  Readability:     ${score.categories.readabilityAndVisibility.score}/${score.categories.readabilityAndVisibility.maxScore} (Issues: ${audit.readabilityIssues.length})`);
      console.log("========================================\n");
      if (audit.overflowIssues.length > 0) {
        console.log("\u{1F6A8} Overflow Culprits:");
        for (const iss of audit.overflowIssues) {
          console.log(`  - ${iss.selector} (+${Math.round(iss.overflowRightPx)}px bleed)`);
          console.log(`    Fix: ${iss.suggestedFix}`);
        }
        console.log("");
      }
      if (score.totalScore < minScore || !score.passed) {
        console.error(`\u274C Audit failed minimum score threshold of ${minScore}/100.`);
        process.exit(1);
      } else {
        console.log(`\u2728 All UX & layout standards passed successfully!`);
        process.exit(0);
      }
    } finally {
      await browser.close();
    }
  }
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}
main().catch((err) => {
  console.error("Fatal execution error:", err);
  process.exit(1);
});
//# sourceMappingURL=cli.js.map
//# sourceMappingURL=cli.js.map