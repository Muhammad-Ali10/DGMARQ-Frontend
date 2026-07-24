import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offerAPI } from '@services/api';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { SearchInput } from '@components/common/SearchInput';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Badge } from '@components/ui/badge';
import { Loading, ErrorMessage } from '@components/ui/loading';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { BulkUploadModal } from '@features/seller';
import { Plus, Key, RefreshCw, Eye, EyeOff, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from '@components/common/Pagination';
import { EmptyState, TableEmptyRow } from '@components/common/EmptyState';
import { normalizeToHttps } from '@lib/utils';
import SafeImage from '@components/ui/safe-image';

const OFFER_STATUS = {
  pending: { className: 'bg-yellow-600 text-white', label: 'Pending' },
  approved: { className: 'bg-green-600 text-white', label: 'Live' },
  active: { className: 'bg-green-600 text-white', label: 'Live' },
  rejected: { className: 'bg-red-600 text-white', label: 'Rejected' },
  delisted: { className: 'bg-gray-600 text-white', label: 'Delisted' },
};

const SellerLicenseKeys = () => {
  const [selectedOffer, setSelectedOffer] = useState(null); // the full offer object
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [showKeys, setShowKeys] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState(null);
  const [keysPage, setKeysPage] = useState(1);
  const keysLimit = 10;
  const queryClient = useQueryClient();

  // The seller lists offers against master products; manage that inventory here.
  const { data: offersData, isLoading: isLoadingOffers, isError: offersError } = useQuery({
    queryKey: ['license-offers'],
    queryFn: () => offerAPI.getMyOffers({ limit: 100 }).then((res) => res.data.data),
    retry: 2,
  });

  const offers = useMemo(() => offersData?.offers || [], [offersData]);
  const filteredOffers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return offers;
    return offers.filter((o) => (o.productId?.name || '').toLowerCase().includes(q));
  }, [offers, searchTerm]);

  const selectedOfferId = selectedOffer?._id || null;

  const { data: keysData, isLoading: isLoadingKeys, isError: keysError } = useQuery({
    queryKey: ['offer-keys', selectedOfferId, keysPage],
    queryFn: () => offerAPI.getOfferKeys(selectedOfferId, { page: keysPage, limit: keysLimit }).then((res) => res.data.data),
    enabled: !!selectedOfferId,
    retry: 2,
  });

  const revealKeyMutation = useMutation({
    mutationFn: (keyId) => offerAPI.revealOfferKey(selectedOfferId, keyId),
    onSuccess: (response, keyId) => {
      const keyData = response?.data?.data?.keyData;
      if (keyData !== undefined && keyData !== null) {
        setShowKeys((prev) => ({ ...prev, [keyId?.toString() || keyId]: keyData }));
        toast.success('License key revealed');
      } else {
        toast.error('Failed to reveal license key');
      }
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to reveal license key'),
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (keyId) => offerAPI.deleteOfferKey(selectedOfferId, keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-keys', selectedOfferId] });
      queryClient.invalidateQueries({ queryKey: ['license-offers'] });
      setDeleteDialogOpen(false);
      setKeyToDelete(null);
      toast.success('License key deleted successfully');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete license key'),
  });

  const syncStockMutation = useMutation({
    mutationFn: (offerId) => offerAPI.syncOfferStock(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-keys', selectedOfferId] });
      queryClient.invalidateQueries({ queryKey: ['license-offers'] });
      toast.success('Stock synced successfully');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to sync stock'),
  });

  const handleRevealKey = (keyId) => {
    const keyIdStr = keyId?.toString() || keyId;
    if (showKeys[keyIdStr]) {
      setShowKeys((prev) => {
        const next = { ...prev };
        delete next[keyIdStr];
        return next;
      });
      toast.info('License key hidden');
    } else {
      revealKeyMutation.mutate(keyIdStr);
    }
  };

  const handleDeleteClick = (key) => {
    if (key.status !== 'Active') {
      toast.error(key.status === 'Used' ? 'Used license keys cannot be deleted' : key.status === 'Refunded' ? 'Refunded license keys cannot be deleted' : 'This license key cannot be deleted');
      return;
    }
    setKeyToDelete(key);
    setDeleteDialogOpen(true);
  };

  const getStatusBadge = (status) => {
    const cfg = {
      Active: { className: 'bg-green-600 text-white', label: 'Active' },
      Used: { className: 'bg-blue-600 text-white', label: 'Used' },
      Refunded: { className: 'bg-red-600 text-white', label: 'Refunded' },
    }[status] || { className: 'bg-green-600 text-white', label: 'Active' };
    return <Badge className={cfg.className}>{cfg.label}</Badge>;
  };

  const maskKey = (keyData) => {
    if (!keyData) return 'XXXX-XXXX-XXXX';
    const s = typeof keyData === 'string' ? keyData : JSON.stringify(keyData);
    return s.length > 8 ? `${s.substring(0, 4)}-XXXX-XXXX-${s.substring(s.length - 4)}` : `XXXX-XXXX-${s.substring(s.length - 4)}`;
  };

  const formatKeyForDisplay = (keyData) => {
    if (!keyData) return 'XXXX-XXXX-XXXX';
    if (typeof keyData === 'string') return keyData;
    if (typeof keyData === 'object') {
      const email = keyData.email || null;
      const usernameId = keyData.usernameId || keyData.username || null;
      const rawPassword = keyData.password || null;
      const emailPassword = keyData.emailPassword || (email && !usernameId ? rawPassword : null);
      const usernamePassword = keyData.usernamePassword || (usernameId ? rawPassword : null);
      const lines = [];
      if (email) lines.push(`Email: ${email}`);
      if (emailPassword) lines.push(`Email Password: ${emailPassword}`);
      if (usernameId) lines.push(`Username ID: ${usernameId}`);
      if (usernamePassword) lines.push(`Username Password: ${usernamePassword}`);
      return lines.length ? lines.join('\n') : JSON.stringify(keyData, null, 2);
    }
    return String(keyData);
  };

  const keys = keysData?.keys || [];
  const keysPagination = keysData?.pagination || {};
  const transformedKeys = keys.map((key) => {
    if (!key.status) key.status = key.isRefunded ? 'Refunded' : key.isUsed ? 'Used' : 'Active';
    if (!key.maskedKey) key.maskedKey = 'XXXX-XXXX-XXXX';
    return key;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">License Keys Management</h1>
          <p className="text-gray-400 mt-1">Upload &amp; manage inventory for the products you’ve listed</p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} className="bg-accent hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Upload Inventory
        </Button>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Search Your Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search products..." />
        </CardContent>
      </Card>

      {isLoadingOffers ? (
        <Loading message="Loading your listings..." />
      ) : offersError ? (
        <ErrorMessage message="Failed to load your listings. Please try again." />
      ) : (
        <Card className="bg-primary border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Select a Listing to Manage Keys</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredOffers.length === 0 ? (
              <div className="text-center py-10">
                <Package className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">You haven’t listed any products yet.</p>
                <p className="text-gray-500 text-sm mt-1">Go to “Browse Catalog” to list a product, then add inventory here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOffers.map((offer) => {
                  const product = offer.productId || {};
                  const sCfg = OFFER_STATUS[offer.status] || OFFER_STATUS.pending;
                  return (
                    <div
                      key={offer._id}
                      onClick={() => { setSelectedOffer(offer); setKeysPage(1); setShowKeys({}); }}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedOffer?._id === offer._id ? 'border-accent bg-accent/10' : 'border-gray-700 bg-secondary hover:border-gray-600'}`}
                    >
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <SafeImage src={normalizeToHttps(product.images[0])} alt={product.name} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 rounded bg-secondary/60 border border-gray-700 flex items-center justify-center"><Package className="w-5 h-5 text-gray-500" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{product.name || 'Product'}</p>
                          <p className="text-sm text-gray-400">Stock: {offer.availableKeysCount ?? 0} | Total: {offer.totalKeysCount ?? 0}</p>
                          <Badge className={`${sCfg.className} mt-1 text-xs`}>{sCfg.label}</Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedOffer && (
        <Card className="bg-primary border-gray-700">
          <CardHeader>
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <CardTitle className="text-white">License Keys — {selectedOffer.productId?.name}</CardTitle>
                {keysPagination.total !== undefined && (
                  <p className="text-sm text-gray-400 mt-1">
                    Total: {keysPagination.total} | Active: {transformedKeys.filter((k) => k.status === 'Active').length} | Used: {transformedKeys.filter((k) => k.status === 'Used').length} | Refunded: {transformedKeys.filter((k) => k.status === 'Refunded').length}
                  </p>
                )}
              </div>
              <Button onClick={() => syncStockMutation.mutate(selectedOfferId)} disabled={syncStockMutation.isPending} variant="outline" className="border-gray-700 text-gray-300">
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
                          const displayKey = isRevealed ? formatKeyForDisplay(showKeys[keyIdStr]) : (key.maskedKey || maskKey(null));
                          return (
                            <TableRow key={key._id} className="border-gray-700">
                              <TableCell className="text-white">
                                <div className="flex items-center gap-2">
                                  <code className="text-sm font-mono bg-secondary px-2 py-1 rounded whitespace-pre-wrap break-words max-w-md">{displayKey}</code>
                                  <Button size="sm" variant="ghost" onClick={() => handleRevealKey(key._id)} disabled={revealKeyMutation.isPending} className="h-8 w-8 p-0" title={isRevealed ? 'Hide license key' : 'Show license key'}>
                                    {isRevealed ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-white capitalize">{key.keyType || 'other'}</TableCell>
                              <TableCell>{getStatusBadge(key.status)}</TableCell>
                              <TableCell className="text-gray-400">{key.createdAt ? new Date(key.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</TableCell>
                              <TableCell className="text-gray-400">{key.assignedAt ? new Date(key.assignedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</TableCell>
                              <TableCell>
                                {key.status === 'Active' ? (
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteClick(key)} disabled={deleteKeyMutation.isPending} className="text-red-400 hover:text-red-300 hover:bg-red-500/10" title="Delete license key">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <span className="text-gray-500 text-sm">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableEmptyRow colSpan={6}>
                          <EmptyState
                            icon={Key}
                            title="No keys found for this listing"
                            description="Upload keys using the “Upload Inventory” button above"
                            className="py-0"
                          />
                        </TableEmptyRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <Pagination page={keysPage} totalPages={keysPagination.pages || 1} onPageChange={setKeysPage} total={keysPagination.total || 0} totalNoun="keys" />
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
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setKeyToDelete(null); }} className="border-gray-700 text-gray-300">Cancel</Button>
            <Button onClick={() => keyToDelete && deleteKeyMutation.mutate(keyToDelete._id)} disabled={deleteKeyMutation.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {deleteKeyMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Modal (offer mode) */}
      <BulkUploadModal
        open={isUploadOpen}
        offers={offers}
        onOpenChange={(open) => {
          setIsUploadOpen(open);
          if (!open) {
            queryClient.invalidateQueries({ queryKey: ['license-offers'] });
            if (selectedOfferId) queryClient.invalidateQueries({ queryKey: ['offer-keys', selectedOfferId] });
            setKeysPage(1);
          }
        }}
      />
    </div>
  );
};

export default SellerLicenseKeys;
