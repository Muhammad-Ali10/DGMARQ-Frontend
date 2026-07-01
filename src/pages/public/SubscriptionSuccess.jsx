import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { subscriptionAPI } from '@services/api';
import { CheckCircle2, Loader2, Home, CreditCard } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const subscriptionId = searchParams.get('subscription_id');
  const [error, setError] = useState(null);

  const confirmMutation = useMutation({
    mutationFn: (id) => subscriptionAPI.confirmSubscription({ subscriptionId: id }),
    onError: (err) => {
      setError(err?.response?.data?.message || 'Failed to activate subscription. Please contact support.');
    },
  });

  useEffect(() => {
    if (subscriptionId) {
      confirmMutation.mutate(subscriptionId);
    } else {
      setError('Missing subscription ID. Please contact support.');
    }
    // confirmMutation is a new object every render — including it would
    // re-fire the confirmation request in a loop. Fire once per subscriptionId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionId]);

  if (confirmMutation.isPending) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
        <h2 className="text-2xl font-semibold text-white">Activating your subscription...</h2>
        <p className="text-gray-400 text-center max-w-md">
          Please wait while we confirm your payment with PayPal. This usually takes just a few seconds.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <Card className="bg-primary border-gray-700 max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-red-400 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-900/20 flex items-center justify-center">
                <CreditCard className="w-8 h-8" />
              </div>
              Activation Issue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-gray-300">
              {error}
            </p>
            <div className="flex flex-col gap-3">
              <Button asChild className="bg-accent hover:bg-accent/90">
                <Link to="/buyer-support">Contact Support</Link>
              </Button>
              <Button asChild variant="outline" className="border-gray-600 text-gray-300">
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <Card className="bg-primary border-gray-700 max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-green-400 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            Subscription Active!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">Welcome to DGMARQ Plus</h3>
            <p className="text-gray-400">
              Your 2% discount will now be automatically applied to all your purchases.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <Button asChild className="bg-accent hover:bg-accent/90">
              <Link to="/search">
                <Home className="w-4 h-4 mr-2" />
                Start Shopping
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-gray-600 text-gray-300">
              <Link to="/user/subscriptions">Manage Subscription</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;
