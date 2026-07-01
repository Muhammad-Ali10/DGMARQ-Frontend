import { memo } from "react";
import { Link } from "react-router-dom";
import SafeImage from "@components/ui/safe-image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@components/ui/card";
import { ShoppingCart } from "lucide-react";
import { cn } from "@lib/utils";
import {
  calculateProductPrice,
  getProductImage,
  getProductName,
  getPlatformName,
  PRODUCT_IMAGE_PLACEHOLDER,
  getTypeName,
} from "../utils/productUtils";
  
const ProductCard = memo(({ product }) => {
  const { discountPrice, discountPercentage, originalPrice } =
    calculateProductPrice(product);
  const image = getProductImage(product);
  const title = getProductName(product);
  const platformName = getPlatformName(product);
  const typeName = getTypeName(product);
  const hasDiscount = discountPercentage > 0;

  return ( 
    <Link
      to={`/product/${product.slug || product._id}`}
      className="block h-full"
    >
      <Card className="w-full max-w-[196px] mx-auto h-full flex flex-col bg-[#041536] p-3 md:p-4 rounded-21 border-0 text-white font-poppins gap-2.5 box-border hover:scale-105 transition-transform duration-200">
        <div className="relative">
          {image &&
          image !== PRODUCT_IMAGE_PLACEHOLDER ? (
            <SafeImage
              src={image}
              alt={title}
              loading="lazy"
              width={300}
              height={300}
              className="w-full aspect-square object-cover rounded-2xl"
              fallbackSrc={PRODUCT_IMAGE_PLACEHOLDER}
            />
          ) : (
            <div className="w-full aspect-square rounded-2xl bg-gray-700 flex items-center justify-center">
              <ShoppingCart className="h-8 w-8 md:h-12 md:w-12 text-gray-400" />
            </div>
          )}
          {product.isFeatured && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-yellow-500 text-[10px] md:text-xs font-semibold text-black shadow-sm">
              Featured
            </span>
          )}
        </div>

        <CardHeader className="p-0 flex-1 min-h-0">
          <CardTitle className="text-xs md:text-sm font-semibold -tracking-normal truncate">
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
        </CardHeader>

        <div className="mt-auto shrink-0 w-full">
          <CardContent className="flex flex-row justify-between items-center w-full p-0 gap-2 min-h-[1.5rem] md:min-h-[1.625rem]">
            <p className="text-xs md:text-sm font-bold truncate">
              {discountPrice.toFixed(2)} &nbsp;
              <span className="font-normal uppercase">USD</span>
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
                "text-xs md:text-sm font-normal uppercase leading-none",
                !hasDiscount && "invisible"
              )}
              aria-hidden={!hasDiscount}
            >
              {(hasDiscount ? originalPrice : 0).toFixed(2)} usd
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
  prev.product.trendingOffer?.discountPercent === next.product.trendingOffer?.discountPercent &&
  prev.product.trendingOffer?.offerId === next.product.trendingOffer?.offerId
);

export default ProductCard;
