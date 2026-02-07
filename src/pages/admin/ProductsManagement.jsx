import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, RefreshCw, Package, Store, Tag, Clock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProductsManagement = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [page, setPage] = useState(1);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch pending products
  const { data: pendingProducts, isLoading: isLoadingPending, isError: isErrorPending, error: errorPending } = useQuery({
    queryKey: ['pending-products', page],
    queryFn: async () => {
      try {
        const response = await adminAPI.getPendingProducts({ page, limit: 10 });
        return response.data.data;
      } catch (err) {
        throw err;
      }
    },
    keepPreviousData: true,
  });

  // Fetch approved products - always fetch to show count in tab
  const { data: approvedProducts, isLoading: isLoadingApproved, isError: isErrorApproved, error: errorApproved } = useQuery({
    queryKey: ['approved-products', page],
    queryFn: async () => {
      try {
        const response = await adminAPI.getAllProducts({ page, limit: 10, status: 'approved' });
        return response.data.data;
      } catch (err) {
        throw err;
      }
    },
    keepPreviousData: true,
  });

  // Fetch rejected products - always fetch to show count in tab
  const { data: rejectedProducts, isLoading: isLoadingRejected, isError: isErrorRejected, error: errorRejected } = useQuery({
    queryKey: ['rejected-products', page],
    queryFn: async () => {
      try {
        const response = await adminAPI.getAllProducts({ page, limit: 10, status: 'rejected' });
        return response.data.data;
      } catch (err) {
        throw err;
      }
    },
    keepPreviousData: true,
  });

  const approveMutation = useMutation({
    mutationFn: (productId) => adminAPI.approveProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-products']);
      queryClient.invalidateQueries(['approved-products']);
      queryClient.invalidateQueries(['admin-dashboard-stats']);
      toast.success('Product approved successfully');
      if (pendingProducts?.products?.length === 1 && page > 1) {
        setPage(page - 1);
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to approve product');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ productId, reason }) => adminAPI.rejectProduct(productId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-products']);
      queryClient.invalidateQueries(['rejected-products']);
      queryClient.invalidateQueries(['admin-dashboard-stats']);
      setRejectingId(null);
      setRejectReason('');
      setDialogOpen(false);
      toast.success('Product rejected successfully');
      if (pendingProducts?.products?.length === 1 && page > 1) {
        setPage(page - 1);
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to reject product');
    },
  });

  const handleApprove = (productId) => {
    approveMutation.mutate(productId);
  };

  const handleRejectClick = (productId) => {
    setRejectingId(productId);
    setDialogOpen(true);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.warning('Please provide a rejection reason');
      return;
    }
    if (rejectingId) {
      rejectMutation.mutate({ productId: rejectingId, reason: rejectReason.trim() });
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPageNumbers = (pagination) => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(pagination.pages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          size="sm"
          variant={i === pagination.page ? 'default' : 'outline'}
          onClick={() => handlePageChange(i)}
          className={i === pagination.page ? 'bg-accent hover:bg-blue-700' : ''}
        >
          {i}
        </Button>
      );
    }
    return pages;
  };

  // Determine current data based on active tab
  const isLoading = activeTab === 'pending' 
    ? isLoadingPending 
    : activeTab === 'approved' 
    ? isLoadingApproved 
    : isLoadingRejected;
  
  const isError = activeTab === 'pending' 
    ? isErrorPending 
    : activeTab === 'approved' 
    ? isErrorApproved 
    : isErrorRejected;
  
  const error = activeTab === 'pending' 
    ? errorPending 
    : activeTab === 'approved' 
    ? errorApproved 
    : errorRejected;

  const products = activeTab === 'pending' 
    ? (pendingProducts?.products || [])
    : activeTab === 'approved'
    ? (approvedProducts?.products || [])
    : (rejectedProducts?.products || []);
  
  const pagination = activeTab === 'pending'
    ? (pendingProducts?.pagination || { page: 1, limit: 10, total: 0, pages: 1 })
    : activeTab === 'approved'
    ? (approvedProducts?.pagination || { page: 1, limit: 10, total: 0, pages: 1 })
    : (rejectedProducts?.pagination || { page: 1, limit: 10, total: 0, pages: 1 });

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      active: 'success',
      approved: 'success',
      rejected: 'destructive',
    };
    // Map status to user-friendly labels
    const statusLabels = {
      pending: 'Pending Approval',
      active: 'Approved / Published',
      approved: 'Approved / Published',
      rejected: 'Rejected',
    };
    const displayLabel = statusLabels[status] || status.toUpperCase();
    return <Badge variant={variants[status] || 'default'} className="text-xs px-2 py-0.5">{displayLabel}</Badge>;
  };

  const renderProductsTable = () => {
    if (products.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="p-4 bg-secondary/30 rounded-full">
              <Package className="w-8 h-8 text-gray-500" />
            </div>
            <div>
              <p className="text-gray-400 font-medium">No {activeTab} products</p>
              <p className="text-gray-500 text-sm mt-1">
                {activeTab === 'pending' && 'All products have been reviewed'}
                {activeTab === 'approved' && 'No approved products found'}
                {activeTab === 'rejected' && 'No rejected products found'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 bg-secondary/30 hover:bg-secondary/30">
                <TableHead className="text-gray-300 font-semibold">Product</TableHead>
                <TableHead className="text-gray-300 font-semibold">Seller</TableHead>
                <TableHead className="text-gray-300 font-semibold">Category</TableHead>
                <TableHead className="text-gray-300 font-semibold">Price</TableHead>
                <TableHead className="text-gray-300 font-semibold">Stock</TableHead>
                <TableHead className="text-gray-300 font-semibold">Status</TableHead>
                {activeTab === 'rejected' && <TableHead className="text-gray-300 font-semibold">Rejection Reason</TableHead>}
                <TableHead className="text-gray-300 font-semibold">Created</TableHead>
                <TableHead className="text-gray-300 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product._id} className="border-gray-700 hover:bg-secondary/20">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg border border-gray-700"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-secondary/50 rounded-lg border border-gray-700 flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-white max-w-sm truncate">{product.name}</div>
                        {product.description && (
                          <div className="text-xs text-gray-500 mt-1 max-w-sm truncate">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-gray-400" />
                      {product.sellerId?._id ? (
                        <button
                          onClick={() => navigate(`/admin/sellers/${product.sellerId._id}`)}
                          className="text-accent hover:underline font-medium"
                        >
                          {product.sellerId.shopName || 'N/A'}
                        </button>
                      ) : (
                        <span className="text-gray-300">
                          {product.sellerId?.shopName || 'N/A'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">
                        {product.categoryId?.name || 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-white font-medium">
                      ${product.price?.toFixed(2) || '0.00'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.availableKeysCount > 0 ? 'success' : 'destructive'}>
                      {product.availableKeysCount || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(product.status)}
                  </TableCell>
                  {activeTab === 'rejected' && (
                    <TableCell>
                      <div className="text-sm text-gray-400 max-w-xs truncate" title={product.rejectionReason || 'No reason provided'}>
                        {product.rejectionReason || 'N/A'}
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="text-gray-400">
                    {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/products/${product._id}`)}
                        className="border-gray-700"
                        title="View Product Details"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {activeTab === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(product._id)}
                            disabled={approveMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                            title="Approve Product"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectClick(product._id)}
                            disabled={rejectMutation.isPending}
                            className="hover:bg-red-700"
                            title="Reject Product"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {(pagination.total ?? 0) > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-700 px-6 pb-6">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || isLoading}
                className="border-gray-700"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex gap-1">
                {renderPageNumbers(pagination)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages || isLoading}
                className="border-gray-700"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </>
    );
  };

  if (isLoading && !products.length) return <Loading message={`Loading ${activeTab} products...`} />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || `Error loading ${activeTab} products`} />;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded-lg">
              <Package className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Products Management</h1>
              <p className="text-sm sm:text-base text-gray-400 mt-1">Manage product approvals, view published and rejected products</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setPage(1); }} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-secondary border border-gray-700">
          <TabsTrigger 
            value="pending" 
            className="data-[state=active]:bg-accent data-[state=active]:text-white text-gray-300"
          >
            <Clock className="h-4 w-4 mr-2" />
            Pending ({pendingProducts?.pagination?.total || 0})
          </TabsTrigger>
          <TabsTrigger 
            value="approved" 
            className="data-[state=active]:bg-accent data-[state=active]:text-white text-gray-300"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Published ({approvedProducts?.pagination?.total || 0})
          </TabsTrigger>
          <TabsTrigger 
            value="rejected" 
            className="data-[state=active]:bg-accent data-[state=active]:text-white text-gray-300"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Rejected ({rejectedProducts?.pagination?.total || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card className="bg-primary border-gray-700 shadow-xl">
            <CardHeader className="border-b border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-white text-xl font-semibold">Pending Products</CardTitle>
                  <p className="text-sm text-gray-400 mt-1">
                    {pagination.total > 0 ? (
                      <>
                        Showing <span className="text-white font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                        <span className="text-white font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                        <span className="text-white font-medium">{pagination.total}</span> pending products
                      </>
                    ) : (
                      'No pending products found'
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="px-3 py-1.5 bg-secondary/50 rounded-lg border border-gray-700">
                    <span className="text-gray-400">Page </span>
                    <span className="text-white font-semibold">{pagination.page}</span>
                    <span className="text-gray-400"> of </span>
                    <span className="text-white font-semibold">{pagination.pages}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {renderProductsTable()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <Card className="bg-primary border-gray-700 shadow-xl">
            <CardHeader className="border-b border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-white text-xl font-semibold">Published Products</CardTitle>
                  <p className="text-sm text-gray-400 mt-1">
                    {pagination.total > 0 ? (
                      <>
                        Showing <span className="text-white font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                        <span className="text-white font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                        <span className="text-white font-medium">{pagination.total}</span> published products
                      </>
                    ) : (
                      'No published products found'
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="px-3 py-1.5 bg-secondary/50 rounded-lg border border-gray-700">
                    <span className="text-gray-400">Page </span>
                    <span className="text-white font-semibold">{pagination.page}</span>
                    <span className="text-gray-400"> of </span>
                    <span className="text-white font-semibold">{pagination.pages}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {renderProductsTable()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <Card className="bg-primary border-gray-700 shadow-xl">
            <CardHeader className="border-b border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-white text-xl font-semibold">Rejected Products</CardTitle>
                  <p className="text-sm text-gray-400 mt-1">
                    {pagination.total > 0 ? (
                      <>
                        Showing <span className="text-white font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                        <span className="text-white font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                        <span className="text-white font-medium">{pagination.total}</span> rejected products
                      </>
                    ) : (
                      'No rejected products found'
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="px-3 py-1.5 bg-secondary/50 rounded-lg border border-gray-700">
                    <span className="text-gray-400">Page </span>
                    <span className="text-white font-semibold">{pagination.page}</span>
                    <span className="text-gray-400"> of </span>
                    <span className="text-white font-semibold">{pagination.pages}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {renderProductsTable()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent size="sm" className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold">Reject Product</DialogTitle>
            <DialogDescription className="text-gray-400">
              Please provide a reason for rejecting this product. This reason will be communicated to the seller.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-gray-300">Rejection Reason *</Label>
              <Textarea
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter the reason for rejecting this product..."
                className="bg-secondary border-gray-700 text-white min-h-[100px]"
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setRejectReason('');
                  setRejectingId(null);
                }}
                className="border-gray-700"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                className="hover:bg-red-700"
              >
                {rejectMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Confirm Rejection
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsManagement;
