import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Settings as SettingsIcon, Package, ToggleLeft, ToggleRight } from 'lucide-react';
import { showSuccess, showError, showApiError } from '../../utils/toast';

const Settings = () => {
  const [commissionRate, setCommissionRate] = useState('');
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

  useEffect(() => {
    if (settings?.commissionRate !== undefined) {
      setCommissionRate(settings.commissionRate.toString());
    }
  }, [settings]);

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

  if (isLoading || isLoadingAutoApprove) return <Loading message="Loading settings..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || "Error loading settings"} />;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Platform Settings</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">Manage platform configuration</p>
      </div>

      {/* Auto-Approve Products Setting */}
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
    </div>
  );
};

export default Settings;
