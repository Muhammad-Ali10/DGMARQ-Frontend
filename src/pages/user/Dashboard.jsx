import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { userAPI, notificationAPI, walletAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { ShoppingCart, Bell, Heart, Package, DollarSign, Eye, TrendingUp, Store, Wallet } from 'lucide-react';

const UserDashboard = () => {
  const { roles } = useSelector((state) => state.auth);
  const normalizedRoles = Array.isArray(roles) && roles.length > 0
    ? roles.map(r => String(r).toLowerCase().trim())
    : [];
  const hasSellerRole = normalizedRoles.includes('seller');
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['user-orders-summary'],
    queryFn: () => userAPI.getMyOrders({ page: 1, limit: 5 }).then(res => res.data.data),
  });

  const { data: unreadCount, isLoading: notifLoading } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: () => notificationAPI.getUnreadCount().then(res => res.data.data),
  });

  const { data: wishlist, isLoading: wishlistLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const response = await userAPI.getWishlist();
      const data = response.data.data;
      // Handle both array response (empty) and object response (with products)
      if (Array.isArray(data)) {
        return { products: [] };
      }
      return data;
    },
  });

  // CRITICAL FIX: Fetch wallet balance for display
  const { data: walletData, isLoading: walletLoading, refetch: refetchWallet } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => {
      try {
        const response = await walletAPI.getBalance();
        // Handle both response formats: response.data.data or response.data
        const data = response.data?.data || response.data || {};
        return {
          balance: data.balance || 0,
          balanceFormatted: data.balanceFormatted || (data.balance ? `$${parseFloat(data.balance).toFixed(2)}` : '$0.00'),
          currency: data.currency || 'USD'
        };
      } catch (error) {
        // If wallet doesn't exist yet, return 0 balance
        return { balance: 0, balanceFormatted: '$0.00', currency: 'USD' };
      }
    },
    retry: 1, // Only retry once
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  const isLoading = ordersLoading || notifLoading || wishlistLoading || walletLoading;
  
  // Calculate stats from orders data
  const totalSpent = ordersData?.orders?.reduce((sum, order) => {
    return sum + (order.totalAmount || 0);
  }, 0) || 0;
  
  const completedOrders = ordersData?.orders?.filter(order => order.orderStatus === 'completed').length || 0;
  const pendingOrders = ordersData?.orders?.filter(order => order.orderStatus === 'pending' || order.orderStatus === 'processing').length || 0;

  if (isLoading) return <Loading message="Loading dashboard..." />;

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'success',
      pending: 'warning',
      processing: 'default',
      cancelled: 'destructive',
      returned: 'secondary',
      partially_completed: 'secondary',
    };
    const labels = { partially_completed: 'Partially completed' };
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  // CRITICAL FIX: Get wallet balance from API response
  // Handle both number and formatted string
  const walletBalance = walletData?.balance ?? 0;
  const walletBalanceFormatted = walletData?.balanceFormatted 
    || (typeof walletBalance === 'number' ? `$${walletBalance.toFixed(2)}` : '$0.00');

  const statsCards = [
    {
      title: 'Wallet Balance',
      value: walletBalanceFormatted,
      icon: Wallet,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      link: '#', // Wallet page can be added later
      onClick: (e) => {
        e.preventDefault();
        // Refresh wallet balance when clicked
        refetchWallet();
      },
    },
    {
      title: 'Total Orders',
      value: ordersData?.pagination?.total || 0,
      icon: ShoppingCart,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      link: '/user/orders',
    },
    {
      title: 'Total Spent',
      value: `$${totalSpent.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      link: '/user/orders',
    },
    {
      title: 'Completed Orders',
      value: completedOrders,
      icon: Package,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      link: '/user/orders?status=completed',
    },
    {
      title: 'Pending Orders',
      value: pendingOrders,
      icon: TrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      link: '/user/orders?status=pending',
    },
    {
      title: 'Wishlist Items',
      value: wishlist?.products?.length || 0,
      icon: Heart,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      link: '/user/wishlist',
    },
    {
      title: 'Unread Notifications',
      value: unreadCount?.unreadCount || 0,
      icon: Bell,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      link: '/user/notifications',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome to your dashboard</p>
        </div>
        {/* Switch to Seller Dashboard Button - Show if user has seller role */}
        {hasSellerRole && (
          <div className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
            <Button
              variant="outline"
              onClick={() => {
                // Clear the customer access flag when switching back to seller
                sessionStorage.removeItem('allowCustomerAccess');
                // Use window.location to force full navigation
                window.location.href = '/seller/dashboard';
              }}
              className="w-full sm:w-auto border-2 border-accent text-white hover:bg-accent/20 hover:border-accent/90 bg-transparent dark:bg-transparent dark:border-accent dark:text-white whitespace-nowrap font-medium shadow-sm"
            >
              <Store className="h-4 w-4 mr-2" />
              Switch to Seller Dashboard
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          const CardWrapper = stat.link === '#' && stat.onClick 
            ? ({ children }) => <div onClick={stat.onClick} className="cursor-pointer">{children}</div>
            : ({ children }) => <Link to={stat.link}>{children}</Link>;
          
          return (
            <CardWrapper key={index}>
              <Card className="bg-primary border-gray-700 hover:border-accent transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-accent/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                </CardContent>
              </Card>
            </CardWrapper>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Recent Orders</CardTitle>
            <Link to="/user/orders">
              <Button variant="ghost" size="sm" className="text-accent hover:text-accent/80">
                <Eye className="w-4 h-4 mr-1" />
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {ordersData?.orders?.length > 0 ? (
              <div className="space-y-4">
                {ordersData.orders.slice(0, 5).map((order) => (
                  <Link 
                    key={order._id} 
                    to={`/user/orders/${order._id}`}
                    className="block border-b border-gray-700 pb-4 last:border-0 hover:bg-secondary/50 -mx-4 px-4 rounded transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium text-white">Order #{order._id.slice(-8)}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        {order.items?.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-white text-lg">${order.totalAmount?.toFixed(2)}</p>
                        <div className="mt-1">{getStatusBadge(order.orderStatus)}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-4">No orders yet</p>
                <Link to="/products">
                  <Button className="bg-accent hover:bg-blue-700">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/user/orders">
                <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-accent hover:border-accent hover:text-white h-auto py-4 flex flex-col items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="text-sm">My Orders</span>
                </Button>
              </Link>
              <Link to="/user/wishlist">
                <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-accent hover:border-accent hover:text-white h-auto py-4 flex flex-col items-center gap-2">
                  <Heart className="w-5 h-5" />
                  <span className="text-sm">Wishlist</span>
                </Button>
              </Link>
              <Link to="/user/notifications">
                <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-accent hover:border-accent hover:text-white h-auto py-4 flex flex-col items-center gap-2">
                  <Bell className="w-5 h-5" />
                  <span className="text-sm">Notifications</span>
                  {unreadCount?.unreadCount > 0 && (
                    <Badge className="ml-1 bg-accent text-white">{unreadCount.unreadCount}</Badge>
                  )}
                </Button>
              </Link>
              <Link to="/user/reviews">
                <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-accent hover:border-accent hover:text-white h-auto py-4 flex flex-col items-center gap-2">
                  <Package className="w-5 h-5" />
                  <span className="text-sm">My Reviews</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;
