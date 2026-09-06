import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    matchers: 'src/playwright/matchers.ts',
    fixture: 'src/playwright/fixture.ts',
    cli: 'src/cli/cli.ts'
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  minify: false,
  splitting: false,
  target: 'es2022',
  external: ['@playwright/test', 'playwright']
});
