import axios from 'axios';
import { store } from '../store/store';
import { setToken, logout } from '../store/slices/authSlice';
import { showApiError } from '../utils/toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 20000, // 20 second timeout (increased for chat messages with large history)
});

// Track page load time to suppress toasts during initial load
let pageLoadTime = typeof window !== 'undefined' ? Date.now() : 0;
const INITIAL_LOAD_GRACE_PERIOD = 5000; // 5 seconds after page load

// Reset page load time on navigation (SPA navigation)
if (typeof window !== 'undefined') {
  // Track initial page load
  const initPageLoad = () => {
    pageLoadTime = Date.now();
  };
  
  if (document.readyState === 'loading') {
    window.addEventListener('load', initPageLoad, { once: true });
  } else {
    initPageLoad();
  }
  
  // Track SPA navigation (React Router) - only in browser
  try {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      pageLoadTime = Date.now();
      return originalPushState.apply(history, args);
    };
    
    history.replaceState = function(...args) {
      pageLoadTime = Date.now();
      return originalReplaceState.apply(history, args);
    };
    
    // Also listen to popstate (back/forward)
    window.addEventListener('popstate', () => {
      pageLoadTime = Date.now();
    }, { passive: true });
  } catch (e) {
    // Fallback if history API is not available
  }
}

// Request interceptor to add auth token and handle skipErrorToast flag
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // Extract skipErrorToast from config and set on request object for response interceptor
    if (config.skipErrorToast !== undefined) {
      config.skipToast = config.skipErrorToast;
      delete config.skipErrorToast; // Remove from config to avoid sending as param
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Don't show toast for successful responses automatically
    // Let individual API calls handle success toasts
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Helper function to check if current route is protected
    // Only routes under /admin, /seller, or /user are protected
    // Public routes like /cart, /wishlist, /checkout should not trigger redirect
    const isProtectedRoute = (pathname) => {
      const protectedRoutePrefixes = ['/admin', '/seller', '/user'];
      return protectedRoutePrefixes.some(prefix => pathname.startsWith(prefix));
    };
    
    // Avoid infinite loop on refresh token endpoint
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const currentPath = window.location.pathname;
      const isProtected = isProtectedRoute(currentPath);
      
      // Token expired, try to refresh
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/user/refresh-token`,
            { refreshToken },
            { withCredentials: true }
          );
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          
          // Update Redux store
          store.dispatch(setToken({ 
            accessToken, 
            refreshToken: newRefreshToken || refreshToken 
          }));
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          store.dispatch(logout());
          
          // Only redirect to login if we're on a protected route
          // Public routes should be allowed to fail gracefully
          if (isProtected && currentPath !== '/login') {
            showApiError(refreshError, 'Session expired. Please login again.');
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, logout user
        store.dispatch(logout());
        
        // Only redirect to login if we're on a protected route
        // Public routes should be allowed to fail gracefully (e.g., public API calls)
        if (isProtected && currentPath !== '/login') {
          showApiError(error, 'Please login to continue.');
          window.location.href = '/login';
        }
        // For public routes, don't redirect - let the request fail silently
        // This allows public pages to load even if some API calls fail with 401
        return Promise.reject(error);
      }
    }
    
    // CRITICAL: Don't show toast for errors during React Query retries or timeouts
    // React Query handles retries, we shouldn't spam user with error toasts
    const isTimeout = error.code === 'ECONNABORTED' || 
                      error.message?.toLowerCase().includes('timeout') ||
                      error.code === 'ETIMEDOUT' ||
                      (error.response?.status === 408); // Request Timeout
    
    // Detect request cancellation (AbortController / component unmount)
    const isCancelled = error.code === 'ERR_CANCELED' || 
                       error.message?.toLowerCase().includes('cancel') ||
                       axios.isCancel?.(error);
    
    // Check if request should skip toast (set by explicit flag in config)
    const shouldSkipToast = originalRequest?.skipToast || 
                           originalRequest?.skipErrorToast ||
                           isTimeout || // Always skip toast for timeouts
                           isCancelled; // Always skip toast for cancelled requests
    
    // CRITICAL: For chat/query requests, NEVER show toast - errors are handled in UI
    // This prevents multiple toasts during React Query retries
    const isChatRequest = originalRequest?.url?.includes('/messages') || 
                         originalRequest?.url?.includes('/conversations') ||
                         originalRequest?.url?.includes('/chat/conversation') ||
                         originalRequest?.url?.includes('/chat/unread-count');
    
    // Detect if this is a GET request (data fetching) vs user action (POST/PUT/DELETE/PATCH)
    const isGetRequest = !originalRequest?.method || originalRequest.method.toUpperCase() === 'GET';
    const isUserAction = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(originalRequest?.method?.toUpperCase());
    
    // Check if we're in initial page load grace period
    const timeSincePageLoad = Date.now() - pageLoadTime;
    const isInitialLoad = timeSincePageLoad < INITIAL_LOAD_GRACE_PERIOD;
    
    // CRITICAL: Suppress toasts for GET requests during initial page load
    // GET requests are data-fetching queries that should fail silently with UI fallbacks
    // Only show toasts for:
    // 1. User-initiated actions (POST/PUT/DELETE/PATCH) - force show
    // 2. GET requests AFTER initial load period (user is actively using the app)
    // 3. Explicit errors that need user attention (not during initial load)
    const shouldShowToastForError = !shouldSkipToast && !isChatRequest && (
      // Always show for user actions (force = true to bypass deduplication)
      (isUserAction && (error.response || (!error.response && !isTimeout))) ||
      // Show for GET requests only AFTER initial load period
      (isGetRequest && !isInitialLoad && (error.response || (!error.response && !isTimeout)))
    );
    
    if (shouldShowToastForError) {
      // Force show for user actions, normal deduplication for GET requests
      showApiError(error, undefined, isUserAction);
    }
    
    return Promise.reject(error);
  }
);

export default api;

