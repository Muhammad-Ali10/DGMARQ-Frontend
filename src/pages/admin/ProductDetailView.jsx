import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { ArrowLeft, Package, Store, Tag, DollarSign, Layers, Image as ImageIcon, Calendar, EyeOff } from 'lucide-react';

const ProductDetailView = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ['admin-product-details', productId],
    queryFn: async () => {
      try {
        const response = await adminAPI.getProductDetails(productId);
        return response.data.data;
      } catch (err) {
        throw err;
      }
    },
    retry: 1,
  });

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
            onClick={() => navigate('/admin/products')}
            className="border-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
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
                    <img
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
                  <img
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
    </div>
  );
};

export default ProductDetailView;

