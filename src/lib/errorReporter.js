/**
 * AUDIT FIX (REL-3): frontend error-reporting seam.
 *
 * Mirrors backend/src/utils/errorReporter.js. Inert unless VITE_SENTRY_DSN is
 * set at build time, so no account is required for the app to run and nothing
 * is transmitted in dev or in CI.
 *
 * Everything else in the app calls captureError() and never imports Sentry
 * directly, so swapping providers touches only this file.
 */

let sentry = null;
let enabled = false;

/** Call once from main.jsx before rendering. */
export async function initErrorReporting() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return false;
  try {
    const mod = await import('@sentry/react');
    mod.init({
      dsn,
      environment: import.meta.env.MODE,
      // Errors only — no tracing/session-replay unless explicitly turned on.
      tracesSampleRate: 0,
    });
    sentry = mod;
    enabled = true;
    return true;
  } catch {
    // Telemetry must never prevent the app from booting.
    return false;
  }
}

/** Report an exception. Falls back to console.error when not configured. */
export function captureError(error, context = {}) {
  if (enabled && sentry) {
    try {
      sentry.captureException(error, { extra: context });
      return;
    } catch {
      /* fall through to the console */
    }
  }
  // Deliberately NOT gated on import.meta.env.DEV — a production crash with no
  // DSN configured should still leave something in the user's console for a
  // support request, which is what the old DEV-gated branch failed to do.
  console.error('[captureError]', error, context);
}

