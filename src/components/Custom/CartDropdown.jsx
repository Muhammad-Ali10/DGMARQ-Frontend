import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { X, Trash2, Minus, Plus, ShoppingCart, CheckCircle2 } from "lucide-react";
import { cartAPI, checkoutAPI } from "@services/api";
import {
  getGuestCart,
  removeFromGuestCart,
  updateGuestCartQuantity,
} from "@features/cart-checkout";
import { ProductTypeBadge } from "@features/catalog";
import RegionBadges from "@features/catalog/components/RegionBadges";
import SafeImage from "@components/ui/safe-image";
import useCurrency from "@hooks/useCurrency";
import "./CartDropdown.css";

// Mini-cart flyout (header). Reuses the real cart (auth via API, guest via
// localStorage) and mirrors the full cart page's data — images, platform·type,
// region verdict, "Sold by", stock, qty stepper — in the v74 HUD design.
const CartDropdown = ({ open, onClose }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const { format } = useCurrency();
  const [guestItems, setGuestItems] = useState([]);

  // Same key/options as the Header's cart query → react-query dedupes them into
  // ONE fetch and one cache. Not gated on `open`: the data is already there, so
  // the flyout renders instantly instead of showing stale items then refetching.
  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartAPI.getCart().then((r) => r.data.data),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!open || isAuthenticated) return undefined;
    const sync = () => setGuestItems(getGuestCart().items || []);
    sync();
    window.addEventListener("guestCartChange", sync);
    return () => window.removeEventListener("guestCartChange", sync);
  }, [open, isAuthenticated]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const rawItems = isAuthenticated ? cart?.items || [] : guestItems;

  // Normalise auth vs guest item shapes into one render model.
  const items = rawItems.map((it) =>
    isAuthenticated
      ? {
          key: `${it.product?._id || it.product}|${it.sellerId || ""}`,
          productId: it.product?._id || it.product,
          sellerId: it.sellerId || null,
          name: it.product?.name || "Product",
          image: it.product?.images?.[0],
          slug: it.product?.slug || it.product?._id,
          platform: it.product?.platform?.name || null,
          productType: it.product?.productType || null,
          region: it.offerRegion || null,
          price: it.discountedPrice ?? it.unitPrice ?? 0,
          original: it.originalPrice ?? null,
          discountPct: it.discountPercentage || 0,
          hasDiscount: !!it.hasDiscount,
          stock: it.availableKeys ?? null,
          seller: it.sellerShopName || null,
          qty: it.qty || 1,
          isPreorder: !!it.isPreorder,
        }
      : {
          key: it.productId?._id || it.productId,
          productId: it.productId?._id || it.productId,
          sellerId: it.sellerId || null,
          name: it.name || "Product",
          image: it.image,
          slug: it.slug || it.productId?._id || it.productId,
          platform: it.platformName || null,
          productType: it.productType || null,
          region: null,
          price: Number(it.price) || 0,
          original: null,
          discountPct: 0,
          hasDiscount: false,
          stock: null,
          seller: it.shopName || null,
          qty: it.qty || 1,
          isPreorder: false,
        }
  );

  const subtotal = isAuthenticated
    ? cart?.subtotal ?? items.reduce((s, i) => s + i.price * i.qty, 0)
    : items.reduce((s, i) => s + i.price * i.qty, 0);

  const { data: feeEst } = useQuery({
    queryKey: ["handling-fee-estimate", subtotal],
    queryFn: () => checkoutAPI.getHandlingFeeEstimate(subtotal).then((r) => r.data.data),
    enabled: open && isAuthenticated && subtotal > 0,
    retry: false,
  });
  const protectionFee = feeEst?.protectionFee ?? 0;
  const processingFee = feeEst?.processingFee ?? 0;
  const total = feeEst?.grandTotal ?? subtotal;

  const updateMut = useMutation({
    mutationFn: (d) => cartAPI.updateCart(d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });
  const removeMut = useMutation({
    mutationFn: (d) => cartAPI.removeItem(d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const remove = (productId, sellerId) => {
    if (isAuthenticated) removeMut.mutate({ productId, sellerId });
    else { removeFromGuestCart(productId); setGuestItems(getGuestCart().items || []); }
  };
  const setQty = (productId, sellerId, qty) => {
    if (qty <= 0) return remove(productId, sellerId);
    if (isAuthenticated) updateMut.mutate({ productId, sellerId, qty });
    else { updateGuestCartQuantity(productId, qty); setGuestItems(getGuestCart().items || []); }
  };

  const go = (path) => { onClose?.(); navigate(path); };

  if (!open) return null;

  return (
    <>
      <div className="dgc-backdrop" onClick={onClose} />
      <div className="dgc-panel" role="dialog" aria-label="Shopping cart">
        <span className="dgc-topline" />
        <span className="dgc-orb dgc-orb1" />
        <span className="dgc-orb dgc-orb2" />
        <span className="dgc-grid" />

        {/* Header */}
        <div className="relative z-[2] flex items-center justify-between px-4 pb-2.5 pt-3.5">
          <h3 className="m-0 flex items-center gap-2 text-[13px] font-extrabold tracking-[1.4px] text-white">
            <ShoppingCart className="h-4 w-4 text-[#3a9bf5]" strokeWidth={2} />
            <span className="dgc-title">MY SHOPPING CART</span>
            <span className="rounded-full border border-[rgba(58,116,240,0.5)] bg-[rgba(14,81,226,0.2)] px-[7px] py-px text-[10px] font-extrabold text-[#7fb4ff]">
              {items.length}
            </span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.4} />
          </button>
        </div>

        {/* Items */}
        <div className="dgc-scroll relative z-[2] px-3 pb-1 pt-0.5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <ShoppingCart className="h-10 w-10 text-white/25" strokeWidth={1.5} />
              <p className="text-sm text-white/50">Your cart is empty</p>
            </div>
          ) : (
            items.map((it) => (
              <div
                key={it.key}
                className="dgc-item mb-2.5 flex overflow-hidden rounded-[11px] border border-[rgba(58,116,240,0.28)] bg-[#101d3a]"
              >
                <Link to={`/product/${it.slug}`} onClick={onClose} className="relative w-[84px] min-w-[84px] self-stretch bg-[#0a1024]">
                  {it.image ? (
                    <SafeImage src={it.image} alt={it.name} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-white/25" />
                    </div>
                  )}
                </Link>
                <div className="min-w-0 flex-1 p-2.5">
                  <div className="flex items-start justify-between gap-1.5">
                    <Link to={`/product/${it.slug}`} onClick={onClose} className="line-clamp-2 text-[12.5px] font-bold leading-tight text-white hover:text-accent">
                      {it.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(it.productId, it.sellerId)}
                      aria-label="Remove item"
                      className="shrink-0 text-white/35 transition-colors hover:text-red-400"
                    >
                      <Trash2 className="h-[15px] w-[15px]" strokeWidth={2} />
                    </button>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10.5px] text-white/45">
                    {it.platform && <span>{it.platform}</span>}
                    {it.productType && <ProductTypeBadge type={it.productType} />}
                  </div>

                  {it.region && (
                    <div className="mt-1">
                      <RegionBadges offer={it.region} compact maxChips={1} showLabel={false} interactive={false} />
                    </div>
                  )}
                  {it.isPreorder && (
                    <span className="mt-1 inline-block rounded border border-amber-500/50 bg-amber-500/10 px-1.5 py-0.5 text-[9.5px] font-semibold text-amber-300">
                      PRE-ORDER
                    </span>
                  )}

                  <div className="mt-1.5 flex items-end justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[15px] font-extrabold text-white">{format(it.price)}</span>
                      {it.hasDiscount && it.discountPct > 0 && (
                        <>
                          <span className="rounded-full border border-[rgba(120,180,255,0.9)] bg-gradient-to-br from-[#172AA4] to-[#0E9FE2] px-2 py-0.5 text-[10px] font-extrabold text-white">
                            -{Math.round(it.discountPct)}%
                          </span>
                          {it.original != null && (
                            <span className="text-[10.5px] text-white/30 line-through">{format(it.original)}</span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="dgc-qty flex items-center overflow-hidden rounded-md border border-white/15 bg-white/5">
                      <button type="button" onClick={() => setQty(it.productId, it.sellerId, it.qty - 1)} className="h-6 w-[26px] text-[15px] font-bold leading-none text-[#3a9bf5]" aria-label="Decrease quantity">−</button>
                      <span className="min-w-[20px] text-center text-xs font-semibold text-white">{it.qty}</span>
                      <button type="button" onClick={() => setQty(it.productId, it.sellerId, it.qty + 1)} className="h-6 w-[26px] text-[15px] font-bold leading-none text-[#3a9bf5]" aria-label="Increase quantity">+</button>
                    </div>
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[10.5px]">
                    {it.stock != null ? (
                      <span className="flex items-center gap-1 font-semibold text-[#22c55e]">
                        <CheckCircle2 className="h-3 w-3" /> {it.stock} in stock
                      </span>
                    ) : <span />}
                    {it.seller && <span className="truncate text-white/55">Sold by {it.seller}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="relative z-[2] flex-none border-t border-[rgba(58,116,240,0.18)] bg-[#090e1c] px-4 pb-4 pt-3">
            <div className="mb-1.5 flex items-center justify-between text-[12.5px] text-white/50">
              <span>Subtotal</span>
              <span className="text-white/80">{format(subtotal)}</span>
            </div>
            {isAuthenticated && protectionFee > 0 && (
              <div className="mb-1.5 flex items-center justify-between text-[12.5px] text-white/50">
                <span>Buyer Protection</span>
                <span className="text-white/80">{format(protectionFee)}</span>
              </div>
            )}
            {isAuthenticated && processingFee > 0 && (
              <div className="mb-2.5 flex items-center justify-between text-[12.5px] text-white/50">
                <span>Payment Processing Fee</span>
                <span className="text-white/80">{format(processingFee)}</span>
              </div>
            )}
            <div className="mb-3 flex items-center justify-between border-t border-dashed border-white/10 pt-2.5">
              <span className="text-[13px] font-extrabold tracking-[0.8px] text-white">TOTAL</span>
              <span className="text-[22px] font-extrabold text-white [text-shadow:0_0_18px_rgba(58,155,245,0.55)]">{format(total)}</span>
            </div>
            <button
              type="button"
              onClick={() => go("/checkout")}
              className="dgc-checkout flex h-[46px] w-full items-center justify-center rounded-[11px] bg-gradient-to-br from-[#0e51e2] to-[#7b2ff7] text-[15px] font-extrabold tracking-[0.3px] text-white"
            >
              Checkout Now
            </button>
            <button
              type="button"
              onClick={() => go("/cart")}
              className="mt-2.5 flex h-[42px] w-full items-center justify-center rounded-[11px] border border-[rgba(58,116,240,0.45)] bg-transparent text-[13.5px] font-bold text-[#3a9bf5] transition-colors hover:bg-[rgba(14,81,226,0.1)]"
            >
              View Full Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDropdown;
