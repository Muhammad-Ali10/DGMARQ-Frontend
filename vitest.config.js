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
    // Vitest's 5s default kills the FIRST async test in a file before its
    // assertion can settle: that test pays the module-graph import, the jsdom
    // environment and the react-query client on top of its own work, which on a
    // loaded machine measured over 6s. It surfaced as a component bug —
    // "expected aria-pressed=true, received false" — rather than as a timeout,
    // which is the expensive kind of flake to read. The ceiling is here and the
    // RTL waiter's is in test/setup.js, deliberately lower, so a genuine hang
    // fails as a waitFor timeout with a DOM dump instead of a bare test abort.
    testTimeout: 20_000,
  },
});
