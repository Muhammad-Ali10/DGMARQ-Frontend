import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flashDealAPI, productAPI } from '../../services/api';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Plus, Edit, Trash2, Image as ImageIcon, Search, X } from 'lucide-react';
import { showSuccess, showError, showApiError } from '../../utils/toast';

const FlashDealsManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [formData, setFormData] = useState({
    productId: '',
    discountPercentage: '',
    startDate: '',
    endDate: '',
    banner: null,
  });
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef(null);
  const queryClient = useQueryClient();

  // Debounce product search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(productSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // Fetch products for dropdown
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products-search', debouncedSearch],
    queryFn: () => productAPI.getProducts({ 
      search: debouncedSearch, 
      limit: 10,
      status: 'approved'
    }).then(res => res.data.data),
    enabled: isProductDropdownOpen || debouncedSearch.length > 0,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: flashDeals, isLoading, isError } = useQuery({
    queryKey: ['flash-deals'],
    queryFn: () => flashDealAPI.getAllFlashDeals().then(res => res.data.data),
  });

  const products = productsData?.docs || [];

  const createMutation = useMutation({
    mutationFn: (formData) => flashDealAPI.createFlashDeal(formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['flash-deals']);
      setIsCreateOpen(false);
      setFormData({ productId: '', discountPercentage: '', startDate: '', endDate: '', banner: null });
      setSelectedProduct(null);
      setProductSearch('');
      showSuccess('Flash deal created successfully');
    },
    onError: (err) => {
      showApiError(err, 'Failed to create flash deal');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }) => flashDealAPI.updateFlashDeal(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['flash-deals']);
      setIsEditOpen(false);
      setSelectedDeal(null);
      showSuccess('Flash deal updated successfully');
    },
    onError: (err) => {
      showApiError(err, 'Failed to update flash deal');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => flashDealAPI.deleteFlashDeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['flash-deals']);
      showSuccess('Flash deal deleted successfully');
    },
    onError: (err) => {
      showApiError(err, 'Failed to delete flash deal');
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formData.productId || !formData.discountPercentage || !formData.startDate || !formData.endDate) {
      showError('Please fill in all required fields: Product, Discount Percentage, Start Date, and End Date');
      return;
    }
    const formDataToSend = new FormData();
    formDataToSend.append('productId', formData.productId);
    formDataToSend.append('discountPercentage', formData.discountPercentage);
    formDataToSend.append('startDate', formData.startDate);
    formDataToSend.append('endDate', formData.endDate);
    if (formData.banner) formDataToSend.append('banner', formData.banner);
    createMutation.mutate(formDataToSend);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    if (formData.productId) formDataToSend.append('productId', formData.productId);
    if (formData.discountPercentage) formDataToSend.append('discountPercentage', formData.discountPercentage);
    if (formData.startDate) formDataToSend.append('startDate', formData.startDate);
    if (formData.endDate) formDataToSend.append('endDate', formData.endDate);
    if (formData.banner) formDataToSend.append('banner', formData.banner);
    updateMutation.mutate({ id: selectedDeal._id, formData: formDataToSend });
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setFormData({ ...formData, productId: product._id });
    setProductSearch(product.name);
    setIsProductDropdownOpen(false);
  };

  if (isLoading) return <Loading message="Loading flash deals..." />;
  if (isError) return <ErrorMessage message="Error loading flash deals" />;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Flash Deals Management</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">Manage flash sale deals</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Flash Deal
            </Button>
          </DialogTrigger>
          <DialogContent size="lg" className="bg-primary border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create Flash Deal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2 relative" ref={productDropdownRef}>
                <Label htmlFor="product" className="text-gray-300">Select Product *</Label>
                <div className="relative">
                  <div className="flex items-center">
                    <Search className="absolute left-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="product"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setIsProductDropdownOpen(true);
                        if (!e.target.value) {
                          setSelectedProduct(null);
                          setFormData({ ...formData, productId: '' });
                        }
                      }}
                      onFocus={() => setIsProductDropdownOpen(true)}
                      placeholder="Search products..."
                      className="bg-secondary border-gray-700 text-white pl-10 pr-10"
                    />
                    {productSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setProductSearch('');
                          setSelectedProduct(null);
                          setFormData({ ...formData, productId: '' });
                        }}
                        className="absolute right-3 text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {isProductDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-secondary border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {isLoadingProducts ? (
                        <div className="p-4 text-center text-gray-400">Loading products...</div>
                      ) : products.length > 0 ? (
                        products.map((product) => (
                          <div
                            key={product._id}
                            onClick={() => handleProductSelect(product)}
                            className="flex items-center gap-3 p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                          >
                            {product.images?.[0] && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <div className="text-white font-medium">{product.name}</div>
                              <div className="text-gray-400 text-sm">${product.price}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-400">No products found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountPercentage" className="text-gray-300">Discount Percentage (%) *</Label>
                <Input
                  id="discountPercentage"
                  type="number"
                  min="1"
                  max="90"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                  className="bg-secondary border-gray-700 text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-gray-300">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="bg-secondary border-gray-700 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-gray-300">End Date *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="bg-secondary border-gray-700 text-white"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="banner" className="text-gray-300">Banner Image</Label>
                <Input
                  id="banner"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, banner: e.target.files[0] })}
                  className="bg-secondary border-gray-700 text-white"
                />
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full bg-accent hover:bg-blue-700">
                {createMutation.isPending ? 'Creating...' : 'Create Flash Deal'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">All Flash Deals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                  <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Banner</TableHead>
                  <TableHead className="text-gray-300">Product</TableHead>
                  <TableHead className="text-gray-300">Discount</TableHead>
                  <TableHead className="text-gray-300">Start Date</TableHead>
                  <TableHead className="text-gray-300">End Date</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flashDeals?.deals?.length > 0 ? (
                  flashDeals.deals.map((deal) => {
                    const product = deal.productId;
                    const productName = typeof product === 'object' ? product?.name : 'N/A';
                    const productImage = typeof product === 'object' ? product?.images?.[0] : null;
                    const isActive = deal.isActive;
                    const now = new Date();
                    const isExpired = new Date(deal.endDate) < now;
                    const isUpcoming = new Date(deal.startDate) > now;
                    
                    return (
                      <TableRow key={deal._id} className="border-gray-700">
                        <TableCell>
                          {deal.banner || productImage ? (
                            <img 
                              src={deal.banner || productImage} 
                              alt={productName} 
                              className="w-16 h-16 object-cover rounded" 
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-700 rounded flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-white font-medium">{productName}</TableCell>
                        <TableCell className="text-white">{deal.discountPercentage ? `${deal.discountPercentage}%` : '-'}</TableCell>
                        <TableCell className="text-gray-400">
                          {deal.startDate ? new Date(deal.startDate).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {deal.endDate ? new Date(deal.endDate).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          {isExpired ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : isUpcoming ? (
                            <Badge className="bg-yellow-600">Upcoming</Badge>
                          ) : isActive ? (
                            <Badge className="bg-green-600">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedDeal(deal);
                              const product = deal.productId;
                              setSelectedProduct(typeof product === 'object' ? product : null);
                              setProductSearch(typeof product === 'object' ? product?.name || '' : '');
                              setFormData({
                                productId: typeof product === 'object' ? product?._id : '',
                                discountPercentage: deal.discountPercentage || '',
                                startDate: deal.startDate ? new Date(deal.startDate).toISOString().slice(0, 16) : '',
                                endDate: deal.endDate ? new Date(deal.endDate).toISOString().slice(0, 16) : '',
                                banner: null,
                              });
                              setIsEditOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                                deleteMutation.mutate(deal._id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                      No flash deals found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent size="lg" className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Flash Deal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2 relative" ref={productDropdownRef}>
              <Label htmlFor="edit-product" className="text-gray-300">Product</Label>
              <div className="relative">
                <div className="flex items-center">
                  <Search className="absolute left-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="edit-product"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setIsProductDropdownOpen(true);
                      if (!e.target.value) {
                        setSelectedProduct(null);
                        setFormData({ ...formData, productId: '' });
                      }
                    }}
                    onFocus={() => setIsProductDropdownOpen(true)}
                    placeholder="Search products..."
                    className="bg-secondary border-gray-700 text-white pl-10 pr-10"
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setProductSearch('');
                        setSelectedProduct(null);
                        setFormData({ ...formData, productId: '' });
                      }}
                      className="absolute right-3 text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {isProductDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-secondary border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {isLoadingProducts ? (
                      <div className="p-4 text-center text-gray-400">Loading products...</div>
                    ) : products.length > 0 ? (
                      products.map((product) => (
                        <div
                          key={product._id}
                          onClick={() => handleProductSelect(product)}
                          className="flex items-center gap-3 p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                        >
                          {product.images?.[0] && (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <div className="text-white font-medium">{product.name}</div>
                            <div className="text-gray-400 text-sm">${product.price}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-400">No products found</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-discountPercentage" className="text-gray-300">Discount Percentage (%)</Label>
              <Input
                id="edit-discountPercentage"
                type="number"
                min="1"
                max="90"
                value={formData.discountPercentage}
                onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                className="bg-secondary border-gray-700 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate" className="text-gray-300">Start Date</Label>
                <Input
                  id="edit-startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="bg-secondary border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate" className="text-gray-300">End Date</Label>
                <Input
                  id="edit-endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="bg-secondary border-gray-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-banner" className="text-gray-300">Update Banner</Label>
              <Input
                id="edit-banner"
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, banner: e.target.files[0] })}
                className="bg-secondary border-gray-700 text-white"
              />
            </div>
            <Button type="submit" disabled={updateMutation.isPending} className="w-full bg-accent hover:bg-blue-700">
              {updateMutation.isPending ? 'Updating...' : 'Update Flash Deal'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlashDealsManagement;

