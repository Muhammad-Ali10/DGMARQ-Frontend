import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { offerAPI } from '@services/api';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Badge } from '@components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Loading, ErrorMessage } from '@components/ui/loading';
import SafeImage from '@components/ui/safe-image';
import { CheckCircle2, XCircle, Clock, Store, Package, Eye } from 'lucide-react';
import { Pagination } from '@components/common/Pagination';
import '../dashboard-fx.css';

const SellerOffersManagement = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('pending');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-offers', tab, page],
    queryFn: () => offerAPI.adminGetOffers({ status: tab, page, limit: 10 }).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });

  // Tab counts = number of PRODUCTS per status, so the badge always matches the
  // number of rows in the list (rows are grouped by product, not per offer).
  const pendingCountQ = useQuery({ queryKey: ['admin-offers-count', 'pending'], queryFn: () => offerAPI.adminGetOffers({ status: 'pending', limit: 1 }).then((r) => r.data.data.pagination.total) });
  const approvedCountQ = useQuery({ queryKey: ['admin-offers-count', 'approved'], queryFn: () => offerAPI.adminGetOffers({ status: 'approved', limit: 1 }).then((r) => r.data.data.pagination.total) });
  const rejectedCountQ = useQuery({ queryKey: ['admin-offers-count', 'rejected'], queryFn: () => offerAPI.adminGetOffers({ status: 'rejected', limit: 1 }).then((r) => r.data.data.pagination.total) });
  const counts = { pending: pendingCountQ.data ?? 0, approved: approvedCountQ.data ?? 0, rejected: rejectedCountQ.data ?? 0 };

  const groups = data?.groups || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  if (isLoading && !groups.length) return <Loading message="Loading offers..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || 'Error loading offers'} />;

  return (
    <div className="dash-fx space-y-6 px-4 sm:px-0">
      <div className="flex items-center gap-3">
        <div className="dash-icon-chip"><Store className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Seller Offers</h1>
          <p className="text-sm text-gray-400 mt-1">Products that sellers have listed offers on. Open a product to review &amp; approve its offers.</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-secondary border border-gray-700">
          <TabsTrigger value="pending" className="data-[state=active]:bg-accent data-[state=active]:text-white text-gray-300"><Clock className="h-4 w-4 mr-2" /> Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-accent data-[state=active]:text-white text-gray-300"><CheckCircle2 className="h-4 w-4 mr-2" /> Approved ({counts.approved})</TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-accent data-[state=active]:text-white text-gray-300"><XCircle className="h-4 w-4 mr-2" /> Rejected ({counts.rejected})</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="dash-card">
        <CardHeader className="dash-card-head">
          <CardTitle className="text-white text-xl font-semibold capitalize">{tab} offers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {groups.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-8 h-8 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No {tab} offers</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 bg-secondary/30 hover:bg-secondary/30">
                      <TableHead className="text-gray-300">Product</TableHead>
                      <TableHead className="text-gray-300">Offers</TableHead>
                      <TableHead className="text-gray-300">Total Stock</TableHead>
                      <TableHead className="text-gray-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((g) => {
                      const totalStock = g.offers.reduce((s, o) => s + (o.availableKeysCount || 0), 0);
                      return (
                        <TableRow key={g.product?._id || g.offers?.[0]?._id} className="border-gray-700 hover:bg-secondary/20">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {g.product?.images?.length ? (
                                <SafeImage src={g.product.images[0]} alt={g.product?.name} className="w-10 h-10 object-cover rounded border border-gray-700" />
                              ) : (
                                <div className="w-10 h-10 bg-secondary/50 rounded border border-gray-700 flex items-center justify-center"><Package className="w-4 h-4 text-gray-500" /></div>
                              )}
                              <span className="text-white font-medium max-w-md truncate">{g.product?.name || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="default">{g.offers.length} offer{g.offers.length > 1 ? 's' : ''}</Badge></TableCell>
                          <TableCell><Badge variant={totalStock > 0 ? 'success' : 'destructive'}>{totalStock}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" className="border-gray-700" onClick={() => g.product?._id && navigate(`/admin/products/${g.product._id}`)}>
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <Pagination page={page} totalPages={pagination.pages} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerOffersManagement;
