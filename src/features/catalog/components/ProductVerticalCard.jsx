import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@components/ui/card';
import { cn } from '@lib/utils';
import { calculateProductPrice, getProductImage, getProductName, getPlatformName, getTypeName, PRODUCT_IMAGE_PLACEHOLDER } from '../utils/productUtils';
import { ShoppingCart, Heart } from "lucide-react";
import SafeImage from "@components/ui/safe-image";
import useWishlist from '../hooks/useWishlist';

const ProductVerticalCard = ({ product }) => {
  const { discountPrice, discountPercentage, originalPrice } = calculateProductPrice(product);
  const image = getProductImage(product);
  const title = getProductName(product);
  const platformName = getPlatformName(product);
  const typeName = getTypeName(product);
  const hasDiscount = discountPercentage > 0;

  // CLIENT REQ 1 — the heart belongs on EVERY product card, and this is one:
  // it renders a real product and links to its page, it just uses a horizontal
  // layout. It was missed because the requirement was read as "wherever
  // ProductCard renders" rather than "every card that shows a product", so a
  // buyer could not save the trending-offer products on the homepage at all.
  const { isWishlisted, toggle } = useWishlist();
  const wishlisted = isWishlisted(product._id);

  const handleToggleWishlist = (e) => {
    // The whole card is a <Link>; without this the toggle also navigates.
    e.preventDefault();
    e.stopPropagation();
    toggle(product._id);
  };

  return (
    <Link to={`/product/${product.slug || product._id}`} className="block h-full">
      <Card className="relative w-full max-w-[382px] h-full flex flex-row items-stretch bg-[#041536] p-3 md:p-4 rounded-2xl border-0 text-fg font-poppins gap-2 md:gap-2.5 box-border">
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-pressed={wishlisted}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
        >
          <Heart
            className={cn("h-4 w-4", wishlisted ? "fill-red-500 text-danger" : "text-fg")}
          />
        </button>
        {image &&
        image !== PRODUCT_IMAGE_PLACEHOLDER ? (
          <SafeImage
            src={image}
            className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] rounded-2xl shrink-0 object-cover"
            alt={title}
            loading="lazy"
            width={150}
            height={150}
            fallbackSrc={PRODUCT_IMAGE_PLACEHOLDER}
          />
        ) : (
          <div className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] rounded-2xl shrink-0 bg-surface-2 flex items-center justify-center">
            <ShoppingCart className="h-8 w-8 sm:h-10 sm:w-10 text-fg-muted" />
          </div>
        )}
        <div className="flex flex-1 min-w-0 flex-col">
          <CardHeader className="p-0 text-start flex-1">
            {/* pr-8 keeps the truncated title clear of the absolute heart. */}
            <CardTitle className="-tracking-normal truncate pr-8">{title}</CardTitle>
            <p className="text-sm font-normal -tracking-normal">Platform: <span className="font-bold">{platformName}</span></p>
            <p
              className={cn(
                "text-sm font-normal -tracking-normal min-h-[1.25rem]",
                !typeName && "invisible"
              )}
              aria-hidden={!typeName}
            >
              Type: <span className="font-bold">{typeName || "—"}</span>
            </p>
          </CardHeader>

          <div className="mt-auto shrink-0 w-full">
            <CardContent className="flex flex-row justify-between items-center w-full p-0 min-h-[1.625rem]">
              <p className="text-sm font-bold">{discountPrice.toFixed(2)} &nbsp;<span className="font-normal uppercase">USD</span></p>
              <h3
                className={cn(
                  "text-sm font-semibold px-1 py-0.5 rounded-[6px] bg-gradient-to-r from-[#172AA4] to-[#0E9FE2]",
                  !hasDiscount && "invisible"
                )}
                aria-hidden={!hasDiscount}
              >
                {hasDiscount ? `-${discountPercentage.toFixed(0)}%` : "-0%"}
              </h3>
            </CardContent>
            <CardFooter className="p-0 min-h-[1.25rem] flex items-start">
              <del
                className={cn(
                  "text-sm font-normal uppercase leading-none",
                  !hasDiscount && "invisible"
                )}
                aria-hidden={!hasDiscount}
              >
                {(hasDiscount ? originalPrice : 0).toFixed(2)} usd
              </del>
            </CardFooter>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default memo(ProductVerticalCard, (prev, next) =>
  prev.product._id === next.product._id &&
  prev.product.price === next.product.price &&
  prev.product.discount === next.product.discount &&
  prev.product.trendingOffer?.discountPercent === next.product.trendingOffer?.discountPercent &&
  prev.product.trendingOffer?.offerId === next.product.trendingOffer?.offerId
);

