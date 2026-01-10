import { useQuery } from '@tanstack/react-query';
import { sellerAPI } from '../../services/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { TrendingUp, DollarSign, ShoppingCart, Package, Star, Users } from 'lucide-react';

const SellerPerformance = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: metrics, isLoading, isError, refetch } = useQuery({
    queryKey: ['seller-performance', startDate, endDate],
    queryFn: () => sellerAPI.getPerformanceMetrics({ startDate, endDate }).then(res => res.data.data),
    enabled: true,
  });

  if (isLoading) {
    return <Loading message="Loading performance metrics..." />;
  }

  if (isError) {
    return <ErrorMessage message="Error loading performance metrics" />;
  }

  const handleDateFilter = () => {
    refetch();
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Performance Metrics</h1>
        <p className="text-gray-400 mt-1">Track your sales and business performance</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics?.salesMetrics?.[0]?.totalSales || 0}
            </div>
            <p className="text-xs text-gray-400 mt-1">Units sold</p>
          </CardContent>
        </Card>

        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${metrics?.salesMetrics?.[0]?.totalRevenue?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-gray-400 mt-1">Gross revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Net Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${metrics?.salesMetrics?.[0]?.netEarnings?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-gray-400 mt-1">After commission</p>
          </CardContent>
        </Card>

        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${metrics?.salesMetrics?.[0]?.totalCommission?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-gray-400 mt-1">Platform fee</p>
          </CardContent>
        </Card>

        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Products</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics?.productCount || 0}
            </div>
            <p className="text-xs text-gray-400 mt-1">All products</p>
          </CardContent>
        </Card>

        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Active Products</CardTitle>
            <Package className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics?.activeProductCount || 0}
            </div>
            <p className="text-xs text-gray-400 mt-1">Published products</p>
          </CardContent>
        </Card>

        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Reviews</CardTitle>
            <Star className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics?.reviewMetrics?.[0]?.totalReviews || 0}
            </div>
            <p className="text-xs text-gray-400 mt-1">Customer reviews</p>
          </CardContent>
        </Card>

        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics?.reviewMetrics?.[0]?.averageRating?.toFixed(1) || '0.0'} ⭐
            </div>
            <p className="text-xs text-gray-400 mt-1">Out of 5.0</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerPerformance;

