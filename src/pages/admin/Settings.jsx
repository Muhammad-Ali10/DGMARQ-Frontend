import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Settings as SettingsIcon, Package, ToggleLeft, ToggleRight, Search, DollarSign, Wallet } from 'lucide-react';
import { showSuccess, showError, showApiError } from '../../utils/toast';

const Settings = () => {
  // Each setting input keeps a local "draft" overlay. `null` means "no edit yet"; the rendered
  // <Input> value falls back to the server snapshot from the query, so we never need to call
  // setState inside an effect when the server data first arrives.
  const [commissionRateDraft, setCommissionRateDraft] = useState(null);
  const [seoMetaTitleDraft, setSeoMetaTitleDraft] = useState(null);
  const [seoMetaDescriptionDraft, setSeoMetaDescriptionDraft] = useState(null);
  const [handlingFeeEnabledDraft, setHandlingFeeEnabledDraft] = useState(null);
  const [handlingFeeTypeDraft, setHandlingFeeTypeDraft] = useState(null);
  const [handlingFeePercentageDraft, setHandlingFeePercentageDraft] = useState(null);
  const [handlingFeeFixedDraft, setHandlingFeeFixedDraft] = useState(null);
  const [payoutHoldDaysDraft, setPayoutHoldDaysDraft] = useState(null);
  const [minimumWithdrawalUsdDraft, setMinimumWithdrawalUsdDraft] = useState(null);
  const [refundWindowDaysDraft, setRefundWindowDaysDraft] = useState(null);
  const queryClient = useQueryClient();

  // Commission Rate Query
  const { data: settings, isLoading, isError, error } = useQuery({
    queryKey: ['commission-rate'],
    queryFn: async () => {
      const response = await adminAPI.getCommissionRate();
      return response.data.data;
    },
    retry: 1,
  });

  // Auto-Approve Products Query
  const { data: autoApproveSettings, isLoading: isLoadingAutoApprove } = useQuery({
    queryKey: ['auto-approve-setting'],
    queryFn: async () => {
      const response = await adminAPI.getAutoApproveSetting();
      return response.data.data;
    },
    retry: 1,
  });

  // Home Page SEO Query
  const { data: seoSettings, isLoading: isLoadingSEO } = useQuery({
    queryKey: ['home-page-seo'],
    queryFn: async () => {
      const response = await adminAPI.getHomePageSEO();
      return response.data.data;
    },
    retry: 1,
  });

    // Buyer Protection Fee Query
  const { data: handlingFeeSettings, isLoading: isLoadingHandlingFee } = useQuery({
    queryKey: ['buyer-handling-fee'],
    queryFn: async () => {
      const response = await adminAPI.getBuyerHandlingFeeSetting();
      return response.data.data;
    },
    retry: 1,
  });

  // Payout / Refund Settings Query
  const { data: payoutSettings, isLoading: isLoadingPayoutSettings } = useQuery({
    queryKey: ['payout-settings'],
    queryFn: async () => {
      const response = await adminAPI.getPayoutSettings();
      return response.data.data;
    },
    retry: 1,
  });

  // Effective input values: prefer the user's draft, fall back to the server snapshot, then
  // to the bound default. Computed during render -> no setState-in-effect required.
  const commissionRate = commissionRateDraft
    ?? (settings?.commissionRate !== undefined ? settings.commissionRate.toString() : '');

  const seoMetaTitle = seoMetaTitleDraft
    ?? (typeof seoSettings?.metaTitle === 'string' ? seoSettings.metaTitle : '');
  const seoMetaDescription = seoMetaDescriptionDraft
    ?? (typeof seoSettings?.metaDescription === 'string' ? seoSettings.metaDescription : '');

  const handlingFeeEnabled = handlingFeeEnabledDraft
    ?? !!handlingFeeSettings?.enabled;
  const handlingFeeType = handlingFeeTypeDraft
    ?? (handlingFeeSettings?.feeType === 'fixed' ? 'fixed' : 'percentage');
  const handlingFeePercentage = handlingFeePercentageDraft
    ?? String(handlingFeeSettings?.percentageValue ?? 5);
  const handlingFeeFixed = handlingFeeFixedDraft
    ?? String(handlingFeeSettings?.fixedAmount ?? 0);

  const payoutHoldDaysValue = payoutHoldDaysDraft
    ?? (typeof payoutSettings?.payoutHoldDays === 'number' ? String(payoutSettings.payoutHoldDays) : '15');
  const minimumWithdrawalUsdValue = minimumWithdrawalUsdDraft
    ?? (typeof payoutSettings?.minimumWithdrawalUsd === 'number' ? String(payoutSettings.minimumWithdrawalUsd) : '50');
  const refundWindowDaysValue = refundWindowDaysDraft
    ?? (typeof payoutSettings?.refundWindowDays === 'number' ? String(payoutSettings.refundWindowDays) : '10');

  const updateMutation = useMutation({
    mutationFn: (rate) => adminAPI.updateCommissionRate({ commissionRate: rate }),
    onSuccess: () => {
      queryClient.invalidateQueries(['commission-rate']);
      setCommissionRateDraft(null);
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
      setSeoMetaTitleDraft(null);
      setSeoMetaDescriptionDraft(null);
      showSuccess('Home page SEO settings updated successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to update SEO settings');
    },
  });

  // Buyer Protection Fee Update Mutation
  const handlingFeeUpdateMutation = useMutation({
    mutationFn: (data) => adminAPI.updateBuyerHandlingFeeSetting(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['buyer-handling-fee']);
      setHandlingFeeEnabledDraft(null);
      setHandlingFeeTypeDraft(null);
      setHandlingFeePercentageDraft(null);
      setHandlingFeeFixedDraft(null);
      showSuccess('Buyer Protection Fee settings updated successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to update Buyer Protection Fee');
    },
  });

  // Payout / Refund Settings Update Mutation
  const payoutSettingsMutation = useMutation({
    mutationFn: (data) => adminAPI.updatePayoutSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['payout-settings']);
      showSuccess('Payout settings updated successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to update payout settings');
    },
  });

  const handlePayoutSettingsUpdate = () => {
    const bounds = payoutSettings?.bounds || {
      payoutHoldDays: { min: 0, max: 180 },
      minimumWithdrawalUsd: { min: 0, max: 10000 },
      refundWindowDays: { min: 1, max: 170 },
      combinedRefundWindowMax: 170,
    };
    const combinedMax = bounds.combinedRefundWindowMax ?? 170;
    const hold = Number(payoutHoldDaysValue);
    if (!Number.isFinite(hold) || hold < bounds.payoutHoldDays.min || hold > bounds.payoutHoldDays.max) {
      showError(`Payout hold days must be between ${bounds.payoutHoldDays.min} and ${bounds.payoutHoldDays.max}`);
      return;
    }
    const min = Number(minimumWithdrawalUsdValue);
    if (!Number.isFinite(min) || min < bounds.minimumWithdrawalUsd.min || min > bounds.minimumWithdrawalUsd.max) {
      showError(`Minimum withdrawal must be between $${bounds.minimumWithdrawalUsd.min} and $${bounds.minimumWithdrawalUsd.max}`);
      return;
    }
    const refundWin = Number(refundWindowDaysValue);
    if (!Number.isFinite(refundWin) || refundWin < bounds.refundWindowDays.min || refundWin > bounds.refundWindowDays.max) {
      showError(`Refund window must be between ${bounds.refundWindowDays.min} and ${bounds.refundWindowDays.max} days (capped under PayPal's 180-day capture refund window)`);
      return;
    }
    if (hold + refundWin > combinedMax) {
      showError(
        `Payout hold (${hold}d) + refund window (${refundWin}d) = ${hold + refundWin}d exceeds the combined cap of ${combinedMax} days. ` +
        `PayPal can only refund a capture for 180 days; the combined cap stays under that limit so refunds remain executable.`
      );
      return;
    }
    payoutSettingsMutation.mutate(
      {
        payoutHoldDays: hold,
        minimumWithdrawalUsd: min,
        refundWindowDays: refundWin,
      },
      {
        onSuccess: () => {
          // Server is the source of truth again; clear local drafts so the inputs
          // re-derive from the freshly invalidated query.
          setPayoutHoldDaysDraft(null);
          setMinimumWithdrawalUsdDraft(null);
          setRefundWindowDaysDraft(null);
        },
      }
    );
  };

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

  if (isLoading || isLoadingAutoApprove || isLoadingSEO || isLoadingHandlingFee || isLoadingPayoutSettings) return <Loading message="Loading settings..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || "Error loading settings"} />;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Platform Settings</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">Manage platform configuration</p>
      </div>

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

      {/* Buyer Protection Fee Setting */}
      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Buyer Protection Fee
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-gray-400">
            Fee charged only to the buyer at checkout. 100% goes to admin. Separate from seller commission.
          </p>
          <div className="flex items-center justify-between">
            <Label className="text-gray-300">Enable / Disable</Label>
            <button
              onClick={() => setHandlingFeeEnabledDraft(!handlingFeeEnabled)}
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
                      onChange={() => setHandlingFeeTypeDraft('percentage')}
                      className="rounded border-gray-600"
                    />
                    <span className="text-white">Percentage (default 5%)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="feeType"
                      checked={handlingFeeType === 'fixed'}
                      onChange={() => setHandlingFeeTypeDraft('fixed')}
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
                      onChange={(e) => setHandlingFeePercentageDraft(e.target.value)}
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
                      onChange={(e) => setHandlingFeeFixedDraft(e.target.value)}
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
            {handlingFeeUpdateMutation.isPending ? 'Updating...' : 'Update Buyer Protection Fee'}
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
                onChange={(e) => setCommissionRateDraft(e.target.value)}
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
              onChange={(e) => setSeoMetaTitleDraft(e.target.value)}
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
              onChange={(e) => setSeoMetaDescriptionDraft(e.target.value)}
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

      {/* Payout & Refund Windows */}
      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Payout & Refund Windows
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-gray-400">
            Controls how long seller earnings are held before becoming available for withdrawal,
            the minimum withdrawal a seller can request, and how long buyers can open a refund request
            after order completion. Refund window is capped below PayPal's 180-day capture refund window
            so refunds can always reach the original payment method.
          </p>

          {(() => {
            const combinedMax = payoutSettings?.bounds?.combinedRefundWindowMax ?? 170;
            const holdNum = Number(payoutHoldDaysValue);
            const refundNum = Number(refundWindowDaysValue);
            const sum = (Number.isFinite(holdNum) ? holdNum : 0) + (Number.isFinite(refundNum) ? refundNum : 0);
            const exceeds = sum > combinedMax;
            return (
              <div className={`rounded-lg border px-3 py-2 text-xs ${exceeds ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-amber-500/30 bg-amber-500/10 text-amber-100'}`}>
                <p className="font-medium">
                  Combined cap: payout hold + refund window must not exceed {combinedMax} days.
                </p>
                <p className="mt-1 opacity-80">
                  PayPal rejects capture refunds older than 180 days. The combined cap keeps a 10-day safety
                  margin so a buyer who opens a refund at the latest allowed moment can still be refunded
                  through the original PayPal capture.
                </p>
                <p className="mt-1 font-medium">
                  Current combined: {Number.isFinite(holdNum) ? holdNum : '—'} + {Number.isFinite(refundNum) ? refundNum : '—'} = {Number.isFinite(holdNum) && Number.isFinite(refundNum) ? sum : '—'} days
                  {exceeds ? ` (over by ${sum - combinedMax})` : ''}.
                </p>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payoutHoldDays" className="text-gray-300">
                Payout Hold (days)
              </Label>
              <Input
                id="payoutHoldDays"
                type="number"
                min={payoutSettings?.bounds?.payoutHoldDays?.min ?? 0}
                max={payoutSettings?.bounds?.payoutHoldDays?.max ?? 180}
                step="1"
                value={payoutHoldDaysValue}
                onChange={(e) => setPayoutHoldDaysDraft(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-400">
                Range: {payoutSettings?.bounds?.payoutHoldDays?.min ?? 0} - {payoutSettings?.bounds?.payoutHoldDays?.max ?? 180}. Default: 15.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimumWithdrawalUsd" className="text-gray-300">
                Minimum Withdrawal (USD)
              </Label>
              <Input
                id="minimumWithdrawalUsd"
                type="number"
                min={payoutSettings?.bounds?.minimumWithdrawalUsd?.min ?? 0}
                max={payoutSettings?.bounds?.minimumWithdrawalUsd?.max ?? 10000}
                step="1"
                value={minimumWithdrawalUsdValue}
                onChange={(e) => setMinimumWithdrawalUsdDraft(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-400">
                Range: ${payoutSettings?.bounds?.minimumWithdrawalUsd?.min ?? 0} - ${payoutSettings?.bounds?.minimumWithdrawalUsd?.max ?? 10000}. Default: $50.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refundWindowDays" className="text-gray-300">
                Refund Window (days)
              </Label>
              <Input
                id="refundWindowDays"
                type="number"
                min={payoutSettings?.bounds?.refundWindowDays?.min ?? 1}
                max={payoutSettings?.bounds?.refundWindowDays?.max ?? 170}
                step="1"
                value={refundWindowDaysValue}
                onChange={(e) => setRefundWindowDaysDraft(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-400">
                Range: {payoutSettings?.bounds?.refundWindowDays?.min ?? 1} - {payoutSettings?.bounds?.refundWindowDays?.max ?? 170}. Default: 10.
              </p>
            </div>
          </div>

          <Button
            onClick={handlePayoutSettingsUpdate}
            disabled={payoutSettingsMutation.isPending}
            className="w-full sm:w-auto"
          >
            {payoutSettingsMutation.isPending ? 'Updating...' : 'Update Payout & Refund Windows'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
