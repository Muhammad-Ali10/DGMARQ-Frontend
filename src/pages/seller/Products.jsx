import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { productAPI } from '../../services/api';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import BulkUploadModal from '../../components/BulkUploadModal';
import { Plus, Edit, Trash2, Copy, Image as ImageIcon, RefreshCw, ChevronLeft, ChevronRight, Package, Filter, Upload } from 'lucide-react';

const SellerProducts = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected', 'active'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [images, setImages] = useState(null);
  const [bulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const queryParams = {
    page,
    limit: 10,
  };

  // Add status filter if not 'all'
  if (statusFilter !== 'all') {
    queryParams.status = statusFilter;
  }

  const { data: productsData, isLoading, isError, error } = useQuery({
    queryKey: ['seller-products', page, statusFilter],
    queryFn: async () => {
      const response = await productAPI.getProducts(queryParams);
      return response.data.data;
    },
    retry: 2,
  });

  const deleteMutation = useMutation({
    mutationFn: (productId) => productAPI.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-products']);
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (productId) => productAPI.duplicateProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-products']);
      toast.success('Product duplicated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to duplicate product');
    },
  });

  const updateImagesMutation = useMutation({
    mutationFn: ({ productId, formData }) => productAPI.updateProductImages(productId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-products']);
      setImages(null);
      setSelectedProduct(null);
      toast.success('Product images updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update images');
    },
  });

  const syncStockMutation = useMutation({
    mutationFn: (productId) => productAPI.syncStock(productId),
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-products']);
      toast.success('Stock synced successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to sync stock');
    },
  });

  const handleDelete = (productId) => {
      deleteMutation.mutate(productId);
  };

  const handleDuplicate = (productId) => {
      duplicateMutation.mutate(productId);
  };

  const handleUpdateImages = (productId) => {
    setSelectedProduct(productId);
  };

  const handleSubmitImages = () => {
    if (!images || images.length === 0) {
      toast.warning('Please select at least one image');
      return;
    }
    const formData = new FormData();
    Array.from(images).forEach((file) => {
      formData.append('images', file);
    });
    updateImagesMutation.mutate({ productId: selectedProduct, formData });
  };

  const handleSyncStock = (productId) => {
    syncStockMutation.mutate(productId);
  };

  if (isLoading) return <Loading message="Loading products..." />;
  if (isError) {
    const errorMessage = error?.response?.data?.message || error?.message || "Failed to load products. Please try again.";
    return <ErrorMessage message={errorMessage} />;
  }

  // Handle both response structures: aggregatePaginate returns 'docs', some APIs return 'products'
  const products = productsData?.docs || productsData?.products || [];
  const pagination = {
    totalPages: productsData?.totalPages || productsData?.pagination?.totalPages || 1,
    page: productsData?.page || productsData?.pagination?.page || 1,
    total: productsData?.totalDocs || productsData?.total || productsData?.pagination?.total || 0,
    hasNextPage: productsData?.hasNextPage || productsData?.pagination?.hasNextPage || false,
    hasPrevPage: productsData?.hasPrevPage || productsData?.pagination?.hasPrevPage || false,
  };

  // Calculate counts from current page data (approximate)
  const statusCounts = {
    all: pagination.total || 0,
    pending: statusFilter === 'pending' ? products.length : products.filter(p => p.status === 'pending').length,
    approved: statusFilter === 'approved' ? products.length : products.filter(p => p.status === 'approved').length,
    rejected: statusFilter === 'rejected' ? products.length : products.filter(p => p.status === 'rejected').length,
    active: statusFilter === 'active' ? products.length : products.filter(p => p.status === 'active').length,
  };

  const statusTabs = [
    { id: 'all', label: 'All Products', count: statusCounts.all },
    { id: 'pending', label: 'Pending', count: statusFilter === 'pending' ? statusCounts.pending : null },
    { id: 'approved', label: 'Approved', count: statusFilter === 'approved' ? statusCounts.approved : null },
    { id: 'rejected', label: 'Rejected', count: statusFilter === 'rejected' ? statusCounts.rejected : null },
    { id: 'active', label: 'Active', count: statusFilter === 'active' ? statusCounts.active : null },
  ];

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">My Products</h1>
          <p className="text-gray-400 mt-1">Manage your product listings</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setBulkUploadModalOpen(true)}
            className="border-gray-700 text-gray-300 hover:bg-gray-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Inventory
          </Button>
          <Link to="/seller/products/create">
            <Button className="bg-accent hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <Card className="bg-primary border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {statusTabs.map((tab) => (
              <Button
                key={tab.id}
                variant={statusFilter === tab.id ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1); // Reset to first page when changing filter
                }}
                className={`flex-shrink-0 ${
                  statusFilter === tab.id
                    ? 'bg-accent hover:bg-blue-700 text-white'
                    : 'border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <Badge
                    variant="secondary"
                    className={`ml-2 ${
                      statusFilter === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {tab.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {products.length === 0 ? (
        <Card className="bg-primary border-gray-700">
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No products yet</p>
            <p className="text-gray-500 text-sm mt-2">Create your first product to get started</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-primary border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Product</TableHead>
                    <TableHead className="text-gray-300">Price</TableHead>
                    <TableHead className="text-gray-300">Stock</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product._id} className="border-gray-700">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.images?.[0] && (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-12 w-12 rounded object-cover"
                            />
                          )}
                          <div className="max-w-sm truncate">
                            <div className="font-medium text-white">{product.name}</div>
                            <div className="text-sm text-gray-400">{product.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">${product.price}</TableCell>
                      <TableCell className="text-white">{product.availableKeysCount || 0}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.status === 'active' ? 'success' :
                            product.status === 'approved' ? 'success' :
                            product.status === 'pending' ? 'warning' :
                            product.status === 'rejected' ? 'destructive' :
                            'default'
                          }
                          className="capitalize"
                        >
                          {product.status === 'active' ? 'Approved / Published' :
                           product.status === 'approved' ? 'Approved / Published' :
                           product.status === 'pending' ? 'Pending Approval' :
                           product.status === 'rejected' ? 'Rejected' :
                           product.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link to={`/seller/products/${product._id}/edit`}>
                            <Button size="sm" variant="outline" className="border-gray-700 text-gray-300">
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          </Link>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateImages(product._id)}
                                className="border-gray-700 text-gray-300"
                              >
                                <ImageIcon className="w-3 h-3 mr-1" />
                                Images
                              </Button>
                            </DialogTrigger>
                            <DialogContent size="sm" className="bg-primary border-gray-700">
                              <DialogHeader>
                                <DialogTitle className="text-white">Update Product Images</DialogTitle>
                                <DialogDescription className="text-gray-400">
                                  Upload up to 5 images for this product
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="images" className="text-gray-300">Product Images</Label>
                                  <Input
                                    id="images"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => setImages(e.target.files)}
                                    className="bg-secondary border-gray-700 text-white"
                                  />
                                  <p className="text-xs text-gray-400">You can select up to 5 images</p>
                                </div>
                                <Button
                                  onClick={handleSubmitImages}
                                  disabled={updateImagesMutation.isPending}
                                  className="w-full bg-accent hover:bg-blue-700"
                                >
                                  {updateImagesMutation.isPending ? 'Updating...' : 'Update Images'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDuplicate(product._id)}
                            disabled={duplicateMutation.isPending}
                            className="border-gray-700 text-gray-300"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Duplicate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSyncStock(product._id)}
                            disabled={syncStockMutation.isPending}
                            className="border-gray-700 text-gray-300"
                          >
                            <RefreshCw className={`w-3 h-3 mr-1 ${syncStockMutation.isPending ? 'animate-spin' : ''}`} />
                            Sync Stock
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(product._id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {(productsData?.totalDocs ?? productsData?.docs?.length ?? 0) > 0 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  Page {page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="border-gray-700 text-gray-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages}
                    className="border-gray-700 text-gray-300"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        open={bulkUploadModalOpen}
        onOpenChange={setBulkUploadModalOpen}
      />
    </div>
  );
};

export default SellerProducts;

