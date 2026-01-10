import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Users, Store, ShoppingCart, DollarSign, AlertCircle, Package, Headphones } from 'lucide-react';

const AdminDashboard = () => {
  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      try {
        const response = await adminAPI.getDashboardStats();
        return response.data.data;
      } catch (err) {
        console.error('Dashboard stats error:', err);
        throw err;
      }
    },
    retry: 1,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
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
      title: 'Active Conversations',
      value: stats?.conversations?.active || 0,
      icon: Headphones,
      color: 'text-cyan-500',
      description: 'Support chats',
    },
  ];

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">Overview of your platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-primary border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboard;
