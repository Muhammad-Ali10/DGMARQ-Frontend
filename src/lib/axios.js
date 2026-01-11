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
  timeout: 30000, // 30 second timeout to prevent hanging requests
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    
    // Show error toast for all other errors (unless skipToast is set)
    if (!originalRequest?.skipToast) {
      showApiError(error);
    }
    
    return Promise.reject(error);
  }
);

export default api;

