import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { sellerAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Globe2,
  Info,
  Landmark,
  Plug,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { showSuccess, showError, showApiError } from '../../utils/toast';
import { useSocket } from '../../hooks/useSocket';
import PayoneerPayoutSetupModal from '../../components/PayoneerPayoutSetupModal';

/**
 * Phase 4 — Multi-method seller payout account page.
 *
 * Replaces the previous PayPal-only single-card UI with a four-method matrix:
 *   - PayPal (OAuth, unchanged behaviour)
 *   - Payoneer (payee ID validation)
 *   - Local Bank Transfer (Payoneer-routed)
 *   - SWIFT International (Payoneer-routed)
 *
 * The plan's `payout_account_linked` socket event is used to invalidate the
 * relevant queries when an account is added in another tab/device.
 */

const METHODS = [
  {
    key: 'paypal',
    label: 'PayPal',
    description: 'Receive payouts to your PayPal account.',
    icon: CreditCard,
    routedFrom: 'PayPal',
    accent: 'bg-sky-500/10 border-sky-500/30 text-sky-100',
  },
  {
    key: 'payoneer',
    label: 'Payoneer',
    description: 'Receive payouts directly to your Payoneer account.',
    icon: Globe2,
    routedFrom: 'Payoneer',
    accent: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100',
  },
  {
    key: 'local_bank',
    label: 'Local Bank Transfer',
    description: 'Domestic bank transfer in your country, routed via Payoneer.',
    icon: Landmark,
    routedFrom: 'Payoneer',
    accent: 'bg-amber-500/10 border-amber-500/30 text-amber-100',
  },
  {
    key: 'swift',
    label: 'SWIFT International',
    description: 'International wire to any bank in the world via SWIFT.',
    icon: Banknote,
    routedFrom: 'Payoneer',
    accent: 'bg-violet-500/10 border-violet-500/30 text-violet-100',
  },
];

const StatusBadge = ({ status }) => {
  if (status === 'verified') {
    return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Connected</Badge>;
  }
  if (status === 'blocked') {
    return <Badge variant="destructive" className="flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> Blocked</Badge>;
  }
  if (status === 'pending') {
    return <Badge variant="warning">Pending</Badge>;
  }
  return <Badge variant="secondary">Not connected</Badge>;
};

const PayoutAccount = () => {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const [payoneerModalMethod, setPayoneerModalMethod] = useState(null); // 'payoneer' | 'local_bank' | 'swift' | null

  const { data: payoutAccountData, isLoading, isError } = useQuery({
    queryKey: ['payout-account'],
    queryFn: () => sellerAPI.getMyPayoutAccount().then((res) => res.data.data),
    refetchInterval: 30000,
  });

  // Phase 2: hold-period copy is driven by the live admin setting.
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

  // PayPal OAuth callback toast handling (unchanged from previous behaviour).
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

  const accountsByMethod = useMemo(() => {
    const map = new Map();
    for (const acc of payoutAccountData?.accounts || []) {
      map.set(acc.method || acc.accountType, acc);
    }
    return map;
  }, [payoutAccountData]);

  const payoneerConfigured = !!payoutAccountData?.payoneerConfigured;

  const unlinkMutation = useMutation({
    mutationFn: (method) => sellerAPI.unlinkPayoutAccount(method),
    onSuccess: (_data, method) => {
      queryClient.invalidateQueries({ queryKey: ['payout-account'] });
      showSuccess(`${methodLabelFor(method)} disconnected.`);
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
    if (!window.confirm(`Disconnect ${methodLabelFor(method)}? You can reconnect anytime.`)) return;
    unlinkMutation.mutate(method);
  };

  if (isLoading) return <Loading message="Loading payout account..." />;
  if (isError) return <ErrorMessage message="Error loading payout account" />;

  const accountBlocked = payoutAccountData?.accountBlocked ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Payout Account</h1>
        <p className="text-gray-400 mt-1">
          Connect any of the supported payout methods. Once connected, your earnings release automatically every {holdDays} day{holdDays === 1 ? '' : 's'} after order completion.
        </p>
      </div>

      <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-sky-300 mt-0.5 shrink-0" />
        <p className="text-xs text-sky-100/90">
          PayPal payouts are sent from our PayPal account. Payoneer, Local Bank Transfer, and SWIFT International payouts are sent from our Payoneer account. You pay the provider fee for the method you choose at withdrawal time.
        </p>
      </div>

      {accountBlocked ? (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-300 mt-0.5 shrink-0" />
          <p className="text-xs text-rose-100">
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
          const isPayoneerRouted = m.key !== 'paypal';
          const payoneerGated = isPayoneerRouted && !payoneerConfigured;

          return (
            <Card key={m.key} className="bg-primary border-gray-700">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {m.label}
                  </CardTitle>
                  <p className="text-xs text-gray-400">Routed via: {m.routedFrom}</p>
                </div>
                <StatusBadge status={account?.status || 'none'} />
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-400">{m.description}</p>

                {isConnected && account ? (
                  <div className="rounded-md bg-gray-800 p-3 space-y-1">
                    <p className="text-sm text-white">
                      {account.accountIdentifier || account.displayDetails?.bankName || 'Connected'}
                    </p>
                    {account.accountName ? <p className="text-xs text-gray-300">{account.accountName}</p> : null}
                    {account.linkedAt ? (
                      <p className="text-[11px] text-gray-500">
                        Connected on {new Date(account.linkedAt).toLocaleDateString()}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {isBlocked ? (
                  <p className="text-xs text-rose-300">
                    Blocked by admin: {account?.blockedReason || 'no reason provided'}.
                  </p>
                ) : null}

                {payoneerGated ? (
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-100">
                    Payoneer integration is not configured on this server yet. Ask the admin to enable it.
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2 pt-1">
                  {m.key === 'paypal' ? (
                    <Button
                      onClick={handleConnectPayPal}
                      className="bg-accent hover:bg-accent/90 inline-flex items-center gap-2"
                      size="sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {isConnected ? 'Reconnect' : 'Connect PayPal'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setPayoneerModalMethod(m.key)}
                      className="bg-accent hover:bg-accent/90 inline-flex items-center gap-2"
                      size="sm"
                      disabled={payoneerGated}
                    >
                      <Plug className="h-4 w-4" />
                      {isConnected ? 'Replace details' : `Connect ${m.label}`}
                    </Button>
                  )}
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

      <PayoneerPayoutSetupModal
        open={!!payoneerModalMethod}
        onOpenChange={(v) => { if (!v) setPayoneerModalMethod(null); }}
        method={payoneerModalMethod || 'payoneer'}
      />
    </div>
  );
};

const methodLabelFor = (method) => {
  switch (method) {
    case 'paypal': return 'PayPal';
    case 'payoneer': return 'Payoneer';
    case 'local_bank': return 'Local Bank Transfer';
    case 'swift': return 'SWIFT International';
    default: return method;
  }
};

export default PayoutAccount;
