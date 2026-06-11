import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { productAPI, categoryAPI, subcategoryAPI, platformAPI, regionAPI, typeAPI, genreAPI, modeAPI, deviceAPI, themeAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { ArrowLeft } from 'lucide-react';
import { showSuccess, showError, showApiError } from '../../utils/toast';
import ConfirmationModal from '../../components/ConfirmationModal';
import TaxonomySelect from '../../components/seller/TaxonomySelect';

const FEATURED_FEE_MESSAGE = 'If you mark this product as Featured, an additional 10% fee will be charged.';

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showFeaturedConfirmModal, setShowFeaturedConfirmModal] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    subCategoryId: '',
    name: '',
    slug: '',
    description: '',
    price: '',
    stock: '',
    platform: '',
    region: '',
    type: '',
    genre: '',
    mode: '',
    device: '',
    theme: '',
    isFeatured: false,
    discount: '0',
    metaTitle: '',
    metaDescription: '',
    isPreorder: false,
    preorderReleaseDate: '',
  });

  // Fetch product data
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productAPI.getProductById(id).then(res => res.data.data),
    enabled: !!id,
  });

  // Helper: build a {_id, name} option from a possibly-populated product field
  // so the SearchableSelect can render the existing value's label even before
  // (or without) it appearing in the searched/paged result set.
  const toSelectedOption = (field) => {
    if (!field) return null;
    if (typeof field === 'object' && field._id) {
      return { _id: field._id, name: field.name };
    }
    return null;
  };

  // Populate form when product loads
  useEffect(() => {
    if (product) {
      setFormData({
        categoryId: product.categoryId?._id || product.categoryId || '',
        subCategoryId: product.subCategoryId?._id || product.subCategoryId || '',
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        price: product.price || '',
        stock: product.stock || '',
        platform: product.platform?._id || product.platform || '',
        region: product.region?._id || product.region || '',
        type: product.type?._id || product.type || '',
        genre: product.genre?._id || product.genre || '',
        mode: product.mode?._id || product.mode || '',
        device: product.device?._id || product.device || '',
        theme: product.theme?._id || product.theme || '',
        isFeatured: product.isFeatured || false,
        discount: product.discount?.toString() || '0',
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || '',
        isPreorder: product.isPreorder || false,
        preorderReleaseDate: product.preorderReleaseDate
          ? new Date(product.preorderReleaseDate).toISOString().slice(0, 10)
          : '',
      });
    }
  }, [product]);

  const updateMutation = useMutation({
    mutationFn: (data) => productAPI.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      showSuccess('Product updated successfully');
      navigate('/seller/products');
    },
    onError: (error) => {
      showApiError(error, 'Failed to update product');
    },
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
      // Reset subcategory when category changes
      if (name === 'categoryId') {
        newData.subCategoryId = '';
      }
      return newData;
    });
  };

  // Setter for the searchable taxonomy dropdowns (value-only, no DOM event).
  const handleSelectChange = (name, value) => {
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'categoryId') {
        newData.subCategoryId = '';
      }
      return newData;
    });
  };

  /** When seller tries to check Featured: show confirmation modal. Only set isFeatured on Confirm. */
  const handleFeaturedCheckboxChange = (e) => {
    if (e.target.name !== 'isFeatured') {
      handleInputChange(e);
      return;
    }
    if (!formData.isFeatured) {
      setShowFeaturedConfirmModal(true);
      return;
    }
    handleInputChange(e);
  };

  const handleFeaturedConfirm = () => {
    setFormData((prev) => ({ ...prev, isFeatured: true }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.categoryId || !formData.name || !formData.slug || !formData.description || 
        !formData.price || !formData.stock || !formData.platform || !formData.region || 
        !formData.type || !formData.genre || !formData.mode) {
      showError('Please fill in all required fields');
      return;
    }

    if (formData.isPreorder && !formData.preorderReleaseDate) {
      showError('Please set a release date for the pre-order');
      return;
    }

    // Prepare update data (only send fields that have values)
    const updateData = {};
    Object.keys(formData).forEach(key => {
      if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
        updateData[key] = formData[key];
      }
    });

    updateMutation.mutate(updateData);
  };

  if (productLoading) return <Loading message="Loading product..." />;
  if (!product) return <ErrorMessage message="Product not found" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/seller/products')}
          className="border-gray-700 text-gray-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Edit Product</h1>
          <p className="text-gray-400 mt-1">Update product information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="bg-primary border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Basic Information</CardTitle>
                <CardDescription className="text-gray-400">
                  Essential product details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">Product Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="bg-secondary border-gray-700 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-gray-300">Slug *</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="bg-secondary border-gray-700 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-300">Description *</Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
                    rows={6}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-gray-300">Price ($) *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="bg-secondary border-gray-700 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock" className="text-gray-300">Stock *</Label>
                    <Input
                      id="stock"
                      name="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={handleInputChange}
                      className="bg-secondary border-gray-700 text-white"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Categories & Classifications */}
            <Card className="bg-primary border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Categories & Classifications</CardTitle>
                <CardDescription className="text-gray-400">
                  Organize your product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Category *</Label>
                    <TaxonomySelect
                      value={formData.categoryId}
                      onChange={(val) => handleSelectChange('categoryId', val)}
                      queryKey={['edit-categories']}
                      fetcher={(params) => categoryAPI.getCategories(params).then((res) => res.data.data)}
                      extractList={(data) => data?.docs || data?.categories || []}
                      selectedOption={toSelectedOption(product?.categoryId)}
                      placeholder="Select Category"
                      searchPlaceholder="Search categories..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Subcategory</Label>
                    <TaxonomySelect
                      value={formData.subCategoryId}
                      onChange={(val) => handleSelectChange('subCategoryId', val)}
                      queryKey={['edit-subcategories', formData.categoryId]}
                      fetcher={(params) =>
                        subcategoryAPI
                          .getSubcategoriesByCategoryId(formData.categoryId, params)
                          .then((res) => res.data.data)
                      }
                      extractList={(data) => data?.docs || data?.subcategories || []}
                      selectedOption={toSelectedOption(product?.subCategoryId)}
                      enabled={!!formData.categoryId}
                      disabled={!formData.categoryId}
                      placeholder={formData.categoryId ? 'Select Subcategory' : 'Select Category First'}
                      searchPlaceholder="Search subcategories..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Platform *</Label>
                    {/* Platform endpoint has no server `search` param -> load a sane
                        limit (100) and use SearchableSelect's client-side filter. */}
                    <TaxonomySelect
                      value={formData.platform}
                      onChange={(val) => handleSelectChange('platform', val)}
                      queryKey={['edit-platforms']}
                      fetcher={(params) =>
                        platformAPI
                          .getAllPlatforms({ ...params, isActive: true })
                          .then((res) => res.data.data)
                      }
                      extractList={(data) => data?.platforms || data?.docs || []}
                      selectedOption={toSelectedOption(product?.platform)}
                      serverSearch={false}
                      limit={100}
                      placeholder="Select Platform"
                      searchPlaceholder="Search platforms..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Region *</Label>
                    <TaxonomySelect
                      value={formData.region}
                      onChange={(val) => handleSelectChange('region', val)}
                      queryKey={['edit-regions']}
                      fetcher={(params) => regionAPI.getRegions(params).then((res) => res.data.data)}
                      extractList={(data) => data?.docs || data?.regions || []}
                      selectedOption={toSelectedOption(product?.region)}
                      placeholder="Select Region"
                      searchPlaceholder="Search regions..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Type *</Label>
                    <TaxonomySelect
                      value={formData.type}
                      onChange={(val) => handleSelectChange('type', val)}
                      queryKey={['edit-types']}
                      fetcher={(params) => typeAPI.getAllTypes(params).then((res) => res.data.data)}
                      extractList={(data) => data?.docs || data?.types || []}
                      selectedOption={toSelectedOption(product?.type)}
                      placeholder="Select Type"
                      searchPlaceholder="Search types..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Genre *</Label>
                    <TaxonomySelect
                      value={formData.genre}
                      onChange={(val) => handleSelectChange('genre', val)}
                      queryKey={['edit-genres']}
                      fetcher={(params) => genreAPI.getGenres(params).then((res) => res.data.data)}
                      extractList={(data) => data?.docs || data?.genres || []}
                      selectedOption={toSelectedOption(product?.genre)}
                      placeholder="Select Genre"
                      searchPlaceholder="Search genres..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Mode *</Label>
                    <TaxonomySelect
                      value={formData.mode}
                      onChange={(val) => handleSelectChange('mode', val)}
                      queryKey={['edit-modes']}
                      fetcher={(params) => modeAPI.getModes(params).then((res) => res.data.data)}
                      extractList={(data) => data?.docs || data?.modes || []}
                      selectedOption={toSelectedOption(product?.mode)}
                      placeholder="Select Mode"
                      searchPlaceholder="Search modes..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Device</Label>
                    <TaxonomySelect
                      value={formData.device}
                      onChange={(val) => handleSelectChange('device', val)}
                      queryKey={['edit-devices']}
                      fetcher={(params) => deviceAPI.getDevices(params).then((res) => res.data.data)}
                      extractList={(data) => data?.docs || data?.devices || []}
                      selectedOption={toSelectedOption(product?.device)}
                      placeholder="Select Device"
                      searchPlaceholder="Search devices..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Theme</Label>
                  <TaxonomySelect
                    value={formData.theme}
                    onChange={(val) => handleSelectChange('theme', val)}
                    queryKey={['edit-themes']}
                    fetcher={(params) => themeAPI.getThemes(params).then((res) => res.data.data)}
                    extractList={(data) => data?.docs || data?.themes || []}
                    selectedOption={toSelectedOption(product?.theme)}
                    placeholder="Select Theme"
                    searchPlaceholder="Search themes..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* SEO */}
            <Card className="bg-primary border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">SEO Settings</CardTitle>
                <CardDescription className="text-gray-400">
                  Optional SEO fields to help your product rank on Google
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="metaTitle" className="text-gray-300">Meta Title</Label>
                    <div className="group relative">
                      <span className="text-gray-500 text-xs cursor-help">ℹ️</span>
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 z-10">
                        This appears as the title in Google search results. Recommended: 50-60 characters.
                      </div>
                    </div>
                  </div>
                  <Input
                    id="metaTitle"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleInputChange}
                    maxLength={60}
                    placeholder="e.g., Game Name - Platform | Category"
                    className="bg-secondary border-gray-700 text-white"
                  />
                  <div className="flex justify-end">
                    <p className={`text-xs ${formData.metaTitle.length > 60 ? 'text-red-400' : formData.metaTitle.length > 50 ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {formData.metaTitle.length}/60
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="metaDescription" className="text-gray-300">Meta Description</Label>
                    <div className="group relative">
                      <span className="text-gray-500 text-xs cursor-help">ℹ️</span>
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 z-10">
                        This appears as the description in Google search results. Recommended: 120-160 characters.
                      </div>
                    </div>
                  </div>
                  <textarea
                    id="metaDescription"
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleInputChange}
                    maxLength={160}
                    placeholder="e.g., Buy Game Name at the best price. Instant delivery, secure purchase, and 24/7 support."
                    className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <p className={`text-xs ${formData.metaDescription.length > 160 ? 'text-red-400' : formData.metaDescription.length > 120 ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {formData.metaDescription.length}/160
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pre-order */}
            <Card className="bg-primary border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Pre-order</CardTitle>
                <CardDescription className="text-gray-400">
                  List this product before its release date. When the date arrives, buyers who wishlisted it are automatically notified that it's available.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPreorder"
                    name="isPreorder"
                    checked={formData.isPreorder}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-700 bg-secondary text-accent focus:ring-accent cursor-pointer"
                  />
                  <Label htmlFor="isPreorder" className="text-gray-300 cursor-pointer">
                    This is a pre-order
                  </Label>
                </div>
                {formData.isPreorder && (
                  <div className="space-y-2">
                    <Label htmlFor="preorderReleaseDate" className="text-gray-300">Release date *</Label>
                    <Input
                      type="date"
                      id="preorderReleaseDate"
                      name="preorderReleaseDate"
                      value={formData.preorderReleaseDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().slice(0, 10)}
                      className="bg-secondary border-gray-700 text-white"
                    />
                    <p className="text-xs text-gray-400">
                      Wishlist watchers are notified automatically when this date arrives.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-primary border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="isFeatured"
                    className="text-gray-300 cursor-pointer"
                    onClick={(e) => {
                      if (!formData.isFeatured) {
                        e.preventDefault();
                        setShowFeaturedConfirmModal(true);
                      }
                    }}
                  >
                    Featured Product
                  </Label>
                  <input
                    id="isFeatured"
                    name="isFeatured"
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={handleFeaturedCheckboxChange}
                    className="w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount" className="text-gray-300">Discount (%)</Label>
                  <Input
                    id="discount"
                    name="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={handleInputChange}
                    className="bg-secondary border-gray-700 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/seller/products')}
                className="flex-1 border-gray-700 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1 bg-accent hover:bg-blue-700"
              >
                {updateMutation.isPending ? 'Updating...' : 'Update Product'}
              </Button>
            </div>
          </div>
        </div>
      </form>

      <ConfirmationModal
        open={showFeaturedConfirmModal}
        onOpenChange={setShowFeaturedConfirmModal}
        title="Featured Product"
        description={FEATURED_FEE_MESSAGE}
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleFeaturedConfirm}
      />
    </div>
  );
};

export default ProductEdit;

