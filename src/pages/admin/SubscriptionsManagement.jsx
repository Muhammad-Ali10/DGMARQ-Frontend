import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { subscriptionAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Users, DollarSign, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const SubscriptionsManagement = () => {
  const [page, setPage] = useState(1);

  const { data: subsData, isLoading: isLoadingSubs, isError: isErrorSubs, error: errorSubs } = useQuery({
    queryKey: ['admin-subscriptions', page],
    queryFn: async () => {
      try {
        const response = await subscriptionAPI.getAllSubscriptions({ page, limit: 10 });
        return response.data.data;
      } catch (err) {
        throw err;
      }
    },
    retry: 1,
  });

  const subscriptionList = subsData?.subscriptions || [];
  const pagination = subsData?.pagination || {};
  const totalItems = pagination.total ?? 0;
  const totalPages = pagination.pages ?? 1;
  const showPagination = totalItems > 0;

  const { data: stats, isLoading: isLoadingStats, isError: isErrorStats, error: errorStats } = useQuery({
    queryKey: ['subscription-stats'],
    queryFn: async () => {
      try {
        const response = await subscriptionAPI.getSubscriptionStats();
        return response.data.data;
      } catch (err) {
        throw err;
      }
    },
    retry: 1,
  });

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      cancelled: 'destructive',
      expired: 'warning',
      pending: 'default',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (isLoadingSubs || isLoadingStats) return <Loading message="Loading subscriptions..." />;
  if (isErrorSubs || isErrorStats) return <ErrorMessage message={(errorSubs || errorStats)?.response?.data?.message || "Error loading subscriptions"} />;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Subscriptions Management</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">View and manage user subscriptions</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Subscriptions</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.totalSubscriptions || 0}</p>
                </div>
                <Users className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-primary border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.activeSubscriptions || 0}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-primary border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    ${(stats.totalRevenue || 0).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">All Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">User</TableHead>
                  <TableHead className="text-gray-300">Plan</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Start Date</TableHead>
                  <TableHead className="text-gray-300">End Date</TableHead>
                  <TableHead className="text-gray-300">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptionList.length > 0 ? (
                  subscriptionList.map((subscription) => (
                    <TableRow key={subscription._id} className="border-gray-700">
                      <TableCell className="text-white">
                        {subscription.userId?.name || subscription.userId?.email || 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-400">{subscription.plan || 'Standard'}</TableCell>
                      <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                      <TableCell className="text-gray-400">
                        {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-white font-semibold">
                        ${subscription.amount?.toFixed(2) || '0.00'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                      No subscriptions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {showPagination && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-700">
              <span className="text-sm text-gray-400">
                Page {page} of {totalPages} ({totalItems} total)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionsManagement;

