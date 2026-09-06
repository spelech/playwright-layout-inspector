import type { Page } from '@playwright/test';
import { DevicePreset, LayoutAuditResult, MatrixAuditOptions, ResponsiveMatrixAuditResult } from '../types';
import { getDevicePreset, DEVICE_PRESETS } from '../core/devices';
import type { LayoutInspector } from './inspector';

const DEFAULT_MATRIX_PRESETS = [
  'Samsung Galaxy S25+',
  'iPad Air',
  'Desktop 1080p'
];

export async function runResponsiveMatrixAudit(
  page: Page,
  inspector: LayoutInspector,
  options: MatrixAuditOptions = {}
): Promise<ResponsiveMatrixAuditResult> {
  const deviceNames = options.devices && options.devices.length > 0
    ? options.devices
    : DEFAULT_MATRIX_PRESETS;

  const devices: (DevicePreset | { name: string; width: number; height: number })[] = deviceNames.map(d => {
    if (typeof d === 'string') {
      return getDevicePreset(d) || { name: d, width: 1280, height: 720 };
    }
    return d;
  });

  const originalViewport = page.viewportSize();
  const results: Record<string, LayoutAuditResult> = {};
  const deviceScores: Record<string, number> = {};

  try {
    for (const dev of devices) {
      await page.setViewportSize({ width: dev.width, height: dev.height });
      // Allow CSS media queries and flex re-layouts to settle
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

  // Correlate issues across breakpoints
  const issueDeviceMap = new Map<string, { category: string; selector: string; description: string; devices: Set<string> }>();

  for (const [deviceName, res] of Object.entries(results)) {
    // 1. Viewport overflow
    for (const ov of res.overflowIssues) {
      const key = `overflow:${ov.selector}`;
      if (!issueDeviceMap.has(key)) {
        issueDeviceMap.set(key, { category: 'Viewport Overflow', selector: ov.selector, description: ov.culpritDescription, devices: new Set() });
      }
      issueDeviceMap.get(key)!.devices.add(deviceName);
    }
    // 2. Container overflow
    for (const co of res.containerOverflowIssues) {
      const key = `containerOverflow:${co.selector}`;
      if (!issueDeviceMap.has(key)) {
        issueDeviceMap.set(key, { category: 'Container Overflow', selector: co.selector, description: co.culpritDescription, devices: new Set() });
      }
      issueDeviceMap.get(key)!.devices.add(deviceName);
    }
    // 3. Flex blowout
    for (const fb of res.flexBlowoutIssues || []) {
      const key = `flexBlowout:${fb.selector}`;
      if (!issueDeviceMap.has(key)) {
        issueDeviceMap.set(key, { category: 'Flex Blowout', selector: fb.selector, description: fb.suggestion, devices: new Set() });
      }
      issueDeviceMap.get(key)!.devices.add(deviceName);
    }
    // 4. Sticky occlusion
    for (const so of res.stickyOcclusionIssues || []) {
      const key = `stickyOcclusion:${so.occludedSelector}`;
      if (!issueDeviceMap.has(key)) {
        issueDeviceMap.set(key, { category: 'Sticky Occlusion', selector: so.occludedSelector, description: so.suggestion, devices: new Set() });
      }
      issueDeviceMap.get(key)!.devices.add(deviceName);
    }
    // 5. Touch targets
    for (const tt of res.touchTargetIssues) {
      const key = `touchTarget:${tt.selector}`;
      if (!issueDeviceMap.has(key)) {
        issueDeviceMap.set(key, { category: 'Touch Target', selector: tt.selector, description: tt.suggestion, devices: new Set() });
      }
      issueDeviceMap.get(key)!.devices.add(deviceName);
    }
    // 6. Color contrast
    for (const cc of res.contrastIssues) {
      const key = `contrast:${cc.selector}`;
      if (!issueDeviceMap.has(key)) {
        issueDeviceMap.set(key, { category: 'Contrast', selector: cc.selector, description: cc.suggestion, devices: new Set() });
      }
      issueDeviceMap.get(key)!.devices.add(deviceName);
    }
  }

  const globalIssues: Array<{ category: string; selector: string; description: string; count: number }> = [];
  const breakpointSpecificIssues: Array<{ device: string; category: string; selector: string; description: string }> = [];

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
  const overallScore = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : 100;

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
