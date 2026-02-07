import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productAPI, sellerAPI } from '../../services/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import BulkUploadModal from '../../components/BulkUploadModal';
import { Plus, Key, Search, RefreshCw, ChevronLeft, ChevronRight, Eye, EyeOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { normalizeToHttps } from '../../lib/utils';

const SellerLicenseKeys = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [showKeys, setShowKeys] = useState({}); // Track which keys are revealed
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState(null);
  const queryClient = useQueryClient();

  const { data: productsData, isLoading: isLoadingProducts, isError: productsError } = useQuery({
    queryKey: ['seller-products', searchTerm],
    queryFn: () => productAPI.getProducts({ search: searchTerm, limit: 50 }).then(res => res.data.data),
    retry: 2,
  });

  const [keysPage, setKeysPage] = useState(1);
  const keysLimit = 10; // Default to 10 keys per page

  const { data: keysData, isLoading: isLoadingKeys, isError: keysError } = useQuery({
    queryKey: ['seller-license-keys', selectedProduct, keysPage],
    queryFn: async () => {
      const response = await sellerAPI.getLicenseKeys(selectedProduct, { page: keysPage, limit: keysLimit });
      return response.data.data;
    },
    enabled: !!selectedProduct,
    retry: 2,
  });

  const revealKeyMutation = useMutation({
    mutationFn: (keyId) => {
      const keyIdStr = keyId?.toString() || keyId;
      return sellerAPI.revealLicenseKey(keyIdStr);
    },
    onSuccess: (response, keyId) => {
      const keyIdStr = keyId?.toString() || keyId;
      const responseData = response?.data?.data || response?.data || response;
      const keyData = responseData?.keyData;
      if (keyData !== undefined && keyData !== null) {
        setShowKeys(prev => ({ ...prev, [keyIdStr]: keyData }));
        toast.success('License key revealed');
      } else {
        toast.error('Failed to reveal license key: Invalid response format');
      }
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message ||
                         error.response?.data?.data?.message ||
                         error.message ||
                         'Failed to reveal license key';
      toast.error(errorMessage);
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (keyId) => sellerAPI.deleteLicenseKey(keyId),
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-license-keys', selectedProduct]);
      queryClient.invalidateQueries(['seller-products']);
      setDeleteDialogOpen(false);
      setKeyToDelete(null);
      toast.success('License key deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete license key');
    },
  });

  const syncStockMutation = useMutation({
    mutationFn: (productId) => productAPI.syncStock(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries(['seller-license-keys', productId]);
      queryClient.invalidateQueries(['seller-products']);
      toast.success('Stock synced successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to sync stock');
    },
  });

  const handleRevealKey = (keyId) => {
    // Convert keyId to string to ensure consistent key matching
    const keyIdStr = keyId?.toString() || keyId;
    
    if (showKeys[keyIdStr]) {
      // Hide key
      setShowKeys(prev => {
        const newState = { ...prev };
        delete newState[keyIdStr];
        return newState;
      });
      toast.info('License key hidden');
    } else {
      revealKeyMutation.mutate(keyIdStr);
    }
  };

  const handleDeleteClick = (key) => {
    // Double-check status before showing dialog
    if (key.status !== 'Active') {
      const reason = key.status === 'Used' 
        ? 'Used license keys cannot be deleted' 
        : key.status === 'Refunded'
        ? 'Refunded license keys cannot be deleted'
        : 'This license key cannot be deleted';
      toast.error(reason);
      return;
    }
    
    // Additional safety check
    if (key.isUsed || key.isRefunded || key.assignedToOrder) {
      toast.error('This license key cannot be deleted. It may be used, refunded, or assigned to an order.');
      return;
    }
    
    setKeyToDelete(key);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (keyToDelete) {
      deleteKeyMutation.mutate(keyToDelete._id);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Active: { className: 'bg-green-600 text-white', label: 'Active' },
      Used: { className: 'bg-blue-600 text-white', label: 'Used' },
      Refunded: { className: 'bg-red-600 text-white', label: 'Refunded' },
    };
    const config = statusConfig[status] || statusConfig.Active;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const maskKey = (keyData) => {
    if (!keyData) return 'XXXX-XXXX-XXXX';
    const keyStr = typeof keyData === 'string' ? keyData : JSON.stringify(keyData);
    if (keyStr.length > 8) {
      return keyStr.substring(0, 4) + '-XXXX-XXXX-' + keyStr.substring(keyStr.length - 4);
    }
    return 'XXXX-XXXX-' + keyStr.substring(keyStr.length - 4);
  };

  const formatKeyForDisplay = (keyData) => {
    if (!keyData) return 'XXXX-XXXX-XXXX';
    
    // If it's a string, return as-is
    if (typeof keyData === 'string') {
      return keyData;
    }
    
    // If it's an object (account-based product), format nicely
    if (typeof keyData === 'object') {
      // Check if it's an account object with email/password
      if (keyData.email && keyData.password) {
        return `Email: ${keyData.email}\nPassword: ${keyData.password}`;
      }
      // Otherwise, stringify
      return JSON.stringify(keyData, null, 2);
    }
    
    return String(keyData);
  };

  // Handle both response structures: aggregatePaginate returns 'docs', some APIs return 'products'
  const products = productsData?.docs || productsData?.products || [];
  
  // Handle both old and new API response formats
  const keys = keysData?.keys || [];
  const keysPagination = keysData?.pagination || {};
  
  // Transform old format keys to new format if needed (fallback)
  const transformedKeys = keys.map(key => {
    // If key doesn't have status, calculate it from isUsed/isRefunded
    if (!key.status) {
      if (key.isRefunded) {
        key.status = 'Refunded';
      } else if (key.isUsed) {
        key.status = 'Used';
      } else {
        key.status = 'Active';
      }
    }
    // If key doesn't have maskedKey, add it
    if (!key.maskedKey) {
      key.maskedKey = 'XXXX-XXXX-XXXX';
    }
    return key;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">License Keys Management</h1>
          <p className="text-gray-400 mt-1">View and manage license keys for your products</p>
        </div>
        <Button 
          onClick={() => setIsUploadOpen(true)}
          className="bg-accent hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Inventory
        </Button>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Search Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="bg-secondary border-gray-700 text-white pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoadingProducts ? (
        <Loading message="Loading products..." />
      ) : productsError ? (
        <ErrorMessage message="Failed to load products. Please try again." />
      ) : (
        <Card className="bg-primary border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Select Product to View Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div
                  key={product._id}
                  onClick={() => {
                    setSelectedProduct(product._id);
                    setKeysPage(1); // Reset to first page when selecting new product
                    setShowKeys({}); // Reset revealed keys
                  }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedProduct === product._id
                      ? 'border-accent bg-accent/10'
                      : 'border-gray-700 bg-secondary hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {product.images?.[0] && (
                      <img src={normalizeToHttps(product.images[0])} alt={product.name} className="w-12 h-12 object-cover rounded" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-white">{product.name}</p>
                      <p className="text-sm text-gray-400">
                        Stock: {product.availableKeysCount ?? product.stock ?? 0} | 
                        Total: {product.totalKeysCount ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedProduct && (
        <Card className="bg-primary border-gray-700">
          <CardHeader>
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <CardTitle className="text-white">License Keys</CardTitle>
                {keysPagination.total !== undefined && (
                  <p className="text-sm text-gray-400 mt-1">
                    Total: {keysPagination.total} | 
                    Active: {transformedKeys.filter(k => k.status === 'Active').length} | 
                    Used: {transformedKeys.filter(k => k.status === 'Used').length} | 
                    Refunded: {transformedKeys.filter(k => k.status === 'Refunded').length}
                  </p>
                )}
              </div>
              <Button
                onClick={() => syncStockMutation.mutate(selectedProduct)}
                disabled={syncStockMutation.isPending}
                variant="outline"
                className="border-gray-700 text-gray-300"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncStockMutation.isPending ? 'animate-spin' : ''}`} />
                {syncStockMutation.isPending ? 'Syncing...' : 'Sync Stock'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingKeys ? (
              <Loading message="Loading keys..." />
            ) : keysError ? (
              <ErrorMessage message={`Failed to load keys: ${keysError.response?.data?.message || keysError.message || 'Unknown error'}. Please try again.`} />
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">License Key</TableHead>
                        <TableHead className="text-gray-300">Key Type</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Created Date</TableHead>
                        <TableHead className="text-gray-300">Used Date</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transformedKeys.length > 0 ? (
                        transformedKeys.map((key) => {
                          const keyIdStr = key._id?.toString() || key._id;
                          const isRevealed = !!showKeys[keyIdStr];
                          const displayKey = isRevealed 
                            ? formatKeyForDisplay(showKeys[keyIdStr])
                            : key.maskedKey || maskKey(null);
                          
                          return (
                            <TableRow key={key._id} className="border-gray-700">
                              <TableCell className="text-white">
                                <div className="flex items-center gap-2">
                                  <code className="text-sm font-mono bg-secondary px-2 py-1 rounded whitespace-pre-wrap break-words max-w-md">
                                    {displayKey}
                                  </code>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRevealKey(key._id)}
                                    disabled={revealKeyMutation.isPending || revealKeyMutation.isLoading}
                                    className="h-8 w-8 p-0"
                                    title={isRevealed ? "Hide license key" : "Show license key"}
                                  >
                                    {isRevealed ? (
                                      <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-300" />
                                    ) : (
                                      <Eye className="w-4 h-4 text-gray-400 hover:text-gray-300" />
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-white capitalize">{key.keyType || 'other'}</TableCell>
                              <TableCell>
                                {getStatusBadge(key.status)}
                              </TableCell>
                              <TableCell className="text-gray-400">
                                {key.createdAt ? new Date(key.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                }) : '-'}
                              </TableCell>
                              <TableCell className="text-gray-400">
                                {key.assignedAt ? new Date(key.assignedAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                }) : '-'}
                              </TableCell>
                              <TableCell>
                                {key.status === 'Active' ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteClick(key)}
                                    disabled={deleteKeyMutation.isPending}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    title="Delete license key"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <span 
                                    className="text-gray-500 text-sm"
                                    title={key.status === 'Used' ? 'Cannot delete used keys' : key.status === 'Refunded' ? 'Cannot delete refunded keys' : 'Key cannot be deleted'}
                                  >
                                    -
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                            <Key className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                            <p>No keys found for this product</p>
                            <p className="text-sm mt-2">Upload keys using the "Upload Inventory" button above</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {keysPagination?.pages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-400">
                      Page {keysPagination.page || keysPage} of {keysPagination.pages || 1} 
                      ({keysPagination.total || 0} total keys)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setKeysPage(p => Math.max(1, p - 1))}
                        disabled={keysPage === 1}
                        className="border-gray-700 text-gray-300"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setKeysPage(p => Math.min(keysPagination.pages || 1, p + 1))}
                        disabled={keysPage >= (keysPagination.pages || 1)}
                        className="border-gray-700 text-gray-300"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent size="sm" className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Delete License Key</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this license key? This action cannot be undone.
              {keyToDelete && (
                <div className="mt-2 p-2 bg-secondary rounded text-sm">
                  <p className="text-gray-300">Key Type: <span className="capitalize">{keyToDelete.keyType || 'other'}</span></p>
                  <p className="text-gray-300">Status: {keyToDelete.status}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setKeyToDelete(null);
              }}
              className="border-gray-700 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={deleteKeyMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteKeyMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        open={isUploadOpen}
        onOpenChange={(open) => {
          setIsUploadOpen(open);
          // Refresh keys when modal closes after successful upload
          if (!open && selectedProduct) {
            queryClient.invalidateQueries(['seller-license-keys', selectedProduct]);
            queryClient.invalidateQueries(['seller-products']);
            setKeysPage(1); // Reset to first page
          }
        }}
      />
    </div>
  );
};

export default SellerLicenseKeys;
