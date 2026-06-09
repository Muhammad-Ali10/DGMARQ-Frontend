// Centralized API configuration. Default port matches the backend (5000).
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Origin without the /api/v1 suffix (e.g. for OAuth redirects).
export const API_ORIGIN = API_BASE_URL.replace('/api/v1', '');
