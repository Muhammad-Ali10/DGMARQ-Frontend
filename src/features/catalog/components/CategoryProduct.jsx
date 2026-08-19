import { Link } from 'react-router-dom';
import { Heart, Package } from 'lucide-react';
import { calculateProductPrice, getProductImage, getProductName, getPlatformName, getRegionName, getTypeName, getDeviceName, PRODUCT_IMAGE_PLACEHOLDER } from '../utils/productUtils';
import SafeImage from '@components/ui/safe-image';
import useCurrency from '@hooks/useCurrency';
import RegionBadges from './RegionBadges';
import useWishlist from '../hooks/useWishlist';

const CategoryProduct = ({ product }) => {
  // Get product data using utilities
  const { discountPrice, discountPercentage, originalPrice } = calculateProductPrice(product);
  const image = getProductImage(product);
  const title = getProductName(product);
  const platformName = getPlatformName(product);
  const typeName = getTypeName(product);
  const deviceName = getDeviceName(product);
  const regionName = getRegionName(product);
  const regionText = regionName === 'Global' ? 'Global' : `For ${regionName} Currency only`;
  const stock = product.stock ?? product.availableKeysCount ?? 0;
  const inStock = stock > 0;
  const { format: formatPrice } = useCurrency();
  const offersCount = product.offersCount ?? 0;
  // M9: real region compatibility from the best-offer snapshot (when the
  // endpoint projects it) — replaces the old hardcoded "Can activate" line.
  // Union of all offers' region codes → "can activate" if ANY seller covers the
  // buyer's region (not just the cheapest offer). Price stays the lowest.
  const regionOffer = (product.offerRegionCodes !== undefined || product.bestOfferRegionCodes !== undefined)
    ? {
        regionCodes: product.offerRegionCodes || product.bestOfferRegionCodes || [],
        countries: [],
        excludedCountries: [],
      }
    : null;
  
  // Shared with ProductCard, ProductDetail and the wishlist page. This used to
  // be its own query + two mutations + a loading flag, duplicating the same
  // logic a third time; the hook keeps every heart for a product in agreement.
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
        {/* CLIENT REQ 1 — top-RIGHT of the card. This used to sit in a row of
            its own beneath the region badges, which put the same control in a
            different place depending on whether the listing rendered as a grid
            card or a list row. No dark pill here (unlike the other cards): this
            one sits on a solid surface, not over cover art, so the icon already
            has contrast. */}
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
          {/* pr-10 keeps the price clear of the absolute heart above it. */}
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
              <p className="w-24 text-fg">Region</p>
              <p className="text-fg">{regionText}</p>
            </div>
            <div className="flex">
              <p className="w-24 text-fg">Device</p>
              <p className="text-fg">{deviceName}</p>
            </div>

            <div className="flex items-center">
              <p className="w-24 text-fg">Stock</p>
              <div className="flex items-center gap-1.5">
                <Package className={`size-4 ${inStock ? 'text-[#04CF12]' : 'text-danger'}`} />
                <p className={`text-sm font-medium ${inStock ? 'text-[#04CF12]' : 'text-danger'}`}>
                  {inStock ? `${stock} in stock` : 'Out of stock'}
                </p>
                <span className="ml-2 text-xs text-fg/60">
                  {offersCount} {offersCount === 1 ? 'offer' : 'offers'}
                </span>
              </div>
            </div>

            {/* M9: real blue/red region compatibility (replaces the old
                hardcoded "Can activate in …" line) */}
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
