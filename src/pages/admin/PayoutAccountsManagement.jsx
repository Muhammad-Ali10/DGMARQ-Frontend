import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@services/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Badge } from '@components/ui/badge';
import { Loading, ErrorMessage } from '@components/ui/loading';
import { TableEmptyRow } from '@components/common/EmptyState';
import { Eye, XCircle } from 'lucide-react';
import { SearchInput } from '@components/common/SearchInput';
import { Pagination } from '@components/common/Pagination';
import { showSuccess, showApiError } from '@utils/toast';

const METHOD_LABEL = {
  paypal: 'PayPal',
};

const STATUS_VARIANT = {
  verified: 'success',
  blocked: 'destructive',
  pending: 'warning',
};

const PayoutAccountsManagement = () => {
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [viewSeller, setViewSeller] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: accountsData, isLoading, isError, error } = useQuery({
    queryKey: ['payout-accounts-status', searchTerm, page],
    queryFn: async () => {
      const params = { page, limit: 20, ...(searchTerm.trim() ? { search: searchTerm.trim() } : {}) };
      const response = await adminAPI.getSellersPayoutStatus(params);
      return response.data.data;
    },
    retry: 1,
  });

  const blockMutation = useMutation({
    mutationFn: ({ accountId, data }) => adminAPI.blockPayoutAccount(accountId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-accounts-status'] });
      setIsBlockOpen(false);
      setSelectedAccount(null);
      setBlockReason('');
      showSuccess('Payout account status updated successfully');
    },
    onError: (err) => {
      showApiError(err, 'Failed to update payout account status');
    },
  });

  const handleBlock = () => {
    if (!selectedAccount) return;
    const isBlocked = selectedAccount.status !== 'blocked';
    blockMutation.mutate({
      accountId: selectedAccount._id,
      data: {
        isBlocked,
        blockReason: blockReason || undefined,
      },
    });
  };

  if (isLoading) return <Loading message="Loading payout accounts..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || 'Error loading payout accounts'} />;

  const sellers = accountsData?.sellers || [];

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Payout Accounts Management</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">
            Inspect per-method payout accounts. Verification is automatic (PayPal OAuth) — admins can only block / unblock.
          </p>
        </div>
      </div>

      <Card variant="hud">
        <CardHeader>
          <CardTitle>Search Sellers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <SearchInput
              value={searchTerm}
              onChange={(value) => { setSearchTerm(value); setPage(1); }}
              placeholder="Search sellers..."
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card variant="hud">
        <CardHeader>
          <CardTitle>All Sellers Payout Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table variant="hud">
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Seller</TableHead>
                  <TableHead className="text-gray-300">Methods</TableHead>
                  <TableHead className="text-gray-300">Per-method status</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellers.length > 0 ? (
                  sellers.map((item) => {
                    const seller = item.seller;
                    const accounts = Array.isArray(item.accounts) ? item.accounts : [];
                    return (
                      <TableRow key={seller?._id} className="border-gray-700 align-top">
                        <TableCell className="text-white">
                          {seller?.shopName || seller?.userId?.name || 'N/A'}
                          {seller?.userId?.email ? (
                            <p className="text-[11px] text-gray-500">{seller.userId.email}</p>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {accounts.length === 0 ? (
                            <Badge variant="secondary">No methods</Badge>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {accounts.map((a) => (
                                <Badge key={a._id} variant="outline" className="text-xs">
                                  {METHOD_LABEL[a.accountType] || a.accountType}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {accounts.length === 0 ? (
                            <span className="text-xs text-gray-500">—</span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              {accounts.map((a) => (
                                <div key={a._id} className="flex items-center gap-2 text-xs">
                                  <span className="text-gray-400 w-24 shrink-0">
                                    {METHOD_LABEL[a.accountType] || a.accountType}
                                  </span>
                                  <Badge variant={STATUS_VARIANT[a.status] || 'secondary'}>
                                    {a.status}
                                  </Badge>
                                  {a.currency ? <span className="text-gray-500">{a.currency}</span> : null}
                                </div>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {accounts.length > 0 ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setViewSeller({ seller, accounts });
                                  setIsViewOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            ) : null}
                            {accounts.map((a) => (
                              <Button
                                key={a._id}
                                size="sm"
                                variant={a.status === 'blocked' ? 'outline' : 'destructive'}
                                onClick={() => {
                                  setSelectedAccount({ ...a, sellerId: seller?._id });
                                  setIsBlockOpen(true);
                                }}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                {a.status === 'blocked' ? 'Unblock' : 'Block'} {METHOD_LABEL[a.accountType] || a.accountType}
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableEmptyRow colSpan={4}>No sellers found</TableEmptyRow>
                )}
              </TableBody>
            </Table>
          </div>
          <Pagination
            page={accountsData?.pagination?.page || page}
            totalPages={accountsData?.pagination?.pages || 1}
            onPageChange={setPage}
            total={accountsData?.pagination?.total}
            totalNoun="sellers"
          />
        </CardContent>
      </Card>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent size="md" className="">
          <DialogHeader>
            <DialogTitle className="text-white">Payout methods — {viewSeller?.seller?.shopName || viewSeller?.seller?.userId?.name || ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {(viewSeller?.accounts || []).map((a) => (
              <div key={a._id} className="rounded-md border border-gray-700 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{METHOD_LABEL[a.accountType] || a.accountType}</span>
                  <Badge variant={STATUS_VARIANT[a.status] || 'secondary'}>{a.status}</Badge>
                </div>
                <p className="text-xs text-gray-400">Currency: {a.currency || 'USD'}{a.country ? ` • ${a.country}` : ''}</p>
                <p className="text-xs text-gray-400">
                  Linked: {a.linkedAt ? new Date(a.linkedAt).toLocaleString() : '—'}
                  {a.verifiedAt ? ` • Verified: ${new Date(a.verifiedAt).toLocaleString()}` : ''}
                </p>
                {a.status === 'blocked' && a.blockedAt ? (
                  <p className="text-xs text-rose-300">
                    Blocked: {new Date(a.blockedAt).toLocaleString()}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBlockOpen} onOpenChange={setIsBlockOpen}>
        <DialogContent size="sm" className="">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedAccount?.status === 'blocked' ? 'Unblock' : 'Block'}{' '}
              {METHOD_LABEL[selectedAccount?.accountType] || selectedAccount?.accountType} Account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="blockReason" className="text-gray-300">Reason (optional)</Label>
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
