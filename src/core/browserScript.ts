export interface InPageAuditData {
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
    };
    scrollWidth: number;
    clientWidth: number;
    scrollHeight: number;
    clientHeight: number;
    isInteractive: boolean;
  }>;
  occlusions: Array<{
    selector: string;
    occludedBySelector: string;
    occludedAreaRatio: number;
    isInteractive: boolean;
  }>;
}

export function collectInPageAuditScript(optionsJson = '{}'): InPageAuditData {
  const options = JSON.parse(optionsJson || '{}');
  const ignoreSelectors: string[] = options.ignoreSelectors || [];

  // Helper to generate a concise, unique CSS selector
  function getCssSelector(el: Element): string {
    if (el.id) {
      return `#${CSS.escape(el.id)}`;
    }
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
          if (firstClass && !firstClass.includes(':') && !firstClass.includes('/')) {
            selector += `.${CSS.escape(firstClass)}`;
          }
        }
        if (nth > 1) {
          selector += `:nth-of-type(${nth})`;
        }
      }
      path.unshift(selector);
      current = current.parentElement;
      if (path.length > 5) break; // keep selector readable
    }
    return path.join(' > ');
  }

  const metaEl = document.querySelector('meta[name="viewport"]');
  const metaViewport = metaEl ? metaEl.getAttribute('content') : null;

  const vp = {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    metaViewport
  };

  const allElements = Array.from(document.querySelectorAll('body *'));
  const collectedElements: InPageAuditData['elements'] = [];

  for (const el of allElements) {
    // Skip scripts, styles, svgs internals, noscript
    const tag = el.tagName.toLowerCase();
    if (['script', 'style', 'noscript', 'path', 'g', 'defs', 'clippath', 'symbol', 'use'].includes(tag)) {
      continue;
    }

    const selector = getCssSelector(el);
    if (ignoreSelectors.some(ign => selector.includes(ign))) {
      continue;
    }

    const rect = el.getBoundingClientRect();
    // Skip elements that take up no space and are hidden
    if (rect.width <= 0 && rect.height <= 0) {
      continue;
    }

    const comp = window.getComputedStyle(el);
    if (comp.display === 'none' || comp.visibility === 'hidden' || parseFloat(comp.opacity) === 0) {
      continue;
    }

    const isButton = tag === 'button' || el.getAttribute('role') === 'button';
    const isLink = tag === 'a' && el.hasAttribute('href');
    const isInput = ['input', 'select', 'textarea'].includes(tag);
    const hasCursorPointer = comp.cursor === 'pointer';
    const hasTouchHandler = el.hasAttribute('onclick') || (el as any).ontouchstart !== undefined;
    const isInteractive = isButton || isLink || isInput || hasCursorPointer || hasTouchHandler;

    const textContent = (el.textContent || '').trim().replace(/\s+/g, ' ');
    const textSnippet = textContent.length > 60 ? textContent.substring(0, 57) + '...' : textContent;

    collectedElements.push({
      selector,
      tagName: tag,
      id: el.id || '',
      className: typeof el.className === 'string' ? el.className : '',
      textSnippet,
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
        lineHeight: comp.lineHeight
      },
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      isInteractive
    });
  }

  // Probe occlusions on interactive elements
  const occlusions: InPageAuditData['occlusions'] = [];
  for (const item of collectedElements) {
    if (!item.isInteractive) continue;
    const centerX = item.rect.x + item.rect.width / 2;
    const centerY = item.rect.y + item.rect.height / 2;

    if (centerX >= 0 && centerX <= vp.width && centerY >= 0 && centerY <= vp.height) {
      const topEl = document.elementFromPoint(centerX, centerY);
      if (topEl) {
        const topSelector = getCssSelector(topEl);
        if (topSelector !== item.selector && !topEl.contains(document.querySelector(item.selector)) && !document.querySelector(item.selector)?.contains(topEl)) {
          occlusions.push({
            selector: item.selector,
            occludedBySelector: topSelector,
            occludedAreaRatio: 0.5,
            isInteractive: true
          });
        }
      }
    }
  }

  return {
    viewport: vp,
    elements: collectedElements,
    occlusions
  };
}

export function getInPageAuditFunctionString(): string {
  return `(${collectInPageAuditScript.toString()})`;
}
