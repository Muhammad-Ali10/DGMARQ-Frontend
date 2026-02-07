import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { upcomingReleaseAPI, productAPI } from '../../services/api';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { toast } from 'sonner';
import { Search, Check, Upload, Image as ImageIcon, Save } from 'lucide-react';

const UpcomingReleasesManagement = () => {
  const queryClient = useQueryClient();
  const [productSearch, setProductSearch] = useState({ 1: '', 2: '' });
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState({ 1: false, 2: false });
  const [selectedProducts, setSelectedProducts] = useState({ 1: null, 2: null });
  const [imageFiles, setImageFiles] = useState({ 1: null, 2: null });
  const productDropdownRefs = { 1: useRef(null), 2: useRef(null) };

  // Debounce product search
  const [debouncedSearch, setDebouncedSearch] = useState({ 1: '', 2: '' });
  
  useEffect(() => {
    const timers = {};
    [1, 2].forEach(slot => {
      timers[slot] = setTimeout(() => {
        setDebouncedSearch(prev => ({ ...prev, [slot]: productSearch[slot] }));
      }, 400);
    });
    return () => {
      Object.values(timers).forEach(timer => clearTimeout(timer));
    };
  }, [productSearch]);

  // Fetch config
  const { data: configData, isLoading, isError, error } = useQuery({
    queryKey: ['upcoming-releases-config'],
    queryFn: () => upcomingReleaseAPI.getUpcomingReleasesConfig().then(res => res.data.data),
  });

  // Initialize selected products from config
  useEffect(() => {
    if (configData?.slots) {
      const newSelected = { 1: null, 2: null };
      configData.slots.forEach(slot => {
        if (slot.product) {
          newSelected[slot.slotNumber] = slot.product;
        }
      });
      setSelectedProducts(newSelected);
    }
  }, [configData]);

  // Fetch products for dropdown
  const { data: productsData1, isLoading: isLoadingProducts1 } = useQuery({
    queryKey: ['products-search', debouncedSearch[1]],
    queryFn: () => productAPI.getProducts({ 
      search: debouncedSearch[1], 
      limit: 10,
      status: 'active'
    }).then(res => res.data.data),
    enabled: isProductDropdownOpen[1] || debouncedSearch[1].length > 0,
  });

  const { data: productsData2, isLoading: isLoadingProducts2 } = useQuery({
    queryKey: ['products-search', debouncedSearch[2]],
    queryFn: () => productAPI.getProducts({ 
      search: debouncedSearch[2], 
      limit: 10,
      status: 'active'
    }).then(res => res.data.data),
    enabled: isProductDropdownOpen[2] || debouncedSearch[2].length > 0,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      [1, 2].forEach(slot => {
        if (productDropdownRefs[slot].current && !productDropdownRefs[slot].current.contains(event.target)) {
          setIsProductDropdownOpen(prev => ({ ...prev, [slot]: false }));
        }
      });
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateSlotMutation = useMutation({
    mutationFn: ({ slotNumber, productId }) => upcomingReleaseAPI.updateSlot(slotNumber, { productId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['upcoming-releases-config']);
      queryClient.invalidateQueries(['upcoming-releases']);
      toast.success('Slot updated successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update slot');
    },
  });

  const updateSlotImageMutation = useMutation({
    mutationFn: ({ slotNumber, formData }) => upcomingReleaseAPI.updateSlotImage(slotNumber, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['upcoming-releases-config']);
      queryClient.invalidateQueries(['upcoming-releases']);
      toast.success('Image updated successfully');
      setImageFiles(prev => ({ ...prev, [slotNumber]: null }));
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update image');
    },
  });

  const handleProductSelect = (slotNumber, product) => {
    setSelectedProducts(prev => ({ ...prev, [slotNumber]: product }));
    setIsProductDropdownOpen(prev => ({ ...prev, [slotNumber]: false }));
    setProductSearch(prev => ({ ...prev, [slotNumber]: '' }));
  };

  const handleSaveProduct = (slotNumber) => {
    if (!selectedProducts[slotNumber]) {
      toast.error('Please select a product');
      return;
    }
    updateSlotMutation.mutate({
      slotNumber,
      productId: selectedProducts[slotNumber]._id,
    });
  };

  const handleImageUpload = (slotNumber, file) => {
    if (!file) return;
    setImageFiles(prev => ({ ...prev, [slotNumber]: file }));
  };

  const handleSaveImage = (slotNumber) => {
    if (!imageFiles[slotNumber]) {
      toast.error('Please select an image');
      return;
    }
    const formData = new FormData();
    formData.append('backgroundImage', imageFiles[slotNumber]);
    updateSlotImageMutation.mutate({ slotNumber, formData });
  };

  const getProductsForSlot = (slotNumber) => {
    return slotNumber === 1 ? (productsData1?.docs || []) : (productsData2?.docs || []);
  };

  const isLoadingProductsForSlot = (slotNumber) => {
    return slotNumber === 1 ? isLoadingProducts1 : isLoadingProducts2;
  };

  const getSlotData = (slotNumber) => {
    return configData?.slots?.find(s => s.slotNumber === slotNumber);
  };

  if (isLoading) return <Loading message="Loading upcoming releases configuration..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || "Error loading configuration"} />;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Upcoming Releases</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">Manage upcoming release slots for homepage</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(slotNumber => {
          const slotData = getSlotData(slotNumber);
          const products = getProductsForSlot(slotNumber);
          const isLoadingProducts = isLoadingProductsForSlot(slotNumber);
          const selectedProduct = selectedProducts[slotNumber] || slotData?.product;

          return (
            <Card key={slotNumber} className="bg-primary border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Slot {slotNumber}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product Selection */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Select Product *</Label>
                  <div className="relative" ref={productDropdownRefs[slotNumber]}>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Search products..."
                        value={productSearch[slotNumber]}
                        onChange={(e) => {
                          setProductSearch(prev => ({ ...prev, [slotNumber]: e.target.value }));
                          setIsProductDropdownOpen(prev => ({ ...prev, [slotNumber]: true }));
                        }}
                        onFocus={() => setIsProductDropdownOpen(prev => ({ ...prev, [slotNumber]: true }))}
                        className="bg-secondary border-gray-700 text-white pl-8"
                      />
                    </div>
                    {isProductDropdownOpen[slotNumber] && (
                      <div className="absolute z-50 w-full mt-1 bg-secondary border border-gray-700 rounded shadow-lg max-h-60 overflow-y-auto">
                        {isLoadingProducts ? (
                          <div className="p-4 text-center text-gray-400">Loading...</div>
                        ) : products.length > 0 ? (
                          products.map((product) => (
                            <div
                              key={product._id}
                              onClick={() => handleProductSelect(slotNumber, product)}
                              className="p-3 hover:bg-gray-700 cursor-pointer flex items-center justify-between"
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
                              {selectedProduct?._id === product._id && <Check className="w-4 h-4 text-accent" />}
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-400">No products found</div>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedProduct && (
                    <div className="mt-2 p-3 bg-secondary rounded border border-gray-700">
                      <div className="flex items-center gap-3">
                        {selectedProduct.images?.[0] && (
                          <img
                            src={selectedProduct.images[0]}
                            alt={selectedProduct.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="text-white text-sm font-medium">{selectedProduct.name}</p>
                          <p className="text-gray-400 text-xs">${selectedProduct.price}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={() => handleSaveProduct(slotNumber)}
                    disabled={!selectedProduct || updateSlotMutation.isPending}
                    className="w-full bg-accent hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateSlotMutation.isPending ? 'Saving...' : 'Save Product'}
                  </Button>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Background Image *</Label>
                  {slotData?.backgroundImageUrl && (
                    <div className="mb-2">
                      <img
                        src={slotData.backgroundImageUrl}
                        alt={`Slot ${slotNumber} background`}
                        className="w-full h-48 object-cover rounded border border-gray-700"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(slotNumber, e.target.files[0])}
                      className="bg-secondary border-gray-700 text-white"
                    />
                    {imageFiles[slotNumber] && (
                      <Button
                        onClick={() => handleSaveImage(slotNumber)}
                        disabled={updateSlotImageMutation.isPending}
                        className="bg-accent hover:bg-blue-700"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {updateSlotImageMutation.isPending ? 'Uploading...' : 'Upload'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingReleasesManagement;

