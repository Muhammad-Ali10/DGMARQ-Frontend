import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Badge } from '../../components/ui/badge';
import { User, Image, Shield, CheckCircle, XCircle, Camera, Upload } from 'lucide-react';
import { showSuccess, showError, showApiError } from '../../utils/toast';

const SellerProfile = () => {
  const queryClient = useQueryClient();
  const [shopLogo, setShopLogo] = useState(null);
  const [shopBanner, setShopBanner] = useState(null);
  const [previewLogo, setPreviewLogo] = useState('');
  const [previewBanner, setPreviewBanner] = useState('');

  const { data: sellerInfo, isLoading: infoLoading } = useQuery({
    queryKey: ['seller-info'],
    queryFn: () => sellerAPI.getSellerInfo().then(res => res.data.data),
  });

  const { data: verificationBadge, isLoading: badgeLoading } = useQuery({
    queryKey: ['verification-badge'],
    queryFn: () => sellerAPI.getVerificationBadge().then(res => res.data.data),
  });

  const [profileData, setProfileData] = useState({
    shopName: '',
    description: '',
    country: '',
    state: '',
    city: '',
  });

  // Initialize form data when sellerInfo loads
  useEffect(() => {
    if (sellerInfo) {
      setProfileData({
        shopName: sellerInfo.shopName || '',
        description: sellerInfo.description || '',
        country: sellerInfo.country || '',
        state: sellerInfo.state || '',
        city: sellerInfo.city || '',
      });
      setPreviewLogo(sellerInfo.shopLogo || '');
      setPreviewBanner(sellerInfo.shopBanner || '');
    }
  }, [sellerInfo]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => sellerAPI.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-info']);
      showSuccess('Profile updated successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to update profile');
    },
  });

  const updateLogoMutation = useMutation({
    mutationFn: (formData) => sellerAPI.updateShopLogo(formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-info']);
      setShopLogo(null);
      showSuccess('Shop logo updated successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to update shop logo');
    },
  });

  const updateBannerMutation = useMutation({
    mutationFn: (formData) => sellerAPI.updateShopBanner(formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-info']);
      setShopBanner(null);
      showSuccess('Shop banner updated successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to update shop banner');
    },
  });

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handleLogoUpdate = (e) => {
    e.preventDefault();
    if (!shopLogo) {
      showError('Please select a logo file');
      return;
    }
    const formData = new FormData();
    formData.append('shopLogo', shopLogo);
    updateLogoMutation.mutate(formData);
  };

  const handleBannerUpdate = (e) => {
    e.preventDefault();
    if (!shopBanner) {
      showError('Please select a banner file');
      return;
    }
    const formData = new FormData();
    formData.append('shopBanner', shopBanner);
    updateBannerMutation.mutate(formData);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setShopLogo(file);
      setPreviewLogo(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setShopBanner(file);
      setPreviewBanner(URL.createObjectURL(file));
    }
  };

  if (infoLoading || badgeLoading) return <Loading message="Loading seller profile..." />;

  const badge = verificationBadge?.criteria || verificationBadge || {};
  const isVerified = badge.hasKYC && badge.isActive && badge.hasPayoutAccount && badge.hasProducts && badge.hasSales;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Seller Profile</h1>
        <p className="text-gray-400 mt-1">Manage your shop information and settings</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-primary border-gray-700">
          <TabsTrigger value="profile" className="data-[state=active]:bg-accent data-[state=active]:text-white">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="images" className="data-[state=active]:bg-accent data-[state=active]:text-white">
            <Image className="w-4 h-4 mr-2" />
            Shop Images
          </TabsTrigger>
          <TabsTrigger value="verification" className="data-[state=active]:bg-accent data-[state=active]:text-white">
            <Shield className="w-4 h-4 mr-2" />
            Verification
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="bg-primary border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Shop Information</CardTitle>
              <CardDescription className="text-gray-400">
                Update your shop details and location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shopName" className="text-gray-300">Shop Name</Label>
                  <Input
                    id="shopName"
                    type="text"
                    value={profileData.shopName}
                    onChange={(e) => setProfileData({ ...profileData, shopName: e.target.value })}
                    className="bg-secondary border-gray-700 text-white"
                    placeholder="Enter shop name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-300">Description</Label>
                  <textarea
                    id="description"
                    value={profileData.description}
                    onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Enter shop description"
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-gray-300">Country</Label>
                    <Input
                      id="country"
                      type="text"
                      value={profileData.country}
                      onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                      className="bg-secondary border-gray-700 text-white"
                      placeholder="Country"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-gray-300">State</Label>
                    <Input
                      id="state"
                      type="text"
                      value={profileData.state}
                      onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                      className="bg-secondary border-gray-700 text-white"
                      placeholder="State"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-gray-300">City</Label>
                    <Input
                      id="city"
                      type="text"
                      value={profileData.city}
                      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                      className="bg-secondary border-gray-700 text-white"
                      placeholder="City"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="w-full bg-accent hover:bg-blue-700"
                >
                  {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <div className="space-y-6">
            <Card className="bg-primary border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Shop Logo</CardTitle>
                <CardDescription className="text-gray-400">
                  Update your shop logo (recommended: 200x200px)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogoUpdate} className="space-y-4">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <img
                        src={previewLogo || '/placeholder-logo.png'}
                        alt="Shop Logo"
                        className="w-32 h-32 rounded-lg object-cover border-4 border-accent"
                      />
                      <label
                        htmlFor="shopLogo"
                        className="absolute bottom-0 right-0 bg-accent text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                      </label>
                      <input
                        id="shopLogo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={updateLogoMutation.isPending || !shopLogo}
                    className="w-full bg-accent hover:bg-blue-700"
                  >
                    {updateLogoMutation.isPending ? 'Updating...' : 'Update Logo'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-primary border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Shop Banner</CardTitle>
                <CardDescription className="text-gray-400">
                  Update your shop banner (recommended: 1200x300px)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBannerUpdate} className="space-y-4">
                  <div className="space-y-4">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-700">
                      <img
                        src={previewBanner || '/placeholder-banner.png'}
                        alt="Shop Banner"
                        className="w-full h-full object-cover"
                      />
                      <label
                        htmlFor="shopBanner"
                        className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer hover:bg-black/70 transition-colors"
                      >
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-white mx-auto mb-2" />
                          <span className="text-white text-sm">Click to upload banner</span>
                        </div>
                      </label>
                      <input
                        id="shopBanner"
                        type="file"
                        accept="image/*"
                        onChange={handleBannerChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={updateBannerMutation.isPending || !shopBanner}
                    className="w-full bg-accent hover:bg-blue-700"
                  >
                    {updateBannerMutation.isPending ? 'Updating...' : 'Update Banner'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="verification">
          <Card className="bg-primary border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Verification Badge Status
              </CardTitle>
              <CardDescription className="text-gray-400">
                Check your verification badge eligibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div className="flex items-center gap-3">
                    {isVerified ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-gray-500" />
                    )}
                    <div>
                      <h3 className="text-white font-semibold">Verification Badge</h3>
                      <p className="text-sm text-gray-400">
                        {isVerified ? 'You are verified!' : 'Complete all requirements to get verified'}
                      </p>
                    </div>
                  </div>
                  {isVerified ? (
                    <Badge variant="success" className="bg-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="bg-yellow-600">
                      <XCircle className="w-3 h-3 mr-1" />
                      Not Verified
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="text-white font-medium">Verification Requirements:</h4>
                  <div className="space-y-2">
                    <div className={`flex items-center justify-between p-3 rounded-lg ${badge.hasKYC ? 'bg-green-900/20 border border-green-700' : 'bg-gray-800 border border-gray-700'}`}>
                      <span className="text-gray-300">KYC Documents Submitted</span>
                      {badge.hasKYC ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className={`flex items-center justify-between p-3 rounded-lg ${badge.isActive ? 'bg-green-900/20 border border-green-700' : 'bg-gray-800 border border-gray-700'}`}>
                      <span className="text-gray-300">Account Active</span>
                      {badge.isActive ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className={`flex items-center justify-between p-3 rounded-lg ${badge.hasPayoutAccount ? 'bg-green-900/20 border border-green-700' : 'bg-gray-800 border border-gray-700'}`}>
                      <span className="text-gray-300">Payout Account Linked</span>
                      {badge.hasPayoutAccount ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className={`flex items-center justify-between p-3 rounded-lg ${badge.hasProducts ? 'bg-green-900/20 border border-green-700' : 'bg-gray-800 border border-gray-700'}`}>
                      <span className="text-gray-300">Has Active Products</span>
                      {badge.hasProducts ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className={`flex items-center justify-between p-3 rounded-lg ${badge.hasSales ? 'bg-green-900/20 border border-green-700' : 'bg-gray-800 border border-gray-700'}`}>
                      <span className="text-gray-300">Has Sales History</span>
                      {badge.hasSales ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SellerProfile;

