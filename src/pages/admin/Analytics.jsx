import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Users, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';

const Analytics = () => {
  const { data: dashboard, isLoading: isLoadingDashboard, isError: isErrorDashboard } = useQuery({
    queryKey: ['admin-analytics-dashboard'],
    queryFn: async () => {
      try {
        const response = await analyticsAPI.getDashboard();
        return response.data.data;
      } catch (err) {
        console.error('Analytics dashboard error:', err);
        throw err;
      }
    },
    retry: 1,
  });

  const { data: topProducts, isLoading: isLoadingTop, isError: isErrorTop } = useQuery({
    queryKey: ['top-products'],
    queryFn: async () => {
      try {
        const response = await analyticsAPI.getTopProducts();
        return response.data.data;
      } catch (err) {
        console.error('Top products error:', err);
        throw err;
      }
    },
    retry: 1,
  });

  const { data: realtime, isLoading: isLoadingRealtime, isError: isErrorRealtime } = useQuery({
    queryKey: ['realtime-counters'],
    queryFn: async () => {
      try {
        const response = await analyticsAPI.getRealTimeCounters();
        return response.data.data;
      } catch (err) {
        console.error('Realtime counters error:', err);
        throw err;
      }
    },
    retry: 1,
  });

  const isLoading = isLoadingDashboard || isLoadingTop || isLoadingRealtime;
  const isError = isErrorDashboard || isErrorTop || isErrorRealtime;

  if (isLoading) return <Loading message="Loading analytics..." />;
  if (isError) return <ErrorMessage message="Error loading analytics data" />;

  const realtimeCards = [
    { title: 'Active Users', value: realtime?.activeUsers || 0, icon: Users, color: 'text-blue-500' },
    { title: 'Online Now', value: realtime?.onlineNow || 0, icon: TrendingUp, color: 'text-green-500' },
    { title: "Today's Orders", value: realtime?.todayOrders || 0, icon: ShoppingCart, color: 'text-purple-500' },
    { title: "Today's Revenue", value: `$${realtime?.todayRevenue?.toFixed(2) || '0.00'}`, icon: DollarSign, color: 'text-yellow-500' },
  ];

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Analytics Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">Platform analytics and insights</p>
      </div>

      {realtime && (
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {topProducts && (
        <Card className="bg-primary border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.products?.length > 0 ? (
              <div className="space-y-2">
                {topProducts.products.map((product, index) => (
                  <div key={product._id} className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <span className="text-white font-medium">
                      #{index + 1} {product.name}
                    </span>
                    <span className="text-accent font-semibold">{product.sales || 0} sales</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">No products data available</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analytics;
