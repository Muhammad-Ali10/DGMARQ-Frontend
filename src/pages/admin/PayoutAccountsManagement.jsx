import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Eye, CheckCircle2, XCircle, Search } from 'lucide-react';
import { showSuccess, showApiError } from '../../utils/toast';

const PayoutAccountsManagement = () => {
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: accountsData, isLoading, isError, error } = useQuery({
    queryKey: ['payout-accounts-status', searchTerm],
    queryFn: async () => {
      try {
        const response = await adminAPI.getSellersPayoutStatus();
        return response.data.data;
      } catch (err) {
        throw err;
      }
    },
    retry: 1,
  });

  const verifyMutation = useMutation({
    mutationFn: (accountId) => adminAPI.verifyPayoutAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries(['payout-accounts-status']);
      setIsVerifyOpen(false);
      setSelectedAccount(null);
    },
  });

  const blockMutation = useMutation({
    mutationFn: ({ accountId, data }) => adminAPI.blockPayoutAccount(accountId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['payout-accounts-status']);
      setIsBlockOpen(false);
      setSelectedAccount(null);
      setBlockReason('');
      showSuccess('Payout account status updated successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to update payout account status');
    },
  });

  const handleVerify = () => {
    if (selectedAccount) {
      verifyMutation.mutate(selectedAccount._id);
    }
  };

  const handleBlock = () => {
    if (selectedAccount) {
      const isBlocked = selectedAccount.status !== 'blocked';
      blockMutation.mutate({
        accountId: selectedAccount._id,
        data: { 
          isBlocked,
          blockReason: blockReason || undefined 
        },
      });
    }
  };

  if (isLoading) return <Loading message="Loading payout accounts..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || "Error loading payout accounts"} />;

  const accounts = accountsData?.sellers || [];

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Payout Accounts Management</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">Manage seller payout accounts</p>
        </div>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Search Sellers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search sellers..."
                className="bg-secondary border-gray-700 text-white pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">All Sellers Payout Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Seller</TableHead>
                  <TableHead className="text-gray-300">Account Type</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Verified</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.length > 0 ? (
                  accounts.map((item) => {
                    const account = item.payoutAccount;
                    const seller = item.seller;
                    return (
                      <TableRow key={seller?._id || item._id} className="border-gray-700">
                        <TableCell className="text-white">
                          {seller?.shopName || seller?.userId?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {account?.accountType || account?.provider || 'Not linked'}
                        </TableCell>
                        <TableCell>
                          {account ? (
                            <Badge variant={account.status === 'blocked' ? 'destructive' : account.status === 'verified' ? 'success' : 'warning'}>
                              {account.status || 'Pending'}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">No Account</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {account ? (
                            <Badge variant={account.status === 'verified' ? 'success' : 'warning'}>
                              {account.status === 'verified' ? 'Verified' : 'Pending'}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">-</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {account && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedAccount({ ...account, sellerId: seller?._id });
                                  setIsViewOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {account.status !== 'verified' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedAccount({ ...account, sellerId: seller?._id });
                                    setIsVerifyOpen(true);
                                  }}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant={account.status === 'blocked' ? 'outline' : 'destructive'}
                                onClick={() => {
                                  setSelectedAccount({ ...account, sellerId: seller?._id });
                                  setIsBlockOpen(true);
                                }}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                      No sellers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent size="sm" className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Payout Account Details</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Account Type</Label>
                <p className="text-white mt-1">{selectedAccount.accountType}</p>
              </div>
              <div>
                <Label className="text-gray-300">Account Identifier</Label>
                <p className="text-white mt-1">{selectedAccount.accountIdentifier}</p>
              </div>
              <div>
                <Label className="text-gray-300">Status</Label>
                <div className="mt-1">
                  <Badge variant={selectedAccount.status === 'verified' ? 'success' : selectedAccount.status === 'blocked' ? 'destructive' : 'warning'}>
                    {selectedAccount.status || 'Pending'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isVerifyOpen} onOpenChange={setIsVerifyOpen}>
        <DialogContent size="sm" className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Verify Payout Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-300">Are you sure you want to verify this payout account?</p>
            <div className="flex gap-2">
              <Button
                onClick={handleVerify}
                disabled={verifyMutation.isPending}
                className="flex-1 bg-accent hover:bg-blue-700"
              >
                {verifyMutation.isPending ? 'Verifying...' : 'Verify'}
              </Button>
              <Button
                onClick={() => setIsVerifyOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBlockOpen} onOpenChange={setIsBlockOpen}>
        <DialogContent size="sm" className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedAccount?.status === 'blocked' ? 'Unblock' : 'Block'} Payout Account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="blockReason" className="text-gray-300">Reason (Optional)</Label>
              <Input
                id="blockReason"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="bg-secondary border-gray-700 text-white"
                placeholder="Enter block reason"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleBlock}
                disabled={blockMutation.isPending}
                variant={selectedAccount?.status === 'blocked' ? 'default' : 'destructive'}
                className="flex-1"
              >
                {blockMutation.isPending
                  ? 'Processing...'
                  : selectedAccount?.status === 'blocked'
                  ? 'Unblock'
                  : 'Block'}
              </Button>
              <Button onClick={() => setIsBlockOpen(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayoutAccountsManagement;

