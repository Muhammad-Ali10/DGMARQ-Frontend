import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { ShoppingCart } from 'lucide-react';
import { calculateProductPrice, getProductImage, getProductName, getPlatformName, getRegionName } from '../utils/productUtils';

const ProductCard = ({ product }) => {
  const { discountPrice, discountPercentage, originalPrice } = calculateProductPrice(product);
  const image = getProductImage(product);
  const title = getProductName(product);
  const platformName = getPlatformName(product);
  const regionName = getRegionName(product);

  return (
    <Link to={`/product/${product.slug || product._id}`}>
      <Card className="w-full max-w-[196px] mx-auto flex flex-col bg-[#041536] p-3 md:p-4 rounded-21 border-0 text-white font-poppins gap-2.5 box-border hover:scale-105 transition-transform duration-200">
        {image && image !== 'https://via.placeholder.com/300x300?text=No+Image' ? (
          <img 
            src={image} 
            alt={title}
            className="w-full aspect-square object-cover rounded-2xl" 
          />
        ) : (
          <div className="w-full aspect-square rounded-2xl bg-gray-700 flex items-center justify-center">
            <ShoppingCart className="h-8 w-8 md:h-12 md:w-12 text-gray-400" />
          </div>
        )}

        <CardHeader className="p-0">
          <CardTitle className="text-xs md:text-sm font-semibold -tracking-normal truncate">{title}</CardTitle>
          <span className="text-xs md:text-sm font-normal -tracking-normal">{platformName}</span>
          {product.region && (
            <p className="text-xs md:text-sm font-normal -tracking-normal">Key <span className="font-bold">{regionName}</span></p>
          )}
        </CardHeader>
        <CardContent className="flex flex-row justify-between items-center w-full p-0 gap-2">
          <p className="text-xs md:text-sm font-bold truncate">{discountPrice.toFixed(2)} &nbsp;<span className="font-normal uppercase">USD</span></p>
          {discountPercentage > 0 && (
            <h3 className={`text-xs md:text-sm font-semibold px-1 py-0.5 rounded-[6px] whitespace-nowrap ${
              product.trendingOffer ? 'bg-red-600' : 'bg-primary'
            }`}>
              {product.trendingOffer ? '🔥' : ''}-{discountPercentage}% OFF
            </h3>
          )}
        </CardContent>
        {(discountPercentage > 0) && (
          <CardFooter className="p-0">
            <del className="text-xs md:text-sm font-normal uppercase">{originalPrice.toFixed(2)} usd</del>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
};

export default ProductCard;

