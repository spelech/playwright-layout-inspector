/**
 * Text flow and wrap anomaly DOM inspection (mid-word breaks, orphan wraps, broken buttons, crushed flex columns).
 */
export interface TextFlowAnomalyData {
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
}

export function inspectTextFlowAnomalies(
  el: Element,
  tag: string,
  selector: string,
  comp: CSSStyleDeclaration,
  rect: DOMRect,
  textContent: string,
  textSnippet: string,
  isButton: boolean
): TextFlowAnomalyData[] {
  const anomalies: TextFlowAnomalyData[] = [];

  // 1. Mid-word break check:
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
        const startIndex = match.index;
        const endIndex = startIndex + word.length;

        try {
          const range = document.createRange();
          range.setStart(textNode, startIndex);
          range.setEnd(textNode, endIndex);
          const rects = range.getClientRects();
          if (rects.length > 1) {
            const firstTop = rects[0].top;
            const lastTop = rects[rects.length - 1].top;
            if (Math.abs(lastTop - firstTop) > 3) {
              anomalies.push({
                selector,
                tagName: tag,
                textSnippet,
                anomalyType: 'mid-word-break',
                word,
                computedStyles: {
                  wordBreak: comp.wordBreak,
                  overflowWrap: comp.overflowWrap
                }
              });
              break;
            }
          }
        } catch {
          // Ignore Range error
        }
      }
    }
  }

  // 2. Multi-line button / Orphan wrap check:
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
            if (rRect.width > 0 && rRect.height > 0) {
              measuredWords.push({ top: rRect.top, word: w });
            }
          } catch {
            // Ignore Range error
          }
        }
      }

      const lineGroups: Array<{ top: number; words: string[] }> = [];
      for (const item of measuredWords) {
        let placed = false;
        for (const group of lineGroups) {
          if (Math.abs(item.top - group.top) < 6) {
            group.words.push(item.word);
            placed = true;
            break;
          }
        }
        if (!placed) {
          lineGroups.push({ top: item.top, words: [item.word] });
        }
      }

      const lines = lineGroups.map(g => g.words);
      if (lines.length > 1) {
        const lastLine = lines[lines.length - 1];
        const lastLineText = lastLine.join(' ');

        if (isButton && textContent.length < 40) {
          anomalies.push({
            selector,
            tagName: tag,
            textSnippet,
            anomalyType: 'broken-multiline-button',
            lineCount: lines.length,
            orphanText: lastLineText,
            lastLineWordCount: lastLine.length,
            computedStyles: {
              whiteSpace: comp.whiteSpace,
              textWrap: (comp as any).textWrap
            }
          });
        } else if ((isHeadingTag || isLabelTag) && lastLine.length === 1 && lines[0].length >= 2) {
          anomalies.push({
            selector,
            tagName: tag,
            textSnippet,
            anomalyType: 'orphan-wrap',
            lineCount: lines.length,
            orphanText: lastLineText,
            lastLineWordCount: 1,
            computedStyles: {
              textWrap: (comp as any).textWrap || 'normal',
              whiteSpace: comp.whiteSpace
            }
          });
        }
      }
    }
  }

  // 3. Crushed Flex Column check:
  const parentEl = el.parentElement;
  if (parentEl) {
    const parentComp = window.getComputedStyle(parentEl);
    if (parentComp.display === 'flex' || parentComp.display === 'inline-flex') {
      const isRow = !parentComp.flexDirection || parentComp.flexDirection.startsWith('row');
      if (isRow && rect.width < 75 && el.scrollWidth > el.clientWidth + 3 && textContent.length > 8) {
        anomalies.push({
          selector,
          tagName: tag,
          textSnippet,
          anomalyType: 'crushed-flex-column',
          elementWidth: rect.width,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          computedStyles: {
            display: comp.display,
            flex: comp.flex
          }
        });
      }
    }
  }

  return anomalies;
}
