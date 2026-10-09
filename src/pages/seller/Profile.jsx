import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Textarea } from '@components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { FormSkeleton } from '@components/common/Skeletons';
import { ErrorState } from '@components/common/ErrorState';
import { Badge } from '@components/ui/badge';
import { User, Image, Shield, CheckCircle, XCircle, Camera, Upload } from 'lucide-react';
import { showSuccess, showError, showApiError } from '@utils/toast';
import SafeImage from '@components/ui/safe-image';

const SellerProfile = () => {
  const queryClient = useQueryClient();
  const [shopLogo, setShopLogo] = useState(null);
  const [shopBanner, setShopBanner] = useState(null);
  const [previewLogo, setPreviewLogo] = useState('');
  const [previewBanner, setPreviewBanner] = useState('');

  const { data: sellerInfo, isLoading: infoLoading, isError: infoError } = useQuery({
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
    state: '',
    city: '',
  });

  useEffect(() => {
    if (sellerInfo) {
      setProfileData({
        shopName: sellerInfo.shopName || '',
        description: sellerInfo.description || '',
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
      queryClient.invalidateQueries({ queryKey: ['seller-info'] });
      showSuccess('Profile updated successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to update profile');
    },
  });

  const updateLogoMutation = useMutation({
    mutationFn: (formData) => sellerAPI.updateShopLogo(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-info'] });
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
      queryClient.invalidateQueries({ queryKey: ['seller-info'] });
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

  if (infoLoading || badgeLoading) return <FormSkeleton fields={6} />;
  if (infoError) {
    return (
      <ErrorState
        title="Couldn't load your shop profile"
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['seller-info'] })}
      />
    );
  }

  const badge = verificationBadge?.criteria || verificationBadge || {};
  const isVerified = badge.hasKYC && badge.isActive && badge.hasPayoutAccount && badge.hasProducts && badge.hasSales;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-fg">Seller Profile</h1>
        <p className="text-fg-muted mt-1">Manage your shop information and settings</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="images" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <Image className="w-4 h-4 mr-2" />
            Shop Images
          </TabsTrigger>
          <TabsTrigger value="verification" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <Shield className="w-4 h-4 mr-2" />
            Verification
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card variant="hud">
            <CardHeader>
              <CardTitle>Shop Information</CardTitle>
              <CardDescription className="text-fg-muted">
                Update your shop details and location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shopName" className="text-fg-muted">Shop Name</Label>
                  <Input
                    id="shopName"
                    type="text"
                    value={profileData.shopName}
                    onChange={(e) => setProfileData({ ...profileData, shopName: e.target.value })}
                    className="bg-secondary border-border text-fg"
                    placeholder="Enter shop name"
                    maxLength={60}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-fg-muted">Description</Label>
                  <Textarea
                    id="description"
                    value={profileData.description}
                    onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                    placeholder="Enter shop description"
                    maxLength={2000}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-fg-muted">Country</Label>
                    <Input
                      id="country"
                      type="text"
                      value={sellerInfo?.country || ''}
                      className="bg-secondary border-border text-fg"
                      aria-describedby="country-locked-hint"
                      disabled
                    />
                    <p id="country-locked-hint" className="text-xs text-fg-subtle">
                      Set during verification. Contact support to change it.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-fg-muted">State</Label>
                    <Input
                      id="state"
                      type="text"
                      value={profileData.state}
                      onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                      className="bg-secondary border-border text-fg"
                      placeholder="State"
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-fg-muted">City</Label>
                    <Input
                      id="city"
                      type="text"
                      value={profileData.city}
                      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                      className="bg-secondary border-border text-fg"
                      placeholder="City"
                      maxLength={100}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="w-full"
                >
                  {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <div className="space-y-6">
            <Card variant="hud">
              <CardHeader>
                <CardTitle>Shop Logo</CardTitle>
                <CardDescription className="text-fg-muted">
                  Update your shop logo (recommended: 200x200px)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogoUpdate} className="space-y-4">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <SafeImage
                        src={previewLogo || '/placeholder-logo.png'}
                        alt="Shop Logo"
                        className="w-32 h-32 rounded-lg object-cover border-4 border-accent"
                      />
                      <label
                        htmlFor="shopLogo"
                        className="absolute bottom-0 right-0 bg-accent text-fg p-2 rounded-full cursor-pointer hover:bg-accent/90 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                      </label>
                      <input
                        id="shopLogo"
                        aria-label="Upload a shop logo"
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
                    className="w-full"
                  >
                    {updateLogoMutation.isPending ? 'Updating...' : 'Update Logo'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card variant="hud">
              <CardHeader>
                <CardTitle>Shop Banner</CardTitle>
                <CardDescription className="text-fg-muted">
                  Update your shop banner (recommended: 1200x300px)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBannerUpdate} className="space-y-4">
                  <div className="space-y-4">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-border">
                      <SafeImage
                        src={previewBanner || '/placeholder-banner.png'}
                        alt="Shop Banner"
                        className="w-full h-full object-cover"
                      />
                      <label
                        htmlFor="shopBanner"
                        className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer hover:bg-black/70 transition-colors"
                      >
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-fg mx-auto mb-2" />
                          <span className="text-fg text-sm">Click to upload banner</span>
                        </div>
                      </label>
                      <input
                        id="shopBanner"
                        aria-label="Upload a shop banner"
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
                    className="w-full"
                  >
                    {updateBannerMutation.isPending ? 'Updating...' : 'Update Banner'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="verification">
          <Card variant="hud">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Verification Badge Status
              </CardTitle>
              <CardDescription className="text-fg-muted">
                Check your verification badge eligibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div className="flex items-center gap-3">
                    {isVerified ? (
                      <CheckCircle className="w-6 h-6 text-success" />
                    ) : (
                      <XCircle className="w-6 h-6 text-fg-subtle" />
                    )}
                    <div>
                      <h3 className="text-fg font-semibold">Verification Badge</h3>
                      <p className="text-sm text-fg-muted">
                        {isVerified ? 'You are verified!' : 'Complete all requirements to get verified'}
                      </p>
                    </div>
                  </div>
                  {isVerified ? (
                    <Badge variant="success" className="bg-success-solid">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="bg-warning-solid">
                      <XCircle className="w-3 h-3 mr-1" />
                      Not Verified
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="text-fg font-medium">Verification Requirements:</h4>
                  <div className="space-y-2">
                    <div className={`flex items-center justify-between p-3 rounded-lg ${badge.hasKYC ? 'bg-success-soft border border-success/35' : 'bg-surface-2 border border-border'}`}>
                      <span className="text-fg-muted">KYC Verified</span>
                      {badge.hasKYC ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <XCircle className="w-5 h-5 text-fg-subtle" />
                      )}
                    </div>
                    <div className={`flex items-center justify-between p-3 rounded-lg ${badge.isActive ? 'bg-success-soft border border-success/35' : 'bg-surface-2 border border-border'}`}>
                      <span className="text-fg-muted">Account Active</span>
                      {badge.isActive ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <XCircle className="w-5 h-5 text-fg-subtle" />
                      )}
                    </div>
                    <div className={`flex items-center justify-between p-3 rounded-lg ${badge.hasPayoutAccount ? 'bg-success-soft border border-success/35' : 'bg-surface-2 border border-border'}`}>
                      <span className="text-fg-muted">Payout Account Linked</span>
                      {badge.hasPayoutAccount ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <XCircle className="w-5 h-5 text-fg-subtle" />
                      )}
                    </div>
                    <div className={`flex items-center justify-between p-3 rounded-lg ${badge.hasProducts ? 'bg-success-soft border border-success/35' : 'bg-surface-2 border border-border'}`}>
                      <span className="text-fg-muted">Has Active Products</span>
                      {badge.hasProducts ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <XCircle className="w-5 h-5 text-fg-subtle" />
                      )}
                    </div>
                    <div className={`flex items-center justify-between p-3 rounded-lg ${badge.hasSales ? 'bg-success-soft border border-success/35' : 'bg-surface-2 border border-border'}`}>
                      <span className="text-fg-muted">Has Sales History</span>
                      {badge.hasSales ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <XCircle className="w-5 h-5 text-fg-subtle" />
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

