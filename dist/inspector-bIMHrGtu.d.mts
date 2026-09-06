import { Page } from '@playwright/test';
import { L as LayoutAuditOptions, a as LayoutAuditResult, M as MatrixAuditOptions, R as ResponsiveMatrixAuditResult, Z as ZoomReflowResult, b as LayoutShiftResult } from './matchers-DyhFYEMO.mjs';

declare class LayoutInspector {
    private page;
    private defaultOptions;
    constructor(page: Page, defaultOptions?: LayoutAuditOptions);
    /**
     * Run a comprehensive UX & layout audit on the current page state.
     */
    audit(options?: LayoutAuditOptions): Promise<LayoutAuditResult>;
    /**
     * Run multi-device responsive matrix audit across mobile, tablet, and desktop viewports.
     */
    auditMatrix(options?: MatrixAuditOptions): Promise<ResponsiveMatrixAuditResult>;
    /**
     * Test WCAG 1.4.10 Reflow at 200% zoom.
     */
    test200PercentZoomReflow(zoomFactor?: number): Promise<ZoomReflowResult>;
    /**
     * Track layout shift and element displacement occurring during an asynchronous action.
     */
    trackShifts(action: () => Promise<void>, options?: {
        maxAcceptableScore?: number;
        maxAcceptableDisplacement?: number;
    }): Promise<LayoutShiftResult>;
    /**
     * Generate and write an interactive HTML report to disk.
     */
    generateReport(result: LayoutAuditResult, outputPath: string): Promise<string>;
}

export { LayoutInspector as L };
