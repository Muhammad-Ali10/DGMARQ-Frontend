import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Skeleton } from '@components/ui/skeleton';
import { ErrorState } from '@components/common/ErrorState';
import { CreditCard, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const UserSubscriptions = () => {
  const queryClient = useQueryClient();

  const { data: subscriptionData, isLoading, isError } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => subscriptionAPI.getMySubscription().then(res => res.data.data),
  });

  const { data: planData } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionAPI.getSubscriptionPlans().then(res => res.data.data),
    staleTime: 5 * 60 * 1000,
  });
  const plan = planData?.plan;
  const discountLabel = plan ? `${plan.discountPercentage}%` : 'Plus';

  const subscribeMutation = useMutation({
    mutationFn: () => subscriptionAPI.subscribe(),
    onSuccess: (response) => {
      const approvalUrl = response?.data?.data?.approvalUrl;
      if (approvalUrl) {
        window.location.href = approvalUrl;
        return;
      }
      toast.error('PayPal did not return a checkout link. Please try again.');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Unable to start the subscription. Please try again.');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => subscriptionAPI.cancelSubscription(),
    onSuccess: () => {
      toast.success('Subscription cancelled. PayPal will not charge you again.');
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Unable to cancel the subscription. Please try again.');
    },
  });

  const renewMutation = useMutation({
    mutationFn: (data) => subscriptionAPI.renewSubscription(data),
    onSuccess: (response) => {
      const result = response?.data?.data;
      const action = result?.action;
      const message = result?.message;
      if (action === 'payment_required' && result?.approvalUrl) {
        toast.info(message || 'Redirecting to payment...');
        window.location.href = result.approvalUrl;
        return;
      }
      if (action === 'no_action') {
        toast.info(message || 'Your subscription is already active.');
      } else if (action === 'restored') {
        toast.success(message || 'Payment successful! Subscription restored.');
      } else if (action === 'payment_retry_required') {
        toast.error(message || 'Payment retry failed. Please update your card.');
      } else {
        toast.success(message || 'Subscription updated.');
      }
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Unable to process subscription renewal request.');
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
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['my-subscription'] })}
      />
    );
  }

  const subscription = subscriptionData?.subscription;
  const now = new Date();
  const endDate = subscription?.endDate ? new Date(subscription.endDate) : null;
  const isFuture = !!endDate && endDate > now;
  const hasBenefits = !!subscription && (!endDate || endDate >= now) && ['active', 'cancelled', 'past_due'].includes(subscription.status);
  const isCancelledButActive = hasBenefits && subscription?.status === 'cancelled';
  const isActiveFuture = subscription?.status === 'active' && isFuture;
  const isPastDue = subscription?.status === 'past_due';

  const handleCancelSubscription = () => {
    if (!subscription) return;
    const expiry = endDate ? endDate.toLocaleDateString() : 'end of current period';
    const confirmed = window.confirm(
      `Are you sure? At the end of the current period you will lose:\n` +
      `❌ ${discountLabel} discount on all purchases\n` +
      `Your subscription remains active until: ${expiry}`
    );
    if (confirmed) {
      cancelMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-fg">My Subscription</h1>
        <p className="text-fg-muted mt-1">Manage your subscription</p>
      </div>

      {hasBenefits && subscription ? (
        <Card variant="hud">
          <CardHeader>
            <CardTitle>
              {isPastDue
                ? '🟠 Payment overdue'
                : isCancelledButActive
                  ? '🟡 Subscription (Cancelled)'
                  : '🟢 Subscription Active'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-fg-muted">Status</p>
                  <Badge variant={subscription.status === 'active' ? 'success' : 'secondary'} className="mt-1">
                    {subscription.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-fg-muted">Plan</p>
                  <p className="text-fg font-semibold mt-1">{subscription.planName || 'DGMARQ+'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-fg-muted">{isCancelledButActive ? 'Benefits active until' : 'Started'}</p>
                  <p className="text-fg mt-1">
                    {(isCancelledButActive ? subscription.endDate : subscription.startDate)
                      ? new Date(isCancelledButActive ? subscription.endDate : subscription.startDate).toLocaleDateString()
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-fg-muted">{isCancelledButActive ? 'Auto-renew' : 'Renews'}</p>
                  <p className="text-fg mt-1">
                    {isCancelledButActive
                      ? 'OFF'
                      : (subscription.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString()
                        : subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : '-')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-fg-muted">Benefits</p>
                <div className="mt-2 space-y-1">
                  <p className="text-fg text-sm">• {discountLabel} instant discount on all products</p>
                </div>
              </div>

              {isActiveFuture && (
                <div className="flex gap-2 pt-4 border-t border-brand-cyan/10">
                  <Button
                    onClick={handleCancelSubscription}
                    disabled={cancelMutation.isPending}
                    variant="destructive"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
                  </Button>
                </div>
              )}
              {isCancelledButActive && (
                <p className="pt-4 border-t border-brand-cyan/10 text-sm text-fg-muted">
                  Auto-renew is off and PayPal will not charge you again. Your benefits last until{' '}
                  {endDate ? endDate.toLocaleDateString() : 'the end of this period'}; subscribe again after that date to keep Plus.
                </p>
              )}
              {isPastDue && (
                <div className="flex gap-2 pt-4 border-t border-brand-cyan/10">
                  <Button
                    onClick={() => renewMutation.mutate({})}
                    disabled={renewMutation.isPending}
                    className=""
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {renewMutation.isPending ? 'Retrying...' : 'Retry Payment'}
                  </Button>
                  <Button
                    onClick={handleCancelSubscription}
                    disabled={cancelMutation.isPending}
                    variant="destructive"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card variant="hud">
          <CardHeader>
            <CardTitle>🔴 No Active Subscription</CardTitle>
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
                {subscribeMutation.isPending
                  ? 'Processing...'
                  : plan
                    ? `Buy Subscription - $${plan.price.toFixed(2)}/mo`
                    : 'Buy Subscription'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserSubscriptions;

