import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cartAPI, checkoutAPI, couponAPI, subscriptionAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import PaymentModal from '../../components/PaymentModal';
import { ShoppingCart, CheckCircle2, XCircle, AlertCircle, Loader2, Tag, X, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const Checkout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const checkoutId = searchParams.get('checkoutId');
  const paymentStatus = searchParams.get('status');
  const token = searchParams.get('token');
  const PayerID = searchParams.get('PayerID');

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [currentCheckoutId, setCurrentCheckoutId] = useState(null);

  // Fetch cart
  const { data: cart, isLoading: cartLoading, isError: cartError } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartAPI.getCart().then(res => res.data.data),
    enabled: isAuthenticated && !checkoutId,
    retry: false,
  });

  // Fetch checkout status if checkoutId exists
  const { data: checkout, isLoading: checkoutLoading } = useQuery({
    queryKey: ['checkout', checkoutId],
    queryFn: () => checkoutAPI.getCheckoutStatus(checkoutId).then(res => res.data.data),
    enabled: !!checkoutId && isAuthenticated,
    retry: false,
  });

  // Fetch user's subscription status
  const { data: userSubscription } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => subscriptionAPI.getMySubscription().then(res => res.data.data),
    enabled: isAuthenticated,
    retry: false,
  });

  // Create checkout session mutation
  const createCheckoutMutation = useMutation({
    mutationFn: (data) => checkoutAPI.createCheckoutSession(data),
    onSuccess: (data) => {
      const checkoutId = data.data.data?.checkoutId;
      if (checkoutId) {
        setCurrentCheckoutId(checkoutId);
        setPaymentModalOpen(true);
      }
    },
  });

  // Process card payment mutation
  const processCardPaymentMutation = useMutation({
    mutationFn: ({ checkoutId, cardData }) => {
      // Enhanced logging before request
      console.log('🔵 [CARD PAYMENT] Initiating payment:', {
        checkoutId,
        cardDataPresent: !!cardData,
        cardNumberLength: cardData?.cardNumber?.replace(/\s/g, '')?.length || 0,
        expiryDate: cardData?.expiryDate,
        hasCvv: !!cardData?.cvv,
        cardHolderName: cardData?.cardHolderName ? '***' : 'missing',
      });
      
      return checkoutAPI.processCardPayment(checkoutId, cardData);
    },
    onSuccess: (data) => {
      console.log('✅ [CARD PAYMENT] Success response:', {
        status: data.status,
        data: data.data,
      });
      
      const checkoutId = data.data.data?.checkoutId;
      if (checkoutId) {
        // Redirect to success page
        navigate(`/checkout?checkoutId=${checkoutId}&status=success`);
        setPaymentModalOpen(false);
        queryClient.invalidateQueries(['checkout', checkoutId]);
      }
    },
    onError: (error) => {
      // Enhanced error logging
      console.error('❌ [CARD PAYMENT] Error occurred:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        requestData: error.config?.data,
        responseData: error.response?.data,
        responseHeaders: error.response?.headers,
      });
      
      // Log backend error message if available
      if (error.response?.data) {
        console.error('❌ [CARD PAYMENT] Backend error details:', {
          message: error.response.data.message,
          details: error.response.data.details,
          data: error.response.data.data,
        });
      }
      
      // Error will be shown in the modal
    },
  });

  // Cancel checkout mutation
  const cancelCheckoutMutation = useMutation({
    mutationFn: () => checkoutAPI.cancelCheckout(checkoutId),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      navigate('/cart');
    },
  });

  // Validate coupon mutation
  const validateCouponMutation = useMutation({
    mutationFn: ({ code, orderAmount }) => couponAPI.validateCoupon({ code, orderAmount }),
    onSuccess: (response) => {
      const couponData = response.data?.data?.coupon || response.data?.data;
      if (couponData) {
        // Transform backend response to match frontend expectations
        const appliedCouponData = {
          code: couponData.code,
          discountType: couponData.discountType,
          discountValue: couponData.discountValue,
          discountAmount: couponData.discountAmount || 0,
          discountPercent: couponData.discountType === 'percentage' ? couponData.discountValue : null,
        };
        setAppliedCoupon(appliedCouponData);
        setCouponError('');
        toast.success('Coupon applied successfully!');
      } else {
        throw new Error('Invalid response format');
      }
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Invalid coupon code';
      setCouponError(errorMessage);
      setAppliedCoupon(null);
      toast.error(errorMessage);
    },
  });

  const handleApplyCoupon = () => {
    const trimmedCode = couponCode.trim();
    if (!trimmedCode) {
      setCouponError('Please enter a coupon code');
      toast.error('Please enter a coupon code');
      return;
    }
    
    // Calculate current order amount (subtotal after bundle/subscription discounts)
    const subtotalAfterDiscounts = subtotal - bundleDiscount - subscriptionDiscount;
    
    validateCouponMutation.mutate({ 
      code: trimmedCode, 
      orderAmount: subtotalAfterDiscounts 
    });
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponError('');
    toast.success('Coupon removed');
  };

  const handleProceedToPayment = () => {
    if (!cart?.items || cart.items.length === 0) {
      return;
    }
    // Create checkout session and open payment modal
    createCheckoutMutation.mutate({
      couponCode: appliedCoupon?.code || couponCode || undefined,
    });
  };

  const handlePayPalPayment = () => {
    if (!currentCheckoutId) {
      // If no checkout session, create one first
      handleProceedToPayment();
      return;
    }
    
    // Fetch checkout to get PayPal approval URL
    checkoutAPI.getCheckoutStatus(currentCheckoutId).then((res) => {
      const approvalUrl = res.data.data?.paypalApprovalUrl;
      if (approvalUrl) {
        window.location.href = approvalUrl;
      }
    }).catch((error) => {
      console.error('Failed to get PayPal approval URL:', error);
    });
  };

  const handleCardPayment = (cardData) => {
    if (!currentCheckoutId) {
      console.error('No checkout session available');
      return;
    }
    
    processCardPaymentMutation.mutate({
      checkoutId: currentCheckoutId,
      cardData,
    });
  };

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12">
        <Card className="bg-[#041536] border-gray-700 max-w-md w-full mx-4">
          <CardContent className="py-12 px-6 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
              <ShoppingCart className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Sign in to checkout</h2>
            <p className="text-gray-400 mb-6">
              Please log in to proceed with your order.
            </p>
            <Button
              onClick={() => navigate('/login')}
              className="bg-accent hover:bg-accent/90 text-white"
              size="lg"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (cartLoading || checkoutLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (cartError && !checkoutId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12">
        <Card className="bg-[#041536] border-gray-700 max-w-md w-full mx-4">
          <CardContent className="py-12 px-6 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-900/20 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Error loading cart</h2>
            <p className="text-gray-400 mb-6">
              Unable to load your cart. Please try again.
            </p>
            <Button
              onClick={() => queryClient.invalidateQueries(['cart'])}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle PayPal return - show success/failure
  if (checkoutId && paymentStatus) {
    const isSuccess = paymentStatus === 'success' || paymentStatus === 'approved';
    
    return (
      <div className="min-h-[60vh] py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="bg-[#041536] border-gray-700">
            <CardContent className="py-12 px-6 text-center">
              {isSuccess ? (
                <>
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-900/20 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">Payment Successful!</h2>
                  <p className="text-gray-400 mb-6">
                    Your order has been placed successfully. You will receive a confirmation email shortly.
                  </p>
                  {checkout?.orderId && (
                    <div className="bg-gray-800/50 p-4 rounded-lg mb-6">
                      <p className="text-sm text-gray-400 mb-1">Order ID</p>
                      <p className="text-white font-mono font-semibold">{checkout.orderId}</p>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={() => navigate('/user/orders')}
                      className="bg-accent hover:bg-accent/90 text-white"
                    >
                      View Orders
                    </Button>
                    <Button
                      onClick={() => navigate('/search')}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      Continue Shopping
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-900/20 flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">Payment Failed</h2>
                  <p className="text-gray-400 mb-6">
                    Your payment could not be processed. Please try again.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={() => navigate('/cart')}
                      className="bg-accent hover:bg-accent/90 text-white"
                    >
                      Return to Cart
                    </Button>
                    <Button
                      onClick={() => navigate('/search')}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      Continue Shopping
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show checkout status if checkoutId exists but no payment status
  if (checkoutId && checkout) {
    const isExpired = checkout.status === 'expired';
    const isCancelled = checkout.status === 'cancelled';
    const isPending = checkout.status === 'pending';

    return (
      <div className="min-h-[60vh] py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="bg-[#041536] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Checkout Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                {isExpired && (
                  <>
                    <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Checkout Expired</h3>
                    <p className="text-gray-400 mb-6">
                      This checkout session has expired. Please start a new checkout.
                    </p>
                  </>
                )}
                {isCancelled && (
                  <>
                    <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Checkout Cancelled</h3>
                    <p className="text-gray-400 mb-6">
                      This checkout session has been cancelled.
                    </p>
                  </>
                )}
                {isPending && (
                  <>
                    <Loader2 className="w-12 h-12 text-yellow-400 mx-auto mb-4 animate-spin" />
                    <h3 className="text-xl font-bold text-white mb-2">Payment Pending</h3>
                    <p className="text-gray-400 mb-6">
                      Please complete your payment on PayPal.
                    </p>
                    {checkout.paypalApprovalUrl && (
                      <Button
                        onClick={() => window.location.href = checkout.paypalApprovalUrl}
                        className="bg-accent hover:bg-accent/90 text-white mb-4"
                      >
                        Continue to PayPal
                      </Button>
                    )}
                  </>
                )}
              </div>

              {checkout.totalAmount && (
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Total Amount</p>
                  <p className="text-white text-2xl font-bold">${checkout.totalAmount.toFixed(2)}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                {isPending && (
                  <Button
                    onClick={() => cancelCheckoutMutation.mutate()}
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500/10"
                  >
                    Cancel Checkout
                  </Button>
                )}
                <Button
                  onClick={() => navigate('/cart')}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Return to Cart
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (!cart?.items || cart.items.length === 0) {
    return (
      <div className="min-h-[60vh] py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="bg-[#041536] border-gray-700">
            <CardContent className="py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
                <ShoppingCart className="w-12 h-12 text-gray-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-3">Your cart is empty</h2>
              <p className="text-gray-400 mb-6">Add items to your cart to proceed with checkout.</p>
              <Button
                onClick={() => navigate('/search')}
                className="bg-accent hover:bg-accent/90 text-white"
              >
                Browse Products
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate totals
  const subtotal = cart?.subtotal || cart?.items?.reduce((sum, item) => {
    const product = item.product || item.productId;
    const price = product?.price || item.unitPrice || 0;
    const qty = item.qty || item.quantity || 0;
    return sum + (price * qty);
  }, 0) || 0;

  const bundleDiscount = cart?.bundleDiscount || 0;
  const subscriptionDiscount = checkout?.subscriptionDiscount || 0;
  const couponDiscount = appliedCoupon?.discountAmount || checkout?.couponDiscount || 0;
  
  const totalDiscount = bundleDiscount + subscriptionDiscount + couponDiscount;
  const total = (cart?.total !== undefined) 
    ? cart.total - couponDiscount + (appliedCoupon ? (subtotal - bundleDiscount - subscriptionDiscount) * (appliedCoupon.discountPercent / 100) : 0)
    : subtotal - totalDiscount;

  // Main checkout form
  return (
    <div className="min-h-[60vh] py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Checkout</h1>
          <p className="text-gray-400">Review your order and complete your purchase</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Items Summary */}
            <Card className="bg-[#041536] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.items.map((item) => {
                  const product = item.product || item.productId;
                  const qty = item.qty || item.quantity || 0;
                  const unitPrice = item.unitPrice || product?.price || 0;
                  const lineTotal = qty * unitPrice;

                  return (
                    <div
                      key={product?._id || item.productId?._id}
                      className="flex gap-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50"
                    >
                      <Link
                        to={`/product/${product?.slug || product?._id}`}
                        className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-700"
                      >
                        {product?.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart className="w-8 h-8 text-gray-500" />
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/product/${product?.slug || product?._id}`}
                          className="block mb-1"
                        >
                          <h3 className="font-semibold text-white hover:text-accent transition-colors line-clamp-2">
                            {product?.name || 'Product'}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-400 mb-2">Quantity: {qty}</p>
                        <p className="text-lg font-bold text-accent">${lineTotal.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Coupon Code */}
            <Card className="bg-[#041536] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Coupon Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        setCouponError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !validateCouponMutation.isPending) {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      className="flex-1 bg-gray-800 border-gray-600 text-white"
                      disabled={validateCouponMutation.isPending}
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      disabled={validateCouponMutation.isPending}
                      className="bg-accent hover:bg-accent/90 text-white"
                    >
                      {validateCouponMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                            'Apply'
                          )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <div>
                      <p className="text-green-400 font-medium">{appliedCoupon.code}</p>
                      <p className="text-sm text-gray-400">
                        {appliedCoupon.discountType === 'percentage'
                          ? `${appliedCoupon.discountValue}% off`
                          : `$${appliedCoupon.discountAmount?.toFixed(2) || appliedCoupon.discountValue?.toFixed(2) || '0.00'} off`}
                      </p>
                    </div>
                    <Button
                      onClick={handleRemoveCoupon}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-red-400"
                      title="Remove coupon"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {couponError && (
                  <p className="text-red-400 text-sm mt-2">{couponError}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Total & Payment */}
          <div className="lg:col-span-1">
            <Card className="bg-[#041536] border-gray-700 sticky top-4">
              <CardHeader>
                <CardTitle className="text-white">Order Total</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal</span>
                    <span className="text-white">${subtotal.toFixed(2)}</span>
                  </div>

                  {bundleDiscount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Bundle Discount</span>
                      <span className="font-semibold">-${bundleDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  {subscriptionDiscount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Subscription Discount</span>
                      <span className="font-semibold">-${subscriptionDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Save with DGMarket Plus CTA */}
                  {!userSubscription?.hasSubscription && (
                    <div className="p-4 bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white mb-1">
                            Save with DGMarket Plus
                          </p>
                          <p className="text-xs text-gray-400 mb-3">
                            Get 2% off all purchases. Subscribe now and save on this order!
                          </p>
                          <Button
                            onClick={() => navigate('/dgmarq-plus')}
                            size="sm"
                            className="bg-accent hover:bg-accent/90 text-white text-xs"
                          >
                            Learn More
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Coupon Discount</span>
                      <span className="font-semibold">-${couponDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  {cart?.bundleDeal && (
                    <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg">
                      <p className="text-sm text-accent font-medium">
                        🎉 Bundle Deal Applied!
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{cart.bundleDeal.title}</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-lg font-semibold text-white">Total</span>
                    <span className="text-2xl font-bold text-accent">${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleProceedToPayment}
                  disabled={createCheckoutMutation.isPending || cart.items.length === 0}
                  className="w-full bg-accent hover:bg-accent/90 text-white"
                  size="lg"
                >
                  {createCheckoutMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Proceed to Pay
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => navigate('/cart')}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Return to Cart
                </Button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  By proceeding, you agree to our terms and conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        checkoutId={currentCheckoutId || checkoutId}
        totalAmount={total}
        currency="USD"
        onSuccess={(data) => {
          console.log('✅ [CHECKOUT] Payment successful:', data);
          const successCheckoutId = data?.checkoutId || currentCheckoutId || checkoutId;
          if (successCheckoutId) {
            navigate(`/checkout?checkoutId=${successCheckoutId}&status=success`);
            queryClient.invalidateQueries(['checkout', successCheckoutId]);
          }
        }}
      />
    </div>
  );
};

export default Checkout;

