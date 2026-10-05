import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { sellerAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Badge } from '@components/ui/badge';
import { Skeleton } from '@components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { StatCard, StatCardGrid } from '@components/common/StatCard';
import { StatCardGridSkeleton, TableRowsSkeleton, CardListSkeleton } from '@components/common/Skeletons';
import { EmptyState, TableEmptyRow } from '@components/common/EmptyState';
import { ErrorState } from '@components/common/ErrorState';
import { WithdrawalRequestModal, payoutBadgeProps } from '@features/wallet-payout';
import { useSocket } from '@hooks/useSocket';
import useCurrency from '@hooks/useCurrency';
import { formatDateTime, formatRelativeDate, formatExactTitle } from '@lib/datetime';
import {
  Wallet,
  Clock,
  Send,
  CheckCircle2,
  FileText,
  History,
  Eye,
  ArrowUpRight,
  AlertCircle,
  Snowflake,
} from 'lucide-react';

// ============================================================================
// Seller earnings & payouts.
//
// The withdrawal lifecycle, the payout-row split and the ?tab / ?id deep-link
// handling below are unchanged business logic — only the presentation moved.
// ============================================================================

const METHOD_LABEL = { paypal: 'PayPal' };

// Split a payout row into seller-facing total / available / frozen /
// refunded amounts.
//
// Total uses the SALE-TIME `originalNetAmount` (shipped by the backend
// via getSellerPayouts) — falling back to live `netAmount` for legacy
// rows. This is critical: live netAmount is reduced by completed refunds
// so it can't be used as a row "Total" without misleading the seller.
//
// Refunded amount is derived: each key contributes an equal slice of the
// original net, so refundedAmount = perKeyNet * refundedKeyCount.
//
// SECURITY: this is purely a presentation transform over fields already
// shipped to the seller (`originalNetAmount`, `netAmount`, `frozenAmount`,
// `frozenKeyIds`, `licenseKeyIds`, `refundedKeyCount`). No admin fields.
const splitPayoutRow = (payout) => {
  const totalKeys = Array.isArray(payout?.licenseKeyIds) ? payout.licenseKeyIds.length : 0;
  const frozenKeys = Math.min(
    Array.isArray(payout?.frozenKeyIds) ? payout.frozenKeyIds.length : 0,
    totalKeys
  );
  const refundedKeys = Math.min(
    Number(payout?.refundedKeyCount || 0),
    Math.max(totalKeys - frozenKeys, 0)
  );
  const availableKeys = Math.max(totalKeys - frozenKeys - refundedKeys, 0);

  const originalNet =
    typeof payout?.originalNetAmount === 'number'
      ? payout.originalNetAmount
      : Number(payout?.netAmount ?? payout?.amount ?? 0);
  const perKeyNet = totalKeys > 0 ? Math.round((originalNet / totalKeys) * 100) / 100 : 0;

  const frozen = Math.max(0, Number(payout?.frozenAmount || 0));
  const refunded = Math.round(perKeyNet * refundedKeys * 100) / 100;
  const available = Math.max(0, Math.round((originalNet - frozen - refunded) * 100) / 100);

  let derivedStatus = payout?.status || 'pending';
  if (totalKeys > 0) {
    if (refundedKeys === totalKeys) derivedStatus = 'refunded';
    else if (frozenKeys === totalKeys) derivedStatus = 'frozen';
    else if (frozenKeys > 0 || refundedKeys > 0) derivedStatus = 'partial';
  }

  return {
    total: Math.round(originalNet * 100) / 100,
    available,
    frozen: Math.round(frozen * 100) / 100,
    refunded,
    totalKeys,
    frozenKeys,
    refundedKeys,
    availableKeys,
    hasFrozen: frozen > 0,
    hasRefunded: refunded > 0,
    derivedStatus,
  };
};

const ALLOWED_TABS = ['withdrawals', 'history', 'settings'];

const SellerEarnings = () => {
  const { formatSettlement } = useCurrency();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);

  // Phase 6 / Step 12 PART A — controlled tab + deep-link to a specific
  // withdrawal row via ?tab=withdrawals&id=<withdrawalId>.
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const tabParam = queryParams.get('tab') || '';
  const activeTab = useMemo(
    () => (ALLOWED_TABS.includes(tabParam) ? tabParam : 'withdrawals'),
    [tabParam]
  );
  const highlightWithdrawalId = queryParams.get('id') || null;
  const highlightedRowRef = useRef(null);

  const balanceQuery = useQuery({
    queryKey: ['seller-balance'],
    queryFn: () => sellerAPI.getPayoutBalance().then((res) => res.data.data),
    refetchInterval: 30_000,
  });

  const settingsQuery = useQuery({
    queryKey: ['public-payout-settings'],
    queryFn: () => sellerAPI.getPublicPayoutSettings().then((res) => res.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const holdDays =
    typeof settingsQuery.data?.payoutHoldDays === 'number' ? settingsQuery.data.payoutHoldDays : 15;
  // Same query key as the dashboard, so this is a cache read, not a second call.
  const { commissionRatePercent, featuredCommissionPercent } = settingsQuery.data ?? {};
  const minWithdrawal =
    typeof settingsQuery.data?.minimumWithdrawalUsd === 'number'
      ? settingsQuery.data.minimumWithdrawalUsd
      : 50;

  const historyQuery = useQuery({
    queryKey: ['withdrawal-history'],
    queryFn: () => sellerAPI.getMyPayouts({ page: 1, limit: 100 }).then((res) => res.data.data),
    retry: false,
  });

  const withdrawalsQuery = useQuery({
    queryKey: ['seller-withdrawals'],
    queryFn: () => sellerAPI.listMyWithdrawals({ page: 1, limit: 50 }).then((res) => res.data.data),
    retry: false,
    refetchInterval: 30_000,
  });
  const withdrawals = useMemo(() => withdrawalsQuery.data?.rows || [], [withdrawalsQuery.data]);

  const payoutAccountQuery = useQuery({
    queryKey: ['payout-account'],
    queryFn: () => sellerAPI.getMyPayoutAccount().then((res) => res.data.data),
    staleTime: 30_000,
  });
  const accounts = useMemo(
    () => payoutAccountQuery.data?.accounts || [],
    [payoutAccountQuery.data]
  );

  const reportsQuery = useQuery({
    queryKey: ['payout-reports'],
    queryFn: () => sellerAPI.getPayoutReports().then((res) => res.data.data),
    retry: false,
  });

  // Real-time refresh on withdrawal lifecycle events.
  useEffect(() => {
    if (!socket || !isConnected) return undefined;
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['seller-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['seller-balance'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawal-history'] });
    };
    const events = [
      'withdrawal_requested',
      'withdrawal_approved',
      'withdrawal_rejected',
      'withdrawal_processing',
      'withdrawal_sent',
      'withdrawal_failed',
    ];
    events.forEach((ev) => socket.on(ev, invalidate));
    return () => events.forEach((ev) => socket.off(ev, invalidate));
  }, [socket, isConnected, queryClient]);

  const handleTabChange = (next) => {
    const params = new URLSearchParams(location.search);
    if (next && next !== 'withdrawals') params.set('tab', next);
    else params.delete('tab');
    if (next !== 'withdrawals') params.delete('id');
    const search = params.toString();
    navigate(`${location.pathname}${search ? `?${search}` : ''}`, { replace: true });
  };

  // Step 12 PART A — scroll to a deep-linked withdrawal row once it exists.
  useEffect(() => {
    if (!highlightWithdrawalId || activeTab !== 'withdrawals') return undefined;
    if (!withdrawals.some((w) => String(w._id) === String(highlightWithdrawalId))) return undefined;
    const t = setTimeout(() => {
      try {
        highlightedRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch {
        /* noop */
      }
    }, 0);
    return () => clearTimeout(t);
  }, [highlightWithdrawalId, activeTab, withdrawals]);

  const balance = balanceQuery.data;
  const availableBalance = Number(balance?.available || 0);
  const canWithdraw =
    availableBalance >= minWithdrawal && accounts.some((a) => a.status === 'verified');
  const payoutRows =
    historyQuery.data?.payouts?.length > 0 ? historyQuery.data.payouts : historyQuery.data?.docs || [];

  const withdrawReason = () => {
    if (accounts.length === 0) return 'Connect a payout method first.';
    if (!accounts.some((a) => a.status === 'verified')) return 'Verify a payout method to enable.';
    return `Minimum withdrawal is ${formatSettlement(minWithdrawal)}.`;
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-fg">Earnings &amp; payouts</h1>
          <p className="mt-1 text-sm text-fg-muted">
            What you've made, what's on hold, and how to get paid.
          </p>
          {/* The CURRENT rates, deliberately here and not beside the period
              totals below: those were charged at whatever rate applied when each
              sale completed, so quoting today's rate next to them would misread. */}
          {typeof commissionRatePercent === 'number' && (
            <p className="mt-1 text-xs text-fg-subtle">
              Commission {commissionRatePercent}%
              {featuredCommissionPercent > 0 && ` · +${featuredCommissionPercent}% while featured`} · set by
              DGMARQ, charged when a sale completes
            </p>
          )}
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <Button type="button" disabled={!canWithdraw} onClick={() => setWithdrawalModalOpen(true)}>
            <ArrowUpRight aria-hidden="true" />
            Request withdrawal
          </Button>
          {!canWithdraw && <p className="text-xs text-fg-subtle">{withdrawReason()}</p>}
        </div>
      </header>

      {/* ── Balance tiles ────────────────────────────────────────────────── */}
      {balanceQuery.isPending ? (
        <StatCardGridSkeleton count={4} />
      ) : balanceQuery.isError ? (
        <Card variant="hud">
          <CardContent>
            <ErrorState
              compact
              error={balanceQuery.error}
              title="Couldn't load your balance"
              onRetry={() => balanceQuery.refetch()}
            />
          </CardContent>
        </Card>
      ) : (
        <StatCardGrid>
          <StatCard
            title="Available"
            value={formatSettlement(availableBalance)}
            icon={Wallet}
            tone="success"
            description="Open withdrawals already deducted"
          />
          <StatCard
            title="On hold"
            value={formatSettlement(balance?.pending?.amount)}
            icon={Clock}
            tone="warning"
            description={`Released ${holdDays} days after each order`}
          />
          <StatCard
            title="In flight"
            value={formatSettlement(balance?.inFlight?.amount)}
            icon={Send}
            tone="info"
            description={`${balance?.inFlight?.count || 0} withdrawal(s) processing`}
          />
          <StatCard
            title="Paid out"
            value={formatSettlement(balance?.released?.amount)}
            icon={CheckCircle2}
            tone="neutral"
            description="Lifetime, sent to your account"
          />
        </StatCardGrid>
      )}

      {/* Conditional callouts — only when they apply, so they stay meaningful. */}
      {balance?.frozen?.amount > 0 && (
        <Card variant="sunken">
          <CardContent className="flex items-start gap-3">
            <Snowflake aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-info" />
            <div>
              <h3 className="text-sm font-semibold text-fg">
                {formatSettlement(balance.frozen.amount)} frozen
              </h3>
              <p className="mt-1 text-sm text-fg-muted">
                {balance.frozen.count} earning line(s) are paused while refund requests are
                reviewed. Frozen money is released back to you if the request is rejected.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {balance?.pending?.amount > 0 && balance?.pending?.daysUntilAvailable > 0 && (
        <Card variant="sunken">
          <CardContent className="flex items-start gap-3">
            <Clock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
            <div>
              <h3 className="text-sm font-semibold text-fg">Earnings on hold</h3>
              <p className="mt-1 text-sm text-fg-muted">
                {formatSettlement(balance.pending.amount)} becomes available{' '}
                {balance.pending.daysUntilAvailable} day
                {balance.pending.daysUntilAvailable > 1 ? 's' : ''} from now. Every sale is held for{' '}
                {holdDays} days after the order completes, which is what lets us honour buyer
                refunds without clawing money back from you.
                {balance.pending.earliestReleaseDate && (
                  <span className="mt-1 block text-xs text-fg-subtle">
                    Earliest release: {formatDateTime(balance.pending.earliestReleaseDate)}
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {accounts.length === 0 && !payoutAccountQuery.isPending && (
        <Card variant="sunken">
          <CardContent className="flex items-start gap-3">
            <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
            <div>
              <h3 className="text-sm font-semibold text-fg">No payout method connected</h3>
              <p className="mt-1 text-sm text-fg-muted">
                You can keep selling, but you cannot withdraw until a PayPal payout account is
                connected.{' '}
                <Link
                  to="/seller/payout-account"
                  className="text-accent-on-dark underline-offset-4 hover:underline"
                >
                  Connect one now
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="withdrawals">
            <ArrowUpRight aria-hidden="true" className="mr-2 size-4" />
            Withdrawals
          </TabsTrigger>
          <TabsTrigger value="history">
            <History aria-hidden="true" className="mr-2 size-4" />
            Earning lines
          </TabsTrigger>
          <TabsTrigger value="settings">
            <FileText aria-hidden="true" className="mr-2 size-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* ── Withdrawals ───────────────────────────────────────────────── */}
        <TabsContent value="withdrawals">
          <Card variant="hud">
            <CardHeader>
              <CardTitle>Your withdrawal requests</CardTitle>
              <p className="mt-1 text-sm text-fg-muted">
                Each request is reviewed by an admin, then queued for automatic processing within
                1–2 hours.
              </p>
            </CardHeader>
            <CardContent>
              {withdrawalsQuery.isError ? (
                <ErrorState
                  error={withdrawalsQuery.error}
                  title="Couldn't load your withdrawals"
                  onRetry={() => withdrawalsQuery.refetch()}
                />
              ) : (
                <>
                  <div className="hidden md:block">
                    <Table variant="hud">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Method</TableHead>
                          <TableHead numeric>Requested</TableHead>
                          <TableHead numeric>Fee</TableHead>
                          <TableHead numeric>Net</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>When</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {withdrawalsQuery.isPending ? (
                          <TableRowsSkeleton rows={4} cols={6} />
                        ) : withdrawals.length === 0 ? (
                          <TableEmptyRow colSpan={6}>
                            <EmptyState
                              icon={ArrowUpRight}
                              title="No withdrawals yet"
                              description="Once your available balance clears the minimum, request your first withdrawal from the button above."
                            />
                          </TableEmptyRow>
                        ) : (
                          withdrawals.map((w) => {
                            const isHighlighted =
                              highlightWithdrawalId &&
                              String(w._id) === String(highlightWithdrawalId);
                            return (
                              <TableRow
                                key={w._id}
                                ref={isHighlighted ? highlightedRowRef : undefined}
                                className={isHighlighted ? 'bg-accent-soft' : undefined}
                              >
                                <TableCell>{METHOD_LABEL[w.methodType] || w.methodType}</TableCell>
                                <TableCell numeric>{formatSettlement(w.requestedAmount)}</TableCell>
                                <TableCell numeric>
                                  {formatSettlement(w.providerFee)}
                                  {w.fallbackUsed && (
                                    <Badge variant="warning" className="ml-2">
                                      fallback
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell numeric className="font-semibold text-success">
                                  {formatSettlement(w.netAmount)}
                                </TableCell>
                                <TableCell>
                                  <Badge {...payoutBadgeProps(w.status)} />
                                  {(w.rejectionReason || w.failureReason) && (
                                    <p className="mt-1 max-w-xs text-xs text-danger">
                                      {w.rejectionReason || w.failureReason}
                                    </p>
                                  )}
                                </TableCell>
                                <TableCell
                                  className="text-fg-muted"
                                  title={formatExactTitle(w.createdAt)}
                                >
                                  {formatRelativeDate(w.createdAt)}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="md:hidden">
                    {withdrawalsQuery.isPending ? (
                      <CardListSkeleton rows={3} />
                    ) : withdrawals.length === 0 ? (
                      <EmptyState
                        icon={ArrowUpRight}
                        title="No withdrawals yet"
                        description="Once your available balance clears the minimum, request your first withdrawal."
                      />
                    ) : (
                      <ul className="space-y-3">
                        {withdrawals.map((w) => (
                          <li
                            key={w._id}
                            className="rounded-xl border border-brand-cyan/12 bg-brand-cyan/3 p-4"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold tabular-nums text-fg">
                                {formatSettlement(w.requestedAmount)}
                              </span>
                              <Badge {...payoutBadgeProps(w.status)} />
                            </div>
                            <p className="mt-2 text-xs text-fg-muted">
                              Net{' '}
                              <span className="font-medium text-success">
                                {formatSettlement(w.netAmount)}
                              </span>{' '}
                              after {formatSettlement(w.providerFee)} fee ·{' '}
                              {METHOD_LABEL[w.methodType] || w.methodType}
                            </p>
                            <p className="mt-1 text-xs text-fg-subtle">
                              {formatRelativeDate(w.createdAt)}
                            </p>
                            {(w.rejectionReason || w.failureReason) && (
                              <p className="mt-2 text-xs text-danger">
                                {w.rejectionReason || w.failureReason}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Earning lines ─────────────────────────────────────────────── */}
        <TabsContent value="history">
          <Card variant="hud">
            <CardHeader>
              <CardTitle>Earning lines</CardTitle>
              <p className="mt-1 text-sm text-fg-muted">
                Per-order earnings, with their hold and release status.
              </p>
            </CardHeader>
            <CardContent>
              {historyQuery.isError ? (
                <ErrorState
                  error={historyQuery.error}
                  title="Couldn't load your earning lines"
                  onRetry={() => historyQuery.refetch()}
                />
              ) : (
                <>
                  <div className="hidden md:block">
                    <Table variant="hud">
                      <TableHeader>
                        <TableRow>
                          <TableHead numeric>Total</TableHead>
                          <TableHead numeric>Available</TableHead>
                          <TableHead>Frozen / refunded</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead numeric>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyQuery.isPending ? (
                          <TableRowsSkeleton rows={6} cols={6} />
                        ) : payoutRows.length === 0 ? (
                          <TableEmptyRow colSpan={6}>
                            <EmptyState
                              icon={History}
                              title="No earning lines yet"
                              description="Each completed sale adds a line here showing what you earned and when it clears."
                            />
                          </TableEmptyRow>
                        ) : (
                          payoutRows.map((payout) => {
                            const split = splitPayoutRow(payout);
                            const meta = payoutBadgeProps(split.derivedStatus);
                            return (
                              <TableRow key={payout._id}>
                                <TableCell numeric>
                                  <div className="font-semibold text-fg">
                                    {formatSettlement(split.total)}
                                  </div>
                                  {split.totalKeys > 0 && (
                                    <div className="mt-0.5 text-xs text-fg-subtle">
                                      {split.totalKeys} key{split.totalKeys === 1 ? '' : 's'}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell numeric>
                                  <span
                                    className={
                                      split.available > 0
                                        ? 'font-semibold text-success'
                                        : 'font-semibold text-fg-subtle'
                                    }
                                  >
                                    {formatSettlement(split.available)}
                                  </span>
                                  {split.totalKeys > 0 && split.availableKeys < split.totalKeys && (
                                    <div className="mt-0.5 text-xs text-fg-subtle">
                                      {split.availableKeys} of {split.totalKeys}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {split.hasFrozen || split.hasRefunded ? (
                                    <div className="space-y-1">
                                      {split.hasFrozen && (
                                        <span className="flex items-center gap-1.5 text-sm font-medium text-info">
                                          <Snowflake aria-hidden="true" className="size-3.5" />
                                          {formatSettlement(split.frozen)} frozen
                                        </span>
                                      )}
                                      {split.hasRefunded && (
                                        <span className="flex items-center gap-1.5 text-sm font-medium text-danger">
                                          <AlertCircle aria-hidden="true" className="size-3.5" />
                                          {formatSettlement(split.refunded)} refunded
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-fg-subtle">—</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge {...meta} />
                                </TableCell>
                                <TableCell
                                  className="text-fg-muted"
                                  title={formatExactTitle(payout.createdAt)}
                                >
                                  {formatRelativeDate(payout.createdAt)}
                                </TableCell>
                                <TableCell numeric>
                                  <Button asChild size="sm" variant="outline">
                                    <Link to={`/seller/earnings/${payout._id}`}>
                                      <Eye aria-hidden="true" />
                                      Details
                                    </Link>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="md:hidden">
                    {historyQuery.isPending ? (
                      <CardListSkeleton rows={4} />
                    ) : payoutRows.length === 0 ? (
                      <EmptyState
                        icon={History}
                        title="No earning lines yet"
                        description="Each completed sale adds a line here."
                      />
                    ) : (
                      <ul className="space-y-3">
                        {payoutRows.map((payout) => {
                          const split = splitPayoutRow(payout);
                          const meta = payoutBadgeProps(split.derivedStatus);
                          return (
                            <li
                              key={payout._id}
                              className="rounded-xl border border-brand-cyan/12 bg-brand-cyan/3 p-4"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold tabular-nums text-fg">
                                  {formatSettlement(split.total)}
                                </span>
                                <Badge {...meta} />
                              </div>
                              <p className="mt-2 text-xs text-fg-muted">
                                Available{' '}
                                <span className="font-medium text-success">
                                  {formatSettlement(split.available)}
                                </span>
                                {split.hasFrozen && ` · ${formatSettlement(split.frozen)} frozen`}
                                {split.hasRefunded && ` · ${formatSettlement(split.refunded)} refunded`}
                              </p>
                              <p className="mt-1 text-xs text-fg-subtle">
                                {formatRelativeDate(payout.createdAt)}
                              </p>
                              <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="mt-3 w-full"
                              >
                                <Link to={`/seller/earnings/${payout._id}`}>
                                  <Eye aria-hidden="true" />
                                  Details
                                </Link>
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Reports ───────────────────────────────────────────────────── */}
        <TabsContent value="settings">
          <Card variant="hud">
            <CardHeader>
              <CardTitle>Payout reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reportsQuery.isPending ? (
                <div className="space-y-3">
                  <Skeleton className="h-28 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </div>
              ) : reportsQuery.isError ? (
                <ErrorState
                  error={reportsQuery.error}
                  title="Couldn't load your reports"
                  onRetry={() => reportsQuery.refetch()}
                />
              ) : !reportsQuery.data?.summary && !reportsQuery.data?.payouts?.length ? (
                <EmptyState
                  icon={FileText}
                  title="No reports yet"
                  description="Reports build up as your payouts are released."
                />
              ) : (
                <>
                  {reportsQuery.data.summary && (
                    <div className="rounded-xl border border-brand-cyan/12 bg-brand-cyan/3 p-4">
                      <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                        <div>
                          <dt className="mb-1 text-xs text-fg-subtle">Total payouts</dt>
                          <dd className="font-semibold tabular-nums text-fg">
                            {formatSettlement(reportsQuery.data.summary.totalAmount)}
                          </dd>
                        </div>
                        <div>
                          <dt className="mb-1 text-xs text-fg-subtle">Count</dt>
                          <dd className="font-semibold tabular-nums text-fg">
                            {reportsQuery.data.summary.totalPayouts || 0}
                          </dd>
                        </div>
                        <div>
                          <dt className="mb-1 text-xs text-fg-subtle">Commission</dt>
                          <dd className="font-semibold tabular-nums text-fg">
                            {formatSettlement(reportsQuery.data.summary.totalCommission)}
                          </dd>
                        </div>
                        <div>
                          <dt className="mb-1 text-xs text-fg-subtle">Period</dt>
                          <dd className="text-xs font-semibold text-fg">
                            {reportsQuery.data.period?.startDate
                              ? `${formatRelativeDate(reportsQuery.data.period.startDate)} – ${formatRelativeDate(reportsQuery.data.period.endDate)}`
                              : 'All time'}
                          </dd>
                        </div>
                      </dl>
                      {reportsQuery.data.summary.byStatus &&
                        Object.keys(reportsQuery.data.summary.byStatus).length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2 border-t border-brand-cyan/10 pt-4">
                            {Object.entries(reportsQuery.data.summary.byStatus).map(
                              ([status, count]) => (
                                <Badge
                                  key={status}
                                  {...payoutBadgeProps(status)}
                                >
                                  {status}: {count}
                                </Badge>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  )}

                  {reportsQuery.data.payouts?.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-fg">Recent payouts</h3>
                      {reportsQuery.data.payouts.slice(0, 10).map((payout) => (
                        <div
                          key={payout.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-brand-cyan/12 bg-brand-cyan/3 p-3"
                        >
                          <div className="min-w-0">
                            <p className="font-mono text-xs text-fg">
                              {payout.orderNumber || payout.id?.toString().slice(-8)}
                            </p>
                            {payout.createdAt && (
                              <p className="mt-0.5 text-xs text-fg-subtle">
                                {formatRelativeDate(payout.createdAt)}
                                {payout.commission
                                  ? ` · ${formatSettlement(payout.commission)} commission`
                                  : ''}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-semibold tabular-nums text-fg">
                              {formatSettlement(payout.amount)}
                            </p>
                            <Badge
                              {...payoutBadgeProps(payout.status)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <WithdrawalRequestModal
        open={withdrawalModalOpen}
        onOpenChange={setWithdrawalModalOpen}
        balance={balance}
        accounts={accounts}
      />
    </div>
  );
};

export default SellerEarnings;
