import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Users, ShoppingCart, DollarSign, TrendingUp, Package, Eye, Heart } from 'lucide-react';

const Analytics = () => {
  const { data: dashboard, isLoading: isLoadingDashboard, isError: isErrorDashboard, error: dashboardError } = useQuery({
    queryKey: ['admin-analytics-dashboard'],
    queryFn: async () => {
      try {
        const response = await analyticsAPI.getDashboard();
        return response.data.data;
      } catch (err) {
        throw err;
      }
    },
    retry: 2,
    refetchOnWindowFocus: true,
  });

  const { data: topProducts, isLoading: isLoadingTop, isError: isErrorTop, error: topProductsError } = useQuery({
    queryKey: ['top-products'],
    queryFn: async () => {
      try {
        const response = await analyticsAPI.getTopProducts({ limit: 10 });
        return response.data.data;
      } catch (err) {
        throw err;
      }
    },
    retry: 2,
    refetchOnWindowFocus: true,
  });

  const { data: realtime, isLoading: isLoadingRealtime, isError: isErrorRealtime, error: realtimeError } = useQuery({
    queryKey: ['realtime-counters'],
    queryFn: async () => {
      try {
        const response = await analyticsAPI.getRealTimeCounters();
        return response.data.data;
      } catch (err) {
        throw err;
      }
    },
    retry: 2,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const isLoading = isLoadingDashboard || isLoadingTop || isLoadingRealtime;
  const isError = isErrorDashboard || isErrorTop || isErrorRealtime;

  const realtimeCards = [
    { 
      title: 'Total Users', 
      value: realtime?.users?.total || 0, 
      icon: Users, 
      color: 'text-blue-500',
      description: `${realtime?.users?.active || 0} active`
    },
    { 
      title: 'Total Orders', 
      value: realtime?.orders?.total || 0, 
      icon: ShoppingCart, 
      color: 'text-purple-500',
      description: 'All paid orders'
    },
    { 
      title: 'Total Products', 
      value: realtime?.products?.total || 0, 
      icon: Package, 
      color: 'text-indigo-500',
      description: 'Active products'
    },
    { 
      title: 'Total Revenue', 
      value: `$${(realtime?.revenue?.total || 0).toFixed(2)}`, 
      icon: DollarSign, 
      color: 'text-yellow-500',
      description: 'Platform revenue'
    },
  ];

  const dashboardCards = dashboard?.totals ? [
    { 
      title: 'Total Sales', 
      value: dashboard.totals.sales || 0, 
      icon: ShoppingCart, 
      color: 'text-green-500',
      description: 'All-time sales'
    },
    { 
      title: 'Total Views', 
      value: dashboard.totals.views || 0, 
      icon: Eye, 
      color: 'text-blue-500',
      description: 'Product views'
    },
    { 
      title: 'Total Wishlists', 
      value: dashboard.totals.wishlists || 0, 
      icon: Heart, 
      color: 'text-pink-500',
      description: 'Saved items'
    },
  ] : [];

  if (isLoading) {
    return <Loading message="Loading analytics..." />;
  }

  if (isError) {
    const errorMessages = [];
    if (isErrorDashboard) errorMessages.push(`Dashboard: ${dashboardError?.response?.data?.message || 'Failed to load'}`);
    if (isErrorTop) errorMessages.push(`Top Products: ${topProductsError?.response?.data?.message || 'Failed to load'}`);
    if (isErrorRealtime) errorMessages.push(`Real-time: ${realtimeError?.response?.data?.message || 'Failed to load'}`);
    
    return (
      <ErrorMessage 
        message={`Error loading analytics: ${errorMessages.join(', ')}`} 
      />
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Analytics Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">Platform-wide analytics and insights</p>
      </div>

      {/* Real-time Statistics */}
      {realtime && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Real-Time Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {realtimeCards.map((stat, index) => {
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
        </div>
      )}

      {/* Analytics Totals */}
      {dashboard?.totals && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Analytics Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dashboardCards.map((stat, index) => {
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
        </div>
      )}

      {/* Top Products */}
      {topProducts && Array.isArray(topProducts) && topProducts.length > 0 && (
        <Card className="bg-primary border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Top Products by Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topProducts.map((product, index) => (
                <div key={product._id || product.productId?._id || index} className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    {product.productId?.images?.[0] && (
                      <img 
                        src={product.productId.images[0]} 
                        alt={product.productId.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <span className="text-white font-medium">
                      #{index + 1} {product.productId?.name || product.name || 'Unknown Product'}
                    </span>
                  </div>
                  <span className="text-accent font-semibold">
                    {product.salesCount || product.sales || 0} sales
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(!topProducts || (Array.isArray(topProducts) && topProducts.length === 0)) && !isLoading && (
        <Card className="bg-primary border-gray-700">
          <CardContent className="py-8 text-center text-gray-400">
            No top products data available yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analytics;
