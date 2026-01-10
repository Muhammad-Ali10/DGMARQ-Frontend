import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productAPI } from '../../services/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import BulkUploadModal from '../../components/BulkUploadModal';
import { Plus, Key, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const SellerLicenseKeys = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: productsData, isLoading: isLoadingProducts, isError: productsError } = useQuery({
    queryKey: ['seller-products', searchTerm],
    queryFn: () => productAPI.getProducts({ search: searchTerm, limit: 50 }).then(res => res.data.data),
    retry: 2,
  });

  const [keysPage, setKeysPage] = useState(1);
  const keysLimit = 50;

  const { data: keysData, isLoading: isLoadingKeys, isError: keysError } = useQuery({
    queryKey: ['product-keys', selectedProduct, keysPage],
    queryFn: () => productAPI.getProductKeys(selectedProduct, { page: keysPage, limit: keysLimit }).then(res => res.data.data),
    enabled: !!selectedProduct,
    retry: 2,
  });

  const syncStockMutation = useMutation({
    mutationFn: (productId) => productAPI.syncStock(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries(['product-keys', productId]);
      queryClient.invalidateQueries(['seller-products']);
      toast.success('Stock synced successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to sync stock');
    },
  });

  // Handle both response structures: aggregatePaginate returns 'docs', some APIs return 'products'
  const products = productsData?.docs || productsData?.products || [];
  const keys = keysData?.keys || keysData?.docs || [];
  const keysPagination = keysData?.pagination || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">License Keys Management</h1>
          <p className="text-gray-400 mt-1">Manage license keys for your products</p>
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
                  }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedProduct === product._id
                      ? 'border-accent bg-accent/10'
                      : 'border-gray-700 bg-secondary hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {product.images?.[0] && (
                      <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover rounded" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-white">                    {product.name}</p>
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
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white">License Keys</CardTitle>
                {keysPagination.total !== undefined && (
                  <p className="text-sm text-gray-400 mt-1">
                    Total: {keysPagination.total} | 
                    Available: {keys.filter(k => !k.isUsed).length} | 
                    Used: {keys.filter(k => k.isUsed).length}
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
              <ErrorMessage message="Failed to load keys. Please try again." />
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Key Type</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Assigned At</TableHead>
                        <TableHead className="text-gray-300">Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {keys.length > 0 ? (
                        keys.map((key) => (
                          <TableRow key={key._id} className="border-gray-700">
                            <TableCell className="text-white capitalize">{key.keyType || 'other'}</TableCell>
                            <TableCell>
                              <Badge 
                                className={key.isUsed ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}
                              >
                                {key.isUsed ? 'Used' : 'Available'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-400">
                              {key.assignedAt ? new Date(key.assignedAt).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell className="text-gray-400">
                              {key.createdAt ? new Date(key.createdAt).toLocaleDateString() : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-gray-400 py-8">
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
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        open={isUploadOpen}
        onOpenChange={(open) => {
          setIsUploadOpen(open);
          // Refresh keys when modal closes after successful upload
          if (!open && selectedProduct) {
            queryClient.invalidateQueries(['product-keys']);
            queryClient.invalidateQueries(['seller-products']);
            setKeysPage(1); // Reset to first page
          }
        }}
      />
    </div>
  );
};

export default SellerLicenseKeys;

