import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '@services/api';
import { Button } from '@components/ui/button';
import AuthShell from '@components/common/AuthShell';
import AuthField from '@components/common/AuthField';
import { showSuccess, showApiError } from '@utils/toast';
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
    <AuthShell
      title="Enter your email address and we'll send you a link to reset your password."
      hudTag="Password Reset"
    >
      <form onSubmit={handleSubmit}>
        <AuthField
          id="email"
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={forgotPasswordMutation.isPending}
        />

        <Button
          type="submit"
          className="mt-1 w-full"
          size="lg"
          disabled={forgotPasswordMutation.isPending}
        >
          {forgotPasswordMutation.isPending ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>

      <p className="mt-5 rounded-lg border border-warning/25 bg-warning-soft p-3 text-xs text-warning">
        <strong>Note:</strong> If you don't receive an email within a few minutes, please check
        your spam folder.
      </p>

      <p className="mt-6 border-t border-accent/10 pt-4.5 text-center text-[13px]">
        <Link
          to="/login"
          className="inline-flex items-center font-medium text-accent-on-dark hover:underline"
        >
          <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
          Back to Login
        </Link>
      </p>
    </AuthShell>
  );
};

export default ForgotPassword;
