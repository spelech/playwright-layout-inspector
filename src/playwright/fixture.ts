import { test as baseTest, expect as baseExpect } from '@playwright/test';
import { LayoutInspector } from './inspector';
import './matchers';

export interface LayoutInspectorFixtures {
  layoutInspector: LayoutInspector;
}

export const test = baseTest.extend<LayoutInspectorFixtures>({
  layoutInspector: async ({ page }, use) => {
    const inspector = new LayoutInspector(page);
    await use(inspector);
  }
});

export const expect = baseExpect;
