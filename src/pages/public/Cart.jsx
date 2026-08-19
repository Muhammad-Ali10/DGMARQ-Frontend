import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { ShoppingCart, Trash2, ShieldCheck, Zap, Clock, Sparkles, FileText, CheckCircle2, ChevronLeft, AlertTriangle } from "lucide-react";
import { cartAPI, checkoutAPI, productAPI } from "@services/api";
import { Skeleton } from "@components/ui/skeleton";
import SafeImage from "@components/ui/safe-image";
import ConfirmationModal from "@components/common/ConfirmationModal";
import { showSuccess, showApiError } from "@utils/toast";
import useCurrency from "@hooks/useCurrency";
import useBuyerCountry from "@hooks/useBuyerCountry";
import { resolveOfferAvailability, isBuyerCompatible } from "@lib/regionCompat";
import { ProductCard } from "@features/catalog";
import {
  getGuestCart,
  removeFromGuestCart,
  updateGuestCartQuantity,
  clearGuestCart,
  useGuestCart,
  useGuestCartView,
  CheckoutSteps,
  SellerAvatar,
  PaymentLogos,
  RegionPills,
  ActivationLine,
  toCartItems,
  productTypeLabel,
  DEVICE_FALLBACK,
} from "@features/cart-checkout";

// ── Cart page — ported from the v74 mockup (`cp-*`) ──────────────────────────
// The mockup is a fixed overlay; this is a real route, so the overlay chrome
// (fixed positioning, close button) is dropped and the inner layout kept.
//
// The mockup's media queries are max-width, Tailwind's are min-width, so the
// base classes carry the SMALL-screen values and `min-[901px]:` / `min-[521px]:`
// restore the desktop ones. Neither is a stock Tailwind breakpoint — the
// arbitrary variants are what keep the flip points exact.

const WRAP = "relative z-[1] mx-auto max-w-[1240px] px-[22px] pt-[26px] pb-[70px]";

// Page header: title block on the left, "Clear cart" pushed to the right.
const HEAD = "mb-[22px] flex flex-wrap items-end justify-between gap-[16px]";
const HEAD_H1 =
  "m-0 flex items-center gap-[12px] text-[30px] font-extrabold tracking-[-0.4px] [&_svg]:text-[#3a9bf5]";
const HEAD_CNT =
  "rounded-[20px] border border-[rgba(58,116,240,0.5)] bg-[rgba(14,81,226,0.2)] px-[11px] py-[2px] text-[13px] font-extrabold text-[#7fb4ff]";
const HEAD_SUB = "mt-[6px] text-[14px] text-white/50";
const BACK =
  "mb-[18px] inline-flex select-none items-center gap-[6px] border-none bg-transparent p-0 font-inherit text-[14px] font-bold text-[#3a9bf5] hover:text-[#6cb6ff]";

// ── item card ──
// The 3px gradient rail on the left edge is the card's signature (v74 5722).
// When the offer region is incompatible with the buyer's country the border
// and accent rail flip to red so the conflict is unmissable.
const cardCls = (regionBad) =>
  "relative flex overflow-hidden rounded-[16px] border " +
  (regionBad
    ? "border-[rgba(255,107,107,0.45)] hover:border-[rgba(255,107,107,0.65)] hover:shadow-[0_0_0_1px_rgba(255,107,107,0.25),0_12px_34px_rgba(255,50,50,0.15)] "
    : "border-[rgba(58,116,240,0.28)] hover:border-[rgba(58,155,245,0.6)] hover:shadow-[0_0_0_1px_rgba(58,155,245,0.25),0_12px_34px_rgba(14,81,226,0.22)] ") +
  "bg-[linear-gradient(160deg,rgba(16,29,58,0.96),rgba(9,16,34,0.94))] " +
  "[transition:border-color_0.2s,box-shadow_0.2s,transform_0.2s] " +
  "hover:-translate-y-[2px] " +
  "before:absolute before:left-0 before:top-0 before:z-[1] before:h-full before:w-[3px] before:content-[''] " +
  (regionBad
    ? "before:bg-[linear-gradient(180deg,#e23030,#f76060)] "
    : "before:bg-[linear-gradient(180deg,#0e51e2,#7b2ff7)] ") +
  "before:opacity-[0.85] " +
  "animate-cp-item-in motion-reduce:animate-none";

// Thumb is 180px wide on desktop, 104px under the mockup's 520px breakpoint.
// The right-edge fade lets the title breathe over busy artwork.
const THUMB =
  "relative block w-[104px] min-w-[104px] min-[521px]:w-[180px] min-[521px]:min-w-[180px] " +
  "self-stretch bg-[#0a1428] " +
  "[&_img]:absolute [&_img]:inset-0 [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:object-center " +
  "after:absolute after:inset-0 after:content-[''] " +
  "after:bg-[linear-gradient(90deg,rgba(9,16,34,0)_62%,rgba(9,16,34,0.55))]";

// spec grid — Platform / Type / Region / Device / Stock
const SPECS = "my-[2px] grid grid-cols-[84px_1fr] items-center gap-x-0 gap-y-[6px]";
const SPEC_K = "text-[12.5px] text-white/45";
const SPEC_V = "flex flex-wrap items-center gap-[5px] text-[12.5px] font-semibold text-white";

// Seller / activation strip. The `b` rule is a descendant on purpose: it is what
// makes ActivationLine's bold country read white here, as the mockup draws it.
const FOOT =
  "flex flex-wrap items-center gap-[8px] pt-[3px] text-[11.5px] text-white/55 [&_b]:font-bold [&_b]:text-white";
const SELLER_RATING =
  "inline-flex items-center gap-[3px] text-[11.5px] font-bold text-[#f58e2a] [text-shadow:0_0_14px_rgba(245,142,42,0.5)] " +
  "[&_svg]:shrink-0 [&_svg]:[filter:drop-shadow(0_0_4px_rgba(245,142,42,0.55))] " +
  "[&_em]:not-italic [&_em]:text-[10px] [&_em]:font-medium [&_em]:text-white/40 [&_em]:[text-shadow:none]";

const QTY_BTN =
  "h-[30px] w-[32px] cursor-pointer border-none bg-transparent text-[17px] font-bold leading-none text-[#3a9bf5] " +
  "[transition:background_0.15s] enabled:hover:bg-[rgba(58,155,245,0.15)] disabled:cursor-not-allowed disabled:opacity-40";

// Discount chip — the layered ring + inset highlight is what gives it the
// "embossed" look of the mockup (v74 5766); a flat badge reads as a different UI.
const DISC_PILL =
  "inline-flex items-center rounded-[20px] border border-[rgba(120,180,255,0.9)] " +
  "bg-[linear-gradient(135deg,#172aa4,#0e9fe2)] px-[12px] py-[3px] text-[12px] font-extrabold tracking-[0.2px] text-white " +
  "shadow-[0_0_0_1px_rgba(96,165,250,0.35),0_2px_12px_rgba(37,99,235,0.55),inset_0_1px_0_rgba(191,219,254,0.6)]";

// ── summary ──
// The 2px top bar runs the shared 200% → -200% sweep (`--animate-rail-slide`).
const SUM_CARD =
  "relative isolate overflow-hidden rounded-[18px] border border-[rgba(58,116,240,0.3)] " +
  "bg-[linear-gradient(180deg,#0c1430,#080d1e)] px-[20px] pt-[20px] pb-[22px] " +
  "before:absolute before:left-0 before:right-0 before:top-0 before:h-[2px] before:content-[''] " +
  "before:bg-[linear-gradient(90deg,transparent,#0e51e2,#3a9bf5,#7b2ff7,transparent)] " +
  "before:[background-size:200%_100%] before:animate-rail-slide motion-reduce:before:animate-none";
const SUM_LINE = "mb-[10px] flex items-center justify-between text-[13px] text-white/55";
const SUM_LBL = "flex items-center gap-[6px]";
const SUM_V = "font-semibold text-white/85";
// Tooltip dot next to a fee label.
const INFO_DOT =
  "inline-flex h-[15px] w-[15px] cursor-help items-center justify-center rounded-full border border-white/30 text-[9.5px] italic text-white/50";

const CHECKOUT_BTN =
  "flex h-[50px] w-full cursor-pointer items-center justify-center gap-[8px] rounded-[12px] border-none " +
  "bg-[linear-gradient(120deg,#0e51e2,#7b2ff7)] font-inherit text-[15.5px] font-extrabold tracking-[0.3px] text-white " +
  "shadow-[0_8px_26px_rgba(123,47,247,0.5),0_0_22px_rgba(168,85,247,0.28)] " +
  "[transition:filter_0.18s] hover:brightness-[1.08] " +
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:brightness-100";
const CONTINUE_BTN =
  "mt-[10px] flex h-[44px] w-full cursor-pointer items-center justify-center rounded-[12px] " +
  "border border-[rgba(58,116,240,0.45)] bg-transparent font-inherit text-[13.5px] font-bold text-[#3a9bf5] " +
  "[transition:background_0.2s] hover:bg-[rgba(14,81,226,0.1)]";

// ── trust ──
const TRUST_ROW =
  "flex items-start gap-[11px] text-[12.5px] leading-[1.5] text-white/72 [&_svg]:mt-[1px] [&_svg]:shrink-0 [&_b]:font-bold [&_b]:text-white";

// ── related row ── horizontal snap rail with a branded scrollbar.
const REL_ROW =
  "flex gap-[18px] overflow-x-auto overflow-y-hidden px-[2px] pt-[6px] pb-[14px] " +
  "[scroll-snap-type:x_proximity] [-webkit-overflow-scrolling:touch] " +
  "[scrollbar-width:thin] [scrollbar-color:#3a9bf5_rgba(255,255,255,0.04)] " +
  "[&>*]:flex-[0_0_auto] [&>*]:[scroll-snap-align:start] " +
  "[&::-webkit-scrollbar]:h-[8px] " +
  "[&::-webkit-scrollbar-track]:rounded-[20px] [&::-webkit-scrollbar-track]:bg-white/[0.04] " +
  "[&::-webkit-scrollbar-thumb]:rounded-[20px] [&::-webkit-scrollbar-thumb]:bg-[linear-gradient(90deg,#0e51e2,#3a9bf5)] " +
  "[&::-webkit-scrollbar-thumb:hover]:bg-[linear-gradient(90deg,#1a5cf0,#57b0ff)]";

// Design gives the empty-state CTA its own lighter geometry (v74 5790) — it is
// NOT the heavy glowing checkout button.
const EMPTY_BTN =
  "inline-flex h-[46px] cursor-pointer items-center justify-center gap-[8px] rounded-[11px] border-none " +
  "bg-[linear-gradient(120deg,#0e51e2,#7b2ff7)] px-[28px] font-inherit text-[14px] font-bold text-white hover:brightness-[1.06]";

const round2 = (n) => Math.round(n * 100) / 100;

const Cart = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { format: formatPrice, currency } = useCurrency();
  const { country } = useBuyerCountry();
  const [guestCartItems, setGuestCartItems] = useGuestCart(isAuthenticated);
  const guestView = useGuestCartView(guestCartItems, !isAuthenticated);
  const [showClearCartModal, setShowClearCartModal] = useState(false);

  // ONE shared ["cart"] query — same key/shape the Header + mini-cart use, so
  // react-query serves all of them from a single fetch.
  const { data: cart, isLoading, isError, refetch } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartAPI.getCart().then((res) => res.data.data),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const removeItemMutation = useMutation({
    mutationFn: (data) => cartAPI.removeItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      showSuccess("Item removed from cart");
    },
    onError: (error) => showApiError(error, "Failed to remove item from cart"),
  });

  const updateCartMutation = useMutation({
    mutationFn: (data) => cartAPI.updateCart(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    onError: (error) => showApiError(error, "Failed to update cart"),
  });

  const clearCartMutation = useMutation({
    mutationFn: () => cartAPI.clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      showSuccess("Cart cleared successfully");
    },
    onError: (error) => showApiError(error, "Failed to clear cart"),
  });

  const remove = (productId, sellerId) => {
    if (isAuthenticated) removeItemMutation.mutate({ productId, sellerId });
    else {
      removeFromGuestCart(productId);
      setGuestCartItems(getGuestCart().items);
      showSuccess("Item removed from cart");
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
  const clearAll = () => {
    if (isAuthenticated) clearCartMutation.mutate();
    else {
      clearGuestCart();
      setGuestCartItems([]);
      showSuccess("Cart cleared successfully");
    }
    setShowClearCartModal(false);
  };

  // Server-hydrated guest items have the same shape as authed items.
  const items = isAuthenticated
    ? toCartItems(cart?.items, true)
    : guestView.items.length > 0
      ? toCartItems(guestView.items, true)
      : toCartItems(guestCartItems, false);
  // ── summary (mirrors the mockup's recalc(): protection is a % of the amount
  //    AFTER discounts, the processing fee is flat once per order) ──
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  // M21: a pre-order is delivered on release day and a regular item now, and an
  // order carries ONE delivery state — so the two cannot ship together. The
  // backend refuses to open a checkout session for a mixed cart; saying so here
  // means the buyer finds out on the cart page instead of at the payment step.
  const preorderNames = items.filter((i) => i.isPreorder).map((i) => i.name);
  const isMixedCart = preorderNames.length > 0 && preorderNames.length < items.length;
  const subtotal = isAuthenticated
    ? cart?.subtotal ?? items.reduce((s, i) => s + i.price * i.qty, 0)
    : guestView.subtotal || items.reduce((s, i) => s + i.price * i.qty, 0);
  const youSave = round2(
    items.reduce((s, i) => s + (i.original && i.original > i.price ? (i.original - i.price) * i.qty : 0), 0)
  );
  const bundleDiscount = isAuthenticated ? cart?.bundleDiscount || 0 : 0;
  const totalBeforeFee = round2(Math.max(0, subtotal - bundleDiscount));

  // Public endpoint — guests see the same fees as members.
  const { data: feeEst } = useQuery({
    queryKey: ["handling-fee-estimate", totalBeforeFee],
    queryFn: () => checkoutAPI.getHandlingFeeEstimate(totalBeforeFee).then((r) => r.data.data),
    enabled: totalBeforeFee > 0,
    retry: false,
  });
  const protectionFee = feeEst?.protectionFee ?? 0;
  const processingFee = feeEst?.processingFee ?? 0;
  // e.g. "8%" — the design hardcodes it in the tooltip; take the live value.
  const protectionLabel = feeEst?.protectionLabel || null;
  const grandTotal = feeEst?.grandTotal ?? totalBeforeFee;

  // "You might also like" — reuses the indexed product listing (no new endpoint).
  const relatedCategoryId = items.find((i) => i.categoryId)?.categoryId || null;
  const { data: relatedData } = useQuery({
    queryKey: ["cart-related", relatedCategoryId],
    queryFn: () => productAPI.getProducts({ categoryId: relatedCategoryId, limit: 8, page: 1 }).then((r) => r.data.data),
    enabled: !!relatedCategoryId,
    staleTime: 5 * 60 * 1000, // shared, slow-changing — safe to cache
  });
  const inCart = new Set(items.map((i) => String(i.productId)));
  const related = (relatedData?.docs || []).filter((p) => !inCart.has(String(p._id))).slice(0, 6);

  // Skeleton mirrors the loaded two-column shell so there's no layout shift
  // when the cart arrives (the standard: skeleton, not a bare spinner).
  if (isAuthenticated && isLoading) {
    return (
      <div className={WRAP}>
        <button type="button" className={BACK} onClick={() => navigate("/")}>
          <ChevronLeft className="h-[15px] w-[15px]" /> Back to store
        </button>
        <div className={HEAD}>
          <div>
            <h1 className={HEAD_H1}>
              <ShoppingCart className="h-[26px] w-[26px]" strokeWidth={2} />
              Shopping Cart
            </h1>
            <div className={HEAD_SUB}>Review your items, fees and total before checkout.</div>
          </div>
        </div>
        <CheckoutSteps current="cart" />
        <div className="grid grid-cols-1 items-start gap-[24px] min-[901px]:grid-cols-[1fr_372px]">
          <div className="flex flex-col gap-[14px]">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex overflow-hidden rounded-[16px] border border-white/10">
                <Skeleton className="h-[132px] w-[150px] rounded-none" />
                <div className="flex flex-1 flex-col gap-[10px] px-[16px] py-[14px]">
                  <Skeleton className="h-[16px] w-2/3" />
                  <Skeleton className="h-[12px] w-1/2" />
                  <Skeleton className="h-[12px] w-1/3" />
                  <Skeleton className="mt-auto h-[20px] w-[90px]" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-[12px] rounded-[16px] border border-white/10 p-[20px]">
            <Skeleton className="h-[18px] w-1/2" />
            <Skeleton className="h-[12px] w-full" />
            <Skeleton className="h-[12px] w-full" />
            <Skeleton className="h-[12px] w-3/4" />
            <Skeleton className="mt-[10px] h-[50px] w-full rounded-[12px]" />
          </div>
        </div>
      </div>
    );
  }

  // A cart-load failure must NOT masquerade as an empty cart — surface the
  // error with a retry instead of dropping the buyer into the empty state.
  if (isAuthenticated && isError) {
    return (
      <div className={WRAP}>
        <button type="button" className={BACK} onClick={() => navigate("/")}>
          <ChevronLeft className="h-[15px] w-[15px]" /> Back to store
        </button>
        <div className={HEAD}>
          <div>
            <h1 className={HEAD_H1}>
              <ShoppingCart className="h-[26px] w-[26px]" strokeWidth={2} />
              Shopping Cart
            </h1>
            <div className={HEAD_SUB}>Review your items, fees and total before checkout.</div>
          </div>
        </div>
        <CheckoutSteps current="cart" />
        <div className="px-[20px] py-[80px] text-center">
          <AlertTriangle className="mx-auto mb-[18px] h-[60px] w-[60px] text-[#ff6b6b]" strokeWidth={1.5} />
          <h3 className="m-0 mb-[8px] text-[22px] text-white">We couldn't load your cart</h3>
          <p className="m-0 mb-[22px] text-[14px] text-white/50">
            Something went wrong on our end. Your items are safe — please try again.
          </p>
          <button type="button" className={EMPTY_BTN} onClick={() => refetch()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    // The design keeps the back-link, heading and stepper on screen and only
    // swaps the two-column grid for the empty block (v74 line 6200).
    return (
      <div className={WRAP}>
        <button type="button" className={BACK} onClick={() => navigate("/")}>
          <ChevronLeft className="h-[15px] w-[15px]" /> Back to store
        </button>

        <div className={HEAD}>
          <div>
            <h1 className={HEAD_H1}>
              <ShoppingCart className="h-[26px] w-[26px]" strokeWidth={2} />
              Shopping Cart <span className={HEAD_CNT}>0</span>
            </h1>
            <div className={HEAD_SUB}>Review your items, fees and total before checkout.</div>
          </div>
        </div>

        <CheckoutSteps current="cart" />

        <div className="px-[20px] py-[80px] text-center">
          <ShoppingCart className="mx-auto mb-[18px] h-[60px] w-[60px] text-[rgba(58,116,240,0.5)]" strokeWidth={1.5} />
          <h3 className="m-0 mb-[8px] text-[22px] text-white">Your cart is empty</h3>
          <p className="m-0 mb-[22px] text-[14px] text-white/50">Browse the store and add some digital goods to get started.</p>
          <button type="button" className={EMPTY_BTN} onClick={() => navigate("/")}>
            Start shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={WRAP}>
      <button type="button" className={BACK} onClick={() => navigate("/")}>
        <ChevronLeft className="h-[15px] w-[15px]" /> Back to store
      </button>

      <div className={HEAD}>
        <div>
          <h1 className={HEAD_H1}>
            <ShoppingCart className="h-[26px] w-[26px]" strokeWidth={2} />
            Shopping Cart <span className={HEAD_CNT}>{totalQty}</span>
          </h1>
          <div className={HEAD_SUB}>Review your items, fees and total before checkout.</div>
        </div>
        <button
          type="button"
          onClick={() => setShowClearCartModal(true)}
          className="text-xs font-semibold text-white/40 transition-colors hover:text-red-400"
        >
          Clear cart
        </button>
      </div>

      <CheckoutSteps current="cart" />

      <div className="grid grid-cols-1 items-start gap-[24px] min-[901px]:grid-cols-[1fr_372px]">
        {/* ── items ── */}
        <div className="flex flex-col gap-[14px]">
          {items.map((it) => {
            const avail = it.region ? resolveOfferAvailability(it.region) : null;
            const regionBad = isBuyerCompatible(avail, country) === false;
            return (
            <div key={it.key} className={cardCls(regionBad)}>
              {/* AUDIT FIX (PERF-11): THUMB caps the thumbnail at 180px wide
                  (w-[104px] / min-[521px]:w-[180px] above). Without a width prop
                  this pulled the seller's full-resolution original for every
                  line item. */}
              <Link to={`/product/${it.slug}`} className={THUMB}>
                {it.image ? (
                  <SafeImage src={it.image} alt={it.name} w={180} />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <ShoppingCart className="h-7 w-7 text-white/20" />
                  </span>
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col gap-[7px] px-[16px] py-[14px]">
                <div className="flex items-start justify-between gap-[10px]">
                  <Link
                    to={`/product/${it.slug}`}
                    className="m-0 text-[15px] font-bold leading-[1.25] text-white hover:text-[#7fb4ff]"
                  >
                    {it.name}
                  </Link>
                  <button
                    type="button"
                    className="flex shrink-0 cursor-pointer border-none bg-transparent p-[2px] text-white/[0.34] [transition:color_0.2s] hover:text-[#ff6b6b]"
                    onClick={() => remove(it.productId, it.sellerId)}
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className={SPECS}>
                  {it.platform && (<><span className={SPEC_K}>Platform:</span><span className={SPEC_V}>{it.platform}</span></>)}
                  {it.productType && (<><span className={SPEC_K}>Type:</span><span className={SPEC_V}>{productTypeLabel(it.productType)}</span></>)}
                  {it.region && (<><span className={SPEC_K}>Region:</span><span className={SPEC_V}><RegionPills offer={it.region} country={country} /></span></>)}
                  <span className={SPEC_K}>Device:</span><span className={SPEC_V}>{it.device || DEVICE_FALLBACK}</span>
                  {it.stock != null && (
                    <>
                      <span className={SPEC_K}>Stock:</span>
                      <span className={SPEC_V}>
                        <span className={`flex items-center gap-[5px] font-semibold ${it.stock === 0 ? "text-[#ff8080]" : "text-[#34d399]"}`}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {it.stock} in stock
                        </span>
                      </span>
                    </>
                  )}
                </div>

                <div className={FOOT}>
                  {it.region && country && (
                    <>
                      <ActivationLine offer={it.region} country={country} />
                      <span className="h-[3px] w-[3px] rounded-full bg-white/30" />
                    </>
                  )}
                  {it.seller && (
                    <>
                      <SellerAvatar name={it.seller} size={18} />
                      <span>
                        Sold by{" "}
                        {it.sellerId ? <Link to={`/seller/${it.sellerId}`} className="hover:underline"><b>{it.seller}</b></Link> : <b>{it.seller}</b>}
                      </span>
                    </>
                  )}
                  {it.sellerRating > 0 && (
                    <span className={SELLER_RATING}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#F58E2A" aria-hidden="true">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                      </svg>
                      {Number(it.sellerRating).toFixed(1)}<em>/5</em>
                    </span>
                  )}
                  {it.isPreorder && (
                    <span className="rounded border border-amber-500/50 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                      PRE-ORDER
                    </span>
                  )}
                </div>

                <div className="mt-auto flex items-end justify-between gap-[10px] pt-[4px]">
                  <div className="flex flex-wrap items-center gap-[8px]">
                    <span className="text-[20px] font-extrabold text-white">{formatPrice(it.price)}</span>
                    {it.hasDiscount && it.discountPct > 0 && (
                      <>
                        <span className={DISC_PILL}>-{Math.round(it.discountPct)}%</span>
                        {it.original != null && (
                          <span className="text-[12.5px] text-white/[0.32] line-through">{formatPrice(it.original)}</span>
                        )}
                      </>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center overflow-hidden rounded-[9px] border border-white/[0.14] bg-white/[0.04]">
                      <button type="button" className={QTY_BTN} onClick={() => setQty(it.productId, it.sellerId, it.qty - 1)} aria-label="Decrease quantity">−</button>
                      <span className="min-w-[26px] text-center text-[13px] font-semibold text-white">{it.qty}</span>
                      <button type="button" className={QTY_BTN} onClick={() => setQty(it.productId, it.sellerId, it.qty + 1)} aria-label="Increase quantity">+</button>
                    </div>
                    {it.qty > 1 && (
                      <div className="mt-[5px] text-right text-[11.5px] text-white/40">
                        Line total: <b className="font-bold text-white/75">{formatPrice(it.price * it.qty)}</b>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* ── summary ── */}
        <div className="sticky top-[24px] flex flex-col gap-[16px]">
          <div className={SUM_CARD}>
            <h3 className="m-0 mb-[16px] flex items-center gap-[8px] text-[13px] font-extrabold tracking-[1.3px] text-white [&_svg]:text-[#3a9bf5]">
              <FileText className="h-4 w-4" />
              ORDER SUMMARY
            </h3>

            <div className={SUM_LINE}>
              <span className={SUM_LBL}>Subtotal <span>({totalQty} {totalQty === 1 ? "item" : "items"})</span></span>
              <span className={SUM_V}>{formatPrice(subtotal)}</span>
            </div>
            {youSave > 0 && (
              <div className={SUM_LINE}>
                <span className={`${SUM_LBL} text-[#34d399]`}>You save</span>
                <span className="font-semibold text-[#34d399]">−{formatPrice(youSave)}</span>
              </div>
            )}
            {bundleDiscount > 0 && (
              <div className={SUM_LINE}>
                <span className={`${SUM_LBL} text-[#34d399]`}>Bundle deal</span>
                <span className="font-semibold text-[#34d399]">−{formatPrice(bundleDiscount)}</span>
              </div>
            )}
            {/* Both fee rows render unconditionally, as the design does — a
                summary that silently drops to Subtotal + TOTAL reads as if the
                buyer is being charged something undisclosed. */}
            <div className={SUM_LINE}>
              <span className={SUM_LBL}>
                Buyer Protection
                <span className={INFO_DOT} title={`${protectionLabel ? `${protectionLabel} ` : ""}fee covering escrow, refunds and dispute protection on every eligible order.`}>i</span>
              </span>
              <span className={SUM_V}>{formatPrice(protectionFee)}</span>
            </div>
            <div className={SUM_LINE}>
              <span className={SUM_LBL}>
                Checkout Fee
                <span className={INFO_DOT} title="Flat fee charged once per order by the payment provider.">i</span>
              </span>
              <span className={SUM_V}>{formatPrice(processingFee)}</span>
            </div>

            <div className="my-[14px] h-[1px] bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.12)_0_6px,transparent_6px_12px)]" />

            <div className="mb-[4px] flex items-baseline justify-between">
              <span className="text-[14px] font-extrabold tracking-[0.8px] text-white">TOTAL</span>
              <span className="text-[26px] font-extrabold text-white [text-shadow:0_0_20px_rgba(58,155,245,0.55)]">
                {formatPrice(grandTotal)} <span className="text-[12px] font-medium text-white/50">{currency}</span>
              </span>
            </div>
            <div className="mb-[16px] text-[11px] text-white/40">
              {currency === "USD"
                ? "Billed in USD. Taxes included where applicable."
                : `Prices shown in ${currency} are approximate — you'll be charged $${grandTotal.toFixed(2)} USD.`}
            </div>

            {isMixedCart && (
              <div className="mb-[12px] rounded-[12px] border border-amber-500/40 bg-amber-500/[0.08] px-[14px] py-[12px]">
                <p className="text-[13px] font-bold text-amber-200">
                  Pre-orders check out on their own
                </p>
                <p className="mt-[4px] text-[12px] leading-[1.5] text-amber-100/75">
                  {preorderNames.length === 1
                    ? `"${preorderNames[0]}" is a pre-order`
                    : `${preorderNames.length} items in your cart are pre-orders`}
                  {" "}— they&apos;re delivered on release day, so they can&apos;t be bought in the same
                  order as items delivered now. Remove{" "}
                  {preorderNames.length === 1 ? "it" : "them"} to check out the rest, or clear the
                  other items and pre-order on its own.
                </p>
              </div>
            )}

            <button
              type="button"
              className={CHECKOUT_BTN}
              disabled={isMixedCart}
              onClick={() => navigate("/checkout")}
            >
              {/* Design uses a credit-card glyph here, not a shield (v74 5836). */}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <path d="M1 10h22" />
              </svg>
              Proceed to Checkout
            </button>
            <button type="button" className={CONTINUE_BTN} onClick={() => navigate("/")}>
              Continue shopping
            </button>
          </div>

          <div className="flex flex-col gap-[11px] rounded-[16px] border border-white/[0.07] bg-[linear-gradient(160deg,rgba(10,18,40,0.9),rgba(8,14,32,0.86))] px-[18px] py-[16px]">
            <div className={TRUST_ROW}>
              <ShieldCheck className="h-[18px] w-[18px] text-[#34d399]" />
              <span><b>Escrow-protected</b> — funds held securely with easy refunds on eligible orders</span>
            </div>
            <div className={TRUST_ROW}>
              <Zap className="h-[18px] w-[18px] text-[#3a9bf5]" />
              <span>Instant delivery on all eligible products</span>
            </div>
            <div className={TRUST_ROW}>
              <Clock className="h-[18px] w-[18px] text-[#a855f7]" />
              <span>Buyer Protection on all orders</span>
            </div>
            <div className="mt-[2px] flex flex-wrap items-center gap-[10px] border-t border-white/[0.07] pt-[13px]">
              <span className="mb-[2px] w-full text-[11px] text-white/40">Secure payment</span>
              <PaymentLogos />
            </div>
          </div>
        </div>
      </div>

      {/* ── You might also like ── */}
      {related.length > 0 && (
        <div className="mt-[38px] border-t border-[rgba(58,116,240,0.18)] pt-[30px]">
          <div className="mb-[20px] flex items-center gap-[10px]">
            <Sparkles className="h-5 w-5 text-[#3a9bf5]" />
            <h2 className="m-0 text-[19px] font-extrabold tracking-[-0.2px] text-white">
              You might also <em className="not-italic text-[#3a9bf5]">like</em>
            </h2>
          </div>
          <div className={REL_ROW}>
            {related.map((p) => (
              <div key={p._id} className="w-[185px]">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmationModal
        open={showClearCartModal}
        onOpenChange={setShowClearCartModal}
        onConfirm={clearAll}
        title="Clear cart"
        description="Remove every item from your cart? This can't be undone."
        confirmText="Clear cart"
        variant="destructive"
      />
    </div>
  );
};

export default Cart;
