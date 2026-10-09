import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { store } from './store/store';
import App from './App';
import { SEOProvider } from '@components/common/SEOProvider';
import ErrorBoundary, { maybeReloadOnChunkError } from '@components/common/ErrorBoundary';
import { initErrorReporting, captureError } from '@lib/errorReporter';
import { queryClient } from '@lib/queryClient';
import './index.css';

initErrorReporting();

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (maybeReloadOnChunkError(event?.error || event?.message)) return;
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
