import { Link } from 'react-router-dom';
import { Heart, Package } from 'lucide-react';
import { calculateProductPrice, getProductImage, getProductName, getPlatformName, getTypeName, getDeviceName, getCardRegionOffer, PRODUCT_IMAGE_PLACEHOLDER } from '../utils/productUtils';
import SafeImage from '@components/ui/safe-image';
import useCurrency from '@hooks/useCurrency';
import RegionBadges from './RegionBadges';
import { PreorderBadge, isActivePreorder as isUnreleasedPreorder } from '@components/common/PreorderBadge';
import useWishlist from '../hooks/useWishlist';

const CategoryProduct = ({ product }) => {
  const { discountPrice, discountPercentage, originalPrice } = calculateProductPrice(product);
  const image = getProductImage(product);
  const title = getProductName(product);
  const platformName = getPlatformName(product);
  const typeName = getTypeName(product);
  const deviceName = getDeviceName(product);
  const stock = product.stock ?? product.availableKeysCount ?? 0;
  const inStock = stock > 0;
  const preorder = isUnreleasedPreorder(product);
  const { format: formatPrice } = useCurrency();
  const offersCount = product.offersCount ?? 0;
  const regionOffer = getCardRegionOffer(product);
  
  const { isWishlisted, toggle } = useWishlist();
  const isInWishlist = isWishlisted(product._id);

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product._id);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="relative flex flex-col md:flex-row items-center justify-center gap-2.5 p-4 bg-surface-base rounded-2xl max-w-[875px] w-full">
        <button
          type="button"
          onClick={handleWishlistClick}
          aria-pressed={isInWishlist}
          aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-3 right-3 z-10 cursor-pointer rounded-full p-1 transition-colors hover:bg-fg/10"
        >
          <Heart
            className={`text-fg size-6 ${isInWishlist ? 'fill-red-500 text-danger' : ''}`}
          />
        </button>
        <div className="w-full md:w-[174px] md:h-[240px]">
          <SafeImage 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover rounded-2xl" 
            fallbackSrc={PRODUCT_IMAGE_PLACEHOLDER}
          />
        </div>
        <div className="flex flex-col flex-1">
          <h2 className="text-xl md:text-3xl font-semibold text-fg flex flex-wrap items-center justify-between w-full mb-4 gap-2 pr-10">
            <Link 
              to={`/product/${product.slug || product._id}`}
              className="hover:underline flex-1 min-w-[200px]"
            >
              {title}
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span>{formatPrice(discountPrice)}</span>
                {discountPercentage > 0 && (
                  <del className="text-sm md:text-base font-normal text-fg-muted">
                    {formatPrice(originalPrice)}
                  </del>
                )}
              </div>
              {discountPercentage > 0 && (
                <span className="text-xs md:text-sm font-semibold px-2 py-1 rounded-md bg-gradient-to-r from-[#172AA4] to-[#0E9FE2]">
                  -{discountPercentage.toFixed(0)}%
                </span>
              )}
            </div>
          </h2>

          <PreorderBadge product={product} className="mb-4 w-fit" />

          <div className="flex flex-col gap-4">
            <div className="flex">
              <p className="w-24 text-fg">Platform:</p>
              <p className="text-fg">{platformName}</p>
            </div>

            <div className="flex">
              <p className="w-24 text-fg">Type:</p>
              <p className="text-fg">{typeName}</p>
            </div>

            <div className="flex">
              <p className="w-24 text-fg">Device</p>
              <p className="text-fg">{deviceName}</p>
            </div>

            <div className="flex items-center">
              <p className="w-24 text-fg">Stock</p>
              <div className="flex items-center gap-1.5">
                <Package className={`size-4 ${preorder ? 'text-warning' : inStock ? 'text-[#04CF12]' : 'text-danger'}`} />
                <p className={`text-sm font-medium ${preorder ? 'text-warning' : inStock ? 'text-[#04CF12]' : 'text-danger'}`}>
                  {preorder ? 'Delivered on release' : inStock ? `${stock} in stock` : 'Out of stock'}
                </p>
                <span className="ml-2 text-xs text-fg/60">
                  {offersCount} {offersCount === 1 ? 'offer' : 'offers'}
                </span>
              </div>
            </div>

            {regionOffer && (
              <div className="flex">
                <RegionBadges offer={regionOffer} showWarning />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default CategoryProduct;
