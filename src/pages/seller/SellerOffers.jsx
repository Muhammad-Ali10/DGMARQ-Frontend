import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { offerAPI } from '@services/api';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Loading, ErrorMessage } from '@components/ui/loading';
import SafeImage from '@components/ui/safe-image';
import { Store, Package, Edit, Trash2, Boxes, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import '../dashboard-fx.css';

const STATUS = {
  pending: { variant: 'warning', label: 'Pending approval' },
  approved: { variant: 'success', label: 'Live' },
  active: { variant: 'success', label: 'Live' },
  rejected: { variant: 'destructive', label: 'Rejected' },
  delisted: { variant: 'secondary', label: 'Delisted' },
};

const SellerOffers = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['my-offers', page],
    queryFn: () => offerAPI.getMyOffers({ page, limit: 10 }).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });

  const offers = data?.offers || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  // Deep-link focus: notifications/emails link here as ?productId=<id> so the
  // seller lands on the relevant offer. Filter to it when it's on this page;
  // otherwise fall back to showing all (it may be on another page).
  const focusProductId = searchParams.get('productId');
  const focusMatches = focusProductId
    ? offers.filter((o) => String(o.productId?._id || o.productId) === String(focusProductId))
    : [];
  const displayOffers = focusMatches.length > 0 ? focusMatches : offers;
  const focusName = focusMatches[0]?.productId?.name;
  const clearFocus = () => { searchParams.delete('productId'); setSearchParams(searchParams, { replace: true }); };

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['my-offers'] });

  const deleteMutation = useMutation({
    mutationFn: (id) => offerAPI.deleteOffer(id),
    onSuccess: () => { refresh(); toast.success('Offer removed'); setToDelete(null); },
    onError: (err) => toast.error(err?.response?.data?.message || 'Delete failed'),
  });

  if (isLoading && !offers.length) return <Loading message="Loading your offers..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || 'Error loading offers'} />;

  return (
    <div className="dash-fx space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="dash-icon-chip"><Store className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">My Offers</h1>
            <p className="text-sm text-gray-400 mt-1">Your listings against catalog products. Add inventory to go in stock.</p>
          </div>
        </div>
        <Button className="dash-primary" onClick={() => navigate('/seller/catalog')}>
          <Package className="w-4 h-4 mr-2" /> Browse Catalog
        </Button>
      </div>

      {focusProductId && focusMatches.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/10 px-4 py-2.5">
          <span className="text-sm text-gray-200">Showing your offer for <strong className="text-white">{focusName || 'the selected product'}</strong></span>
          <Button size="sm" variant="outline" className="border-gray-600" onClick={clearFocus}>Show all offers</Button>
        </div>
      )}

      <Card className="dash-card">
        <CardHeader className="dash-card-head">
          <CardTitle className="text-white text-xl font-semibold">{pagination.total} offers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {offers.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-8 h-8 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">You haven’t listed any offers yet</p>
              <Button variant="outline" className="border-gray-700 mt-4" onClick={() => navigate('/seller/catalog')}>Browse Catalog</Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 bg-secondary/30 hover:bg-secondary/30">
                      <TableHead className="text-gray-300">Product</TableHead>
                      <TableHead className="text-gray-300">Price</TableHead>
                      <TableHead className="text-gray-300">Stock</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayOffers.map((o) => (
                      <TableRow key={o._id} className="border-gray-700 hover:bg-secondary/20">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {o.productId?.images?.length ? (
                              <SafeImage src={o.productId.images[0]} alt={o.productId?.name} className="w-10 h-10 object-cover rounded border border-gray-700" />
                            ) : (
                              <div className="w-10 h-10 bg-secondary/50 rounded border border-gray-700 flex items-center justify-center"><Package className="w-4 h-4 text-gray-500" /></div>
                            )}
                            <div>
                              <div className="text-white font-medium max-w-xs truncate">{o.productId?.name || 'N/A'}</div>
                              {o.rejectionReason && o.status === 'rejected' && (
                                <div className="text-xs text-red-400 max-w-xs truncate" title={o.rejectionReason}>Reason: {o.rejectionReason}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-white">${Number(o.price || 0).toFixed(2)}</TableCell>
                        <TableCell><Badge variant={o.availableKeysCount > 0 ? 'success' : 'destructive'}>{o.availableKeysCount || 0}</Badge></TableCell>
                        <TableCell><Badge variant={STATUS[o.status]?.variant || 'default'}>{STATUS[o.status]?.label || o.status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 justify-end">
                            <Button size="sm" variant="outline" className="border-gray-700" title="Manage inventory / license keys" onClick={() => navigate('/seller/license-keys')}>
                              <Boxes className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="border-gray-700" title="Edit" onClick={() => navigate(`/seller/offers/${o._id}/edit`)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" className="hover:bg-red-700" title="Remove" onClick={() => setToDelete(o)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {pagination.total > 0 && (
                <div className="flex items-center justify-between gap-4 p-4 border-t border-gray-700">
                  <span className="text-sm text-gray-400">Page {pagination.page} of {pagination.pages}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-gray-700" disabled={pagination.page <= 1} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                    </Button>
                    <Button variant="outline" size="sm" className="border-gray-700" disabled={pagination.page >= pagination.pages} onClick={() => setPage(page + 1)}>
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete confirm */}
      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="bg-primary border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold">Remove offer</DialogTitle>
            <DialogDescription className="text-gray-400">
              This removes your listing AND its inventory for “{toDelete?.productId?.name}”. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" className="border-gray-700" onClick={() => setToDelete(null)}>Cancel</Button>
            <Button variant="destructive" className="hover:bg-red-700" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(toDelete._id)}>
              {deleteMutation.isPending ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Removing…</> : <><Trash2 className="w-4 h-4 mr-2" />Remove</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerOffers;
