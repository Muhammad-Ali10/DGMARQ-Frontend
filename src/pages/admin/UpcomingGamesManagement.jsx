import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { upcomingGamesAPI, productAPI } from '../../services/api';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { Search, Check, X, Plus, Trash2, ArrowUp, ArrowDown, Save } from 'lucide-react';

const UpcomingGamesManagement = () => {
  const queryClient = useQueryClient();
  const [productSearch, setProductSearch] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [tempSelectedProducts, setTempSelectedProducts] = useState([]);
  const productDropdownRef = useRef(null);

  // Debounce product search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(productSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // Fetch config
  const { data: configData, isLoading, isError, error } = useQuery({
    queryKey: ['upcoming-games-config'],
    queryFn: () => upcomingGamesAPI.getUpcomingGamesConfig().then(res => res.data.data),
  });

  // Fetch products for dropdown
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products-search-upcoming', debouncedSearch],
    queryFn: () => productAPI.getProducts({ 
      search: debouncedSearch, 
      limit: 10,
      status: 'active'
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

  const addProductsMutation = useMutation({
    mutationFn: (data) => upcomingGamesAPI.addProducts(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['upcoming-games-config']);
      queryClient.invalidateQueries(['upcoming-games']);
      toast.success('Products added successfully');
      setProductSearch('');
      setIsProductDropdownOpen(false);
      setTempSelectedProducts([]); // Clear temp selected products after successful add
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to add products');
    },
  });

  const removeProductsMutation = useMutation({
    mutationFn: (data) => upcomingGamesAPI.removeProducts(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['upcoming-games-config']);
      queryClient.invalidateQueries(['upcoming-games']);
      toast.success('Products removed successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to remove products');
    },
  });

  const reorderProductsMutation = useMutation({
    mutationFn: (data) => upcomingGamesAPI.reorderProducts(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['upcoming-games-config']);
      queryClient.invalidateQueries(['upcoming-games']);
      toast.success('Order updated successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update order');
    },
  });

  const updateUpcomingGamesMutation = useMutation({
    mutationFn: (data) => upcomingGamesAPI.updateUpcomingGames(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['upcoming-games-config']);
      queryClient.invalidateQueries(['upcoming-games']);
      toast.success('Upcoming games updated successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update upcoming games');
    },
  });

  const handleProductSelect = (product) => {
    // Check if product is already in config or temp selection
    const isSelected = tempSelectedProducts.some(
      item => item.productId === product._id || item.productId.toString() === product._id.toString()
    ) || configData?.products?.some(
      p => p.productId === product._id || p.productId.toString() === product._id.toString()
    );
    
    if (isSelected) {
      toast.info('Product is already in the list');
      return;
    }

    // Add to temp selected products
    setTempSelectedProducts(prev => [...prev, {
      productId: product._id,
      product: product,
    }]);
    setProductSearch('');
    setIsProductDropdownOpen(false);
  };

  const handleRemoveTempProduct = (productId) => {
    setTempSelectedProducts(prev => prev.filter(item => 
      item.productId !== productId && item.productId.toString() !== productId.toString()
    ));
  };


  const handleSaveAll = () => {
    // Save current order of products from configData
    if (!configData?.products || configData.products.length === 0) {
      toast.info('No products to save');
      return;
    }
    const productIds = configData.products
      .sort((a, b) => a.order - b.order)
      .map(item => item.productId);
    updateUpcomingGamesMutation.mutate({ productIds });
  };

  const handleAddSelected = () => {
    if (tempSelectedProducts.length === 0) {
      toast.info('Please select products to add');
      return;
    }

    const newProductIds = tempSelectedProducts.map(item => item.productId);
    addProductsMutation.mutate({ productIds: newProductIds });
  };

  const handleRemoveSelected = (productIds) => {
    removeProductsMutation.mutate({ productIds });
  };

  const products = productsData?.docs || [];

  if (isLoading) return <Loading message="Loading upcoming games configuration..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || "Error loading configuration"} />;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Upcoming Games</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">Manage upcoming games displayed on the homepage (6 products shown)</p>
        </div>
        <Button
          onClick={handleSaveAll}
          disabled={updateUpcomingGamesMutation.isPending || !configData?.products || configData.products.length === 0}
          className="bg-accent hover:bg-blue-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {updateUpcomingGamesMutation.isPending ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      {/* Add Products Section */}
      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Add Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Search and Select Products</Label>
            <div className="relative" ref={productDropdownRef}>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search products by name..."
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
                      const isSelected = tempSelectedProducts.some(
                        item => item.productId === product._id || item.productId.toString() === product._id.toString()
                      ) || configData?.products?.some(
                        p => p.productId === product._id || p.productId.toString() === product._id.toString()
                      );
                      
                      return (
                        <div
                          key={product._id}
                          onClick={() => handleProductSelect(product)}
                          className={`p-3 hover:bg-gray-700 cursor-pointer flex items-center justify-between ${
                            isSelected ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {product.images?.[0] && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded-md"
                              />
                            )}
                            <div>
                              <p className="text-white text-sm font-medium">{product.name}</p>
                              <p className="text-gray-400 text-xs">
                                ${product.price} • {product.platform?.name || 'Digital Product'}
                              </p>
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

          {tempSelectedProducts.length > 0 && (
            <div className="mt-4 p-3 bg-secondary rounded border border-gray-700">
              <p className="text-gray-300 text-sm mb-2">
                {tempSelectedProducts.length} product(s) selected (click "Add Selected Products" to save)
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {tempSelectedProducts.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-md"
                  >
                    <span className="text-white text-sm">{item.product?.name || 'Unknown'}</span>
                    <button
                      onClick={() => handleRemoveTempProduct(item.productId)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                onClick={handleAddSelected}
                disabled={addProductsMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {addProductsMutation.isPending ? 'Adding...' : 'Add Selected Products'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Products List */}
      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">
            Current Upcoming Games ({configData?.products?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!configData?.products || configData.products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No upcoming games configured yet. Add products above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {configData.products.map((item, index) => {
                const product = item.product;
                if (!product) return null;

                return (
                  <div
                    key={item.productId}
                    className="flex items-center gap-4 p-4 bg-secondary rounded border border-gray-700"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-gray-400 text-sm font-medium w-8">#{index + 1}</span>
                      {product.images?.[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-white font-medium">{product.name}</p>
                        <p className="text-gray-400 text-sm">
                          ${product.price} • {product.platform?.name || 'Digital Product'} •{' '}
                          {product.region?.name || 'GLOBAL'}
                        </p>
                        {product.status !== 'active' && product.status !== 'approved' && (
                          <Badge variant="destructive" className="mt-1">
                            Status: {product.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => {
                          if (index === 0) return;
                          // Reorder in configData
                          const newProducts = [...configData.products];
                          [newProducts[index - 1], newProducts[index]] = [newProducts[index], newProducts[index - 1]];
                          // Update orders
                          newProducts.forEach((item, idx) => {
                            item.order = idx;
                          });
                          // Save reorder
                          const productIds = newProducts.map(item => item.productId);
                          reorderProductsMutation.mutate({ productIds });
                        }}
                        disabled={index === 0 || reorderProductsMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => {
                          if (index === configData.products.length - 1) return;
                          // Reorder in configData
                          const newProducts = [...configData.products];
                          [newProducts[index], newProducts[index + 1]] = [newProducts[index + 1], newProducts[index]];
                          // Update orders
                          newProducts.forEach((item, idx) => {
                            item.order = idx;
                          });
                          // Save reorder
                          const productIds = newProducts.map(item => item.productId);
                          reorderProductsMutation.mutate({ productIds });
                        }}
                        disabled={index === configData.products.length - 1 || reorderProductsMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleRemoveSelected([item.productId])}
                        disabled={removeProductsMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Note */}
      <Card className="bg-blue-900/20 border-blue-700">
        <CardContent className="pt-6">
          <p className="text-blue-300 text-sm">
            <strong>Note:</strong> Only the first 6 products will be displayed on the homepage.
            Use the arrow buttons to reorder products. Only products with status "active" or "approved"
            will be displayed on the homepage.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpcomingGamesManagement;
