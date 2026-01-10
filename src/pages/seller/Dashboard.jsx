import { useQuery } from '@tanstack/react-query';
import { sellerAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react';

const SellerDashboard = () => {
  const { data: sellerInfo, isLoading: infoLoading, isError: infoError } = useQuery({
    queryKey: ['seller-info'],
    queryFn: () => sellerAPI.getSellerInfo().then(res => res.data.data),
  });

  const { data: balance, isLoading: balanceLoading, isError: balanceError } = useQuery({
    queryKey: ['seller-balance'],
    queryFn: () => sellerAPI.getPayoutBalance().then(res => res.data.data),
  });

  const isLoading = infoLoading || balanceLoading;
  const isError = infoError || balanceError;

  if (isLoading) return <Loading message="Loading seller dashboard..." />;
  if (isError) return <ErrorMessage message="Error loading seller dashboard" />;

  const statsCards = [
    {
      title: 'Available Balance',
      value: `$${balance?.available?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'text-green-500',
    },
    {
      title: 'Pending Balance',
      value: `$${balance?.pending?.amount?.toFixed(2) || '0.00'}`,
      icon: TrendingUp,
      color: 'text-yellow-500',
    },
    {
      title: 'Total Products',
      value: sellerInfo?.stats?.totalProducts || 0,
      icon: Package,
      color: 'text-blue-500',
    },
    {
      title: 'Total Orders',
      value: sellerInfo?.stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Seller Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">Welcome back, {sellerInfo?.shopName || 'Seller'}</p>
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Hold Period Information */}
      {balance?.pending?.amount > 0 && balance?.pending?.daysUntilAvailable > 0 && (
        <Card className="bg-primary border-gray-700 border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
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
