import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { ArrowLeft, Store, Mail, MapPin, Calendar, DollarSign, Package, ShoppingCart, FileText, Image as ImageIcon } from 'lucide-react';

const SellerProfileView = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();

  const { data: sellerData, isLoading, isError, error } = useQuery({
    queryKey: ['seller-details', sellerId],
    queryFn: async () => {
      try {
        const response = await adminAPI.getSellerDetails(sellerId);
        return response.data.data;
      } catch (err) {
        throw err;
      }
    },
    retry: 1,
  });

  if (isLoading) return <Loading message="Loading seller details..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || "Error loading seller details"} />;

  const seller = sellerData?.seller;
  const stats = sellerData?.stats || {};

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      active: 'success',
      banned: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'} className="text-sm px-3 py-1">{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/sellers')}
            className="border-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sellers
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Seller Profile</h1>
            <p className="text-sm sm:text-base text-gray-400 mt-1">Complete seller information and statistics</p>
          </div>
        </div>
        {getStatusBadge(seller?.status)}
      </div>

      {/* Seller Header Card */}
      <Card className="bg-primary border-gray-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {seller?.shopLogo && (
              <div className="flex-shrink-0">
                <img
                  src={seller.shopLogo}
                  alt="Shop Logo"
                  className="w-32 h-32 rounded-lg object-cover border-2 border-gray-700"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Store className="h-6 w-6 text-accent" />
                    {seller?.shopName}
                  </h2>
                  <p className="text-gray-400 mt-1">{seller?.description || 'No description provided'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2 text-gray-300">
                  <Mail className="h-4 w-4" />
                  <span>{seller?.userId?.email || 'N/A'}</span>
                </div>
                {seller?.country && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="h-4 w-4" />
                    <span>{seller.city ? `${seller.city}, ` : ''}{seller.state ? `${seller.state}, ` : ''}{seller.country}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="h-4 w-4" />
                  <span>Joined: {new Date(seller?.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Package className="h-4 w-4" />
                  <span>Rating: {seller?.rating || 0}/5</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Products</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-2">{stats.productCount || 0}</p>
              </div>
              <Package className="h-10 w-10 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Orders</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-2">{stats.totalOrders || 0}</p>
              </div>
              <ShoppingCart className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-2">${(stats.totalRevenue || 0).toFixed(2)}</p>
              </div>
              <DollarSign className="h-10 w-10 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shop Information */}
        <Card className="bg-primary border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Store className="h-5 w-5" />
              Shop Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-400 text-sm">Shop Name</Label>
              <p className="text-white mt-1 font-medium">{seller?.shopName}</p>
            </div>
            {seller?.description && (
              <div>
                <Label className="text-gray-400 text-sm">Description</Label>
                <p className="text-white mt-1">{seller.description}</p>
              </div>
            )}
            <div>
              <Label className="text-gray-400 text-sm">Country</Label>
              <p className="text-white mt-1">{seller?.country || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-gray-400 text-sm">State</Label>
              <p className="text-white mt-1">{seller?.state || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-gray-400 text-sm">City</Label>
              <p className="text-white mt-1">{seller?.city || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-gray-400 text-sm">Min Payout Amount</Label>
              <p className="text-white mt-1">${seller?.minPayoutAmount || 0}</p>
            </div>
            <div>
              <Label className="text-gray-400 text-sm">Auto Release Payouts</Label>
              <p className="text-white mt-1">{seller?.payoutAutoRelease ? 'Yes' : 'No'}</p>
            </div>
          </CardContent>
        </Card>

        {/* User Information */}
        <Card className="bg-primary border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Mail className="h-5 w-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-400 text-sm">Email</Label>
              <p className="text-white mt-1">{seller?.userId?.email || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-gray-400 text-sm">Name</Label>
              <p className="text-white mt-1">{seller?.userId?.name || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-gray-400 text-sm">Roles</Label>
              <div className="flex gap-2 mt-1">
                {seller?.userId?.roles?.map((role, index) => (
                  <Badge key={index} variant="secondary">{role}</Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-gray-400 text-sm">Account Status</Label>
              <div className="mt-1">
                <Badge variant={seller?.userId?.isActive ? 'success' : 'destructive'}>
                  {seller?.userId?.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-gray-400 text-sm">Member Since</Label>
              <p className="text-white mt-1">{new Date(seller?.userId?.createdAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shop Banner */}
      {seller?.shopBanner && (
        <Card className="bg-primary border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Shop Banner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={seller.shopBanner}
              alt="Shop Banner"
              className="w-full h-64 object-cover rounded-lg"
            />
          </CardContent>
        </Card>
      )}

      {/* KYC Documents */}
      {seller?.kycDocs && seller.kycDocs.length > 0 && (
        <Card className="bg-primary border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              KYC Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {seller.kycDocs.map((doc, index) => (
                <a
                  key={index}
                  href={doc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center p-4 border border-gray-700 rounded-lg hover:border-accent transition-colors"
                >
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-accent mx-auto mb-2" />
                    <p className="text-white text-sm">Document {index + 1}</p>
                    <p className="text-gray-400 text-xs mt-1">Click to view</p>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SellerProfileView;

