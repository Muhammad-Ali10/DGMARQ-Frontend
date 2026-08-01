import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { userAPI, notificationAPI, walletAPI, subscriptionAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';
import { StatusBadge } from '@components/common/StatusBadge';
import { DeliveryTypeBadge } from '@components/common/DeliveryTypeBadge';
import { EmptyState } from '@components/common/EmptyState';
import { ErrorState } from '@components/common/ErrorState';
import { StatCard, StatCardGrid } from '@components/common/StatCard';
import { StatCardGridSkeleton, OrderListSkeleton } from '@components/common/Skeletons';
import SafeImage from '@components/ui/safe-image';
import { ShoppingCart, Bell, Heart, Sparkles, Store, Wallet, ArrowRight } from 'lucide-react';
import { getOrderItemProductName } from '@utils/orderItem';
import { formatRelativeDate, formatExactTitle } from '@lib/datetime';
import useCurrency from '@hooks/useCurrency';

const RECENT_ORDER_LIMIT = 5;

/**
 * Buyer dashboard. The job this screen does is "where is my key, and is it going
 * to work?", so the order list is the hero and everything above it stays thin.
 *
 * KPI discipline — four tiles, down from eight. Three of the originals were
 * REMOVED rather than relabelled because they showed wrong numbers: Total Spent,
 * Completed Orders and Pending Orders were each derived by reducing a five-row
 * page of orders, so a buyer with 40 orders saw the lifetime spend of their most
 * recent five. Computing them correctly needs a server-side aggregate no
 * endpoint exposes, and a wrong number is worse than an absent one. Total Orders
 * survives because it reads `pagination.total`, which is a real count.
 *
 * No trend deltas and no sparklines: nothing in the API returns a prior-period
 * figure or a time series, and a fabricated trend would be worse than none.
 *
 * Every section owns its own query state. The previous version gated the whole
 * route on `ordersLoading || notifLoading || wishlistLoading || walletLoading`,
 * so the slowest of four independent requests blocked all of them behind one
 * full-page spinner.
 */
const UserDashboard = () => {
  const { user, roles } = useSelector((state) => state.auth);
  const { format } = useCurrency();

  const normalizedRoles = Array.isArray(roles) ? roles.map((r) => String(r).toLowerCase().trim()) : [];
  const hasSellerRole = normalizedRoles.includes('seller');
  const firstName = String(user?.name || '').trim().split(' ')[0];

  const ordersQuery = useQuery({
    queryKey: ['user-orders-summary'],
    queryFn: () =>
      userAPI.getMyOrders({ page: 1, limit: RECENT_ORDER_LIMIT }).then((res) => res.data.data),
  });

  const notificationsQuery = useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: () => notificationAPI.getUnreadCount().then((res) => res.data?.data?.unreadCount ?? 0),
  });

  const wishlistQuery = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const response = await userAPI.getWishlist();
      const data = response.data.data;
      // The endpoint returns a bare array when the wishlist is empty.
      return Array.isArray(data) ? { products: [] } : data;
    },
  });

  const walletQuery = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => walletAPI.getBalance().then((res) => res.data?.data ?? res.data ?? {}),
    retry: 1,
    refetchOnWindowFocus: true,
  });

  // M20: DGMARQ Plus points. Null when the buyer is not a subscriber.
  const pointsQuery = useQuery({
    queryKey: ['plus-points'],
    queryFn: () => subscriptionAPI.getMyPoints().then((r) => r.data?.data ?? null),
    staleTime: 60_000,
  });

  const orders = ordersQuery.data?.orders ?? [];
  const walletBalance = Number(walletQuery.data?.balance ?? 0);

  return (
    <div className="space-y-8">
      {/* ── Header strip: greeting, balance, one primary action ──────────────
          A single row, so the order list starts near the top of the viewport
          instead of below 200px of chrome. */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-fg">
            {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
          </h1>
          <Link
            to="/user/wallet"
            className="mt-1 inline-flex items-center gap-2 rounded-md text-sm text-fg-muted outline-none transition-colors duration-150 ease-out hover:text-fg focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Wallet aria-hidden="true" className="size-4 shrink-0 text-success" />
            {walletQuery.isPending ? (
              <Skeleton className="h-4 w-20" />
            ) : walletQuery.isError ? (
              <span>Wallet balance unavailable</span>
            ) : (
              <>
                <span className="font-medium tabular-nums text-fg">{format(walletBalance)}</span>
                <span>wallet balance</span>
              </>
            )}
          </Link>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {hasSellerRole && (
            <Button
              variant="outline"
              onClick={() => {
                sessionStorage.removeItem('allowCustomerAccess');
                window.location.href = '/seller/dashboard';
              }}
            >
              <Store aria-hidden="true" />
              Seller dashboard
            </Button>
          )}
          <Button asChild>
            <Link to="/search">
              <ShoppingCart aria-hidden="true" />
              Browse keys
            </Link>
          </Button>
        </div>
      </header>

      {/* ── KPI row ──────────────────────────────────────────────────────── */}
      {ordersQuery.isPending || wishlistQuery.isPending || notificationsQuery.isPending ? (
        <StatCardGridSkeleton count={4} />
      ) : (
        <StatCardGrid>
          <StatCard
            title="Total orders"
            value={ordersQuery.data?.pagination?.total ?? 0}
            icon={ShoppingCart}
            tone="accent"
            href="/user/orders"
          />
          <StatCard
            title="Wishlist"
            value={wishlistQuery.data?.products?.length ?? 0}
            icon={Heart}
            tone="danger"
            href="/user/wishlist"
          />
          <StatCard
            title="Unread notifications"
            value={notificationsQuery.data ?? 0}
            icon={Bell}
            tone="warning"
            href="/user/notifications"
          />
          <StatCard
            title="Plus points"
            value={pointsQuery.data?.balance ?? 0}
            icon={Sparkles}
            tone="info"
            description={pointsQuery.data ? 'Redeemable on DGMARQ Plus' : 'Join Plus to start earning'}
            href="/dgmarq-plus"
          />
        </StatCardGrid>
      )}

      {/* ── Recent orders: the hero of this screen ─────────────────────────
          `variant="hud"` is the product page's panel chrome — corner brackets,
          cyan rim bloom, and a micro-cap cyan heading. The page's own layout is
          untouched; this is the same box, wearing the storefront's look. */}
      <Card variant="hud">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent orders</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/user/orders">
              View all
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {ordersQuery.isPending ? (
            <OrderListSkeleton rows={RECENT_ORDER_LIMIT} />
          ) : ordersQuery.isError ? (
            <ErrorState
              compact
              error={ordersQuery.error}
              title="Couldn't load your orders"
              onRetry={() => ordersQuery.refetch()}
            />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="No orders yet"
              description="Your purchases show up here the moment they're delivered — usually within seconds."
              action={
                <Button asChild>
                  <Link to="/search">Browse keys</Link>
                </Button>
              }
            />
          ) : (
            /* Discrete rows, not a divided list: each order is its own bordered
               box, the way the product page draws an offer row (`.of-row` at
               11px radius, ringed 1px in cyan). A hairline divider disappeared
               against the panel — an order is an object, so it gets edges. */
            <ul className="space-y-1.5">
              {orders.map((order) => {
                const firstItem = order.items?.[0];
                const image = firstItem?.productId?.images?.[0];
                const extraCount = (order.items?.length ?? 0) - 1;
                return (
                  <li key={order._id}>
                    <Link
                      to={`/user/orders/${order._id}`}
                      className="row-link flex items-center gap-4 rounded-xl border border-brand-cyan/12 bg-brand-cyan/3 px-3 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <SafeImage
                        src={image}
                        alt=""
                        w={56}
                        className="size-14 shrink-0 rounded-md border border-border object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">
                          {firstItem
                            ? getOrderItemProductName(firstItem)
                            : `Order #${order.orderNumber || order._id.slice(-8)}`}
                          {extraCount > 0 && <span className="text-fg-muted"> +{extraCount} more</span>}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          {firstItem?.productId?.productType && (
                            <DeliveryTypeBadge productType={firstItem.productId.productType} />
                          )}
                          <span className="text-xs text-fg-subtle" title={formatExactTitle(order.createdAt)}>
                            {formatRelativeDate(order.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="text-sm font-semibold tabular-nums text-fg">
                          {format(order.totalAmount)}
                        </span>
                        <StatusBadge domain="order" status={order.orderStatus} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboard;
