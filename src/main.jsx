import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/sonner';
import { store } from './store/store';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000, // Consider data fresh for 30 seconds (reduce refetches)
      gcTime: 300000, // Keep in cache for 5 minutes (was cacheTime)
      // CRITICAL: Don't show error toasts for queries - errors are handled in UI
      // This prevents "Network Error" toasts during page load
      meta: {
        skipErrorToast: true, // Skip global error toasts for all queries
      },
    },
    mutations: {
      // Mutations (user actions) can show toasts - handled in onError callbacks
      retry: false, // Don't retry mutations automatically
      gcTime: 0, // Don't cache mutations
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </StrictMode>
);
