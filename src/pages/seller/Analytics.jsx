import { useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { analyticsAPI, sellerAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import SafeImage from '@components/ui/safe-image';
import { StatCard, StatCardGrid } from '@components/common/StatCard';
import { StatCardGridSkeleton } from '@components/common/Skeletons';
import { EmptyState } from '@components/common/EmptyState';
import { ErrorState } from '@components/common/ErrorState';
import { Skeleton } from '@components/ui/skeleton';
import { formatUSD } from '@lib/money';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Package, Trophy } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

/**
 * Seller analytics.
 *
 * NO CHART LIBRARY. `getSellerMonthlyAnalytics` returns aggregate totals for one
 * period plus `topProducts` — there is no time series anywhere in the API, so a
 * revenue-over-time line would have nothing to plot. Rather than add ~50KB of
 * charting to render a single bar, the one genuinely comparative dataset
 * (topProducts) is drawn as a horizontal bar list from divs and token colours:
 * bars proportional to value, sorted descending, each value direct-labelled at
 * the end of its own bar so no legend or axis is required. Costs zero KB.
 *
 * KPI tiles carry no trend delta for the same reason — the endpoint returns
 * `allTime*` totals, which are a different thing from a prior-period comparison
 * and cannot honestly be rendered as "up 12%".
 */
const SellerAnalytics = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const mode = searchParams.get('mode') === 'range' ? 'range' : 'month';
  const month = Number(searchParams.get('month')) || now.getMonth() + 1;
  const year = Number(searchParams.get('year')) || CURRENT_YEAR;
  const startDate = searchParams.get('from') || '';
  const endDate = searchParams.get('to') || '';

  const updateParams = useCallback(
    (next) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(next)) {
            if (v === null || v === '' || v === undefined) params.delete(k);
            else params.set(k, String(v));
          }
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const rangeReady = mode === 'range' && startDate && endDate;

  const analyticsQuery = useQuery({
    queryKey: ['seller-analytics', mode, month, year, startDate, endDate],
    queryFn: () =>
      analyticsAPI
        .getSellerMonthlyAnalytics(rangeReady ? { startDate, endDate } : { month, year })
        .then((res) => res.data.data),
    placeholderData: keepPreviousData,
    retry: 2,
  });

  const balanceQuery = useQuery({
    queryKey: ['seller-balance'],
    queryFn: () => sellerAPI.getPayoutBalance().then((res) => res.data.data),
    staleTime: 60 * 1000,
  });

  const analytics = analyticsQuery.data;
  const topProducts = analytics?.topProducts ?? [];
  const maxRevenue = Math.max(...topProducts.map((p) => Number(p.revenue) || 0), 0);

  const periodLabel = rangeReady
    ? `${startDate} → ${endDate}`
    : `${MONTHS[(month || 1) - 1]} ${year}`;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-fg">Analytics</h1>
        <p className="mt-1 text-sm text-fg-muted">
          How your listings performed over a period you choose.
        </p>
      </header>

      {/* ── Period picker ───────────────────────────────────────────────── */}
      <Card variant="hud">
        <CardHeader>
          <CardTitle>Period</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={mode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateParams({ mode: null, from: null, to: null })}
            >
              By month
            </Button>
            <Button
              variant={mode === 'range' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateParams({ mode: 'range' })}
            >
              Date range
            </Button>
          </div>

          {mode === 'month' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="analytics-month">Month</Label>
                <Select
                  value={String(month)}
                  onValueChange={(v) => updateParams({ month: v })}
                >
                  <SelectTrigger id="analytics-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={m} value={String(i + 1)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="analytics-year">Year</Label>
                <Select value={String(year)} onValueChange={(v) => updateParams({ year: v })}>
                  <SelectTrigger id="analytics-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="analytics-from">Start date</Label>
                <Input
                  id="analytics-from"
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => updateParams({ from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="analytics-to">End date</Label>
                <Input
                  id="analytics-to"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => updateParams({ to: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => updateParams({ mode: null, from: null, to: null })}
                >
                  Reset
                </Button>
              </div>
            </div>
          )}

          <p className="text-xs text-fg-subtle">
            {mode === 'range' && !rangeReady
              ? 'Pick both dates to apply the range.'
              : `Showing ${periodLabel}.`}
          </p>
        </CardContent>
      </Card>

      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      {analyticsQuery.isPending ? (
        <StatCardGridSkeleton count={4} />
      ) : analyticsQuery.isError ? (
        <Card variant="hud">
          <CardContent>
            <ErrorState
              error={analyticsQuery.error}
              title="Couldn't load analytics"
              onRetry={() => analyticsQuery.refetch()}
            />
          </CardContent>
        </Card>
      ) : (
        <StatCardGrid>
          <StatCard
            title="Revenue"
            value={formatUSD(analytics?.totalRevenue ?? analytics?.sales?.revenue)}
            icon={DollarSign}
            tone="success"
            description={periodLabel}
          />
          <StatCard
            title="Keys sold"
            value={analytics?.totalSales ?? analytics?.sales?.total ?? 0}
            icon={ShoppingCart}
            tone="accent"
            description={`${analytics?.totalOrders ?? 0} orders`}
          />
          <StatCard
            title="Net earnings"
            value={formatUSD(analytics?.netEarnings ?? analytics?.earnings?.total)}
            icon={TrendingUp}
            tone="info"
            description="After commission"
          />
          <StatCard
            title="Average order"
            value={formatUSD(analytics?.averageOrderValue)}
            icon={BarChart3}
            tone="neutral"
            description="Per order, this period"
          />
        </StatCardGrid>
      )}

      {/* ── Top products: a bar list, not a chart library ────────────────── */}
      <Card variant="hud">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy aria-hidden="true" className="size-4" />
            Best sellers
          </CardTitle>
          <p className="mt-1 text-sm text-fg-muted">By revenue, {periodLabel}.</p>
        </CardHeader>
        <CardContent>
          {analyticsQuery.isPending ? (
            <div className="space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-2.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : analyticsQuery.isError ? null : topProducts.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No sales in this period"
              description="Pick a different period, or keep your listings in stock to start building a history."
            />
          ) : (
            <ol className="space-y-4">
              {[...topProducts]
                .sort((a, b) => (Number(b.revenue) || 0) - (Number(a.revenue) || 0))
                .map((product, index) => {
                  const revenue = Number(product.revenue) || 0;
                  // Bars start from zero and are proportional to the leader, so
                  // relative magnitude is readable without an axis.
                  const pct = maxRevenue > 0 ? Math.max((revenue / maxRevenue) * 100, 2) : 0;
                  return (
                    <li key={product.productId || index} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <SafeImage
                          src={product.productImage}
                          alt=""
                          w={32}
                          className="size-8 shrink-0 rounded border border-border object-cover"
                        />
                        <span className="min-w-0 flex-1 truncate text-sm text-fg">
                          {product.productName || 'Unknown product'}
                        </span>
                        <span className="shrink-0 text-xs text-fg-subtle tabular-nums">
                          {product.salesCount || 0} sold
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-sunken"
                          role="img"
                          aria-label={`${product.productName || 'Product'}: ${formatUSD(revenue)} revenue`}
                        >
                          <div
                            className="h-full rounded-full bg-chart-1 transition-[width] duration-150 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {/* Direct-labelled at the end of its own bar — no legend. */}
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-fg">
                          {formatUSD(revenue)}
                        </span>
                      </div>
                    </li>
                  );
                })}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* ── Payout context ──────────────────────────────────────────────── */}
      {balanceQuery.data && (
        <Card variant="sunken">
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-fg">
                {formatUSD(balanceQuery.data.pending?.amount)} pending payout
              </p>
              <p className="mt-0.5 text-xs text-fg-muted">
                {balanceQuery.data.pending?.count || 0} earning line(s) still inside the hold
                period. Analytics above covers sales; this is what has yet to clear.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SellerAnalytics;
