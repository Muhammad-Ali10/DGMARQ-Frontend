import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deviceAPI } from '../../services/api';
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
import { Plus, Edit, Trash2, Power, ChevronLeft, ChevronRight, Search, X, Filter, RefreshCw } from 'lucide-react';

const DevicesManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const queryClient = useQueryClient();

  const { data: devicesData, isLoading, isError, error } = useQuery({
    queryKey: ['devices', page, search, isActiveFilter],
    queryFn: () => {
      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (isActiveFilter !== '') params.isActive = isActiveFilter;
      return deviceAPI.getDevices(params).then(res => res.data.data);
    },
    keepPreviousData: true,
  });

  // Extract devices array and pagination info from response
  // Device backend uses aggregatePaginate, returns { docs, totalDocs, page, totalPages, ... }
  const devices = devicesData?.docs || devicesData?.devices || [];
  const pagination = devicesData ? {
    page: devicesData.page || 1,
    totalPages: devicesData.totalPages || 1,
    totalDocs: devicesData.totalDocs || 0,
    limit: devicesData.limit || 10,
    hasNextPage: devicesData.hasNextPage || false,
    hasPrevPage: devicesData.hasPrevPage || false,
  } : {
    page: 1,
    totalPages: 1,
    totalDocs: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const createMutation = useMutation({
    mutationFn: (data) => deviceAPI.createDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['devices']);
      setIsCreateOpen(false);
      setFormData({ name: '' });
      setPage(1);
      toast.success('Device created successfully');
    },
    onError: (error) => {
      console.error('Create device error:', error);
      toast.error(error?.response?.data?.message || 'Failed to create device');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => deviceAPI.updateDevice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['devices']);
      setIsEditOpen(false);
      setSelectedDevice(null);
      toast.success('Device updated successfully');
    },
    onError: (error) => {
      console.error('Update device error:', error);
      toast.error(error?.response?.data?.message || 'Failed to update device');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id) => deviceAPI.toggleDeviceStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['devices']);
      toast.success('Device status updated successfully');
    },
    onError: (error) => {
      console.error('Toggle status error:', error);
      toast.error(error?.response?.data?.message || 'Failed to update status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deviceAPI.deleteDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['devices']);
      if (devices.length === 1 && page > 1) {
        setPage(page - 1);
      }
      toast.success('Device deleted successfully');
    },
    onError: (error) => {
      console.error('Delete device error:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete device');
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.warning('Device name is required');
      return;
    }
    createMutation.mutate({ name: formData.name.trim() });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.warning('Device name is required');
      return;
    }
    updateMutation.mutate({
      id: selectedDevice._id,
      data: { name: formData.name.trim() },
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleFilterChange = (value) => {
    setIsActiveFilter(value);
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

  if (isLoading && !devicesData) return <Loading message="Loading devices..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || "Error loading devices"} />;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Devices Management</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">Manage gaming devices</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-blue-700 shadow-lg shadow-accent/20">
              <Plus className="w-4 h-4 mr-2" />
              Create Device
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-primary border-gray-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-semibold">Create New Device</DialogTitle>
              <DialogDescription className="text-gray-400">
                Add a new gaming device
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  className="bg-secondary border-gray-700 text-white"
                  required
                />
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
                  className="flex-1 bg-accent hover:bg-blue-700"
                >
                  {createMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Device
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
              <CardTitle className="text-white text-xl font-semibold">All Devices</CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                {pagination.totalDocs > 0 ? (
                  <>
                    Showing <span className="text-white font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                    <span className="text-white font-medium">{Math.min(pagination.page * pagination.limit, pagination.totalDocs)}</span> of{' '}
                    <span className="text-white font-medium">{pagination.totalDocs}</span> devices
                  </>
                ) : (
                  'No devices found'
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
                  placeholder="Search by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-secondary border-gray-700 text-white pl-10 pr-10 focus:ring-2 focus:ring-accent/50"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setPage(1);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button type="submit" variant="outline" size="sm" className="border-gray-700">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </form>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <select
                value={isActiveFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="w-full sm:w-48 px-10 py-2 bg-secondary border border-gray-700 rounded-md text-white appearance-none cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>
            {(search || isActiveFilter) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setIsActiveFilter('');
                  setPage(1);
                }}
                className="border-gray-700"
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
                  <TableHead className="text-gray-300 font-semibold">Name</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Status</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Created Date</TableHead>
                  <TableHead className="text-gray-300 font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices && devices.length > 0 ? (
                  devices.map((device) => (
                    <TableRow key={device._id} className="border-gray-700 hover:bg-secondary/20">
                      <TableCell className="font-semibold text-white">{device.name}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={device.isActive ? 'success' : 'destructive'}
                          className="font-medium"
                        >
                          {device.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {device.createdAt ? new Date(device.createdAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedDevice(device);
                              setFormData({ name: device.name });
                              setIsEditOpen(true);
                            }}
                            className="border-gray-700 hover:bg-blue-600/20"
                            title="Edit Device"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleStatusMutation.mutate(device._id)}
                            className={`border-gray-700 ${device.isActive ? 'hover:bg-orange-600/20' : 'hover:bg-green-600/20'}`}
                            title={device.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                                deleteMutation.mutate(device._id);
                            }}
                            className="hover:bg-red-700"
                            title="Delete Device"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <p className="text-gray-400 font-medium">No devices found</p>
                        <p className="text-gray-500 text-sm">
                          {search || isActiveFilter 
                            ? 'Try adjusting your search or filter criteria' 
                            : 'Get started by creating your first device'}
                        </p>
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
                  className="border-gray-700"
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
                  className="border-gray-700"
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
            <DialogTitle className="text-white text-xl font-semibold">Edit Device</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update device information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-gray-300">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                className="bg-secondary border-gray-700 text-white"
                required
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
                className="flex-1 bg-accent hover:bg-blue-700"
              >
                {updateMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Update Device
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

export default DevicesManagement;
