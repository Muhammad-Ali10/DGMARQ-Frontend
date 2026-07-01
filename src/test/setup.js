// Vitest global setup — runs before each test file.
// With `globals: false`, jest-dom's auto-extend can't find a global `expect`,
// so we extend Vitest's expect explicitly.
import { expect, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';

expect.extend(matchers);

// Unmount React trees between tests.
afterEach(() => {
  cleanup();
});
