import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { cartAPI, checkoutAPI, couponAPI, subscriptionAPI, walletAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import PaymentModal from '../../components/PaymentModal';
import { ShoppingCart, CheckCircle2, XCircle, AlertCircle, Loader2, Tag, X, Sparkles, ArrowRight, CreditCard, Wallet, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getGuestCart, clearGuestCart } from '../../utils/guestCart';

const Checkout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('paypal'); // 'wallet', 'paypal', 'card'
  const [walletBalance, setWalletBalance] = useState(0);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestEmailError, setGuestEmailError] = useState('');
  const [guestOrderSuccess, setGuestOrderSuccess] = useState(null);
  const [guestLicenseDetails, setGuestLicenseDetails] = useState(null);
  const [guestGrandTotal, setGuestGrandTotal] = useState(0);

  // Fetch cart
  const { data: cart, isLoading: cartLoading, isError: cartError } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartAPI.getCart().then(res => res.data.data),
    enabled: isAuthenticated && !checkoutId,
    retry: false,
  });

  const guestItemsFromState = location.state?.guestItems || null;
  const guestItemsFromStorage = (() => {
    try {
      const { items } = getGuestCart();
      return Array.isArray(items) && items.length > 0 ? items : null;
    } catch {
      return null;
    }
  })();
  const guestItemsRaw = guestItemsFromState || guestItemsFromStorage;
  const guestItems = Array.isArray(guestItemsRaw)
    ? guestItemsRaw.map((item) => ({ productId: item.productId || item.productId?._id, qty: Math.max(1, Number(item.qty) || 1) })).filter((item) => item.productId)
    : [];

  useEffect(() => {
    if (paymentStatus === 'success' && location.state?.guestOrder) {
      setGuestOrderSuccess(location.state.guestOrder);
      setGuestLicenseDetails(location.state.licenseDetails || null);
    }
  }, [paymentStatus, location.state]);

  // Fetch checkout status if checkoutId exists
  const { data: checkout, isLoading: checkoutLoading } = useQuery({
    queryKey: ['checkout', checkoutId],
    queryFn: () => checkoutAPI.getCheckoutStatus(checkoutId).then(res => res.data.data),
    enabled: !!checkoutId,
    retry: false,
  });

  // Fetch user's subscription status
  const { data: userSubscription } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => subscriptionAPI.getMySubscription().then(res => res.data.data),
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch wallet balance
  const { data: walletData } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => walletAPI.getBalance().then(res => res.data.data),
    enabled: isAuthenticated,
    retry: false,
    onSuccess: (data) => {
      setWalletBalance(data?.balance || 0);
    },
  });

  // Create checkout session mutation
  const createCheckoutMutation = useMutation({
    mutationFn: (data) => checkoutAPI.createCheckoutSession(data),
    onSuccess: (data) => {
      const checkoutId = data.data.data?.checkoutId;
      const checkoutData = data.data.data;
      
      // Update wallet balance from response
      if (checkoutData?.walletBalance !== undefined) {
        setWalletBalance(checkoutData.walletBalance);
      }
      
      if (checkoutId) {
        setCurrentCheckoutId(checkoutId);
        
        // If wallet payment is selected and sufficient, process immediately
        if (selectedPaymentMethod === 'wallet' && checkoutData?.paymentMethod === 'Wallet') {
          processWalletPaymentMutation.mutate(checkoutId);
        } else {
          // Otherwise, open payment modal for PayPal/Card
          setPaymentModalOpen(true);
        }
      }
    },
  });

  // Guest checkout session mutation
  const createGuestCheckoutMutation = useMutation({
    mutationFn: (data) => checkoutAPI.createGuestCheckoutSession(data),
    onSuccess: (data) => {
      const resData = data.data?.data || data.data;
      const id = resData?.checkoutId;
      const grandTotal = resData?.grandTotal ?? resData?.totalAmount ?? 0;
      if (id) {
        setCurrentCheckoutId(id);
        setGuestGrandTotal(grandTotal);
        setPaymentModalOpen(true);
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Could not start checkout');
    },
  });

  // Process wallet payment mutation
  const processWalletPaymentMutation = useMutation({
    mutationFn: (checkoutId) => checkoutAPI.payWithWallet(checkoutId),
    onSuccess: (data) => {
      const orderData = data.data.data;
      queryClient.invalidateQueries(['wallet-balance']);
      queryClient.invalidateQueries(['cart']);
      toast.success('Payment successful! Order created.');
      navigate(`/checkout?checkoutId=${currentCheckoutId || orderData?.order?._id}&status=success`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Wallet payment failed');
    },
  });

  // Process card payment mutation
  const processCardPaymentMutation = useMutation({
    mutationFn: ({ checkoutId, cardData }) => checkoutAPI.processCardPayment(checkoutId, cardData),
    onSuccess: (data) => {
      const checkoutId = data.data.data?.checkoutId;
      if (checkoutId) {
        // Redirect to success page
        navigate(`/checkout?checkoutId=${checkoutId}&status=success`);
        setPaymentModalOpen(false);
        queryClient.invalidateQueries(['checkout', checkoutId]);
      }
    },
    onError: () => {},
  });

  // Cancel checkout mutation
  const cancelCheckoutMutation = useMutation({
    mutationFn: () => checkoutAPI.cancelCheckout(checkoutId),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      navigate('/cart');
    },
  });

  // Totals (safe when cart/checkout missing e.g. on success page) – must run before any return for stable hook count
  const subtotal = cart?.subtotal ?? cart?.items?.reduce((sum, item) => {
    const product = item.product || item.productId;
    const price = product?.price || item.unitPrice || 0;
    const qty = item.qty || item.quantity || 0;
    return sum + (price * qty);
  }, 0) ?? 0;
  const bundleDiscount = cart?.bundleDiscount ?? 0;
  const subscriptionDiscount = checkout?.subscriptionDiscount ?? 0;
  const couponDiscount = appliedCoupon?.discountAmount ?? checkout?.couponDiscount ?? 0;
  const totalDiscount = bundleDiscount + subscriptionDiscount + couponDiscount;
  const totalBeforeFee = (cart?.total !== undefined)
    ? cart.total - couponDiscount + (appliedCoupon ? (subtotal - bundleDiscount - subscriptionDiscount) * ((appliedCoupon.discountPercent ?? 0) / 100) : 0)
    : subtotal - totalDiscount;

  // Buyer handling fee (hook must run every render; disabled when not needed)
  const { data: handlingFeeEstimate } = useQuery({
    queryKey: ['handling-fee-estimate', totalBeforeFee],
    queryFn: () => checkoutAPI.getHandlingFeeEstimate(totalBeforeFee).then(res => res.data.data),
    enabled: isAuthenticated && totalBeforeFee > 0,
    retry: false,
  });
  const buyerHandlingFee = handlingFeeEstimate?.buyerHandlingFee ?? 0;
  const grandTotal = handlingFeeEstimate?.grandTotal ?? totalBeforeFee;
  const handlingFeeEnabled = handlingFeeEstimate?.enabled ?? false;
  const feeLabel = handlingFeeEstimate?.feeLabel ?? null;

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
    
    // Validate wallet payment if selected
    if (selectedPaymentMethod === 'wallet') {
      if (walletBalance <= 0) {
        toast.error('Insufficient wallet balance. Please add funds or choose another payment method.');
        return;
      }
      if (walletBalance < grandTotal) {
        toast.error(`Insufficient wallet balance. Your balance is $${walletBalance.toFixed(2)}, but the total is $${grandTotal.toFixed(2)}.`);
        return;
      }
    }
    
    // Create checkout session with preferred payment method
    createCheckoutMutation.mutate({
      couponCode: appliedCoupon?.code || couponCode || undefined,
      preferredPaymentMethod: selectedPaymentMethod === 'wallet' ? 'Wallet' : 
                              selectedPaymentMethod === 'card' ? 'Card' : 'PayPal',
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
    }).catch(() => {});
  };

  const handleCardPayment = (cardData) => {
    if (!currentCheckoutId) return;
    
    processCardPaymentMutation.mutate({
      checkoutId: currentCheckoutId,
      cardData,
    });
  };

  // Guest checkout success (data from capture response via state)
  const showGuestSuccess = !isAuthenticated && (guestOrderSuccess || location.state?.guestOrder) && (checkoutId && paymentStatus === 'success');
  const guestOrder = guestOrderSuccess || location.state?.guestOrder;
  const guestLicenses = guestLicenseDetails || location.state?.licenseDetails;

  if (showGuestSuccess && guestOrder) {
    return (
      <div className="min-h-[60vh] py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="bg-[#041536] border-gray-700">
            <CardContent className="py-12 px-6">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 text-center">Payment Successful!</h2>
              <p className="text-gray-400 mb-6 text-center">
                Your order has been placed. A copy of your license details has been sent to your email.
              </p>
              <div className="bg-gray-800/50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-400 mb-1">Order ID</p>
                <p className="text-white font-mono font-semibold">{guestOrder.orderNumber || guestOrder._id}</p>
              </div>
              {Array.isArray(guestLicenses) && guestLicenses.length > 0 && (
                <div className="space-y-4 mb-6">
                  {guestLicenses.map((detail, idx) => (
                    <div key={idx} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400 mb-1">Product</p>
                      <p className="text-white font-semibold mb-3">{detail.productName || 'Product'}</p>
                      {detail.productType === 'ACCOUNT_BASED' && detail.keys?.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-400">Account credentials:</p>
                          {typeof detail.keys[0] === 'string' && detail.keys[0].startsWith('{') ? (
                            <pre className="text-sm text-white bg-gray-900 p-3 rounded break-all">{detail.keys[0]}</pre>
                          ) : (
                            detail.keys.map((k, i) => (
                              <p key={i} className="text-white font-mono text-sm break-all">{k}</p>
                            ))
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-gray-400 mb-1">License key(s):</p>
                          {detail.keys?.map((k, i) => (
                            <p key={i} className="text-white font-mono text-sm break-all bg-gray-900 p-2 rounded mt-1">{k}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-400 text-center mb-6">A copy has been sent to your email.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/search')} className="bg-accent hover:bg-accent/90 text-white">
                  Continue Shopping
                </Button>
                <Button onClick={() => navigate('/login')} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                  Sign in to your account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Not authenticated + no guest items: offer sign in or buy as guest from product
  if (!isAuthenticated && (!guestItems || guestItems.length === 0) && !checkoutId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12">
        <Card className="bg-[#041536] border-gray-700 max-w-md w-full mx-4">
          <CardContent className="py-12 px-6 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
              <ShoppingCart className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Checkout</h2>
            <p className="text-gray-400 mb-6">
              Sign in to use your cart, or buy as guest from a product page.
            </p>
            <Button onClick={() => navigate('/login')} className="bg-accent hover:bg-accent/90 text-white mb-3" size="lg">
              Sign In
            </Button>
            <Button onClick={() => navigate('/search')} variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800">
              Browse Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Guest checkout form (not authenticated, has guest items, not on success)
  if (!isAuthenticated && guestItems.length > 0 && !showGuestSuccess) {
    const handleGuestProceed = () => {
      const email = (guestEmail || '').trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
        setGuestEmailError('Email is required for guest checkout');
        toast.error('Please enter your email');
        return;
      }
      if (!emailRegex.test(email)) {
        setGuestEmailError('Please enter a valid email address');
        toast.error('Please enter a valid email address');
        return;
      }
      setGuestEmailError('');
      createGuestCheckoutMutation.mutate({
        guestEmail: email,
        items: guestItems,
        couponCode: appliedCoupon?.code || couponCode || undefined,
      });
    };

    return (
      <div className="min-h-[60vh] py-8">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-white mb-2">Guest Checkout</h1>
          <p className="text-gray-400 mb-6">Enter your email to receive your order and license details.</p>
          <Card className="bg-[#041536] border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="email"
                placeholder="your@email.com"
                value={guestEmail}
                onChange={(e) => {
                  setGuestEmail(e.target.value);
                  setGuestEmailError('');
                }}
                className="bg-gray-800 border-gray-600 text-white"
              />
              {guestEmailError && <p className="text-red-400 text-sm mt-2">{guestEmailError}</p>}
            </CardContent>
          </Card>
          <Card className="bg-[#041536] border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Order summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">Items: {guestItems.length} product(s). Total will be shown after you proceed.</p>
              <ul className="space-y-2">
                {guestItems.map((item, i) => (
                  <li key={i} className="text-gray-300">
                    Product ID: {item.productId} × {item.qty}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Button
            onClick={handleGuestProceed}
            disabled={createGuestCheckoutMutation.isPending}
            className="w-full bg-accent hover:bg-accent/90 text-white"
            size="lg"
          >
            {createGuestCheckoutMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Preparing checkout...
              </>
            ) : (
              'Proceed to payment'
            )}
          </Button>
          <Button
            onClick={() => navigate('/search')}
            variant="outline"
            className="w-full mt-3 border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Continue shopping
          </Button>
        </div>
        <PaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          checkoutId={currentCheckoutId}
          totalAmount={guestGrandTotal || (checkout?.grandTotal ?? checkout?.totalAmount ?? 0)}
          currency="USD"
          walletBalance={0}
          walletAmount={0}
          cardAmount={guestGrandTotal || (checkout?.grandTotal ?? checkout?.cardAmount ?? checkout?.totalAmount ?? 0)}
          paymentMethod="PayPal"
          onSuccess={(data) => {
            const order = data?.order || data?.data?.order;
            const licenseDetails = data?.licenseDetails || data?.data?.licenseDetails;
            setGuestOrderSuccess(order || null);
            setGuestLicenseDetails(licenseDetails || null);
            if (order) {
              navigate(`/checkout?checkoutId=${currentCheckoutId}&status=success`, {
                state: { guestOrder: order, licenseDetails: licenseDetails || null },
              });
            } else {
              navigate(`/checkout?checkoutId=${currentCheckoutId}&status=success`);
            }
            setPaymentModalOpen(false);
            try {
              clearGuestCart();
            } catch (_) {}
          }}
        />
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

                  {/* Buyer Handling Fee (read-only; from server) */}
                  {handlingFeeEnabled && buyerHandlingFee > 0 && (
                    <div className="flex justify-between text-gray-300">
                      <span>Buyer Handling Fee{feeLabel ? ` (${feeLabel})` : ''}</span>
                      <span className="text-white">${buyerHandlingFee.toFixed(2)}</span>
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

                {/* Wallet Balance Display */}
                {isAuthenticated && (
                  <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-accent" />
                        <span className="text-sm font-medium text-gray-300">Wallet Balance</span>
                      </div>
                      <span className="text-lg font-bold text-white">${walletBalance.toFixed(2)}</span>
                    </div>
                    {walletBalance >= grandTotal && (
                      <p className="text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Sufficient balance for this order
                      </p>
                    )}
                    {walletBalance > 0 && walletBalance < grandTotal && (
                      <p className="text-xs text-yellow-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Partial balance available (${(grandTotal - walletBalance).toFixed(2)} remaining)
                      </p>
                    )}
                    {walletBalance === 0 && (
                      <p className="text-xs text-gray-500">Add funds to your wallet to pay faster</p>
                    )}
                  </div>
                )}

                {/* Payment Method Selection */}
                {isAuthenticated && (
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {walletBalance >= grandTotal && (
                        <Button
                          type="button"
                          onClick={() => setSelectedPaymentMethod('wallet')}
                          variant={selectedPaymentMethod === 'wallet' ? 'default' : 'outline'}
                          className={`h-auto py-3 ${
                            selectedPaymentMethod === 'wallet'
                              ? 'bg-accent hover:bg-accent/90 text-white'
                              : 'border-gray-600 text-gray-300 hover:bg-gray-800'
                          }`}
                          disabled={createCheckoutMutation.isPending}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <Wallet className="w-5 h-5" />
                            <span className="text-xs font-medium">Wallet</span>
                          </div>
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={() => setSelectedPaymentMethod('paypal')}
                        variant={selectedPaymentMethod === 'paypal' ? 'default' : 'outline'}
                        className={`h-auto py-3 ${
                          selectedPaymentMethod === 'paypal'
                            ? 'bg-accent hover:bg-accent/90 text-white'
                            : 'border-gray-600 text-gray-300 hover:bg-gray-800'
                        }`}
                        disabled={createCheckoutMutation.isPending}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <img
                            src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg"
                            alt="PayPal"
                            className="h-6 w-auto"
                          />
                          <span className="text-xs font-medium">PayPal</span>
                        </div>
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setSelectedPaymentMethod('card')}
                        variant={selectedPaymentMethod === 'card' ? 'default' : 'outline'}
                        className={`h-auto py-3 ${
                          selectedPaymentMethod === 'card'
                            ? 'bg-accent hover:bg-accent/90 text-white'
                            : 'border-gray-600 text-gray-300 hover:bg-gray-800'
                        }`}
                        disabled={createCheckoutMutation.isPending}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <CreditCard className="w-5 h-5" />
                          <span className="text-xs font-medium">Card</span>
                        </div>
                      </Button>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-lg font-semibold text-white">{handlingFeeEnabled && buyerHandlingFee > 0 ? 'Grand Total' : 'Total'}</span>
                    <span className="text-2xl font-bold text-accent">${grandTotal.toFixed(2)}</span>
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
                      {selectedPaymentMethod === 'wallet' ? (
                        <>
                          <Wallet className="w-4 h-4 mr-2" />
                          Pay with Wallet
                        </>
                      ) : selectedPaymentMethod === 'card' ? (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pay with Card
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Proceed to Pay
                        </>
                      )}
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
        totalAmount={grandTotal}
        currency="USD"
        walletBalance={walletBalance}
        walletAmount={checkout?.walletAmount || 0}
        cardAmount={checkout?.cardAmount || grandTotal}
        paymentMethod={checkout?.paymentMethod || 'PayPal'}
        onSuccess={(data) => {
          const successCheckoutId = data?.checkoutId || data?.order?._id || currentCheckoutId || checkoutId;
          if (successCheckoutId) {
            navigate(`/checkout?checkoutId=${successCheckoutId}&status=success`);
            queryClient.invalidateQueries(['checkout', successCheckoutId]);
            queryClient.invalidateQueries(['wallet-balance']);
            queryClient.invalidateQueries(['cart']);
          }
        }}
      />
    </div>
  );
};

export default Checkout;

