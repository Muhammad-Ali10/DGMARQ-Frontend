import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '@services/api';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Loading } from '@components/ui/loading';
import { MailCheck, MailX, ArrowLeft } from 'lucide-react';

/**
 * AUDIT FIX (DEAD-8): the landing page for the email-change verification link.
 *
 * The backend has always mailed `${FRONTEND_URL}/verify-email-change?token=...`,
 * but this route did not exist — the link dropped the user on the SPA's
 * not-found page, so nobody could ever complete an email change. The endpoint
 * and the authAPI.verifyEmailChange wrapper were both already there; only the
 * page was missing.
 *
 * The token is single-use and consumed by the POST, so this fires exactly once
 * on mount (StrictMode double-invokes effects in dev, hence the ref guard) and
 * reports the outcome rather than asking the user to press anything.
 */
const VerifyEmailChange = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const firedRef = useRef(false);

  const verifyMutation = useMutation({
    mutationFn: (data) => authAPI.verifyEmailChange(data),
  });

  const { mutate } = verifyMutation;
  useEffect(() => {
    if (!token || firedRef.current) return;
    firedRef.current = true;
    mutate({ token });
  }, [token, mutate]);

  const newEmail = verifyMutation.data?.data?.data?.email;
  const errorMessage =
    verifyMutation.error?.response?.data?.message ||
    'This verification link is invalid or has expired. Request the change again from your account settings.';

  let state = 'pending';
  if (!token) state = 'missing-token';
  else if (verifyMutation.isSuccess) state = 'success';
  else if (verifyMutation.isError) state = 'error';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                state === 'success' ? 'bg-emerald-500/20' : state === 'pending' ? 'bg-accent/20' : 'bg-red-500/20'
              }`}
            >
              {state === 'success' ? (
                <MailCheck className="w-8 h-8 text-emerald-400" />
              ) : state === 'pending' ? (
                <MailCheck className="w-8 h-8 text-accent-on-dark" />
              ) : (
                <MailX className="w-8 h-8 text-red-400" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-white">
            {state === 'success' ? 'Email updated' : 'Verify your new email'}
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            {state === 'success'
              ? 'Your account now uses this address for sign-in and every notification.'
              : state === 'pending'
                ? 'Confirming your new address…'
                : 'We could not complete this change.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {state === 'pending' && <Loading />}

          {state === 'success' && newEmail && (
            <p className="text-center font-mono text-sm text-white break-all">{newEmail}</p>
          )}

          {state === 'missing-token' && (
            <p className="text-center text-sm text-gray-400">
              This link is missing its verification token. Open the link from your email exactly as
              it was sent.
            </p>
          )}

          {state === 'error' && (
            <p className="text-center text-sm text-gray-400">{errorMessage}</p>
          )}

          {state === 'success' && (
            <Button asChild className="w-full bg-accent hover:bg-blue-700 text-white">
              <Link to="/login">Sign in with your new email</Link>
            </Button>
          )}

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-accent-on-dark hover:text-blue-400 transition-colors"
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

export default VerifyEmailChange;
