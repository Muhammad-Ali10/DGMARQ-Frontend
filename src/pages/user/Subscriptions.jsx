import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { CreditCard, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const UserSubscriptions = () => {
  const queryClient = useQueryClient();

  const { data: subscriptionData, isLoading } = useQuery({
    queryKey: ['my-subscription'],
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
      queryClient.invalidateQueries(['my-subscription']);
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
      } else if (action === 'reactivated') {
        toast.success(message || 'Subscription re-activated.');
      } else if (action === 'restored') {
        toast.success(message || 'Payment successful! Subscription restored.');
      } else if (action === 'payment_retry_required') {
        toast.error(message || 'Payment retry failed. Please update your card.');
      } else {
        toast.success(message || 'Subscription updated.');
      }
      queryClient.invalidateQueries(['my-subscription']);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Unable to process subscription renewal request.');
    },
  });

  if (isLoading) return <Loading message="Loading subscription..." />;

  const subscription = subscriptionData?.subscription;
  const now = new Date();
  const endDate = subscription?.endDate ? new Date(subscription.endDate) : null;
  const isFuture = !!endDate && endDate > now;
  const hasBenefits = !!subscription && (!endDate || endDate >= now) && ['active', 'cancelled', 'past_due'].includes(subscription.status);
  const isCancelledButActive = hasBenefits && subscription?.status === 'cancelled';
  const isActiveFuture = subscription?.status === 'active' && isFuture;
  const isExpiredOrPast = !subscription || subscription?.status === 'expired' || (endDate && endDate <= now);
  const isPastDue = subscription?.status === 'past_due';

  const handleCancelSubscription = () => {
    if (!subscription) return;
    const expiry = endDate ? endDate.toLocaleDateString() : 'end of current period';
    const confirmed = window.confirm(
      `Are you sure? You will lose these benefits at end of current period:\n` +
      `❌ 2% discount on all purchases\n` +
      `❌ Discount after bundle deals\n` +
      `❌ Coupon code stacking\n` +
      `Your subscription remains active until: ${expiry}`
    );
    if (confirmed) {
      cancelMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">My Subscription</h1>
        <p className="text-gray-400 mt-1">Manage your subscription</p>
      </div>

      {hasBenefits && subscription ? (
        <Card className="bg-primary border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              {isCancelledButActive ? '🟡 Subscription (Cancelled)' : '🟢 Subscription Active'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400">Status</p>
                  <Badge variant={subscription.status === 'active' ? 'success' : 'secondary'} className="mt-1">
                    {subscription.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-400">Plan</p>
                  <p className="text-white font-semibold mt-1">{subscription.planName || 'DGMARQ+'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400">{isCancelledButActive ? 'Benefits active until' : 'Started'}</p>
                  <p className="text-white mt-1">
                    {(isCancelledButActive ? subscription.endDate : subscription.startDate)
                      ? new Date(isCancelledButActive ? subscription.endDate : subscription.startDate).toLocaleDateString()
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">{isCancelledButActive ? 'Auto-renew' : 'Renews'}</p>
                  <p className="text-white mt-1">
                    {isCancelledButActive
                      ? 'OFF'
                      : (subscription.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString()
                        : subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : '-')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-gray-400">Benefits</p>
                <div className="mt-2 space-y-1">
                  <p className="text-white text-sm">• 2% Instant Discount on all products</p>
                  <p className="text-white text-sm">• Priority Support</p>
                </div>
              </div>

              {isActiveFuture && (
                <div className="flex gap-2 pt-4 border-t border-gray-700">
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
                <div className="flex gap-2 pt-4 border-t border-gray-700">
                  <Button
                    onClick={() => renewMutation.mutate({ durationMonths: 1 })}
                    disabled={renewMutation.isPending}
                    className="bg-accent hover:bg-blue-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {renewMutation.isPending ? 'Re-activating...' : 'Re-activate Subscription'}
                  </Button>
                </div>
              )}
              {isPastDue && (
                <div className="flex gap-2 pt-4 border-t border-gray-700">
                  <Button
                    onClick={() => renewMutation.mutate({})}
                    disabled={renewMutation.isPending}
                    className="bg-accent hover:bg-blue-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {renewMutation.isPending ? 'Retrying...' : 'Retry Payment'}
                  </Button>
                </div>
              )}
              {isExpiredOrPast && (
                <div className="flex gap-2 pt-4 border-t border-gray-700">
                  <Button
                    onClick={() => renewMutation.mutate({})}
                    disabled={renewMutation.isPending}
                    className="bg-accent hover:bg-blue-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {renewMutation.isPending ? 'Processing...' : 'Renew Subscription'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-primary border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">🔴 No Active Subscription</CardTitle>
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
                {subscribeMutation.isPending ? 'Processing...' : 'Buy Subscription - $9.99/mo'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserSubscriptions;

