import { useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Lock, Mail, ShieldCheck, User, UserPlus } from 'lucide-react';
import { Button } from '@components/ui/button';
import AuthShell from '@components/common/AuthShell';
import AuthField from '@components/common/AuthField';
import AuthDivider from '@components/common/AuthDivider';
import SocialAuthButtons from '@components/common/SocialAuthButtons';
import PasswordStrengthMeter from '@components/common/PasswordStrengthMeter';
import { authAPI } from '@services/api';
import { showSuccess, showApiError } from '@utils/toast';
import { describeAuthError } from '@lib/socialAuth';
import { scorePassword } from '@lib/passwordPolicy';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The backend takes a single `name` (2-50 chars); the mockup asks for first and
// last separately. Joining here keeps the design without touching the API
// contract — and trimming first means "  Ali  " + "" cannot produce a name that
// is whitespace or 51 characters long.
const joinName = (first, last) => [first.trim(), last.trim()].filter(Boolean).join(' ');

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const oauthError = describeAuthError(searchParams);

  useEffect(() => {
    if (isAuthenticated && window.location.pathname === '/register') {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const strength = useMemo(() => scorePassword(password), [password]);

  const emailState = email ? (EMAIL_RE.test(email) ? 'ok' : 'error') : null;
  const confirmState = confirmPassword ? (confirmPassword === password ? 'ok' : 'error') : null;
  const name = joinName(firstName, lastName);

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      const response = await authAPI.register(data);
      return response.data;
    },
    onSuccess: () => {
      showSuccess('Account created successfully! Please login to continue.');
      navigate('/login', { replace: true });
    },
    onError: (err) => {
      const errorData = err.response?.data;
      let errorMessage = 'Registration failed. Please check your input and try again.';

      if (errorData) {
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          errorMessage = errorData.errors
            .map((item) => {
              if (typeof item === 'object' && item.message) {
                const fieldName = item.field
                  ? item.field.charAt(0).toUpperCase() + item.field.slice(1) + ': '
                  : '';
                return `${fieldName}${item.message}`;
              }
              return typeof item === 'string' ? item : 'Invalid input';
            })
            .join('. ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      }

      setError(errorMessage);
      showApiError(err, 'Registration failed');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Ordered so the message names the FIRST thing wrong going down the form,
    // rather than whichever check happens to be written first.
    if (name.length < 2 || name.length > 50) {
      setError('Please enter your name (between 2 and 50 characters in total).');
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!strength.isValid) {
      setError(`Your password still needs: ${strength.firstUnmet.label.toLowerCase()}.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    registerMutation.mutate({ name, email, password });
  };

  const shownError = error || oauthError;

  return (
    <AuthShell
      title="Create your account to get started"
      hudTag="New Account"
      width="md"
    >
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
        <div className="grid grid-cols-2 gap-2.5">
          <AuthField
            id="firstName"
            label="First Name"
            icon={User}
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            autoComplete="given-name"
            state={firstName.trim() ? 'ok' : null}
          />
          <AuthField
            id="lastName"
            label="Last Name"
            icon={User}
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            state={lastName.trim() ? 'ok' : null}
          />
        </div>

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
          state={emailState}
          hint={emailState === 'error' ? 'Enter a valid email address' : undefined}
        />

        <div className="mb-3.5">
          <AuthField
            id="password"
            label="Password"
            type="password"
            icon={Lock}
            placeholder="Min 8 chars, mixed case, number, symbol"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
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
          label="Confirm Password"
          type="password"
          icon={ShieldCheck}
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          state={confirmState}
          hint={
            confirmState === 'ok'
              ? 'Passwords match'
              : confirmState === 'error'
                ? 'Passwords do not match'
                : undefined
          }
        />

        <p className="mb-4 text-center text-[11.5px] leading-relaxed text-fg-subtle">
          By creating an account you agree to our{' '}
          <Link to="/terms" className="text-accent-on-dark hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-accent-on-dark hover:underline">
            Privacy Policy
          </Link>
        </p>

        <Button type="submit" disabled={registerMutation.isPending} className="w-full" size="lg">
          <UserPlus className="size-[18px]" aria-hidden="true" />
          {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <AuthDivider className="my-5">Or sign up with</AuthDivider>

      <SocialAuthButtons layout="grid" />

      <p className="mt-6 border-t border-accent/10 pt-4.5 text-center text-[13px] text-fg-subtle">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-accent-on-dark hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
};

export default Register;
