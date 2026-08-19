import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { store } from './store/store';
import { setOnLogoutCallback } from './store/slices/authSlice';
import App from './App';
import { SEOProvider } from '@components/common/SEOProvider';
import ErrorBoundary, { maybeReloadOnChunkError } from '@components/common/ErrorBoundary';
import { initErrorReporting, captureError } from '@lib/errorReporter';
import './index.css';

// AUDIT FIX (REL-3): start reporting before the first render. No-op unless
// VITE_SENTRY_DSN is set, so dev and CI transmit nothing.
initErrorReporting();

// Global safety net for dynamic-import/chunk load failures that occur outside
// of React's render tree (e.g. a route chunk failing to fetch after a deploy).
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (maybeReloadOnChunkError(event?.error || event?.message)) return;
    // AUDIT FIX (REL-3): anything that is NOT a stale-chunk error reached this
    // listener and was silently swallowed. Report it.
    captureError(event?.error || new Error(String(event?.message || 'window.onerror')), {
      source: 'window.error',
    });
  });
  window.addEventListener('unhandledrejection', (event) => {
    if (maybeReloadOnChunkError(event?.reason)) return;
    captureError(
      event?.reason instanceof Error ? event.reason : new Error(String(event?.reason)),
      { source: 'unhandledrejection' }
    );
  });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
      gcTime: 300000,
      meta: { skipErrorToast: true },
    },
    mutations: {
      retry: false,
      gcTime: 0,
    },
  },
});

// Wire up logout → cache clear (prevents data leakage between users)
setOnLogoutCallback(() => queryClient.clear());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <HelmetProvider>
            <BrowserRouter>
              <SEOProvider>
                <TooltipProvider>
                  <App />
                </TooltipProvider>
                <Toaster />
              </SEOProvider>
            </BrowserRouter>
          </HelmetProvider>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>
);
