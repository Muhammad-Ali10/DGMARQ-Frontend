import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { ShoppingCart, Trash2, ShieldCheck, Zap, Clock, Sparkles, FileText, CheckCircle2, ChevronLeft } from "lucide-react";
import { cartAPI, checkoutAPI, productAPI } from "@services/api";
import { Loading } from "@components/ui/loading";
import SafeImage from "@components/ui/safe-image";
import ConfirmationModal from "@components/common/ConfirmationModal";
import { showSuccess, showApiError } from "@utils/toast";
import useCurrency from "@hooks/useCurrency";
import useBuyerCountry from "@hooks/useBuyerCountry";
import RegionBadges from "@features/catalog/components/RegionBadges";
import { ProductCard } from "@features/catalog";
import {
  getGuestCart,
  removeFromGuestCart,
  updateGuestCartQuantity,
  clearGuestCart,
  useGuestCart,
  CheckoutSteps,
  SellerAvatar,
  PaymentLogos,
  toCartItems,
  DELIVERY_LABEL,
} from "@features/cart-checkout";
import "./Cart.css";

const round2 = (n) => Math.round(n * 100) / 100;

const Cart = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { format: formatPrice, currency } = useCurrency();
  const { country } = useBuyerCountry();
  const [guestCartItems, setGuestCartItems] = useGuestCart(isAuthenticated);
  const [showClearCartModal, setShowClearCartModal] = useState(false);

  // ONE shared ["cart"] query — same key/shape the Header + mini-cart use, so
  // react-query serves all of them from a single fetch.
  const { data: cart, isLoading } = useQuery({
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

  // ── one render model for both auth (server) and guest (localStorage) lines ──
  const items = toCartItems(isAuthenticated ? cart?.items : guestCartItems, isAuthenticated);

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

  if (isAuthenticated && isLoading) return <Loading message="Loading your cart…" />;

  if (items.length === 0) {
    return (
      <div className="cp-wrap">
        <div className="cp-empty">
          <ShoppingCart className="mx-auto h-16 w-16" strokeWidth={1.5} />
          <h3>Your cart is empty</h3>
          <p>Browse the store and add a few keys — they&apos;ll show up here.</p>
          <button type="button" className="cp-checkout mx-auto max-w-[240px]" onClick={() => navigate("/")}>
            Start shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cp-wrap">
      <button type="button" className="cp-back" onClick={() => navigate("/")}>
        <ChevronLeft className="h-[15px] w-[15px]" /> Back to store
      </button>

      <div className="cp-head">
        <div>
          <h1>
            <ShoppingCart className="h-[26px] w-[26px]" strokeWidth={2} />
            Shopping Cart <span className="cnt">{totalQty}</span>
          </h1>
          <div className="sub">Review your items, fees and total before checkout.</div>
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

      <div className="cp-layout">
        {/* ── items ── */}
        <div className="cp-items">
          {items.map((it) => (
            <div key={it.key} className="cp-card">
              <Link to={`/product/${it.slug}`} className="cp-thumb">
                {it.image ? (
                  <SafeImage src={it.image} alt={it.name} />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <ShoppingCart className="h-7 w-7 text-white/20" />
                  </span>
                )}
              </Link>

              <div className="cp-body">
                <div className="cp-row1">
                  <Link to={`/product/${it.slug}`} className="cp-title">{it.name}</Link>
                  <button type="button" className="cp-remove" onClick={() => remove(it.productId, it.sellerId)} aria-label="Remove">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="cp-specs">
                  {it.platform && (<><span className="k">Platform:</span><span className="v">{it.platform}</span></>)}
                  {it.productType && (<><span className="k">Type:</span><span className="v">{it.productType.replace(/_/g, " ")}</span></>)}
                  {it.region && (<><span className="k">Region:</span><span className="v"><RegionBadges offer={it.region} compact maxChips={3} showLabel={false} interactive={false} /></span></>)}
                  {it.device && (<><span className="k">Device:</span><span className="v">{it.device}</span></>)}
                  <span className="k">Delivery:</span><span className="v">{DELIVERY_LABEL}</span>
                  {it.stock != null && (
                    <>
                      <span className="k">Stock:</span>
                      <span className="v">
                        <span className={`cp-stockval ${it.stock === 0 ? "out" : ""}`}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {it.stock} in stock
                        </span>
                      </span>
                    </>
                  )}
                </div>

                <div className="cp-foot">
                  {it.region && country && (
                    <>
                      <span className="cp-activate">
                        <RegionBadges maxChips={2} showWarning />
                      </span>
                      <span className="dot" />
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
                    <span className="srate">
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

                <div className="cp-row2">
                  <div className="cp-price">
                    <span className="now">{formatPrice(it.price)}</span>
                    {it.hasDiscount && it.discountPct > 0 && (
                      <>
                        <span className="disc">-{Math.round(it.discountPct)}%</span>
                        {it.original != null && <span className="was">{formatPrice(it.original)}</span>}
                      </>
                    )}
                  </div>
                  <div>
                    <div className="cp-qty">
                      <button type="button" onClick={() => setQty(it.productId, it.sellerId, it.qty - 1)} aria-label="Decrease quantity">−</button>
                      <span>{it.qty}</span>
                      <button type="button" onClick={() => setQty(it.productId, it.sellerId, it.qty + 1)} aria-label="Increase quantity">+</button>
                    </div>
                    {it.qty > 1 && (
                      <div className="cp-linetotal">Line total: <b>{formatPrice(it.price * it.qty)}</b></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── summary ── */}
        <div className="cp-summary">
          <div className="cp-sum-card">
            <h3 className="cp-sum-h">
              <FileText className="h-4 w-4" />
              ORDER SUMMARY
            </h3>

            <div className="cp-line">
              <span className="lbl">Subtotal <span>({totalQty} {totalQty === 1 ? "item" : "items"})</span></span>
              <span className="v">{formatPrice(subtotal)}</span>
            </div>
            {youSave > 0 && (
              <div className="cp-line save">
                <span className="lbl">You save</span>
                <span className="v">−{formatPrice(youSave)}</span>
              </div>
            )}
            {bundleDiscount > 0 && (
              <div className="cp-line save">
                <span className="lbl">Bundle deal</span>
                <span className="v">−{formatPrice(bundleDiscount)}</span>
              </div>
            )}
            {protectionFee > 0 && (
              <div className="cp-line">
                <span className="lbl">
                  Buyer Protection
                  <span className="cp-info" title="Covers escrow, refunds and dispute protection on every eligible order.">i</span>
                </span>
                <span className="v">{formatPrice(protectionFee)}</span>
              </div>
            )}
            {processingFee > 0 && (
              <div className="cp-line">
                <span className="lbl">
                  Payment Processing Fee
                  <span className="cp-info" title="Flat fee charged once per order by the payment provider.">i</span>
                </span>
                <span className="v">{formatPrice(processingFee)}</span>
              </div>
            )}

            <div className="cp-divide" />

            <div className="cp-total">
              <span className="t">TOTAL</span>
              <span className="amt">{formatPrice(grandTotal)} <span className="cur">{currency}</span></span>
            </div>
            <div className="cp-tax">
              {currency === "USD"
                ? "Billed in USD. Taxes included where applicable."
                : `Prices shown in ${currency} are approximate — you'll be charged $${grandTotal.toFixed(2)} USD.`}
            </div>

            <button type="button" className="cp-checkout" onClick={() => navigate("/checkout")}>
              <ShieldCheck className="h-[17px] w-[17px]" />
              Proceed to Checkout
            </button>
            <button type="button" className="cp-continue" onClick={() => navigate("/")}>
              Continue shopping
            </button>
          </div>

          <div className="cp-trust">
            <div className="tr">
              <ShieldCheck className="h-[18px] w-[18px] text-[#34d399]" />
              <span><b>Escrow-protected</b> — funds held securely with easy refunds on eligible orders</span>
            </div>
            <div className="tr">
              <Zap className="h-[18px] w-[18px] text-[#3a9bf5]" />
              <span>Instant delivery on all eligible products</span>
            </div>
            <div className="tr">
              <Clock className="h-[18px] w-[18px] text-[#a855f7]" />
              <span>Buyer Protection on all orders</span>
            </div>
            <div className="cp-pay">
              <span className="lbl">Secure payment</span>
              <PaymentLogos />
            </div>
          </div>
        </div>
      </div>

      {/* ── You might also like ── */}
      {related.length > 0 && (
        <div className="cp-related">
          <div className="cp-rel-head">
            <Sparkles className="h-5 w-5 text-[#3a9bf5]" />
            <h2>You might also <em>like</em></h2>
          </div>
          <div className="cp-rel-row">
            {related.map((p) => (
              <div key={p._id} className="w-[196px]">
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
