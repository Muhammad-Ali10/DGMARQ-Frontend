import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { showSuccess, showApiError } from '../../utils/toast';
import { Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      showApiError(
        { response: { data: { message: 'Invalid reset link. Please request a new password reset.' } } },
        'Invalid Reset Link'
      );
      navigate('/forgot-password', { replace: true });
    }
  }, [token, email, navigate]);

  const resetPasswordMutation = useMutation({
    mutationFn: (data) => authAPI.resetPassword(data),
    onSuccess: () => {
      showSuccess('Password reset successfully! You can now login with your new password.');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    },
    onError: (error) => {
      showApiError(error, 'Failed to reset password');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!password.trim()) {
      showApiError(
        { response: { data: { message: 'Password is required' } } },
        'Validation Error'
      );
      return;
    }

    if (password.length < 8) {
      showApiError(
        { response: { data: { message: 'Password must be at least 8 characters long' } } },
        'Validation Error'
      );
      return;
    }

    if (password !== confirmPassword) {
      showApiError(
        { response: { data: { message: 'Passwords do not match' } } },
        'Validation Error'
      );
      return;
    }

    if (!token || !email) {
      showApiError(
        { response: { data: { message: 'Invalid reset link' } } },
        'Validation Error'
      );
      return;
    }

    resetPasswordMutation.mutate({
      token,
      newPassword: password.trim(),
    });
  };

  if (!token || !email) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-12">
      <Card className="w-full max-w-md bg-primary border-gray-700 shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
              <Lock className="w-8 h-8 text-accent" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-white">
            Reset Password
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-gray-700 text-white placeholder-gray-500 pr-10"
                  required
                  disabled={resetPasswordMutation.isPending}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400">Must be at least 8 characters long</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-secondary border-gray-700 text-white placeholder-gray-500 pr-10"
                  required
                  disabled={resetPasswordMutation.isPending}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-accent hover:bg-blue-700 text-white"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-accent hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
