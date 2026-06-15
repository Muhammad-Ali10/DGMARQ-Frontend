// QUALITY FIX (FQ3): first test wiring — the testing stack (vitest, jsdom,
// testing-library) was installed but never configured or used.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.{test,spec}.{js,jsx}', 'tests/**/*.{test,spec}.{js,jsx}'],
  },
});
