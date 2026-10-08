import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { X, Trash2, ShoppingCart, CheckCircle2 } from "lucide-react";
import { cartAPI, checkoutAPI } from "@services/api";
import {
  getGuestCart,
  removeFromGuestCart,
  updateGuestCartQuantity,
  useGuestCartView,
  toCartItems,
} from "@features/cart-checkout";
import { ProductTypeBadge } from "@features/catalog";
import RegionBadges from "@features/catalog/components/RegionBadges";
import SafeImage from "@components/ui/safe-image";
import useCurrency from "@hooks/useCurrency";
import useBuyerCountry from "@hooks/useBuyerCountry";
import { resolveOfferAvailability, isBuyerCompatible } from "@lib/regionCompat";
import { showApiError } from "@utils/toast";

const PANEL =
  'fixed top-[70px] right-3 bottom-3 z-[2000] isolate flex max-h-[720px] w-[384px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-[18px] border border-[rgba(58,116,240,0.3)] bg-[linear-gradient(180deg,#0c1430,#070b18)] shadow-[0_30px_70px_rgba(0,0,0,0.66),0_0_60px_rgba(14,81,226,0.18)] origin-top-right animate-dgc-open motion-reduce:animate-none ' +
  "before:pointer-events-none before:absolute before:inset-0 before:z-[5] before:rounded-[inherit] before:p-[1.3px] before:content-[''] before:bg-[linear-gradient(120deg,rgba(14,81,226,0.9),rgba(58,155,245,0.35),rgba(123,47,247,0.85),rgba(58,155,245,0.35),rgba(14,81,226,0.9))] before:[background-size:300%_300%] before:[-webkit-mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] before:[-webkit-mask-composite:xor] before:[mask-composite:exclude] before:animate-dgc-border before:motion-reduce:animate-none";

const TOPLINE =
  'absolute top-0 left-0 right-0 z-[6] h-[2px] bg-[linear-gradient(90deg,transparent,#0e51e2,#3a9bf5,#7b2ff7,transparent)] [background-size:200%_100%] animate-rail-slide motion-reduce:animate-none';

const ORB =
  'pointer-events-none absolute z-0 rounded-full opacity-[0.35] blur-[44px] animate-dgc-float motion-reduce:animate-none';
const ORB_1 =
  'h-[170px] w-[170px] top-[-50px] right-[-40px] bg-[radial-gradient(circle,#0e51e2,transparent_70%)]';
const ORB_2 =
  'h-[150px] w-[150px] bottom-[-40px] left-[-40px] bg-[radial-gradient(circle,#7b2ff7,transparent_70%)] [animation-direction:reverse] [animation-duration:9s]';
const GRID =
  'pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(58,116,240,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(58,116,240,0.06)_1px,transparent_1px)] [background-size:26px_26px] [-webkit-mask-image:radial-gradient(circle_at_50%_0%,#000,transparent_78%)] [mask-image:radial-gradient(circle_at_50%_0%,#000,transparent_78%)]';

const TITLE =
  'bg-[linear-gradient(90deg,#ffffff,#9fc6ff,#ffffff)] [background-size:200%_100%] bg-clip-text text-transparent animate-rail-slide [animation-duration:6s] motion-reduce:animate-none';

const SCROLL =
  'flex-[1_1_auto] min-h-0 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-[6px] [&::-webkit-scrollbar-thumb]:bg-[linear-gradient(#0e51e2,#7b2ff7)]';

const itemCls = (regionBad) =>
  'mb-2.5 flex overflow-hidden rounded-[11px] border ' +
  (regionBad
    ? 'border-[rgba(255,107,107,0.45)] hover:border-[rgba(255,107,107,0.65)] hover:shadow-[0_0_0_1px_rgba(255,107,107,0.25),0_8px_24px_rgba(255,50,50,0.15)] '
    : 'border-[rgba(58,116,240,0.28)] hover:border-[rgba(58,155,245,0.65)] hover:shadow-[0_0_0_1px_rgba(58,155,245,0.28),0_8px_24px_rgba(14,81,226,0.22)] ') +
  'bg-[#101d3a] animate-dgc-item-in motion-reduce:animate-none [transition:border-color_0.2s,box-shadow_0.2s,transform_0.2s] hover:[transform:translateY(-1px)]';
const ITEM_DELAYS = [
  '[animation-delay:0.08s]',
  '[animation-delay:0.15s]',
  '[animation-delay:0.22s]',
];
const ITEM_DELAY_REST = '[animation-delay:0.28s]';

const QTY_BTN =
  'h-6 w-[26px] text-[15px] font-bold leading-none text-[#3a9bf5] hover:bg-[rgba(58,155,245,0.15)]';
const CHECKOUT_BTN =
  'flex h-[46px] w-full items-center justify-center rounded-[11px] bg-gradient-to-br from-[#0e51e2] to-[#7b2ff7] text-[15px] font-extrabold tracking-[0.3px] text-fg [transition:filter_0.18s,box-shadow_0.2s] hover:[filter:brightness(1.08)] hover:shadow-[0_12px_40px_rgba(123,47,247,0.6),0_0_26px_rgba(168,85,247,0.4)]';

const CartDropdown = ({ open, onClose }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const { format } = useCurrency();
  const { country } = useBuyerCountry();
  const [guestItems, setGuestItems] = useState([]);

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartAPI.getCart().then((r) => r.data.data),
    enabled: isAuthenticated && open,
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

  const guestView = useGuestCartView(guestItems, !isAuthenticated);

  const items = isAuthenticated
    ? toCartItems(cart?.items, true)
    : guestView.items.length > 0
      ? toCartItems(guestView.items, true)
      : toCartItems(guestItems, false);

  const subtotal = isAuthenticated
    ? cart?.subtotal ?? items.reduce((s, i) => s + i.price * i.qty, 0)
    : guestView.subtotal || items.reduce((s, i) => s + i.price * i.qty, 0);

  const bundleDiscount = isAuthenticated ? cart?.bundleDiscount || 0 : 0;
  const plusDiscount = isAuthenticated ? cart?.subscriptionDiscount || 0 : 0;
  const feeBase = isAuthenticated && cart?.total != null ? cart.total : subtotal;

  const { data: feeEst } = useQuery({
    queryKey: ["handling-fee-estimate", feeBase],
    queryFn: () => checkoutAPI.getHandlingFeeEstimate(feeBase).then((r) => r.data.data),
    enabled: open && feeBase > 0,
    retry: false,
  });
  const protectionFee = feeEst?.protectionFee ?? 0;
  const processingFee = feeEst?.processingFee ?? 0;
  const total = feeEst?.grandTotal ?? feeBase;

  const updateMut = useMutation({
    mutationFn: (d) => cartAPI.updateCart(d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    onError: (error) => showApiError(error, "Failed to update cart"),
  });
  const removeMut = useMutation({
    mutationFn: (d) => cartAPI.removeItem(d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    onError: (error) => showApiError(error, "Failed to remove item from cart"),
  });

  const remove = (productId, sellerId) => {
    if (isAuthenticated) removeMut.mutate({ productId, sellerId });
    else { removeFromGuestCart(productId, sellerId); setGuestItems(getGuestCart().items || []); }
  };
  const setQty = (productId, sellerId, qty) => {
    if (qty <= 0) return remove(productId, sellerId);
    if (isAuthenticated) updateMut.mutate({ productId, sellerId, qty });
    else { updateGuestCartQuantity(productId, sellerId, qty); setGuestItems(getGuestCart().items || []); }
  };

  const go = (path) => { onClose?.(); navigate(path); };

  if (!open) return null;

  return (
    <>
      <div role="presentation" className="fixed inset-0 z-[1999] bg-transparent" onClick={onClose} />
      <div className={PANEL} role="dialog" aria-label="Shopping cart">
        <span className={TOPLINE} />
        <span className={`${ORB} ${ORB_1}`} />
        <span className={`${ORB} ${ORB_2}`} />
        <span className={GRID} />

        <div className="relative z-[2] flex items-center justify-between px-4 pb-2.5 pt-3.5">
          <h3 className="m-0 flex items-center gap-2 text-[13px] font-extrabold tracking-[1.4px] text-fg">
            <ShoppingCart className="h-4 w-4 text-[#3a9bf5]" strokeWidth={2} />
            <span className={TITLE}>MY SHOPPING CART</span>
            <span className="rounded-full border border-[rgba(58,116,240,0.5)] bg-[rgba(14,81,226,0.2)] px-[7px] py-px text-[10px] font-extrabold text-[#7fb4ff]">
              {items.length}
            </span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-white/10 bg-white/5 text-fg/60 transition-colors hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.4} />
          </button>
        </div>

        <div className={`${SCROLL} relative z-[2] px-3 pb-1 pt-0.5`}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <ShoppingCart className="h-10 w-10 text-fg/25" strokeWidth={1.5} />
              <p className="text-sm text-fg/50">Your cart is empty</p>
            </div>
          ) : (
            items.map((it, idx) => {
              const avail = it.region ? resolveOfferAvailability(it.region) : null;
              const regionBad = isBuyerCompatible(avail, country) === false;
              return (
              <div
                key={it.key}
                className={`${itemCls(regionBad)} ${ITEM_DELAYS[idx] || ITEM_DELAY_REST}`}
              >
                <Link to={`/product/${it.slug}`} onClick={onClose} className="relative w-[84px] min-w-[84px] self-stretch bg-[#0a1024]">
                  {it.image ? (
                    <SafeImage src={it.image} alt={it.name} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-fg/25" />
                    </div>
                  )}
                </Link>
                <div className="min-w-0 flex-1 p-2.5">
                  <div className="flex items-start justify-between gap-1.5">
                    <Link to={`/product/${it.slug}`} onClick={onClose} className="line-clamp-2 text-[12.5px] font-bold leading-tight text-fg hover:text-accent-on-dark">
                      {it.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(it.productId, it.sellerId)}
                      aria-label="Remove item"
                      className="shrink-0 text-fg/35 transition-colors hover:text-red-400"
                    >
                      <Trash2 className="h-[15px] w-[15px]" strokeWidth={2} />
                    </button>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10.5px] text-fg/45">
                    {it.platform && <span>{it.platform}</span>}
                    {it.productType && <ProductTypeBadge type={it.productType} />}
                  </div>

                  {it.region && (
                    <div className="mt-1">
                      <RegionBadges offer={it.region} compact maxChips={1} showLabel={false} interactive={false} />
                    </div>
                  )}
                  {it.isPreorder && (
                    <span className="mt-1 inline-block rounded border border-amber-500/50 bg-amber-500/10 px-1.5 py-0.5 text-[9.5px] font-semibold text-warning">
                      PRE-ORDER
                    </span>
                  )}

                  <div className="mt-1.5 flex items-end justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[15px] font-extrabold text-fg">{format(it.price)}</span>
                      {it.hasDiscount && it.discountPct > 0 && (
                        <>
                          <span className="rounded-full border border-[rgba(120,180,255,0.9)] bg-gradient-to-br from-[#172AA4] to-[#0E9FE2] px-2 py-0.5 text-[10px] font-extrabold text-fg">
                            -{Math.round(it.discountPct)}%
                          </span>
                          {it.original != null && (
                            <span className="text-[10.5px] text-fg/30 line-through">{format(it.original)}</span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center overflow-hidden rounded-md border border-white/15 bg-white/5">
                      <button type="button" onClick={() => setQty(it.productId, it.sellerId, it.qty - 1)} className={QTY_BTN} aria-label="Decrease quantity">−</button>
                      <span className="min-w-[20px] text-center text-xs font-semibold text-fg">{it.qty}</span>
                      <button type="button" onClick={() => setQty(it.productId, it.sellerId, it.qty + 1)} className={QTY_BTN} aria-label="Increase quantity">+</button>
                    </div>
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[10.5px]">
                    {it.unavailable ? (
                      <span className="font-semibold text-[#ff8080]">No longer available from this seller</span>
                    ) : it.stockShort ? (
                      <span className="font-semibold text-[#ff8080]">{it.availabilityMessage || "Not enough stock"}</span>
                    ) : it.stock != null ? (
                      <span className="flex items-center gap-1 font-semibold text-[#22c55e]">
                        <CheckCircle2 className="h-3 w-3" /> {it.stock} in stock
                      </span>
                    ) : <span />}
                    {it.seller && <span className="truncate text-fg/55">Sold by {it.seller}</span>}
                  </div>
                </div>
              </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="relative z-[2] flex-none border-t border-[rgba(58,116,240,0.18)] bg-[#090e1c] px-4 pb-4 pt-3">
            <div className="mb-1.5 flex items-center justify-between text-[12.5px] text-fg/50">
              <span>Subtotal</span>
              <span className="text-fg/80">{format(subtotal)}</span>
            </div>
            {bundleDiscount > 0 && (
              <div className="mb-1.5 flex items-center justify-between text-[12.5px] text-[#34d399]">
                <span>Bundle deal</span>
                <span>−{format(bundleDiscount)}</span>
              </div>
            )}
            {plusDiscount > 0 && (
              <div className="mb-1.5 flex items-center justify-between text-[12.5px] text-[#34d399]">
                <span>DGMARQ Plus discount</span>
                <span>−{format(plusDiscount)}</span>
              </div>
            )}
            {protectionFee > 0 && (
              <div className="mb-1.5 flex items-center justify-between text-[12.5px] text-fg/50">
                <span>Buyer Protection</span>
                <span className="text-fg/80">{format(protectionFee)}</span>
              </div>
            )}
            {processingFee > 0 && (
              <div className="mb-2.5 flex items-center justify-between text-[12.5px] text-fg/50">
                <span>Checkout Fee</span>
                <span className="text-fg/80">{format(processingFee)}</span>
              </div>
            )}
            <div className="mb-3 flex items-center justify-between border-t border-dashed border-white/10 pt-2.5">
              <span className="text-[13px] font-extrabold tracking-[0.8px] text-fg">TOTAL</span>
              <span className="text-[22px] font-extrabold text-fg [text-shadow:0_0_18px_rgba(58,155,245,0.55)]">{format(total)}</span>
            </div>
            <button
              type="button"
              onClick={() => go("/checkout")}
              className={CHECKOUT_BTN}
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
