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
import { ArrowLeft, Package, Store, Tag, DollarSign, Layers, Image as ImageIcon, Calendar, EyeOff, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import SafeImage from '@components/ui/safe-image';

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

  const featuredMutation = useMutation({
    mutationFn: (data) => adminAPI.updateProductFeaturedSettings(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product-details', productId] });
      toast.success('Featured settings updated');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to update featured settings');
    },
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
    // Map status to user-friendly labels
    const statusLabels = {
      pending: 'Pending Approval',
      active: 'Approved / Published',
      approved: 'Approved / Published',
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
            <p className="text-sm sm:text-base text-gray-400 mt-1">View product information (Read-Only)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Product Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="bg-primary border-gray-700">
            <CardHeader className="border-b border-gray-700">
              <CardTitle className="text-white flex items-center gap-2">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Price</Label>
                  <p className="text-white font-medium mt-1">${product?.price?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Discount</Label>
                  <p className="text-white font-medium mt-1">{product?.discount || 0}%</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-end">
                <div className="space-y-1">
                  <Label className="text-gray-400">Featured Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {product?.isFeatured ? (
                      <Badge variant="success" className="text-xs px-2 py-0.5">
                        Featured
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        Not Featured
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-400">Featured Extra Commission (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={
                        typeof product?.featuredExtraCommission === 'number'
                          ? product.featuredExtraCommission
                          : 10
                      }
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (value === '' || !product?._id) return;
                        const num = Number(value);
                        if (!Number.isFinite(num) || num < 0 || num > 100) {
                          toast.error('Featured extra commission must be between 0 and 100');
                          e.target.value =
                            typeof product.featuredExtraCommission === 'number'
                              ? String(product.featuredExtraCommission)
                              : '10';
                          return;
                        }
                        featuredMutation.mutate({
                          featuredExtraCommission: num,
                          isFeatured: product.isFeatured ?? false,
                        });
                      }}
                      className="bg-secondary border-gray-700 text-white max-w-[120px] h-9"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant={product?.isFeatured ? 'secondary' : 'default'}
                  size="sm"
                  disabled={featuredMutation.isPending}
                  onClick={() => {
                    if (!product?._id) return;
                    const nextFeatured = !product.isFeatured;
                    featuredMutation.mutate({
                      isFeatured: nextFeatured,
                      featuredExtraCommission:
                        typeof product.featuredExtraCommission === 'number'
                          ? product.featuredExtraCommission
                          : 10,
                    });
                  }}
                >
                  {product?.isFeatured ? 'Unmark as Featured' : 'Mark as Featured'}
                </Button>
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

              <div>
                <Label className="text-gray-400">Status</Label>
                <div className="mt-1">{getStatusBadge(product?.status)}</div>
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
            <Card className="bg-primary border-gray-700">
              <CardHeader className="border-b border-gray-700">
                <CardTitle className="text-white flex items-center gap-2">
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

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Seller Information */}
          <Card className="bg-primary border-gray-700">
            <CardHeader className="border-b border-gray-700">
              <CardTitle className="text-white flex items-center gap-2">
                <Store className="h-5 w-5" />
                Seller Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label className="text-gray-400">Shop Name</Label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-white font-medium">{product?.sellerId?.shopName || 'N/A'}</p>
                  {product?.sellerId?._id && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => navigate(`/admin/sellers/${product.sellerId._id}`)}
                      className="text-accent p-0 h-auto"
                    >
                      View Seller
                    </Button>
                  )}
                </div>
              </div>
              {product?.sellerId?.shopLogo && (
                <div>
                  <SafeImage
                    src={product.sellerId.shopLogo}
                    alt={product.sellerId.shopName}
                    className="w-24 h-24 object-cover rounded-lg border border-gray-700"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category & Attributes */}
          <Card className="bg-primary border-gray-700">
            <CardHeader className="border-b border-gray-700">
              <CardTitle className="text-white flex items-center gap-2">
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
          <Card className="bg-primary border-gray-700">
            <CardHeader className="border-b border-gray-700">
              <CardTitle className="text-white flex items-center gap-2">
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
      <Card className="bg-primary border-gray-700">
        <CardHeader className="border-b border-gray-700">
          <CardTitle className="text-white flex items-center gap-2">
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
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 bg-secondary/30 hover:bg-secondary/30">
                    <TableHead className="text-gray-300">Seller</TableHead>
                    <TableHead className="text-gray-300">Price</TableHead>
                    <TableHead className="text-gray-300">Discount</TableHead>
                    <TableHead className="text-gray-300">Region</TableHead>
                    <TableHead className="text-gray-300">Stock</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offers.map((o) => (
                    <TableRow key={o._id} className="border-gray-700 hover:bg-secondary/20">
                      <TableCell className="text-white font-medium">{o.sellerId?.shopName || 'N/A'}</TableCell>
                      <TableCell className="text-white">${Number(o.price || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-gray-300">{o.discount || 0}%</TableCell>
                      <TableCell className="text-gray-300">{o.region?.name || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={o.availableKeysCount > 0 ? 'success' : 'destructive'}>{o.availableKeysCount || 0}</Badge>
                      </TableCell>
                      <TableCell><Badge variant={offerStatusVariant(o.status)}>{o.status}</Badge></TableCell>
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
        <DialogContent className="bg-primary border-gray-700">
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

