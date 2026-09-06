import type { InPageAuditData } from '../types/inPageAudit';
export type { InPageAuditData } from '../types/inPageAudit';

/**
 * Self-contained in-page audit collector executed inside the browser page via Playwright page.evaluate.
 */
export function collectInPageAuditScript(optionsJson = '{}'): InPageAuditData {
  const options = JSON.parse(optionsJson || '{}');
  const ignoreSelectors: string[] = options.ignoreSelectors || [];
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const toRect = (r: { top: number; right: number; bottom: number; left: number; width: number; height: number; x?: number; y?: number }) => ({
    x: round2(r.x ?? r.left), y: round2(r.y ?? r.top),
    width: round2(r.width), height: round2(r.height),
    top: round2(r.top), right: round2(r.right),
    bottom: round2(r.bottom), left: round2(r.left)
  });

  function getCssSelector(el: Element): string {
    if (el.id) return `#${CSS.escape(el.id)}`;
    const path: string[] = [];
    let current: Element | null = el;
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        selector += `#${CSS.escape(current.id)}`;
        path.unshift(selector);
        break;
      } else {
        let sibling: Element | null = current;
        let nth = 1;
        while ((sibling = sibling.previousElementSibling)) {
          if (sibling.tagName === current.tagName) nth++;
        }
        if (current.className && typeof current.className === 'string' && current.className.trim()) {
          const firstClass = current.className.trim().split(/\s+/)[0];
          if (firstClass && !firstClass.includes(':') && !firstClass.includes('/') && !firstClass.includes('[')) {
            selector += `.${CSS.escape(firstClass)}`;
          }
        }
        if (nth > 1) selector += `:nth-of-type(${nth})`;
      }
      path.unshift(selector);
      current = current.parentElement;
      if (path.length > 5) break;
    }
    return path.join(' > ');
  }

  function parseRgba(str: string) {
    if (!str || str === 'transparent') return null;
    const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return null;
    return {
      r: parseInt(m[1], 10), g: parseInt(m[2], 10), b: parseInt(m[3], 10),
      a: m[4] !== undefined ? parseFloat(m[4]) : 1
    };
  }

  function isVisualContainer(targetEl: Element, style: CSSStyleDeclaration): boolean {
    const t = targetEl.tagName.toLowerCase();
    if (t === 'body' || t === 'html') return false;
    const semantic = ['dialog', 'fieldset', 'form', 'aside', 'section', 'article', 'main', 'nav', 'details', 'table'];
    if (semantic.includes(t)) return true;
    const r = targetEl.getAttribute('role');
    if (r && ['dialog', 'alertdialog', 'region', 'tabpanel', 'group', 'form'].includes(r)) return true;
    const c = (typeof targetEl.className === 'string' ? targetEl.className : '').toLowerCase();
    if (/modal|card|panel|dialog|drawer|sheet|popup|box|container|wrapper|frame|window|tabpanel/.test(c)) return true;

    const hasBg = !!(style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent');
    const hasBorder = !!((parseFloat(style.borderTopWidth || '0') > 0 || parseFloat(style.borderWidth || '0') > 0) && style.borderStyle !== 'none');
    const hasShadow = !!(style.boxShadow && style.boxShadow !== 'none');
    const hasRadius = parseFloat(style.borderRadius || '0') > 0;
    const hasOverflow = style.overflow !== 'visible' || style.overflowX !== 'visible' || style.overflowY !== 'visible';
    const hasConstrainedWidth = !!((style.width && style.width.includes('px')) || (style.maxWidth && style.maxWidth !== 'none'));
    return Boolean((hasBg || hasBorder || hasShadow || hasRadius || hasOverflow) && hasConstrainedWidth);
  }

  function getClosestVisualContainer(el: Element) {
    let curr = el.parentElement;
    while (curr && curr.tagName.toLowerCase() !== 'html' && curr.tagName.toLowerCase() !== 'body') {
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
            top: innerTop, right: innerRight, bottom: innerBottom, left: innerLeft,
            width: Math.max(0, innerRight - innerLeft), height: Math.max(0, innerBottom - innerTop)
          }),
          comp
        };
      }
      curr = curr.parentElement;
    }
    return null;
  }

  function checkExemption(el: Element, comp: CSSStyleDeclaration, containerComp: CSSStyleDeclaration): boolean {
    if (comp.position === 'fixed') return true;
    if (el.hasAttribute('popover') || (el as any).popover) return true;
    const role = el.getAttribute('role') || '';
    if (['tooltip', 'menu', 'listbox', 'dialog', 'alertdialog'].includes(role)) return true;

    const cls = (typeof el.className === 'string' ? el.className : '').toLowerCase();
    if (/tooltip|popover|dropdown|menu|toast|floating|popper|modal-backdrop|select-options|tippy-box/.test(cls)) return true;

    const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
    if ((/close|btn-close|dismiss|badge|indicator|pill|tag/.test(cls) || ariaLabel.includes('close') || ariaLabel.includes('dismiss')) && comp.position === 'absolute') {
      return true;
    }
    if ((containerComp.overflowX === 'auto' || containerComp.overflowX === 'scroll') && (containerComp.overflowY === 'auto' || containerComp.overflowY === 'scroll')) {
      return true;
    }
    return el.getAttribute('aria-hidden') === 'true' && comp.pointerEvents === 'none';
  }

  const metaEl = document.querySelector('meta[name="viewport"]');
  const metaViewport = metaEl ? metaEl.getAttribute('content') : null;

  const vpWidth = window.visualViewport ? window.visualViewport.width : (document.documentElement.clientWidth || window.innerWidth);
  const vpHeight = window.visualViewport ? window.visualViewport.height : (document.documentElement.clientHeight || window.innerHeight);

  const vp = {
    width: round2(vpWidth), height: round2(vpHeight),
    devicePixelRatio: window.devicePixelRatio || 1,
    scrollX: window.scrollX, scrollY: window.scrollY,
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body ? document.body.scrollWidth : 0),
    scrollHeight: Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0),
    metaViewport
  };

  const allElements = Array.from(document.querySelectorAll('body *'));
  const collectedElements: InPageAuditData['elements'] = [];
  const containerOverflows: InPageAuditData['containerOverflows'] = [];
  const textFlowAnomalies: InPageAuditData['textFlowAnomalies'] = [];
  const reportedOverflowParentSelectors = new Set<string>();

  for (const el of allElements) {
    const tag = el.tagName.toLowerCase();
    if (['script', 'style', 'noscript', 'path', 'g', 'defs', 'clippath', 'symbol', 'use', 'br', 'hr'].includes(tag)) continue;

    const selector = getCssSelector(el);
    if (ignoreSelectors.some(ign => selector.includes(ign))) continue;

    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 && rect.height <= 0) continue;

    const comp = window.getComputedStyle(el);
    if (comp.display === 'none' || comp.visibility === 'hidden' || parseFloat(comp.opacity) === 0) continue;

    const role = el.getAttribute('role');
    const isButton = tag === 'button' || role === 'button' || role === 'tab' || role === 'menuitem' || (typeof el.className === 'string' && el.className.includes('btn'));
    const isLink = tag === 'a' && el.hasAttribute('href');
    const isInput = ['input', 'select', 'textarea'].includes(tag);
    const hasCursorPointer = comp.cursor === 'pointer';
    const hasExplicitClickHandler = el.hasAttribute('onclick') || typeof (el as any).onclick === 'function';

    const interactiveAncestor = el.parentElement ? el.parentElement.closest('button, a[href], [role="button"], [role="tab"], label') : null;
    const isDirectInteractive = (isButton || isLink || isInput || hasExplicitClickHandler || (hasCursorPointer && ['div', 'span', 'li'].includes(tag))) && comp.pointerEvents !== 'none' && el.getAttribute('aria-hidden') !== 'true';
    const isInteractive = isDirectInteractive && !interactiveAncestor;

    const textContent = (el.textContent || '').trim().replace(/\s+/g, ' ');
    const textSnippet = textContent.length > 60 ? textContent.substring(0, 57) + '...' : textContent;
    const isTextOnly = ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'strong', 'em', 'b', 'i', 'small'].includes(tag);

    const hasSvgOrImgChild = !!el.querySelector('svg, img');
    const ariaLabel = el.getAttribute('aria-label');
    const ariaLabelledBy = el.getAttribute('aria-labelledby');
    const title = el.getAttribute('title');
    const hasAccessibleName = !!(ariaLabel?.trim() || ariaLabelledBy?.trim() || title?.trim() || textContent.length > 0);

    const isVisuallyHidden = comp.display === 'none' || comp.visibility === 'hidden' || parseFloat(comp.opacity) === 0 ||
      el.classList.contains('sr-only') || (rect.width <= 1 && rect.height <= 1 && comp.overflow === 'hidden');

    let hasDirectText = false;
    if (!isVisuallyHidden) {
      for (let i = 0; i < el.childNodes.length; i++) {
        const node = el.childNodes[i];
        if (node.nodeType === Node.TEXT_NODE && (node.nodeValue || '').trim().length > 0) {
          hasDirectText = true;
          break;
        }
      }
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || isTextOnly) hasDirectText = true;
    }

    const ancestors: string[] = [];
    let p = el.parentElement;
    while (p && p.tagName.toLowerCase() !== 'html') {
      ancestors.push(getCssSelector(p));
      p = p.parentElement;
    }

    const bgStack: { r: number; g: number; b: number; a: number }[] = [];
    let currBgEl: Element | null = el;
    while (currBgEl) {
      const bgStyle = window.getComputedStyle(currBgEl).backgroundColor;
      const parsed = parseRgba(bgStyle);
      if (parsed && parsed.a > 0) bgStack.unshift(parsed);
      currBgEl = currBgEl.parentElement;
    }

    let compBg = { r: 255, g: 255, b: 255, a: 1 };
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
      overflow: comp.overflow, overflowX: comp.overflowX, overflowY: comp.overflowY,
      width: comp.width, minWidth: comp.minWidth, maxWidth: comp.maxWidth,
      height: comp.height, minHeight: comp.minHeight, maxHeight: comp.maxHeight,
      transform: comp.transform, display: comp.display, position: comp.position,
      boxSizing: comp.boxSizing, margin: comp.margin, padding: comp.padding,
      paddingTop: comp.paddingTop, paddingRight: comp.paddingRight,
      paddingBottom: comp.paddingBottom, paddingLeft: comp.paddingLeft,
      borderTopWidth: comp.borderTopWidth, borderRightWidth: comp.borderRightWidth,
      borderBottomWidth: comp.borderBottomWidth, borderLeftWidth: comp.borderLeftWidth,
      wordBreak: comp.wordBreak, overflowWrap: comp.overflowWrap,
      whiteSpace: comp.whiteSpace, textWrap: (comp as any).textWrap || comp.whiteSpace,
      flexDirection: comp.flexDirection, flexWrap: comp.flexWrap,
      flexShrink: comp.flexShrink, flexGrow: comp.flexGrow, flexBasis: comp.flexBasis,
      fontSize: comp.fontSize, lineHeight: comp.lineHeight, fontWeight: comp.fontWeight,
      color: comp.color, backgroundColor: effectiveBg, zIndex: comp.zIndex,
      outlineWidth: comp.outlineWidth, outlineStyle: comp.outlineStyle,
      outlineColor: comp.outlineColor, boxShadow: comp.boxShadow
    };

    collectedElements.push({
      selector, tagName: tag, id: el.id || '',
      className: typeof el.className === 'string' ? el.className : '',
      textSnippet, ancestors, hasDirectText, rect: toRect(rect),
      computedStyles: computedStylesObj,
      scrollWidth: el.scrollWidth, clientWidth: el.clientWidth,
      scrollHeight: el.scrollHeight, clientHeight: el.clientHeight,
      isInteractive, isTextOnly, hasAccessibleName, hasSvgOrImgChild,
      role, ariaLabel, ariaLabelledBy, title
    });

    // Visual Container Containment
    const visualContainer = getClosestVisualContainer(el);
    if (visualContainer && visualContainer.element !== el) {
      const isExempt = checkExemption(el, comp, visualContainer.comp);
      const inner = visualContainer.innerBox;
      const overRight = Math.max(0, rect.right - inner.right);
      const overLeft = Math.max(0, inner.left - rect.left);
      const overBottom = Math.max(0, rect.bottom - inner.bottom);
      const overTop = Math.max(0, inner.top - rect.top);

      if ((overRight > 1.5 || overLeft > 1.5 || overBottom > 2) && !isExempt) {
        if (!ancestors.some(anc => reportedOverflowParentSelectors.has(anc))) {
          reportedOverflowParentSelectors.add(selector);
          containerOverflows.push({
            childSelector: selector, childTagName: tag, childId: el.id || '',
            childClassName: typeof el.className === 'string' ? el.className : '',
            childRect: toRect(rect), childStyles: computedStylesObj, childRole: role,
            containerSelector: visualContainer.selector, containerTagName: visualContainer.tagName,
            containerRect: toRect(visualContainer.rect), containerInnerBox: inner,
            containerStyles: { overflowX: visualContainer.comp.overflowX, overflowY: visualContainer.comp.overflowY },
            overflowRightPx: round2(overRight), overflowBottomPx: round2(overBottom),
            overflowLeftPx: round2(overLeft), overflowTopPx: round2(overTop),
            isExempt
          });
        }
      }
    }

    // Text Flow Anomaly Inspection
    if (!['pre', 'code', 'kbd', 'samp', 'textarea', 'input', 'style', 'script'].includes(tag)) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let textNode: Node | null;
      while ((textNode = walker.nextNode())) {
        const val = textNode.nodeValue || '';
        if (!val.trim()) continue;
        const regex = /[a-zA-Z]{4,}/g;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(val)) !== null) {
          const word = match[0];
          try {
            const range = document.createRange();
            range.setStart(textNode, match.index);
            range.setEnd(textNode, match.index + word.length);
            const rects = range.getClientRects();
            if (rects.length > 1 && Math.abs(rects[rects.length - 1].top - rects[0].top) > 3) {
              textFlowAnomalies.push({
                selector, tagName: tag, textSnippet, anomalyType: 'mid-word-break', word,
                computedStyles: { wordBreak: comp.wordBreak, overflowWrap: comp.overflowWrap }
              });
              break;
            }
          } catch {}
        }
      }
    }

    const isHeadingTag = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag);
    const isLabelTag = tag === 'label' || (typeof el.className === 'string' && /badge|chip|pill|tag/.test(el.className));

    if ((isButton || isHeadingTag || isLabelTag) && textContent && textContent.length >= 5) {
      const words = textContent.split(/\s+/).filter(w => w.length > 0);
      if (words.length >= 2) {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        const measuredWords: Array<{ top: number; word: string }> = [];
        let tNode: Node | null = null;
        while ((tNode = walker.nextNode())) {
          const val = tNode.nodeValue || '';
          const nodeWords = val.trim().split(/\s+/).filter((w: string) => w.length > 0);
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
            } catch {}
          }
        }

        const lineGroups: Array<{ top: number; words: string[] }> = [];
        for (const item of measuredWords) {
          let grp = lineGroups.find(g => Math.abs(item.top - g.top) < 6);
          if (grp) {
            grp.words.push(item.word);
          } else {
            lineGroups.push({ top: item.top, words: [item.word] });
          }
        }

        const lines = lineGroups.map(g => g.words);
        if (lines.length > 1) {
          const lastLine = lines[lines.length - 1];
          const lastLineText = lastLine.join(' ');
          if (isButton && textContent.length < 40) {
            textFlowAnomalies.push({
              selector, tagName: tag, textSnippet, anomalyType: 'broken-multiline-button',
              lineCount: lines.length, orphanText: lastLineText, lastLineWordCount: lastLine.length,
              computedStyles: { whiteSpace: comp.whiteSpace, textWrap: (comp as any).textWrap }
            });
          } else if ((isHeadingTag || isLabelTag) && lastLine.length === 1 && lines[0].length >= 2) {
            textFlowAnomalies.push({
              selector, tagName: tag, textSnippet, anomalyType: 'orphan-wrap',
              lineCount: lines.length, orphanText: lastLineText, lastLineWordCount: 1,
              computedStyles: { textWrap: (comp as any).textWrap || 'normal', whiteSpace: comp.whiteSpace }
            });
          }
        }
      }
    }

    const parentEl = el.parentElement;
    if (parentEl) {
      const parentComp = window.getComputedStyle(parentEl);
      if (parentComp.display === 'flex' || parentComp.display === 'inline-flex') {
        const isRow = !parentComp.flexDirection || parentComp.flexDirection.startsWith('row');
        if (isRow && rect.width < 75 && el.scrollWidth > el.clientWidth + 3 && textContent.length > 8) {
          textFlowAnomalies.push({
            selector, tagName: tag, textSnippet, anomalyType: 'crushed-flex-column',
            elementWidth: rect.width, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth,
            computedStyles: { display: comp.display, flex: comp.flex }
          });
        }
      }
    }
  }

  // Multi-point raycast occlusion sampling on interactive elements
  const occlusions: InPageAuditData['occlusions'] = [];
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
            point: pt, topSelector: getCssSelector(topEl), topTagName: topEl.tagName.toLowerCase(),
            isTargetOrDescendant: topEl === targetDomEl || targetDomEl.contains(topEl) || topEl.contains(targetDomEl)
          });
        }
      }
    }

    if (raycastResults.some(res => !res.isTargetOrDescendant)) {
      occlusions.push({ selector: item.selector, tagName: item.tagName, boundingBox: item.rect, raycastResults });
    }
  }

  // Scan sticky / fixed element occlusions
  const stickyItems = collectedElements.filter(el => {
    const pos = el.computedStyles.position;
    return (pos === 'fixed' || pos === 'sticky') && el.rect.width > 20 && el.rect.height > 10;
  });

  const stickyOcclusions: InPageAuditData['stickyOcclusions'] = [];
  for (const sticky of stickyItems) {
    const sRect = sticky.rect;
    const sZ = parseInt(sticky.computedStyles.zIndex || '0', 10) || 0;

    for (const target of collectedElements) {
      if (target.selector === sticky.selector || target.ancestors?.includes(sticky.selector)) continue;
      const isHeading = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(target.tagName.toLowerCase());
      if (!target.isInteractive && !isHeading) continue;

      const tRect = target.rect;
      if ((parseInt(target.computedStyles.zIndex || '0', 10) || 0) > sZ) continue;

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
            stickySelector: sticky.selector, stickyTagName: sticky.tagName,
            positionType: sticky.computedStyles.position as 'fixed' | 'sticky',
            occludedSelector: target.selector, occludedTagName: target.tagName,
            isInteractive: target.isInteractive,
            overlapRect: toRect({
              x: interLeft, y: interTop, width: overlapWidth, height: overlapHeight,
              top: interTop, right: interRight, bottom: interBottom, left: interLeft
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

export function getInPageAuditFunctionString(): string {
  return `(${collectInPageAuditScript.toString()})`;
}
