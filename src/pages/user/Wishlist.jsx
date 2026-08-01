import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { userAPI } from '@services/api';
import { Card, CardContent } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Skeleton } from '@components/ui/skeleton';
import SafeImage from '@components/ui/safe-image';
import { PlatformBadge, isKnownPlatform } from '@components/common/PlatformBadge';
import { EmptyState } from '@components/common/EmptyState';
import { ErrorState } from '@components/common/ErrorState';
import ConfirmationModal from '@components/common/ConfirmationModal';
import { formatRelativeDate } from '@lib/datetime';
import useCurrency from '@hooks/useCurrency';
import { showSuccess, showApiError } from '@utils/toast';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';

/**
 * Saved products.
 *
 * The brief asks for a price-drop indicator. NOT BUILT, and not faked: the
 * wishlist stores `{ productId, addedAt }` and nothing else — there is no
 * record of what the product cost when it was saved, so "price dropped" cannot
 * be computed from anything the client can reach. What IS real is the product's
 * current `discount`, which is shown as a live discount badge. That is a
 * genuine signal; a fabricated "↓ 12% since you saved it" would not be.
 *
 * The platform badge here reads `Platform.name` from the catalog taxonomy,
 * which this endpoint does populate.
 */
const UserWishlist = () => {
  const queryClient = useQueryClient();
  const { format } = useCurrency();
  const [showClearModal, setShowClearModal] = useState(false);

  const wishlistQuery = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const response = await userAPI.getWishlist();
      const data = response.data.data;
      // The endpoint returns a bare array when the wishlist is empty.
      return Array.isArray(data) ? { products: [] } : data;
    },
  });

  const removeMutation = useMutation({
    mutationFn: (productId) => userAPI.removeFromWishlist({ productId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      showSuccess('Removed from your wishlist');
    },
    onError: (error) => showApiError(error, 'Could not remove that item'),
  });

  const clearMutation = useMutation({
    mutationFn: () => userAPI.clearWishlist(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      setShowClearModal(false);
      showSuccess('Wishlist cleared');
    },
    onError: (error) => showApiError(error, 'Could not clear your wishlist'),
  });

  const items = (wishlistQuery.data?.products ?? []).filter((i) => i.productId?._id);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-fg">Wishlist</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {items.length > 0
              ? `${items.length} ${items.length === 1 ? 'game' : 'games'} saved`
              : 'Games you save show up here.'}
          </p>
        </div>
        {items.length > 0 && (
          <Button variant="outline" onClick={() => setShowClearModal(true)}>
            <Trash2 aria-hidden="true" />
            Clear all
          </Button>
        )}
      </header>

      {wishlistQuery.isPending ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-[3/4] w-full rounded-t-lg" />
              <CardContent className="space-y-2 pt-4">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-5 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : wishlistQuery.isError ? (
        <Card variant="hud">
          <CardContent>
            <ErrorState
              error={wishlistQuery.error}
              title="Couldn't load your wishlist"
              onRetry={() => wishlistQuery.refetch()}
            />
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card variant="hud">
          <CardContent>
            <EmptyState
              icon={Heart}
              title="Nothing saved yet"
              description="Save a game and you can jump straight back to it — handy for watching a price before you commit."
              action={
                <Button asChild>
                  <Link to="/search">
                    <ShoppingCart aria-hidden="true" />
                    Browse keys
                  </Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const product = item.productId;
            const to = `/product/${product.slug || product._id}`;
            const discount = Number(product.discount) || 0;
            const price = Number(product.price) || 0;
            const wasPrice = discount > 0 ? price / (1 - discount / 100) : null;
            const platformName = product.platform?.name;

            return (
              <li key={product._id}>
                <Card className="group h-full overflow-hidden py-0" interactive>
                  <div className="relative">
                    <Link
                      to={to}
                      className="block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    >
                      {/* Fixed aspect ratio so the grid never reflows as art loads. */}
                      <div className="aspect-[3/4] overflow-hidden bg-surface-sunken">
                        <SafeImage
                          src={product.images?.[0]}
                          alt={product.name}
                          w={320}
                          className="size-full object-cover transition-transform duration-150 ease-out group-hover:scale-105"
                        />
                      </div>
                    </Link>

                    {discount > 0 && (
                      <Badge variant="success" tone="solid" className="absolute top-2 left-2">
                        −{Math.round(discount)}%
                      </Badge>
                    )}

                    <Button
                      size="icon-sm"
                      variant="secondary"
                      onClick={() => removeMutation.mutate(product._id)}
                      disabled={removeMutation.isPending}
                      aria-label={`Remove ${product.name} from wishlist`}
                      className="absolute top-2 right-2"
                    >
                      <Heart aria-hidden="true" className="fill-danger text-danger" />
                    </Button>
                  </div>

                  <CardContent className="flex flex-col gap-2 py-4">
                    <Link
                      to={to}
                      className="line-clamp-2 text-sm font-medium text-fg outline-none hover:text-accent-on-dark focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {product.name}
                    </Link>

                    {isKnownPlatform(platformName) ? (
                      <PlatformBadge platform={platformName} />
                    ) : (
                      platformName && (
                        <span className="text-xs text-fg-subtle">{platformName}</span>
                      )
                    )}

                    <div className="mt-auto flex items-baseline gap-2 pt-1">
                      <span className="text-base font-semibold tabular-nums text-fg">
                        {format(price)}
                      </span>
                      {wasPrice && (
                        <span className="text-xs text-fg-subtle line-through tabular-nums">
                          {format(wasPrice)}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-fg-subtle">
                      Saved {formatRelativeDate(item.addedAt)}
                    </p>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmationModal
        open={showClearModal}
        onOpenChange={setShowClearModal}
        title="Clear your whole wishlist?"
        description={`All ${items.length} saved ${items.length === 1 ? 'game' : 'games'} will be removed. This cannot be undone.`}
        confirmText="Clear wishlist"
        cancelText="Keep them"
        variant="destructive"
        onConfirm={() => clearMutation.mutate()}
      />
    </div>
  );
};

export default UserWishlist;
