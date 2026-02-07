import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trendingOfferAPI, productAPI } from '../../services/api';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Plus, Edit, Trash2, X, Search, Check } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import { showSuccess, showApiError } from '../../utils/toast';

const TrendingOffersManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    products: [],
    discountPercent: '',
    startTime: '',
    endTime: '',
  });
  const [productSearch, setProductSearch] = useState('');
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

  const { data: trendingOffers, isLoading, isError } = useQuery({
    queryKey: ['trending-offers'],
    queryFn: () => trendingOfferAPI.getAllTrendingOffers().then(res => res.data.data),
  });

  const products = productsData?.docs || [];

  const createMutation = useMutation({
    mutationFn: (formData) => trendingOfferAPI.createTrendingOffer(formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['trending-offers']);
      setIsCreateOpen(false);
      setFormData({ products: [], discountPercent: '', startTime: '', endTime: '' });
      setProductSearch('');
      showSuccess('Trending offer created successfully');
    },
    onError: (err) => {
      showApiError(err, 'Failed to create trending offer');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }) => trendingOfferAPI.updateTrendingOffer(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['trending-offers']);
      setIsEditOpen(false);
      setSelectedOffer(null);
      showSuccess('Trending offer updated successfully');
    },
    onError: (err) => {
      showApiError(err, 'Failed to update trending offer');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => trendingOfferAPI.deleteTrendingOffer(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['trending-offers']);
      setShowDeleteModal(false);
      setDeleteId(null);
      showSuccess('Trending offer deleted successfully');
    },
    onError: (err) => {
      showApiError(err, 'Failed to delete trending offer');
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (formData.products.length === 0 || !formData.discountPercent || !formData.startTime || !formData.endTime) {
      return;
    }

    const dataToSend = {
      products: formData.products.map(p => p._id || p),
      discountPercent: parseFloat(formData.discountPercent),
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
    };

    createMutation.mutate(dataToSend);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (formData.products.length === 0 || !formData.discountPercent || !formData.startTime || !formData.endTime) {
      return;
    }

    const dataToSend = {
      products: formData.products.map(p => p._id || p),
      discountPercent: parseFloat(formData.discountPercent),
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
    };

    updateMutation.mutate({ id: selectedOffer._id, formData: dataToSend });
  };

  const toggleProductSelection = (product) => {
    const isSelected = formData.products.some(p => (p._id || p) === (product._id || product));
    if (isSelected) {
      setFormData({
        ...formData,
        products: formData.products.filter(p => (p._id || p) !== (product._id || product)),
      });
    } else {
      setFormData({
        ...formData,
        products: [...formData.products, product],
      });
    }
    setProductSearch('');
    setIsProductDropdownOpen(false);
  };

  const removeProduct = (productId) => {
    setFormData({
      ...formData,
      products: formData.products.filter(p => (p._id || p) !== productId),
    });
  };

  const getStatusBadge = (offer) => {
    const now = new Date();
    const startTime = new Date(offer.startTime);
    const endTime = new Date(offer.endTime);

    if (now < startTime) {
      return <Badge className="bg-yellow-500">Scheduled</Badge>;
    } else if (now >= startTime && now <= endTime) {
      return <Badge className="bg-green-500">Active</Badge>;
    } else {
      return <Badge className="bg-gray-500">Expired</Badge>;
    }
  };

  if (isLoading) return <Loading message="Loading trending offers..." />;
  if (isError) return <ErrorMessage message="Error loading trending offers" />;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Trending Offers Management</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">Manage product-based trending offers</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Trending Offer
            </Button>
          </DialogTrigger>
          <DialogContent size="lg" className="bg-primary border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create Trending Offer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="products" className="text-gray-300">Select Products *</Label>
                <div className="relative" ref={productDropdownRef}>
                  <div className="flex items-center gap-2 flex-wrap min-h-[40px] p-2 border border-gray-700 rounded bg-secondary">
                    {formData.products.length > 0 ? (
                      formData.products.map((product) => (
                        <Badge key={product._id || product} className="bg-accent text-white flex items-center gap-1">
                          {product.name || 'Product'}
                          <button
                            type="button"
                            onClick={() => removeProduct(product._id || product)}
                            className="ml-1 hover:text-red-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No products selected</span>
                    )}
                  </div>
                  <div className="mt-2 relative">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setIsProductDropdownOpen(true);
                        }}
                        onFocus={() => setIsProductDropdownOpen(true)}
                        className="bg-secondary border-gray-700 text-white pl-8"
                      />
                    </div>
                    {isProductDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-secondary border border-gray-700 rounded shadow-lg max-h-60 overflow-y-auto">
                        {isLoadingProducts ? (
                          <div className="p-4 text-center text-gray-400">Loading...</div>
                        ) : products.length > 0 ? (
                          products.map((product) => {
                            const isSelected = formData.products.some(p => (p._id || p) === product._id);
                            return (
                              <div
                                key={product._id}
                                onClick={() => toggleProductSelection(product)}
                                className={`p-3 hover:bg-gray-700 cursor-pointer flex items-center justify-between ${
                                  isSelected ? 'bg-accent/20' : ''
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {product.images?.[0] && (
                                    <img
                                      src={product.images[0]}
                                      alt={product.name}
                                      className="w-10 h-10 object-cover rounded"
                                    />
                                  )}
                                  <div>
                                    <p className="text-white text-sm font-medium">{product.name}</p>
                                    <p className="text-gray-400 text-xs">${product.price}</p>
                                  </div>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-accent" />}
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-4 text-center text-gray-400">No products found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountPercent" className="text-gray-300">Discount Percentage (%) *</Label>
                <Input
                  id="discountPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                  className="bg-secondary border-gray-700 text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-gray-300">Start Date & Time *</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="bg-secondary border-gray-700 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-gray-300">End Date & Time *</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="bg-secondary border-gray-700 text-white"
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full bg-accent hover:bg-blue-700">
                {createMutation.isPending ? 'Creating...' : 'Create Trending Offer'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">All Trending Offers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Products</TableHead>
                  <TableHead className="text-gray-300">Discount</TableHead>
                  <TableHead className="text-gray-300">Start Time</TableHead>
                  <TableHead className="text-gray-300">End Time</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trendingOffers?.offers?.length > 0 ? (
                  trendingOffers.offers.map((offer) => (
                    <TableRow key={offer._id} className="border-gray-700">
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {offer.products?.slice(0, 3).map((product) => (
                            <Badge key={product._id} variant="outline" className="text-xs">
                              {product.name}
                            </Badge>
                          ))}
                          {offer.products?.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{offer.products.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-white font-medium">{offer.discountPercent}%</TableCell>
                      <TableCell className="text-gray-400">
                        {new Date(offer.startTime).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {new Date(offer.endTime).toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(offer)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedOffer(offer);
                              setFormData({
                                products: offer.products || [],
                                discountPercent: offer.discountPercent || '',
                                startTime: offer.startTime ? new Date(offer.startTime).toISOString().slice(0, 16) : '',
                                endTime: offer.endTime ? new Date(offer.endTime).toISOString().slice(0, 16) : '',
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
                              setDeleteId(offer._id);
                              setShowDeleteModal(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                      No trending offers found
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
            <DialogTitle className="text-white">Edit Trending Offer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-products" className="text-gray-300">Select Products *</Label>
              <div className="relative" ref={productDropdownRef}>
                <div className="flex items-center gap-2 flex-wrap min-h-[40px] p-2 border border-gray-700 rounded bg-secondary">
                  {formData.products.length > 0 ? (
                    formData.products.map((product) => (
                      <Badge key={product._id || product} className="bg-accent text-white flex items-center gap-1">
                        {product.name || 'Product'}
                        <button
                          type="button"
                          onClick={() => removeProduct(product._id || product)}
                          className="ml-1 hover:text-red-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No products selected</span>
                  )}
                </div>
                <div className="mt-2 relative">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setIsProductDropdownOpen(true);
                      }}
                      onFocus={() => setIsProductDropdownOpen(true)}
                      className="bg-secondary border-gray-700 text-white pl-8"
                    />
                  </div>
                  {isProductDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-secondary border border-gray-700 rounded shadow-lg max-h-60 overflow-y-auto">
                      {isLoadingProducts ? (
                        <div className="p-4 text-center text-gray-400">Loading...</div>
                      ) : products.length > 0 ? (
                        products.map((product) => {
                          const isSelected = formData.products.some(p => (p._id || p) === product._id);
                          return (
                            <div
                              key={product._id}
                              onClick={() => toggleProductSelection(product)}
                              className={`p-3 hover:bg-gray-700 cursor-pointer flex items-center justify-between ${
                                isSelected ? 'bg-accent/20' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {product.images?.[0] && (
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                )}
                                <div>
                                  <p className="text-white text-sm font-medium">{product.name}</p>
                                  <p className="text-gray-400 text-xs">${product.price}</p>
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-accent" />}
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-gray-400">No products found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-discountPercent" className="text-gray-300">Discount Percentage (%) *</Label>
              <Input
                id="edit-discountPercent"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.discountPercent}
                onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                className="bg-secondary border-gray-700 text-white"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startTime" className="text-gray-300">Start Date & Time *</Label>
                <Input
                  id="edit-startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="bg-secondary border-gray-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endTime" className="text-gray-300">End Date & Time *</Label>
                <Input
                  id="edit-endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="bg-secondary border-gray-700 text-white"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={updateMutation.isPending} className="w-full bg-accent hover:bg-blue-700">
              {updateMutation.isPending ? 'Updating...' : 'Update Trending Offer'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Delete Trending Offer"
        description="Are you sure you want to delete this trending offer? This action cannot be undone."
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

export default TrendingOffersManagement;

