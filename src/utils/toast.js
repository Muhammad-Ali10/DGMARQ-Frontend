import { toast } from 'sonner';

const recentToasts = new Map();
const TOAST_DEBOUNCE_MS = 3000;

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

export const showSuccess = (message, description = null) => {
  toast.success(message, {
    description,
    duration: 2000,
  });
};

export const showError = (message, description = null, force = false) => {
  if (!shouldShowToast(message, description) && !force) {
    return;
  }
  
  toast.error(message, {
    description,
    duration: 3000,
  });
};

export const showWarning = (message, description = null) => {
  toast.warning(message, {
    description,
    duration: 2000,
  });
};

const toText = (value) => {
  if (typeof value === 'string') return value;
  if (value && typeof value.message === 'string') return value.message;
  return null;
};

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
      description = toText(errorData.errors[0]);
    } else if (errorData.details) {
      description = typeof errorData.details === 'string' 
        ? errorData.details 
        : JSON.stringify(errorData.details);
    } else if (errorData.error) {
      description = toText(errorData.error);
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
