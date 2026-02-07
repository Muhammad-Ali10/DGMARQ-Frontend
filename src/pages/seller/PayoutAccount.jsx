import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sellerAPI } from '../../services/api';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { CreditCard, CheckCircle2, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { showSuccess, showError } from '../../utils/toast';

const PayoutAccount = () => {
  const queryClient = useQueryClient();

  const { data: payoutAccountData, isLoading, isError } = useQuery({
    queryKey: ['payout-account'],
    queryFn: () => sellerAPI.getMyPayoutAccount().then(res => res.data.data),
  });

  const paypalSuccess = new URLSearchParams(window.location.search).get('paypal') === 'success';
  const paypalError = new URLSearchParams(window.location.search).get('paypal') === 'error';
  const paypalReason = new URLSearchParams(window.location.search).get('reason') || '';

  useEffect(() => {
    if (paypalSuccess) {
      queryClient.invalidateQueries(['payout-account']);
      showSuccess('PayPal connected successfully.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [paypalSuccess, queryClient]);

  useEffect(() => {
    if (paypalError) {
      queryClient.invalidateQueries(['payout-account']);
      const msg = paypalReason === 'invalid_state' ? 'Link expired or invalid. Please try connecting again.'
        : paypalReason === 'oauth_failed' ? 'PayPal sign-in failed. Try again.'
        : paypalReason === 'userinfo_failed' ? 'Could not load your PayPal account details. Try again.'
        : 'Could not connect PayPal. Try again.';
      showError(msg);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [paypalError, paypalReason, queryClient]);

  const handleConnectPayPal = async () => {
    try {
      const res = await sellerAPI.getPayPalConnectUrl();
      const url = res?.data?.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        showError('Could not get PayPal connect link.');
      }
    } catch (err) {
      showError(err?.response?.data?.message || 'Failed to start PayPal connect.');
    }
  };

  if (isLoading) return <Loading message="Loading payout account..." />;
  if (isError) return <ErrorMessage message="Error loading payout account" />;

  const hasAccount = payoutAccountData?.hasAccount ?? false;
  const paypalOAuthConnected = payoutAccountData?.paypalOAuthConnected ?? false;
  const paypalVerified = payoutAccountData?.paypalVerified ?? false;
  const accountBlocked = payoutAccountData?.accountBlocked ?? false;
  const payoutEligible = payoutAccountData?.payoutEligible ?? false;
  const paypalEmail = payoutAccountData?.paypalEmail ?? null;
  const accountStatus = payoutAccountData?.accountStatus ?? null;
  const oauthConnectedAt = payoutAccountData?.oauthConnectedAt ?? null;
  const payoutAccount = payoutAccountData?.payoutAccount ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Payout Account</h1>
        <p className="text-gray-400 mt-1">Connect your PayPal account to receive payouts. Email-only accounts are not accepted.</p>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            PayPal Account
          </CardTitle>
          {!paypalOAuthConnected && (
            <Button onClick={handleConnectPayPal} className="bg-accent hover:bg-accent/90 inline-flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Connect PayPal
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {paypalOAuthConnected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white font-semibold">PayPal</span>
                    {paypalVerified ? (
                      <Badge variant="success" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </Badge>
                    ) : (
                      <Badge variant="warning">Not verified</Badge>
                    )}
                    {accountBlocked && (
                      <Badge variant="destructive">Blocked</Badge>
                    )}
                  </div>
                  {paypalEmail && (
                    <p className="text-gray-300 text-sm">{paypalEmail}</p>
                  )}
                  {accountStatus && (
                    <p className="text-gray-400 text-sm mt-1">Account status: {accountStatus}</p>
                  )}
                </div>
                <Button variant="outline" onClick={handleConnectPayPal} className="inline-flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" /> Reconnect
                </Button>
              </div>

              {!payoutEligible && (paypalOAuthConnected || hasAccount) && (
                <div className="flex items-center gap-2 p-3 bg-amber-900/20 border border-amber-700 rounded-lg text-amber-400">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <div className="text-sm">
                    {accountBlocked && <p>Payouts are on hold. Contact support if you believe this is an error.</p>}
                    {!accountBlocked && !paypalVerified && (
                      <p>Your PayPal account is not verified or not eligible to receive payments. Payouts will stay on hold until your account is verified.</p>
                    )}
                    {!accountBlocked && paypalVerified && (
                      <p>Payouts are temporarily unavailable. Please try again later.</p>
                    )}
                  </div>
                </div>
              )}

              {payoutEligible && (
                <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-700 rounded-lg text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="text-sm">Your PayPal account is connected and verified. Payouts are released automatically by the system. View your earnings in the Earnings page.</p>
                </div>
              )}

              {oauthConnectedAt && (
                <p className="text-gray-400 text-sm">
                  Connected on: {new Date(oauthConnectedAt).toLocaleDateString()}
                </p>
              )}

              {payoutAccount?.linkedAt && !oauthConnectedAt && (
                <p className="text-gray-400 text-sm">
                  Linked on: {new Date(payoutAccount.linkedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400 mb-2">No PayPal account connected</p>
              <p className="text-gray-500 text-sm mb-4">Connect with PayPal to receive payouts. We do not accept email-only PayPal accounts.</p>
              <Button onClick={handleConnectPayPal} className="inline-flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Connect PayPal
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PayoutAccount;
