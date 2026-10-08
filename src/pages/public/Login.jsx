import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Lock, LogIn, Mail } from 'lucide-react';
import { setCredentials } from '@store/slices/authSlice';
import { Button } from '@components/ui/button';
import AuthShell from '@components/common/AuthShell';
import AuthField from '@components/common/AuthField';
import SocialAuthButtons from '@components/common/SocialAuthButtons';
import AuthDivider from '@components/common/AuthDivider';
import api from '@lib/axios';
import { describeAuthError } from '@lib/socialAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const oauthError = describeAuthError(searchParams);

  useEffect(() => {
    if (isAuthenticated && window.location.pathname === '/login') {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post('/user/login', credentials, { skipErrorToast: true });
      return response.data;
    },
    onSuccess: (data) => {
      const { user } = data.data;
      dispatch(setCredentials({ user }));
      const roles = (user?.roles || []).map((r) => String(r).toLowerCase());
      const from = location.state?.from;
      if (typeof from === 'string' && from.startsWith('/') && from !== '/login') {
        navigate(from, { replace: true });
      } else if (roles.includes('admin')) {
        navigate('/admin/dashboard', { replace: true });
      } else if (roles.includes('seller')) {
        navigate('/seller/dashboard', { replace: true });
      } else {
        navigate('/user/dashboard', { replace: true });
      }
    },
    onError: (err) => {
      const errorData = err.response?.data;
      const firstError = errorData?.errors?.[0];
      setError(
        (typeof firstError === 'string' ? firstError : firstError?.message) ||
        errorData?.message ||
        (err.response ? 'Login failed' : 'Network error. Please check your connection.')
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate({ email, password });
  };

  const shownError = error || oauthError;

  return (
    <AuthShell title="Sign in to your account to continue" hudTag="Secure Session">
      {shownError && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 rounded-md border border-danger/25 bg-danger-soft p-3 text-sm text-danger"
        >
          {shownError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <AuthField
          id="email"
          label="Email"
          type="email"
          icon={Mail}
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <AuthField
          id="password"
          label="Password"
          type="password"
          icon={Lock}
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          labelAside={
            <Link
              to="/forgot-password"
              className="text-[11px] font-normal text-accent-on-dark transition-opacity hover:underline hover:opacity-100"
            >
              Forgot password?
            </Link>
          }
        />

        <Button type="submit" disabled={loginMutation.isPending} className="mt-1 w-full" size="lg">
          <LogIn className="size-[18px]" aria-hidden="true" />
          {loginMutation.isPending ? 'Logging in...' : 'Login'}
        </Button>
      </form>

      <SocialAuthButtons
        layout="grid"
        leading={<AuthDivider className="my-5">Or continue with</AuthDivider>}
      />

      <p className="mt-6 border-t border-accent/10 pt-4.5 text-center text-[13px] text-fg-subtle">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-accent-on-dark hover:underline">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
};

export default Login;
