import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { homepageSliderAPI, productAPI } from '@services/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@components/ui/dialog';
import { Badge } from '@components/ui/badge';
import TargetPicker from '@components/common/TargetPicker';
import { Loading, ErrorMessage } from '@components/ui/loading';
import { TableEmptyRow } from '@components/common/EmptyState';
import { Plus, Edit, Trash2, Power, Image as ImageIcon } from 'lucide-react';
import ConfirmationModal from '@components/common/ConfirmationModal';
import { showSuccess, showApiError } from '@utils/toast';
import SafeImage from '@components/ui/safe-image';
import useCurrency from '@hooks/useCurrency';
import { useDebounce } from '@hooks/useDebounce';
import { Pagination } from '@components/common/Pagination';

const PAGE_SIZE = 100;

const slidePosition = (slider) => (slider.slideIndex !== undefined ? slider.slideIndex : slider.order || 0);

const SLIDE_POSITIONS = [
  { value: 0, label: 'Position 1 - Left Small' },
  { value: 1, label: 'Position 2 - Left Medium' },
  { value: 2, label: 'Position 3 - Center Featured' },
  { value: 3, label: 'Position 4 - Right Medium' },
  { value: 4, label: 'Position 5 - Right Small' },
];

const HomepageSlidersManagement = () => {
  const { format: formatMoney } = useCurrency();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedSlider, setSelectedSlider] = useState(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const debouncedProductSearch = useDebounce(productSearchQuery.trim(), 350);
  const [page, setPage] = useState(1);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    productId: '',
    target: null,
    slideIndex: 0,
    image: null,
  });
  const queryClient = useQueryClient();

  const { data: sliders, isLoading, isError } = useQuery({
    queryKey: ['homepage-sliders', 'admin', page],
    queryFn: () => homepageSliderAPI.getAllHomepageSliders({ page, limit: PAGE_SIZE }).then(res => res.data.data),
    placeholderData: keepPreviousData,
  });

  const sortedSliders = [...(sliders?.sliders || [])].sort((a, b) => slidePosition(a) - slidePosition(b));

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['slider-products-search', debouncedProductSearch],
    queryFn: async () => {
      const response = await productAPI.getProducts({
        search: debouncedProductSearch,
        status: 'active',
        limit: 50,
      });
      return response.data.data || { docs: [] };
    },
    enabled: debouncedProductSearch.length > 0,
  });

  const products = productsData?.docs || [];

  const createMutation = useMutation({
    mutationFn: (formData) => homepageSliderAPI.createHomepageSlider(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage-sliders'] });
      setIsCreateOpen(false);
      setFormData({ title: '', productId: '', target: null, slideIndex: 0, image: null });
      setProductSearchQuery('');
      showSuccess('Slide created successfully');
    },
    onError: (err) => {
      showApiError(err, 'Failed to create slide');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (slider) => {
      const body = new FormData();
      body.append('isActive', String(!slider.isActive));
      return homepageSliderAPI.updateHomepageSlider(slider._id, body);
    },
    onSuccess: (_, slider) => {
      queryClient.invalidateQueries({ queryKey: ['homepage-sliders'] });
      showSuccess(slider.isActive ? 'Slide hidden from the homepage' : 'Slide shown on the homepage');
    },
    onError: (err) => {
      showApiError(err, 'Failed to update slide status');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }) => homepageSliderAPI.updateHomepageSlider(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage-sliders'] });
      setIsEditOpen(false);
      setSelectedSlider(null);
      setProductSearchQuery('');
      showSuccess('Homepage slider updated successfully');
    },
    onError: (err) => {
      showApiError(err, 'Failed to update homepage slider');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => homepageSliderAPI.deleteHomepageSlider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage-sliders'] });
      setShowDeleteModal(false);
      setDeleteId(null);
      showSuccess('Homepage slider deleted successfully');
    },
    onError: (err) => {
      showApiError(err, 'Failed to delete homepage slider');
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    if (formData.productId) {
      formDataToSend.append('productId', formData.productId);
    }
    formDataToSend.append('target', formData.target ? JSON.stringify(formData.target) : '');
    formDataToSend.append('slideIndex', formData.slideIndex.toString());
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }
    createMutation.mutate(formDataToSend);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    if (formData.productId) {
      formDataToSend.append('productId', formData.productId);
    } else {
      formDataToSend.append('productId', '');
    }
    formDataToSend.append('target', formData.target ? JSON.stringify(formData.target) : '');
    formDataToSend.append('slideIndex', formData.slideIndex.toString());
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }
    updateMutation.mutate({ id: selectedSlider._id, formData: formDataToSend });
  };

  const handleEdit = (slider) => {
    setSelectedSlider(slider);
    setFormData({
      title: slider.title,
      productId: slider.productId?._id || '',
      target: slider.target || null,
      slideIndex: slider.slideIndex !== undefined ? slider.slideIndex : slider.order || 0,
      image: null,
    });
    setProductSearchQuery('');
    setIsEditOpen(true);
  };

  if (isLoading && !sliders) return <Loading message="Loading homepage sliders..." />;
  if (isError) return <ErrorMessage message="Error loading homepage sliders" />;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Homepage Sliders Management</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">Add slides one by one - Product selection is optional</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Slide
            </Button>
          </DialogTrigger>
          <DialogContent size="lg" className="">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Slide</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-300">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-secondary border-gray-700 text-white"
                  placeholder="Enter slide title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slideIndex" className="text-gray-300">Slide Position *</Label>
                <select
                  id="slideIndex"
                  value={formData.slideIndex}
                  onChange={(e) => setFormData({ ...formData, slideIndex: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                >
                  {SLIDE_POSITIONS.map((pos) => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400">
                  Select the position for this slide in the carousel (0-4)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product" className="text-gray-300">
                  Product (Optional)
                </Label>
                <p className="text-xs text-gray-400 mb-2">
                  If no product is selected, the slide will be image-only and not clickable
                </p>
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={productSearchQuery}
                    onChange={(e) => { setProductSearchQuery(e.target.value); setShowProductDropdown(true); }}
                    onFocus={() => setShowProductDropdown(true)}
                    className="bg-secondary border-gray-700 text-white"
                  />
                  {showProductDropdown && debouncedProductSearch && (
                    <div className="max-h-60 overflow-y-auto border border-gray-700 rounded-md bg-secondary">
                      {productsLoading ? (
                        <div className="p-4 text-center text-gray-400">Loading...</div>
                      ) : products.length > 0 ? (
                        products.map((product) => (
                          <button
                            key={product._id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, productId: product._id });
                              setProductSearchQuery(product.name);
                              setShowProductDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${
                              formData.productId === product._id ? 'bg-accent/20' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {product.images?.[0] && (
                                <SafeImage
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <div className="text-white font-medium">{product.name}</div>
                                <div className="text-sm text-gray-400">
                                  {product.price ? `${formatMoney(product.price)} · ` : ''}{product.offersCount ?? 0} {(product.offersCount ?? 0) === 1 ? 'offer' : 'offers'}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-400">No products found</div>
                      )}
                    </div>
                  )}
                  {formData.productId && (
                    <div className="flex items-center gap-2 p-2 bg-accent/10 border border-accent rounded-md">
                      <span className="text-sm text-white">
                        Selected: {products.find(p => p._id === formData.productId)?.name || 'Product'}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setFormData({ ...formData, productId: '' });
                          setProductSearchQuery('');
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {!formData.productId && (
                <div className="rounded-lg border border-gray-700 p-3">
                  <TargetPicker
                    value={formData.target}
                    onChange={(target) => setFormData({ ...formData, target })}
                    label="Where this slide goes (used when no product is selected)"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="image" className="text-gray-300">Image *</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                  className="bg-secondary border-gray-700 text-white"
                  required
                />
                {formData.image && (
                  <p className="text-xs text-gray-400">Selected: {formData.image.name}</p>
                )}
              </div>

              <Button type="submit" disabled={createMutation.isPending} className="w-full bg-accent hover:bg-blue-700">
                {createMutation.isPending ? 'Creating...' : 'Create Slide'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card variant="hud">
        <CardHeader>
          <CardTitle>All Homepage Sliders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table variant="hud">
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Image</TableHead>
                  <TableHead className="text-gray-300">Title</TableHead>
                  <TableHead className="text-gray-300">Position</TableHead>
                  <TableHead className="text-gray-300">Product</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSliders.length > 0 ? (
                  sortedSliders
                    .map((slider) => {
                      const position = slidePosition(slider);
                      const positionLabel = SLIDE_POSITIONS[position]?.label || `Position ${position + 1}`;
                      return (
                        <TableRow key={slider._id} className="border-gray-700">
                          <TableCell>
                            {slider.image ? (
                              <SafeImage src={slider.image} alt={slider.title} className="w-24 h-16 object-cover rounded" />
                            ) : (
                              <div className="w-24 h-16 bg-gray-700 rounded flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-white font-medium">{slider.title}</TableCell>
                          <TableCell className="text-gray-400">
                            <Badge variant="outline" className="text-xs">
                              {positionLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400">
                            {slider.productId ? (
                              <div className="flex items-center gap-2">
                                {slider.productId.images?.[0] && (
                                  <SafeImage
                                    src={slider.productId.images[0]}
                                    alt={slider.productId.name}
                                    className="w-8 h-8 object-cover rounded"
                                  />
                                )}
                                <span className="text-sm">{slider.productId.name}</span>
                              </div>
                            ) : (
                              <span className="text-gray-500 italic">No product</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={slider.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                              {slider.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(slider)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                title={slider.isActive ? 'Hide from homepage' : 'Show on homepage'}
                                disabled={toggleActiveMutation.isPending}
                                onClick={() => toggleActiveMutation.mutate(slider)}
                              >
                                <Power className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setDeleteId(slider._id);
                                  setShowDeleteModal(true);
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
                  <TableEmptyRow colSpan={6}>No sliders found. Click &quot;Add Slide&quot; to create your first slide.</TableEmptyRow>
                )}
              </TableBody>
            </Table>
          </div>
          <Pagination variant="numbered" page={page} totalPages={sliders?.pagination?.pages || 1} onPageChange={setPage} />
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent size="lg" className="">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Homepage Slider</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-gray-300">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-secondary border-gray-700 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-slideIndex" className="text-gray-300">Slide Position *</Label>
              <select
                id="edit-slideIndex"
                value={formData.slideIndex}
                onChange={(e) => setFormData({ ...formData, slideIndex: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-accent"
                required
              >
                {SLIDE_POSITIONS.map((pos) => (
                  <option key={pos.value} value={pos.value}>
                    {pos.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-product" className="text-gray-300">
                Product (Optional)
              </Label>
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={productSearchQuery}
                  onChange={(e) => { setProductSearchQuery(e.target.value); setShowProductDropdown(true); }}
                  onFocus={() => setShowProductDropdown(true)}
                  className="bg-secondary border-gray-700 text-white"
                />
                {showProductDropdown && debouncedProductSearch && (
                  <div className="max-h-60 overflow-y-auto border border-gray-700 rounded-md bg-secondary">
                    {productsLoading ? (
                      <div className="p-4 text-center text-gray-400">Loading...</div>
                    ) : products.length > 0 ? (
                      products.map((product) => (
                        <button
                          key={product._id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, productId: product._id });
                            setProductSearchQuery(product.name);
                            setShowProductDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${
                            formData.productId === product._id ? 'bg-accent/20' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {product.images?.[0] && (
                              <SafeImage
                                src={product.images[0]}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <div className="text-white font-medium">{product.name}</div>
                              <div className="text-sm text-gray-400">
                                {product.price ? `${formatMoney(product.price)} · ` : ''}{product.offersCount ?? 0} {(product.offersCount ?? 0) === 1 ? 'offer' : 'offers'}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-400">No products found</div>
                    )}
                  </div>
                )}
                {formData.productId && (
                  <div className="flex items-center gap-2 p-2 bg-accent/10 border border-accent rounded-md">
                    <span className="text-sm text-white">
                      Selected: {products.find(p => p._id === formData.productId)?.name || selectedSlider?.productId?.name || 'Product'}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setFormData({ ...formData, productId: '' });
                        setProductSearchQuery('');
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {!formData.productId && (
              <div className="rounded-lg border border-gray-700 p-3">
                <TargetPicker
                  value={formData.target}
                  onChange={(target) => setFormData({ ...formData, target })}
                  label="Where this slide goes (used when no product is selected)"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-image" className="text-gray-300">Update Image (Optional)</Label>
              <Input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                className="bg-secondary border-gray-700 text-white"
              />
              {formData.image && (
                <p className="text-xs text-gray-400">Selected: {formData.image.name}</p>
              )}
            </div>

            <Button type="submit" disabled={updateMutation.isPending} className="w-full bg-accent hover:bg-blue-700">
              {updateMutation.isPending ? 'Updating...' : 'Update Slide'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Delete Homepage Slider"
        description="Are you sure you want to delete this slider? This action cannot be undone."
        confirmText={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        variant="destructive"
        onConfirm={() => {
          if (deleteId) deleteMutation.mutate(deleteId);
        }}
      />
    </div>
  );
};

export default HomepageSlidersManagement;
