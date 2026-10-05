import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Skeleton } from '@components/ui/skeleton';
import { ErrorState } from '@components/common/ErrorState';
import { CreditCard, X, RefreshCw } from 'lucide-react';
import useCurrency from '@hooks/useCurrency';

const SellerSubscriptions = () => {
  const { formatSettlement } = useCurrency();
  const queryClient = useQueryClient();

  const { data: subscriptionData, isLoading, isError } = useQuery({
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
      queryClient.invalidateQueries({ queryKey: ['seller-subscription'] });
    },
  });

  const renewMutation = useMutation({
    mutationFn: (data) => subscriptionAPI.renewSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-subscription'] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    );
  }
  if (isError) {
    return (
      <ErrorState
        title="Couldn't load your subscription"
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['seller-subscription'] })}
      />
    );
  }

  const subscription = subscriptionData?.subscription;
  const hasSubscription = subscriptionData?.hasSubscription || false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-fg">My Subscription</h1>
        <p className="text-fg-muted mt-1">Manage your seller subscription</p>
      </div>

      {hasSubscription && subscription ? (
        <Card variant="hud">
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-fg-muted">Status</p>
                  <Badge
                    variant={subscription.status === 'active' ? 'success' : 'destructive'}
                    className="mt-1"
                  >
                    {subscription.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-fg-muted">Plan</p>
                  <p className="text-fg font-semibold mt-1">{subscription.plan || 'Standard'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-fg-muted">Start Date</p>
                  <p className="text-fg mt-1">
                    {subscription.startDate
                      ? new Date(subscription.startDate).toLocaleDateString()
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-fg-muted">End Date</p>
                  <p className="text-fg mt-1">
                    {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-fg-muted">Amount</p>
                <p className="text-fg font-semibold text-lg mt-1">
                  {formatSettlement(subscription.amount)}
                </p>
              </div>

              {subscription.status === 'active' && (
                <div className="flex gap-2 pt-4 border-t border-brand-cyan/10">
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
                    className=""
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
        <Card variant="hud">
          <CardHeader>
            <CardTitle>No Active Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CreditCard className="w-16 h-16 text-fg-subtle mx-auto mb-4" />
              <p className="text-fg-muted mb-6">You don't have an active subscription</p>
              <Button
                onClick={() => subscribeMutation.mutate()}
                disabled={subscribeMutation.isPending}
                className=""
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

