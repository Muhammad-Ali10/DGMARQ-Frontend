import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { setCredentials } from '../../store/slices/authSlice';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import api from '../../lib/axios';
import { Chrome } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

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
      dispatch(setCredentials({
        user,
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      }));
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

  const handleGoogleLogin = () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    const baseUrl = apiBaseUrl.replace('/api/v1', '');
    window.location.href = `${baseUrl}/api/v1/user/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-accent">DGMARQ</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-sm">
              {typeof error === 'string' ? error : 'Login failed. Please check your credentials.'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-input text-foreground border-border"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-accent hover:text-blue-400 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-input text-foreground border-border"
              />
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full"
              size="lg"
            >
              {loginMutation.isPending ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full mt-4"
              size="lg"
            >
              <Chrome className="mr-2 h-5 w-5" />
              Continue with Google
            </Button>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-accent hover:text-blue-400 transition-colors font-medium"
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
