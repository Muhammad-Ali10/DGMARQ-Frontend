import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../services/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Package, Users, Calendar } from 'lucide-react';

const SellerAnalytics = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterType, setFilterType] = useState('month'); // 'month' or 'range'

  const { data: analytics, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['seller-analytics', startDate, endDate, selectedMonth, selectedYear, filterType],
    queryFn: async () => {
      try {
        const params = filterType === 'range' && startDate && endDate
          ? { startDate, endDate }
          : { month: selectedMonth, year: selectedYear };
        const response = await analyticsAPI.getSellerMonthlyAnalytics(params);
        return response.data.data;
      } catch (err) {
        throw err;
      }
    },
    enabled: true,
    retry: 2,
  });

  const handleDateFilter = () => {
    refetch();
  };

  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
    setSelectedMonth(new Date().getMonth() + 1);
    setSelectedYear(new Date().getFullYear());
    setFilterType('month');
  };

  // Calculate conversion rate (if we have views data)
  const conversionRate = analytics?.totalSales && analytics?.totalProducts
    ? ((analytics.totalSales / (analytics.totalProducts * 100)) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 mt-1">Monthly performance and insights</p>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filter Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={filterType === 'month' ? 'default' : 'outline'}
                onClick={() => setFilterType('month')}
                className={filterType === 'month' ? 'bg-accent' : ''}
              >
                By Month
              </Button>
              <Button
                variant={filterType === 'range' ? 'default' : 'outline'}
                onClick={() => setFilterType('range')}
                className={filterType === 'range' ? 'bg-accent' : ''}
              >
                Date Range
              </Button>
            </div>

            {filterType === 'month' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="month" className="text-gray-300">Month</Label>
                  <Input
                    id="month"
                    type="number"
                    min="1"
                    max="12"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="bg-secondary border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year" className="text-gray-300">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    min="2020"
                    max={new Date().getFullYear() + 1}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="bg-secondary border-gray-700 text-white"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={handleDateFilter}
                    className="flex-1 bg-accent hover:bg-blue-700"
                  >
                    Apply
                  </Button>
                  <Button
                    onClick={handleResetFilter}
                    variant="outline"
                    className="border-gray-700 text-gray-300"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    max={new Date().toISOString().split('T')[0]}
                    className="bg-secondary border-gray-700 text-white"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={handleDateFilter}
                    disabled={!startDate || !endDate}
                    className="flex-1 bg-accent hover:bg-blue-700"
                  >
                    Apply
                  </Button>
                  <Button
                    onClick={handleResetFilter}
                    variant="outline"
                    className="border-gray-700 text-gray-300"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading && <Loading message="Loading analytics..." />}
      {isError && (
        <ErrorMessage 
          message={error?.response?.data?.message || 'Error loading analytics. Please try again.'} 
        />
      )}
      {!isLoading && !isError && !analytics && (
        <Card className="bg-primary border-gray-700">
          <CardContent className="py-8 text-center text-gray-400">
            No analytics data available for the selected period.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && analytics && (
        <>
          {/* Period Summary */}
          {analytics.period && (
            <Card className="bg-primary border-gray-700 border-l-4 border-l-accent mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-white font-semibold mb-1">Selected Period</h3>
                    <p className="text-gray-300 text-sm">
                      {filterType === 'month' 
                        ? `${new Date(analytics.period.year, analytics.period.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                        : `${new Date(analytics.period.startDate).toLocaleDateString()} - ${new Date(analytics.period.endDate).toLocaleDateString()}`
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs">Total Orders</p>
                    <p className="text-white font-bold text-lg">{analytics.totalOrders || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Period Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${(analytics?.totalRevenue || analytics?.sales?.revenue || 0).toFixed(2)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {analytics?.allTimeRevenue ? `All time: $${analytics.allTimeRevenue.toFixed(2)}` : 'Selected period'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Period Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {analytics?.totalSales || analytics?.sales?.total || 0}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {analytics?.allTimeSales ? `All time: ${analytics.allTimeSales}` : 'Units sold'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Net Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${(analytics?.netEarnings || analytics?.earnings?.total || 0).toFixed(2)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {analytics?.allTimeEarnings ? `All time: $${analytics.allTimeEarnings.toFixed(2)}` : 'After commission'}
            </p>
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
            <p className="text-xs text-gray-400 mt-1">
              {analytics?.activeProducts ? `${analytics.activeProducts} active` : 'Total products'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Average Order Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${(analytics?.averageOrderValue || 0).toFixed(2)}
            </div>
            <p className="text-xs text-gray-400 mt-1">Per order</p>
          </CardContent>
        </Card>

        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Pending Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${(analytics?.earnings?.pending || 0).toFixed(2)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {analytics?.earnings?.pendingCount ? `${analytics.earnings.pendingCount} payout(s)` : 'Awaiting release'}
            </p>
          </CardContent>
        </Card>
      </div>

      {analytics?.topProducts && analytics.topProducts.length > 0 && (
        <Card className="bg-primary border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300">Product</th>
                    <th className="text-left py-3 px-4 text-gray-300">Sales</th>
                    <th className="text-left py-3 px-4 text-gray-300">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topProducts.map((product, index) => (
                    <tr key={product.productId || index} className="border-b border-gray-800">
                      <td className="py-3 px-4 text-white">
                        <div className="flex items-center gap-2">
                          {product.productImage && (
                            <img 
                              src={product.productImage} 
                              alt={product.productName}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <span>{product.productName || 'Unknown Product'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white">{product.salesCount || 0}</td>
                      <td className="py-3 px-4 text-green-400">${(product.revenue || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
        </>
      )}
    </div>
  );
};

export default SellerAnalytics;

