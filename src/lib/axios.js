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
    
    // Avoid infinite loop on refresh token endpoint
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
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
          showApiError(refreshError, 'Session expired. Please login again.');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, logout user
        store.dispatch(logout());
        showApiError(error, 'Please login to continue.');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
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

