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
  timeout: 20000,
});

let pageLoadTime = typeof window !== 'undefined' ? Date.now() : 0;
const INITIAL_LOAD_GRACE_PERIOD = 5000;

if (typeof window !== 'undefined') {
  const initPageLoad = () => {
    pageLoadTime = Date.now();
  };
  
  if (document.readyState === 'loading') {
    window.addEventListener('load', initPageLoad, { once: true });
  } else {
    initPageLoad();
  }
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
    window.addEventListener('popstate', () => {
      pageLoadTime = Date.now();
    }, { passive: true });
  } catch (e) {}
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    if (config.skipErrorToast !== undefined) {
      config.skipToast = config.skipErrorToast;
      delete config.skipErrorToast;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isProtectedRoute = (pathname) => {
      const protectedRoutePrefixes = ['/admin', '/seller', '/user'];
      return protectedRoutePrefixes.some(prefix => pathname.startsWith(prefix));
    };
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const currentPath = window.location.pathname;
      const isProtected = isProtectedRoute(currentPath);
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/user/refresh-token`,
            { refreshToken },
            { withCredentials: true }
          );
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          store.dispatch(setToken({ 
            accessToken, 
            refreshToken: newRefreshToken || refreshToken 
          }));
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          store.dispatch(logout());
          if (isProtected && currentPath !== '/login') {
            showApiError(refreshError, 'Session expired. Please login again.');
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        store.dispatch(logout());
        if (isProtected && currentPath !== '/login') {
          showApiError(error, 'Please login to continue.');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }
    const isTimeout = error.code === 'ECONNABORTED' || 
                      error.message?.toLowerCase().includes('timeout') ||
                      error.code === 'ETIMEDOUT' ||
                      (error.response?.status === 408);
    const isCancelled = error.code === 'ERR_CANCELED' || 
                       error.message?.toLowerCase().includes('cancel') ||
                       axios.isCancel?.(error);
    const shouldSkipToast = originalRequest?.skipToast || 
                           originalRequest?.skipErrorToast ||
                           isTimeout ||
                           isCancelled;
    const isChatRequest = originalRequest?.url?.includes('/messages') || 
                         originalRequest?.url?.includes('/conversations') ||
                         originalRequest?.url?.includes('/chat/conversation') ||
                         originalRequest?.url?.includes('/chat/unread-count');
    const isGetRequest = !originalRequest?.method || originalRequest.method.toUpperCase() === 'GET';
    const isUserAction = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(originalRequest?.method?.toUpperCase());
    const timeSincePageLoad = Date.now() - pageLoadTime;
    const isInitialLoad = timeSincePageLoad < INITIAL_LOAD_GRACE_PERIOD;
    const shouldShowToastForError = !shouldSkipToast && !isChatRequest && (
      (isUserAction && (error.response || (!error.response && !isTimeout))) ||
      (isGetRequest && !isInitialLoad && (error.response || (!error.response && !isTimeout)))
    );
    if (shouldShowToastForError) {
      const is429 = error.response?.status === 429;
      const retryAfter = error.response?.headers?.['retry-after'];
      const defaultMsg = is429
        ? (retryAfter
          ? `Too many requests. Please wait ${retryAfter} seconds and try again.`
          : 'Too many requests. Please wait a moment and try again.')
        : undefined;
      showApiError(error, defaultMsg, isUserAction);
    }
    
    return Promise.reject(error);
  }
);

export default api;

