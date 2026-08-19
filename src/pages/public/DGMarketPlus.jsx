import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { subscriptionAPI } from '@services/api';
import { showApiError, showSuccess } from '@utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Loading, ErrorMessage } from '@components/ui/loading';
import {
  CheckCircle2,
  Sparkles,
  Zap,
  Shield,
  CreditCard,
  ArrowRight,
  Loader2,
  XCircle,
  Star,
  TrendingUp,
} from 'lucide-react';
import FAQAccordion from '@features/content/marketing/FAQAccordion';
import { useSEO } from '@hooks/useSEO';

const DGMarketPlus = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Fetch subscription plan details
  const { data: planData, isLoading: planLoading, isError: planError } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionAPI.getSubscriptionPlans().then(res => res.data.data),
    retry: 2,
  });

  // Fetch user's subscription status (if authenticated)
  const { data: userSubscription } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => subscriptionAPI.getMySubscription().then(res => res.data.data),
    enabled: isAuthenticated,
    retry: false,
  });

  // M20: Plus points balance + redemption.
  const queryClient = useQueryClient();
  const [redeemAmount, setRedeemAmount] = useState('');
  const { data: pointsData } = useQuery({
    queryKey: ['plus-points'],
    queryFn: () => subscriptionAPI.getMyPoints().then((r) => r.data?.data || null).catch(() => null),
    enabled: isAuthenticated,
    staleTime: 60000,
  });
  const redeemMutation = useMutation({
    mutationFn: (points) => subscriptionAPI.redeemPoints(points),
    onSuccess: (res) => {
      showSuccess(res.data?.message || 'Points redeemed to your wallet');
      setRedeemAmount('');
      queryClient.invalidateQueries({ queryKey: ['plus-points'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    },
    onError: (error) => showApiError(error, 'Failed to redeem points'),
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: () => subscriptionAPI.subscribe(),
    onSuccess: (data) => {
      if (data.data.data.approvalUrl) {
        window.location.href = data.data.data.approvalUrl;
      }
    },
    onError: (error) => {
      showApiError(error, 'Failed to initiate subscription. Please try again.');
    },
  });

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    if (userSubscription?.hasSubscription) {
      // User already has subscription, redirect to manage page
      navigate('/user/subscriptions');
      return;
    }

    subscribeMutation.mutate();
  };

  const plan = planData?.plan;
  const hasActiveSubscription = userSubscription?.hasSubscription || false;

  useSEO({
    title: 'DGMARQ Plus | Premium Marketplace Experience',
    description: 'Get more with DGMARQ Plus. Enjoy premium features for buyers and sellers.',
    canonical: '/dgmarq-plus',
    useDefaults: false,
  });

  // Loading state
  if (planLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4">
          <Loading message="Loading subscription plans..." />
        </div>
      </div>
    );
  }

  // Error state
  if (planError || !plan) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4">
          <ErrorMessage message="Failed to load subscription plans. Please try again later." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="text-center mb-16 relative overflow-hidden rounded-2xl bg-gradient-to-b from-accent/10 via-transparent to-transparent py-16 px-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 mb-6">
            <Sparkles className="w-5 h-5 text-accent-on-dark" />
            <span className="text-accent-on-dark font-semibold">DGMARQ Plus</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Save with <span className="text-accent-on-dark">DGMARQ Plus</span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Get instant discounts on every purchase. Subscribe once and save automatically on all your orders.
          </p>

          {hasActiveSubscription && (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-green-900/20 border border-green-500/30 mb-8">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium">You have an active subscription</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!hasActiveSubscription ? (
              <Button
                onClick={handleSubscribe}
                disabled={subscribeMutation.isPending}
                size="lg"
                className="bg-accent hover:bg-accent/90 text-white px-8 py-6 text-lg"
              >
                {subscribeMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Subscribe Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/user/subscriptions')}
                size="lg"
                variant="outline"
                className="border-accent text-accent-on-dark hover:bg-accent/10 px-8 py-6 text-lg"
              >
                Manage Subscription
              </Button>
            )}
            
            <Button
              onClick={() => navigate('/search')}
              size="lg"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-6 text-lg"
            >
              Browse Products
            </Button>
          </div>
        </section>

        {/* DGMARQ Points — balance + redemption. Gated on being SIGNED IN, not
            on membership: loyalty is for every registered buyer. Plus is the
            separate paid subscription whose benefit is the % off. */}
        {isAuthenticated && pointsData && (
          <section className="mb-20">
            <Card className="border-accent/30 overflow-hidden">
              <CardHeader className="border-b ">
                <CardTitle className="text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400" />
                  Your DGMARQ Points
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div>
                    <p className={`text-4xl font-bold ${pointsData.inDebt ? 'text-amber-400' : 'text-white'}`}>
                      {pointsData.balance}
                      <span className="ml-2 text-base font-medium text-gray-400">pts</span>
                    </p>
                    {/* A negative balance is correct — it is what stops
                        earn → redeem → cancel being free money — but "≈ $-2.00
                        wallet value" reads as a broken page. Say what it means. */}
                    {pointsData.inDebt ? (
                      <p className="mt-1 text-sm text-amber-300/90">
                        Adjusted after a refund. Earn {pointsData.pointsUntilRedeemable} more points to redeem again.
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-gray-400">≈ ${pointsData.walletValue.toFixed(2)} wallet value</p>
                    )}
                  </div>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p>• Earn <span className="font-semibold text-accent-on-dark">{pointsData.pointsPerDollar} points per $1</span> spent</p>
                    <p>• <span className="font-semibold text-accent-on-dark">{pointsData.pointsPerWalletDollar} points = $1</span> wallet credit</p>
                    <p>• Redeem anytime — spend via wallet at checkout</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="redeem-points" className="text-xs text-gray-400">
                      Points to redeem (multiples of {pointsData.pointsPerWalletDollar})
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="redeem-points"
                        type="number"
                        aria-label={`Points to redeem (multiples of ${pointsData.pointsPerWalletDollar})`}
                        min={pointsData.minRedeemPoints}
                        step={pointsData.pointsPerWalletDollar}
                        value={redeemAmount}
                        onChange={(e) => setRedeemAmount(e.target.value)}
                        placeholder={`${pointsData.minRedeemPoints}`}
                        className="w-full rounded-md border border-gray-700 bg-secondary px-3 py-2 text-sm text-white outline-none focus:border-accent"
                      />
                      <Button
                        onClick={() => redeemMutation.mutate(parseInt(redeemAmount, 10))}
                        disabled={redeemMutation.isPending || !redeemAmount || parseInt(redeemAmount, 10) > pointsData.balance}
                        className="bg-accent hover:bg-accent/90 shrink-0"
                      >
                        {redeemMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Redeem'}
                      </Button>
                    </div>
                    {pointsData.balance >= pointsData.minRedeemPoints && (
                      <button
                        type="button"
                        onClick={() => setRedeemAmount(String(Math.floor(pointsData.balance / pointsData.pointsPerWalletDollar) * pointsData.pointsPerWalletDollar))}
                        className="self-start text-xs text-accent-on-dark hover:underline"
                      >
                        Redeem maximum
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* How It Works Section */}
        <section className="mb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 sm:mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-accent-on-dark" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">1. Subscribe</h3>
                <p className="text-gray-400">
                  Choose DGMARQ Plus and complete your subscription payment securely via PayPal.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-accent-on-dark" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">2. Get Instant Discounts</h3>
                <p className="text-gray-400">
                  Your subscription activates immediately. Discounts are automatically applied to all purchases.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-accent-on-dark" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">3. Save More</h3>
                <p className="text-gray-400">
                  Enjoy {plan.discountPercentage}% off on every purchase, and earn{' '}
                  {plan.pointsPerDollar} points for every $1 you spend.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* M20: the loyalty half of the offer, stated to EVERYONE.
              The points panel further up renders only for signed-in members, so
              the one person who most needs to know about points — a visitor
              deciding whether to subscribe — could not see them anywhere. Both
              figures come from the plan endpoint, which reads the services that
              own them, so this copy cannot drift from what is actually paid. */}
          <div className="mt-8 rounded-2xl border border-accent/25 bg-accent/[0.06] p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
                  <Sparkles className="h-5 w-5 text-accent-on-dark" />
                  Plus members earn points too
                </h3>
                <p className="mt-2 max-w-xl text-gray-300">
                  Every order earns <span className="font-semibold text-accent-on-dark">{plan.pointsPerDollar} points per $1</span>.
                  Turn <span className="font-semibold text-accent-on-dark">{plan.pointsPerWalletDollar} points into $1</span> of
                  wallet credit and spend it at checkout — on top of your {plan.discountPercentage}% discount.
                </p>
              </div>
              <div className="shrink-0 rounded-xl border border-white/10 bg-black/25 px-5 py-4 text-center">
                <p className="text-xs uppercase tracking-wide text-gray-400">Spend $100</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {plan.pointsPerDollar * 100} pts
                </p>
                <p className="mt-0.5 text-sm text-accent-on-dark">
                  = ${((plan.pointsPerDollar * 100) / plan.pointsPerWalletDollar).toFixed(2)} back
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Plan Section */}
        <section className="mb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 sm:mb-12">Subscription Plan</h2>
          <div className="max-w-2xl mx-auto">
            <Card className={`border-2 ${hasActiveSubscription ? 'border-green-500/50' : 'border-accent/50'}`}>
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-6 h-6 text-accent-on-dark" />
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-white">{plan.displayName}</CardTitle>
                </div>
                {hasActiveSubscription && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 w-fit mx-auto">
                    Active
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-5xl font-bold text-white">
                      ${plan.price.toFixed(2)}
                    </span>
                    <span className="text-gray-400 text-lg">/{plan.duration}</span>
                  </div>
                  <p className="text-gray-400">Billed monthly, cancel anytime</p>
                </div>

                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">What's Included:</h3>
                  <ul className="space-y-3">
                    {plan.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                        <span className="text-gray-300">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 border-t border-gray-700">
                  {!hasActiveSubscription ? (
                    <Button
                      onClick={handleSubscribe}
                      disabled={subscribeMutation.isPending}
                      className="w-full bg-accent hover:bg-accent/90 text-white py-6 text-lg"
                      size="lg"
                    >
                      {subscribeMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Subscribe Now
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => navigate('/user/subscriptions')}
                      variant="outline"
                      className="w-full border-accent text-accent-on-dark hover:bg-accent/10 py-6 text-lg"
                      size="lg"
                    >
                      Manage Subscription
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Discount Explanation Section */}
        <section className="mb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 sm:mb-12">How Discounts Work</h2>
          <Card className="">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-accent-on-dark" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Automatic Application</h3>
                    <p className="text-gray-400">
                      Once you subscribe to DGMARQ Plus, you'll automatically receive a{' '}
                      <span className="text-accent-on-dark font-semibold">{plan.discountPercentage}% discount</span> on all
                      your purchases. No coupon codes needed!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6 text-accent-on-dark" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Discount Stacking</h3>
                    <p className="text-gray-400">
                      Your subscription discount is applied{' '}
                      <span className="text-accent-on-dark font-semibold">after bundle deals</span> but{' '}
                      <span className="text-accent-on-dark font-semibold">before coupon codes</span>. This means you can
                      maximize your savings by combining multiple discounts!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-accent-on-dark" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Instant Activation</h3>
                    <p className="text-gray-400">
                      Your subscription activates immediately after payment confirmation. Start saving on your very next
                      purchase!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ Section */}
        <section className="mb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">Frequently Asked Questions</h2>
          <p className="text-center text-gray-400 mb-8">Click on a question to expand the answer.</p>
          <div className="max-w-3xl mx-auto">
            <FAQAccordion
              items={[
                {
                  q: 'Can I cancel my subscription anytime?',
                  a: 'Yes! You can cancel your subscription at any time from your account settings. Your discount will remain active until the end of your current billing period.',
                },
                {
                  q: 'Do discounts work with coupon codes?',
                  a: 'Absolutely! Your subscription discount is applied first, and then any coupon codes you apply will give you additional savings on top of that.',
                },
                {
                  q: 'How is the discount calculated?',
                  a: `The ${plan.discountPercentage}% discount is calculated on your subtotal after bundle deals are applied. This ensures you get the maximum possible savings.`,
                },
                {
                  q: 'What payment methods are accepted?',
                  a: 'We accept PayPal for subscription payments. Your subscription will be automatically renewed each month until you cancel.',
                },
              ]}
            />
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="text-center">
          <Card className="bg-gradient-to-r from-accent/10 to-accent/5 border-accent/30">
            <CardContent className="py-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Ready to Start Saving?</h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of satisfied customers who are already saving with DGMARQ Plus. Subscribe today and
                start enjoying instant discounts on every purchase!
              </p>
              {!hasActiveSubscription ? (
                <Button
                  onClick={handleSubscribe}
                  disabled={subscribeMutation.isPending}
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-white px-8 py-6 text-lg"
                >
                  {subscribeMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Subscribe Now
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/user/subscriptions')}
                  size="lg"
                  variant="outline"
                  className="border-accent text-accent-on-dark hover:bg-accent/10 px-8 py-6 text-lg"
                >
                  View My Subscription
                </Button>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Auth Prompt Modal */}
        {showAuthPrompt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Sign In Required</CardTitle>
                  <button
                    onClick={() => setShowAuthPrompt(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-400">
                  You need to be signed in to subscribe to DGMARQ Plus. Please log in or create an account to continue.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowAuthPrompt(false);
                      navigate('/login');
                    }}
                    className="flex-1 bg-accent hover:bg-accent/90 text-white"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => setShowAuthPrompt(false)}
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DGMarketPlus;

