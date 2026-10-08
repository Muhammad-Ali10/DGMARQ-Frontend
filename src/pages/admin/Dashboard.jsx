import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { StatCard, StatCardGrid } from '@components/common/StatCard';
import { Loading, ErrorMessage } from '@components/ui/loading';
import { Users, Store, ShoppingCart, DollarSign, AlertCircle, Package, Headphones, TrendingDown, Receipt, Snowflake, Clock } from 'lucide-react';
import useCurrency from '@hooks/useCurrency';

const AdminDashboard = () => {
  const { format: formatMoney } = useCurrency();
  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const response = await adminAPI.getDashboardStats();
      return response.data.data;
    },
    retry: 1,
    refetchOnWindowFocus: true,
    refetchInterval: 120000,
  });

  const { data: buyerFeeStats } = useQuery({
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

  const payouts = stats?.payouts || {};

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
      description: 'Users without a seller or admin role',
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
      description: 'Applications awaiting review',
    },
    {
      title: 'Total Orders',
      value: stats?.orders?.total || 0,
      icon: ShoppingCart,
      color: 'text-purple-500',
      description: 'All paid orders',
    },
    {
      title: 'Gross Sales',
      value: formatMoney(stats?.revenue?.gross || 0),
      icon: DollarSign,
      color: 'text-yellow-500',
      description: 'Product sales on paid orders, net of refunds, before buyer fees',
    },
    {
      title: 'Platform Earnings',
      value: formatMoney(stats?.revenue?.platform || 0),
      icon: DollarSign,
      color: 'text-emerald-500',
      description: 'Commission plus buyer fees, net of refunded commission',
    },
    {
      title: 'Buyer Fees Collected',
      value: formatMoney(buyerFeeStats?.totalBuyerFees ?? 0),
      icon: Receipt,
      color: 'text-teal-500',
      description: `Today: ${formatMoney(buyerFeeStats?.daily ?? 0)} · Week: ${formatMoney(buyerFeeStats?.weekly ?? 0)} · Month: ${formatMoney(buyerFeeStats?.monthly ?? 0)}`,
    },
    {
      title: 'Pending Offers',
      value: stats?.offers?.pending || 0,
      icon: Package,
      color: 'text-red-500',
      description: 'Seller listings awaiting approval',
    },
    {
      title: 'Available Payouts',
      value: formatMoney(payouts.availableAmount ?? 0),
      icon: DollarSign,
      color: 'text-green-500',
      description: 'Seller earnings ready to withdraw',
    },
    {
      title: 'Payouts On Hold',
      value: formatMoney(payouts.onHoldAmount ?? 0),
      icon: Clock,
      color: 'text-yellow-500',
      description: `${payouts.onHoldCount ?? 0} line(s) still in the holding period`,
    },
    {
      title: 'Frozen By Refunds',
      value: formatMoney(payouts.frozenAmount ?? 0),
      icon: Snowflake,
      color: 'text-cyan-500',
      description: 'Seller earnings paused by open refund requests',
    },
    {
      title: 'Withdrawals In Progress',
      value: formatMoney(payouts.inFlightAmount ?? 0),
      icon: DollarSign,
      color: 'text-pink-500',
      description: `${payouts.inFlightCount ?? 0} withdrawal(s) requested or processing`,
    },
    {
      title: 'Paid Out',
      value: formatMoney(payouts.releasedAmount ?? 0),
      icon: DollarSign,
      color: 'text-blue-500',
      description: 'Released to sellers',
    },
    {
      title: 'Open Support Tickets',
      value: stats?.support?.open || 0,
      icon: Headphones,
      color: 'text-cyan-500',
      description: 'Support chats not yet resolved',
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
        {statCards.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            description={stat.description}
          />
        ))}
      </StatCardGrid>

      {stats?.metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card variant="hud">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Platform Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Paid orders per user</span>
                  <span className="text-white font-semibold">
                    {Number(stats.metrics.ordersPerUser || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Gross Sales</span>
                  <span className="text-green-400 font-semibold">
                    {formatMoney(stats.revenue?.gross || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Platform Earnings</span>
                  <span className="text-green-400 font-semibold">
                    {formatMoney(stats.revenue?.platform || 0)}
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

          <Card variant="hud">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
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
                  <span className="text-gray-300">Completed Refunds</span>
                  <span className="text-green-400 font-semibold">
                    {stats.refunds?.completed || 0}
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
