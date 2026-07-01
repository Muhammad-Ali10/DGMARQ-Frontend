import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { offerAPI, regionAPI } from '@services/api';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Loading, ErrorMessage } from '@components/ui/loading';
import SafeImage from '@components/ui/safe-image';
import { Package, Search, Plus, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import '../dashboard-fx.css';

const selectCls = 'w-full bg-secondary border border-gray-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent';

const extractList = (res) => {
  const d = res?.data?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.docs)) return d.docs;
  if (d && typeof d === 'object') {
    const arr = Object.values(d).find((v) => Array.isArray(v));
    if (arr) return arr;
  }
  return [];
};

const STATUS_LABEL = {
  pending: { variant: 'warning', label: 'Pending' },
  approved: { variant: 'success', label: 'Listed' },
  active: { variant: 'success', label: 'Listed' },
  rejected: { variant: 'destructive', label: 'Rejected' },
};

const SellerCatalog = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [listing, setListing] = useState(null); // master being listed
  const [form, setForm] = useState({ price: '', discount: '', region: '', isFeatured: false, accountEmail: '', accountWebsite: '' });

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['seller-catalog', page, search],
    queryFn: () => offerAPI.browseCatalog({ page, limit: 12, ...(search ? { search } : {}) }).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });

  const { data: regions = [] } = useQuery({
    queryKey: ['regions-all'],
    queryFn: () => regionAPI.getRegions({ limit: 1000 }).then(extractList),
    staleTime: 5 * 60 * 1000,
    enabled: !!listing,
  });

  const products = data?.products || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  const createMutation = useMutation({
    mutationFn: (payload) => offerAPI.createOffer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-catalog'] });
      toast.success('Offer submitted for approval');
      setListing(null);
      navigate('/seller/offers');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create offer'),
  });

  const openListing = (p) => {
    setForm({ price: '', discount: '', region: '', isFeatured: false, accountEmail: '', accountWebsite: '' });
    setListing(p);
  };

  const submit = () => {
    if (form.price === '' || Number(form.price) < 0 || Number.isNaN(Number(form.price))) {
      toast.warning('Enter a valid price'); return;
    }
    createMutation.mutate({
      productId: listing._id,
      price: Number(form.price),
      discount: Number(form.discount) || 0,
      region: form.region || undefined,
      isFeatured: form.isFeatured,
      accountEmail: form.accountEmail || undefined,
      accountWebsite: form.accountWebsite || undefined,
    });
  };

  if (isLoading && !products.length) return <Loading message="Loading catalog..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || 'Error loading catalog'} />;

  const isAccount = listing?.productType === 'ACCOUNT_BASED';

  return (
    <div className="dash-fx space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="dash-icon-chip"><Package className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Browse Catalog</h1>
            <p className="text-sm text-gray-400 mt-1">Find a product and list your offer. Product details are fixed by the catalog — you set price, stock & region.</p>
          </div>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search products…" className="pl-9 bg-secondary border-gray-700 text-white" />
        </div>
      </div>

      <Card className="dash-card">
        <CardHeader className="dash-card-head">
          <CardTitle className="text-white text-xl font-semibold">{pagination.total} products</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-8 h-8 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No products found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 bg-secondary/30 hover:bg-secondary/30">
                      <TableHead className="text-gray-300">Product</TableHead>
                      <TableHead className="text-gray-300">Category</TableHead>
                      <TableHead className="text-gray-300">Platform</TableHead>
                      <TableHead className="text-gray-300">Type</TableHead>
                      <TableHead className="text-gray-300 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p) => (
                      <TableRow key={p._id} className="border-gray-700 hover:bg-secondary/20">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {p.images?.length ? (
                              <SafeImage src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover rounded border border-gray-700" />
                            ) : (
                              <div className="w-10 h-10 bg-secondary/50 rounded border border-gray-700 flex items-center justify-center"><Package className="w-4 h-4 text-gray-500" /></div>
                            )}
                            <span className="text-white font-medium max-w-xs truncate">{p.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">{p.categoryId?.name || '—'}</TableCell>
                        <TableCell className="text-gray-300">{p.platform?.name || '—'}</TableCell>
                        <TableCell><Badge variant="default" className="text-xs">{p.productType}</Badge></TableCell>
                        <TableCell className="text-right">
                          {p.myOfferStatus ? (
                            <Badge variant={STATUS_LABEL[p.myOfferStatus]?.variant || 'default'}>
                              {STATUS_LABEL[p.myOfferStatus]?.label || p.myOfferStatus}
                            </Badge>
                          ) : (
                            <Button size="sm" className="bg-accent hover:bg-blue-700" onClick={() => openListing(p)}>
                              <Plus className="h-4 w-4 mr-1" /> List
                            </Button>
                          )}
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

      {/* Create offer modal */}
      <Dialog open={!!listing} onOpenChange={(o) => !o && setListing(null)}>
        <DialogContent className="bg-primary border-gray-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold">List your offer</DialogTitle>
            <DialogDescription className="text-gray-400 truncate">{listing?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-gray-300 text-sm">Price (USD) *</Label>
                <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="bg-secondary border-gray-700 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-300 text-sm">Discount (%)</Label>
                <Input type="number" min="0" max="100" value={form.discount} onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))} className="bg-secondary border-gray-700 text-white" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Region</Label>
              <select value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} className={selectCls}>
                <option value="">Global / Not specified</option>
                {regions.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
              </select>
            </div>
            {isAccount && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-gray-300 text-sm">Account Email</Label>
                  <Input value={form.accountEmail} onChange={(e) => setForm((f) => ({ ...f, accountEmail: e.target.value }))} className="bg-secondary border-gray-700 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-300 text-sm">Website</Label>
                  <Input value={form.accountWebsite} onChange={(e) => setForm((f) => ({ ...f, accountWebsite: e.target.value }))} className="bg-secondary border-gray-700 text-white" />
                </div>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" aria-label="Feature this offer" checked={form.isFeatured} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))} className="accent-blue-600" />
              Feature this offer (higher commission applies)
            </label>
            <p className="text-xs text-gray-500">After approval you can add inventory (keys/accounts) from “My Offers”. Stock is taken from your uploaded inventory.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" className="border-gray-700" onClick={() => setListing(null)}>Cancel</Button>
              <Button className="bg-accent hover:bg-blue-700" disabled={createMutation.isPending} onClick={submit}>
                {createMutation.isPending ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Submitting…</> : 'Submit for approval'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerCatalog;
