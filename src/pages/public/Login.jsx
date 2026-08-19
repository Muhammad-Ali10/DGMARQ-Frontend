import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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
  const { isAuthenticated } = useSelector((state) => state.auth);

  // The OAuth flows redirect back here with ?error=... on failure. Nothing used
  // to read it, so a declined Google consent screen returned the user to a login
  // page that said nothing about what had just happened.
  const oauthError = describeAuthError(searchParams);

  useEffect(() => {
    if (isAuthenticated && window.location.pathname === '/login') {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post('/user/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      // Backend now returns a single user object, but handle array for backward compatibility
      const user = Array.isArray(data.data.user) ? data.data.user[0] : data.data.user;
      if (user && user.seller === null) {
        user.seller = null;
      }
      let roles = [];
      if (user?.roles) {
        if (Array.isArray(user.roles)) {
          roles = user.roles.map(r => String(r).toLowerCase().trim());
        } else {
          roles = [String(user.roles).toLowerCase().trim()];
        }
      } else if (user?.role) {
        roles = [String(user.role).toLowerCase().trim()];
      } else {
        roles = ['customer'];
      }
      roles = [...new Set(roles)].filter(r => r);
      // SECURITY FIX (#5): tokens are set as httpOnly cookies by the server
      // and are no longer in the response body. We only hydrate the profile.
      dispatch(setCredentials({ user }));
      const previousLocation = sessionStorage.getItem('previousLocation');
      if (previousLocation && previousLocation !== '/login' && previousLocation !== '/') {
        sessionStorage.removeItem('previousLocation');
        navigate(previousLocation, { replace: true });
      } else {
        if (roles.includes('admin')) {
          navigate('/admin/dashboard', { replace: true });
        } else if (roles.includes('seller')) {
          navigate('/seller/dashboard', { replace: true });
        } else {
          navigate('/user/dashboard', { replace: true });
        }
      }
    },
    onError: (err) => {
      const errorData = err.response?.data;
      let errorMessage = 'Login failed';

      if (errorData) {
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          errorMessage = errorData.errors
            .map((error) => {
              if (typeof error === 'object' && error.message) {
                return `${error.field ? error.field + ': ' : ''}${error.message}`;
              }
              return typeof error === 'string' ? error : JSON.stringify(error);
            })
            .join('. ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      }

      setError(errorMessage);
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
          {typeof shownError === 'string' ? shownError : 'Login failed. Please check your credentials.'}
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

      <AuthDivider className="my-5">Or continue with</AuthDivider>

      <SocialAuthButtons layout="grid" />

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
