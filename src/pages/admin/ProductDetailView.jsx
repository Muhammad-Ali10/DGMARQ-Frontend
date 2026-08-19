import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAPI, masterCatalogAPI, offerAPI } from '@services/api';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Badge } from '@components/ui/badge';
import { Label } from '@components/ui/label';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Loading, ErrorMessage } from '@components/ui/loading';
import { ArrowLeft, Package, Store, Tag, Image as ImageIcon, Calendar, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import SafeImage from '@components/ui/safe-image';
import { REGION_PRESET_MAP } from '@lib/regionPresets';

const ProductDetailView = () => {
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

  // Seller offers listed against this (master) product.
  const { data: offers = [], isLoading: offersLoading } = useQuery({
    queryKey: ['admin-product-offers', productId],
    queryFn: () => masterCatalogAPI.getProductOffers(productId).then((res) => res.data.data),
    enabled: !!productId,
  });


  // Per-offer moderation happens here (the Seller Offers list is just an overview).
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');

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
    onSuccess: () => { refreshOffers(); setRejecting(null); setReason(''); toast.success('Offer rejected'); },
    onError: (err) => toast.error(err?.response?.data?.message || 'Reject failed'),
  });

  const featuredMutation = useMutation({
    mutationFn: ({ offerId, approve }) => offerAPI.adminDecideFeatured(offerId, { approve }),
    onSuccess: (res) => {
      refreshOffers();
      // Approving flips Product.hasFeaturedOffer through the offer rollup, so
      // the product header needs refreshing too.
      queryClient.invalidateQueries({ queryKey: ['admin-product-details', productId] });
      toast.success(res?.data?.message || 'Updated');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Could not update featuring'),
  });

  const offerStatusVariant = (s) => (s === 'approved' || s === 'active' ? 'success' : s === 'rejected' ? 'destructive' : s === 'pending' ? 'warning' : 'default');

  if (isLoading) return <Loading message="Loading product details..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || "Error loading product details"} />;

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'destructive',
      active: 'success',
      draft: 'default',
    };
    // Catalog status of the MASTER itself — buyer visibility is separate
    // (hasStock: ≥1 approved offer with available stock) and shown next to it.
    const statusLabels = {
      pending: 'Pending Approval',
      active: 'Active (Catalog)',
      approved: 'Active (Catalog)',
      rejected: 'Rejected',
      draft: 'Draft',
    };
    const displayLabel = statusLabels[status] || status.toUpperCase();
    return <Badge variant={variants[status] || 'default'} className="text-sm px-3 py-1">{displayLabel}</Badge>;
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="border-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Product Details</h1>
            <p className="text-sm sm:text-base text-gray-400 mt-1">Master catalog product — review info &amp; moderate seller offers</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Product Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card variant="hud">
            <CardHeader className="border-b ">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label className="text-gray-400">Product Name</Label>
                <p className="text-white text-lg font-semibold mt-1">{product?.name}</p>
              </div>
              
              <div>
                <Label className="text-gray-400">Description</Label>
                <p className="text-white mt-1 whitespace-pre-wrap">{product?.description || 'No description'}</p>
              </div>

              {(product?.publishers || product?.developers || product?.releaseDate) && (
                <div className="grid grid-cols-2 gap-4">
                  {product?.publishers && (
                    <div>
                      <Label className="text-gray-400">Publishers</Label>
                      <p className="text-white mt-1">{product.publishers}</p>
                    </div>
                  )}
                  {product?.developers && (
                    <div>
                      <Label className="text-gray-400">Developers</Label>
                      <p className="text-white mt-1">{product.developers}</p>
                    </div>
                  )}
                  {product?.releaseDate && (
                    <div>
                      <Label className="text-gray-400">Release Date</Label>
                      <p className="text-white mt-1">{new Date(product.releaseDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              )}
              {product?.activationDetails && (
                <div>
                  <Label className="text-gray-400">Activation Details</Label>
                  <p className="text-white mt-1 whitespace-pre-wrap text-sm">{product.activationDetails}</p>
                </div>
              )}
              {product?.systemRequirements && (
                <div>
                  <Label className="text-gray-400">System Requirements</Label>
                  <p className="text-white mt-1 whitespace-pre-wrap text-sm">{product.systemRequirements}</p>
                </div>
              )}

              <div>
                <Label className="text-gray-400">Lowest Offer Price</Label>
                <p className="text-white font-medium mt-1">
                  {product?.lowestPrice != null
                    ? `$${Number(product.lowestPrice).toFixed(2)}`
                    : 'No live offers yet'}
                </p>
              </div>


              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Stock</Label>
                  <Badge variant={product?.stock > 0 ? 'success' : 'destructive'} className="mt-1">
                    {product?.stock || 0} available
                  </Badge>
                </div>
                <div>
                  <Label className="text-gray-400">Product Type</Label>
                  <Badge variant="outline" className="mt-1">
                    {product?.productType === 'ACCOUNT_BASED' ? 'Account' : 'License Key'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Catalog Status</Label>
                  <div className="mt-1">{getStatusBadge(product?.status)}</div>
                </div>
                <div>
                  <Label className="text-gray-400">Buyer Visibility</Label>
                  <div className="mt-1">
                    {product?.hasStock ? (
                      <Badge variant="success" className="text-sm px-3 py-1">Live — visible to buyers</Badge>
                    ) : product?.isPreorder && !product?.preorderReleasedAt && product?.offersCount > 0 ? (
                      <Badge variant="success" className="text-sm px-3 py-1">Live — pre-order (no stock needed)</Badge>
                    ) : (
                      <Badge variant="warning" className="text-sm px-3 py-1">Hidden — needs an approved offer with stock</Badge>
                    )}
                  </div>
                </div>
              </div>

              {product?.rejectionReason && (
                <div>
                  <Label className="text-gray-400">Rejection Reason</Label>
                  <p className="text-red-400 mt-1">{product.rejectionReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          {product?.images && product.images.length > 0 && (
            <Card variant="hud">
              <CardHeader className="border-b ">
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Product Images
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {product.images.map((image, index) => (
                    <SafeImage
                      key={index}
                      src={image}
                      alt={`${product.name} - Image ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border border-gray-700"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Info — sellers appear per-offer below; masters are admin-owned,
            so there is no product-level "Seller Information" card. */}
        <div className="space-y-6">
          {/* Category & Attributes */}
          <Card variant="hud">
            <CardHeader className="border-b ">
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Categories & Attributes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label className="text-gray-400">Category</Label>
                <p className="text-white mt-1">{product?.categoryId?.name || 'N/A'}</p>
              </div>
              {product?.subCategoryId?.name && (
                <div>
                  <Label className="text-gray-400">Subcategory</Label>
                  <p className="text-white mt-1">{product.subCategoryId.name}</p>
                </div>
              )}
              {product?.platform?.name && (
                <div>
                  <Label className="text-gray-400">Platform</Label>
                  <p className="text-white mt-1">{product.platform.name}</p>
                </div>
              )}
              {product?.region?.name && (
                <div>
                  <Label className="text-gray-400">Region</Label>
                  <p className="text-white mt-1">{product.region.name}</p>
                </div>
              )}
              {product?.type?.name && (
                <div>
                  <Label className="text-gray-400">Type</Label>
                  <p className="text-white mt-1">{product.type.name}</p>
                </div>
              )}
              {product?.genre?.name && (
                <div>
                  <Label className="text-gray-400">Genre</Label>
                  <p className="text-white mt-1">{product.genre.name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card variant="hud">
            <CardHeader className="border-b ">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label className="text-gray-400">Created At</Label>
                <p className="text-white mt-1">
                  {product?.createdAt ? new Date(product.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>
              {product?.approvedAt && (
                <div>
                  <Label className="text-gray-400">Approved At</Label>
                  <p className="text-white mt-1">{new Date(product.approvedAt).toLocaleString()}</p>
                </div>
              )}
              <div>
                <Label className="text-gray-400">Total Keys/Accounts</Label>
                <p className="text-white mt-1">{product?.totalKeysCount || 0}</p>
              </div>
              <div>
                <Label className="text-gray-400">Available Keys/Accounts</Label>
                <p className="text-white mt-1">{product?.availableKeysCount || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sellers & Offers listed against this master product */}
      <Card variant="hud">
        <CardHeader className="border-b ">
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Sellers &amp; Offers
            {offers.length > 0 && (
              <Badge variant="default" className="ml-1">{offers.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {offersLoading ? (
            <p className="text-gray-400 py-8 text-center">Loading offers…</p>
          ) : offers.length === 0 ? (
            <p className="text-gray-400 py-8 text-center">
              No seller has listed an offer on this product yet. It stays in the catalog
              (admin-only) and is shown to buyers only once an approved offer has available stock.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table variant="hud">
                <TableHeader>
                  <TableRow className="border-gray-700 bg-secondary/30 hover:bg-secondary/30">
                    <TableHead className="text-gray-300">Seller</TableHead>
                    <TableHead className="text-gray-300">Price</TableHead>
                    <TableHead className="text-gray-300">Discount</TableHead>
                    <TableHead className="text-gray-300">Region</TableHead>
                    <TableHead className="text-gray-300">Stock</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Featured</TableHead>
                    <TableHead className="text-gray-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offers.map((o) => (
                    <TableRow key={o._id} className="border-gray-700 hover:bg-secondary/20">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {o.sellerId?.shopLogo && (
                            <SafeImage src={o.sellerId.shopLogo} alt={o.sellerId?.shopName || 'Seller'} className="w-8 h-8 rounded object-cover border border-gray-700" hideOnError />
                          )}
                          <span className="text-white font-medium">{o.sellerId?.shopName || 'N/A'}</span>
                          {o.sellerId?._id && (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => navigate(`/admin/sellers/${o.sellerId._id}`)}
                              className="text-accent-on-dark p-0 h-auto text-xs"
                            >
                              View
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-white">${Number(o.price || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-gray-300">{o.discount || 0}%</TableCell>
                      <TableCell className="text-gray-300">
                        {o.regionCodes?.length
                          ? o.regionCodes.map((c) => REGION_PRESET_MAP.get(c)?.name || c).join(', ')
                          : 'All regions'}
                        {o.countries?.length > 0 && (
                          <span className="ml-1 text-xs text-sky-400">(+{o.countries.length} extra)</span>
                        )}
                        {o.excludedCountries?.length > 0 && (
                          <span className="ml-1 text-xs text-red-400">(−{o.excludedCountries.length} excl.)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={o.availableKeysCount > 0 ? 'success' : 'destructive'}>{o.availableKeysCount || 0}</Badge>
                      </TableCell>
                      <TableCell><Badge variant={offerStatusVariant(o.status)}>{o.status}</Badge></TableCell>
                      {/* Featuring is a separate, seller-purchased promotion —
                          its own request/decision cycle alongside listing approval. */}
                      <TableCell>
                        {o.featuredStatus === 'approved' ? (
                          <Badge variant="success">Featured</Badge>
                        ) : o.featuredStatus === 'pending' ? (
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary">Requested</Badge>
                            <Button size="sm" variant="outline" className="h-7 px-2" disabled={featuredMutation.isPending}
                              onClick={() => featuredMutation.mutate({ offerId: o._id, approve: true })}>
                              Allow
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-red-400" disabled={featuredMutation.isPending}
                              onClick={() => featuredMutation.mutate({ offerId: o._id, approve: false })}>
                              Deny
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {o.status === 'pending' ? (
                          <div className="flex items-center gap-2 justify-end">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" disabled={approveOfferMutation.isPending} onClick={() => approveOfferMutation.mutate(o._id)}>
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="hover:bg-red-700" onClick={() => { setRejecting(o); setReason(''); }}>
                              <XCircle className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject offer dialog */}
      <Dialog open={!!rejecting} onOpenChange={(o) => { if (!o) { setRejecting(null); setReason(''); } }}>
        <DialogContent className="">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold">Reject Offer</DialogTitle>
            <DialogDescription className="text-gray-400">
              {rejecting?.sellerId?.shopName ? `Seller: ${rejecting.sellerId.shopName}. ` : ''}Reason will be sent to the seller (in-app + email).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-gray-300">Rejection Reason *</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this offer rejected?" className="bg-secondary border-gray-700 text-white min-h-[100px]" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" className="border-gray-700" onClick={() => { setRejecting(null); setReason(''); }}>Cancel</Button>
              <Button variant="destructive" className="hover:bg-red-700" disabled={!reason.trim() || rejectOfferMutation.isPending} onClick={() => rejectOfferMutation.mutate({ offerId: rejecting._id, reason: reason.trim() })}>
                {rejectOfferMutation.isPending ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Rejecting…</> : <><XCircle className="w-4 h-4 mr-2" />Confirm Reject</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetailView;

