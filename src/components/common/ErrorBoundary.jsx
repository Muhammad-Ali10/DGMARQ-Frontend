import { Component } from 'react';

const CHUNK_RELOAD_KEY = 'eb_chunk_reloaded';

function isChunkLoadError(error) {
  const msg = (error && (error.message || String(error))) || '';
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('Importing a module script failed')
  );
}

// Attempt a one-time reload when a stale/missing chunk fails to load (typically
// after a new deploy). Guarded by sessionStorage so it never loops.
export function maybeReloadOnChunkError(error) {
  if (!isChunkLoadError(error)) return false;
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return false;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
  } catch {
    // sessionStorage unavailable — fall back to a single reload attempt anyway.
  }
  window.location.reload();
  return true;
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Stale-chunk recovery: reload once instead of showing the fallback.
    if (maybeReloadOnChunkError(error)) return;

    // FIX (FQ2): `process` doesn't exist in a Vite browser bundle — use
    // import.meta.env.DEV, which Vite statically replaces at build time.
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-background">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Something went wrong
          </h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-md">
            An unexpected error occurred. You can try reloading the page, and if
            the problem persists, please contact support.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-accent text-fg rounded-lg text-sm hover:bg-accent/90 transition-colors"
            >
              Reload
            </button>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 border border-border text-foreground rounded-lg text-sm hover:bg-muted transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
