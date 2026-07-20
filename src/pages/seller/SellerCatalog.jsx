import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { offerAPI } from '@services/api';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Loading, ErrorMessage } from '@components/ui/loading';
import SafeImage from '@components/ui/safe-image';
import { Package, Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import '../dashboard-fx.css';

const STATUS_LABEL = {
  pending: { variant: 'warning', label: 'Pending' },
  approved: { variant: 'success', label: 'Listed' },
  active: { variant: 'success', label: 'Listed' },
  rejected: { variant: 'destructive', label: 'Rejected' },
};

const SellerCatalog = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['seller-catalog', page, search],
    queryFn: () => offerAPI.browseCatalog({ page, limit: 12, ...(search ? { search } : {}) }).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });

  const products = data?.products || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  if (isLoading && !products.length) return <Loading message="Loading catalog..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || 'Error loading catalog'} />;

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
                            <Button size="sm" className="bg-accent hover:bg-blue-700" onClick={() => navigate(`/seller/catalog/${p._id}/list`)}>
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
    </div>
  );
};

export default SellerCatalog;
