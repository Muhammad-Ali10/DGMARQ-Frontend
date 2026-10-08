import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { userAPI } from '@services/api';
import { Card, CardContent } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';
import { EmptyState } from '@components/common/EmptyState';
import { ErrorState } from '@components/common/ErrorState';
import { Pagination } from '@components/common/Pagination';
import ConfirmationModal from '@components/common/ConfirmationModal';
import { ProductCard, WISHLIST_QUERY_KEY, wishlistPageKey } from '@features/catalog';
import { showSuccess, showApiError } from '@utils/toast';
import { Heart, ShoppingCart, Trash2, LogIn, ArrowRight } from 'lucide-react';

const Wishlist = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [showClearModal, setShowClearModal] = useState(false);

  const [page, setPage] = useState(1);

  const wishlistQuery = useQuery({
    queryKey: wishlistPageKey(page),
    queryFn: async () => (await userAPI.getWishlist({ page })).data.data,
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
  });

  const products = useMemo(
    () => (wishlistQuery.data?.products || []).map((i) => i?.productId).filter((p) => p?._id),
    [wishlistQuery.data]
  );

  const pagination = wishlistQuery.data?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.pages ?? 1;
  const max = wishlistQuery.data?.max ?? null;
  const isFull = max != null && total >= max;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const clearMutation = useMutation({
    mutationFn: () => userAPI.clearWishlist(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
      setShowClearModal(false);
      showSuccess('Wishlist cleared');
    },
    onError: (error) => showApiError(error, 'Could not clear your wishlist'),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12">
        <Card className="max-w-md w-full mx-4">
          <CardContent>
            <EmptyState
              icon={Heart}
              title="Sign in to view your wishlist"
              description="Log in or create an account to save products and get told when one you saved drops in price."
              action={
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => navigate('/login')} size="lg">
                    <LogIn aria-hidden="true" />
                    Sign in
                  </Button>
                  <Button onClick={() => navigate('/register')} variant="outline" size="lg">
                    Create account
                  </Button>
                </div>
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] py-8">
      <div className="max-w-7xl mx-auto px-4">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-fg">My Wishlist</h1>
            <p className="mt-1 text-fg-muted">
              {total > 0
                ? `${total} ${total === 1 ? 'item' : 'items'} saved`
                : 'Save products for later and we will tell you when the price drops.'}
              {max != null && total > max * 0.8 && (
                <span className={isFull ? 'text-danger' : 'text-warning'}> · {total} of {max} used</span>
              )}
            </p>
          </div>
          {total > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowClearModal(true)}
              disabled={clearMutation.isPending}
            >
              <Trash2 aria-hidden="true" />
              {clearMutation.isPending ? 'Clearing…' : 'Clear all'}
            </Button>
          )}
        </header>

        {wishlistQuery.isPending ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="w-full max-w-[196px] mx-auto space-y-2.5">
                <Skeleton className="w-full aspect-square rounded-2xl" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : wishlistQuery.isError ? (
          <Card>
            <CardContent>
              <ErrorState
                error={wishlistQuery.error}
                title="Couldn't load your wishlist"
                onRetry={() => wishlistQuery.refetch()}
              />
            </CardContent>
          </Card>
        ) : total === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={Heart}
                title="Your wishlist is empty"
                description="Save a product and you can jump straight back to it — handy for watching a price before you commit."
                action={
                  <Button asChild size="lg">
                    <Link to="/search">
                      <ShoppingCart aria-hidden="true" />
                      Browse products
                    </Link>
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((product) => (
                <li key={product._id}>
                  <ProductCard product={product} showStock />
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                total={total}
                totalNoun="saved items"
              />
            </div>

            <div className="mt-8 text-center">
              <Button asChild variant="outline" size="lg">
                <Link to="/search">
                  <ArrowRight aria-hidden="true" />
                  Continue shopping
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>

      <ConfirmationModal
        open={showClearModal}
        onOpenChange={setShowClearModal}
        title="Clear your whole wishlist?"
        description={`All ${total} saved ${total === 1 ? 'item' : 'items'} will be removed. This cannot be undone.`}
        confirmText="Clear wishlist"
        cancelText="Keep them"
        variant="destructive"
        onConfirm={() => clearMutation.mutate()}
      />
    </div>
  );
};

export default Wishlist;
