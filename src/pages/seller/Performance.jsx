import { useQuery } from '@tanstack/react-query';
import { sellerAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Skeleton } from '@components/ui/skeleton';
import { StatCard, StatCardGrid } from '@components/common/StatCard';
import { StatCardGridSkeleton } from '@components/common/Skeletons';
import { EmptyState } from '@components/common/EmptyState';
import { ErrorState } from '@components/common/ErrorState';
import { formatUSD } from '@lib/money';
import { Star, ScaleIcon, DollarSign, ShoppingCart, MessageSquare } from 'lucide-react';

/**
 * Seller reputation.
 *
 * This screen used to be nine KPI tiles that restated the dashboard's figures
 * from the same `getPerformanceMetrics` call. It is now the reputation view the
 * brief describes, built from data that actually exists:
 *   - rating breakdown, from `getSellerReviews().summary.ratingBreakdown`,
 *     which the server already shapes as [{rating, count}] sorted 5 → 1
 *   - dispute rate, from `getPerformanceMetrics().disputes`
 *
 * NOT built, because no endpoint supports it and the numbers would be invented:
 *   - delivery-speed percentile (no timing aggregate anywhere)
 *   - dispute ratio vs the platform average (no platform-wide figure is exposed
 *     to a seller, and rightly so)
 *   - tier ladder / "how to reach the next tier" (no tier concept exists in the
 *     data model at all)
 * A qualitative read of the seller's own dispute rate is given instead, which is
 * honest and still actionable.
 */

/** Plain-language read of a seller's own dispute rate. No peer comparison. */
const disputeVerdict = (rate) => {
  if (rate == null) return null;
  if (rate === 0) return { tone: 'success', text: 'No disputes have been opened against you.' };
  if (rate < 2) return { tone: 'success', text: 'Low. Buyers are getting what they expected.' };
  if (rate < 5)
    return {
      tone: 'warning',
      text: 'Worth watching. Check that region and edition details on your listings match the keys you send.',
    };
  return {
    tone: 'danger',
    text: 'High. Sustained dispute rates at this level put your selling privileges at risk — review your recent disputes for a common cause.',
  };
};

const TONE_TEXT = { success: 'text-success', warning: 'text-warning', danger: 'text-danger' };

const SellerPerformance = () => {
  const sellerQuery = useQuery({
    queryKey: ['seller-info'],
    queryFn: () => sellerAPI.getSellerInfo().then((res) => res.data.data),
  });

  const metricsQuery = useQuery({
    queryKey: ['seller-performance-metrics'],
    queryFn: () => sellerAPI.getPerformanceMetrics().then((res) => res.data.data),
  });

  const sellerId = sellerQuery.data?._id;
  const reviewsQuery = useQuery({
    queryKey: ['seller-public-reviews', sellerId],
    queryFn: () => sellerAPI.getSellerReviews(sellerId).then((res) => res.data.data),
    enabled: Boolean(sellerId),
  });

  const metrics = metricsQuery.data;
  const summary = reviewsQuery.data?.summary;
  // The endpoint names this `ratingBreakdown` and pre-sorts it 5 → 1.
  const breakdown = summary?.ratingBreakdown ?? [];
  const totalReviews = summary?.totalReviews ?? metrics?.reviews?.totalReviews ?? 0;
  const averageRating = summary?.averageRating ?? metrics?.reviews?.averageRating ?? 0;
  const disputeRate = metrics?.disputes?.rate;
  const verdict = disputeVerdict(disputeRate);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-fg">Reputation</h1>
        <p className="mt-1 text-sm text-fg-muted">
          How buyers rate you, and how often something goes wrong.
        </p>
      </header>

      {metricsQuery.isPending ? (
        <StatCardGridSkeleton count={4} />
      ) : metricsQuery.isError ? (
        <Card variant="hud">
          <CardContent>
            <ErrorState
              error={metricsQuery.error}
              title="Couldn't load your performance"
              onRetry={() => metricsQuery.refetch()}
            />
          </CardContent>
        </Card>
      ) : (
        <StatCardGrid>
          <StatCard
            title="Average rating"
            value={averageRating ? `${Number(averageRating).toFixed(1)} / 5` : '—'}
            icon={Star}
            tone={averageRating >= 4 ? 'success' : averageRating > 0 ? 'warning' : 'neutral'}
            description={`${totalReviews} review${totalReviews === 1 ? '' : 's'}`}
          />
          <StatCard
            title="Dispute rate"
            value={`${disputeRate ?? 0}%`}
            icon={ScaleIcon}
            tone={verdict?.tone ?? 'neutral'}
            description={`${metrics?.disputes?.count ?? 0} of ${metrics?.disputes?.orders ?? 0} orders`}
          />
          <StatCard
            title="Keys sold"
            value={metrics?.sales?.totalSales ?? 0}
            icon={ShoppingCart}
            tone="accent"
            description="All time"
          />
          <StatCard
            title="Net earnings"
            value={formatUSD(metrics?.sales?.netEarnings)}
            icon={DollarSign}
            tone="success"
            description="After commission"
          />
        </StatCardGrid>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Rating breakdown ──────────────────────────────────────────── */}
        <Card variant="hud">
          <CardHeader>
            <CardTitle>Rating breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {reviewsQuery.isPending || sellerQuery.isPending ? (
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((r) => (
                  <Skeleton key={r} className="h-5 w-full" />
                ))}
              </div>
            ) : reviewsQuery.isError ? (
              <ErrorState
                compact
                error={reviewsQuery.error}
                title="Couldn't load your ratings"
                onRetry={() => reviewsQuery.refetch()}
              />
            ) : totalReviews === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No reviews yet"
                description="Buyers can review after a key is delivered. Fast delivery and accurate listings are what earn them."
              />
            ) : (
              <ul className="space-y-3">
                {breakdown.map(({ rating, count }) => {
                  const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <li key={rating} className="flex items-center gap-3">
                      <span className="flex w-12 shrink-0 items-center gap-1 text-sm tabular-nums text-fg-muted">
                        {rating}
                        <Star aria-hidden="true" className="size-3 fill-warning text-warning" />
                      </span>
                      <div
                        className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-sunken"
                        role="img"
                        aria-label={`${rating} stars: ${count} of ${totalReviews} reviews`}
                      >
                        <div
                          className="h-full rounded-full bg-warning transition-[width] duration-150 ease-out"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-right text-sm tabular-nums text-fg">
                        {count}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ── Dispute health ────────────────────────────────────────────── */}
        <Card variant="hud">
          <CardHeader>
            <CardTitle>Dispute health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metricsQuery.isPending ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-2xl font-semibold tabular-nums ${
                      TONE_TEXT[verdict?.tone] || 'text-fg'
                    }`}
                  >
                    {disputeRate ?? 0}%
                  </span>
                  <span className="text-sm text-fg-muted">
                    of your paid orders had a dispute opened
                  </span>
                </div>

                {verdict && <p className="text-sm text-fg-muted">{verdict.text}</p>}

                <p className="border-t border-brand-cyan/10 pt-4 text-xs text-fg-subtle">
                  This counts every dispute opened, whatever the outcome — the standard marketplace
                  measure. It is your own rate over your own orders; DGMARQ does not publish a
                  platform average to compare against.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerPerformance;
