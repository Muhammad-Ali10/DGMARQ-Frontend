// Vitest global setup — runs before each test file.
// With `globals: false`, jest-dom's auto-extend can't find a global `expect`,
// so we extend Vitest's expect explicitly.
import { expect, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup, configure } from '@testing-library/react';

expect.extend(matchers);

// Tests that wait on a react-query round trip (fetch → cache → re-render) do
// not reliably settle inside RTL's 1s default on a loaded machine, and the
// failure reads as a wrong value rather than as "not yet". Kept comfortably
// BELOW vitest's testTimeout (vitest.config.js) so a real hang still fails as a
// waitFor timeout — which prints the DOM — rather than as a bare test abort.
configure({ asyncUtilTimeout: 10_000 });

// jsdom has no ResizeObserver, and Radix measures its floating parts (tooltip
// arrow, popper, select) with one — so rendering any of them throws a
// ReferenceError that looks nothing like the real cause. A no-op is enough:
// layout is not what these tests assert.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Unmount React trees between tests.
afterEach(() => {
  cleanup();
});
