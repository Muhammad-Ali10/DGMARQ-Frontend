import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subcategoryAPI, categoryAPI } from '../../services/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Plus, Edit, Trash2, Image as ImageIcon, Power, ChevronLeft, ChevronRight, Search, X, Layers, Filter, RefreshCw } from 'lucide-react';

const SubcategoriesManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', parentCategory: '', image: null });
  const [statusData, setStatusData] = useState({ status: true });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const queryClient = useQueryClient();

  // Fetch categories for dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ['categories-for-dropdown'],
    queryFn: () => categoryAPI.getCategories({ page: 1, limit: 1000 }).then(res => res.data.data),
  });
  const categories = categoriesData?.docs || categoriesData?.categories || [];

  // Fetch subcategories with pagination
  const { data: subcategoriesData, isLoading, isError, error } = useQuery({
    queryKey: ['subcategories', page, search, isActiveFilter, categoryFilter],
    queryFn: () => {
      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (isActiveFilter !== '') params.isActive = isActiveFilter;
      if (categoryFilter) params.categoryId = categoryFilter;
      return subcategoryAPI.getSubcategories(params).then(res => res.data.data);
    },
    keepPreviousData: true,
  });

  // Extract subcategories array and pagination info
  const subcategories = subcategoriesData?.docs || subcategoriesData?.subcategories || [];
  const pagination = {
    page: subcategoriesData?.page || 1,
    totalPages: subcategoriesData?.totalPages || 1,
    totalDocs: subcategoriesData?.totalDocs || 0,
    limit: subcategoriesData?.limit || 10,
    hasNextPage: subcategoriesData?.hasNextPage || false,
    hasPrevPage: subcategoriesData?.hasPrevPage || false,
  };

  const createMutation = useMutation({
    mutationFn: (formData) => subcategoryAPI.createSubcategory(formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['subcategories']);
      setIsCreateOpen(false);
      setFormData({ name: '', slug: '', description: '', parentCategory: '', image: null });
      setPage(1);
      toast.success('Subcategory created successfully');
    },
    onError: (error) => {
      console.error('Create subcategory error:', error);
      toast.error(error?.response?.data?.message || 'Failed to create subcategory');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ subCategoryId, data }) => subcategoryAPI.updateSubcategory(subCategoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['subcategories']);
      setIsEditOpen(false);
      setSelectedSubcategory(null);
      toast.success('Subcategory updated successfully');
    },
    onError: (error) => {
      console.error('Update subcategory error:', error);
      toast.error(error?.response?.data?.message || 'Failed to update subcategory');
    },
  });

  const updateImageMutation = useMutation({
    mutationFn: ({ subCategoryId, formData }) => subcategoryAPI.updateSubcategoryImage(subCategoryId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['subcategories']);
      setIsImageOpen(false);
      setSelectedSubcategory(null);
      toast.success('Subcategory image updated successfully');
    },
    onError: (error) => {
      console.error('Update image error:', error);
      toast.error(error?.response?.data?.message || 'Failed to update image');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ subCategoryId, data }) => subcategoryAPI.updateSubcategoryStatus(subCategoryId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['subcategories']);
      setIsStatusOpen(false);
      setSelectedSubcategory(null);
      const status = variables.data.status ? 'activated' : 'deactivated';
      toast.success(`Subcategory ${status} successfully`);
    },
    onError: (error) => {
      console.error('Update status error:', error);
      toast.error(error?.response?.data?.message || 'Failed to update status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (subCategoryId) => subcategoryAPI.deleteSubcategory(subCategoryId),
    onSuccess: () => {
      queryClient.invalidateQueries(['subcategories']);
      if (subcategories.length === 1 && page > 1) {
        setPage(page - 1);
      }
      toast.success('Subcategory deleted successfully');
    },
    onError: (error) => {
      console.error('Delete subcategory error:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete subcategory');
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.slug || !formData.parentCategory || !formData.image) {
      toast.warning('Name, slug, parent category, and image are required');
      return;
    }
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('slug', formData.slug);
    formDataToSend.append('parentCategory', formData.parentCategory);
    if (formData.description) formDataToSend.append('description', formData.description);
    formDataToSend.append('image', formData.image);
    createMutation.mutate(formDataToSend);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.slug || !formData.parentCategory) {
      toast.warning('Name, slug, and parent category are required');
      return;
    }
    updateMutation.mutate({
      subCategoryId: selectedSubcategory._id,
      data: { name: formData.name, slug: formData.slug, description: formData.description, parentCategory: formData.parentCategory },
    });
  };

  const handleImageUpdate = (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    if (formData.image) formDataToSend.append('image', formData.image);
    updateImageMutation.mutate({
      subCategoryId: selectedSubcategory._id,
      formData: formDataToSend,
    });
  };

  const handleStatusUpdate = (e) => {
    e.preventDefault();
    updateStatusMutation.mutate({
      subCategoryId: selectedSubcategory._id,
      data: { status: statusData.status },
    });
  };

  const handleDelete = (subCategoryId) => {
      deleteMutation.mutate(subCategoryId);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleFilterChange = (value) => {
    setIsActiveFilter(value);
    setPage(1);
  };

  const handleCategoryFilterChange = (value) => {
    setCategoryFilter(value);
    setPage(1);
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
          className={i === pagination.page ? 'bg-accent hover:bg-blue-700' : ''}
        >
          {i}
        </Button>
      );
    }
    return pages;
  };

  if (isLoading && !subcategoriesData) return <Loading message="Loading subcategories..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || "Error loading subcategories"} />;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded-lg">
              <Layers className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Subcategories Management</h1>
              <p className="text-sm sm:text-base text-gray-400 mt-1">Manage and organize product subcategories</p>
            </div>
          </div>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-blue-700 shadow-lg shadow-accent/20 transition-all duration-200">
              <Plus className="w-4 h-4 mr-2" />
              Create Subcategory
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-primary border-gray-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-semibold">Create New Subcategory</DialogTitle>
              <DialogDescription className="text-gray-400">
                Add a new product subcategory under a parent category
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="parentCategory" className="text-gray-300">Parent Category *</Label>
                <select
                  id="parentCategory"
                  value={formData.parentCategory}
                  onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-accent/50 focus:outline-none"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-secondary border-gray-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-gray-300">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="bg-secondary border-gray-700 text-white"
                  placeholder="subcategory-slug"
                  required
                />
                <p className="text-xs text-gray-500">URL-friendly identifier (lowercase, hyphens)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-300">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-secondary border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image" className="text-gray-300">Subcategory Image *</Label>
                <div className="relative">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                    className="bg-secondary border-gray-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-blue-700 cursor-pointer"
                    required
                  />
                </div>
                {formData.image && (
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <span>✓</span> Image selected: {formData.image.name}
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 border-gray-700"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending} 
                  className="flex-1 bg-accent hover:bg-blue-700 shadow-lg shadow-accent/20"
                >
                  {createMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Subcategory
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-primary border-gray-700 shadow-xl">
        <CardHeader className="border-b border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-white text-xl font-semibold">All Subcategories</CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                {pagination.totalDocs > 0 ? (
                  <>
                    Showing <span className="text-white font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                    <span className="text-white font-medium">{Math.min(pagination.page * pagination.limit, pagination.totalDocs)}</span> of{' '}
                    <span className="text-white font-medium">{pagination.totalDocs}</span> subcategories
                  </>
                ) : (
                  'No subcategories found'
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="px-3 py-1.5 bg-secondary/50 rounded-lg border border-gray-700">
                <span className="text-gray-400">Page </span>
                <span className="text-white font-semibold">{pagination.page}</span>
                <span className="text-gray-400"> of </span>
                <span className="text-white font-semibold">{pagination.totalPages}</span>
              </div>
            </div>
          </div>
          
          {/* Search and Filter Section */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                <Input
                  type="text"
                  placeholder="Search by name or slug..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-secondary border-gray-700 text-white pl-10 pr-10 focus:ring-2 focus:ring-accent/50 transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setPage(1);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button type="submit" variant="outline" size="sm" className="border-gray-700 hover:bg-secondary">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </form>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <select
                value={categoryFilter}
                onChange={(e) => handleCategoryFilterChange(e.target.value)}
                className="w-full sm:w-48 px-10 py-2 bg-secondary border border-gray-700 rounded-md text-white appearance-none cursor-pointer hover:border-gray-600 transition-colors focus:ring-2 focus:ring-accent/50 focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <select
                value={isActiveFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="w-full sm:w-48 px-10 py-2 bg-secondary border border-gray-700 rounded-md text-white appearance-none cursor-pointer hover:border-gray-600 transition-colors focus:ring-2 focus:ring-accent/50 focus:outline-none"
              >
                <option value="">All Status</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>
            {(search || isActiveFilter || categoryFilter) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setIsActiveFilter('');
                  setCategoryFilter('');
                  setPage(1);
                }}
                className="border-gray-700 hover:bg-secondary"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 bg-secondary/30 hover:bg-secondary/30">
                  <TableHead className="text-gray-300 font-semibold">Image</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Name</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Slug</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Parent Category</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Description</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Status</TableHead>
                  <TableHead className="text-gray-300 font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subcategories && subcategories.length > 0 ? (
                  subcategories.map((subcategory) => (
                    <TableRow 
                      key={subcategory._id} 
                      className="border-gray-700 hover:bg-secondary/20 transition-colors duration-150"
                    >
                      <TableCell>
                        <div className="flex items-center">
                          {subcategory.image ? (
                            <div className="relative group">
                              <img 
                                src={subcategory.image} 
                                alt={subcategory.name} 
                                className="w-14 h-14 object-cover rounded-lg border-2 border-gray-700 group-hover:border-accent/50 transition-colors"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors" />
                            </div>
                          ) : (
                            <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center border-2 border-gray-700">
                              <ImageIcon className="w-6 h-6 text-gray-500" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-white">{subcategory.name}</div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-gray-400 bg-secondary/50 px-2 py-1 rounded border border-gray-700">
                          {subcategory.slug || '-'}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="text-white font-medium">
                          {subcategory.parentCategory?.name || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-gray-400 max-w-xs truncate" title={subcategory.description || '-'}>
                          {subcategory.description || <span className="text-gray-600">-</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={subcategory.isActive ? 'success' : 'destructive'}
                          className="font-medium"
                        >
                          {subcategory.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSubcategory(subcategory);
                              setFormData({ 
                                name: subcategory.name, 
                                slug: subcategory.slug || '', 
                                description: subcategory.description || '', 
                                parentCategory: subcategory.parentCategory?._id || subcategory.parentCategory || '',
                                image: null 
                              });
                              setIsEditOpen(true);
                            }}
                            className="border-gray-700 hover:bg-blue-600/20 hover:border-blue-500/50 hover:text-blue-400 transition-all"
                            title="Edit Subcategory"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSubcategory(subcategory);
                              setFormData({ image: null });
                              setIsImageOpen(true);
                            }}
                            className="border-gray-700 hover:bg-purple-600/20 hover:border-purple-500/50 hover:text-purple-400 transition-all"
                            title="Update Image"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSubcategory(subcategory);
                              setStatusData({ status: !subcategory.isActive });
                              setIsStatusOpen(true);
                            }}
                            className={`border-gray-700 transition-all ${
                              subcategory.isActive 
                                ? 'hover:bg-orange-600/20 hover:border-orange-500/50 hover:text-orange-400' 
                                : 'hover:bg-green-600/20 hover:border-green-500/50 hover:text-green-400'
                            }`}
                            title={subcategory.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(subcategory._id)}
                            className="hover:bg-red-700 transition-all"
                            title="Delete Subcategory"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-4 bg-secondary/30 rounded-full">
                          <Layers className="w-8 h-8 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-gray-400 font-medium">No subcategories found</p>
                          <p className="text-gray-500 text-sm mt-1">
                            {search || isActiveFilter || categoryFilter
                              ? 'Try adjusting your search or filter criteria' 
                              : 'Get started by creating your first subcategory'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-700 px-6 pb-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage || isLoading}
                  className="border-gray-700 hover:bg-secondary disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex gap-1">
                  {renderPageNumbers()}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage || isLoading}
                  className="border-gray-700 hover:bg-secondary disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-primary border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold">Edit Subcategory</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update subcategory information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-parentCategory" className="text-gray-300">Parent Category *</Label>
              <select
                id="edit-parentCategory"
                value={formData.parentCategory}
                onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-accent/50 focus:outline-none"
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-gray-300">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-secondary border-gray-700 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug" className="text-gray-300">Slug *</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className="bg-secondary border-gray-700 text-white"
                placeholder="subcategory-slug"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-gray-300">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-secondary border-gray-700 text-white"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditOpen(false)}
                className="flex-1 border-gray-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending} 
                className="flex-1 bg-accent hover:bg-blue-700 shadow-lg shadow-accent/20"
              >
                {updateMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Update Subcategory
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Update Dialog */}
      <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
        <DialogContent className="bg-primary border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold">Update Subcategory Image</DialogTitle>
            <DialogDescription className="text-gray-400">
              Upload a new image for this subcategory
            </DialogDescription>
          </DialogHeader>
          {selectedSubcategory?.image && (
            <div className="mt-4 p-4 bg-secondary/50 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400 mb-2">Current Image:</p>
              <img src={selectedSubcategory.image} alt={selectedSubcategory.name} className="w-32 h-32 object-cover rounded-lg" />
            </div>
          )}
          <form onSubmit={handleImageUpdate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="update-image" className="text-gray-300">New Image</Label>
              <Input
                id="update-image"
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                className="bg-secondary border-gray-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-blue-700 cursor-pointer"
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsImageOpen(false)}
                className="flex-1 border-gray-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateImageMutation.isPending} 
                className="flex-1 bg-accent hover:bg-blue-700 shadow-lg shadow-accent/20"
              >
                {updateImageMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Update Image
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
        <DialogContent className="bg-primary border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold">Update Subcategory Status</DialogTitle>
            <DialogDescription className="text-gray-400">
              Change the active status of this subcategory
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStatusUpdate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-gray-300">Status</Label>
              <select
                id="status"
                value={statusData.status ? 'true' : 'false'}
                onChange={(e) => setStatusData({ status: e.target.value === 'true' })}
                className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-accent/50 focus:outline-none"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsStatusOpen(false)}
                className="flex-1 border-gray-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateStatusMutation.isPending} 
                className={`flex-1 shadow-lg ${
                  statusData.status 
                    ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' 
                    : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20'
                }`}
              >
                {updateStatusMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4 mr-2" />
                    {statusData.status ? 'Activate' : 'Deactivate'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubcategoriesManagement;
