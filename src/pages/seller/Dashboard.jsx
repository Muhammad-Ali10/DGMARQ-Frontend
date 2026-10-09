import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { sellerAPI, offerAPI, returnRefundAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';
import { StatCard, StatCardGrid } from '@components/common/StatCard';
import { SpecList, SpecRow } from '@components/common/SpecList';
import { StatCardGridSkeleton } from '@components/common/Skeletons';
import { StatusBadge } from '@components/common/StatusBadge';
import { EmptyState } from '@components/common/EmptyState';
import { ErrorState } from '@components/common/ErrorState';
import useCurrency from '@hooks/useCurrency';
import {
  DollarSign,
  ShoppingCart,
  ScaleIcon,
  Wallet,
  User,
  Package,
  Clock,
  XCircle,
  EyeOff,
  PackageX,
  MessageSquareWarning,
  CreditCard,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

const SellerDashboard = () => {
  const { formatSettlement } = useCurrency();
  const sellerQuery = useQuery({
    queryKey: ['seller-info'],
    queryFn: () => sellerAPI.getSellerInfo().then((res) => res.data.data),
    refetchOnWindowFocus: true,
  });

  const balanceQuery = useQuery({
    queryKey: ['seller-balance'],
    queryFn: () => sellerAPI.getPayoutBalance().then((res) => res.data.data),
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });

  const metricsQuery = useQuery({
    queryKey: ['seller-performance-metrics'],
    queryFn: () => sellerAPI.getPerformanceMetrics().then((res) => res.data.data),
    refetchOnWindowFocus: true,
  });

  const settingsQuery = useQuery({
    queryKey: ['public-payout-settings'],
    queryFn: () => sellerAPI.getPublicPayoutSettings().then((res) => res.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const offersQuery = useQuery({
    queryKey: ['seller-offers-overview'],
    queryFn: () => offerAPI.getMyOfferSummary().then((r) => r.data.data),
    staleTime: 60_000,
  });

  const disputesQuery = useQuery({
    queryKey: ['seller-disputes-awaiting'],
    queryFn: () =>
      returnRefundAPI
        .getSellerRefundList({ awaiting: 'feedback', limit: 1 })
        .then((r) => r.data.data),
    staleTime: 60_000,
  });

  const payoutAccountQuery = useQuery({
    queryKey: ['payout-account'],
    queryFn: () => sellerAPI.getMyPayoutAccount().then((r) => r.data.data),
    staleTime: 30_000,
    retry: 1,
  });

  const holdDays =
    typeof settingsQuery.data?.payoutHoldDays === 'number' ? settingsQuery.data.payoutHoldDays : 15;
  const { commissionRatePercent, featuredCommissionPercent } = settingsQuery.data ?? {};

  const balance = balanceQuery.data;
  const metrics = metricsQuery.data;
  const counts = offersQuery.data ?? {};
  const offersTotal = counts.total ?? 0;
  const disputesAwaiting = disputesQuery.data?.pagination?.total ?? 0;
  const accounts = payoutAccountQuery.data?.accounts ?? [];
  const hasVerifiedPayout = accounts.some((a) => a?.status === 'verified');

  const actions = [
    disputesAwaiting > 0 && {
      key: 'disputes',
      icon: MessageSquareWarning,
      tone: 'danger',
      title: `${disputesAwaiting} refund request${disputesAwaiting === 1 ? '' : 's'} waiting for your side`,
      body: 'A buyer has asked for a refund and an admin will decide it. Add your feedback so the decision hears both sides.',
      to: '/seller/return-refunds',
      cta: 'Review requests',
    },
    counts.outOfStock > 0 && {
      key: 'oos',
      icon: PackageX,
      tone: 'danger',
      title: `${counts.outOfStock} live listing${counts.outOfStock === 1 ? '' : 's'} out of stock`,
      body: 'These are visible but unbuyable, and are auto-delisted after 14 days without stock.',
      to: '/seller/license-keys',
      cta: 'Add inventory',
    },
    counts.rejected > 0 && {
      key: 'rejected',
      icon: XCircle,
      tone: 'danger',
      title: `${counts.rejected} offer${counts.rejected === 1 ? '' : 's'} rejected`,
      body: 'Check the rejection reason, fix the listing and resubmit.',
      to: '/seller/offers',
      cta: 'View offers',
    },
    counts.lowStock > 0 && {
      key: 'low',
      icon: Package,
      tone: 'warning',
      title: `${counts.lowStock} listing${counts.lowStock === 1 ? '' : 's'} low on stock`,
      body: `${counts.lowStockThreshold} keys or fewer remaining. Restock before you sell out.`,
      to: '/seller/license-keys',
      cta: 'Add inventory',
    },
    counts.delisted > 0 && {
      key: 'delisted',
      icon: EyeOff,
      tone: 'warning',
      title: `${counts.delisted} listing${counts.delisted === 1 ? '' : 's'} delisted`,
      body: 'Delisted offers earn nothing. Restocking an out-of-stock offer brings it back automatically.',
      to: '/seller/offers',
      cta: 'View offers',
    },
    !hasVerifiedPayout &&
      !payoutAccountQuery.isPending && {
        key: 'payout',
        icon: CreditCard,
        tone: 'warning',
        title: 'No verified payout method',
        body: 'You can sell, but you cannot withdraw until a payout method is connected and verified.',
        to: '/seller/payout-account',
        cta: 'Connect payout',
      },
    counts.pending > 0 && {
      key: 'pending',
      icon: Clock,
      tone: 'info',
      title: `${counts.pending} offer${counts.pending === 1 ? '' : 's'} awaiting approval`,
      body: 'Nothing to do — an admin is reviewing these. They go live once approved.',
      to: '/seller/offers',
      cta: 'View offers',
    },
  ].filter(Boolean);

  const queueLoading = offersQuery.isPending || disputesQuery.isPending;
  const queueError = offersQuery.isError || disputesQuery.isError;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-fg">
              {sellerQuery.data?.shopName || 'Your shop'}
            </h1>
            {sellerQuery.data?.status && (
              <StatusBadge domain="sellerAccount" status={sellerQuery.data.status} />
            )}
          </div>
          <p className="mt-1 text-sm text-fg-muted">
            {offersTotal} listing{offersTotal === 1 ? '' : 's'} on the catalog
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              sessionStorage.setItem('allowCustomerAccess', 'true');
              window.location.href = '/user/dashboard';
            }}
          >
            <User aria-hidden="true" />
            Buyer view
          </Button>
          <Button asChild>
            <Link to="/seller/catalog">
              <Package aria-hidden="true" />
              List a product
            </Link>
          </Button>
        </div>
      </header>

      {metricsQuery.isPending || balanceQuery.isPending ? (
        <StatCardGridSkeleton count={4} />
      ) : metricsQuery.isError && balanceQuery.isError ? (
        <Card variant="hud">
          <CardContent>
            <ErrorState
              compact
              error={metricsQuery.error}
              title="Couldn't load your figures"
              onRetry={() => {
                metricsQuery.refetch();
                balanceQuery.refetch();
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <StatCardGrid>
          <StatCard
            title="Revenue"
            value={formatSettlement(metrics?.sales?.totalRevenue)}
            icon={DollarSign}
            tone="success"
            description="All time, after refunds"
          />
          <StatCard
            title="Keys sold"
            value={metrics?.sales?.totalSales ?? 0}
            icon={ShoppingCart}
            tone="accent"
            description="Units delivered"
            href="/seller/orders"
          />
          <StatCard
            title="Available balance"
            value={formatSettlement(balance?.available)}
            icon={Wallet}
            tone="info"
            description="Ready to withdraw"
            href="/seller/earnings"
          />
          <StatCard
            title="Dispute rate"
            value={`${metrics?.disputes?.rate ?? 0}%`}
            icon={ScaleIcon}
            tone={(metrics?.disputes?.rate ?? 0) > 5 ? 'danger' : 'neutral'}
            description={`${metrics?.disputes?.count ?? 0} of ${metrics?.disputes?.orders ?? 0} orders`}
            href="/seller/return-refunds"
          />
        </StatCardGrid>
      )}

      <Card variant="hud">
        <CardHeader>
          <CardTitle>Needs your attention</CardTitle>
        </CardHeader>
        <CardContent>
          {queueLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : queueError ? (
            <ErrorState
              compact
              error={offersQuery.error || disputesQuery.error}
              title="Couldn't build your action list"
              onRetry={() => {
                offersQuery.refetch();
                disputesQuery.refetch();
              }}
            />
          ) : actions.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              tone="success"
              title="You're all caught up"
              description="No disputes, no stock problems, nothing waiting on approval. Good place to be."
            />
          ) : (
            <ul className="space-y-3">
              {actions.map(({ key, icon: Icon, tone, title, body, to, cta }) => (
                <li key={key}>
                  <Link
                    to={to}
                    className="row-link group flex items-start gap-3 rounded-xl border border-brand-cyan/12 bg-brand-cyan/3 p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-md ${
                        tone === 'danger'
                          ? 'bg-danger-soft text-danger'
                          : tone === 'warning'
                            ? 'bg-warning-soft text-warning'
                            : 'bg-info-soft text-info'
                      }`}
                    >
                      <Icon aria-hidden="true" className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-fg">{title}</p>
                      <p className="mt-0.5 text-xs text-fg-muted">{body}</p>
                    </div>
                    <span className="hidden shrink-0 items-center gap-1 self-center text-xs font-medium text-accent-on-dark sm:flex">
                      {cta}
                      <ChevronRight aria-hidden="true" className="size-3.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

        </CardContent>
      </Card>

      <Card variant="hud">
        <CardHeader>
          <CardTitle>Earnings breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {balanceQuery.isPending || metricsQuery.isPending ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : (
            <SpecList>
              <SpecRow
                label="On hold"
                hint={`Released ${holdDays} days after each order completes`}
                value={formatSettlement(balance?.pending?.amount)}
                tone="warning"
              />
              {balance?.frozen?.amount > 0 && (
                <SpecRow
                  label="Frozen"
                  hint={`${balance.frozen.count} line(s) paused by refund requests`}
                  value={formatSettlement(balance.frozen.amount)}
                  tone="info"
                />
              )}
              {typeof commissionRatePercent === 'number' && (
                <SpecRow
                  label="Commission rate"
                  hint="Set by DGMARQ · charged when a sale completes"
                  value={`${commissionRatePercent}%`}
                />
              )}
              {featuredCommissionPercent > 0 && (
                <SpecRow
                  label="Featured surcharge"
                  hint="Added on top while a listing is featured"
                  value={`+${featuredCommissionPercent}%`}
                />
              )}
              <SpecRow
                label="Platform commission"
                hint="Deducted from gross revenue"
                value={formatSettlement(metrics?.sales?.totalCommission)}
              />
              <SpecRow
                label="Net earnings"
                hint="Your share, all time"
                value={formatSettlement(metrics?.sales?.netEarnings)}
                tone="success"
              />
              <SpecRow label="Paid out" hint="Lifetime, sent to your account" value={formatSettlement(balance?.released?.amount)} />
            </SpecList>
          )}

          <Button asChild variant="outline" className="mt-4 w-full sm:w-auto">
            <Link to="/seller/earnings">Go to earnings &amp; payouts</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerDashboard;
