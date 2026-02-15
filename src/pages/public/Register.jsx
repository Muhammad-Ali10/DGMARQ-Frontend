import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { setCredentials } from '../../store/slices/authSlice';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { authAPI } from '../../services/api';
import { showSuccess, showApiError } from '../../utils/toast';
import { Chrome } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && window.location.pathname === '/register') {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      const response = await authAPI.register(data);
      return response.data;
    },
    onSuccess: (data) => {
      showSuccess('Account created successfully! Please login to continue.');
      navigate('/login', { replace: true });
    },
    onError: (err) => {
      try {
        const errorData = err.response?.data;
        let errorMessage = 'Registration failed. Please check your input and try again.';
        
        if (errorData) {
          if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
            errorMessage = errorData.errors
              .map((error) => {
                if (typeof error === 'object' && error.message) {
                  const fieldName = error.field ? error.field.charAt(0).toUpperCase() + error.field.slice(1) + ': ' : '';
                  return `${fieldName}${error.message}`;
                }
                return typeof error === 'string' ? error : 'Invalid input';
              })
              .join('. ');
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        }
        if (typeof errorMessage !== 'string') {
          errorMessage = 'Registration failed. Please check your input and try again.';
        }
        
        setError(errorMessage);
        showApiError(err, 'Registration failed');
      } catch (error) {
        setError('Registration failed. Please try again.');
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (name.length < 2 || name.length > 50) {
      setError('Name must be between 2 and 50 characters');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      registerMutation.mutate({ name, email, password });
    } catch (err) {
      setError('Registration failed. Please try again.');
    }
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
            Create a new account to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && typeof error === 'string' && error.length > 0 && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={50}
                className="bg-input text-foreground border-border"
              />
            </div>

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
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password (min 6 chars, 1 uppercase, 1 lowercase, 1 number)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-input text-foreground border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Password must contain at least one uppercase letter, one lowercase letter, and one number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="bg-input text-foreground border-border"
              />
            </div>

            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full"
              size="lg"
            >
              {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
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
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-accent hover:text-blue-400 transition-colors font-medium"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
