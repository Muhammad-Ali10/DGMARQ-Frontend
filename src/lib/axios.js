import axios from 'axios';
import { store } from '@store/store';
import { endSession } from './session';
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

api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    if (config.skipErrorToast !== undefined) {
      config.skipToast = config.skipErrorToast;
      delete config.skipErrorToast;
    }
    config._sentAt = Date.now();

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const CREDENTIAL_ENDPOINTS = [
  '/user/login',
  '/user/register',
  '/user/refresh-token',
  '/user/forgot-password',
  '/user/reset-password',
];
const takesCredentials = (url = '') => CREDENTIAL_ENDPOINTS.some((path) => url.includes(path));

const hasSession = () => Boolean(store.getState()?.auth?.isAuthenticated);

const REFRESH_LOCK = 'dgmarq-session-refresh';
const REFRESH_STAMP_KEY = 'dgmarq:session-refreshed-at';
let refreshInFlight = null;

const readRefreshStamp = () => {
  try {
    return Number(localStorage.getItem(REFRESH_STAMP_KEY)) || 0;
  } catch {
    return 0;
  }
};

const writeRefreshStamp = (at) => {
  try {
    localStorage.setItem(REFRESH_STAMP_KEY, String(at));
  } catch {
    return;
  }
};

const refreshUnlessAlreadyDone = async (since) => {
  if (readRefreshStamp() > since) return;
  await axios.post(`${API_BASE_URL}/user/refresh-token`, {}, { withCredentials: true });
  writeRefreshStamp(Date.now());
};

const refreshSession = (since) => {
  if (!refreshInFlight) {
    const run = () => refreshUnlessAlreadyDone(since);
    const locked = typeof navigator !== 'undefined' && navigator.locks?.request
      ? navigator.locks.request(REFRESH_LOCK, run)
      : run();
    refreshInFlight = Promise.resolve(locked).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};

const PUBLIC_SELLER_PROFILE = /^\/seller\/[0-9a-f]{24}\/?$/i;

export const isProtectedPath = (pathname = '') => {
  if (/^\/(admin|user)(\/|$)/.test(pathname)) return true;
  return /^\/seller(\/|$)/.test(pathname) && !PUBLIC_SELLER_PROFILE.test(pathname);
};

const sessionRejected = (error) => [401, 403].includes(error?.response?.status);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !takesCredentials(originalRequest?.url) &&
      hasSession()
    ) {
      originalRequest._retry = true;

      const currentPath = window.location.pathname;
      const isProtected = isProtectedPath(currentPath);

      try {
        await refreshSession(originalRequest._sentAt || 0);
      } catch (refreshError) {
        if (!sessionRejected(refreshError)) {
          return Promise.reject(error);
        }
        endSession();
        if (isProtected && currentPath !== '/login') {
          showApiError(refreshError, 'Session expired. Please login again.');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
      return api(originalRequest);
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
                         originalRequest?.url?.includes('/chat/conversation');
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

