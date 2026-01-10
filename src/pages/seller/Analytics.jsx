import { useQuery } from '@tanstack/react-query';
import { sellerAPI } from '../../services/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Package, Users } from 'lucide-react';

const SellerAnalytics = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: analytics, isLoading, isError, refetch } = useQuery({
    queryKey: ['seller-analytics', startDate, endDate],
    queryFn: () => sellerAPI.getSellerMonthlyAnalytics({ startDate, endDate }).then(res => res.data.data),
    enabled: true,
  });

  if (isLoading) return <Loading message="Loading analytics..." />;
  if (isError) return <ErrorMessage message="Error loading analytics" />;

  const handleDateFilter = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 mt-1">Monthly performance and insights</p>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Date Range Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-gray-300">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-secondary border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-gray-300">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-secondary border-gray-700 text-white"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleDateFilter}
                className="w-full bg-accent hover:bg-blue-700"
              >
                Apply Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${analytics?.totalRevenue?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-gray-400 mt-1">All time revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {analytics?.totalSales || 0}
            </div>
            <p className="text-xs text-gray-400 mt-1">Units sold</p>
          </CardContent>
        </Card>

        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Net Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${analytics?.netEarnings?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-gray-400 mt-1">After commission</p>
          </CardContent>
        </Card>

        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Products</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {analytics?.totalProducts || 0}
            </div>
            <p className="text-xs text-gray-400 mt-1">Active products</p>
          </CardContent>
        </Card>

        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Average Order Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${analytics?.averageOrderValue?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-gray-400 mt-1">Per order</p>
          </CardContent>
        </Card>

        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Conversion Rate</CardTitle>
            <Users className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {analytics?.conversionRate?.toFixed(2) || '0.00'}%
            </div>
            <p className="text-xs text-gray-400 mt-1">View to purchase</p>
          </CardContent>
        </Card>
      </div>

      {analytics?.monthlyData && analytics.monthlyData.length > 0 && (
        <Card className="bg-primary border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Monthly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300">Month</th>
                    <th className="text-left py-3 px-4 text-gray-300">Revenue</th>
                    <th className="text-left py-3 px-4 text-gray-300">Sales</th>
                    <th className="text-left py-3 px-4 text-gray-300">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.monthlyData.map((month, index) => (
                    <tr key={index} className="border-b border-gray-800">
                      <td className="py-3 px-4 text-white">{month.month}</td>
                      <td className="py-3 px-4 text-white">${month.revenue?.toFixed(2) || '0.00'}</td>
                      <td className="py-3 px-4 text-white">{month.sales || 0}</td>
                      <td className="py-3 px-4 text-green-400">${month.earnings?.toFixed(2) || '0.00'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SellerAnalytics;

