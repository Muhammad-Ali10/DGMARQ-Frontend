let sentry = null;
let enabled = false;

export async function initErrorReporting() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return false;
  try {
    const mod = await import('@sentry/react');
    mod.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0,
    });
    sentry = mod;
    enabled = true;
    return true;
  } catch {
    return false;
  }
}

export function captureError(error, context = {}) {
  if (enabled && sentry) {
    try {
      sentry.captureException(error, { extra: context });
      return;
    } catch {
      /* fall through to the console */
    }
  }
  console.error('[captureError]', error, context);
}

