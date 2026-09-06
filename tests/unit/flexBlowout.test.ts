import { describe, it, expect } from 'vitest';
import { evaluateFlexBlowout } from '../../src/core/flexBlowout';
import { InPageAuditData } from '../../src/core/browserScript';

describe('Flexbox & Grid Blowout Engine', () => {
  it('evaluates mock container overflow with flex container and unconstrained child -> produces critical or serious flex blowout issue', () => {
    const mockContainerOverflows: InPageAuditData['containerOverflows'] = [
      {
        childSelector: '#unconstrained-child',
        childTagName: 'div',
        childId: 'unconstrained-child',
        childClassName: 'flex-item',
        childRect: {
          x: 20,
          y: 20,
          width: 350,
          height: 40,
          top: 20,
          right: 370,
          bottom: 60,
          left: 20
        },
        childStyles: {
          display: 'block',
          minWidth: 'auto',
          flexShrink: '0'
        },
        containerSelector: '#flex-container',
        containerTagName: 'div',
        containerRect: {
          x: 20,
          y: 20,
          width: 250,
          height: 40,
          top: 20,
          right: 270,
          bottom: 60,
          left: 20
        },
        containerInnerBox: {
          top: 20,
          right: 270,
          bottom: 60,
          left: 20,
          width: 250,
          height: 40
        },
        containerStyles: {
          display: 'flex',
          overflowX: 'visible',
          overflowY: 'visible'
        },
        overflowRightPx: 100,
        overflowBottomPx: 0,
        overflowLeftPx: 0,
        overflowTopPx: 0,
        isExempt: false
      }
    ];

    const mockElements: InPageAuditData['elements'] = [
      {
        selector: '#flex-container',
        tagName: 'div',
        id: 'flex-container',
        className: '',
        textSnippet: '',
        rect: {
          x: 20,
          y: 20,
          width: 250,
          height: 40,
          top: 20,
          right: 270,
          bottom: 60,
          left: 20
        },
        computedStyles: {
          overflow: 'visible',
          overflowX: 'visible',
          overflowY: 'visible',
          width: '250px',
          minWidth: '0px',
          maxWidth: 'none',
          height: '40px',
          minHeight: '0px',
          maxHeight: 'none',
          transform: 'none',
          display: 'flex',
          position: 'static',
          boxSizing: 'border-box',
          margin: '0px',
          padding: '0px',
          fontSize: '16px',
          lineHeight: '20px'
        },
        scrollWidth: 250,
        clientWidth: 250,
        scrollHeight: 40,
        clientHeight: 40,
        isInteractive: false,
        isTextOnly: false,
        hasAccessibleName: false,
        hasSvgOrImgChild: false
      },
      {
        selector: '#unconstrained-child',
        tagName: 'div',
        id: 'unconstrained-child',
        className: 'flex-item',
        textSnippet: 'Unconstrained wide content',
        rect: {
          x: 20,
          y: 20,
          width: 350,
          height: 40,
          top: 20,
          right: 370,
          bottom: 60,
          left: 20
        },
        computedStyles: {
          overflow: 'visible',
          overflowX: 'visible',
          overflowY: 'visible',
          width: '350px',
          minWidth: 'auto',
          maxWidth: 'none',
          height: '40px',
          minHeight: '0px',
          maxHeight: 'none',
          transform: 'none',
          display: 'block',
          position: 'static',
          boxSizing: 'border-box',
          margin: '0px',
          padding: '0px',
          flexShrink: '0',
          fontSize: '16px',
          lineHeight: '20px'
        },
        scrollWidth: 350,
        clientWidth: 350,
        scrollHeight: 40,
        clientHeight: 40,
        isInteractive: false,
        isTextOnly: true,
        hasAccessibleName: false,
        hasSvgOrImgChild: false,
        ancestors: ['#flex-container']
      }
    ];

    const issues = evaluateFlexBlowout(mockContainerOverflows, mockElements);

    expect(issues.length).toBe(1);
    const issue = issues[0];
    expect(issue.selector).toBe('#unconstrained-child');
    expect(issue.parentSelector).toBe('#flex-container');
    expect(issue.layoutType).toBe('flex');
    expect(issue.overflowPx).toBe(100);
    expect(issue.severity).toBe('critical'); // overflowPx > 20
    expect(issue.suggestion).toContain('min-width: 0 and overflow: hidden; text-overflow: ellipsis');
  });

  it('evaluates clean flex container with min-width: 0 -> produces 0 issues', () => {
    const mockElements: InPageAuditData['elements'] = [
      {
        selector: '#flex-parent',
        tagName: 'div',
        id: 'flex-parent',
        className: '',
        textSnippet: '',
        rect: {
          x: 0,
          y: 0,
          width: 250,
          height: 40,
          top: 0,
          right: 250,
          bottom: 40,
          left: 0
        },
        computedStyles: {
          overflow: 'hidden',
          overflowX: 'hidden',
          overflowY: 'hidden',
          width: '250px',
          minWidth: '0px',
          maxWidth: 'none',
          height: '40px',
          minHeight: '0px',
          maxHeight: 'none',
          transform: 'none',
          display: 'flex',
          position: 'static',
          boxSizing: 'border-box',
          margin: '0px',
          padding: '0px',
          fontSize: '16px',
          lineHeight: '20px'
        },
        scrollWidth: 250,
        clientWidth: 250,
        scrollHeight: 40,
        clientHeight: 40,
        isInteractive: false,
        isTextOnly: false,
        hasAccessibleName: false,
        hasSvgOrImgChild: false
      },
      {
        selector: '#constrained-child',
        tagName: 'div',
        id: 'constrained-child',
        className: '',
        textSnippet: 'Clean truncated text',
        rect: {
          x: 0,
          y: 0,
          width: 250,
          height: 40,
          top: 0,
          right: 250,
          bottom: 40,
          left: 0
        },
        computedStyles: {
          overflow: 'hidden',
          overflowX: 'hidden',
          overflowY: 'hidden',
          width: '250px',
          minWidth: '0px',
          maxWidth: 'none',
          height: '40px',
          minHeight: '0px',
          maxHeight: 'none',
          transform: 'none',
          display: 'block',
          position: 'static',
          boxSizing: 'border-box',
          margin: '0px',
          padding: '0px',
          flexShrink: '1',
          fontSize: '16px',
          lineHeight: '20px'
        },
        scrollWidth: 250,
        clientWidth: 250,
        scrollHeight: 40,
        clientHeight: 40,
        isInteractive: false,
        isTextOnly: true,
        hasAccessibleName: false,
        hasSvgOrImgChild: false,
        ancestors: ['#flex-parent']
      }
    ];

    const issues = evaluateFlexBlowout([], mockElements);
    expect(issues).toHaveLength(0);
  });

  it('detects grid layout blowout with unconstrained child', () => {
    const mockElements: InPageAuditData['elements'] = [
      {
        selector: '#grid-parent',
        tagName: 'div',
        id: 'grid-parent',
        className: '',
        textSnippet: '',
        rect: {
          x: 0,
          y: 0,
          width: 300,
          height: 100,
          top: 0,
          right: 300,
          bottom: 100,
          left: 0
        },
        computedStyles: {
          overflow: 'visible',
          overflowX: 'visible',
          overflowY: 'visible',
          width: '300px',
          minWidth: '0px',
          maxWidth: 'none',
          height: '100px',
          minHeight: '0px',
          maxHeight: 'none',
          transform: 'none',
          display: 'grid',
          position: 'static',
          boxSizing: 'border-box',
          margin: '0px',
          padding: '0px',
          fontSize: '16px',
          lineHeight: '20px'
        },
        scrollWidth: 300,
        clientWidth: 300,
        scrollHeight: 100,
        clientHeight: 100,
        isInteractive: false,
        isTextOnly: false,
        hasAccessibleName: false,
        hasSvgOrImgChild: false
      },
      {
        selector: '#grid-child',
        tagName: 'div',
        id: 'grid-child',
        className: '',
        textSnippet: 'Long unwrapped grid content exceeding boundary',
        rect: {
          x: 0,
          y: 0,
          width: 315,
          height: 40,
          top: 0,
          right: 315,
          bottom: 40,
          left: 0
        },
        computedStyles: {
          overflow: 'visible',
          overflowX: 'visible',
          overflowY: 'visible',
          width: '315px',
          minWidth: 'auto',
          maxWidth: 'none',
          height: '40px',
          minHeight: '0px',
          maxHeight: 'none',
          transform: 'none',
          display: 'block',
          position: 'static',
          boxSizing: 'border-box',
          margin: '0px',
          padding: '0px',
          fontSize: '16px',
          lineHeight: '20px'
        },
        scrollWidth: 315,
        clientWidth: 300,
        scrollHeight: 40,
        clientHeight: 40,
        isInteractive: false,
        isTextOnly: true,
        hasAccessibleName: false,
        hasSvgOrImgChild: false,
        ancestors: ['#grid-parent']
      }
    ];

    const issues = evaluateFlexBlowout([], mockElements);
    expect(issues.length).toBe(1);
    expect(issues[0].layoutType).toBe('grid');
    expect(issues[0].parentSelector).toBe('#grid-parent');
    expect(issues[0].severity).toBe('serious'); // 15px overflow and not interactive -> serious
  });

  it('marks interactive child blowing out as critical even when overflow <= 20px', () => {
    const mockElements: InPageAuditData['elements'] = [
      {
        selector: '#flex-parent',
        tagName: 'div',
        id: 'flex-parent',
        className: '',
        textSnippet: '',
        rect: { x: 0, y: 0, width: 200, height: 50, top: 0, right: 200, bottom: 50, left: 0 },
        computedStyles: {
          overflow: 'visible',
          overflowX: 'visible',
          overflowY: 'visible',
          width: '200px',
          minWidth: '0px',
          maxWidth: 'none',
          height: '50px',
          minHeight: '0px',
          maxHeight: 'none',
          transform: 'none',
          display: 'flex',
          position: 'static',
          boxSizing: 'border-box',
          margin: '0px',
          padding: '0px',
          fontSize: '16px',
          lineHeight: '20px'
        },
        scrollWidth: 200,
        clientWidth: 200,
        scrollHeight: 50,
        clientHeight: 50,
        isInteractive: false,
        isTextOnly: false,
        hasAccessibleName: false,
        hasSvgOrImgChild: false
      },
      {
        selector: '#interactive-btn',
        tagName: 'button',
        id: 'interactive-btn',
        className: 'btn',
        textSnippet: 'Click Me Action',
        rect: { x: 0, y: 0, width: 210, height: 40, top: 0, right: 210, bottom: 40, left: 0 },
        computedStyles: {
          overflow: 'visible',
          overflowX: 'visible',
          overflowY: 'visible',
          width: '210px',
          minWidth: 'auto',
          maxWidth: 'none',
          height: '40px',
          minHeight: '0px',
          maxHeight: 'none',
          transform: 'none',
          display: 'inline-block',
          position: 'static',
          boxSizing: 'border-box',
          margin: '0px',
          padding: '0px',
          fontSize: '16px',
          lineHeight: '20px'
        },
        scrollWidth: 210,
        clientWidth: 200,
        scrollHeight: 40,
        clientHeight: 40,
        isInteractive: true,
        isTextOnly: false,
        hasAccessibleName: true,
        hasSvgOrImgChild: false,
        ancestors: ['#flex-parent']
      }
    ];

    const issues = evaluateFlexBlowout([], mockElements);
    expect(issues.length).toBe(1);
    expect(issues[0].severity).toBe('critical'); // interactive element -> critical
  });
});
