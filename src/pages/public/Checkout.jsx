import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { cartAPI, checkoutAPI, couponAPI, subscriptionAPI, walletAPI } from '@services/api';
import { Card, CardContent } from '@components/ui/card';
import { Button } from '@components/ui/button';
import {
  PaymentModal, CheckoutSteps, SellerAvatar, PaymentLogos, toCartItems,
  getGuestCart, clearGuestCart, removeFromGuestCart, updateGuestCartQuantity, useGuestCart, useGuestCartView,
  RegionPills, ActivationLine, productTypeLabel, DEVICE_FALLBACK, settlePayment,
} from '@features/cart-checkout';
import {
  ShoppingCart, CheckCircle2, AlertCircle, Loader2, Sparkles, CreditCard,
  ChevronLeft, ChevronDown, Trash2, Check, ShieldCheck, Lock, Tag, Wallet, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import SafeImage from '@components/ui/safe-image';
import { formatReleaseDate } from '@components/common/PreorderBadge';
import useCurrency from '@hooks/useCurrency';
import useBuyerCountry from '@hooks/useBuyerCountry';
import { resolveOfferAvailability, isBuyerCompatible } from '@lib/regionCompat';

const WRAP = "relative z-[1] mx-auto max-w-[1200px] px-[22px] pt-[26px] pb-[80px]";
const BACK =
  "mb-[16px] inline-flex cursor-pointer select-none items-center gap-[6px] " +
  "border-none bg-transparent p-0 font-inherit text-[14px] font-bold text-[#3a9bf5] hover:text-[#6cb6ff]";
const HEAD = "mb-[20px] flex flex-wrap items-end justify-between gap-[16px]";
const HEAD_H1 =
  "m-0 flex items-center gap-[12px] text-[30px] font-extrabold tracking-[-0.4px] text-white [&_svg]:text-[#3a9bf5]";

const PANEL =
  "mb-[20px] rounded-[16px] border border-[rgba(58,116,240,0.24)] " +
  "bg-[linear-gradient(160deg,rgba(12,20,48,0.9),rgba(8,13,30,0.85))] p-[24px]";
const PANEL_H = "m-0 mb-[20px] text-[24px] font-extrabold tracking-[-0.3px] text-white";
const PANEL_H_SM = "m-0 mb-[18px] text-[20px] font-extrabold tracking-[-0.3px] text-white";

const citemCls = (regionBad) =>
  "relative flex gap-[16px] py-[18px] first:pt-[2px] " +
  (regionBad
    ? "rounded-[12px] border border-[rgba(255,107,107,0.35)] bg-[rgba(255,50,50,0.04)] my-[6px] px-[14px] " +
      "before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:rounded-l-[12px] before:bg-[linear-gradient(180deg,#e23030,#f76060)] before:content-[''] "
    : "border-t border-white/[0.08] first:border-t-0 ");
const CTHUMB =
  "relative flex h-[132px] w-[104px] shrink-0 items-center justify-center overflow-hidden " +
  "rounded-[12px] border border-white/[0.08] bg-[linear-gradient(135deg,#12245a,#0a1a44)] " +
  "min-[521px]:h-[190px] min-[521px]:w-[150px] " +
  "[&_img]:absolute [&_img]:inset-0 [&_img]:h-full [&_img]:w-full [&_img]:object-cover";
const CTITLE = "mb-[8px] text-[15.5px] font-bold leading-[1.35] text-white hover:text-[#7fb4ff]";
const CSPECS = "mt-[4px] mb-[10px] grid grid-cols-[82px_1fr] items-center gap-x-0 gap-y-[5px]";
const SPEC_K = "text-[12.5px] text-white/45";
const SPEC_V = "flex flex-wrap items-center gap-[5px] text-[12.5px] font-semibold text-white";
const CSOLD =
  "inline-flex items-center gap-[7px] text-[12.5px] text-white/55 [&_strong]:font-bold [&_strong]:text-white";
const SELLER_RATING =
  "ml-[3px] inline-flex items-center gap-[3px] font-bold text-[#f58e2a] [text-shadow:0_0_14px_rgba(245,142,42,0.5)] " +
  "[&_svg]:shrink-0 [&_svg]:[filter:drop-shadow(0_0_4px_rgba(245,142,42,0.55))] " +
  "[&_em]:not-italic [&_em]:text-[10.5px] [&_em]:font-medium [&_em]:text-white/40 [&_em]:[text-shadow:none]";
const CQTY_BTN =
  "flex h-[34px] w-[34px] cursor-pointer items-center justify-center border-none bg-transparent " +
  "text-[18px] text-[#7fb4ff] [transition:background_0.15s] " +
  "enabled:hover:bg-[rgba(14,81,226,0.2)] disabled:cursor-not-allowed disabled:opacity-[0.35]";

const FIELD_INPUT =
  "h-[46px] w-full rounded-[10px] border bg-white/[0.04] px-[14px] font-inherit text-[14px] text-white " +
  "outline-none [transition:border-color_0.2s] placeholder:text-white/35 " +
  "focus:border-[rgba(58,155,245,0.65)] focus:shadow-[0_0_0_3px_rgba(14,81,226,0.15)] " +
  "disabled:cursor-default disabled:text-white/75";

const CO_PLUS =
  "group relative mb-[20px] block overflow-hidden rounded-[16px] p-[1.5px] no-underline " +
  "bg-[linear-gradient(120deg,#172aa4,#650eb3,#172aa4)] [background-size:220%_220%] " +
  "animate-co-plus-border motion-reduce:animate-none " +
  "shadow-[0_10px_30px_rgba(80,30,180,0.4),0_0_18px_rgba(123,47,247,0.25)] " +
  "[transition:box-shadow_0.25s,transform_0.18s] " +
  "hover:-translate-y-[2px] hover:shadow-[0_14px_40px_rgba(101,14,179,0.55),0_0_26px_rgba(140,90,255,0.4)]";
const CO_PLUS_IN =
  "relative flex flex-wrap items-center gap-[14px] overflow-hidden rounded-[14.5px] px-[18px] py-[16px] " +
  "min-[561px]:flex-nowrap bg-[linear-gradient(150deg,rgba(18,16,52,0.97),rgba(30,10,60,0.95))] " +
  "before:pointer-events-none before:absolute before:inset-0 before:content-[''] " +
  "before:bg-[radial-gradient(circle_at_85%_15%,rgba(140,90,255,0.22),transparent_55%),radial-gradient(circle_at_10%_90%,rgba(14,81,226,0.18),transparent_50%)]";
const CO_PLUS_SPARK =
  "relative flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px] " +
  "border border-[rgba(180,140,255,0.55)] bg-[linear-gradient(135deg,#7b2ff7,#0e51e2)] text-white " +
  "shadow-[0_0_16px_rgba(123,47,247,0.55),inset_0_1px_0_rgba(255,255,255,0.3)] " +
  "[&_svg]:[filter:drop-shadow(0_0_5px_rgba(255,255,255,0.7))]";
const CO_PLUS_KICKER =
  "mb-[3px] inline-flex items-center gap-[5px] text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-[#c9b0ff]";
const CO_PLUS_H =
  "m-0 text-[15.5px] font-extrabold leading-[1.25] tracking-[-0.2px] text-white " +
  "[&_em]:not-italic [&_em]:bg-[linear-gradient(90deg,#9d7bff,#5ea2ff)] [&_em]:bg-clip-text [&_em]:text-transparent";
const CO_PLUS_CTA =
  "relative flex h-[38px] w-full shrink-0 items-center justify-center gap-[7px] whitespace-nowrap rounded-[10px] px-[16px] " +
  "text-[12.5px] font-extrabold tracking-[0.3px] text-white min-[561px]:w-auto min-[561px]:justify-start " +
  "bg-[linear-gradient(120deg,#0e51e2,#7b2ff7)] " +
  "shadow-[0_6px_18px_rgba(123,47,247,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] " +
  "[transition:filter_0.18s] group-hover:brightness-[1.12]";

const CO_PROCEED =
  "mb-[20px] flex h-[56px] w-full cursor-pointer items-center justify-center gap-[9px] rounded-[12px] border-none " +
  "bg-[linear-gradient(120deg,#0e51e2,#7b2ff7)] font-inherit text-[17px] font-extrabold tracking-[0.3px] text-white " +
  "shadow-[0_8px_26px_rgba(123,47,247,0.5),0_0_22px_rgba(168,85,247,0.28)] " +
  "[transition:filter_0.18s,box-shadow_0.2s] " +
  "enabled:hover:brightness-[1.08] enabled:hover:shadow-[0_12px_34px_rgba(123,47,247,0.62)] " +
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:filter-none";
const CO_LINE = "flex items-center justify-between text-[14px] text-white/60";
const CO_LINE_V = "text-[15px] font-bold text-white";
const INFO =
  "inline-flex h-[15px] w-[15px] cursor-help items-center justify-center rounded-full border border-white/30 text-[9px] italic text-white/50";

const PROMO_INPUT =
  "h-[44px] min-w-0 flex-1 rounded-[10px] border border-white/[0.16] bg-white/[0.04] px-[14px] " +
  "font-inherit text-[13.5px] text-white outline-none [transition:border-color_0.2s] focus:border-[rgba(58,155,245,0.6)]";
const PROMO_BTN =
  "flex h-[44px] cursor-pointer items-center gap-[6px] rounded-[10px] border-none bg-[rgba(14,81,226,0.9)] px-[20px] " +
  "font-inherit text-[13.5px] font-bold text-white [transition:filter_0.18s] " +
  "enabled:hover:brightness-[1.12] disabled:cursor-not-allowed disabled:opacity-60";
const PROMO_MSG = "min-h-[18px] px-[2px] py-[4px] text-[12.5px] font-semibold";

const TRUST_ROW = "flex items-center gap-[9px] text-[12px] text-white/60 [&_svg]:shrink-0";

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

const SUBSCRIPTION_PRICE_LABEL = 'US$9.99/mo';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Checkout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { format: formatPrice, currency: displayCurrency } = useCurrency();
  const { country } = useBuyerCountry();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [promoOpen, setPromoOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [currentCheckoutId, setCurrentCheckoutId] = useState(null);
  const [chargeTotal, setChargeTotal] = useState(null);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestEmailError, setGuestEmailError] = useState('');
  const [useWalletPay, setUseWalletPay] = useState(false);
  const [walletPaying, setWalletPaying] = useState(false);
  const [guestCartItems, setGuestCartItems] = useGuestCart(isAuthenticated);
  const guestView = useGuestCartView(guestCartItems, !isAuthenticated);

  const { data: cart, isLoading: cartLoading, isError: cartError } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartAPI.getCart().then(res => res.data.data),
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: false,
  });

  const { data: userSubscription } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => subscriptionAPI.getMySubscription().then(res => res.data.data),
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: pointsData } = useQuery({
    queryKey: ['plus-points'],
    queryFn: () => subscriptionAPI.getMyPoints().then(res => res.data?.data ?? null).catch(() => null),
    enabled: isAuthenticated,
    retry: false,
  });

  const redeemPointsMutation = useMutation({
    mutationFn: (points) => subscriptionAPI.redeemPoints(points),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Points redeemed to your wallet');
      queryClient.invalidateQueries({ queryKey: ['plus-points'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    },
    onError: (error) =>
      toast.error(error?.response?.data?.message || 'Could not redeem your points'),
  });

  const redeemableChunk = pointsData?.pointsPerWalletDollar ?? 100;
  const maxRedeemable = pointsData?.canRedeem
    ? Math.floor(pointsData.balance / redeemableChunk) * redeemableChunk
    : 0;

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

  const openPaymentFor = (session) => {
    setCurrentCheckoutId(session.checkoutId);
    const serverTotal = Number(session.grandTotal);
    if (Number.isFinite(serverTotal)) {
      setChargeTotal(serverTotal);
      if (Math.abs(serverTotal - grandTotal) >= 0.01) {
        toast.info(`Your total was updated to $${serverTotal.toFixed(2)} USD.`);
      }
    }
    setPaymentModalOpen(true);
  };

  const onWalletCheckoutCreated = async (newCheckoutId) => {
    setCurrentCheckoutId(newCheckoutId);
    setWalletPaying(true);
    try {
      const outcome = await settlePayment(() => checkoutAPI.payWithWallet(newCheckoutId), newCheckoutId);
      if (outcome.status === 'failed') {
        toast.error(outcome.message || 'Wallet payment failed');
        setUseWalletPay(false);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      if (outcome.status === 'pending') {
        toast.info(outcome.message, { duration: 15000 });
        navigate('/user/orders', { replace: true });
        return;
      }
      const order = outcome.payload?.data?.order || outcome.payload?.order;
      navigate(order?._id ? `/order-complete/${order._id}` : '/user/orders', { replace: true });
    } finally {
      setWalletPaying(false);
    }
  };

  const createCheckoutMutation = useMutation({
    mutationFn: (data) => checkoutAPI.createCheckoutSession(data),
    onSuccess: (data) => {
      const session = data.data.data;
      if (!session?.checkoutId) return;
      if (payingByWallet) {
        onWalletCheckoutCreated(session.checkoutId);
      } else {
        openPaymentFor(session);
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not start checkout'),
  });

  const createGuestCheckoutMutation = useMutation({
    mutationFn: (data) => checkoutAPI.createGuestCheckoutSession(data),
    onSuccess: (data) => {
      const session = data.data?.data || data.data;
      if (session?.checkoutId) openPaymentFor(session);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not start checkout'),
  });

  const items = isAuthenticated
    ? toCartItems(cart?.items, true)
    : guestView.items.length > 0
      ? toCartItems(guestView.items, true)
      : toCartItems(guestCartItems, false);

  const remove = (productId, sellerId) => {
    if (isAuthenticated) removeItemMutation.mutate({ productId, sellerId });
    else {
      removeFromGuestCart(productId, sellerId);
      setGuestCartItems(getGuestCart().items);
      toast.success('Item removed from cart');
    }
  };
  const setQty = (productId, sellerId, qty) => {
    if (qty <= 0) return remove(productId, sellerId);
    if (isAuthenticated) updateCartMutation.mutate({ productId, sellerId, qty });
    else {
      updateGuestCartQuantity(productId, sellerId, qty);
      setGuestCartItems(getGuestCart().items);
    }
  };

  const preorderItem = items.find((i) => i.isPreorder);
  const preorderReleaseLabel = formatReleaseDate(preorderItem?.preorderReleaseDate);

  const buyableQty = items.filter((i) => !i.unavailable).reduce((s, i) => s + i.qty, 0);
  const subtotal = isAuthenticated
    ? cart?.subtotal ?? items.filter((i) => !i.unavailable).reduce((s, i) => s + i.price * i.qty, 0)
    : guestView.subtotal || items.filter((i) => !i.unavailable).reduce((s, i) => s + i.price * i.qty, 0);
  const youSave = round2(
    items.reduce((s, i) => s + (i.original && i.original > i.price ? (i.original - i.price) * i.qty : 0), 0)
  );
  const { data: preview } = useQuery({
    queryKey: ['checkout-preview', subtotal, items.length, appliedCoupon?.code ?? null],
    queryFn: () =>
      checkoutAPI
        .getCheckoutPreview({ couponCode: appliedCoupon?.code || undefined })
        .then((res) => res.data.data),
    enabled: isAuthenticated && items.length > 0,
    retry: false,
  });

  const guestCouponBase = round2(Math.max(0, subtotal));
  const couponLines = items
    .filter((i) => !i.unavailable)
    .map((i) => ({ productId: i.productId, ...(i.sellerId ? { sellerId: i.sellerId } : {}), lineTotal: round2(i.price * i.qty) }));
  const couponLinesKey = couponLines.map((l) => `${l.productId}|${l.sellerId || ''}|${l.lineTotal}`).join(',');
  const checkCoupon = (code, config) =>
    couponAPI
      .validateCoupon({ code, orderAmount: guestCouponBase, items: couponLines }, config)
      .then((res) => res.data?.data?.coupon);
  const { data: guestCouponCheck, error: guestCouponCheckError } = useQuery({
    queryKey: ['guest-coupon', appliedCoupon?.code ?? null, couponLinesKey],
    queryFn: () => checkCoupon(appliedCoupon.code, { skipErrorToast: true }),
    enabled: !isAuthenticated && !!appliedCoupon,
    staleTime: Infinity,
    retry: false,
  });
  const guestCouponDiscount = appliedCoupon && !guestCouponCheckError ? guestCouponCheck?.discountAmount ?? 0 : 0;
  const couponNotice = !appliedCoupon
    ? ''
    : isAuthenticated
      ? preview?.couponError || ''
      : guestCouponCheckError
        ? guestCouponCheckError.response?.data?.message || 'This coupon no longer applies to your cart'
        : '';
  const couponToSend = appliedCoupon && !couponNotice ? appliedCoupon.code : undefined;
  const guestTotalBeforeFee = round2(Math.max(0, subtotal - guestCouponDiscount));

  const bundleDiscount = isAuthenticated ? preview?.bundleDiscount ?? 0 : 0;
  const couponDiscount = isAuthenticated ? preview?.couponDiscount ?? 0 : guestCouponDiscount;
  const subscriptionDiscount = isAuthenticated ? preview?.subscriptionDiscount ?? 0 : 0;
  const plusDiscountPercent = Number(preview?.plusDiscountPercent) || 0;
  const totalBeforeFee = isAuthenticated
    ? preview?.totalAmount ?? subtotal
    : guestTotalBeforeFee;

  const { data: handlingFeeEstimate } = useQuery({
    queryKey: ['handling-fee-estimate', guestTotalBeforeFee],
    queryFn: () => checkoutAPI.getHandlingFeeEstimate(guestTotalBeforeFee).then(res => res.data.data),
    enabled: !isAuthenticated && guestTotalBeforeFee > 0,
    retry: false,
  });
  const protectionFee = isAuthenticated
    ? preview?.protectionFee ?? 0
    : handlingFeeEstimate?.protectionFee ?? 0;
  const processingFee = isAuthenticated
    ? preview?.processingFee ?? 0
    : handlingFeeEstimate?.processingFee ?? 0;
  const protectionLabel = (isAuthenticated ? preview?.protectionLabel : handlingFeeEstimate?.protectionLabel) ?? null;
  const grandTotal = isAuthenticated
    ? preview?.grandTotal ?? totalBeforeFee
    : handlingFeeEstimate?.grandTotal ?? totalBeforeFee;
  const serviceFee = round2(protectionFee + processingFee);
  const payingByWallet = useWalletPay && walletBalance >= grandTotal;

  const validateCouponMutation = useMutation({
    mutationFn: ({ code }) => checkCoupon(code),
    onSuccess: (couponData) => {
      if (!couponData) {
        setCouponError('Invalid coupon code');
        return;
      }
      queryClient.setQueryData(['guest-coupon', couponData.code, couponLinesKey], couponData);
      setAppliedCoupon({ code: couponData.code });
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
    validateCouponMutation.mutate({ code: trimmedCode });
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
        items: items.map((i) => ({
          productId: i.productId,
          qty: i.qty,
          sellerId: i.sellerId || undefined,
        })),
        couponCode: couponToSend,
        displayCurrency,
      });
      return;
    }

    createCheckoutMutation.mutate({
      couponCode: couponToSend,
      displayCurrency,
    });
  };

  const isStarting = createCheckoutMutation.isPending || createGuestCheckoutMutation.isPending || walletPaying;
  const unavailableNames = items.filter((i) => i.unavailable).map((i) => i.name);
  const shortNames = items.filter((i) => i.stockShort).map((i) => i.name);

  if (isAuthenticated && cartLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12">
        <Card className="bg-[#041536] max-w-md w-full mx-4">
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

  if (items.length === 0) {
    return (
      <div className={WRAP}>
        <div className="text-center text-[14px] text-white/50" style={{ padding: '80px 20px' }}>
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
    <div className={WRAP}>
      <button type="button" className={BACK} onClick={() => navigate('/cart')}>
        <ChevronLeft className="h-[15px] w-[15px]" /> Back to cart
      </button>

      <div className={HEAD}>
        <h1 className={HEAD_H1}>
          <CreditCard className="h-[26px] w-[26px]" strokeWidth={2} />
          Checkout
        </h1>
      </div>

      <CheckoutSteps current="checkout" />

      <div className="grid grid-cols-1 items-start gap-[24px] min-[961px]:grid-cols-[1fr_400px]">
        <div>
          <div className={PANEL}>
            <h2 className={PANEL_H}>My cart</h2>
            {preorderItem && (
              <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-sm font-bold text-amber-300">
                  <Clock className="h-4 w-4" /> This is a pre-order
                </p>
                <p className="mt-1 text-xs text-amber-200/80">
                  You pay in full today and receive nothing yet. Your key is delivered
                  {preorderReleaseLabel ? ` on ${preorderReleaseLabel}` : ' on release day'}.
                  Until then your money is held, you can cancel for a full refund to your
                  wallet, and if the seller misses release by 24 hours you are refunded
                  automatically.
                </p>
              </div>
            )}
            {items.map((it) => {
              const avail = it.region ? resolveOfferAvailability(it.region) : null;
              const regionBad = isBuyerCompatible(avail, country) === false;
              return (
              <div key={it.key} className={citemCls(regionBad)}>
                <Link to={`/product/${it.slug}`} className={CTHUMB}>
                  {it.image ? (
                    <SafeImage src={it.image} alt={it.name} />
                  ) : (
                    <ShoppingCart className="h-8 w-8 text-white/20" />
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <Link to={`/product/${it.slug}`} className={CTITLE}>{it.name}</Link>

                  <div className={CSPECS}>
                    {it.platform && (<><span className={SPEC_K}>Platform:</span><span className={SPEC_V}>{it.platform}</span></>)}
                    {it.productType && (<><span className={SPEC_K}>Type:</span><span className={SPEC_V}>{productTypeLabel(it.productType)}</span></>)}
                    {it.region && (
                      <>
                        <span className={SPEC_K}>Region:</span>
                        <span className={SPEC_V}><RegionPills offer={it.region} country={country} /></span>
                      </>
                    )}
                    <span className={SPEC_K}>Device:</span><span className={SPEC_V}>{it.device || DEVICE_FALLBACK}</span>
                    {it.unavailable ? (
                      <>
                        <span className={SPEC_K}>Stock:</span>
                        <span className={SPEC_V}>
                          <span className="inline-flex items-center gap-[4px] font-semibold text-[#ff8080]">
                            <AlertCircle className="h-[13px] w-[13px]" />
                            No longer available from this seller
                          </span>
                        </span>
                      </>
                    ) : it.stockShort ? (
                      <>
                        <span className={SPEC_K}>Stock:</span>
                        <span className={SPEC_V}>
                          <span className="inline-flex items-center gap-[4px] font-semibold text-[#ff8080]">
                            <AlertCircle className="h-[13px] w-[13px]" />
                            {it.availabilityMessage || 'Not enough stock for this quantity'}
                          </span>
                        </span>
                      </>
                    ) : it.stock != null && (
                      <>
                        <span className={SPEC_K}>Stock:</span>
                        <span className={SPEC_V}>
                          <span className="inline-flex items-center gap-[4px] font-semibold text-[#34d399]">
                            <CheckCircle2 className="h-[13px] w-[13px]" />
                            {it.stock} in stock
                          </span>
                        </span>
                      </>
                    )}
                  </div>

                  <div className="mb-[4px] flex flex-wrap items-center gap-[9px]">
                    {it.region && country && (
                      <>
                        <ActivationLine offer={it.region} country={country} />
                        <span className="text-white/30">·</span>
                      </>
                    )}
                    {it.seller && (
                      <span className={CSOLD}>
                        <SellerAvatar name={it.seller} size={20} />
                        <span>
                          Sold by{' '}
                          {it.sellerId
                            ? <Link to={`/seller/${it.sellerId}`} className="hover:underline"><strong>{it.seller}</strong></Link>
                            : <strong>{it.seller}</strong>}
                          {it.sellerRating > 0 && (
                            <span className={SELLER_RATING}>
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

                  <div className="mt-[12px] flex items-center justify-between gap-[12px]">
                    <div className="inline-flex items-center overflow-hidden rounded-[9px] border border-white/[0.14] bg-white/[0.05]">
                      <button type="button" className={CQTY_BTN} onClick={() => setQty(it.productId, it.sellerId, it.qty - 1)} disabled={it.qty <= 1} aria-label="Decrease quantity">−</button>
                      <span className="min-w-[34px] text-center text-[14px] font-bold text-white">{it.qty}</span>
                      <button type="button" className={CQTY_BTN} onClick={() => setQty(it.productId, it.sellerId, it.qty + 1)} aria-label="Increase quantity">+</button>
                    </div>
                    <div className={`whitespace-nowrap text-right text-[18px] font-extrabold ${it.unavailable ? 'text-white/35 line-through' : 'text-white'}`}>
                      {formatPrice(it.price * it.qty)}
                      {it.hasDiscount && it.original != null && it.original > it.price && (
                        <span className="block text-[12px] font-medium text-white/40 line-through">{formatPrice(it.original * it.qty)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <button type="button" className="shrink-0 cursor-pointer self-start border-none bg-transparent p-[4px] text-white/40 [transition:color_0.15s] hover:text-[#ef4444]" onClick={() => remove(it.productId, it.sellerId)} aria-label="Remove">
                  <Trash2 className="h-[18px] w-[18px]" />
                </button>
              </div>
              );
            })}
          </div>

          {cart?.bundleDeal && (
            <div className={PANEL} style={{ padding: '16px 18px' }}>
              <p className="text-sm font-medium text-accent-on-dark">🎉 Bundle Deal Applied!</p>
              <p className="mt-1 text-xs text-gray-400">{cart.bundleDeal.title}</p>
            </div>
          )}
        </div>

        <div>
          {!isAuthenticated && (
            <div className={PANEL}>
              <h2 className={PANEL_H_SM} style={{ marginBottom: 6 }}>Enter your email</h2>
              <p className="m-0 mb-4 text-[13px] leading-[1.5] text-white/55">
                We need it to send you the order.
              </p>
              <div className="mb-[14px]">
                <label htmlFor="co-email" className="mb-[6px] block text-[12px] font-semibold text-white/60">Email <span className="text-[#ff7676]">*</span></label>
                <input
                  id="co-email"
                  aria-label="Email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`${FIELD_INPUT} ${guestEmailError ? 'border-[rgba(239,68,68,0.7)]' : 'border-white/[0.14]'}`}
                  value={guestEmail}
                  onChange={(e) => {
                    setGuestEmail(e.target.value);
                    setGuestEmailError('');
                  }}
                />
                {guestEmailError && <p className="mt-[6px] text-[12.5px] font-semibold text-[#ff7676]">{guestEmailError}</p>}
              </div>
            </div>
          )}

          {!userSubscription?.hasSubscription && (
            <Link to="/dgmarq-plus" className={CO_PLUS} aria-label="Join DGMARQ Plus">
              <div className={CO_PLUS_IN}>
                <span className={CO_PLUS_SPARK}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z" />
                  </svg>
                </span>
                <div className="relative min-w-0 flex-1">
                  <span className={CO_PLUS_KICKER}><span className="h-[5px] w-[5px] rounded-full bg-[#a855f7] shadow-[0_0_6px_#a855f7] animate-co-plus-dot motion-reduce:animate-none"></span>Members save more</span>
                  <h3 className={CO_PLUS_H}>
                    Join <em>DGMARQ Plus</em>
                    {plusDiscountPercent > 0 ? ` — save ${plusDiscountPercent}% on this order` : ''}
                  </h3>
                  <p className="mt-[3px] text-[11.5px] leading-[1.45] text-white/60">
                    {plusDiscountPercent > 0
                      ? `${plusDiscountPercent}% off all products, applied automatically at checkout.`
                      : 'Member savings applied automatically at checkout.'}
                    {' '}{SUBSCRIPTION_PRICE_LABEL}, cancel anytime.
                  </p>
                </div>
                <span className={CO_PLUS_CTA}>
                  Join Plus
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </div>
            </Link>
          )}

          <div className={`${PANEL} sticky top-[24px]`}>
            <h2 className={PANEL_H_SM}>Summary</h2>

            {unavailableNames.length > 0 && (
              <div className="mb-[12px] rounded-[12px] border border-[#ff8080]/40 bg-[#ff8080]/[0.08] px-[14px] py-[12px]" role="alert">
                <p className="text-[13px] font-bold text-[#ffb4b4]">
                  {unavailableNames.length === 1 ? "An item is" : `${unavailableNames.length} items are`} no longer available
                </p>
                <p className="mt-[4px] text-[12px] leading-[1.5] text-[#ffd0d0]/80">
                  Remove {unavailableNames.length === 1 ? `"${unavailableNames[0]}"` : "them"} from your cart to continue. The seller has taken this listing down.
                </p>
              </div>
            )}

            {shortNames.length > 0 && (
              <div className="mb-[12px] rounded-[12px] border border-[#ff8080]/40 bg-[#ff8080]/[0.08] px-[14px] py-[12px]" role="alert">
                <p className="text-[13px] font-bold text-[#ffb4b4]">Not enough stock</p>
                <p className="mt-[4px] text-[12px] leading-[1.5] text-[#ffd0d0]/80">
                  Lower the quantity of {shortNames.length === 1 ? `"${shortNames[0]}"` : 'the marked items'} to continue.
                </p>
              </div>
            )}

            <button type="button" className={CO_PROCEED} onClick={handleProceedToPayment} disabled={isStarting || unavailableNames.length > 0 || shortNames.length > 0}>
              {isStarting ? (
                <><Loader2 className="h-[17px] w-[17px] animate-spin" /> {walletPaying ? 'Processing wallet payment…' : 'Preparing checkout…'}</>
              ) : payingByWallet ? (
                <><Wallet className="h-[17px] w-[17px]" /> Pay with Balance</>
              ) : (
                <><CreditCard className="h-[17px] w-[17px]" /> Proceed to Payment</>
              )}
            </button>

            <div className="mb-[18px] flex flex-col gap-[12px]">
              <div className={CO_LINE}>
                <span>{buyableQty} {buyableQty === 1 ? 'product' : 'products'}</span>
                <span className={CO_LINE_V}>{formatPrice(subtotal)}</span>
              </div>
              {bundleDiscount > 0 && (
                <div className={`${CO_LINE} text-[#34d399]`}>
                  <span>Bundle deal</span>
                  <span className="text-[15px] font-bold text-[#34d399]">−{formatPrice(bundleDiscount)}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className={`${CO_LINE} text-[#34d399]`}>
                  <span>Promo discount</span>
                  <span className="text-[15px] font-bold text-[#34d399]">−{formatPrice(couponDiscount)}</span>
                </div>
              )}
              {subscriptionDiscount > 0 && (
                <div className={`${CO_LINE} text-[#34d399]`}>
                  <span>DGMARQ Plus discount</span>
                  <span className="text-[15px] font-bold text-[#34d399]">−{formatPrice(subscriptionDiscount)}</span>
                </div>
              )}
              {serviceFee > 0 && (
                <div className={CO_LINE}>
                  <span className="flex items-center gap-[5px]">
                    Service fee
                    <span
                      className={INFO}
                      title={`Buyer Protection${protectionLabel ? ` (${protectionLabel})` : ''} + ${formatPrice(processingFee)} checkout fee — covers escrow, refunds and dispute protection.`}
                    >
                      i
                    </span>
                  </span>
                  <span className={CO_LINE_V}>{formatPrice(serviceFee)}</span>
                </div>
              )}
            </div>

            <div className="mb-[6px] flex items-center justify-between gap-[12px] border-t border-white/10 pt-[18px]">
              <span className="text-[20px] font-extrabold text-white">Total:</span>
              <span className="text-[32px] font-extrabold text-white [text-shadow:0_0_22px_rgba(58,155,245,0.5)]">{formatPrice(grandTotal)}</span>
            </div>
            {youSave > 0 && (
              <div className="mb-[6px] text-[12px] font-semibold text-[#34d399]">
                Includes {formatPrice(youSave)} off list prices
              </div>
            )}
            <div className="mb-[16px] text-[11.5px] leading-[1.5] text-white/40">
              {displayCurrency === 'USD'
                ? 'Billed in USD. Taxes included where applicable.'
                : `Prices shown in ${displayCurrency} are approximate — you'll be charged $${grandTotal.toFixed(2)} USD.`}
            </div>

            {isAuthenticated && walletBalance > 0 && (
              <div className={`mb-[14px] rounded-[12px] border px-[14px] py-[12px] [transition:border-color_0.2s,background_0.2s] ${
                payingByWallet
                  ? 'border-[rgba(52,211,153,0.4)] bg-[rgba(52,211,153,0.06)]'
                  : 'border-white/[0.1] bg-white/[0.02]'
              }`}>
                <div className="flex items-center justify-between gap-[10px]">
                  <div className="flex items-center gap-[10px]">
                    <div className={`flex h-[34px] w-[34px] items-center justify-center rounded-[9px] [transition:background_0.2s] ${
                      payingByWallet ? 'bg-[rgba(52,211,153,0.15)]' : 'bg-white/[0.06]'
                    }`}>
                      <Wallet className={`h-[17px] w-[17px] [transition:color_0.2s] ${
                        payingByWallet ? 'text-[#34d399]' : 'text-white/50'
                      }`} />
                    </div>
                    <div>
                      <span className="block text-[13px] font-bold text-white">In-Store Balance</span>
                      <span className="block text-[12px] text-white/50">${walletBalance.toFixed(2)} USD available</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={walletBalance < grandTotal}
                    onClick={() => setUseWalletPay((v) => !v)}
                    className={`relative h-[24px] w-[44px] shrink-0 rounded-full border-none [transition:background_0.2s] ${
                      walletBalance < grandTotal
                        ? 'cursor-not-allowed bg-white/[0.08]'
                        : useWalletPay
                          ? 'cursor-pointer bg-[#34d399]'
                          : 'cursor-pointer bg-white/[0.15]'
                    }`}
                    aria-label={useWalletPay ? 'Disable wallet payment' : 'Enable wallet payment'}
                  >
                    <span className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] [transition:left_0.2s] ${
                      payingByWallet ? 'left-[23px]' : 'left-[3px]'
                    }`} />
                  </button>
                </div>
                {walletBalance < grandTotal && (
                  <p className="mt-[8px] text-[11.5px] text-white/40">
                    Insufficient balance — top up or use other payment methods.
                  </p>
                )}
                {payingByWallet && (
                  <p className="mt-[8px] text-[11.5px] text-[#34d399]/80">
                    Remaining after purchase: ${(walletBalance - grandTotal).toFixed(2)} USD
                  </p>
                )}
              </div>
            )}

            {preview?.pointsToEarn > 0 && (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-accent/30 bg-accent/10 px-3 py-2">
                <span className="flex items-center gap-1.5 text-sm text-accent-on-dark">
                  <Sparkles className="h-4 w-4" />
                  Reward points
                </span>
                <span className="text-sm font-semibold text-white">
                  {payingByWallet
                    ? 'Wallet payments don’t earn points'
                    : `You’ll earn ${preview.pointsToEarn} points`}
                </span>
              </div>
            )}

            {maxRedeemable > 0 && (
              <div className="mb-4 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-emerald-200">
                    You have <strong className="font-semibold text-white">{pointsData.balance}</strong> points
                    <span className="text-emerald-200/70"> · worth ${(maxRedeemable / redeemableChunk).toFixed(2)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => redeemPointsMutation.mutate(maxRedeemable)}
                    disabled={redeemPointsMutation.isPending}
                    className="shrink-0 cursor-pointer rounded-md border border-emerald-400/50 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/25 disabled:opacity-50"
                  >
                    {redeemPointsMutation.isPending
                      ? 'Redeeming…'
                      : `Redeem ${maxRedeemable} → $${(maxRedeemable / redeemableChunk).toFixed(2)}`}
                  </button>
                </div>
                {pointsData.balance > maxRedeemable && (
                  <p className="mt-1.5 text-xs text-emerald-200/60">
                    {pointsData.balance - maxRedeemable} points stay on your balance —
                    they redeem in blocks of {redeemableChunk}.
                  </p>
                )}
                <p className="mt-1.5 text-xs text-emerald-200/60">
                  Credit lands in your wallet — choose Wallet at payment to use it.
                </p>
              </div>
            )}

            <label className="mb-[13px] flex cursor-pointer select-none items-start gap-[11px]">
              <input
                type="checkbox"
                className="peer hidden"
                aria-label="Agree to the Terms of Service and Refund Policy"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  setTermsError(false);
                }}
              />
              <span className={`mt-[1px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] border-[1.5px] ${termsError ? 'border-[rgba(239,68,68,0.8)]' : 'border-white/30'} [transition:all_0.18s] peer-checked:border-transparent peer-checked:bg-[linear-gradient(135deg,#3a9bf5,#0e51e2)] [&_svg]:opacity-0 [&_svg]:[transition:opacity_0.15s] peer-checked:[&_svg]:opacity-100`}>
                <Check className="h-3 w-3" stroke="#0a1428" strokeWidth={3.2} />
              </span>
              <span className="text-[13px] leading-[1.5] text-white/68 [&_a]:text-[#3a9bf5] [&_a]:no-underline [&_a:hover]:underline">
                I agree to DGMARQ&apos;s <Link to="/terms">Terms of Service</Link> &amp;{' '}
                <Link to="/refund-policy">Refund Policy</Link>, and confirm I&apos;m buying for personal use.{' '}
                <span className="text-[#ff7676]">*</span>
              </span>
            </label>

            <div className="border-t border-white/10 pt-[6px]">
              <button type="button" className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent py-[14px] font-inherit text-[14.5px] font-bold text-white" onClick={() => setPromoOpen((v) => !v)}>
                <span className="flex items-center gap-[9px]"><Tag className="h-4 w-4 text-[#3a9bf5]" /> Got a discount code?</span>
                <ChevronDown className={`h-4 w-4 text-white/50 [transition:transform_0.25s] ${promoOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden [transition:max-height_0.3s_ease] ${promoOpen ? 'max-h-[140px]' : 'max-h-0'}`}>
                <div className="flex gap-[9px] pt-[6px] pb-[4px]">
                  <input
                    type="text"
                    className={PROMO_INPUT}
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
                    className={PROMO_BTN}
                    onClick={handleApplyCoupon}
                    disabled={validateCouponMutation.isPending || !!appliedCoupon}
                  >
                    {validateCouponMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                  </button>
                </div>
                {appliedCoupon && !couponNotice && (
                  <div className={`${PROMO_MSG} flex items-center justify-between gap-[8px] text-[#34d399]`}>
                    <span>✓ Code {appliedCoupon.code} applied</span>
                    <button type="button" className="cursor-pointer border-none bg-transparent p-0 font-inherit text-[11.5px] font-semibold text-white/45 hover:text-[#ff7676]" onClick={handleRemoveCoupon}>Remove</button>
                  </div>
                )}
                {(couponError || couponNotice) && (
                  <div className={`${PROMO_MSG} flex items-center justify-between gap-[8px] text-[#ff7676]`}>
                    <span>{couponError || couponNotice}</span>
                    {couponNotice && (
                      <button type="button" className="cursor-pointer border-none bg-transparent p-0 font-inherit text-[11.5px] font-semibold text-white/45 hover:text-white" onClick={handleRemoveCoupon}>Remove</button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-[16px] flex flex-col gap-[10px] border-t border-white/[0.08] pt-[16px]">
              <div className={TRUST_ROW}>
                <ShieldCheck className="h-[15px] w-[15px] text-[#34d399]" />
                Escrow-protected · money-back guarantee
              </div>
              <div className={TRUST_ROW}>
                <Lock className="h-[15px] w-[15px] text-[#3a9bf5]" />
                256-bit SSL encrypted checkout
              </div>
            </div>
            <div className="mt-[14px] flex flex-wrap gap-[7px]">
              <PaymentLogos />
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        checkoutId={currentCheckoutId}
        totalAmount={chargeTotal ?? grandTotal}
        currency="USD"
        walletBalance={isAuthenticated ? walletBalance : 0}
        guestEmail={isAuthenticated ? undefined : guestEmail}
        onPending={() => {
          setPaymentModalOpen(false);
          if (!isAuthenticated) {
            try { clearGuestCart(); } catch { /* non-fatal */ }
            navigate('/', { replace: true });
            return;
          }
          queryClient.invalidateQueries({ queryKey: ['cart'] });
          navigate('/user/orders', { replace: true });
        }}
        onSuccess={(data) => {
          setPaymentModalOpen(false);
          const order = data?.order || data?.data?.order;
          const oid = order?._id || data?.checkoutId || currentCheckoutId;

          if (!isAuthenticated) {
            try { clearGuestCart(); } catch { /* non-fatal */ }
            navigate(`/order-complete/${oid}?guestEmail=${encodeURIComponent(guestEmail)}`, { replace: true });
            return;
          }

          queryClient.invalidateQueries({ queryKey: ['cart'] });
          queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
          navigate(`/order-complete/${oid}`, { replace: true });
        }}
      />
    </div>
  );
};

export default Checkout;
