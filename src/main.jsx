import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from './components/ui/sonner';
import { store } from './store/store';
import { setOnLogoutCallback } from './store/slices/authSlice';
import App from './App';
import { SEOProvider } from './components/SEOProvider';
import ErrorBoundary, { maybeReloadOnChunkError } from './components/ErrorBoundary';
import './index.css';

// Global safety net for dynamic-import/chunk load failures that occur outside
// of React's render tree (e.g. a route chunk failing to fetch after a deploy).
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    maybeReloadOnChunkError(event?.error || event?.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    maybeReloadOnChunkError(event?.reason);
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
                <App />
                <Toaster />
              </SEOProvider>
            </BrowserRouter>
          </HelmetProvider>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>
);
