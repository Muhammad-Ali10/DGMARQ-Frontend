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
  });

  // Fetch product data
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productAPI.getProductById(id).then(res => res.data.data),
    enabled: !!id,
  });

  // Fetch all required data
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getCategories({ page: 1, limit: 1000 }).then(res => res.data.data),
  });
  const categories = categoriesData?.docs || categoriesData?.categories || [];

  // Fetch subcategories by categoryId when category is selected
  const { data: subcategoriesData, isLoading: subcategoriesLoading } = useQuery({
    queryKey: ['subcategories', formData.categoryId],
    queryFn: () => {
      if (!formData.categoryId) return Promise.resolve({ docs: [] });
      return subcategoryAPI.getSubcategoriesByCategoryId(formData.categoryId, { page: 1, limit: 1000 })
        .then(res => res.data.data);
    },
    enabled: !!formData.categoryId,
    retry: 2,
  });
  const subcategories = subcategoriesData?.docs || subcategoriesData?.subcategories || subcategoriesData || [];

  const { data: platformsData } = useQuery({
    queryKey: ['platforms'],
    queryFn: () => platformAPI.getAllPlatforms({ page: 1, limit: 1000, isActive: true }).then(res => res.data.data),
  });
  const platforms = platformsData?.platforms || platformsData || [];

  const { data: regionsData } = useQuery({
    queryKey: ['regions'],
    queryFn: () => regionAPI.getRegions({ page: 1, limit: 1000 }).then(res => res.data.data),
  });
  const regions = regionsData?.docs || regionsData?.regions || regionsData || [];

  const { data: typesData } = useQuery({
    queryKey: ['types'],
    queryFn: () => typeAPI.getAllTypes({ page: 1, limit: 1000 }).then(res => res.data.data),
  });
  const types = typesData?.docs || typesData?.types || typesData || [];

  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: () => genreAPI.getGenres({ page: 1, limit: 1000 }).then(res => res.data.data),
  });
  const genres = genresData?.docs || genresData?.genres || genresData || [];

  const { data: modesData } = useQuery({
    queryKey: ['modes'],
    queryFn: () => modeAPI.getModes({ page: 1, limit: 1000 }).then(res => res.data.data),
  });
  const modes = modesData?.docs || modesData?.modes || modesData || [];

  const { data: devicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: () => deviceAPI.getDevices({ page: 1, limit: 1000 }).then(res => res.data.data),
  });
  const devices = devicesData?.docs || devicesData?.devices || devicesData || [];

  const { data: themesData } = useQuery({
    queryKey: ['themes'],
    queryFn: () => themeAPI.getThemes({ page: 1, limit: 1000 }).then(res => res.data.data),
  });
  const themes = themesData?.docs || themesData?.themes || themesData || [];

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
      });
    }
  }, [product]);

  const updateMutation = useMutation({
    mutationFn: (data) => productAPI.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-products']);
      queryClient.invalidateQueries(['product', id]);
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

    // Prepare update data (only send fields that have values)
    const updateData = {};
    Object.keys(formData).forEach(key => {
      if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
        updateData[key] = formData[key];
      }
    });

    updateMutation.mutate(updateData);
  };

  // Subcategories are already filtered by categoryId from the API
  const filteredSubcategories = Array.isArray(subcategories) ? subcategories : [];

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
                    <Label htmlFor="categoryId" className="text-gray-300">Category *</Label>
                    <select
                      id="categoryId"
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-accent"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subCategoryId" className="text-gray-300">Subcategory</Label>
                    <select
                      id="subCategoryId"
                      name="subCategoryId"
                      value={formData.subCategoryId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-accent"
                      disabled={!formData.categoryId || subcategoriesLoading}
                    >
                      <option value="">{subcategoriesLoading ? 'Loading...' : formData.categoryId ? 'Select Subcategory' : 'Select Category First'}</option>
                      {filteredSubcategories.map((sub) => (
                        <option key={sub._id} value={sub._id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform" className="text-gray-300">Platform *</Label>
                    <select
                      id="platform"
                      name="platform"
                      value={formData.platform}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-accent"
                      required
                    >
                      <option value="">Select Platform</option>
                      {Array.isArray(platforms) && platforms.map((p) => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region" className="text-gray-300">Region *</Label>
                    <select
                      id="region"
                      name="region"
                      value={formData.region}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-accent"
                      required
                    >
                      <option value="">Select Region</option>
                      {Array.isArray(regions) && regions.map((r) => (
                        <option key={r._id} value={r._id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-gray-300">Type *</Label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-accent"
                      required
                    >
                      <option value="">Select Type</option>
                      {Array.isArray(types) && types.map((t) => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genre" className="text-gray-300">Genre *</Label>
                    <select
                      id="genre"
                      name="genre"
                      value={formData.genre}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-accent"
                      required
                    >
                      <option value="">Select Genre</option>
                      {Array.isArray(genres) && genres.map((g) => (
                        <option key={g._id} value={g._id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mode" className="text-gray-300">Mode *</Label>
                    <select
                      id="mode"
                      name="mode"
                      value={formData.mode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-accent"
                      required
                    >
                      <option value="">Select Mode</option>
                      {Array.isArray(modes) && modes.map((m) => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="device" className="text-gray-300">Device</Label>
                    <select
                      id="device"
                      name="device"
                      value={formData.device}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="">Select Device</option>
                      {Array.isArray(devices) && devices.map((d) => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme" className="text-gray-300">Theme</Label>
                  <select
                    id="theme"
                    name="theme"
                    value={formData.theme}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select Theme</option>
                    {Array.isArray(themes) && themes.map((t) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
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

