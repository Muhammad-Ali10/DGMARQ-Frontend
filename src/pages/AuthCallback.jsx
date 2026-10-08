import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@store/slices/authSlice';
import { useMe } from '@hooks/useMe';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const error = searchParams.get('error');

  const { data: user, isError } = useMe({ enabled: !error });

  useEffect(() => {
    if (error || isError) {
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }
    if (user) {
      const roles = Array.isArray(user?.roles)
        ? user.roles.map(r => String(r).toLowerCase())
        : (user?.role ? [String(user.role).toLowerCase()] : ['customer']);

      dispatch(setCredentials({ user }));

      if (roles.includes('admin')) navigate('/admin/dashboard', { replace: true });
      else if (roles.includes('seller')) navigate('/seller/dashboard', { replace: true });
      else navigate('/user/dashboard', { replace: true });
    }
  }, [user, error, isError, navigate, dispatch]);

  if (error) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary to-secondary">
      <div className="text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-accent-on-dark animate-spin" />
        <p className="text-white">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
