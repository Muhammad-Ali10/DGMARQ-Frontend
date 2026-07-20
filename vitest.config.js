// QUALITY FIX (FQ3): test wiring. Vitest reads THIS file (not vite.config.js),
// so the path aliases + jsdom setup must be declared here too.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const r = (p) => path.resolve(__dirname, p);

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirror vite.config.js. Array form with specific aliases first and the bare
    // `@` last so `@components` etc. aren't swallowed by the `@` → src mapping.
    alias: [
      { find: '@features', replacement: r('./src/features') },
      { find: '@components', replacement: r('./src/components') },
      { find: '@pages', replacement: r('./src/pages') },
      { find: '@lib', replacement: r('./src/lib') },
      { find: '@utils', replacement: r('./src/utils') },
      { find: '@assets', replacement: r('./src/assets') },
      { find: '@hooks', replacement: r('./src/hooks') },
      { find: '@store', replacement: r('./src/store') },
      { find: '@services', replacement: r('./src/services') },
      { find: '@', replacement: r('./src') },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.js'],
    // Co-located tests live next to the code they cover (feature-first).
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    css: false,
    // The default forks pool intermittently fails to spawn workers on Windows
    // under load ("Timeout waiting for worker to respond"); threads is reliable.
    pool: 'threads',
  },
});
