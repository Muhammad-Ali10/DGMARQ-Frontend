import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { CreditCard, Calendar, X, RefreshCw } from 'lucide-react';

const SellerSubscriptions = () => {
  const queryClient = useQueryClient();

  const { data: subscriptionData, isLoading } = useQuery({
    queryKey: ['seller-subscription'],
    queryFn: () => subscriptionAPI.getMySubscription().then(res => res.data.data),
  });

  const subscribeMutation = useMutation({
    mutationFn: () => subscriptionAPI.subscribe(),
    onSuccess: (data) => {
      if (data.data.data.approvalUrl) {
        window.location.href = data.data.data.approvalUrl;
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => subscriptionAPI.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-subscription']);
    },
  });

  const renewMutation = useMutation({
    mutationFn: (data) => subscriptionAPI.renewSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-subscription']);
    },
  });

  if (isLoading) return <Loading message="Loading subscription..." />;

  const subscription = subscriptionData?.subscription;
  const hasSubscription = subscriptionData?.hasSubscription || false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">My Subscription</h1>
        <p className="text-gray-400 mt-1">Manage your seller subscription</p>
      </div>

      {hasSubscription && subscription ? (
        <Card className="bg-primary border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Current Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400">Status</p>
                  <Badge
                    variant={subscription.status === 'active' ? 'success' : 'destructive'}
                    className="mt-1"
                  >
                    {subscription.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-400">Plan</p>
                  <p className="text-white font-semibold mt-1">{subscription.plan || 'Standard'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400">Start Date</p>
                  <p className="text-white mt-1">
                    {subscription.startDate
                      ? new Date(subscription.startDate).toLocaleDateString()
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">End Date</p>
                  <p className="text-white mt-1">
                    {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-gray-400">Amount</p>
                <p className="text-white font-semibold text-lg mt-1">
                  ${subscription.amount?.toFixed(2) || '0.00'}
                </p>
              </div>

              {subscription.status === 'active' && (
                <div className="flex gap-2 pt-4 border-t border-gray-700">
                  <Button
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    variant="destructive"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
                  </Button>
                  <Button
                    onClick={() => renewMutation.mutate({ durationMonths: 1 })}
                    disabled={renewMutation.isPending}
                    className="bg-accent hover:bg-blue-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {renewMutation.isPending ? 'Renewing...' : 'Renew Subscription'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-primary border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">No Active Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-6">You don't have an active subscription</p>
              <Button
                onClick={() => subscribeMutation.mutate()}
                disabled={subscribeMutation.isPending}
                className="bg-accent hover:bg-blue-700"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {subscribeMutation.isPending ? 'Processing...' : 'Subscribe Now'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SellerSubscriptions;

