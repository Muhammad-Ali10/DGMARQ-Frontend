/**
 * Centralized toast notification utility
 * Uses sonner for consistent toast notifications across the app
 */
import { toast } from 'sonner';

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
 * Show error toast
 */
export const showError = (message, description = null) => {
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
 */
export const showApiError = (error, defaultMessage = 'An error occurred') => {
  let message = defaultMessage;
  let description = null;

  if (error?.response?.data) {
    const errorData = error.response.data;
    
    // Handle different error response formats
    if (errorData.message) {
      message = errorData.message;
    }
    
    // Handle validation errors
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

  // Only show "Network error" if there's no response (actual network failure)
  // For valid API responses (4xx/5xx), show the actual error message
  if (!error?.response) {
    message = 'Network error';
    description = 'Please check your internet connection';
  }
  // If error.response exists, use the message we already extracted above

  showError(message, description);
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
