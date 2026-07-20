import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { cartAPI, checkoutAPI, couponAPI, subscriptionAPI, walletAPI } from '@services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import {
  PaymentModal, CheckoutSteps, SellerAvatar, PaymentLogos, toCartItems, DELIVERY_LABEL,
  getGuestCart, clearGuestCart, removeFromGuestCart, updateGuestCartQuantity, useGuestCart,
} from '@features/cart-checkout';
import {
  ShoppingCart, CheckCircle2, XCircle, AlertCircle, Loader2, Sparkles, CreditCard,
  ChevronLeft, ChevronDown, Trash2, Check, ShieldCheck, Lock, Zap, Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import SafeImage from '@components/ui/safe-image';
import RegionBadges from '@features/catalog/components/RegionBadges';
import useCurrency from '@hooks/useCurrency';
import useBuyerCountry from '@hooks/useBuyerCountry';
import './Checkout.css';

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

// Mirrors the backend's SUBSCRIPTION_DISCOUNT_RATE (constants.js). Preview only —
// the server recomputes the real discount when the checkout session is created.
const SUBSCRIPTION_DISCOUNT_RATE = 0.02;
const SUBSCRIPTION_PRICE_LABEL = 'US$9.99/mo';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Checkout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { format: formatPrice, currency: displayCurrency } = useCurrency();
  const { country } = useBuyerCountry();

  const checkoutId = searchParams.get('checkoutId');
  const paymentStatus = searchParams.get('status');

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [promoOpen, setPromoOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [currentCheckoutId, setCurrentCheckoutId] = useState(null);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestEmailError, setGuestEmailError] = useState('');
  const [guestOrderSuccess, setGuestOrderSuccess] = useState(null);
  const [guestLicenseDetails, setGuestLicenseDetails] = useState(null);
  const [guestGrandTotal, setGuestGrandTotal] = useState(0);
  const [guestCartItems, setGuestCartItems] = useGuestCart(isAuthenticated);

  // ONE shared ["cart"] query — same key/shape the Header + mini-cart use, so
  // react-query serves all of them from a single fetch.
  const { data: cart, isLoading: cartLoading, isError: cartError } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartAPI.getCart().then(res => res.data.data),
    enabled: isAuthenticated && !checkoutId,
    staleTime: 30_000,
    retry: false,
  });

  useEffect(() => {
    if (paymentStatus === 'success' && location.state?.guestOrder) {
      setTimeout(() => {
        setGuestOrderSuccess(location.state.guestOrder);
        setGuestLicenseDetails(location.state.licenseDetails || null);
      }, 0);
    }
  }, [paymentStatus, location.state]);

  const { data: checkout, isLoading: checkoutLoading } = useQuery({
    queryKey: ['checkout', checkoutId],
    queryFn: () => checkoutAPI.getCheckoutStatus(checkoutId).then(res => res.data.data),
    enabled: !!checkoutId,
    retry: false,
  });

  const { data: userSubscription } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => subscriptionAPI.getMySubscription().then(res => res.data.data),
    enabled: isAuthenticated,
    retry: false,
  });

  // Feeds <PaymentModal>'s wallet tile — the modal owns the wallet flow itself
  // (it calls payWithWallet, which promotes the session to Wallet server-side).
  const { data: walletData } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => walletAPI.getBalance().then(res => res.data.data),
    enabled: isAuthenticated,
    retry: false,
  });
  const walletBalance = walletData?.balance ?? 0;

  const removeItemMutation = useMutation({
    mutationFn: (data) => cartAPI.removeItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item removed from cart');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to remove item'),
  });

  const updateCartMutation = useMutation({
    mutationFn: (data) => cartAPI.updateCart(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update cart'),
  });

  const createCheckoutMutation = useMutation({
    mutationFn: (data) => checkoutAPI.createCheckoutSession(data),
    onSuccess: (data) => {
      const newCheckoutId = data.data.data?.checkoutId;
      if (newCheckoutId) {
        setCurrentCheckoutId(newCheckoutId);
        setPaymentModalOpen(true);
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not start checkout'),
  });

  const createGuestCheckoutMutation = useMutation({
    mutationFn: (data) => checkoutAPI.createGuestCheckoutSession(data),
    onSuccess: (data) => {
      const resData = data.data?.data || data.data;
      const id = resData?.checkoutId;
      const total = resData?.grandTotal ?? resData?.totalAmount ?? 0;
      if (id) {
        setCurrentCheckoutId(id);
        setGuestGrandTotal(total);
        setPaymentModalOpen(true);
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not start checkout'),
  });

  const cancelCheckoutMutation = useMutation({
    mutationFn: () => checkoutAPI.cancelCheckout(checkoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      navigate('/cart');
    },
  });

  // ── one render model for both auth (server) and guest (localStorage) lines ──
  const items = toCartItems(isAuthenticated ? cart?.items : guestCartItems, isAuthenticated);

  const remove = (productId, sellerId) => {
    if (isAuthenticated) removeItemMutation.mutate({ productId, sellerId });
    else {
      removeFromGuestCart(productId);
      setGuestCartItems(getGuestCart().items);
      toast.success('Item removed from cart');
    }
  };
  const setQty = (productId, sellerId, qty) => {
    if (qty <= 0) return remove(productId, sellerId);
    if (isAuthenticated) updateCartMutation.mutate({ productId, sellerId, qty });
    else {
      updateGuestCartQuantity(productId, qty);
      setGuestCartItems(getGuestCart().items);
    }
  };

  // ── summary (mirrors the mockup's recalc(): protection is a % of the amount
  //    AFTER discounts, the processing fee is flat once per order) ──
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = isAuthenticated
    ? cart?.subtotal ?? items.reduce((s, i) => s + i.price * i.qty, 0)
    : items.reduce((s, i) => s + i.price * i.qty, 0);
  const youSave = round2(
    items.reduce((s, i) => s + (i.original && i.original > i.price ? (i.original - i.price) * i.qty : 0), 0)
  );
  const bundleDiscount = isAuthenticated ? cart?.bundleDiscount || 0 : 0;
  const couponBase = round2(Math.max(0, subtotal - bundleDiscount));
  const couponDiscount = appliedCoupon
    ? (appliedCoupon.discountType === 'percentage'
      ? round2((couponBase * (appliedCoupon.discountValue || 0)) / 100)
      : Math.min(appliedCoupon.discountAmount || appliedCoupon.discountValue || 0, couponBase))
    : 0;
  const previewAfterCoupon = round2(Math.max(0, couponBase - couponDiscount));
  const subscriptionDiscount = userSubscription?.hasSubscription
    ? round2(previewAfterCoupon * SUBSCRIPTION_DISCOUNT_RATE)
    : 0;
  const totalDiscount = bundleDiscount + subscriptionDiscount + couponDiscount;
  const totalBeforeFee = round2(Math.max(0, subtotal - totalDiscount));

  // Public endpoint — guests see the same fees as members.
  const { data: handlingFeeEstimate } = useQuery({
    queryKey: ['handling-fee-estimate', totalBeforeFee],
    queryFn: () => checkoutAPI.getHandlingFeeEstimate(totalBeforeFee).then(res => res.data.data),
    enabled: totalBeforeFee > 0,
    retry: false,
  });
  const protectionFee = handlingFeeEstimate?.protectionFee ?? 0;
  const processingFee = handlingFeeEstimate?.processingFee ?? 0;
  const protectionLabel = handlingFeeEstimate?.protectionLabel ?? null;
  const grandTotal = handlingFeeEstimate?.grandTotal ?? totalBeforeFee;
  const serviceFee = round2(protectionFee + processingFee);

  const validateCouponMutation = useMutation({
    mutationFn: ({ code, orderAmount }) => couponAPI.validateCoupon({ code, orderAmount }),
    onSuccess: (response) => {
      const couponData = response.data?.data?.coupon || response.data?.data;
      if (!couponData) {
        setCouponError('Invalid coupon code');
        return;
      }
      setAppliedCoupon({
        code: couponData.code,
        discountType: couponData.discountType,
        discountValue: couponData.discountValue,
        discountAmount: couponData.discountAmount || 0,
      });
      setCouponError('');
      toast.success('Coupon applied successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Invalid or expired code';
      setCouponError(message);
      setAppliedCoupon(null);
    },
  });

  const handleApplyCoupon = () => {
    const trimmedCode = couponCode.trim();
    if (!trimmedCode) {
      setCouponError('Please enter a coupon code');
      return;
    }
    // Coupon must be validated before the subscription discount is applied.
    validateCouponMutation.mutate({ code: trimmedCode, orderAmount: couponBase });
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponError('');
  };

  const handleProceedToPayment = () => {
    if (items.length === 0) return;

    if (!termsAccepted) {
      setTermsError(true);
      toast.error('Please accept the Terms of Service to continue');
      return;
    }

    if (!isAuthenticated) {
      const email = guestEmail.trim();
      if (!email || !EMAIL_RE.test(email)) {
        setGuestEmailError(email ? 'Please enter a valid email address' : 'Email is required for guest checkout');
        toast.error('Please enter a valid email');
        return;
      }
      setGuestEmailError('');
      createGuestCheckoutMutation.mutate({
        guestEmail: email,
        // sellerId identifies which offer the guest picked — master products are
        // admin-owned, so the server can't infer the seller from the product.
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.name,
          qty: i.qty,
          sellerId: i.sellerId || undefined,
        })),
        couponCode: appliedCoupon?.code || undefined,
      });
      return;
    }

    createCheckoutMutation.mutate({ couponCode: appliedCoupon?.code || undefined });
  };

  const isStarting = createCheckoutMutation.isPending || createGuestCheckoutMutation.isPending;

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
                  {guestLicenses.map((detail, idx) => {
                    const isAccount = detail.productType === 'ACCOUNT_BASED';
                    return (
                      <div
                        key={idx}
                        className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                      >
                        <p className="text-sm text-gray-400 mb-1">Product</p>
                        <p className="text-white font-semibold mb-3">
                          {detail.productName || 'Product'}
                        </p>
                        {isAccount && detail.keys?.length > 0 ? (
                          <div className="space-y-3">
                            <p className="text-sm text-gray-400">Account credentials:</p>
                            {detail.keys.map((k, i) => {
                              let creds = null;
                              if (typeof k === 'string' && k.trim().startsWith('{')) {
                                try {
                                  creds = JSON.parse(k);
                                } catch {
                                  creds = null;
                                }
                              }

                              if (!creds || typeof creds !== 'object') {
                                return (
                                  <p
                                    key={i}
                                    className="text-white font-mono text-sm break-all bg-gray-900 p-2 rounded mt-1"
                                  >
                                    {k}
                                  </p>
                                );
                              }

                              const email = creds.email || creds.emailAddress || null;
                              const usernameId = creds.usernameId || creds.username || null;
                              const rawPassword = creds.password || null;
                              const emailPassword =
                                creds.emailPassword ||
                                (email && !usernameId ? rawPassword : null) ||
                                null;
                              const usernamePassword =
                                creds.usernamePassword ||
                                (usernameId ? rawPassword : null) ||
                                null;
                              const hasAnyUsername = !!usernameId || !!usernamePassword;

                              return (
                                <div
                                  key={i}
                                  className="space-y-2 bg-gray-900 p-3 rounded mt-1 text-left"
                                >
                                  {email && (
                                    <div>
                                      <p className="text-xs text-gray-400 mb-0.5">Email:</p>
                                      <p className="text-white font-mono text-sm break-all">
                                        {email}
                                      </p>
                                    </div>
                                  )}
                                  {emailPassword && (
                                    <div>
                                      <p className="text-xs text-gray-400 mb-0.5">
                                        Email Password:
                                      </p>
                                      <p className="text-white font-mono text-sm break-all">
                                        {emailPassword}
                                      </p>
                                    </div>
                                  )}
                                  {hasAnyUsername && (
                                    <>
                                      {usernameId && (
                                        <div>
                                          <p className="text-xs text-gray-400 mb-0.5">
                                            Username ID:
                                          </p>
                                          <p className="text-white font-mono text-sm break-all">
                                            {usernameId}
                                          </p>
                                        </div>
                                      )}
                                      {usernamePassword && (
                                        <div>
                                          <p className="text-xs text-gray-400 mb-0.5">
                                            Username Password:
                                          </p>
                                          <p className="text-white font-mono text-sm break-all">
                                            {usernamePassword}
                                          </p>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  {!email && !emailPassword && !hasAnyUsername && (
                                    <pre className="text-xs text-gray-300 break-all">
                                      {JSON.stringify(creds, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-gray-400 mb-1">License key(s):</p>
                            {detail.keys?.map((k, i) => (
                              <p
                                key={i}
                                className="text-white font-mono text-sm break-all bg-gray-900 p-2 rounded mt-1"
                              >
                                {k}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
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

  if ((isAuthenticated && cartLoading) || checkoutLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading checkout...</p>
        </div>
      </div>
    );
  }

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
              onClick={() => queryClient.invalidateQueries({ queryKey: ['cart'] })}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                  <p className="text-white text-2xl font-bold">{formatPrice(checkout.totalAmount)}</p>
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

  if (items.length === 0) {
    return (
      <div className="co-wrap">
        <div className="co-empty" style={{ padding: '80px 20px' }}>
          <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-[rgba(58,116,240,0.5)]" strokeWidth={1.5} />
          <h2 className="mb-2 text-[22px] font-bold text-white">Your cart is empty</h2>
          <p className="mb-6">Add items to your cart to proceed with checkout.</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={() => navigate('/search')} className="bg-accent hover:bg-accent/90 text-white">
              Browse Products
            </Button>
            {!isAuthenticated && (
              <Button onClick={() => navigate('/login')} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="co-wrap">
      <button type="button" className="co-back" onClick={() => navigate('/cart')}>
        <ChevronLeft className="h-[15px] w-[15px]" /> Back to cart
      </button>

      <div className="co-head">
        <h1>
          <CreditCard className="h-[26px] w-[26px]" strokeWidth={2} />
          Checkout
        </h1>
      </div>

      <CheckoutSteps current="checkout" />

      <div className="co-eneba">
        {/* ── LEFT: cart items ── */}
        <div className="co-left">
          <div className="co-panel">
            <h2 className="co-panel-h">My cart</h2>
            {items.map((it) => (
              <div key={it.key} className="co-citem">
                <Link to={`/product/${it.slug}`} className="co-cthumb">
                  {it.image ? (
                    <SafeImage src={it.image} alt={it.name} />
                  ) : (
                    <ShoppingCart className="h-8 w-8 text-white/20" />
                  )}
                </Link>

                <div className="co-cbody">
                  <Link to={`/product/${it.slug}`} className="co-ctitle">{it.name}</Link>

                  <div className="co-cspecs">
                    {it.platform && (<><span className="k">Platform:</span><span className="v">{it.platform}</span></>)}
                    {it.productType && (<><span className="k">Type:</span><span className="v">{it.productType.replace(/_/g, ' ')}</span></>)}
                    {it.region && (
                      <>
                        <span className="k">Region:</span>
                        <span className="v"><RegionBadges  compact maxChips={3} showLabel={false}  /></span>
                      </>
                    )}
                    {it.device && (<><span className="k">Device:</span><span className="v">{it.device}</span></>)}
                    <span className="k">Delivery:</span>
                    <span className="v">
                      <span className="co-dbadge"><Zap className="h-[11px] w-[11px]" fill="currentColor" />{DELIVERY_LABEL}</span>
                    </span>
                    {it.stock != null && (
                      <>
                        <span className="k">Stock:</span>
                        <span className="v">
                          <span className={`co-stockval ${it.stock === 0 ? 'out' : ''}`}>
                            <CheckCircle2 className="h-[13px] w-[13px]" />
                            {it.stock} in stock
                          </span>
                        </span>
                      </>
                    )}
                  </div>

                  <div className="co-cmeta">
                    {it.region && country && (
                      <>
                        <RegionBadges offer={it.region} compact maxChips={0} showLabel={false} interactive={false} showWarning />
                        <span className="co-dot">·</span>
                      </>
                    )}
                    {it.seller && (
                      <span className="co-csold">
                        <SellerAvatar name={it.seller} size={20} />
                        <span>
                          Sold by{' '}
                          {it.sellerId
                            ? <Link to={`/seller/${it.sellerId}`} className="hover:underline"><strong>{it.seller}</strong></Link>
                            : <strong>{it.seller}</strong>}
                          {it.sellerRating > 0 && (
                            <span className="srate">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="#F58E2A" aria-hidden="true">
                                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                              </svg>
                              {Number(it.sellerRating).toFixed(1)}<em>/5</em>
                            </span>
                          )}
                        </span>
                      </span>
                    )}
                    {it.isPreorder && (
                      <span className="rounded border border-amber-500/50 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                        PRE-ORDER
                      </span>
                    )}
                  </div>

                  <div className="co-crow">
                    <div className="co-cqty">
                      <button type="button" onClick={() => setQty(it.productId, it.sellerId, it.qty - 1)} disabled={it.qty <= 1} aria-label="Decrease quantity">−</button>
                      <span>{it.qty}</span>
                      <button type="button" onClick={() => setQty(it.productId, it.sellerId, it.qty + 1)} aria-label="Increase quantity">+</button>
                    </div>
                    <div className="co-cprice">
                      {formatPrice(it.price * it.qty)}
                      {it.hasDiscount && it.original != null && it.original > it.price && (
                        <span className="was">{formatPrice(it.original * it.qty)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <button type="button" className="co-cdel" onClick={() => remove(it.productId, it.sellerId)} aria-label="Remove">
                  <Trash2 className="h-[18px] w-[18px]" />
                </button>
              </div>
            ))}
          </div>

          {cart?.bundleDeal && (
            <div className="co-panel" style={{ padding: '16px 18px' }}>
              <p className="text-sm font-medium text-accent">🎉 Bundle Deal Applied!</p>
              <p className="mt-1 text-xs text-gray-400">{cart.bundleDeal.title}</p>
            </div>
          )}
        </div>

        {/* ── RIGHT: email + Plus + summary ── */}
        <div className="co-right">
          <div className="co-panel">
            <h2 className="co-panel-h sm" style={{ marginBottom: 6 }}>Enter your email</h2>
            <p className="m-0 mb-4 text-[13px] leading-[1.5] text-white/55">
              {isAuthenticated
                ? 'We’ll send the order to your account email.'
                : 'We need it to send you the order.'}
            </p>
            <div className={`co-field ${guestEmailError ? 'err' : ''}`}>
              <label htmlFor="co-email">Email {!isAuthenticated && <span className="co-req">*</span>}</label>
              <input
                id="co-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={isAuthenticated ? (user?.email || '') : guestEmail}
                disabled={isAuthenticated}
                onChange={(e) => {
                  setGuestEmail(e.target.value);
                  setGuestEmailError('');
                }}
              />
              {guestEmailError && <p className="co-fielderr">{guestEmailError}</p>}
            </div>
          </div>

          {!userSubscription?.hasSubscription && (
            <Link to="/dgmarq-plus" className="co-plus" aria-label="Join DGMARQ Plus">
              <div className="co-plus-in">
                <span className="co-plus-spark">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z" />
                  </svg>
                </span>
                <div className="co-plus-txt">
                  <span className="co-plus-kicker"><span className="dot"></span>Members save more</span>
                  <h3 className="co-plus-h">Join <em>DGMARQ Plus</em> — save 2% on this order</h3>
                  <p className="co-plus-sub">
                    2% off all products applied automatically at checkout, plus access to DGMARQ Points.
                    {' '}{SUBSCRIPTION_PRICE_LABEL}, cancel anytime.
                  </p>
                </div>
                <span className="co-plus-cta">
                  Join Plus
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </div>
            </Link>
          )}

          <div className="co-panel">
            <h2 className="co-panel-h sm">Summary</h2>

            <button type="button" className="co-proceed" onClick={handleProceedToPayment} disabled={isStarting}>
              {isStarting ? (
                <><Loader2 className="h-[17px] w-[17px] animate-spin" /> Preparing checkout…</>
              ) : (
                <><CreditCard className="h-[17px] w-[17px]" /> Proceed to Payment</>
              )}
            </button>

            <div className="co-sumlines">
              <div className="co-line">
                <span>{totalQty} {totalQty === 1 ? 'product' : 'products'}</span>
                <span className="v">{formatPrice(subtotal)}</span>
              </div>
              {youSave > 0 && (
                <div className="co-line save">
                  <span>You save</span>
                  <span className="v">−{formatPrice(youSave)}</span>
                </div>
              )}
              {bundleDiscount > 0 && (
                <div className="co-line save">
                  <span>Bundle deal</span>
                  <span className="v">−{formatPrice(bundleDiscount)}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="co-line save">
                  <span>Promo discount</span>
                  <span className="v">−{formatPrice(couponDiscount)}</span>
                </div>
              )}
              {subscriptionDiscount > 0 && (
                <div className="co-line save">
                  <span>DGMARQ Plus discount</span>
                  <span className="v">−{formatPrice(subscriptionDiscount)}</span>
                </div>
              )}
              {serviceFee > 0 && (
                <div className="co-line">
                  <span className="lbl">
                    Service fee
                    <span
                      className="info"
                      title={`Buyer Protection${protectionLabel ? ` (${protectionLabel})` : ''} + ${formatPrice(processingFee)} checkout fee — covers escrow, refunds and dispute protection.`}
                    >
                      i
                    </span>
                  </span>
                  <span className="v">{formatPrice(serviceFee)}</span>
                </div>
              )}
            </div>

            <div className="co-totalrow">
              <span className="lbl">Total:</span>
              <span className="amt">{formatPrice(grandTotal)}</span>
            </div>
            <div className="co-tax">
              {displayCurrency === 'USD'
                ? 'Billed in USD. Taxes included where applicable.'
                : `Prices shown in ${displayCurrency} are approximate — you'll be charged $${grandTotal.toFixed(2)} USD.`}
            </div>

            {userSubscription?.hasSubscription && Math.floor(totalBeforeFee * 3) > 0 && (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-accent/30 bg-accent/10 px-3 py-2">
                <span className="flex items-center gap-1.5 text-sm text-accent">
                  <Sparkles className="h-4 w-4" />
                  DGMARQ Plus reward
                </span>
                <span className="text-sm font-semibold text-white">
                  You&apos;ll earn {Math.floor(totalBeforeFee * 3)} points
                </span>
              </div>
            )}

            <label className={`co-consent ${termsError ? 'err' : ''}`}>
              <input
                type="checkbox"
                aria-label="Agree to the Terms of Service and Refund Policy"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  setTermsError(false);
                }}
              />
              <span className="box">
                <Check className="h-3 w-3" stroke="#0a1428" strokeWidth={3.2} />
              </span>
              <span className="t">
                I agree to DGMARQ&apos;s <Link to="/terms">Terms of Service</Link> &amp;{' '}
                <Link to="/refund-policy">Refund Policy</Link>, and confirm I&apos;m buying for personal use.{' '}
                <span className="co-req">*</span>
              </span>
            </label>

            <div className={`co-promoacc ${promoOpen ? 'open' : ''}`}>
              <button type="button" className="co-promoacc-h" onClick={() => setPromoOpen((v) => !v)}>
                <span><Tag className="h-4 w-4" /> Got a discount code?</span>
                <ChevronDown className="chev h-4 w-4" />
              </button>
              <div className="co-promoacc-body">
                <div className="co-promo-in">
                  <input
                    type="text"
                    aria-label="Discount code"
                    placeholder="Enter code"
                    value={couponCode}
                    disabled={!!appliedCoupon}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setCouponError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !validateCouponMutation.isPending && !appliedCoupon) {
                        e.preventDefault();
                        handleApplyCoupon();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={validateCouponMutation.isPending || !!appliedCoupon}
                  >
                    {validateCouponMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="co-promo-msg ok">
                    <span>✓ Code {appliedCoupon.code} applied</span>
                    <button type="button" className="co-promo-clear" onClick={handleRemoveCoupon}>Remove</button>
                  </div>
                )}
                {couponError && <div className="co-promo-msg err">{couponError}</div>}
              </div>
            </div>

            <div className="co-trust">
              <div className="tr">
                <ShieldCheck className="h-[15px] w-[15px] text-[#34d399]" />
                Escrow-protected · money-back guarantee
              </div>
              <div className="tr">
                <Lock className="h-[15px] w-[15px] text-[#3a9bf5]" />
                256-bit SSL encrypted checkout
              </div>
            </div>
            <div className="co-paychips">
              <PaymentLogos />
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        checkoutId={currentCheckoutId || checkoutId}
        totalAmount={isAuthenticated ? grandTotal : (guestGrandTotal || grandTotal)}
        currency="USD"
        walletBalance={isAuthenticated ? walletBalance : 0}
        walletAmount={0}
        cardAmount={isAuthenticated ? grandTotal : (guestGrandTotal || grandTotal)}
        paymentMethod="PayPal"
        onSuccess={(data) => {
          if (!isAuthenticated) {
            const order = data?.order || data?.data?.order;
            const licenseDetails = data?.licenseDetails || data?.data?.licenseDetails;
            setGuestOrderSuccess(order || null);
            setGuestLicenseDetails(licenseDetails || null);
            setPaymentModalOpen(false);
            navigate(`/checkout?checkoutId=${currentCheckoutId}&status=success`, {
              state: order ? { guestOrder: order, licenseDetails: licenseDetails || null } : undefined,
            });
            try {
              clearGuestCart();
            } catch {
              // Non-fatal: failing to clear the guest cart should not break checkout.
            }
            return;
          }

          const successCheckoutId = data?.checkoutId || data?.order?._id || currentCheckoutId || checkoutId;
          if (successCheckoutId) {
            navigate(`/checkout?checkoutId=${successCheckoutId}&status=success`);
            queryClient.invalidateQueries({ queryKey: ['checkout', successCheckoutId] });
            queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
            queryClient.invalidateQueries({ queryKey: ['cart'] });
          }
        }}
      />
    </div>
  );
};

export default Checkout;
