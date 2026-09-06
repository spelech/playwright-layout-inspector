import type { Page } from '@playwright/test';

export async function captureAndAnnotateScreenshot(
  page: Page,
  options: { includeScreenshot?: boolean; highlightIssuesInScreenshot?: boolean } = {}
): Promise<{ screenshotBase64?: string; annotatedScreenshotBase64?: string }> {
  if (!options.includeScreenshot) {
    return {};
  }

  try {
    const buffer = await page.screenshot({ fullPage: false });
    const screenshotBase64 = buffer.toString('base64');
    return { screenshotBase64 };
  } catch {
    return {};
  }
}
