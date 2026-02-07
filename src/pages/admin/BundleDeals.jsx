import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI, productAPI } from '../../services/api';
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Plus, Edit, X, Trash2, Package, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import { showSuccess, showApiError, showError, showWarning } from '../../utils/toast';

const BundleDeals = () => {
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [title, setTitle] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const queryClient = useQueryClient();

  const { data: bundlesData, isLoading, isError, error } = useQuery({
    queryKey: ['bundle-deals', page],
    queryFn: async () => {
      try {
        const response = await adminAPI.getAllBundleDeals({ page, limit: 10 });
        return response.data.data;
      } catch (err) {
        throw err;
      }
    },
    keepPreviousData: true,
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products-search', productSearch],
    queryFn: async () => {
      try {
        const response = await productAPI.getProducts({ search: productSearch, limit: 10, status: 'approved' });
        return response.data.data;
      } catch (err) {
        return { products: [] };
      }
    },
    enabled: productSearch.length > 2 || isCreateDialogOpen || isEditDialogOpen,
    retry: 1,
  });

  const bundles = bundlesData?.docs || bundlesData?.products || bundlesData || [];
  const pagination = bundlesData?.pagination || {
    page: 1,
    limit: 10,
    totalPages: 1,
    totalDocs: bundles.length,
  };

  const createMutation = useMutation({
    mutationFn: (formData) => adminAPI.createBundleDeal(formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['bundle-deals']);
      setIsCreateDialogOpen(false);
      resetForm();
      showSuccess('Bundle deal created successfully');
    },
    onError: (err) => {
      showApiError(err, 'Failed to create bundle deal');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }) => adminAPI.updateBundleDeal(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['bundle-deals']);
      setIsEditDialogOpen(false);
      setSelectedBundle(null);
      resetForm();
      showSuccess('Bundle deal updated successfully');
    },
    onError: (err) => {
      showApiError(err, 'Failed to update bundle deal');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteBundleDeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['bundle-deals']);
      setShowDeleteModal(false);
      setDeleteId(null);
      showSuccess('Bundle deal deleted successfully');
    },
    onError: (err) => {
      showApiError(err, 'Failed to delete bundle deal');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id) => adminAPI.toggleBundleDealStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['bundle-deals']);
      showSuccess('Bundle deal status updated successfully');
    },
    onError: (err) => {
      showApiError(err, 'Failed to update bundle deal status');
    },
  });

  const resetForm = () => {
    setTitle('');
    setSelectedProducts([]);
    setProductSearch('');
    setDiscountType('percentage');
    setDiscountValue('');
    setStartDate('');
    setEndDate('');
  };

  const handleProductSelect = (product) => {
    if (selectedProducts.length >= 2) {
      showWarning('Bundle can only contain 2 products');
      return;
    }
    if (selectedProducts.find((p) => p._id === product._id)) {
      showWarning('Product already selected');
      return;
    }
    setSelectedProducts([...selectedProducts, product]);
    setProductSearch('');
  };

  const handleProductRemove = (productId) => {
    setSelectedProducts(selectedProducts.filter((p) => p._id !== productId));
  };


  const handleCreate = () => {
    if (!title || selectedProducts.length !== 2 || !discountValue || !startDate || !endDate) {
      showError('Please fill all fields and select exactly 2 products');
      return;
    }

    const discountNum = parseFloat(discountValue);
    if (isNaN(discountNum) || discountNum <= 0) {
      showError('Invalid discount value');
      return;
    }

    if (discountType === 'percentage' && (discountNum > 100 || discountNum <= 0)) {
      showError('Percentage discount must be between 1 and 100');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('products', JSON.stringify(selectedProducts.map((p) => p._id)));
    formData.append('discountType', discountType);
    formData.append('discountValue', discountNum);
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);

    createMutation.mutate(formData);
  };

  const handleEdit = (bundle) => {
    setSelectedBundle(bundle);
    setTitle(bundle.title || '');
    setSelectedProducts(bundle.products || []);
    setDiscountType(bundle.discountType || 'percentage');
    setDiscountValue(bundle.discountValue?.toString() || '');
    setStartDate(new Date(bundle.startDate).toISOString().split('T')[0]);
    setEndDate(new Date(bundle.endDate).toISOString().split('T')[0]);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!title || selectedProducts.length !== 2 || !discountValue || !startDate || !endDate) {
      showError('Please fill all fields and select exactly 2 products');
      return;
    }

    const discountNum = parseFloat(discountValue);
    if (isNaN(discountNum) || discountNum <= 0) {
      showError('Invalid discount value');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('products', JSON.stringify(selectedProducts.map((p) => p._id || p)));
    formData.append('discountType', discountType);
    formData.append('discountValue', discountNum);
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);

    updateMutation.mutate({ id: selectedBundle._id, formData });
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const getStatusBadge = (bundle) => {
    const now = new Date();
    const start = new Date(bundle.startDate);
    const end = new Date(bundle.endDate);

    if (!bundle.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    if (now < start) {
      return <Badge variant="warning">Upcoming</Badge>;
    }

    if (now > end) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    return <Badge variant="success">Active</Badge>;
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxPagesToShow - 1);

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
        >
          {i}
        </Button>
      );
    }
    return pages;
  };

  if (isLoading && !bundlesData) return <Loading message="Loading bundle deals..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || "Error loading bundle deals"} />;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Bundle Deals</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">Manage exclusive bundle deals (2 products)</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Bundle Deal
        </Button>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">All Bundle Deals</CardTitle>
        </CardHeader>
        <CardContent>
          {bundles.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No bundle deals found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Title</TableHead>
                      <TableHead className="text-gray-300">Products</TableHead>
                      <TableHead className="text-gray-300">Discount</TableHead>
                      <TableHead className="text-gray-300">Dates</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bundles.map((bundle) => (
                      <TableRow key={bundle._id} className="border-gray-700">
                        <TableCell className="text-white font-medium">{bundle.title}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {bundle.products?.slice(0, 2).map((product) => (
                              <div key={product._id || product} className="text-sm text-gray-300">
                                {product.name || product}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-400">
                            {bundle.discountType === 'percentage' ? `${bundle.discountValue}%` : `$${bundle.discountValue}`}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-400 text-sm">
                          <div>{new Date(bundle.startDate).toLocaleDateString()}</div>
                          <div>to {new Date(bundle.endDate).toLocaleDateString()}</div>
                        </TableCell>
                        <TableCell>{getStatusBadge(bundle)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(bundle)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleStatusMutation.mutate(bundle._id)}
                              disabled={toggleStatusMutation.isPending}
                            >
                              {bundle.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(bundle._id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {(pagination.totalDocs ?? 0) > 0 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-700">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex gap-1">{renderPageNumbers()}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent size="lg" className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Create Bundle Deal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-gray-300">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Exclusive Bundle Deals"
                className="bg-secondary border-gray-700 text-white"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-gray-300">Select 2 Products</Label>
              <Input
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="bg-secondary border-gray-700 text-white"
              />
              {productSearch.length > 2 && (
                <div className="border border-gray-700 rounded-md max-h-48 overflow-y-auto bg-secondary">
                  {productsLoading ? (
                    <div className="p-4 text-center text-gray-400">Loading...</div>
                  ) : products?.products?.length > 0 ? (
                    products.products
                      .filter((p) => !selectedProducts.find((sp) => sp._id === p._id))
                      .map((product) => (
                        <div
                          key={product._id}
                          className="p-3 cursor-pointer hover:bg-secondary/50 border-b border-gray-700"
                          onClick={() => handleProductSelect(product)}
                        >
                          <div className="font-medium text-white">{product.name}</div>
                          <div className="text-sm text-gray-400">${product.price}</div>
                        </div>
                      ))
                  ) : (
                    <div className="p-4 text-center text-gray-400">No products found</div>
                  )}
                </div>
              )}
              {selectedProducts.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedProducts.map((product) => (
                    <Badge key={product._id} variant="default" className="flex items-center gap-2">
                      {product.name}
                      <XCircle
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleProductRemove(product._id)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-400">Selected: {selectedProducts.length}/2</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-gray-300">Discount Type</Label>
                <Select value={discountType} onValueChange={setDiscountType}>
                  <SelectTrigger className="bg-secondary border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-gray-300">
                  Discount Value {discountType === 'percentage' ? '(%)' : '($)'}
                </Label>
                <Input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="bg-secondary border-gray-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-gray-300">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-secondary border-gray-700 text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-gray-300">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-secondary border-gray-700 text-white"
                />
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Bundle Deal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent size="lg" className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Bundle Deal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Same form fields as create */}
            <div className="grid gap-2">
              <Label className="text-gray-300">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-secondary border-gray-700 text-white"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-gray-300">Select 2 Products</Label>
              <Input
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="bg-secondary border-gray-700 text-white"
              />
              {productSearch.length > 2 && (
                <div className="border border-gray-700 rounded-md max-h-48 overflow-y-auto bg-secondary">
                  {productsLoading ? (
                    <div className="p-4 text-center text-gray-400">Loading...</div>
                  ) : products?.products?.length > 0 ? (
                    products.products
                      .filter((p) => !selectedProducts.find((sp) => (sp._id || sp) === p._id))
                      .map((product) => (
                        <div
                          key={product._id}
                          className="p-3 cursor-pointer hover:bg-secondary/50 border-b border-gray-700"
                          onClick={() => handleProductSelect(product)}
                        >
                          <div className="font-medium text-white">{product.name}</div>
                          <div className="text-sm text-gray-400">${product.price}</div>
                        </div>
                      ))
                  ) : (
                    <div className="p-4 text-center text-gray-400">No products found</div>
                  )}
                </div>
              )}
              {selectedProducts.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedProducts.map((product) => (
                    <Badge key={product._id || product} variant="default" className="flex items-center gap-2">
                      {product.name || product}
                      <XCircle
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleProductRemove(product._id || product)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-400">Selected: {selectedProducts.length}/2</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-gray-300">Discount Type</Label>
                <Select value={discountType} onValueChange={setDiscountType}>
                  <SelectTrigger className="bg-secondary border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-gray-300">
                  Discount Value {discountType === 'percentage' ? '(%)' : '($)'}
                </Label>
                <Input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="bg-secondary border-gray-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-gray-300">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-secondary border-gray-700 text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-gray-300">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-secondary border-gray-700 text-white"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); setSelectedBundle(null); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Updating...' : 'Update Bundle Deal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Delete Bundle Deal"
        description="Are you sure you want to delete this bundle deal? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId);
          }
        }}
      />
    </div>
  );
};

export default BundleDeals;

