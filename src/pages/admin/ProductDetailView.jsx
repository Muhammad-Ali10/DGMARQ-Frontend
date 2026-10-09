import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAPI, masterCatalogAPI, offerAPI } from '@services/api';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Badge } from '@components/ui/badge';
import { Loading, ErrorMessage } from '@components/ui/loading';
import {
  ArrowLeft, Ban, Calendar, CheckCircle2, Clock, ExternalLink, Image as ImageIcon,
  Layers, Package, Pencil, RotateCcw, Store, Tag, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import SafeImage from '@components/ui/safe-image';
import OfferRegionSummary from '@components/common/OfferRegionSummary';
import { getTypeName } from '@features/catalog/utils/productUtils';
import { StatusBadge } from '@components/common/StatusBadge';
import { ReasonDialog } from '@components/common/ReasonDialog';
import ConfirmationModal from '@components/common/ConfirmationModal';
import { EmptyState } from '@components/common/EmptyState';
import { StatCard, StatCardGrid } from '@components/common/StatCard';
import { Fact, SpecList, SpecRow } from '@components/common/SpecList';
import { TableRowsSkeleton } from '@components/common/Skeletons';
import { useOfferModeration } from '@hooks/useOfferModeration';
import { canRemoveOffer, isRemovedByAdmin, offerStatusKey } from '@lib/offerModeration';
import useCurrency from '@hooks/useCurrency';
import { HUD_LABEL } from '@lib/surface';
import { cn } from '@lib/utils';

const CATALOG_STATUS = {
  pending: { variant: 'warning', label: 'Pending approval' },
  approved: { variant: 'success', label: 'Active in catalog' },
  active: { variant: 'success', label: 'Active in catalog' },
  rejected: { variant: 'destructive', label: 'Rejected' },
  draft: { variant: 'default', label: 'Draft' },
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : null);
const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : 'N/A');

const ProductDetailView = () => {
  const { format: formatMoney } = useCurrency();
  const { productId } = useParams();
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ['admin-product-details', productId],
    queryFn: async () => {
      const response = await adminAPI.getProductDetails(productId);
      return response.data.data;
    },
    retry: 1,
  });

  const { data: offers = [], isLoading: offersLoading } = useQuery({
    queryKey: ['admin-product-offers', productId],
    queryFn: () => masterCatalogAPI.getProductOffers(productId).then((res) => res.data.data),
    enabled: !!productId,
  });

  const [rejecting, setRejecting] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [restoring, setRestoring] = useState(null);
  const [zoomed, setZoomed] = useState(null);
  const { remove, restore } = useOfferModeration({ onRemoved: () => setRemoving(null) });

  const refreshOffers = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-product-offers', productId] });
    queryClient.invalidateQueries({ queryKey: ['admin-product-details', productId] });
  };

  const approveOfferMutation = useMutation({
    mutationFn: (offerId) => offerAPI.adminApproveOffer(offerId),
    onSuccess: () => { refreshOffers(); toast.success('Offer approved — product is now public'); },
    onError: (err) => toast.error(err?.response?.data?.message || 'Approve failed'),
  });

  const rejectOfferMutation = useMutation({
    mutationFn: ({ offerId, reason }) => offerAPI.adminRejectOffer(offerId, { reason }),
    onSuccess: () => { refreshOffers(); setRejecting(null); toast.success('Offer rejected'); },
    onError: (err) => toast.error(err?.response?.data?.message || 'Reject failed'),
  });

  const featuredMutation = useMutation({
    mutationFn: ({ offerId, approve }) => offerAPI.adminDecideFeatured(offerId, { approve }),
    onSuccess: (res) => {
      refreshOffers();
      queryClient.invalidateQueries({ queryKey: ['admin-product-details', productId] });
      toast.success(res?.data?.message || 'Updated');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Could not update featuring'),
  });

  if (isLoading) return <Loading message="Loading product details..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || 'Error loading product details'} />;

  const status = CATALOG_STATUS[product?.status] || { variant: 'default', label: product?.status };
  const livePreorder = product?.isPreorder && !product?.preorderReleasedAt && product?.offersCount > 0;
  const isBuyerVisible = Boolean(product?.hasStock || livePreorder);

  const pendingOffers = offers.filter((o) => o.status === 'pending').length;
  const liveOffers = offers.filter((o) => o.status === 'approved' || o.status === 'active').length;
  const cover = product?.images?.[0];
  const releaseDate = formatDate(product?.releaseDate);

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <Card variant="hud">
        <CardContent className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start">
          {cover ? (
            <SafeImage
              src={cover}
              alt={product?.name}
              className="size-24 shrink-0 rounded-xl border border-brand-cyan/20 object-cover"
              hideOnError
            />
          ) : (
            <div className="flex size-24 shrink-0 items-center justify-center rounded-xl border border-brand-cyan/20 bg-brand-cyan/6 text-info">
              <Package className="size-8" aria-hidden="true" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className={HUD_LABEL}>Master catalog product</p>
            <h1 className="mt-1 wrap-break-word text-2xl font-bold text-fg sm:text-3xl">{product?.name}</h1>
            <p className="mt-1 truncate text-sm text-fg-subtle">
              {getTypeName(product)}
              {product?.slug ? ` · ${product.slug}` : ''}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              {isBuyerVisible ? (
                <Badge variant="success">
                  {livePreorder && !product?.hasStock ? 'Live — pre-order' : 'Live — visible to buyers'}
                </Badge>
              ) : (
                <Badge variant="warning">Hidden — needs an approved offer with stock</Badge>
              )}
              {product?.isPreorder && <Badge variant="info">Pre-order</Badge>}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft aria-hidden="true" />
              Back
            </Button>
            <Button asChild>
              <Link to={`/admin/catalog/${productId}/edit`}>
                <Pencil aria-hidden="true" />
                Edit
              </Link>
            </Button>
            {isBuyerVisible && product?.slug && (
              <Button variant="outline" asChild>
                <a href={`/product/${product.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink aria-hidden="true" />
                  View on site
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {product?.rejectionReason && (
        <div className="rounded-xl border border-danger/35 bg-danger-soft/60 p-4">
          <p className={cn(HUD_LABEL, 'text-danger')}>Rejection reason</p>
          <p className="mt-1 text-sm text-fg">{product.rejectionReason}</p>
        </div>
      )}

      <StatCardGrid>
        <StatCard
          title="Lowest offer"
          value={product?.lowestPrice != null ? formatMoney(product.lowestPrice) : '—'}
          icon={Tag}
          tone="accent"
          description={product?.lowestPrice != null ? 'Cheapest in-stock offer' : 'No live offers yet'}
        />
        <StatCard
          title="Seller offers"
          value={offersLoading ? '—' : offers.length}
          icon={Store}
          tone="info"
          description={offersLoading ? 'Loading…' : `${liveOffers} live`}
        />
        <StatCard
          title="Available stock"
          value={product?.availableKeysCount || 0}
          icon={Layers}
          tone={product?.availableKeysCount > 0 ? 'success' : 'danger'}
          description={`of ${product?.totalKeysCount || 0} uploaded`}
        />
        <StatCard
          title="Awaiting review"
          value={offersLoading ? '—' : pendingOffers}
          icon={Clock}
          tone={pendingOffers > 0 ? 'warning' : 'neutral'}
          description={pendingOffers > 0 ? 'Offers need your decision' : 'Nothing pending'}
        />
      </StatCardGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card variant="hud">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Package className="size-5" aria-hidden="true" />
                Product information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div>
                <p className={HUD_LABEL}>Description</p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
                  {product?.description || 'No description'}
                </p>
              </div>

              {(product?.publishers || product?.developers || releaseDate) && (
                <SpecList>
                  {product?.publishers && <SpecRow label="Publisher" value={product.publishers} />}
                  {product?.developers && <SpecRow label="Developer" value={product.developers} />}
                  {releaseDate && <SpecRow label="Release date" value={releaseDate} />}
                </SpecList>
              )}

              {(product?.activationDetails || product?.systemRequirements) && (
                <SpecList className="grid gap-3">
                  {product?.activationDetails && (
                    <Fact label="Activation details">
                      <span className="whitespace-pre-wrap">{product.activationDetails}</span>
                    </Fact>
                  )}
                  {product?.systemRequirements && (
                    <Fact label="System requirements">
                      <span className="whitespace-pre-wrap">{product.systemRequirements}</span>
                    </Fact>
                  )}
                </SpecList>
              )}
            </CardContent>
          </Card>

          {product?.images?.length > 0 && (
            <Card variant="hud">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="size-5" aria-hidden="true" />
                  Product images
                  <Badge variant="secondary" className="ml-1">{product.images.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {product.images.map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setZoomed(image)}
                      className="group relative overflow-hidden rounded-xl border border-brand-cyan/15 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <SafeImage
                        src={image}
                        alt={`${product.name} — image ${index + 1}`}
                        className="h-40 w-full object-cover transition-transform duration-200 ease-out group-hover:scale-105"
                      />
                      {index === 0 && (
                        <Badge variant="info" className="absolute left-2 top-2">Cover</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card variant="hud">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Tag className="size-5" aria-hidden="true" />
                Categories &amp; attributes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <SpecList>
                <SpecRow label="Category" value={product?.categoryId?.name || 'N/A'} />
                {product?.subCategoryId?.name && (
                  <SpecRow label="Subcategory" value={product.subCategoryId.name} />
                )}
                <SpecRow label="Delivery type" value={getTypeName(product)} />
                {product?.platform?.name && <SpecRow label="Platform" value={product.platform.name} />}
                {product?.region?.name && <SpecRow label="Region" value={product.region.name} />}
                {product?.genre?.name && <SpecRow label="Genre" value={product.genre.name} />}
                {product?.mode?.name && <SpecRow label="Mode" value={product.mode.name} />}
                {product?.device?.name && <SpecRow label="Device" value={product.device.name} />}
                {product?.theme?.name && <SpecRow label="Theme" value={product.theme.name} />}
              </SpecList>
            </CardContent>
          </Card>

          <Card variant="hud">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="size-5" aria-hidden="true" />
                Record
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <SpecList>
                <SpecRow label="Created" value={formatDateTime(product?.createdAt)} />
                {product?.approvedAt && (
                  <SpecRow label="Approved" value={formatDateTime(product.approvedAt)} />
                )}
                {product?.isPreorder && product?.preorderReleaseDate && (
                  <SpecRow label="Pre-order release" value={formatDateTime(product.preorderReleaseDate)} />
                )}
                <SpecRow label="Total inventory" value={product?.totalKeysCount || 0} />
                <SpecRow
                  label="Available"
                  value={product?.availableKeysCount || 0}
                  tone={product?.availableKeysCount > 0 ? 'success' : 'danger'}
                />
              </SpecList>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card variant="hud">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Store className="size-5" aria-hidden="true" />
            Sellers &amp; offers
            {offers.length > 0 && <Badge variant="secondary" className="ml-1">{offers.length}</Badge>}
            {pendingOffers > 0 && <Badge variant="warning">{pendingOffers} awaiting review</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!offersLoading && offers.length === 0 ? (
            <EmptyState
              icon={Store}
              title="No seller has listed this product yet"
              description="It stays in the catalog as an admin-only master. Buyers see it once an approved offer has available stock."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table variant="hud">
                <TableHeader>
                  <TableRow>
                    <TableHead>Seller</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offersLoading ? (
                    <TableRowsSkeleton rows={3} cols={8} />
                  ) : (
                    offers.map((o) => (
                      <TableRow key={o._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {o.sellerId?.shopLogo && (
                              <SafeImage
                                src={o.sellerId.shopLogo}
                                alt={o.sellerId?.shopName || 'Seller'}
                                className="size-8 rounded border border-brand-cyan/15 object-cover"
                                hideOnError
                              />
                            )}
                            <span className="font-medium text-fg">{o.sellerId?.shopName || 'N/A'}</span>
                            {o.sellerId?._id && (
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => navigate(`/admin/sellers/${o.sellerId._id}`)}
                                className="h-auto p-0 text-xs text-accent-on-dark"
                              >
                                View
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums text-fg">{formatMoney(o.price || 0)}</TableCell>
                        <TableCell className="tabular-nums text-fg-muted">{o.discount || 0}%</TableCell>
                        <TableCell className="text-fg-muted">
                          <OfferRegionSummary offer={o} />
                        </TableCell>
                        <TableCell>
                          <Badge variant={o.availableKeysCount > 0 ? 'success' : 'destructive'}>
                            {o.availableKeysCount || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge domain="offer" status={offerStatusKey(o)} />
                          {isRemovedByAdmin(o) && o.delistNote && (
                            <p className="mt-1 max-w-xs text-xs text-danger" title={o.delistNote}>
                              Reason: {o.delistNote}
                            </p>
                          )}
                          {o.status === 'delisted' && o.delistReason === 'out_of_stock' && (
                            <p className="mt-1 text-xs text-fg-subtle">Out of stock — relists when restocked</p>
                          )}
                        </TableCell>
                        <TableCell>
                          {o.featuredStatus === 'approved' ? (
                            <Badge variant="success">Featured</Badge>
                          ) : o.featuredStatus === 'pending' ? (
                            <div className="flex items-center gap-1.5">
                              <Badge variant="secondary">Requested</Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2"
                                disabled={featuredMutation.isPending}
                                onClick={() => featuredMutation.mutate({ offerId: o._id, approve: true })}
                              >
                                Allow
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-danger"
                                disabled={featuredMutation.isPending}
                                onClick={() => featuredMutation.mutate({ offerId: o._id, approve: false })}
                              >
                                Deny
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-fg-subtle">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {o.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                className="bg-success-solid text-white hover:bg-success-solid/85"
                                disabled={approveOfferMutation.isPending}
                                onClick={() => approveOfferMutation.mutate(o._id)}
                              >
                                <CheckCircle2 aria-hidden="true" /> Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => setRejecting(o)}>
                                <XCircle aria-hidden="true" /> Reject
                              </Button>
                            </div>
                          ) : canRemoveOffer(o) ? (
                            <Button size="sm" variant="destructive" onClick={() => setRemoving(o)}>
                              <Ban aria-hidden="true" /> Remove
                            </Button>
                          ) : isRemovedByAdmin(o) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={restore.isPending}
                              onClick={() => setRestoring(o)}
                            >
                              <RotateCcw aria-hidden="true" /> Restore
                            </Button>
                          ) : (
                            <span className="text-sm text-fg-subtle">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!zoomed} onOpenChange={(open) => { if (!open) setZoomed(null); }}>
        <DialogContent className="max-w-3xl" aria-describedby={undefined}>
          <DialogTitle className="sr-only">{product?.name}</DialogTitle>
          {zoomed && (
            <SafeImage
              src={zoomed}
              alt={product?.name}
              className="max-h-[70vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      <ReasonDialog
        open={!!rejecting}
        onOpenChange={(open) => { if (!open) setRejecting(null); }}
        title="Reject Offer"
        description={`${rejecting?.sellerId?.shopName ? `Seller: ${rejecting.sellerId.shopName}. ` : ''}Reason will be sent to the seller (in-app + email).`}
        label="Rejection Reason"
        placeholder="Why is this offer rejected?"
        confirmText="Confirm Reject"
        pendingText="Rejecting…"
        icon={XCircle}
        pending={rejectOfferMutation.isPending}
        onConfirm={(reason) => rejectOfferMutation.mutate({ offerId: rejecting._id, reason })}
      />

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
        description={`${restoring?.sellerId?.shopName || 'The seller'}'s listing goes live again and the seller is notified.`}
        confirmText="Restore"
        onConfirm={() => restore.mutate(restoring._id)}
      />
    </div>
  );
};

export default ProductDetailView;
