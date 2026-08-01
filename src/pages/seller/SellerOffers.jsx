import { useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { offerAPI } from '@services/api';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import SafeImage from '@components/ui/safe-image';
import { StatusBadge } from '@components/common/StatusBadge';
import { EmptyState, TableEmptyRow } from '@components/common/EmptyState';
import { ErrorState } from '@components/common/ErrorState';
import { TableRowsSkeleton, CardListSkeleton } from '@components/common/Skeletons';
import ConfirmationModal from '@components/common/ConfirmationModal';
import { Pagination } from '@components/common/Pagination';
import { formatUSD } from '@lib/money';
import { Store, Package, Edit, Trash2, Boxes } from 'lucide-react';

const PAGE_SIZE = 10;

/**
 * The seller's listings against catalog products.
 *
 * Price is what the seller SET, stored in USD, so it renders with `formatUSD`
 * rather than the buyer's display-currency hook.
 *
 * The brief's inventory columns for competitor price, margin and rank are not
 * here: `getMyOffers` populates `productId` with `name slug images productType`
 * only, so there is nothing to compute them from. Cut rather than stubbed.
 */
const SellerOffers = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toDelete, setToDelete] = useState(null);

  const page = Math.max(1, Number(searchParams.get('page')) || 1);

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

  const offersQuery = useQuery({
    queryKey: ['my-offers', page],
    queryFn: () => offerAPI.getMyOffers({ page, limit: PAGE_SIZE }).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });

  const offers = offersQuery.data?.offers ?? [];
  const pagination = offersQuery.data?.pagination ?? { page: 1, pages: 1, total: 0 };

  // Deep-link focus: notifications and emails link here as ?productId=<id> so
  // the seller lands on the relevant offer. Filter to it when it is on this
  // page; otherwise show everything, since it may be on another page.
  const focusProductId = searchParams.get('productId');
  const focusMatches = focusProductId
    ? offers.filter((o) => String(o.productId?._id || o.productId) === String(focusProductId))
    : [];
  const displayOffers = focusMatches.length > 0 ? focusMatches : offers;
  const focusName = focusMatches[0]?.productId?.name;

  const deleteMutation = useMutation({
    mutationFn: (id) => offerAPI.deleteOffer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-offers'] });
      queryClient.invalidateQueries({ queryKey: ['seller-offers-overview'] });
      queryClient.invalidateQueries({ queryKey: ['license-offers'] });
      toast.success('Listing removed');
      setToDelete(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Could not remove that listing'),
  });

  const emptyState = (
    <EmptyState
      icon={Store}
      title="No listings yet"
      description="Pick a product from the catalog, set your price and add keys — that's a live listing."
      action={
        <Button asChild>
          <Link to="/seller/catalog">
            <Package aria-hidden="true" />
            Browse catalog
          </Link>
        </Button>
      }
    />
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-info/40 bg-info-soft text-info">
            <Store aria-hidden="true" className="size-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-fg">My listings</h1>
            <p className="mt-1 text-sm text-fg-muted">
              Your offers against catalog products. Add keys to go in stock.
            </p>
          </div>
        </div>
        <Button asChild>
          <Link to="/seller/catalog">
            <Package aria-hidden="true" />
            Browse catalog
          </Link>
        </Button>
      </header>

      {focusProductId && focusMatches.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent-on-dark/35 bg-accent-soft px-4 py-2.5">
          <span className="text-sm text-fg">
            Showing your listing for <strong>{focusName || 'the selected product'}</strong>
          </span>
          <Button size="sm" variant="outline" onClick={() => updateParams({ productId: null })}>
            Show all
          </Button>
        </div>
      )}

      <Card variant="hud">
        <CardHeader className="border-b border-info/15">
          <CardTitle>{pagination.total} listings</CardTitle>
        </CardHeader>
        <CardContent>
          {offersQuery.isError ? (
            <ErrorState
              error={offersQuery.error}
              title="Couldn't load your listings"
              onRetry={() => offersQuery.refetch()}
            />
          ) : (
            <>
              <div className="hidden md:block">
                <Table variant="hud">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead numeric>Your price</TableHead>
                      <TableHead numeric>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead numeric>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offersQuery.isPending ? (
                      <TableRowsSkeleton rows={PAGE_SIZE} cols={5} />
                    ) : displayOffers.length === 0 ? (
                      <TableEmptyRow colSpan={5}>{emptyState}</TableEmptyRow>
                    ) : (
                      displayOffers.map((o) => (
                        <TableRow key={o._id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {o.productId?.images?.length ? (
                                <SafeImage
                                  src={o.productId.images[0]}
                                  alt=""
                                  w={40}
                                  className="size-10 shrink-0 rounded border border-border object-cover"
                                />
                              ) : (
                                <div className="flex size-10 shrink-0 items-center justify-center rounded border border-border bg-surface-2">
                                  <Package aria-hidden="true" className="size-4 text-fg-subtle" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="max-w-xs truncate font-medium text-fg">
                                  {o.productId?.name || '—'}
                                </div>
                                {o.rejectionReason && o.status === 'rejected' && (
                                  <div
                                    className="max-w-xs truncate text-xs text-danger"
                                    title={o.rejectionReason}
                                  >
                                    Reason: {o.rejectionReason}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell numeric>{formatUSD(o.price)}</TableCell>
                          <TableCell numeric>
                            <Badge variant={o.availableKeysCount > 0 ? 'success' : 'destructive'}>
                              {o.availableKeysCount || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge domain="offer" status={o.status} />
                          </TableCell>
                          <TableCell numeric>
                            <div className="flex items-center justify-end gap-1">
                              <Button asChild size="icon-sm" variant="outline" aria-label="Manage keys">
                                <Link to={`/seller/license-keys?offer=${o._id}`}>
                                  <Boxes aria-hidden="true" />
                                </Link>
                              </Button>
                              <Button asChild size="icon-sm" variant="outline" aria-label="Edit listing">
                                <Link to={`/seller/offers/${o._id}/edit`}>
                                  <Edit aria-hidden="true" />
                                </Link>
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="outline"
                                aria-label="Remove listing"
                                className="text-danger"
                                onClick={() => setToDelete(o)}
                              >
                                <Trash2 aria-hidden="true" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden">
                {offersQuery.isPending ? (
                  <CardListSkeleton rows={4} />
                ) : displayOffers.length === 0 ? (
                  emptyState
                ) : (
                  <ul className="space-y-3">
                    {displayOffers.map((o) => (
                      <li
                        key={o._id}
                        className="rounded-xl border border-brand-cyan/12 bg-brand-cyan/3 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <SafeImage
                            src={o.productId?.images?.[0]}
                            alt=""
                            w={48}
                            className="size-12 shrink-0 rounded border border-border object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-fg">
                              {o.productId?.name || '—'}
                            </p>
                            <p className="mt-1 text-sm tabular-nums text-fg-muted">
                              {formatUSD(o.price)} · {o.availableKeysCount || 0} in stock
                            </p>
                            <div className="mt-2">
                              <StatusBadge domain="offer" status={o.status} />
                            </div>
                          </div>
                        </div>
                        {o.rejectionReason && o.status === 'rejected' && (
                          <p className="mt-2 text-xs text-danger">Reason: {o.rejectionReason}</p>
                        )}
                        <div className="mt-3 flex gap-2">
                          <Button asChild size="sm" variant="outline" className="flex-1">
                            <Link to={`/seller/license-keys?offer=${o._id}`}>
                              <Boxes aria-hidden="true" />
                              Keys
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="outline" className="flex-1">
                            <Link to={`/seller/offers/${o._id}/edit`}>
                              <Edit aria-hidden="true" />
                              Edit
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label="Remove listing"
                            className="text-danger"
                            onClick={() => setToDelete(o)}
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Pagination
                page={page}
                totalPages={pagination.pages}
                onPageChange={(next) => updateParams({ page: next === 1 ? null : next })}
                total={pagination.total}
                totalNoun="listings"
              />
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmationModal
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Remove this listing?"
        description={`This deletes your listing for “${toDelete?.productId?.name}” AND every key you have uploaded against it. This cannot be undone.`}
        confirmText={deleteMutation.isPending ? 'Removing…' : 'Remove listing'}
        cancelText="Keep it"
        variant="destructive"
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete._id)}
      />
    </div>
  );
};

export default SellerOffers;
