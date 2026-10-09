import { memo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
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
import { PreorderBadge, isActivePreorder as isUnreleasedPreorder } from "@components/common/PreorderBadge";
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
  getCardRegionOffer,
} from "../utils/productUtils";
import { Badge } from "@/components/ui/badge";

const ProductCard = memo(({ product, showStock = false }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { discountPrice, discountPercentage, originalPrice } =
    calculateProductPrice(product);
  const image = getProductImage(product);
  const title = getProductName(product);
  const platformName = getPlatformName(product);
  const typeName = getTypeName(product);
  const hasDiscount = discountPercentage > 0;
  const offersCount = product.offersCount ?? 0;
  const regionOffer = getCardRegionOffer(product);

  const { verdict } = useOfferVerdict(regionOffer);

  const isAuthenticated = useSelector((s) => s.auth?.isAuthenticated);
  const { format: formatPrice } = useCurrency();
  const [cartBusy, setCartBusy] = useState(false);

  const { isWishlisted, toggle: toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product._id);

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
    if (!isAuthenticated && isUnreleasedPreorder(product)) {
      toast.error("Pre-orders need an account — please log in to pre-order this.");
      navigate("/login");
      return;
    }
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
                soldOut && "opacity-40"
              )}
              fallbackSrc={PRODUCT_IMAGE_PLACEHOLDER}
            />
          ) : (
            <div className="w-full aspect-square rounded-2xl bg-surface-2 flex items-center justify-center">
              <ShoppingCart className="h-8 w-8 md:h-12 md:w-12 text-fg-muted" />
            </div>
          )}
          {product.hasFeaturedOffer && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-yellow-500 text-[10px] md:text-xs font-semibold text-black shadow-sm">
              Featured
            </span>
          )}

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

          {isUnreleasedPreorder(product) ? (
            <PreorderBadge
              product={product}
              withDate={false}
              className="absolute bottom-2 left-2 z-10"
            />
          ) : soldOut ? (
            <span className="absolute bottom-2 left-2 z-10 rounded-full bg-black/75 px-2 py-0.5 text-[10px] md:text-xs font-semibold text-rose-200 backdrop-blur-sm">
              Out of stock
            </span>
          ) : null}

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
});

export default ProductCard;
