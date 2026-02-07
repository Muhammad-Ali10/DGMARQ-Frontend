import { useQuery } from '@tanstack/react-query';
import { sellerAPI } from '../../services/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Loading } from '../../components/ui/loading';
import { DollarSign, FileText, Settings, History, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { showApiError } from '../../utils/toast';

const SellerEarnings = () => {
  const [selectedPayoutId, setSelectedPayoutId] = useState(null);

  const { data: balance } = useQuery({
    queryKey: ['seller-balance'],
    queryFn: () => sellerAPI.getPayoutBalance().then(res => res.data.data),
  });

  const { data: payouts, isLoading } = useQuery({
    queryKey: ['seller-payouts'],
    queryFn: () => sellerAPI.getMyPayouts({ page: 1, limit: 10 }).then(res => res.data.data),
  });

  const { data: withdrawalHistory } = useQuery({
    queryKey: ['withdrawal-history'],
    queryFn: () => sellerAPI.getMyPayouts({ page: 1, limit: 100 }).then(res => res.data.data),
    retry: false,
    onError: (error) => {
      // Silently handle error - withdrawal history is optional
    },
  });

  const { data: payoutRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['payout-requests'],
    queryFn: () => sellerAPI.getPayoutRequests().then(res => res.data.data),
    retry: false,
    onError: (error) => {
      // Silently handle error
    },
  });

  const { data: payoutReports, isLoading: reportsLoading } = useQuery({
    queryKey: ['payout-reports'],
    queryFn: () => sellerAPI.getPayoutReports().then(res => res.data.data),
    retry: false,
    onError: (error) => {
      // Silently handle error
    },
  });

  const { data: payoutDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['payout-details', selectedPayoutId],
    queryFn: () => sellerAPI.getPayoutDetails(selectedPayoutId).then(res => res.data.data),
    enabled: !!selectedPayoutId && selectedPayoutId !== null,
    retry: false,
    onError: (error) => {
      showApiError(error, 'Failed to load payout details');
      setSelectedPayoutId(null);
    },
  });

  if (isLoading || requestsLoading || reportsLoading) {
    return <Loading message="Loading earnings data..." />;
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Earnings & Payouts</h1>
        <p className="text-gray-400 mt-1">View your earnings and payout history</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              {balance?.holdReason ? 'Available (On Hold)' : 'Available Balance'}
            </CardTitle>
            <DollarSign className={`h-4 w-4 ${balance?.holdReason ? 'text-amber-500' : 'text-green-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${balance?.available?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {balance?.holdReason ? balance.holdReason : 'Released automatically when eligible'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Pending Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${balance?.pending?.amount?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {balance?.pending?.daysUntilAvailable > 0 
                ? `Available in ${balance.pending.daysUntilAvailable} day${balance.pending.daysUntilAvailable > 1 ? 's' : ''}`
                : 'On hold (15 days)'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-primary border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${balance?.totalEarnings?.toFixed(2) || ((balance?.pending?.amount || 0) + (balance?.available || 0) + (balance?.released?.amount || 0)).toFixed(2)}
            </div>
            <p className="text-xs text-gray-400 mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Payout blocked – show why */}
      {balance?.holdReason && (balance?.available > 0 || balance?.pending?.amount > 0) && (
        <Card className="bg-primary border-gray-700 border-l-4 border-l-amber-500">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="shrink-0">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-amber-500" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Payouts on hold</h3>
                <p className="text-gray-300 text-sm">
                  {balance.holdReason} Payouts are released by the system or admin once your payout account is eligible.
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  Go to <a href="/seller/payout-account" className="text-accent hover:underline">Payout Account</a> to connect or verify PayPal.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hold Period Information */}
      {balance?.pending?.amount > 0 && balance?.pending?.daysUntilAvailable > 0 && (
        <Card className="bg-primary border-gray-700 border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="shrink-0">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-yellow-500" />
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

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-primary border-gray-700">
          <TabsTrigger value="history" className="data-[state=active]:bg-accent data-[state=active]:text-white">
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="requests" className="data-[state=active]:bg-accent data-[state=active]:text-white">
            <History className="w-4 h-4 mr-2" />
            Requests
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-accent data-[state=active]:text-white">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card className="bg-primary border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Payout Requests</CardTitle>
              <p className="text-sm text-gray-400 mt-1">Payouts are released automatically by the system after the hold period. Sellers cannot request or trigger payouts.</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">Amount</th>
                      <th className="text-left py-3 px-4 text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 text-gray-300">Requested Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(payoutRequests?.requests || payoutRequests || []).length > 0 ? (
                      (payoutRequests?.requests || payoutRequests || []).map((request) => (
                        <tr key={request._id} className="border-b border-gray-800">
                          <td className="py-3 px-4 text-white">${request.netAmount?.toFixed(2) || request.requestedAmount?.toFixed(2) || '0.00'}</td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                request.status === 'approved' || request.status === 'released' ? 'success' :
                                request.status === 'pending' || request.status === 'requested' ? 'warning' :
                                'destructive'
                              }
                            >
                              {request.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-400">
                            {new Date(request.requestedAt || request.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="py-8 text-center text-gray-400">
                          No payout requests
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-primary border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Payout History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">Amount</th>
                      <th className="text-left py-3 px-4 text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 text-gray-300">Date</th>
                      <th className="text-left py-3 px-4 text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(withdrawalHistory?.payouts?.length > 0 ? withdrawalHistory.payouts : withdrawalHistory?.docs || []).map((payout) => (
                        <tr key={payout._id} className="border-b border-gray-800">
                          <td className="py-3 px-4 text-white">${payout.netAmount?.toFixed(2) || payout.amount?.toFixed(2) || '0.00'}</td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                payout.status === 'released' ? 'success' :
                                payout.status === 'pending' ? 'warning' :
                                payout.status === 'failed' ? 'destructive' :
                                'default'
                              }
                            >
                              {payout.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-400">
                            {new Date(payout.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (payout?._id) {
                                      setSelectedPayoutId(payout._id.toString());
                                    }
                                  }}
                                  className="border-gray-700 text-gray-300"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent size="md" className="bg-primary border-gray-700">
                                <DialogHeader>
                                  <DialogTitle className="text-white">Payout Details</DialogTitle>
                                  <DialogDescription className="text-gray-400">
                                    Detailed information about this payout
                                  </DialogDescription>
                                </DialogHeader>
                                {detailsLoading ? (
                                  <div className="text-center py-8">Loading...</div>
                                ) : payoutDetails ? (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm text-gray-400">Payout ID</p>
                                        <p className="text-white font-mono text-sm">{payoutDetails._id}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-400">Status</p>
                                        <Badge variant={payoutDetails.status === 'released' ? 'success' : 'warning'}>
                                          {payoutDetails.status}
                                        </Badge>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-400">Gross Amount</p>
                                        <p className="text-white">${payoutDetails.grossAmount?.toFixed(2)}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-400">Commission</p>
                                        <p className="text-white">${payoutDetails.commissionAmount?.toFixed(2)}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-400">Net Amount</p>
                                        <p className="text-green-400 font-semibold">${payoutDetails.netAmount?.toFixed(2)}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-400">Created At</p>
                                        <p className="text-white">{new Date(payoutDetails.createdAt).toLocaleString()}</p>
                                      </div>
                                    </div>
                                    {payoutDetails.requestReason && (
                                      <div>
                                        <p className="text-sm text-gray-400 mb-1">Reason</p>
                                        <p className="text-white">{payoutDetails.requestReason}</p>
                                      </div>
                                    )}
                                    {payoutDetails.orderId && (
                                      <div>
                                        <p className="text-sm text-gray-400 mb-1">Related Order</p>
                                        <p className="text-white">Order: {payoutDetails.orderId._id || payoutDetails.orderId}</p>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-gray-400">No details available</div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      ))}
                    {(withdrawalHistory?.payouts?.length === 0 && withdrawalHistory?.docs?.length === 0 && !withdrawalHistory) && (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-gray-400">
                          No payout history
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            {payoutReports && (
              <Card className="bg-primary border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Payout Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Report Summary */}
                    {payoutReports.summary && (
                      <div className="p-4 bg-secondary rounded-lg border border-gray-700">
                        <h4 className="text-white font-semibold mb-3">Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400 block mb-1">Total Payouts</span>
                            <span className="text-white font-semibold">${payoutReports.summary.totalAmount?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-1">Total Count</span>
                            <span className="text-white font-semibold">{payoutReports.summary.totalPayouts || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-1">Total Commission</span>
                            <span className="text-white font-semibold">${payoutReports.summary.totalCommission?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-1">Period</span>
                            <span className="text-white font-semibold text-xs">
                              {payoutReports.period?.startDate 
                                ? `${new Date(payoutReports.period.startDate).toLocaleDateString()} - ${new Date(payoutReports.period.endDate).toLocaleDateString()}`
                                : 'All time'}
                            </span>
                          </div>
                        </div>
                        {/* Status Breakdown */}
                        {payoutReports.summary.byStatus && Object.keys(payoutReports.summary.byStatus).length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-700">
                            <h5 className="text-gray-300 text-sm mb-2">By Status</h5>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(payoutReports.summary.byStatus).map(([status, count]) => (
                                <Badge key={status} variant={status === 'released' ? 'success' : status === 'pending' ? 'warning' : 'default'}>
                                  {status}: {count}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Payouts List */}
                    {payoutReports.payouts && payoutReports.payouts.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-white font-semibold">Recent Payouts</h4>
                        {payoutReports.payouts.slice(0, 10).map((payout) => (
                          <div key={payout.id} className="p-3 bg-secondary rounded-lg border border-gray-700">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-gray-400 text-xs">Payout ID:</span>
                                  <span className="text-white text-xs font-mono">{payout.id?.toString().slice(-8)}</span>
                                </div>
                                {payout.orderId && (
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-gray-400 text-xs">Order ID:</span>
                                    <span className="text-white text-xs font-mono">{payout.orderId?.toString().slice(-8)}</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-white font-semibold">${payout.amount?.toFixed(2) || '0.00'}</div>
                                <Badge variant={payout.status === 'released' ? 'success' : payout.status === 'pending' ? 'warning' : 'default'} className="text-xs">
                                  {payout.status}
                                </Badge>
                              </div>
                            </div>
                            {payout.commission && (
                              <div className="mt-2 text-xs text-gray-400">
                                Commission: ${payout.commission.toFixed(2)}
                              </div>
                            )}
                            {payout.createdAt && (
                              <div className="mt-1 text-xs text-gray-500">
                                {new Date(payout.createdAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        No payout reports available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SellerEarnings;

