import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { sellerAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';
import { StatusBadge } from '@components/common/StatusBadge';
import { ErrorState } from '@components/common/ErrorState';
import {
  CreditCard,
  ExternalLink,
  Info,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { showSuccess, showError, showApiError } from '@utils/toast';
import { useSocket } from '@hooks/useSocket';

const METHODS = [
  {
    key: 'paypal',
    label: 'PayPal',
    description: 'Receive payouts to your PayPal account.',
    icon: CreditCard,
    routedFrom: 'PayPal',
    accent: 'bg-info-soft border-info/35 text-info',
  },
];

const PayoutAccount = () => {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  const { data: payoutAccountData, isLoading, isError } = useQuery({
    queryKey: ['payout-account'],
    queryFn: () => sellerAPI.getMyPayoutAccount().then((res) => res.data.data),
    refetchInterval: 30000,
  });

  const { data: payoutSettings } = useQuery({
    queryKey: ['public-payout-settings'],
    queryFn: () => sellerAPI.getPublicPayoutSettings().then((res) => res.data.data),
    staleTime: 5 * 60 * 1000,
  });
  const holdDays = typeof payoutSettings?.payoutHoldDays === 'number' ? payoutSettings.payoutHoldDays : 15;

  useEffect(() => {
    if (!socket || !isConnected) return;
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['payout-account'] });
      queryClient.invalidateQueries({ queryKey: ['seller-balance'] });
    };
    socket.on('payout_account_updated', invalidate);
    socket.on('payout_account_linked', invalidate);
    return () => {
      socket.off('payout_account_updated', invalidate);
      socket.off('payout_account_linked', invalidate);
    };
  }, [socket, isConnected, queryClient]);

  const paypalSuccess = new URLSearchParams(window.location.search).get('paypal') === 'success';
  const paypalError = new URLSearchParams(window.location.search).get('paypal') === 'error';
  const paypalReason = new URLSearchParams(window.location.search).get('reason') || '';

  useEffect(() => {
    if (paypalSuccess) {
      queryClient.invalidateQueries({ queryKey: ['payout-account'] });
      showSuccess('PayPal connected successfully.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [paypalSuccess, queryClient]);

  useEffect(() => {
    if (paypalError) {
      queryClient.invalidateQueries({ queryKey: ['payout-account'] });
      const msg = paypalReason === 'invalid_state' ? 'Link expired or invalid. Please try connecting again.'
        : paypalReason === 'oauth_failed' ? 'PayPal sign-in failed. Try again.'
        : paypalReason === 'userinfo_failed' ? 'Could not load your PayPal account details. Try again.'
        : 'Could not connect PayPal. Try again.';
      showError(msg);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [paypalError, paypalReason, queryClient]);

  const accountsByMethod = useMemo(() => {
    const map = new Map();
    for (const acc of payoutAccountData?.accounts || []) {
      map.set(acc.method || acc.accountType, acc);
    }
    return map;
  }, [payoutAccountData]);

  const unlinkMutation = useMutation({
    mutationFn: (method) => sellerAPI.unlinkPayoutAccount(method),
    onSuccess: (_data, method) => {
      queryClient.invalidateQueries({ queryKey: ['payout-account'] });
      showSuccess(`${method === 'paypal' ? 'PayPal' : method} disconnected.`);
    },
    onError: (err) => showApiError(err, 'Could not unlink account.'),
  });

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

  const handleUnlink = (method) => {
    if (!window.confirm(`Disconnect PayPal? You can reconnect anytime.`)) return;
    unlinkMutation.mutate(method);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }
  if (isError) {
    return (
      <ErrorState
        title="Couldn't load your payout account"
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['payout-account'] })}
      />
    );
  }

  const accountBlocked = payoutAccountData?.accountBlocked ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-fg">Payout Account</h1>
        <p className="text-fg-muted mt-1">
          Connect your PayPal account. Once connected, your earnings release automatically every {holdDays} day{holdDays === 1 ? '' : 's'} after order completion.
        </p>
      </div>

      <div className="rounded-lg border border-info/35 bg-info-soft p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-info mt-0.5 shrink-0" />
        <p className="text-xs text-info">
          PayPal payouts are sent from our PayPal account. You pay the provider fee for withdrawals at request time.
        </p>
      </div>

      {accountBlocked ? (
        <div className="rounded-lg border border-danger/35 bg-danger-soft p-3 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-danger mt-0.5 shrink-0" />
          <p className="text-xs text-danger">
            Your account is currently blocked from receiving payouts. Contact support if you believe this is an error.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {METHODS.map((m) => {
          const account = accountsByMethod.get(m.key) || null;
          const isConnected = !!account && account.status !== 'blocked';
          const isBlocked = account?.status === 'blocked';
          const Icon = m.icon;

          return (
            <Card key={m.key} variant="hud">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {m.label}
                  </CardTitle>
                  <p className="text-xs text-fg-muted">Routed via: {m.routedFrom}</p>
                </div>
                <StatusBadge domain="payoutAccount" status={account?.status || 'unlinked'} />
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-fg-muted">{m.description}</p>

                {isConnected && account ? (
                  <div className="rounded-md bg-surface-2 p-3 space-y-1">
                    <p className="text-sm text-fg">
                      {account.accountIdentifier || 'Connected'}
                    </p>
                    {account.accountName ? <p className="text-xs text-fg-muted">{account.accountName}</p> : null}
                    {account.linkedAt ? (
                      <p className="text-[11px] text-fg-subtle">
                        Connected on {new Date(account.linkedAt).toLocaleDateString()}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {isBlocked ? (
                  <p className="text-xs text-danger">
                    Blocked by admin: {account?.blockedReason || 'no reason provided'}.
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    onClick={handleConnectPayPal}
                    className="bg-accent hover:bg-accent/90 inline-flex items-center gap-2"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {isConnected ? 'Reconnect' : 'Connect PayPal'}
                  </Button>
                  {isConnected ? (
                    <Button
                      onClick={() => handleUnlink(m.key)}
                      variant="outline"
                      size="sm"
                      disabled={unlinkMutation.isPending || isBlocked}
                      className="inline-flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Disconnect
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PayoutAccount;
