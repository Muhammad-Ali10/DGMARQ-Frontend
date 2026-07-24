import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { StatCard, StatCardGrid } from '@components/common/StatCard';
import { Loading, ErrorMessage } from '@components/ui/loading';
import { Users, Store, ShoppingCart, DollarSign, AlertCircle, Package, Headphones, TrendingDown, Receipt } from 'lucide-react';

const AdminDashboard = () => {
  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const response = await adminAPI.getDashboardStats();
      return response.data.data;
    },
    retry: 1,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const { data: handlingFeeStats } = useQuery({
    queryKey: ['admin-handling-fee-stats'],
    queryFn: async () => {
      const response = await adminAPI.getHandlingFeeStats();
      return response.data.data;
    },
    retry: 1,
  });

  if (isLoading) {
    return <Loading message="Loading dashboard statistics..." />;
  }

  if (isError) {
    return (
      <ErrorMessage 
        message={error?.response?.data?.message || 'Error loading dashboard statistics'} 
      />
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.users?.total || 0,
      icon: Users,
      color: 'text-blue-500',
      description: 'All registered users',
    },
    {
      title: 'Customers',
      value: stats?.users?.customers || 0,
      icon: Users,
      color: 'text-indigo-500',
      description: 'Regular customers',
    },
    {
      title: 'Active Sellers',
      value: stats?.users?.sellers?.active || 0,
      icon: Store,
      color: 'text-green-500',
      description: 'Approved sellers',
    },
    {
      title: 'Pending Sellers',
      value: stats?.users?.sellers?.pending || 0,
      icon: AlertCircle,
      color: 'text-orange-500',
      description: 'Awaiting approval',
    },
    {
      title: 'Total Orders',
      value: stats?.orders?.total || 0,
      icon: ShoppingCart,
      color: 'text-purple-500',
      description: 'All paid orders',
    },
    {
      title: 'Total Revenue',
      value: `$${(stats?.revenue?.total || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-yellow-500',
      description: 'Total platform revenue',
    },
    {
      title: 'Handling Fees Collected',
      value: `$${(handlingFeeStats?.totalHandlingFees ?? 0).toFixed(2)}`,
      icon: Receipt,
      color: 'text-teal-500',
      description: `Today: $${(handlingFeeStats?.daily ?? 0).toFixed(2)} · Week: $${(handlingFeeStats?.weekly ?? 0).toFixed(2)} · Month: $${(handlingFeeStats?.monthly ?? 0).toFixed(2)}`,
    },
    {
      title: 'Pending Products',
      value: stats?.products?.pending || 0,
      icon: Package,
      color: 'text-red-500',
      description: 'Awaiting approval',
    },
    {
      title: 'Pending Payouts',
      value: stats?.payouts?.pending || 0,
      icon: DollarSign,
      color: 'text-pink-500',
      description: 'Awaiting processing',
    },
    {
      // Phase 2: amounts from the unified balance source so admin and seller views match.
      title: 'Available Payouts',
      value: `$${(stats?.payouts?.availableAmount ?? 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-500',
      description: `${stats?.payouts?.availableCount ?? 0} line(s) ready`,
    },
    {
      title: 'Pending Payouts ($)',
      value: `$${(stats?.payouts?.pendingAmount ?? 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-yellow-500',
      description: `${stats?.payouts?.pendingCount ?? 0} line(s) on hold`,
    },
    {
      title: 'Paid Out',
      value: `$${(stats?.payouts?.releasedAmount ?? 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-blue-500',
      description: `${stats?.payouts?.releasedCount ?? 0} line(s) released`,
    },
    {
      title: 'Active Conversations',
      value: stats?.conversations?.active || 0,
      icon: Headphones,
      color: 'text-cyan-500',
      description: 'Support chats',
    },
    {
      title: 'Total Refunds',
      value: stats?.refunds?.total || 0,
      icon: TrendingDown,
      color: 'text-red-500',
      description: `${stats?.refunds?.pending || 0} pending`,
    },
    {
      title: 'Recent Orders',
      value: stats?.orders?.recent || 0,
      icon: ShoppingCart,
      color: 'text-emerald-500',
      description: 'Last 7 days',
    },
  ];

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">Overview of your platform</p>
      </div>

      <StatCardGrid>
        {statCards.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            description={stat.description}
          />
        ))}
      </StatCardGrid>

      {/* Additional Metrics Section */}
      {stats?.metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-primary border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Platform Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Conversion Rate</span>
                  <span className="text-white font-semibold">
                    {stats.metrics.conversionRate || '0.00'}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Revenue</span>
                  <span className="text-green-400 font-semibold">
                    ${(stats.revenue?.total || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Orders</span>
                  <span className="text-white font-semibold">
                    {stats.orders?.total || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Refund Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Refunds</span>
                  <span className="text-white font-semibold">
                    {stats.refunds?.total || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Pending Refunds</span>
                  <span className="text-yellow-400 font-semibold">
                    {stats.refunds?.pending || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Approved Refunds</span>
                  <span className="text-green-400 font-semibold">
                    {stats.refunds?.approved || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
