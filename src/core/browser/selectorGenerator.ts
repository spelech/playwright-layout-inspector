/**
 * Canonical CSS selector generation for DOM elements.
 */
export function getCssSelector(el: Element): string {
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
        if (firstClass && !firstClass.includes(':') && !firstClass.includes('/') && !firstClass.includes('[')) {
          selector += `.${CSS.escape(firstClass)}`;
        }
      }
      if (nth > 1) {
        selector += `:nth-of-type(${nth})`;
      }
    }
    path.unshift(selector);
    current = current.parentElement;
    if (path.length > 5) break;
  }
  return path.join(' > ');
}
