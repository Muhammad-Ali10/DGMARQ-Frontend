import { useCallback, useState } from 'react';
import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { licenseKeyAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import SafeImage from '@components/ui/safe-image';
import { PlatformBadge } from '@components/common/PlatformBadge';
import { EmptyState, TableEmptyRow } from '@components/common/EmptyState';
import { ErrorState } from '@components/common/ErrorState';
import { TableRowsSkeleton, CardListSkeleton } from '@components/common/Skeletons';
import { Pagination } from '@components/common/Pagination';
import { LicenseKeysModal } from '@features/seller';
import { formatRelativeDate, formatExactTitle } from '@lib/datetime';
import { getDisplayOrderId } from '@lib/orderDisplay';
import { Key, Eye, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

const buildLicenseDetailsFromReveal = (data) => {
  if (!data) return [];

  const isAccount =
    data.keyType === 'account' ||
    (typeof data.keyData === 'object' && data.keyData !== null) ||
    (typeof data.keyData === 'string' && data.keyData.trim().startsWith('{'));
  const productType = data.productType || (isAccount ? 'ACCOUNT_BASED' : 'LICENSE_KEY');

  const keyEntry =
    typeof data.keyData === 'object' && data.keyData !== null
      ? JSON.stringify(data.keyData)
      : String(data.keyData ?? data.key ?? '');

  return [
    {
      productName: data.productName || 'Product',
      productType,
      platform: data.platform,
      keys: keyEntry ? [keyEntry] : [],
      refunded: false,
    },
  ];
};

const displayOrderId = (key) => {
  const id = getDisplayOrderId(key, '');
  return id ? `#${id}` : '—';
};

const LicenseKeys = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [revealDetails, setRevealDetails] = useState(null);
  const [isRevealOpen, setIsRevealOpen] = useState(false);

  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const setPage = useCallback(
    (next) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next <= 1) params.delete('page');
          else params.set('page', String(next));
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const keysQuery = useQuery({
    queryKey: ['license-keys', page],
    queryFn: () =>
      licenseKeyAPI.getMyLicenseKeys({ page, limit: PAGE_SIZE }).then((res) => res.data.data),
    placeholderData: keepPreviousData,
    retry: 2,
  });

  const revealMutation = useMutation({
    mutationFn: (keyId) => licenseKeyAPI.revealLicenseKey(keyId).then((res) => res.data.data),
    onSuccess: (data) => {
      setRevealDetails(buildLicenseDetailsFromReveal(data));
      setIsRevealOpen(true);
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || 'Could not reveal that key. Try again.'),
  });

  const licenseKeys = Array.isArray(keysQuery.data?.keys)
    ? keysQuery.data.keys.filter((k) => k && typeof k === 'object')
    : [];
  const pagination = keysQuery.data?.pagination ?? {};

  const emptyState = (
    <EmptyState
      icon={Key}
      title="No keys yet"
      description="Keys from your purchases collect here, so you can find them again without digging through orders."
      action={
        <Button asChild>
          <Link to="/search">
            <ShoppingCart aria-hidden="true" />
            Browse keys
          </Link>
        </Button>
      }
    />
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-fg">My license keys</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Every key you own, with how to redeem it.
        </p>
      </header>

      <Card variant="hud">
        <CardHeader>
          <CardTitle>
            {pagination.total != null ? `${pagination.total} keys` : 'Keys'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {keysQuery.isError ? (
            <ErrorState
              error={keysQuery.error}
              title="Couldn't load your keys"
              onRetry={() => keysQuery.refetch()}
            />
          ) : (
            <>
              <div className="hidden md:block">
                <Table variant="hud">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Purchased</TableHead>
                      <TableHead numeric>Key</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keysQuery.isPending ? (
                      <TableRowsSkeleton rows={PAGE_SIZE} cols={5} />
                    ) : licenseKeys.length === 0 ? (
                      <TableEmptyRow colSpan={5}>{emptyState}</TableEmptyRow>
                    ) : (
                      licenseKeys.map((key, index) => (
                        <TableRow key={key.keyId || key._id || `key-${index}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <SafeImage
                                src={key.productImage}
                                alt=""
                                w={40}
                                className="size-10 shrink-0 rounded-md border border-border object-cover"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-fg">
                                  {key.productName || 'Product'}
                                </p>
                                <p className="truncate text-xs text-fg-subtle">
                                  Sold by {key.sellerName || 'Seller'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {key.platform ? (
                              <PlatformBadge platform={key.platform} />
                            ) : (
                              <span className="text-fg-subtle">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-fg-muted">{displayOrderId(key)}</TableCell>
                          <TableCell
                            className="text-fg-muted"
                            title={formatExactTitle(key.purchaseDate || key.orderDate)}
                          >
                            {formatRelativeDate(key.purchaseDate || key.orderDate)}
                          </TableCell>
                          <TableCell numeric>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => revealMutation.mutate(key?.keyId || key?._id)}
                              disabled={revealMutation.isPending}
                            >
                              <Eye aria-hidden="true" />
                              Reveal
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden">
                {keysQuery.isPending ? (
                  <CardListSkeleton rows={4} />
                ) : licenseKeys.length === 0 ? (
                  emptyState
                ) : (
                  <ul className="space-y-3">
                    {licenseKeys.map((key, index) => (
                      <li
                        key={key.keyId || key._id || `key-m-${index}`}
                        className="rounded-xl border border-brand-cyan/12 bg-brand-cyan/3 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <SafeImage
                            src={key.productImage}
                            alt=""
                            w={48}
                            className="size-12 shrink-0 rounded-md border border-border object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-fg">
                              {key.productName || 'Product'}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-fg-subtle">
                              {displayOrderId(key)} ·{' '}
                              {formatRelativeDate(key.purchaseDate || key.orderDate)}
                            </p>
                            {key.platform && (
                              <div className="mt-2">
                                <PlatformBadge platform={key.platform} />
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          className="mt-3 w-full"
                          size="sm"
                          variant="outline"
                          onClick={() => revealMutation.mutate(key?.keyId || key?._id)}
                          disabled={revealMutation.isPending}
                        >
                          <Eye aria-hidden="true" />
                          Reveal key
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Pagination
                page={page}
                totalPages={pagination.pages}
                onPageChange={setPage}
                total={pagination.total}
                totalNoun="keys"
              />
            </>
          )}
        </CardContent>
      </Card>

      <LicenseKeysModal
        open={isRevealOpen}
        onOpenChange={(open) => {
          setIsRevealOpen(open);
          if (!open) setRevealDetails(null);
        }}
        licenseDetails={revealDetails}
        loading={revealMutation.isPending}
        footerNote="Save this somewhere safe — treat it like a password."
      />
    </div>
  );
};

export default LicenseKeys;
