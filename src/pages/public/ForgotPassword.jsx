import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { showSuccess, showApiError } from '../../utils/toast';
import { Mail, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const forgotPasswordMutation = useMutation({
    mutationFn: (data) => authAPI.forgotPassword(data),
    onSuccess: () => {
      showSuccess('Password reset email sent! Please check your inbox.');
      // Optionally navigate to a confirmation page or back to login
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    },
    onError: (error) => {
      showApiError(error, 'Failed to send password reset email');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showApiError({ response: { data: { message: 'Email is required' } } }, 'Validation Error');
      return;
    }
    forgotPasswordMutation.mutate({ email: email.trim() });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-12">
      <Card className="w-full max-w-md bg-primary border-gray-700 shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
              <Mail className="w-8 h-8 text-accent" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-white">
            Forgot Password?
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary border-gray-700 text-white placeholder-gray-500"
                required
                disabled={forgotPasswordMutation.isPending}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-accent hover:bg-blue-700 text-white"
              disabled={forgotPasswordMutation.isPending}
            >
              {forgotPasswordMutation.isPending ? 'Sending...' : 'Send Reset Link'}
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

          <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
            <p className="text-xs text-yellow-400">
              <strong>Note:</strong> If you don't receive an email within a few minutes, please check your spam folder.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
