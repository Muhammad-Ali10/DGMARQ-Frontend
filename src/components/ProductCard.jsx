import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./ui/card";
import { ShoppingCart } from "lucide-react";
import {
  calculateProductPrice,
  getProductImage,
  getProductName,
  getPlatformName,
  getTypeName,
} from "../utils/productUtils";

const ProductCard = memo(({ product }) => {
  const { discountPrice, discountPercentage, originalPrice } = useMemo(
    () => calculateProductPrice(product),
    [product._id, product.price, product.discount, product.trendingOffer?.discountPercent]
  );
  const image = useMemo(() => getProductImage(product), [product._id, product.images]);
  const title = useMemo(() => getProductName(product), [product._id, product.name]);
  const platformName = useMemo(() => getPlatformName(product), [product._id, product.platform]);
  const typeName = useMemo(() => getTypeName(product), [product._id, product.type]);

  return (
    <Link to={`/product/${product.slug || product._id}`}>
      <Card className="w-full max-w-[196px] mx-auto flex flex-col bg-[#041536] p-3 md:p-4 rounded-21 border-0 text-white font-poppins gap-2.5 box-border hover:scale-105 transition-transform duration-200">
        <div className="relative">
          {image &&
          image !== "https://via.placeholder.com/300x300?text=No+Image" ? (
            <img
              src={image}
              alt={title}
              loading="lazy"
              className="w-full aspect-square object-cover rounded-2xl"
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

        <CardHeader className="p-0">
          <CardTitle className="text-xs md:text-sm font-semibold -tracking-normal truncate">
            {title}
          </CardTitle>
          <p className="text-xs md:text-sm font-normal -tracking-normal">
            Platform: <span className="font-bold">{platformName}</span>
          </p>
          {typeName && (
            <p className="text-xs md:text-sm font-normal -tracking-normal">
              Type: <span className="font-bold">{typeName}</span>
            </p>
          )}
        </CardHeader>
        <CardContent className="flex flex-row justify-between items-center w-full p-0 gap-2">
          <p className="text-xs md:text-sm font-bold truncate">
            {discountPrice.toFixed(2)} &nbsp;
            <span className="font-normal uppercase">USD</span>
          </p>
          {discountPercentage > 0 && (
            <h3
              className={`text-xs md:text-sm font-semibold px-1 py-0.5 rounded-[6px] whitespace-nowrap ${
                product.trendingOffer ? "bg-gradient-to-r from-[#172AA4] to-[#0E9FE2]" : "bg-primary"
              }`}
            >
              {`-${discountPercentage}%`}
            </h3>
          )}
        </CardContent>
        {discountPercentage > 0 && (
          <CardFooter className="p-0">
            <del className="text-xs md:text-sm font-normal uppercase">
              {originalPrice.toFixed(2)} usd
            </del>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}, (prev, next) => prev.product._id === next.product._id && prev.product.price === next.product.price && prev.product.discount === next.product.discount);

export default ProductCard;
