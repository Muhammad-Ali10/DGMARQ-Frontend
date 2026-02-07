import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { subscriptionAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
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

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: () => subscriptionAPI.subscribe(),
    onSuccess: (data) => {
      if (data.data.data.approvalUrl) {
        window.location.href = data.data.data.approvalUrl;
      }
    },
    onError: (error) => {
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
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 mb-6">
            <Sparkles className="w-5 h-5 text-accent" />
            <span className="text-accent font-semibold">DGMARQ Plus</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Save with <span className="text-accent">DGMARQ Plus</span>
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
                className="border-accent text-accent hover:bg-accent/10 px-8 py-6 text-lg"
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

        {/* How It Works Section */}
        <section className="mb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 sm:mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-primary border-gray-700 text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">1. Subscribe</h3>
                <p className="text-gray-400">
                  Choose DGMARQ Plus and complete your subscription payment securely via PayPal.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-primary border-gray-700 text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">2. Get Instant Discounts</h3>
                <p className="text-gray-400">
                  Your subscription activates immediately. Discounts are automatically applied to all purchases.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-primary border-gray-700 text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">3. Save More</h3>
                <p className="text-gray-400">
                  Enjoy {plan.discountPercentage}% off on every purchase. The more you shop, the more you save!
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Subscription Plan Section */}
        <section className="mb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 sm:mb-12">Subscription Plan</h2>
          <div className="max-w-2xl mx-auto">
            <Card className={`bg-primary border-2 ${hasActiveSubscription ? 'border-green-500/50' : 'border-accent/50'}`}>
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-6 h-6 text-accent" />
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
                      className="w-full border-accent text-accent hover:bg-accent/10 py-6 text-lg"
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
          <Card className="bg-primary border-gray-700">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Automatic Application</h3>
                    <p className="text-gray-400">
                      Once you subscribe to DGMARQ Plus, you'll automatically receive a{' '}
                      <span className="text-accent font-semibold">{plan.discountPercentage}% discount</span> on all
                      your purchases. No coupon codes needed!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Discount Stacking</h3>
                    <p className="text-gray-400">
                      Your subscription discount is applied{' '}
                      <span className="text-accent font-semibold">after bundle deals</span> but{' '}
                      <span className="text-accent font-semibold">before coupon codes</span>. This means you can
                      maximize your savings by combining multiple discounts!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-accent" />
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
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 sm:mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            <Card className="bg-primary border-gray-700">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-white mb-2">Can I cancel my subscription anytime?</h3>
                <p className="text-gray-400">
                  Yes! You can cancel your subscription at any time from your account settings. Your discount will remain
                  active until the end of your current billing period.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-primary border-gray-700">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-white mb-2">Do discounts work with coupon codes?</h3>
                <p className="text-gray-400">
                  Absolutely! Your subscription discount is applied first, and then any coupon codes you apply will
                  give you additional savings on top of that.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-primary border-gray-700">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-white mb-2">How is the discount calculated?</h3>
                <p className="text-gray-400">
                  The {plan.discountPercentage}% discount is calculated on your subtotal after bundle deals are applied.
                  This ensures you get the maximum possible savings.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-primary border-gray-700">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-white mb-2">What payment methods are accepted?</h3>
                <p className="text-gray-400">
                  We accept PayPal for subscription payments. Your subscription will be automatically renewed each month
                  until you cancel.
                </p>
              </CardContent>
            </Card>
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
                  className="border-accent text-accent hover:bg-accent/10 px-8 py-6 text-lg"
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
            <Card className="bg-primary border-gray-700 max-w-md w-full">
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

