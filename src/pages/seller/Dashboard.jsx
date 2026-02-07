import { useQuery } from '@tanstack/react-query';
import { sellerAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { DollarSign, Package, ShoppingCart, TrendingUp, User, RefreshCw, AlertCircle } from 'lucide-react';

const SellerDashboard = () => {
  const { data: sellerInfo, isLoading: infoLoading, isError: infoError } = useQuery({
    queryKey: ['seller-info'],
    queryFn: () => sellerAPI.getSellerInfo().then(res => res.data.data),
    refetchOnWindowFocus: true,
  });

  const { data: balance, isLoading: balanceLoading, isError: balanceError } = useQuery({
    queryKey: ['seller-balance'],
    queryFn: () => sellerAPI.getPayoutBalance().then(res => res.data.data),
    refetchOnWindowFocus: true,
  });

  const { data: performanceMetrics, isLoading: metricsLoading, isError: metricsError } = useQuery({
    queryKey: ['seller-performance-metrics'],
    queryFn: () => sellerAPI.getPerformanceMetrics().then(res => res.data.data),
    refetchOnWindowFocus: true,
  });

  const isLoading = infoLoading || balanceLoading || metricsLoading;
  const isError = infoError || balanceError || metricsError;

  if (isLoading) return <Loading message="Loading seller dashboard..." />;
  if (isError) return <ErrorMessage message="Error loading seller dashboard" />;

  const statsCards = [
    {
      title: 'Available Balance',
      value: `$${balance?.available?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'text-green-500',
      description: 'Ready to withdraw',
    },
    {
      title: 'Pending Balance',
      value: `$${balance?.pending?.amount?.toFixed(2) || '0.00'}`,
      icon: TrendingUp,
      color: 'text-yellow-500',
      description: 'On hold (15 days)',
    },
    {
      title: 'Total Revenue',
      value: `$${(performanceMetrics?.sales?.totalRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-blue-500',
      description: 'All-time revenue',
    },
    {
      title: 'Net Earnings',
      value: `$${(performanceMetrics?.sales?.netEarnings || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-purple-500',
      description: 'After commission',
    },
    {
      title: 'Total Sales',
      value: performanceMetrics?.sales?.totalSales || 0,
      icon: ShoppingCart,
      color: 'text-indigo-500',
      description: 'Units sold',
    },
    {
      title: 'Total Products',
      value: performanceMetrics?.products?.total || sellerInfo?.stats?.totalProducts || 0,
      icon: Package,
      color: 'text-cyan-500',
      description: `${performanceMetrics?.products?.active || 0} active`,
    },
    {
      title: 'Total Orders',
      value: sellerInfo?.stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'text-pink-500',
      description: 'All paid orders',
    },
    {
      title: 'Average Rating',
      value: performanceMetrics?.reviews?.averageRating 
        ? performanceMetrics.reviews.averageRating.toFixed(1)
        : 'N/A',
      icon: TrendingUp,
      color: 'text-orange-500',
      description: `${performanceMetrics?.reviews?.totalReviews || 0} reviews`,
    },
  ];

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Seller Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">Welcome back, {sellerInfo?.shopName || 'Seller'}</p>
        </div>
        
        {/* Switch to Customer Dashboard Button - Always show (sellers can shop as customers) */}
        <div className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
          <Button
            variant="outline"
            onClick={() => {
              // Set flag to allow access to customer dashboard
              sessionStorage.setItem('allowCustomerAccess', 'true');
              // Use window.location to force full navigation
              window.location.href = '/user/dashboard';
            }}
            className="w-full sm:w-auto border-2 border-accent text-white hover:bg-accent/20 hover:border-accent/90 bg-transparent dark:bg-transparent dark:border-accent dark:text-white whitespace-nowrap font-medium shadow-sm"
          >
            <User className="h-4 w-4 mr-2" />
            Switch to Customer Dashboard
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-primary border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                {stat.description && (
                  <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Metrics Section */}
      {performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-primary border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Sales Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Revenue</span>
                  <span className="text-white font-semibold">
                    ${(performanceMetrics.sales?.totalRevenue || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Net Earnings</span>
                  <span className="text-green-400 font-semibold">
                    ${(performanceMetrics.sales?.netEarnings || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Commission</span>
                  <span className="text-yellow-400 font-semibold">
                    ${(performanceMetrics.sales?.totalCommission || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Sales</span>
                  <span className="text-white font-semibold">
                    {performanceMetrics.sales?.totalSales || 0} units
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Products</span>
                  <span className="text-white font-semibold">
                    {performanceMetrics.products?.total || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Active Products</span>
                  <span className="text-green-400 font-semibold">
                    {performanceMetrics.products?.active || 0}
                  </span>
                </div>
                {performanceMetrics.reviews && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Total Reviews</span>
                      <span className="text-white font-semibold">
                        {performanceMetrics.reviews.totalReviews || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Average Rating</span>
                      <span className="text-yellow-400 font-semibold">
                        {performanceMetrics.reviews.averageRating 
                          ? performanceMetrics.reviews.averageRating.toFixed(1)
                          : 'N/A'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hold Period Information */}
      {balance?.pending?.amount > 0 && balance?.pending?.daysUntilAvailable > 0 && (
        <Card className="bg-primary border-gray-700 border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="shrink-0">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-yellow-500" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Earnings on Hold</h3>
                <p className="text-gray-300 text-sm">
                  You have <span className="font-semibold text-yellow-400">${balance.pending.amount.toFixed(2)}</span> on hold. 
                  Your payout will be available <span className="font-semibold">{balance.pending.daysUntilAvailable} day{balance.pending.daysUntilAvailable > 1 ? 's' : ''}</span> after order completion (15-day hold period).
                  {balance.pending.earliestReleaseDate && (
                    <span className="block mt-1 text-xs text-gray-400">
                      Earliest release date: {new Date(balance.pending.earliestReleaseDate).toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {sellerInfo && (
        <Card className="bg-primary border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Shop Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={sellerInfo.status === 'approved' ? 'success' : 'warning'}>
                {sellerInfo.status}
              </Badge>
              <span className="text-gray-300">{sellerInfo.shopName}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SellerDashboard;
