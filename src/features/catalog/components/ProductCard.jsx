import { memo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import SafeImage from "@components/ui/safe-image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@components/ui/card";
import { ShoppingCart, Heart } from "lucide-react";
import { cn } from "@lib/utils";
import useCurrency from "@hooks/useCurrency";
import useOfferVerdict from "@hooks/useOfferVerdict";
import RegionBadges from "./RegionBadges";
import useWishlist from "../hooks/useWishlist";
import { cartAPI } from "@services/api";
import { addToGuestCart } from "@features/cart-checkout";
import {
  calculateProductPrice,
  getProductImage,
  getProductName,
  getPlatformName,
  PRODUCT_IMAGE_PLACEHOLDER,
  getTypeName,
} from "../utils/productUtils";
import { Badge } from "@/components/ui/badge";

/**
 * @param {object}  props.product
 * @param {boolean} [props.showStock=false]  render the out-of-stock treatment.
 *   OFF by default, and deliberately so: browse, search and the home sections
 *   filter out-of-stock products out server-side (the `hasStock` gate in
 *   product.service), so a card there is buyable by definition and the extra
 *   chip would be dead weight on the hottest lists on the site. The WISHLIST is
 *   the one surface that keeps sold-out items on purpose — watching a sold-out
 *   game until it comes back is the reason to save it — so it opts in.
 */
const ProductCard = memo(({ product, showStock = false }) => {
  const queryClient = useQueryClient();
  const { discountPrice, discountPercentage, originalPrice } =
    calculateProductPrice(product);
  const image = getProductImage(product);
  const title = getProductName(product);
  const platformName = getPlatformName(product);
  const typeName = getTypeName(product);
  const hasDiscount = discountPercentage > 0;
  const offersCount = product.offersCount ?? 0;
  // Region badge uses the UNION of every offer's region codes (offerRegionCodes)
  // so the card reads "can activate" when ANY seller covers the buyer's region —
  // not just the cheapest offer (which may be region-locked). Price stays lowest.
  // Falls back to the best-offer snapshot if the union isn't projected yet.
  const hasRegionData = product.offerRegionCodes !== undefined || product.bestOfferRegionCodes !== undefined;
  const regionOffer = hasRegionData
    ? {
      regionCodes: product.offerRegionCodes || product.bestOfferRegionCodes || [],
      countries: [],
      excludedCountries: [],
    }
    : null;

  // Buyer-region compatibility for THIS listing's best offer. false ⇒ the buyer
  // can't activate it ⇒ the whole card gets a red border (screenshot behaviour).
  const { verdict } = useOfferVerdict(regionOffer);

  const isAuthenticated = useSelector((s) => s.auth?.isAuthenticated);
  const { format: formatPrice } = useCurrency();
  const [cartBusy, setCartBusy] = useState(false);

  // Derived from the shared ['wishlist'] cache, NOT local state. The previous
  // `useState(!!product.isWishlisted)` seeded from a field no endpoint sets, so
  // the heart was always empty and always took the "add" branch — clicking it
  // on a saved product 400'd and un-saving from a card was impossible.
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product._id);

  // `hasStock` is the master rollup (inStockOffersCount > 0) — the same field
  // browse gates on. Only treat the product as sold out when the server
  // actually said so; an endpoint that does not project the field must not make
  // every card read "Out of stock".
  const soldOut = showStock && product.hasStock === false;

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product._id);
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartBusy) return;
    const sellerId = product.bestOffer?.sellerId || product.sellerId;
    if (!isAuthenticated) {
      addToGuestCart({
        productId: product._id,
        qty: 1,
        price: discountPrice,
        originalPrice,
        discountPercentage,
        sellerId,
        name: title,
        slug: product.slug,
        image,
        platformName,
        typeName,
      });
      toast.success("Added to cart");
      return;
    }
    setCartBusy(true);
    try {
      await cartAPI.addItem({ productId: product._id, qty: 1, sellerId });
      // Refresh the shared ['cart'] cache so the header badge + mini-cart
      // reflect the new item immediately (this was missing → stale badge).
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to cart");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add to cart");
    } finally {
      setCartBusy(false);
    }
  };

  return ( 
    <Link to={`/product/${product.slug || product._id}`} className="block h-full ">
      <Card
        className={cn(
          "group w-full max-w-[196px] mx-auto h-full flex flex-col bg-[#041536] p-3 md:p-4 rounded-2xl text-fg font-poppins gap-2.5 box-border transition duration-200 border",
          // Hover glow matches the border colour: red when the buyer can't
          // activate (red border), blue otherwise.
          verdict === false
            ? "border-red-500 hover:shadow-[0_0_22px_rgba(239,68,68,0.55)]"
            : "border-blue-600 hover:shadow-[0_0_22px_rgba(37,99,235,0.55)]"
        )}
      >
        <div className="relative">
          {image && image !== PRODUCT_IMAGE_PLACEHOLDER ? (
            <SafeImage
              src={image}
              alt={title}
              loading="lazy"
              width={300}
              height={300}
              className={cn(
                "w-full aspect-square object-cover rounded-2xl",
                // Dim the art so a sold-out card reads as unavailable at a
                // glance, before the chip is read.
                soldOut && "opacity-40"
              )}
              fallbackSrc={PRODUCT_IMAGE_PLACEHOLDER}
            />
          ) : (
            <div className="w-full aspect-square rounded-2xl bg-surface-2 flex items-center justify-center">
              <ShoppingCart className="h-8 w-8 md:h-12 md:w-12 text-fg-muted" />
            </div>
          )}
          {/* Featuring is now a seller-purchased promotion on an offer; the
              master carries a denormalized rollup of it. */}
          {product.hasFeaturedOffer && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-yellow-500 text-[10px] md:text-xs font-semibold text-black shadow-sm">
              Featured
            </span>
          )}

          {/* Wishlist toggle — top-right */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-pressed={wishlisted}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
          >
            <Heart
              className={cn(
                "h-4 w-4",
                wishlisted ? "fill-red-500 text-danger" : "text-fg"
              )}
            />
          </button>

          {soldOut && (
            <span className="absolute bottom-2 left-2 z-10 rounded-full bg-black/75 px-2 py-0.5 text-[10px] md:text-xs font-semibold text-rose-200 backdrop-blur-sm">
              Out of stock
            </span>
          )}

          {/* Add to cart — bottom-right, revealed on card hover. Hidden outright
              when sold out: there is nothing to add, and a disabled-looking
              button that appears on hover reads as a broken control. */}
          {!soldOut && (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={cartBusy}
              aria-label="Add to cart"
              className="absolute bottom-2 right-2 z-10 p-2 rounded-full bg-accent text-fg shadow-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:opacity-50"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          )}
        </div>

        <CardHeader className="p-0 flex-1 min-h-0">
          <CardTitle className="text-xs md:text-sm -tracking-normal truncate">
            {title}
          </CardTitle>
          <p className="text-xs md:text-sm font-normal -tracking-normal">
            Platform: <span className="font-bold">{platformName}</span>
          </p>
          <p
            className={cn(
              "text-xs md:text-sm font-normal -tracking-normal min-h-[1.125rem] md:min-h-[1.25rem]",
              !typeName && "invisible"
            )}
            aria-hidden={!typeName}
          >
            Type: <span className="font-bold">{typeName || "—"}</span>
          </p>
          {regionOffer && (
            <div className="mt-0.5 mb-1">
              <RegionBadges offer={regionOffer} maxChips={1} compact showWarning />
            </div>
          )}
          <hr />
          <Badge className="w-full border bg-transparent border-[#0e64dc73]">
            {offersCount > 1
              ? `+${offersCount - 1} more offers`
              : `${offersCount} ${offersCount === 1 ? "offer" : "offers"}`}
          </Badge>

        </CardHeader>

        <div className="mt-auto shrink-0 w-full">
          <CardContent className="flex flex-row justify-between items-center w-full p-0 gap-2 min-h-[1.5rem] md:min-h-[1.625rem]">
            <p className="text-xs md:text-sm font-bold truncate">
              {formatPrice(discountPrice)}
            </p>
            <h3
              className={cn(
                "text-xs md:text-sm font-semibold px-1 py-0.5 rounded-[6px] whitespace-nowrap bg-gradient-to-r from-[#172AA4] to-[#0E9FE2]",
                !hasDiscount && "invisible"
              )}
              aria-hidden={!hasDiscount}
            >
              {hasDiscount ? `-${discountPercentage}%` : "-0%"}
            </h3>
          </CardContent>
          <CardFooter className="p-0 min-h-[1.125rem] md:min-h-[1.25rem] flex items-start">
            <del
              className={cn(
                "text-xs md:text-sm font-normal leading-none",
                !hasDiscount && "invisible"
              )}
              aria-hidden={!hasDiscount}
            >
              {formatPrice(hasDiscount ? originalPrice : 0)}
            </del>
          </CardFooter>
        </div>
      </Card>
    </Link>
  );
}, (prev, next) =>
  prev.product._id === next.product._id &&
  prev.product.price === next.product.price &&
  prev.product.discount === next.product.discount &&
  prev.product.offersCount === next.product.offersCount &&
  // Both inputs to the sold-out treatment, or a card that goes out of stock
  // between refetches keeps rendering as buyable.
  prev.showStock === next.showStock &&
  prev.product.hasStock === next.product.hasStock &&
  prev.product.trendingOffer?.discountPercent === next.product.trendingOffer?.discountPercent &&
  prev.product.trendingOffer?.offerId === next.product.trendingOffer?.offerId
);

export default ProductCard;
