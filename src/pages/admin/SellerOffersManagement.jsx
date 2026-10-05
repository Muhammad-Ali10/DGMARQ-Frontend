import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import { offerAPI } from '@services/api';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Badge } from '@components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Loading, ErrorMessage } from '@components/ui/loading';
import SafeImage from '@components/ui/safe-image';
import { CheckCircle2, XCircle, Clock, Store, Package, Eye, EyeOff, Ban, RotateCcw } from 'lucide-react';
import { Pagination } from '@components/common/Pagination';
import { StatusBadge } from '@components/common/StatusBadge';
import OfferRegionSummary from '@components/common/OfferRegionSummary';
import { ReasonDialog } from '@components/common/ReasonDialog';
import ConfirmationModal from '@components/common/ConfirmationModal';
import useCurrency from '@hooks/useCurrency';
import { useOfferModeration } from '@hooks/useOfferModeration';
import { canRemoveOffer, isRemovedByAdmin, offerStatusKey } from '@lib/offerModeration';

const TABS = [
  { value: 'pending', label: 'Pending', icon: Clock },
  { value: 'approved', label: 'Approved', icon: CheckCircle2 },
  { value: 'rejected', label: 'Rejected', icon: XCircle },
  // Removed by an admin, or delisted by the out-of-stock sweep. Both are hidden
  // from buyers — and until this tab existed they were hidden from admins too.
  { value: 'delisted', label: 'Delisted', icon: EyeOff },
];

const SellerOffersManagement = () => {
  const navigate = useNavigate();
  const { format: formatMoney } = useCurrency();
  const [tab, setTab] = useState('pending');
  const [page, setPage] = useState(1);
  const [removing, setRemoving] = useState(null);
  const [restoring, setRestoring] = useState(null);
  const { remove, restore } = useOfferModeration({ onRemoved: () => setRemoving(null) });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-offers', tab, page],
    queryFn: () => offerAPI.adminGetOffers({ status: tab, page, limit: 10 }).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });

  // Tab counts = number of PRODUCTS per status, so a badge always matches the
  // number of product groups listed under that tab.
  const countQueries = useQueries({
    queries: TABS.map(({ value }) => ({
      queryKey: ['admin-offers-count', value],
      queryFn: () =>
        offerAPI.adminGetOffers({ status: value, limit: 1 }).then((r) => r.data.data.pagination.total),
    })),
  });
  const counts = Object.fromEntries(TABS.map(({ value }, i) => [value, countQueries[i].data ?? 0]));

  const groups = data?.groups || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  if (isLoading && !groups.length) return <Loading message="Loading offers..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || 'Error loading offers'} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-info/40 bg-info-soft text-info"><Store className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Seller Offers</h1>
          <p className="text-sm text-gray-400 mt-1">
            Every seller listing, grouped by product. Review new offers on the product page; remove or restore live ones here.
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-secondary border border-gray-700">
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="data-[state=active]:bg-accent data-[state=active]:text-white text-gray-300">
              <Icon className="h-4 w-4 mr-2" /> {label} ({counts[value]})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card variant="hud">
        <CardHeader className="border-b border-info/15">
          <CardTitle className="capitalize">{tab} offers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {groups.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-8 h-8 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No {tab} offers</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table variant="hud">
                  <TableHeader>
                    <TableRow className="border-gray-700 bg-secondary/30 hover:bg-secondary/30">
                      <TableHead className="text-gray-300">Seller</TableHead>
                      <TableHead className="text-gray-300">Price</TableHead>
                      <TableHead className="text-gray-300">Region</TableHead>
                      <TableHead className="text-gray-300">Stock</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((g) => (
                      <Fragment key={g.product?._id || g.offers?.[0]?._id}>
                        {/* Product header row — the offers below are this product's. */}
                        <TableRow className="border-gray-700 bg-secondary/20 hover:bg-secondary/20">
                          <TableCell colSpan={6}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                {g.product?.images?.length ? (
                                  <SafeImage src={g.product.images[0]} alt={g.product?.name} className="w-10 h-10 object-cover rounded border border-gray-700" />
                                ) : (
                                  <div className="w-10 h-10 bg-secondary/50 rounded border border-gray-700 flex items-center justify-center"><Package className="w-4 h-4 text-gray-500" /></div>
                                )}
                                <span className="text-white font-semibold truncate">{g.product?.name || 'N/A'}</span>
                                <Badge variant="default">{g.offers.length} offer{g.offers.length > 1 ? 's' : ''}</Badge>
                              </div>
                              <Button size="sm" variant="outline" className="border-gray-700 shrink-0" onClick={() => g.product?._id && navigate(`/admin/products/${g.product._id}`)}>
                                <Eye className="h-4 w-4 mr-1" /> View product
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {g.offers.map((o) => (
                          <TableRow key={o._id} className="border-gray-700 hover:bg-secondary/10">
                            <TableCell>
                              <div className="text-white">{o.sellerId?.shopName || 'N/A'}</div>
                              {o.sellerId?.userId?.email && (
                                <div className="text-xs text-gray-500">{o.sellerId.userId.email}</div>
                              )}
                            </TableCell>
                            <TableCell className="text-white">{formatMoney(o.price || 0)}</TableCell>
                            {/* Where the keys can be activated. This page showed
                                nothing at all before, so an admin reviewing an
                                offer could not see what the seller had chosen. */}
                            <TableCell>
                              <OfferRegionSummary offer={o} />
                            </TableCell>
                            <TableCell>
                              <Badge variant={o.availableKeysCount > 0 ? 'success' : 'destructive'}>{o.availableKeysCount || 0}</Badge>
                            </TableCell>
                            <TableCell>
                              <StatusBadge domain="offer" status={offerStatusKey(o)} />
                              {isRemovedByAdmin(o) && o.delistNote && (
                                <p className="mt-1 max-w-xs text-xs text-red-300" title={o.delistNote}>Reason: {o.delistNote}</p>
                              )}
                              {o.status === 'delisted' && o.delistReason === 'out_of_stock' && (
                                <p className="mt-1 text-xs text-gray-500">Out of stock — relists when restocked</p>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {o.status === 'pending' ? (
                                <Button size="sm" variant="outline" className="border-gray-700" onClick={() => navigate(`/admin/products/${o.productId?._id || o.productId}`)}>
                                  Review
                                </Button>
                              ) : canRemoveOffer(o) ? (
                                <Button size="sm" variant="destructive" className="hover:bg-red-700" onClick={() => setRemoving(o)}>
                                  <Ban className="h-4 w-4 mr-1" /> Remove
                                </Button>
                              ) : isRemovedByAdmin(o) ? (
                                <Button size="sm" variant="outline" className="border-gray-700" disabled={restore.isPending} onClick={() => setRestoring(o)}>
                                  <RotateCcw className="h-4 w-4 mr-1" /> Restore
                                </Button>
                              ) : (
                                <span className="text-gray-500 text-sm">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination page={page} totalPages={pagination.pages} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      <ReasonDialog
        open={!!removing}
        onOpenChange={(open) => { if (!open) setRemoving(null); }}
        title="Remove offer"
        description={`${removing?.sellerId?.shopName || 'This seller'}'s listing is hidden from buyers immediately and can no longer be bought. Their inventory is kept, and you can restore it later. The reason is sent to the seller (in-app + email).`}
        label="Reason for removal"
        placeholder="Why is this offer being removed?"
        confirmText="Remove offer"
        pendingText="Removing…"
        icon={Ban}
        pending={remove.isPending}
        onConfirm={(reason) => remove.mutate({ offerId: removing._id, reason })}
      />

      <ConfirmationModal
        open={!!restoring}
        onOpenChange={(open) => { if (!open) setRestoring(null); }}
        title="Restore offer"
        description={`${restoring?.sellerId?.shopName || "The seller"}'s listing goes live again and the seller is notified.`}
        confirmText="Restore"
        onConfirm={() => restore.mutate(restoring._id)}
      />
    </div>
  );
};

export default SellerOffersManagement;
