import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '@services/api';
import { Button } from '@components/ui/button';
import AuthShell from '@components/common/AuthShell';
import AuthField from '@components/common/AuthField';
import PasswordStrengthMeter from '@components/common/PasswordStrengthMeter';
import { showSuccess, showApiError } from '@utils/toast';
import { scorePassword } from '@lib/passwordPolicy';
import { Lock, ArrowLeft, ShieldCheck } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      showApiError(
        { response: { data: { message: 'Invalid reset link. Please request a new password reset.' } } },
        'Invalid Reset Link'
      );
      navigate('/forgot-password', { replace: true });
    }
  }, [token, navigate]);

  const strength = useMemo(() => scorePassword(password), [password]);
  const confirmState = confirmPassword ? (confirmPassword === password ? 'ok' : 'error') : null;

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

    if (!strength.isValid) {
      showApiError(
        { response: { data: { message: `Password still needs: ${strength.firstUnmet.label.toLowerCase()}` } } },
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

    if (!token) {
      showApiError(
        { response: { data: { message: 'Invalid reset link' } } },
        'Validation Error'
      );
      return;
    }

    resetPasswordMutation.mutate({
      token,
      newPassword: password,
    });
  };

  if (!token) {
    return null;
  }

  return (
    <AuthShell title="Enter your new password below." hudTag="Reset Password">
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3.5">
          <AuthField
            id="password"
            label="New Password"
            type="password"
            icon={Lock}
            placeholder="Min 8 chars, mixed case, number, symbol"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            disabled={resetPasswordMutation.isPending}
            wrapperClassName="mb-0"
          />
          {password && (
            <PasswordStrengthMeter score={strength.score} label={strength.label} />
          )}
          {password && !strength.isValid && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-fg-subtle">
              Still needs: {strength.firstUnmet.label.toLowerCase()}
            </p>
          )}
        </div>

        <AuthField
          id="confirmPassword"
          label="Confirm New Password"
          type="password"
          icon={ShieldCheck}
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          disabled={resetPasswordMutation.isPending}
          state={confirmState}
          hint={
            confirmState === 'ok'
              ? 'Passwords match'
              : confirmState === 'error'
                ? 'Passwords do not match'
                : undefined
          }
        />

        <Button
          type="submit"
          className="mt-1 w-full"
          size="lg"
          disabled={resetPasswordMutation.isPending}
        >
          {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>

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

export default ResetPassword;
