import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerAPI } from '../../services/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { CreditCard, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { showSuccess, showApiError } from '../../utils/toast';

const PayoutAccount = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [accountIdentifier, setAccountIdentifier] = useState('');
  const [accountName, setAccountName] = useState('');
  const queryClient = useQueryClient();

  const { data: payoutAccountData, isLoading, isError } = useQuery({
    queryKey: ['payout-account'],
    queryFn: () => sellerAPI.getMyPayoutAccount().then(res => res.data.data),
  });

  const payoutAccount = payoutAccountData?.hasAccount ? payoutAccountData.payoutAccount : null;

  const linkMutation = useMutation({
    mutationFn: (data) => sellerAPI.linkPayoutAccount(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['payout-account']);
      setDialogOpen(false);
      setAccountIdentifier('');
      setAccountName('');
      const message = response?.data?.data?.message || response?.data?.message || 'Payout account linked successfully. Please wait for admin verification.';
      showSuccess(message);
    },
    onError: (error) => {
      showApiError(error, 'Failed to link payout account');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      accountType: 'paypal',
      accountIdentifier: accountIdentifier.trim(),
    };
    if (accountName.trim()) data.accountName = accountName.trim();
    linkMutation.mutate(data);
  };

  if (isLoading) return <Loading message="Loading payout account..." />;
  if (isError) return <ErrorMessage message="Error loading payout account" />;

  const getStatusBadge = (status) => {
    const variants = {
      verified: 'success',
      pending: 'warning',
      blocked: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Payout Account</h1>
        <p className="text-gray-400 mt-1">Manage your payout account for receiving payments</p>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Linked Account
          </CardTitle>
          {!payoutAccount && (
            <Button onClick={() => setDialogOpen(true)} className="bg-accent hover:bg-accent/90">
              Link Account
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {payoutAccount ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white font-semibold capitalize">{payoutAccount.accountType}</span>
                    {getStatusBadge(payoutAccount.status)}
                  </div>
                  <p className="text-gray-300 text-sm">
                    {payoutAccount.accountIdentifier || 'N/A'}
                  </p>
                  {payoutAccount.accountName && (
                    <p className="text-gray-400 text-sm mt-1">Name: {payoutAccount.accountName}</p>
                  )}
                  {payoutAccount.bankName && (
                    <p className="text-gray-400 text-sm mt-1">Bank: {payoutAccount.bankName}</p>
                  )}
                </div>
                <Button variant="outline" onClick={() => setDialogOpen(true)}>
                  Update
                </Button>
              </div>

              {payoutAccount.status === 'pending' && (
                <div className="flex items-center gap-2 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg text-yellow-400">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">
                    Your payout account is pending verification. An admin will verify it shortly.
                  </p>
                </div>
              )}

              {payoutAccount.status === 'verified' && (
                <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-700 rounded-lg text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="text-sm">Your payout account is verified and ready to receive payments.</p>
                </div>
              )}

              {payoutAccount.linkedAt && (
                <p className="text-gray-400 text-sm">
                  Linked on: {new Date(payoutAccount.linkedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400 mb-4">No payout account linked</p>
              <Button onClick={() => setDialogOpen(true)}>Link Payout Account</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-primary border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Link Payout Account</DialogTitle>
            <DialogDescription className="text-gray-400">
              Link your PayPal email or bank account to receive payouts
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paypalEmail" className="text-gray-300">PayPal Email</Label>
              <Input
                id="paypalEmail"
                type="email"
                placeholder="your.email@example.com"
                value={accountIdentifier}
                onChange={(e) => setAccountIdentifier(e.target.value)}
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Currently only PayPal accounts are supported
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountName" className="text-gray-300">Account Holder Name (Optional)</Label>
              <Input
                id="accountName"
                type="text"
                placeholder="Account holder name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={linkMutation.isPending || !accountIdentifier.trim()}>
                {linkMutation.isPending ? 'Linking...' : 'Link Account'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayoutAccount;

