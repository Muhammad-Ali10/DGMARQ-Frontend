import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { productAPI, categoryAPI, subcategoryAPI, platformAPI, regionAPI, typeAPI, genreAPI, modeAPI, deviceAPI, themeAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { ArrowLeft, Upload, X } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';

const FEATURED_FEE_MESSAGE = 'If you mark this product as Featured, an additional 10% fee will be charged.';

const ProductCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [images, setImages] = useState([]);
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
    productType: 'LICENSE_KEY', // LICENSE_KEY or ACCOUNT_BASED
    isFeatured: false,
    discount: '0',
    metaTitle: '',
    metaDescription: '',
  });

  // Fetch all required data with proper error handling
  const { data: categoriesData, isLoading: categoriesLoading, isError: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getCategories({ page: 1, limit: 1000 }).then(res => res.data.data),
    retry: 2,
  });
  const categories = categoriesData?.docs || categoriesData?.categories || categoriesData || [];

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

  const { data: platformsData, isLoading: platformsLoading } = useQuery({
    queryKey: ['platforms'],
    queryFn: () => platformAPI.getAllPlatforms({ page: 1, limit: 1000, isActive: true }).then(res => res.data.data),
    retry: 2,
  });
  const platforms = platformsData?.platforms || platformsData || [];

  const { data: regionsData, isLoading: regionsLoading } = useQuery({
    queryKey: ['regions'],
    queryFn: () => regionAPI.getRegions({ page: 1, limit: 1000 }).then(res => res.data.data),
    retry: 2,
  });
  const regions = regionsData?.docs || regionsData?.regions || regionsData || [];

  const { data: typesData, isLoading: typesLoading } = useQuery({
    queryKey: ['types'],
    queryFn: () => typeAPI.getAllTypes({ page: 1, limit: 1000 }).then(res => res.data.data),
    retry: 2,
  });
  const types = typesData?.docs || typesData?.types || typesData || [];

  const { data: genresData, isLoading: genresLoading } = useQuery({
    queryKey: ['genres'],
    queryFn: () => genreAPI.getGenres({ page: 1, limit: 1000 }).then(res => res.data.data),
    retry: 2,
  });
  const genres = genresData?.docs || genresData?.genres || genresData || [];

  const { data: modesData, isLoading: modesLoading } = useQuery({
    queryKey: ['modes'],
    queryFn: () => modeAPI.getModes({ page: 1, limit: 1000 }).then(res => res.data.data),
    retry: 2,
  });
  const modes = modesData?.docs || modesData?.modes || modesData || [];

  const { data: devicesData, isLoading: devicesLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => deviceAPI.getDevices({ page: 1, limit: 1000 }).then(res => res.data.data),
    retry: 2,
  });
  const devices = devicesData?.docs || devicesData?.devices || devicesData || [];

  const { data: themesData, isLoading: themesLoading } = useQuery({
    queryKey: ['themes'],
    queryFn: () => themeAPI.getThemes({ page: 1, limit: 1000 }).then(res => res.data.data),
    retry: 2,
  });
  const themes = themesData?.docs || themesData?.themes || themesData || [];

  const isLoadingData = categoriesLoading || subcategoriesLoading || platformsLoading || 
    regionsLoading || typesLoading || genresLoading || modesLoading || devicesLoading || themesLoading;

  const createMutation = useMutation({
    mutationFn: (formDataToSend) => productAPI.createProduct(formDataToSend),
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-products']);
      toast.success('Product created successfully');
      navigate('/seller/products');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create product');
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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.categoryId || !formData.name || !formData.slug || !formData.description || 
        !formData.price || !formData.stock || !formData.platform || !formData.region || 
        !formData.type || !formData.genre || !formData.mode || !formData.productType) {
      toast.warning('Please fill in all required fields');
      return;
    }

    // Validate price and stock are numbers
    if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      toast.warning('Price must be a positive number');
      return;
    }

    if (isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
      toast.warning('Stock must be a non-negative number');
      return;
    }

    const formDataToSend = new FormData();
    
    // Append all form fields
    Object.keys(formData).forEach(key => {
      if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
        formDataToSend.append(key, formData[key]);
      }
    });

    // Append images
    images.forEach((image) => {
      formDataToSend.append('images', image);
    });

    createMutation.mutate(formDataToSend);
  };

  // Subcategories are already filtered by categoryId from the API
  const filteredSubcategories = Array.isArray(subcategories) ? subcategories : [];

  if (isLoadingData) {
    return (
      <div className="space-y-6">
        <Loading message="Loading product creation form..." />
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className="space-y-6">
        <ErrorMessage message="Failed to load form data. Please refresh the page." />
      </div>
    );
  }

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
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Create Product</h1>
          <p className="text-gray-400 mt-1">Add a new product to your store</p>
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
                    placeholder="product-slug"
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

                <div className="space-y-2">
                  <Label htmlFor="productType" className="text-gray-300">Product Type *</Label>
                  <select
                    id="productType"
                    name="productType"
                    value={formData.productType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  >
                    <option value="LICENSE_KEY">License Key Product</option>
                    <option value="ACCOUNT_BASED">Account-based Product</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.productType === 'LICENSE_KEY' 
                      ? 'For products delivered as license keys (e.g., game keys, software licenses)'
                      : 'For products delivered as accounts (e.g., gaming accounts with email & password)'}
                  </p>
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

            {/* Images */}
            <Card className="bg-primary border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Product Images</CardTitle>
                <CardDescription className="text-gray-400">
                  Upload up to 5 images
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="images" className="text-gray-300">Images</Label>
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="bg-secondary border-gray-700 text-white"
                  />
                </div>
                {images.length > 0 && (
                  <div className="grid grid-cols-5 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                disabled={createMutation.isPending}
                className="flex-1 bg-accent hover:bg-blue-700"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Product'}
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

export default ProductCreate;

