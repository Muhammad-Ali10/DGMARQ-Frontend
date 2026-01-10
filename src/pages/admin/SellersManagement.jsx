import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { CheckCircle2, XCircle, Eye, Ban, UserCheck, ChevronLeft, ChevronRight, Search, Store, Users } from 'lucide-react';
import { showSuccess, showApiError } from '../../utils/toast';

const SellersManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [blockingId, setBlockingId] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch pending sellers - always fetch to show count in tab
  const { data: pendingSellers, isLoading: isLoadingPending, isError: isErrorPending, error: errorPending } = useQuery({
    queryKey: ['pending-sellers', page],
    queryFn: async () => {
      try {
        const response = await adminAPI.getPendingSellers({ page, limit: 20 });
        return response.data.data;
      } catch (err) {
        console.error('Pending sellers error:', err);
        throw err;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch active sellers - always fetch to show count in tab
  const { data: activeSellers, isLoading: isLoadingActive, isError: isErrorActive, error: errorActive } = useQuery({
    queryKey: ['active-sellers', page],
    queryFn: async () => {
      try {
        const response = await adminAPI.getAllSellers({ page, limit: 20, status: 'active' });
        return response.data.data;
      } catch (err) {
        console.error('Active sellers error:', err);
        throw err;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch banned sellers - always fetch to show count in tab
  const { data: bannedSellers, isLoading: isLoadingBanned, isError: isErrorBanned, error: errorBanned } = useQuery({
    queryKey: ['banned-sellers', page],
    queryFn: async () => {
      try {
        const response = await adminAPI.getAllSellers({ page, limit: 20, status: 'banned' });
        return response.data.data;
      } catch (err) {
        console.error('Banned sellers error:', err);
        throw err;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const approveMutation = useMutation({
    mutationFn: (sellerId) => adminAPI.approveSeller(sellerId),
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-sellers']);
      queryClient.invalidateQueries(['active-sellers']);
      queryClient.invalidateQueries(['banned-sellers']);
      queryClient.invalidateQueries(['admin-dashboard-stats']);
      showSuccess('Seller approved successfully');
    },
    onError: (err) => {
      showApiError(err, 'Failed to approve seller');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ sellerId, reason }) => adminAPI.rejectSeller(sellerId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-sellers']);
      queryClient.invalidateQueries(['active-sellers']);
      queryClient.invalidateQueries(['banned-sellers']);
      queryClient.invalidateQueries(['admin-dashboard-stats']);
      setRejectingId(null);
      setRejectReason('');
      setRejectDialogOpen(false);
      showSuccess('Seller rejected successfully');
    },
    onError: (err) => {
      showApiError(err, 'Failed to reject seller');
    },
  });

  const blockMutation = useMutation({
    mutationFn: ({ sellerId, reason }) => adminAPI.blockSeller(sellerId, { action: 'block', reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['active-sellers']);
      queryClient.invalidateQueries(['banned-sellers']);
      queryClient.invalidateQueries(['admin-dashboard-stats']);
      setBlockingId(null);
      setBlockReason('');
      setBlockDialogOpen(false);
      showSuccess('Seller blocked successfully');
    },
    onError: (err) => {
      showApiError(err, 'Failed to block seller');
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (sellerId) => adminAPI.blockSeller(sellerId, { action: 'unblock' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['active-sellers']);
      queryClient.invalidateQueries(['banned-sellers']);
      queryClient.invalidateQueries(['admin-dashboard-stats']);
      showSuccess('Seller unblocked successfully');
    },
    onError: (err) => {
      showApiError(err, 'Failed to unblock seller');
    },
  });

  const handleApprove = (sellerId) => {
      approveMutation.mutate(sellerId);
  };

  const handleRejectClick = (sellerId) => {
    setRejectingId(sellerId);
    setRejectDialogOpen(true);
  };

  const handleReject = () => {
    if (rejectReason.trim() && rejectingId) {
      rejectMutation.mutate({ sellerId: rejectingId, reason: rejectReason });
    }
  };

  const handleBlockClick = (sellerId) => {
    setBlockingId(sellerId);
    setBlockDialogOpen(true);
  };

  const handleBlock = () => {
    if (blockReason.trim() && blockingId) {
      blockMutation.mutate({ sellerId: blockingId, reason: blockReason });
    }
  };

  const handleUnblock = (sellerId) => {
      unblockMutation.mutate(sellerId);
  };

  const handleViewSeller = (sellerId) => {
    navigate(`/admin/sellers/${sellerId}`);
  };

  const isLoading = activeTab === 'pending' 
    ? isLoadingPending 
    : activeTab === 'active' 
    ? isLoadingActive 
    : isLoadingBanned;
  
  const isError = activeTab === 'pending' 
    ? isErrorPending 
    : activeTab === 'active' 
    ? isErrorActive 
    : isErrorBanned;
  
  const error = activeTab === 'pending' 
    ? errorPending 
    : activeTab === 'active' 
    ? errorActive 
    : errorBanned;

  const sellers = activeTab === 'pending' 
    ? (pendingSellers?.sellers || [])
    : activeTab === 'active'
    ? (activeSellers?.sellers || [])
    : (bannedSellers?.sellers || []);
  
  const pagination = activeTab === 'pending'
    ? (pendingSellers?.pagination || {})
    : activeTab === 'active'
    ? (activeSellers?.pagination || {})
    : (bannedSellers?.pagination || {});

  // Filter sellers by search term
  const filteredSellers = sellers.filter(seller => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      seller.shopName?.toLowerCase().includes(searchLower) ||
      seller.userId?.email?.toLowerCase().includes(searchLower) ||
      seller.country?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      active: 'success',
      banned: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'} className="text-xs px-2 py-0.5">{status.toUpperCase()}</Badge>;
  };

  if (isLoading) return <Loading message={`Loading ${activeTab} sellers...`} />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || `Error loading ${activeTab} sellers`} />;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Sellers Management</h1>
        <p className="text-gray-400 mt-1">Manage seller applications and active sellers</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setPage(1); }} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-secondary border border-gray-700">
          <TabsTrigger 
            value="pending" 
            className="data-[state=active]:bg-accent data-[state=active]:text-white text-gray-300"
          >
            <Users className="h-4 w-4 mr-2" />
            Pending ({pendingSellers?.pagination?.total || 0})
          </TabsTrigger>
          <TabsTrigger 
            value="active" 
            className="data-[state=active]:bg-accent data-[state=active]:text-white text-gray-300"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Active ({activeSellers?.pagination?.total || 0})
          </TabsTrigger>
          <TabsTrigger 
            value="banned" 
            className="data-[state=active]:bg-accent data-[state=active]:text-white text-gray-300"
          >
            <Ban className="h-4 w-4 mr-2" />
            Banned ({bannedSellers?.pagination?.total || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="bg-primary border-gray-700 shadow-lg">
            <CardHeader className="border-b border-gray-700">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle className="text-white flex items-center gap-2">
                  <Store className="h-5 w-5 text-accent" />
                  {activeTab === 'pending' && 'Pending Seller Applications'}
                  {activeTab === 'active' && 'Active Sellers'}
                  {activeTab === 'banned' && 'Banned Sellers'}
                </CardTitle>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search sellers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-secondary border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredSellers.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Store className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-lg">No {activeTab} sellers found</p>
                  {searchTerm && <p className="text-sm mt-2">Try adjusting your search</p>}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700 bg-secondary/50 hover:bg-secondary">
                          <TableHead className="text-gray-300 font-semibold">Shop Name</TableHead>
                          <TableHead className="text-gray-300 font-semibold">Email</TableHead>
                          <TableHead className="text-gray-300 font-semibold">Location</TableHead>
                          <TableHead className="text-gray-300 font-semibold">Status</TableHead>
                          <TableHead className="text-gray-300 font-semibold">Joined</TableHead>
                          <TableHead className="text-gray-300 font-semibold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSellers.map((seller) => (
                          <TableRow 
                            key={seller._id} 
                            className="border-gray-700 hover:bg-gray-800/50 transition-colors cursor-pointer"
                            onClick={() => handleViewSeller(seller._id)}
                          >
                            <TableCell className="text-white font-medium">
                              <div className="flex items-center gap-3">
                                {seller.shopLogo && (
                                  <img 
                                    src={seller.shopLogo} 
                                    alt={seller.shopName}
                                    className="w-10 h-10 rounded-full object-cover border border-gray-700"
                                  />
                                )}
                                <span>{seller.shopName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-300">{seller.userId?.email || 'N/A'}</TableCell>
                            <TableCell className="text-gray-300">
                              {seller.city ? `${seller.city}, ` : ''}
                              {seller.country || 'N/A'}
                            </TableCell>
                            <TableCell>{getStatusBadge(seller.status)}</TableCell>
                            <TableCell className="text-gray-400">
                              {new Date(seller.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewSeller(seller._id)}
                                  className="border-gray-700 hover:bg-accent hover:border-accent"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {activeTab === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => handleApprove(seller._id)}
                                      disabled={approveMutation.isPending}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleRejectClick(seller._id)}
                                      disabled={rejectMutation.isPending}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                                {activeTab === 'active' && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleBlockClick(seller._id)}
                                    disabled={blockMutation.isPending}
                                  >
                                    <Ban className="h-4 w-4 mr-1" />
                                    Block
                                  </Button>
                                )}
                                {activeTab === 'banned' && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleUnblock(seller._id)}
                                    disabled={unblockMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    Unblock
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700 bg-secondary/30">
                      <div className="text-sm text-gray-400">
                        Showing page {page} of {pagination.pages || 1} ({pagination.total || 0} total)
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="border-gray-700 hover:bg-accent hover:border-accent"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, pagination.pages || 1) }, (_, i) => {
                            let pageNum;
                            if (pagination.pages <= 5) {
                              pageNum = i + 1;
                            } else if (page <= 3) {
                              pageNum = i + 1;
                            } else if (page >= (pagination.pages || 1) - 2) {
                              pageNum = (pagination.pages || 1) - 4 + i;
                            } else {
                              pageNum = page - 2 + i;
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={page === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPage(pageNum)}
                                className={page === pageNum ? "bg-accent" : "border-gray-700"}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.min(pagination.pages || 1, p + 1))}
                          disabled={page >= (pagination.pages || 1)}
                          className="border-gray-700 hover:bg-accent hover:border-accent"
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Seller Application</DialogTitle>
            <DialogDescription className="text-gray-400">
              Please provide a reason for rejecting this seller application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-gray-300">Rejection Reason</Label>
              <Input
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Block Seller</DialogTitle>
            <DialogDescription className="text-gray-400">
              Please provide a reason for blocking this seller.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="blockReason" className="text-gray-300">Block Reason</Label>
              <Input
                id="blockReason"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Enter block reason"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBlock}
                disabled={!blockReason.trim() || blockMutation.isPending}
              >
                {blockMutation.isPending ? 'Blocking...' : 'Confirm Block'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellersManagement;
