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
      const roles = Array.isArray(user?.roles) 
        ? user.roles.map(r => String(r).toLowerCase())
        : (user?.role ? [String(user.role).toLowerCase()] : ['customer']);
      
      // Dispatch credentials - this will normalize roles in Redux too
      dispatch(setCredentials({
        user,
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      }));
      
      // After successful login, redirect to home page or previous location
      // Users can then navigate to dashboard if they want
      const previousLocation = sessionStorage.getItem('previousLocation');
      if (previousLocation && previousLocation !== '/login') {
        sessionStorage.removeItem('previousLocation');
        navigate(previousLocation, { replace: true });
      } else {
        // Default to home page after login, not dashboard
        navigate('/', { replace: true });
      }
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Login failed');
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
              {error}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
