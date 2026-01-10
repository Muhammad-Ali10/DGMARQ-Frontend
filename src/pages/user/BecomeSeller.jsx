import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sellerAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Store, Upload, FileText, CheckCircle2, XCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { showSuccess, showError, showApiError } from '../../utils/toast';

const BecomeSeller = () => {
  const [formData, setFormData] = useState({
    shopName: '',
    description: '',
    country: '',
    state: '',
    city: '',
  });
  const [shopLogo, setShopLogo] = useState(null);
  const [shopBanner, setShopBanner] = useState(null);
  const [kycDocs, setKycDocs] = useState([]);
  const [previewLogo, setPreviewLogo] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);

  // Check if user already has a seller application
  const { data: sellerStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['seller-application-status'],
    queryFn: async () => {
      try {
        const response = await sellerAPI.checkSellerApplicationStatus();
        return response.data.data;
      } catch (err) {
        // User doesn't have a seller application yet
        return { hasApplication: false };
      }
    },
    retry: false,
  });

  const queryClient = useQueryClient();

  const applyMutation = useMutation({
    mutationFn: (formDataToSend) => sellerAPI.applySeller(formDataToSend),
    onSuccess: () => {
      showSuccess('Seller application submitted successfully! It will be reviewed by our admin team.');
      // Reset form
      setFormData({
        shopName: '',
        description: '',
        country: '',
        state: '',
        city: '',
      });
      setShopLogo(null);
      setShopBanner(null);
      setKycDocs([]);
      setPreviewLogo(null);
      setPreviewBanner(null);
      // Refresh application status
      queryClient.invalidateQueries(['seller-application-status']);
    },
    onError: (err) => {
      showApiError(err, 'Failed to submit seller application');
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setShopLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setShopBanner(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewBanner(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKycDocsChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setKycDocs(files);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!shopLogo || !shopBanner || kycDocs.length === 0) {
      showError('Please upload shop logo, banner, and at least one KYC document');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('shopName', formData.shopName);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('country', formData.country);
    formDataToSend.append('state', formData.state);
    formDataToSend.append('city', formData.city);
    formDataToSend.append('shopLogo', shopLogo);
    formDataToSend.append('shopBanner', shopBanner);
    kycDocs.forEach((file) => {
      formDataToSend.append('kycDocs', file);
    });

    applyMutation.mutate(formDataToSend);
  };

  if (isLoadingStatus) {
    return <Loading message="Checking seller status..." />;
  }

  // If user already has a seller application
  if (sellerStatus?.hasApplication && sellerStatus?.seller) {
    const status = sellerStatus.seller.status;
    const getStatusBadge = () => {
      const variants = {
        pending: { variant: 'warning', text: 'Pending Review' },
        active: { variant: 'success', text: 'Approved' },
        banned: { variant: 'destructive', text: 'Rejected/Banned' },
      };
      const statusInfo = variants[status] || { variant: 'default', text: status };
      return <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>;
    };

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Become a Seller</h1>
          <p className="text-gray-400 mt-1">Your seller application status</p>
        </div>

        <Card className="bg-primary border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Store className="h-5 w-5 text-accent" />
              Seller Application Status
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your seller application has been submitted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
              <div>
                <p className="text-gray-300 text-sm">Shop Name</p>
                <p className="text-white font-semibold text-lg">{sellerStatus.seller.shopName}</p>
              </div>
              {getStatusBadge()}
            </div>

            {status === 'pending' && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-yellow-500 font-semibold">Application Under Review</p>
                    <p className="text-gray-300 text-sm mt-1">
                      Your seller application is currently being reviewed by our admin team. 
                      You will be notified once a decision has been made.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {status === 'active' && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-green-500 font-semibold">Application Approved!</p>
                    <p className="text-gray-300 text-sm mt-1">
                      Congratulations! Your seller application has been approved. 
                      You can now access the seller dashboard and start selling.
                    </p>
                    <Button 
                      className="mt-3 bg-accent hover:bg-accent/90"
                      onClick={() => window.location.href = '/seller/dashboard'}
                    >
                      Go to Seller Dashboard
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {status === 'banned' && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-red-500 font-semibold">Application Rejected</p>
                    <p className="text-gray-300 text-sm mt-1">
                      Unfortunately, your seller application has been rejected. 
                      If you believe this is an error, please contact support.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {sellerStatus.seller.description && (
              <div>
                <p className="text-gray-300 text-sm mb-1">Description</p>
                <p className="text-white">{sellerStatus.seller.description}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              {sellerStatus.seller.country && (
                <div>
                  <p className="text-gray-300 text-sm mb-1">Country</p>
                  <p className="text-white">{sellerStatus.seller.country}</p>
                </div>
              )}
              {sellerStatus.seller.state && (
                <div>
                  <p className="text-gray-300 text-sm mb-1">State</p>
                  <p className="text-white">{sellerStatus.seller.state}</p>
                </div>
              )}
              {sellerStatus.seller.city && (
                <div>
                  <p className="text-gray-300 text-sm mb-1">City</p>
                  <p className="text-white">{sellerStatus.seller.city}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Become a Seller</h1>
        <p className="text-gray-400 mt-1">Apply to become a seller and start selling on our platform</p>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Store className="h-5 w-5 text-accent" />
            Seller Application Form
          </CardTitle>
          <CardDescription className="text-gray-400">
            Fill out the form below to apply as a seller. All fields are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Shop Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                Shop Information
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="shopName" className="text-gray-300">
                  Shop Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="shopName"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleInputChange}
                  placeholder="Enter your shop name"
                  required
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-300">
                  Shop Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your shop and what you sell"
                  required
                  rows={4}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                Location Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-gray-300">
                    Country <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="Country"
                    required
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-gray-300">
                    State/Province <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="State/Province"
                    required
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-gray-300">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    required
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Shop Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                Shop Images
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shopLogo" className="text-gray-300">
                    Shop Logo <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        id="shopLogo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        required
                        className="bg-gray-800 border-gray-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-accent/90"
                      />
                    </div>
                    {previewLogo && (
                      <img
                        src={previewLogo}
                        alt="Logo preview"
                        className="w-20 h-20 rounded-lg object-cover border border-gray-700"
                      />
                    )}
                  </div>
                  <p className="text-gray-400 text-xs">Upload your shop logo (JPG, PNG, max 5MB)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shopBanner" className="text-gray-300">
                    Shop Banner <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        id="shopBanner"
                        type="file"
                        accept="image/*"
                        onChange={handleBannerChange}
                        required
                        className="bg-gray-800 border-gray-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-accent/90"
                      />
                    </div>
                    {previewBanner && (
                      <img
                        src={previewBanner}
                        alt="Banner preview"
                        className="w-32 h-20 rounded-lg object-cover border border-gray-700"
                      />
                    )}
                  </div>
                  <p className="text-gray-400 text-xs">Upload your shop banner (JPG, PNG, max 5MB)</p>
                </div>
              </div>
            </div>

            {/* KYC Documents */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                KYC Documents
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="kycDocs" className="text-gray-300">
                  KYC Documents <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="kycDocs"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleKycDocsChange}
                  required
                  className="bg-gray-800 border-gray-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-accent/90"
                />
                <p className="text-gray-400 text-xs">
                  Upload your KYC documents (ID, business license, etc.) - PDF, JPG, PNG (max 3 files, 5MB each)
                </p>
                {kycDocs.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {kycDocs.map((file, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {file.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-gray-700">
              <Button
                type="submit"
                disabled={applyMutation.isPending}
                className="bg-accent hover:bg-accent/90 min-w-[150px]"
              >
                {applyMutation.isPending ? (
                  <>
                    <Loading className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BecomeSeller;

