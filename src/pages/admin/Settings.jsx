import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Settings as SettingsIcon, Package, ToggleLeft, ToggleRight, Search, DollarSign } from 'lucide-react';
import { showSuccess, showError, showApiError } from '../../utils/toast';

const Settings = () => {
  const [commissionRate, setCommissionRate] = useState('');
  const [seoMetaTitle, setSeoMetaTitle] = useState('');
  const [seoMetaDescription, setSeoMetaDescription] = useState('');
  const [handlingFeeEnabled, setHandlingFeeEnabled] = useState(false);
  const [handlingFeeType, setHandlingFeeType] = useState('percentage');
  const [handlingFeePercentage, setHandlingFeePercentage] = useState('5');
  const [handlingFeeFixed, setHandlingFeeFixed] = useState('0');
  const queryClient = useQueryClient();

  // Commission Rate Query
  const { data: settings, isLoading, isError, error } = useQuery({
    queryKey: ['commission-rate'],
    queryFn: async () => {
      try {
        const response = await adminAPI.getCommissionRate();
        return response.data.data;
      } catch (err) {
        throw err;
      }
    },
    retry: 1,
  });

  // Auto-Approve Products Query
  const { data: autoApproveSettings, isLoading: isLoadingAutoApprove } = useQuery({
    queryKey: ['auto-approve-setting'],
    queryFn: async () => {
      try {
        const response = await adminAPI.getAutoApproveSetting();
        return response.data.data;
      } catch (err) {
        throw err;
      }
    },
    retry: 1,
  });

  // Home Page SEO Query
  const { data: seoSettings, isLoading: isLoadingSEO } = useQuery({
    queryKey: ['home-page-seo'],
    queryFn: async () => {
      try {
        const response = await adminAPI.getHomePageSEO();
        return response.data.data;
      } catch (err) {
        throw err;
      }
    },
    retry: 1,
  });

  // Buyer Handling Fee Query
  const { data: handlingFeeSettings, isLoading: isLoadingHandlingFee } = useQuery({
    queryKey: ['buyer-handling-fee'],
    queryFn: async () => {
      try {
        const response = await adminAPI.getBuyerHandlingFeeSetting();
        return response.data.data;
      } catch (err) {
        throw err;
      }
    },
    retry: 1,
  });

  useEffect(() => {
    if (settings?.commissionRate !== undefined) {
      setCommissionRate(settings.commissionRate.toString());
    }
  }, [settings]);

  useEffect(() => {
    if (seoSettings) {
      setSeoMetaTitle(seoSettings.metaTitle || '');
      setSeoMetaDescription(seoSettings.metaDescription || '');
    }
  }, [seoSettings]);

  useEffect(() => {
    if (handlingFeeSettings) {
      setHandlingFeeEnabled(!!handlingFeeSettings.enabled);
      setHandlingFeeType(handlingFeeSettings.feeType === 'fixed' ? 'fixed' : 'percentage');
      setHandlingFeePercentage(String(handlingFeeSettings.percentageValue ?? 5));
      setHandlingFeeFixed(String(handlingFeeSettings.fixedAmount ?? 0));
    }
  }, [handlingFeeSettings]);

  const updateMutation = useMutation({
    mutationFn: (rate) => adminAPI.updateCommissionRate({ commissionRate: rate }),
    onSuccess: () => {
      queryClient.invalidateQueries(['commission-rate']);
      showSuccess('Commission rate updated successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to update commission rate');
    },
  });

  // Auto-Approve Toggle Mutation
  const autoApproveMutation = useMutation({
    mutationFn: (autoApprove) => adminAPI.updateAutoApproveSetting({ autoApprove }),
    onSuccess: () => {
      queryClient.invalidateQueries(['auto-approve-setting']);
      showSuccess('Auto-approve setting updated successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to update auto-approve setting');
    },
  });

  const handleUpdate = () => {
    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 1) {
      showError('Commission rate must be between 0 and 1 (0% to 100%)');
      return;
    }
    updateMutation.mutate(rate);
  };

  const handleAutoApproveToggle = () => {
    const newValue = !autoApproveSettings?.autoApprove;
    autoApproveMutation.mutate(newValue);
  };

  // SEO Update Mutation
  const seoUpdateMutation = useMutation({
    mutationFn: (data) => adminAPI.updateHomePageSEO(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['home-page-seo']);
      showSuccess('Home page SEO settings updated successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to update SEO settings');
    },
  });

  // Buyer Handling Fee Update Mutation
  const handlingFeeUpdateMutation = useMutation({
    mutationFn: (data) => adminAPI.updateBuyerHandlingFeeSetting(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['buyer-handling-fee']);
      showSuccess('Buyer handling fee settings updated successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to update buyer handling fee');
    },
  });

  const handleHandlingFeeUpdate = () => {
    if (handlingFeeEnabled) {
      if (handlingFeeType === 'percentage') {
        const pct = parseFloat(handlingFeePercentage);
        if (Number.isNaN(pct) || pct < 0 || pct > 100) {
          showError('Percentage must be between 0 and 100');
          return;
        }
        handlingFeeUpdateMutation.mutate({ enabled: true, feeType: 'percentage', percentageValue: pct });
      } else {
        const fixed = parseFloat(handlingFeeFixed);
        if (Number.isNaN(fixed) || fixed < 0) {
          showError('Fixed amount must be a non-negative number');
          return;
        }
        handlingFeeUpdateMutation.mutate({ enabled: true, feeType: 'fixed', fixedAmount: fixed });
      }
    } else {
      handlingFeeUpdateMutation.mutate({ enabled: false });
    }
  };

  const handleSEOUpdate = () => {
    if (!seoMetaTitle.trim()) {
      showError('Meta title is required');
      return;
    }
    if (!seoMetaDescription.trim()) {
      showError('Meta description is required');
      return;
    }
    if (seoMetaTitle.length > 60) {
      showError('Meta title must be 60 characters or less');
      return;
    }
    if (seoMetaDescription.length > 160) {
      showError('Meta description must be 160 characters or less');
      return;
    }
    seoUpdateMutation.mutate({
      metaTitle: seoMetaTitle.trim(),
      metaDescription: seoMetaDescription.trim(),
    });
  };

  if (isLoading || isLoadingAutoApprove || isLoadingSEO || isLoadingHandlingFee) return <Loading message="Loading settings..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || "Error loading settings"} />;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Platform Settings</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">Manage platform configuration</p>
      </div>

      Auto-Approve Products Setting
      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Approval
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-300 text-lg">Auto-Approve Products</Label>
              <p className="text-sm text-gray-400 mt-1">
                When enabled, new seller products are automatically approved and published.
                When disabled, products require manual admin approval.
              </p>
              {autoApproveSettings?.lastUpdated && (
                <p className="text-xs text-gray-500 mt-2">
                  Last updated: {new Date(autoApproveSettings.lastUpdated).toLocaleDateString()}
                </p>
              )}
            </div>
            <button
              onClick={handleAutoApproveToggle}
              disabled={autoApproveMutation.isPending}
              className={`p-2 rounded-lg transition-all duration-200 ${
                autoApproveSettings?.autoApprove
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-600 hover:bg-gray-700'
              } ${autoApproveMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {autoApproveSettings?.autoApprove ? (
                <ToggleRight className="h-8 w-8 text-white" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-white" />
              )}
            </button>
          </div>
          <div className={`p-4 rounded-lg ${
            autoApproveSettings?.autoApprove
              ? 'bg-green-900/30 border border-green-700'
              : 'bg-yellow-900/30 border border-yellow-700'
          }`}>
            <p className={`font-medium ${
              autoApproveSettings?.autoApprove ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {autoApproveSettings?.autoApprove
                ? '✓ Auto-Approve is ENABLED'
                : '⏸ Auto-Approve is DISABLED (Manual approval required)'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {autoApproveSettings?.autoApprove
                ? 'New products from sellers will be immediately visible on the marketplace.'
                : 'New products from sellers will appear in "Pending Products" for your review.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Buyer Handling Fee Setting */}
      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Buyer Handling Fee
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-gray-400">
            Fee charged only to the buyer at checkout. 100% goes to admin. Separate from seller commission.
          </p>
          <div className="flex items-center justify-between">
            <Label className="text-gray-300">Enable / Disable</Label>
            <button
              onClick={() => setHandlingFeeEnabled(!handlingFeeEnabled)}
              disabled={handlingFeeUpdateMutation.isPending}
              className={`p-2 rounded-lg transition-all ${handlingFeeEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
            >
              {handlingFeeEnabled ? <ToggleRight className="h-8 w-8 text-white" /> : <ToggleLeft className="h-8 w-8 text-white" />}
            </button>
          </div>
          {handlingFeeEnabled && (
            <>
              <div className="space-y-2">
                <Label className="text-gray-300">Fee Type</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="feeType"
                      checked={handlingFeeType === 'percentage'}
                      onChange={() => setHandlingFeeType('percentage')}
                      className="rounded border-gray-600"
                    />
                    <span className="text-white">Percentage (default 5%)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="feeType"
                      checked={handlingFeeType === 'fixed'}
                      onChange={() => setHandlingFeeType('fixed')}
                      className="rounded border-gray-600"
                    />
                    <span className="text-white">Fixed amount</span>
                  </label>
                </div>
              </div>
              {handlingFeeType === 'percentage' ? (
                <div className="space-y-2">
                  <Label htmlFor="handlingFeePct" className="text-gray-300">Percentage (0–100)</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="handlingFeePct"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={handlingFeePercentage}
                      onChange={(e) => setHandlingFeePercentage(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white w-32"
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="handlingFeeFixed" className="text-gray-300">Fixed Amount ($)</Label>
                  <div className="flex gap-2 items-center">
                    <span className="text-gray-400">$</span>
                    <Input
                      id="handlingFeeFixed"
                      type="number"
                      min="0"
                      step="0.01"
                      value={handlingFeeFixed}
                      onChange={(e) => setHandlingFeeFixed(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white w-32"
                    />
                  </div>
                </div>
              )}
            </>
          )}
          {handlingFeeSettings?.lastUpdated && (
            <p className="text-xs text-gray-500">Last updated: {new Date(handlingFeeSettings.lastUpdated).toLocaleDateString()}</p>
          )}
          <Button onClick={handleHandlingFeeUpdate} disabled={handlingFeeUpdateMutation.isPending}>
            {handlingFeeUpdateMutation.isPending ? 'Updating...' : 'Update Buyer Handling Fee'}
          </Button>
        </CardContent>
      </Card>

      {/* Commission Rate Setting */}
      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Commission Rate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-gray-300">Current Commission Rate</Label>
            <p className="text-2xl sm:text-3xl font-bold text-white mt-2">
              {settings?.commissionRate !== undefined 
                ? `${(settings.commissionRate * 100).toFixed(1)}%` 
                : '0%'}
            </p>
            {settings?.lastUpdated && (
              <p className="text-sm text-gray-400 mt-1">
                Last updated: {new Date(settings.lastUpdated).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="commissionRate" className="text-gray-300">
              New Commission Rate (0.0 to 1.0)
            </Label>
            <div className="flex gap-2">
              <Input
                id="commissionRate"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                placeholder="e.g., 0.1 for 10%"
                className="bg-gray-800 border-gray-700 text-white flex-1"
              />
              <Button
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              Enter a value between 0 and 1 (e.g., 0.1 = 10%, 0.15 = 15%)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Home Page SEO Settings */}
      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="h-5 w-5" />
            Home Page SEO Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-gray-400 mb-4">
              Configure the meta title and description for the home page. These appear in Google search results.
            </p>
            {seoSettings?.lastUpdated && (
              <p className="text-xs text-gray-500 mb-4">
                Last updated: {new Date(seoSettings.lastUpdated).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="seoMetaTitle" className="text-gray-300">
              Meta Title <span className="text-red-400">*</span>
            </Label>
            <Input
              id="seoMetaTitle"
              type="text"
              maxLength={60}
              value={seoMetaTitle}
              onChange={(e) => setSeoMetaTitle(e.target.value)}
              placeholder="e.g., DG Marq - Digital Marketplace for Games & Software"
              className="bg-gray-800 border-gray-700 text-white"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-400">
                Recommended: 50-60 characters for optimal display in search results
              </p>
              <p className={`text-xs ${seoMetaTitle.length > 60 ? 'text-red-400' : seoMetaTitle.length > 50 ? 'text-yellow-400' : 'text-gray-400'}`}>
                {seoMetaTitle.length}/60
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seoMetaDescription" className="text-gray-300">
              Meta Description <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="seoMetaDescription"
              maxLength={160}
              value={seoMetaDescription}
              onChange={(e) => setSeoMetaDescription(e.target.value)}
              placeholder="e.g., Buy digital games, software licenses, and accounts at the best prices. Instant delivery, secure transactions, and 24/7 support."
              className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
              rows={4}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-400">
                Recommended: 120-160 characters for optimal display in search results
              </p>
              <p className={`text-xs ${seoMetaDescription.length > 160 ? 'text-red-400' : seoMetaDescription.length > 120 ? 'text-yellow-400' : 'text-gray-400'}`}>
                {seoMetaDescription.length}/160
              </p>
            </div>
          </div>

          <Button
            onClick={handleSEOUpdate}
            disabled={seoUpdateMutation.isPending || !seoMetaTitle.trim() || !seoMetaDescription.trim()}
            className="w-full"
          >
            {seoUpdateMutation.isPending ? 'Updating...' : 'Update SEO Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
