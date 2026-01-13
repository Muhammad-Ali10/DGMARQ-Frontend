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

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Only redirect if user navigates to /login while already authenticated
  // This prevents showing login form to already logged-in users
  useEffect(() => {
    if (isAuthenticated && window.location.pathname === '/login') {
      // User is already logged in and trying to access login page
      // Redirect to home page instead
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
      
      // Ensure seller is properly handled (may be null if user doesn't have seller record)
      if (user && user.seller === null) {
        user.seller = null; // Explicitly set to null to prevent undefined errors
      }
      
      // Normalize roles to array and lowercase for consistency
      // Handle both roles array and single role field
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
        roles = ['customer']; // Default fallback
      }
      
      // Remove duplicates and ensure we have valid roles
      roles = [...new Set(roles)].filter(r => r); // Remove empty strings
      
      // Dispatch credentials - this will normalize roles in Redux too
      dispatch(setCredentials({
        user,
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      }));
      
      // After successful login, redirect to role-based dashboard or previous location
      const previousLocation = sessionStorage.getItem('previousLocation');
      
      // If user was trying to access a protected route, redirect them there
      if (previousLocation && previousLocation !== '/login' && previousLocation !== '/') {
        sessionStorage.removeItem('previousLocation');
        navigate(previousLocation, { replace: true });
      } else {
        // Redirect to appropriate dashboard based on role
        // Priority: admin > seller > customer
        // Roles are already normalized to lowercase above
        if (roles.includes('admin')) {
          navigate('/admin/dashboard', { replace: true });
        } else if (roles.includes('seller')) {
          navigate('/seller/dashboard', { replace: true });
        } else {
          // Customer - redirect to user dashboard
          navigate('/user/dashboard', { replace: true });
        }
      }
    },
    onError: (err) => {
      // Handle validation errors properly
      const errorData = err.response?.data;
      let errorMessage = 'Login failed';
      
      if (errorData) {
        // Check if there are validation errors (array of objects)
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          // Format validation errors as a readable string
          errorMessage = errorData.errors
            .map((error) => {
              // Handle both object format {field, message, value} and string format
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
