import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { cn } from '../lib/utils';
import { calculateProductPrice, getProductImage, getProductName, getPlatformName, getTypeName, PRODUCT_IMAGE_PLACEHOLDER } from '../utils/productUtils';
import { ShoppingCart } from "lucide-react";
import SafeImage from "./ui/safe-image";

const ProductVerticalCard = ({ product }) => {
  const { discountPrice, discountPercentage, originalPrice } = calculateProductPrice(product);
  const image = getProductImage(product);
  const title = getProductName(product);
  const platformName = getPlatformName(product);
  const typeName = getTypeName(product);
  const hasDiscount = discountPercentage > 0;

  return (
    <Link to={`/product/${product.slug || product._id}`} className="block h-full">
      <Card className="w-full max-w-[382px] h-full flex flex-row items-stretch bg-[#041536] p-3 md:p-4 rounded-21 border-0 text-white font-poppins gap-2 md:gap-2.5 box-border">
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
          <div className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] rounded-2xl shrink-0 bg-gray-700 flex items-center justify-center">
            <ShoppingCart className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
          </div>
        )}
        <div className="flex flex-1 min-w-0 flex-col">
          <CardHeader className="p-0 text-start flex-1">
            <CardTitle className="text-sm font-semibold -tracking-normal truncate">{title}</CardTitle>
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
// Export alias for flexibility
export { ProductVerticalCard as ProductArticleCard };

