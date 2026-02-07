import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import { useQuery } from '@tanstack/react-query';
import { authAPI } from '../services/api';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [tokenStored, setTokenStored] = useState(false);
  
  const token = searchParams.get('token');
  const refreshToken = searchParams.get('refreshToken');
  const error = searchParams.get('error');

  // FIX: Store tokens in localStorage immediately so axios interceptor can use them
  useEffect(() => {
    if (token && refreshToken && !error) {
      // Store tokens in localStorage FIRST before making any API calls
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      setTokenStored(true);
    }
  }, [token, refreshToken, error]);

  // Fetch user profile to get user data - only after token is stored
  const { data: userData, isLoading, isError } = useQuery({
    queryKey: ['user-profile', token],
    queryFn: () => authAPI.getProfile(),
    enabled: !!token && !error && tokenStored, // Only fetch after token is stored
    retry: false,
  });

  useEffect(() => {
    if (error) {
      // OAuth failed, redirect to login
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    // If API call failed, redirect to login
    if (tokenStored && isError) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    if (token && refreshToken && userData && tokenStored) {
      const user = userData.data.data;
      
      // Normalize roles to array and lowercase for consistency
      const roles = Array.isArray(user?.roles) 
        ? user.roles.map(r => String(r).toLowerCase())
        : (user?.role ? [String(user.role).toLowerCase()] : ['customer']);
      
      // Dispatch credentials (this will also update localStorage, but tokens are already there)
      dispatch(setCredentials({
        user,
        accessToken: token,
        refreshToken: refreshToken,
      }));
      
      // Redirect based on user role
      if (roles.includes('admin')) {
        navigate('/admin/dashboard', { replace: true });
      } else if (roles.includes('seller')) {
        navigate('/seller/dashboard', { replace: true });
      } else {
        navigate('/user/dashboard', { replace: true });
      }
    }
  }, [token, refreshToken, userData, error, tokenStored, isError, navigate, dispatch]);

  if (error) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary to-secondary">
      <div className="text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-accent animate-spin" />
        <p className="text-white">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;

