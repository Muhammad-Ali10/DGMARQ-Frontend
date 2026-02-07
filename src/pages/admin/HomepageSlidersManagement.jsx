import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { homepageSliderAPI, productAPI } from '../../services/api';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { SearchableSelect } from '../../components/ui/searchable-select';
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import { showSuccess, showApiError } from '../../utils/toast';

const SLIDE_POSITIONS = [
  { value: 0, label: 'Position 1 - Left Small' },
  { value: 1, label: 'Position 2 - Left Medium' },
  { value: 2, label: 'Position 3 - Center Featured' },
  { value: 3, label: 'Position 4 - Right Medium' },
  { value: 4, label: 'Position 5 - Right Small' },
];

const HomepageSlidersManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedSlider, setSelectedSlider] = useState(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    productId: '',
    slideIndex: 0,
    image: null,
  });
  const queryClient = useQueryClient();

  const { data: sliders, isLoading, isError } = useQuery({
    queryKey: ['homepage-sliders'],
    queryFn: () => homepageSliderAPI.getAllHomepageSliders().then(res => res.data.data),
  });

  // Fetch products for search
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products-search', productSearchQuery],
    queryFn: async () => {
      if (!productSearchQuery.trim()) return { docs: [] };
      const response = await productAPI.getProducts({
        search: productSearchQuery,
        status: 'active',
        limit: 50,
      });
      return response.data.data || { docs: [] };
    },
    enabled: productSearchQuery.trim().length > 0,
  });

  const products = productsData?.docs || [];

  const createMutation = useMutation({
    mutationFn: (formData) => homepageSliderAPI.createHomepageSlider(formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['homepage-sliders']);
      setIsCreateOpen(false);
      setFormData({ title: '', productId: '', slideIndex: 0, image: null });
      setProductSearchQuery('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }) => homepageSliderAPI.updateHomepageSlider(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['homepage-sliders']);
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
      queryClient.invalidateQueries(['homepage-sliders']);
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
      formDataToSend.append('productId', ''); // Clear product if none selected
    }
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
      slideIndex: slider.slideIndex !== undefined ? slider.slideIndex : slider.order || 0,
      image: null,
    });
    setProductSearchQuery('');
    setIsEditOpen(true);
  };

  // Get available positions (exclude already used positions)
  const getAvailablePositions = () => {
    const usedPositions = sliders?.sliders
      ?.filter(s => s._id !== selectedSlider?._id)
      .map(s => s.slideIndex !== undefined ? s.slideIndex : s.order)
      .filter(p => p !== undefined) || [];
    
    return SLIDE_POSITIONS.filter(pos => !usedPositions.includes(pos.value));
  };

  if (isLoading) return <Loading message="Loading homepage sliders..." />;
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
          <DialogContent size="lg" className="bg-primary border-gray-700">
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
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="bg-secondary border-gray-700 text-white"
                  />
                  {productSearchQuery.trim() && (
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
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${
                              formData.productId === product._id ? 'bg-accent/20' : ''
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
                              <div className="flex-1">
                                <div className="text-white font-medium">{product.name}</div>
                                {product.price && (
                                  <div className="text-sm text-gray-400">${product.price.toFixed(2)}</div>
                                )}
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

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">All Homepage Sliders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
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
                {sliders?.sliders?.length > 0 ? (
                  sliders.sliders
                    .sort((a, b) => {
                      const aIndex = a.slideIndex !== undefined ? a.slideIndex : a.order || 0;
                      const bIndex = b.slideIndex !== undefined ? b.slideIndex : b.order || 0;
                      return aIndex - bIndex;
                    })
                    .map((slider) => {
                      const position = slider.slideIndex !== undefined ? slider.slideIndex : slider.order || 0;
                      const positionLabel = SLIDE_POSITIONS[position]?.label || `Position ${position + 1}`;
                      return (
                        <TableRow key={slider._id} className="border-gray-700">
                          <TableCell>
                            {slider.image ? (
                              <img src={slider.image} alt={slider.title} className="w-24 h-16 object-cover rounded" />
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
                                  <img
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
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                      No sliders found. Click "Add Slide" to create your first slide.
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
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="bg-secondary border-gray-700 text-white"
                />
                {productSearchQuery.trim() && (
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
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${
                            formData.productId === product._id ? 'bg-accent/20' : ''
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
                            <div className="flex-1">
                              <div className="text-white font-medium">{product.name}</div>
                              {product.price && (
                                <div className="text-sm text-gray-400">${product.price.toFixed(2)}</div>
                              )}
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
    </div>
  );
};

export default HomepageSlidersManagement;
