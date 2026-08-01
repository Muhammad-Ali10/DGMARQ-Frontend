import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { offerAPI } from '@services/api';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import SafeImage from '@components/ui/safe-image';
import { SearchInput } from '@components/common/SearchInput';
import { StatusBadge } from '@components/common/StatusBadge';
import { PlatformBadge, isKnownPlatform } from '@components/common/PlatformBadge';
import { DeliveryTypeBadge } from '@components/common/DeliveryTypeBadge';
import { EmptyState, TableEmptyRow } from '@components/common/EmptyState';
import { ErrorState } from '@components/common/ErrorState';
import { TableRowsSkeleton, CardListSkeleton } from '@components/common/Skeletons';
import { Pagination } from '@components/common/Pagination';
import { Package, Plus, SearchX } from 'lucide-react';

const PAGE_SIZE = 12;

/**
 * The master catalog a seller lists against.
 *
 * Search and page live in the URL, so a seller can bookmark or share a search.
 * The input keeps its own state and debounces into the URL — writing on every
 * keystroke would spam history and refetch per character.
 *
 * This endpoint populates a real `platform` reference, so the brand mark here is
 * genuine rather than inferred from a delivery model.
 */
const SellerCatalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') || '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [searchInput, setSearchInput] = useState(search);

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

  // Debounce the typed value into the URL; resets to page 1 on a new term.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.trim();
      if (next !== search) updateParams({ q: next || null, page: null });
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput, search, updateParams]);

  const catalogQuery = useQuery({
    queryKey: ['seller-catalog', page, search],
    queryFn: () =>
      offerAPI
        .browseCatalog({ page, limit: PAGE_SIZE, ...(search ? { search } : {}) })
        .then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });

  const products = catalogQuery.data?.products ?? [];
  const pagination = catalogQuery.data?.pagination ?? { page: 1, pages: 1, total: 0 };

  const emptyState = (
    <EmptyState
      icon={search ? SearchX : Package}
      title={search ? 'No products match' : 'Catalog is empty'}
      description={
        search
          ? 'Try a shorter or differently spelled term — the catalog is curated by admins.'
          : 'Products are added by DGMARQ admins. Check back shortly.'
      }
      action={
        search ? (
          <Button
            variant="outline"
            onClick={() => {
              setSearchInput('');
              updateParams({ q: null, page: null });
            }}
          >
            Clear search
          </Button>
        ) : undefined
      }
    />
  );

  /** Either "already listed" state, or the call to action. */
  const ListAction = ({ product }) =>
    product.myOfferStatus ? (
      <StatusBadge domain="offer" status={product.myOfferStatus} />
    ) : (
      <Button asChild size="sm">
        <Link to={`/seller/catalog/${product._id}/list`}>
          <Plus aria-hidden="true" />
          List it
        </Link>
      </Button>
    );

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-info/40 bg-info-soft text-info">
            <Package aria-hidden="true" className="size-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-fg">Browse catalog</h1>
            <p className="mt-1 text-sm text-fg-muted">
              Product details are fixed by the catalog. You set the price, the stock and the regions.
            </p>
          </div>
        </div>
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          onClear={() => setSearchInput('')}
          placeholder="Search products…"
          className="w-full sm:w-72"
        />
      </header>

      <Card variant="hud">
        <CardHeader className="border-b border-info/15">
          <CardTitle>{pagination.total} products</CardTitle>
        </CardHeader>
        <CardContent>
          {catalogQuery.isError ? (
            <ErrorState
              error={catalogQuery.error}
              title="Couldn't load the catalog"
              onRetry={() => catalogQuery.refetch()}
            />
          ) : (
            <>
              <div className="hidden md:block">
                <Table variant="hud">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead numeric>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catalogQuery.isPending ? (
                      <TableRowsSkeleton rows={PAGE_SIZE} cols={5} />
                    ) : products.length === 0 ? (
                      <TableEmptyRow colSpan={5}>{emptyState}</TableEmptyRow>
                    ) : (
                      products.map((p) => (
                        <TableRow key={p._id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {p.images?.length ? (
                                <SafeImage
                                  src={p.images[0]}
                                  alt=""
                                  w={40}
                                  className="size-10 shrink-0 rounded border border-border object-cover"
                                />
                              ) : (
                                <div className="flex size-10 shrink-0 items-center justify-center rounded border border-border bg-surface-2">
                                  <Package aria-hidden="true" className="size-4 text-fg-subtle" />
                                </div>
                              )}
                              <span className="max-w-xs truncate font-medium text-fg">{p.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-fg-muted">{p.categoryId?.name || '—'}</TableCell>
                          <TableCell>
                            {isKnownPlatform(p.platform?.name) ? (
                              <PlatformBadge platform={p.platform.name} />
                            ) : (
                              <span className="text-fg-muted">{p.platform?.name || '—'}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DeliveryTypeBadge productType={p.productType} />
                          </TableCell>
                          <TableCell numeric>
                            <ListAction product={p} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden">
                {catalogQuery.isPending ? (
                  <CardListSkeleton rows={5} />
                ) : products.length === 0 ? (
                  emptyState
                ) : (
                  <ul className="space-y-3">
                    {products.map((p) => (
                      <li
                        key={p._id}
                        className="rounded-xl border border-brand-cyan/12 bg-brand-cyan/3 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <SafeImage
                            src={p.images?.[0]}
                            alt=""
                            w={48}
                            className="size-12 shrink-0 rounded border border-border object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-fg">{p.name}</p>
                            <p className="mt-0.5 text-xs text-fg-subtle">
                              {p.categoryId?.name || 'Uncategorised'}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {isKnownPlatform(p.platform?.name) && (
                                <PlatformBadge platform={p.platform.name} />
                              )}
                              <DeliveryTypeBadge productType={p.productType} />
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <ListAction product={p} />
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
                totalNoun="products"
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerCatalog;
