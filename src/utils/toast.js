/**
 * Centralized toast utility. Uses sonner for consistent notifications.
 */
import { toast } from 'sonner';

const recentToasts = new Map();
const TOAST_DEBOUNCE_MS = 3000;

/**
 * Check if toast should be shown (deduplication)
 */
const shouldShowToast = (message, description = null) => {
  const key = `${message}|${description || ''}`;
  const now = Date.now();
  const lastShown = recentToasts.get(key);
  
  if (lastShown && (now - lastShown) < TOAST_DEBOUNCE_MS) {
    return false;
  }
  
  recentToasts.set(key, now);
  if (recentToasts.size > 50) {
    const oldestKey = recentToasts.keys().next().value;
    recentToasts.delete(oldestKey);
  }
  
  return true;
};

/**
 * Show success toast
 */
export const showSuccess = (message, description = null) => {
  toast.success(message, {
    description,
    duration: 2000,
  });
};

/**
 * Show error toast (with deduplication)
 */
export const showError = (message, description = null, force = false) => {
  if (!force && !shouldShowToast(message, description)) {
    return;
  }
  
  toast.error(message, {
    description,
    duration: 3000,
  });
};

/**
 * Show warning toast
 */
export const showWarning = (message, description = null) => {
  toast.warning(message, {
    description,
    duration: 2000,
  });
};

/**
 * Show info toast
 */
export const showInfo = (message, description = null) => {
  toast.info(message, {
    description,
    duration: 2000,
  });
};

/**
 * Show loading toast (returns dismiss function)
 */
export const showLoading = (message) => {
  return toast.loading(message);
};

/**
 * Parse API error and show appropriate toast
 * @param {Error} error - The error object
 * @param {string} defaultMessage - Default error message
 * @param {boolean} force - Force show toast even if duplicate (for user actions)
 */
export const showApiError = (error, defaultMessage = 'An error occurred', force = false) => {
  let message = defaultMessage;
  let description = null;

  if (error?.response?.data) {
    const errorData = error.response.data;
    if (error?.response?.status === 429 && defaultMessage === 'An error occurred') {
      message = typeof errorData === 'object' && errorData?.message
        ? errorData.message
        : 'Too many requests. Please wait a moment and try again.';
    }
    else if (errorData.message) {
      message = errorData.message;
    }
    if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
      description = errorData.errors[0];
    } else if (errorData.details) {
      description = typeof errorData.details === 'string' 
        ? errorData.details 
        : JSON.stringify(errorData.details);
    } else if (errorData.error) {
      description = errorData.error;
    }
  } else if (error?.message) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }
  if (!error?.response) {
    message = 'Network error';
    description = 'Please check your internet connection';
  }
  showError(message, description, force);
};

/**
 * Show API success message
 */
export const showApiSuccess = (response, defaultMessage = 'Operation successful') => {
  const message = response?.data?.message || defaultMessage;
  showSuccess(message);
};

export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  apiError: showApiError,
  apiSuccess: showApiSuccess,
};
