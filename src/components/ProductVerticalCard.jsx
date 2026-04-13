import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { calculateProductPrice, getProductImage, getProductName, getPlatformName, getTypeName, PRODUCT_IMAGE_PLACEHOLDER } from '../utils/productUtils';
import { ShoppingCart } from "lucide-react";
import SafeImage from "./ui/safe-image";

const ProductVerticalCard = ({ product }) => {
  const { discountPrice, discountPercentage, originalPrice } = calculateProductPrice(product);
  const image = getProductImage(product);
  const title = getProductName(product);
  const platformName = getPlatformName(product);
  const typeName = getTypeName(product);
  return (
    <Link to={`/product/${product.slug || product._id}`}>
      <Card className="w-full max-w-[382px] flex flex-row items-start md:items-center bg-[#041536] p-3 md:p-4 rounded-21 border-0 text-white font-poppins gap-2 md:gap-2.5 box-border">
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
        <div className="flex-1 min-w-0">
          <CardHeader className="p-0 text-start">
            <CardTitle className="text-sm font-semibold -tracking-normal truncate">{title}</CardTitle>
            <p className="text-sm font-normal -tracking-normal">Platform: <span className="font-bold">{platformName}</span></p>
            <p className="text-sm font-normal -tracking-normal">Type: <span className="font-bold">{typeName}</span></p>
          </CardHeader>

          <CardContent className="flex flex-row justify-between items-center w-full p-0 mt-1">
            <p className="text-sm font-bold">{discountPrice.toFixed(2)} &nbsp;<span className="font-normal uppercase">USD</span></p>
            {discountPercentage > 0 && (
              <h3 className="text-sm font-semibold px-1 py-0.5 bg-primary rounded-[6px] bg-gradient-to-r from-[#172AA4] to-[#0E9FE2]">-{discountPercentage.toFixed(0)}%</h3>
            )}
          </CardContent>
          {discountPercentage > 0 && (
            <CardFooter className="p-0 mt-1">
              <del className="text-sm font-normal uppercase">{originalPrice.toFixed(2)} usd</del>
            </CardFooter>
          )}
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

