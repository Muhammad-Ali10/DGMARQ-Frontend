import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '@services/api';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Label } from '@components/ui/label';
import { Loading, ErrorMessage } from '@components/ui/loading';
import { ArrowLeft, Store, Mail, MapPin, Calendar, DollarSign, Package, ShoppingCart, FileText, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import SafeImage from '@components/ui/safe-image';

// Renders a verification document tile. Image documents show a clickable
// thumbnail; PDFs/other show an icon. Clicking opens the file full-size.
const isImageUrl = (url = '') => /\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?|$)/i.test(url);

const DocumentTile = ({ url, label }) => {
  const image = isImageUrl(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="Click to view full size"
      className="group block overflow-hidden rounded-lg border border-gray-700 transition-colors hover:border-accent"
    >
      {image ? (
        <div className="relative">
          <SafeImage
            src={url}
            alt={label}
            className="h-32 w-full object-cover transition-transform group-hover:scale-105"
          />
          <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 text-center text-xs text-white">
            {label}
          </span>
        </div>
      ) : (
        <div className="flex h-32 flex-col items-center justify-center p-4 text-center">
          <FileText className="mb-2 h-8 w-8 text-accent" />
          <p className="text-sm text-white">{label}</p>
          <p className="mt-1 text-xs text-gray-400">Click to view</p>
        </div>
      )}
    </a>
  );
};

const SellerProfileView = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();

  const { data: sellerData, isLoading, isError, error } = useQuery({
    queryKey: ['seller-details', sellerId],
    queryFn: async () => {
      const response = await adminAPI.getSellerDetails(sellerId);
      return response.data.data;
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
                <SafeImage
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

        <Card className="bg-primary border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Dispute Rate</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-2">{stats.disputeRate ?? 0}%</p>
                <p className="text-xs text-gray-400 mt-1">{stats.disputeCount ?? 0} disputes / {stats.totalOrders ?? 0} orders</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-orange-500" />
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
            {/*
              Phase 6: legacy "Min Payout Amount" tile removed. The withdrawal
              minimum is now an admin-wide platform setting (Admin Settings ->
              "Minimum withdrawal amount"), enforced by withdrawal.service.js.
              Per-seller overrides are no longer supported.
            */}
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

      {/* Identity & KYC Verification */}
      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Identity &amp; KYC Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-gray-400 text-sm">KYC Status</Label>
              <div className="mt-1">
                <Badge
                  variant={
                    seller?.kycStatus === 'verified' ? 'success'
                      : seller?.kycStatus === 'rejected' ? 'destructive'
                      : 'warning'
                  }
                >
                  {(seller?.kycStatus || 'not_submitted').replace(/_/g, ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-gray-400 text-sm">Full Legal Name</Label>
              <p className="text-white mt-1">{seller?.fullLegalName || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-gray-400 text-sm">Date of Birth</Label>
              <p className="text-white mt-1">
                {seller?.dateOfBirth ? new Date(seller.dateOfBirth).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-gray-400 text-sm">ID Type</Label>
              <p className="text-white mt-1">
                {seller?.idType
                  ? (seller.idType === 'drivers_license' ? "Driver's License" : 'Passport')
                  : 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-gray-400 text-sm">Business Name</Label>
              <p className="text-white mt-1">{seller?.businessName || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-gray-400 text-sm">Additional Notes</Label>
              <p className="text-white mt-1 whitespace-pre-wrap">{seller?.additionalNotes || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-gray-400 text-sm">Tax ID</Label>
              <p className="text-white mt-1">
                {seller?.taxId ? `${seller.taxId}${seller.taxIdType ? ` (${seller.taxIdType})` : ''}` : 'N/A'}
              </p>
            </div>
          </div>

          {/* Verification documents */}
          {(() => {
            const docs = [
              { label: 'ID — Front', url: seller?.idFrontImage },
              { label: 'ID — Back', url: seller?.idBackImage },
              { label: 'Proof of Address', url: seller?.proofOfAddress },
              { label: 'Certificate of Incorporation', url: seller?.certificateOfIncorporation },
            ].filter((d) => d.url);
            if (docs.length === 0) {
              return <p className="text-gray-400 text-sm">No verification documents uploaded.</p>;
            }
            return (
              <div>
                <Label className="text-gray-400 text-sm">Verification Documents</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  {docs.map((doc) => (
                    <DocumentTile key={doc.label} url={doc.url} label={doc.label} />
                  ))}
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

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
            <SafeImage
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {seller.kycDocs.map((doc, index) => (
                <DocumentTile key={index} url={doc} label={`Document ${index + 1}`} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SellerProfileView;

