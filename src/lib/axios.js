import axios from 'axios';
import { store } from '@store/store';
import { logout } from '@store/slices/authSlice';
import { showApiError } from '@utils/toast';
import { API_BASE_URL } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
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
  } catch {
    /* history API unavailable (non-browser env) — non-fatal */
  }
}

// SECURITY FIX (#5): no Authorization header from localStorage. The httpOnly
// accessToken cookie is sent automatically because withCredentials:true.
api.interceptors.request.use(
  (config) => {
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

// A 401 from an endpoint that TAKES credentials means those credentials were
// wrong — not that an access token expired — so it must not go through the
// refresh-and-replay path below.
//
// It used to. Logging in with a bad password 401'd, got retried via
// /user/refresh-token, failed there too (no valid refresh cookie), and the
// interceptor rejected with the REFRESH error — so the login form displayed that
// endpoint's message, "unauthorize", instead of the real reason. Every failed
// login also cost a wasted request and dispatched a logout for a session the
// user did not have.
const CREDENTIAL_ENDPOINTS = [
  '/user/login',
  '/user/register',
  '/user/refresh-token',
  '/user/forgot-password',
  '/user/reset-password',
];
const takesCredentials = (url = '') => CREDENTIAL_ENDPOINTS.some((path) => url.includes(path));

// The same mistake in its other shape: a 401 aimed at someone who never had a
// session. Refreshing is meaningless for a guest — there is no refresh cookie —
// and the attempt COSTS the real message, because the interceptor rejects with
// the refresh endpoint's error instead of the original one.
//
// It bit the pre-order login gate. The server answers a guest with
//   "X is a pre-order — please log in or create an account to pre-order it."
// and the buyer saw "unauthorize", which explains nothing and names no remedy.
// Any guest-reachable endpoint that 401s to say "log in for this" was affected.
//
// So: only endpoints a session could plausibly fix go down the refresh path.
const hasSession = () => Boolean(store.getState()?.auth?.isAuthenticated);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isProtectedRoute = (pathname) => {
      const protectedRoutePrefixes = ['/admin', '/seller', '/user'];
      return protectedRoutePrefixes.some(prefix => pathname.startsWith(prefix));
    };
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !takesCredentials(originalRequest?.url) &&
      hasSession()
    ) {
      originalRequest._retry = true;

      const currentPath = window.location.pathname;
      const isProtected = isProtectedRoute(currentPath);

      // SECURITY FIX (#5): refresh relies on the httpOnly refresh cookie — we
      // can't read it from JS, so we just POST (withCredentials) and the server
      // reads the cookie. No token in the body, none in localStorage.
      try {
        await axios.post(
          `${API_BASE_URL}/user/refresh-token`,
          {},
          { withCredentials: true }
        );
        // New cookies are set by the server response; just replay the request.
        return api(originalRequest);
      } catch (refreshError) {
        store.dispatch(logout());
        if (isProtected && currentPath !== '/login') {
          showApiError(refreshError, 'Session expired. Please login again.');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
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

