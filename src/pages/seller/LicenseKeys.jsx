import { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { offerAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Skeleton } from '@components/ui/skeleton';
import SafeImage from '@components/ui/safe-image';
import { SearchInput } from '@components/common/SearchInput';
import { StatusBadge } from '@components/common/StatusBadge';
import { PlatformBadge } from '@components/common/PlatformBadge';
import { EmptyState, TableEmptyRow } from '@components/common/EmptyState';
import { ErrorState } from '@components/common/ErrorState';
import { TableRowsSkeleton, CardListSkeleton } from '@components/common/Skeletons';
import ConfirmationModal from '@components/common/ConfirmationModal';
import { Pagination } from '@components/common/Pagination';
import { BulkUploadModal } from '@features/seller';
import { formatRelativeDate, formatExactTitle } from '@lib/datetime';
import { normalizeToHttps } from '@lib/utils';
import { Plus, Key, RefreshCw, Eye, EyeOff, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';

const KEYS_PAGE_SIZE = 10;
const OFFER_ROW_HEIGHT = 72;
/** Above this, the picker windows its rows instead of mounting all of them. */
const VIRTUALIZE_ABOVE = 20;

/** Backfills the derived fields the list endpoint does not send. */
const withDerivedStatus = (key) => ({
  ...key,
  status: key.status || (key.isRefunded ? 'Refunded' : key.isUsed ? 'Used' : 'Active'),
});

const formatKeyForDisplay = (keyData) => {
  if (!keyData) return '';
  if (typeof keyData === 'string') return keyData;
  if (typeof keyData === 'object') {
    const email = keyData.email || null;
    const usernameId = keyData.usernameId || keyData.username || null;
    const rawPassword = keyData.password || null;
    const emailPassword = keyData.emailPassword || (email && !usernameId ? rawPassword : null);
    const usernamePassword = keyData.usernamePassword || (usernameId ? rawPassword : null);
    const lines = [];
    if (email) lines.push(`Email: ${email}`);
    if (emailPassword) lines.push(`Email password: ${emailPassword}`);
    if (usernameId) lines.push(`Username: ${usernameId}`);
    if (usernamePassword) lines.push(`Username password: ${usernamePassword}`);
    return lines.length ? lines.join('\n') : JSON.stringify(keyData, null, 2);
  }
  return String(keyData);
};

/**
 * Seller inventory — pick a listing, manage its keys.
 *
 * The listing picker is VIRTUALISED with @tanstack/react-virtual. This is the
 * screen where it earns its keep: the offers request pulls up to 100 rows in one
 * go, and the picker previously mounted every one of them as a card. (By
 * contrast the keys table below is server-paginated at ten rows, so it is not
 * virtualised — windowing ten items would add a scroll container and break table
 * semantics for nothing.) Below `VIRTUALIZE_ABOVE` rows the picker renders
 * plainly, because a virtualiser on a handful of items is pure overhead.
 *
 * Selected listing and key page both live in the URL, so a seller can bookmark
 * "the inventory screen for this game" and come back to it.
 */
const SellerLicenseKeys = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState({});
  const [keyToDelete, setKeyToDelete] = useState(null);
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);

  const selectedOfferId = searchParams.get('offer') || null;
  const keysPage = Math.max(1, Number(searchParams.get('page')) || 1);

  const updateParams = useCallback(
    (next) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(next)) {
            if (value === null || value === '' || value === undefined) params.delete(key);
            else params.set(key, String(value));
          }
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const offersQuery = useQuery({
    queryKey: ['license-offers'],
    queryFn: () => offerAPI.getMyOffers({ limit: 100 }).then((res) => res.data.data),
    retry: 2,
  });

  const offers = useMemo(() => offersQuery.data?.offers ?? [], [offersQuery.data]);
  const filteredOffers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return offers;
    return offers.filter((o) => (o.productId?.name || '').toLowerCase().includes(q));
  }, [offers, searchTerm]);

  const selectedOffer = useMemo(
    () => offers.find((o) => o._id === selectedOfferId) || null,
    [offers, selectedOfferId]
  );

  const keysQuery = useQuery({
    queryKey: ['offer-keys', selectedOfferId, keysPage],
    queryFn: () =>
      offerAPI
        .getOfferKeys(selectedOfferId, { page: keysPage, limit: KEYS_PAGE_SIZE })
        .then((res) => res.data.data),
    enabled: Boolean(selectedOfferId),
    placeholderData: keepPreviousData,
    retry: 2,
  });

  const shouldVirtualize = filteredOffers.length > VIRTUALIZE_ABOVE;
  const rowVirtualizer = useVirtualizer({
    count: filteredOffers.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => OFFER_ROW_HEIGHT,
    overscan: 8,
    enabled: shouldVirtualize,
  });

  const revealMutation = useMutation({
    mutationFn: (keyId) => offerAPI.revealOfferKey(selectedOfferId, keyId),
    onSuccess: (response, keyId) => {
      const keyData = response?.data?.data?.keyData;
      if (keyData === undefined || keyData === null) {
        toast.error('That key could not be decrypted. Contact support.');
        return;
      }
      setRevealedKeys((prev) => ({ ...prev, [String(keyId)]: keyData }));
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || 'Could not reveal that key. Try again.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (keyId) => offerAPI.deleteOfferKey(selectedOfferId, keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-keys', selectedOfferId] });
      queryClient.invalidateQueries({ queryKey: ['license-offers'] });
      queryClient.invalidateQueries({ queryKey: ['seller-offers-overview'] });
      setKeyToDelete(null);
      toast.success('Key deleted');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not delete that key.'),
  });

  const syncMutation = useMutation({
    mutationFn: (offerId) => offerAPI.syncOfferStock(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-keys', selectedOfferId] });
      queryClient.invalidateQueries({ queryKey: ['license-offers'] });
      queryClient.invalidateQueries({ queryKey: ['seller-offers-overview'] });
      toast.success('Stock recount complete');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not sync stock.'),
  });

  const toggleReveal = (keyId) => {
    const id = String(keyId);
    if (revealedKeys[id]) {
      setRevealedKeys((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      revealMutation.mutate(id);
    }
  };

  const requestDelete = (key) => {
    if (key.status !== 'Active') {
      toast.error(
        key.status === 'Used'
          ? 'Sold keys cannot be deleted — the buyer owns this one.'
          : 'Refunded keys cannot be deleted.'
      );
      return;
    }
    setKeyToDelete(key);
  };

  const keys = (keysQuery.data?.keys ?? []).map(withDerivedStatus);
  const keysPagination = keysQuery.data?.pagination ?? {};
  const counts = {
    active: keys.filter((k) => k.status === 'Active').length,
    used: keys.filter((k) => k.status === 'Used').length,
    refunded: keys.filter((k) => k.status === 'Refunded').length,
  };

  const selectOffer = (offer) => updateParams({ offer: offer._id, page: null });

  /** One listing row in the picker. A real button, not a clickable div. */
  const OfferRow = ({ offer, style }) => {
    const product = offer.productId || {};
    const isSelected = offer._id === selectedOfferId;
    return (
      <button
        type="button"
        style={style}
        onClick={() => selectOffer(offer)}
        aria-current={isSelected ? 'true' : undefined}
        className={`row-link flex w-full items-center gap-3 rounded-lg border p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          isSelected ? 'border-accent bg-accent-soft' : 'border-border bg-surface-sunken'
        }`}
      >
        {product.images?.[0] ? (
          <SafeImage
            src={normalizeToHttps(product.images[0])}
            alt=""
            w={40}
            className="size-10 shrink-0 rounded-md border border-border object-cover"
          />
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2">
            <Package aria-hidden="true" className="size-4 text-fg-subtle" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-fg">{product.name || 'Product'}</p>
          <p className="mt-0.5 text-xs tabular-nums text-fg-subtle">
            {offer.availableKeysCount ?? 0} in stock · {offer.totalKeysCount ?? 0} total
          </p>
        </div>
        <StatusBadge domain="offer" status={offer.status} />
      </button>
    );
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-fg">Inventory</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Upload and manage keys for the products you've listed.
          </p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)}>
          <Plus aria-hidden="true" />
          Upload keys
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[22rem_1fr]">
        {/* ── Listing picker ────────────────────────────────────────────── */}
        <Card variant="hud" className="lg:sticky lg:top-4 lg:self-start">
          <CardHeader>
            <CardTitle>Your listings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              onClear={() => setSearchTerm('')}
              placeholder="Search listings…"
            />

            {offersQuery.isPending ? (
              <div className="space-y-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-[68px] w-full rounded-lg" />
                ))}
              </div>
            ) : offersQuery.isError ? (
              <ErrorState
                compact
                error={offersQuery.error}
                title="Couldn't load your listings"
                onRetry={() => offersQuery.refetch()}
              />
            ) : filteredOffers.length === 0 ? (
              <EmptyState
                icon={Package}
                title={searchTerm ? 'No listings match' : 'No listings yet'}
                description={
                  searchTerm
                    ? 'Try a different search term.'
                    : 'List a product from the catalog, then add its keys here.'
                }
                action={
                  searchTerm ? (
                    <Button variant="outline" onClick={() => setSearchTerm('')}>
                      Clear search
                    </Button>
                  ) : (
                    <Button asChild>
                      <Link to="/seller/catalog">Browse catalog</Link>
                    </Button>
                  )
                }
              />
            ) : shouldVirtualize ? (
              <div ref={scrollRef} className="max-h-[28rem] overflow-y-auto pr-1">
                <div
                  className="relative w-full"
                  style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                    <div
                      key={filteredOffers[virtualRow.index]._id}
                      className="absolute top-0 left-0 w-full pb-2"
                      style={{ transform: `translateY(${virtualRow.start}px)` }}
                    >
                      <OfferRow offer={filteredOffers[virtualRow.index]} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredOffers.map((offer) => (
                  <OfferRow key={offer._id} offer={offer} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Keys for the selected listing ─────────────────────────────── */}
        <Card variant="hud">
          {!selectedOffer ? (
            <CardContent>
              <EmptyState
                icon={Key}
                title="Pick a listing"
                description="Choose one of your listings to see and manage the keys behind it."
              />
            </CardContent>
          ) : (
            <>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="truncate">{selectedOffer.productId?.name}</CardTitle>
                  <p className="mt-1 text-xs tabular-nums text-fg-subtle">
                    {keysPagination.total ?? 0} total · {counts.active} active · {counts.used} sold ·{' '}
                    {counts.refunded} refunded
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => syncMutation.mutate(selectedOfferId)}
                  disabled={syncMutation.isPending}
                >
                  <RefreshCw aria-hidden="true" className={syncMutation.isPending ? 'animate-spin' : ''} />
                  {syncMutation.isPending ? 'Syncing…' : 'Recount stock'}
                </Button>
              </CardHeader>

              <CardContent>
                {keysQuery.isError ? (
                  <ErrorState
                    error={keysQuery.error}
                    title="Couldn't load these keys"
                    onRetry={() => keysQuery.refetch()}
                  />
                ) : (
                  <>
                    {/* Desktop */}
                    <div className="hidden md:block">
                      <Table variant="hud">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Key</TableHead>
                            <TableHead>Platform</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Added</TableHead>
                            <TableHead>Sold</TableHead>
                            <TableHead numeric>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {keysQuery.isPending ? (
                            <TableRowsSkeleton rows={KEYS_PAGE_SIZE} cols={6} />
                          ) : keys.length === 0 ? (
                            <TableEmptyRow colSpan={6}>
                              <EmptyState
                                icon={Key}
                                title="No keys on this listing"
                                description="It stays out of stock until you upload keys."
                                action={
                                  <Button onClick={() => setIsUploadOpen(true)}>
                                    <Plus aria-hidden="true" />
                                    Upload keys
                                  </Button>
                                }
                              />
                            </TableEmptyRow>
                          ) : (
                            keys.map((key) => {
                              const id = String(key._id);
                              const revealed = revealedKeys[id];
                              return (
                                <TableRow key={key._id}>
                                  <TableCell>
                                    <code className="max-w-xs rounded bg-surface-sunken px-2 py-1 font-mono text-xs break-words whitespace-pre-wrap text-fg">
                                      {revealed ? formatKeyForDisplay(revealed) : key.maskedKey}
                                    </code>
                                  </TableCell>
                                  <TableCell>
                                    <PlatformBadge platform={key.keyType} />
                                  </TableCell>
                                  <TableCell>
                                    <StatusBadge domain="licenseKey" status={key.status} />
                                  </TableCell>
                                  <TableCell
                                    className="text-fg-muted"
                                    title={formatExactTitle(key.createdAt)}
                                  >
                                    {formatRelativeDate(key.createdAt)}
                                  </TableCell>
                                  <TableCell
                                    className="text-fg-muted"
                                    title={formatExactTitle(key.assignedAt)}
                                  >
                                    {key.assignedAt ? formatRelativeDate(key.assignedAt) : '—'}
                                  </TableCell>
                                  <TableCell numeric>
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        size="icon-sm"
                                        variant="ghost"
                                        onClick={() => toggleReveal(key._id)}
                                        disabled={revealMutation.isPending}
                                        aria-label={revealed ? 'Hide key' : 'Reveal key'}
                                      >
                                        {revealed ? (
                                          <EyeOff aria-hidden="true" />
                                        ) : (
                                          <Eye aria-hidden="true" />
                                        )}
                                      </Button>
                                      {key.status === 'Active' && (
                                        <Button
                                          size="icon-sm"
                                          variant="ghost"
                                          onClick={() => requestDelete(key)}
                                          disabled={deleteMutation.isPending}
                                          aria-label="Delete key"
                                          className="text-danger hover:bg-danger-soft hover:text-danger"
                                        >
                                          <Trash2 aria-hidden="true" />
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden">
                      {keysQuery.isPending ? (
                        <CardListSkeleton rows={4} />
                      ) : keys.length === 0 ? (
                        <EmptyState
                          icon={Key}
                          title="No keys on this listing"
                          description="It stays out of stock until you upload keys."
                          action={
                            <Button onClick={() => setIsUploadOpen(true)}>
                              <Plus aria-hidden="true" />
                              Upload keys
                            </Button>
                          }
                        />
                      ) : (
                        <ul className="space-y-3">
                          {keys.map((key) => {
                            const id = String(key._id);
                            const revealed = revealedKeys[id];
                            return (
                              <li
                                key={key._id}
                                className="rounded-xl border border-brand-cyan/12 bg-brand-cyan/3 p-4"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <PlatformBadge platform={key.keyType} />
                                  <StatusBadge domain="licenseKey" status={key.status} />
                                </div>
                                <code className="mt-3 block rounded bg-surface-2 px-2 py-1.5 font-mono text-xs break-words whitespace-pre-wrap text-fg">
                                  {revealed ? formatKeyForDisplay(revealed) : key.maskedKey}
                                </code>
                                <p className="mt-2 text-xs text-fg-subtle">
                                  Added {formatRelativeDate(key.createdAt)}
                                  {key.assignedAt && ` · Sold ${formatRelativeDate(key.assignedAt)}`}
                                </p>
                                <div className="mt-3 flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => toggleReveal(key._id)}
                                    disabled={revealMutation.isPending}
                                  >
                                    {revealed ? (
                                      <EyeOff aria-hidden="true" />
                                    ) : (
                                      <Eye aria-hidden="true" />
                                    )}
                                    {revealed ? 'Hide' : 'Reveal'}
                                  </Button>
                                  {key.status === 'Active' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => requestDelete(key)}
                                      disabled={deleteMutation.isPending}
                                      aria-label="Delete key"
                                      className="text-danger"
                                    >
                                      <Trash2 aria-hidden="true" />
                                    </Button>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    <Pagination
                      page={keysPage}
                      totalPages={keysPagination.pages}
                      onPageChange={(next) => updateParams({ page: next === 1 ? null : next })}
                      total={keysPagination.total}
                      totalNoun="keys"
                    />
                  </>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>

      <ConfirmationModal
        open={Boolean(keyToDelete)}
        onOpenChange={(open) => !open && setKeyToDelete(null)}
        title="Delete this key?"
        description="It is removed from your inventory permanently and your stock count drops by one. This cannot be undone."
        confirmText="Delete key"
        cancelText="Keep it"
        variant="destructive"
        onConfirm={() => keyToDelete && deleteMutation.mutate(keyToDelete._id)}
      />

      <BulkUploadModal
        open={isUploadOpen}
        offers={offers}
        onOpenChange={(open) => {
          setIsUploadOpen(open);
          if (!open) {
            queryClient.invalidateQueries({ queryKey: ['license-offers'] });
            queryClient.invalidateQueries({ queryKey: ['seller-offers-overview'] });
            if (selectedOfferId) {
              queryClient.invalidateQueries({ queryKey: ['offer-keys', selectedOfferId] });
            }
          }
        }}
      />
    </div>
  );
};

export default SellerLicenseKeys;
