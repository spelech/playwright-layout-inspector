import { describe, it, expect } from 'vitest';
import {
  calculateContainerOverflow,
  isExemptFromContainerOverflow,
  generateContainerOverflowRemediation,
  evaluateContainerOverflow
} from '../../src/core/containerOverflow';
import { BoundingBox, ContainerInnerBox, ElementComputedStyles } from '../../src/types';

describe('Container Geometric Containment Engine', () => {
  const containerInnerBox: ContainerInnerBox = {
    top: 50,
    right: 600,
    bottom: 450,
    left: 50,
    width: 550,
    height: 400
  };

  it('detects 3-column auth inputs bleeding outside a 550px modal container', () => {
    // 3-column inputs: total width 620px starting at x=60 inside container (left=50) -> right edge = 680px
    const childRect: BoundingBox = {
      x: 60,
      y: 120,
      width: 620,
      height: 44,
      top: 120,
      right: 680,
      bottom: 164,
      left: 60
    };

    const overflow = calculateContainerOverflow(childRect, containerInnerBox);
    expect(overflow.hasOverflow).toBe(true);
    expect(overflow.overflowRightPx).toBe(80); // 680 - 600 = 80px
    expect(overflow.overflowLeftPx).toBe(0);
    expect(overflow.overflowBottomPx).toBe(0);
  });

  it('passes child elements perfectly fitting within container content box', () => {
    const childRect: BoundingBox = {
      x: 70,
      y: 70,
      width: 500,
      height: 300,
      top: 70,
      right: 570,
      bottom: 370,
      left: 70
    };

    const overflow = calculateContainerOverflow(childRect, containerInnerBox);
    expect(overflow.hasOverflow).toBe(false);
    expect(overflow.overflowRightPx).toBe(0);
    expect(overflow.overflowBottomPx).toBe(0);
  });

  it('exempts floating tooltips, popovers, and dropdown menus', () => {
    expect(
      isExemptFromContainerOverflow({
        tagName: 'div',
        role: 'tooltip',
        position: 'absolute'
      })
    ).toBe(true);

    expect(
      isExemptFromContainerOverflow({
        tagName: 'div',
        className: 'dropdown-menu show',
        position: 'absolute'
      })
    ).toBe(true);

    expect(
      isExemptFromContainerOverflow({
        tagName: 'div',
        isPopoverOrTooltip: true
      })
    ).toBe(true);

    expect(
      isExemptFromContainerOverflow({
        tagName: 'div',
        position: 'fixed'
      })
    ).toBe(true);
  });

  it('exempts intentional corner controls such as close buttons and corner badges', () => {
    expect(
      isExemptFromContainerOverflow({
        tagName: 'button',
        className: 'btn-close modal-close',
        position: 'absolute'
      })
    ).toBe(true);

    expect(
      isExemptFromContainerOverflow({
        tagName: 'span',
        className: 'notification-badge pill',
        position: 'absolute'
      })
    ).toBe(true);
  });

  it('exempts elements inside explicitly scrollable containers', () => {
    expect(
      isExemptFromContainerOverflow({
        tagName: 'table',
        containerStyles: {
          overflowX: 'auto',
          overflowY: 'auto'
        }
      })
    ).toBe(true);
  });

  it('generates clear culprit description and actionable flex-wrap remediation', () => {
    const childRect: BoundingBox = {
      x: 60,
      y: 100,
      width: 632,
      height: 48,
      top: 100,
      right: 692,
      bottom: 148,
      left: 60
    };

    const childStyles: ElementComputedStyles = {
      overflow: 'visible',
      overflowX: 'visible',
      overflowY: 'visible',
      width: '632px',
      minWidth: '0px',
      maxWidth: 'none',
      height: '48px',
      minHeight: '0px',
      maxHeight: 'none',
      transform: 'none',
      display: 'flex',
      flexWrap: 'nowrap',
      position: 'relative',
      boxSizing: 'border-box',
      margin: '0px',
      padding: '0px'
    };

    const remediation = generateContainerOverflowRemediation({
      childTagName: 'div',
      childSelector: '.auth-inputs-row',
      childRect,
      childStyles,
      containerTagName: 'div',
      containerSelector: '.modal-card',
      containerInnerBox,
      overflowRightPx: 92,
      overflowBottomPx: 0,
      overflowLeftPx: 0
    });

    expect(remediation.culpritDescription).toContain('.auth-inputs-row');
    expect(remediation.culpritDescription).toContain('.modal-card');
    expect(remediation.culpritDescription).toContain('92px on the right');
    expect(remediation.culpritDescription).toContain('flex-wrap: nowrap');
    expect(remediation.suggestedFix).toContain('flex-wrap: wrap');
  });

  it('evaluates container overflow end-to-end and assigns severity', () => {
    const childRect: BoundingBox = {
      x: 60,
      y: 100,
      width: 632,
      height: 48,
      top: 100,
      right: 692,
      bottom: 148,
      left: 60
    };

    const styles: ElementComputedStyles = {
      overflow: 'visible',
      overflowX: 'visible',
      overflowY: 'visible',
      width: '632px',
      minWidth: '0px',
      maxWidth: 'none',
      height: '48px',
      minHeight: '0px',
      maxHeight: 'none',
      transform: 'none',
      display: 'flex',
      position: 'relative',
      boxSizing: 'border-box',
      margin: '0px',
      padding: '0px'
    };

    const issue = evaluateContainerOverflow({
      child: {
        selector: '.auth-inputs-row',
        tagName: 'div',
        id: 'auth-row',
        className: 'auth-inputs-row',
        rect: childRect,
        computedStyles: styles
      },
      container: {
        selector: '.modal-card',
        tagName: 'div',
        rect: { x: 50, y: 50, width: 550, height: 400, top: 50, right: 600, bottom: 450, left: 50 },
        innerBox: containerInnerBox
      }
    });

    expect(issue).not.toBeNull();
    expect(issue?.selector).toBe('.auth-inputs-row');
    expect(issue?.containerSelector).toBe('.modal-card');
    expect(issue?.overflowRightPx).toBe(92);
    expect(issue?.severity).toBe('critical');
  });
});
