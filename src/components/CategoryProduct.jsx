import { Link } from 'react-router-dom';
import { CircleCheck, Heart } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { userAPI } from '../services/api';
import { calculateProductPrice, getProductImage, getProductName, getPlatformName, getRegionName, getTypeName } from '../utils/productUtils';

const CategoryProduct = ({ product }) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  // Get product data using utilities
  const { originalPrice } = calculateProductPrice(product);
  const image = getProductImage(product);
  const title = getProductName(product);
  const platformName = getPlatformName(product);
  const typeName = getTypeName(product);
  const regionName = getRegionName(product);
  const regionText = regionName === 'Global' ? 'Global' : `For ${regionName} Currency only`;
  
  // Check if product is in wishlist (only if authenticated)
  const { data: wishlist } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      try {
        const response = await userAPI.getWishlist();
        return response.data.data;
      } catch (error) {
        // User not logged in or wishlist not available
        return null;
      }
    },
    retry: false,
    enabled: isAuthenticated, // Only fetch if user is authenticated
  });

  const wishlistItems = wishlist?.products || wishlist?.items || [];
  const isInWishlist = wishlistItems.some(
    item => {
      const productId = item.productId?._id || item.productId || item._id;
      return productId === product._id || 
             (item.productId?.slug || item.slug) === product.slug;
    }
  );

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: (productId) => userAPI.addToWishlist({ productId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      queryClient.invalidateQueries(['wishlist-count']);
    },
  });

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: (productId) => userAPI.removeFromWishlist({ productId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      queryClient.invalidateQueries(['wishlist-count']);
    },
  });

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isWishlistLoading) return;
    
    setIsWishlistLoading(true);
    
    try {
      if (isInWishlist) {
        await removeFromWishlistMutation.mutateAsync(product._id);
      } else {
        await addToWishlistMutation.mutateAsync(product._id);
      }
    } catch (error) {
      // Handle error silently (user might not be logged in)
      // Error is already handled by React Query
    } finally {
      setIsWishlistLoading(false);
    }
  };

  // Determine activation availability (can be enhanced based on product data)
  const canActivate = true; // Default to true, can be enhanced with actual product data
  const activationText = `Can activate in ${regionName}`;

  // Check if product is sponsored (can be enhanced with actual product data)
  const isSponsored = product.isFeatured || false;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-center justify-center gap-2.5 p-4 bg-blue-4 rounded-21 max-w-[875px] w-full">
        <div className="w-full md:w-[174px] md:h-[240px]">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover rounded-21" 
          />
        </div>
        <div className="flex flex-col flex-1">
          <h2 className="text-xl md:text-3xl font-semibold text-white flex justify-between w-full">
            <Link 
              to={`/product/${product.slug || product._id}`}
              className="hover:underline flex-1"
            >
              {title}
            </Link>
            <span className="ml-4">{originalPrice.toFixed(2)} USD</span>
          </h2>

          <div className="flex flex-col gap-4">
            <div className="flex">
              <p className="w-24 text-white">Platform</p>
              <p className="text-white">{platformName}</p>
            </div>

            <div className="flex">
              <p className="w-24 text-white">Type</p>
              <p className="text-white uppercase">{typeName}</p>
            </div>

            <div className="flex">
              <p className="w-24 text-white">Region</p>
              <p className="text-white">{regionText}</p>
            </div>

            {canActivate && (
              <div className="flex gap-2.5">
                <CircleCheck className="text-[#04CF12]" />
                <p className="text-[#04CF12] text-sm">
                  {activationText}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between w-full">
            {isSponsored && (
              <p className="text-sm font-bold text-white">SPONSORED</p>
            )}
            {!isSponsored && <div></div>}
            <button
              onClick={handleWishlistClick}
              disabled={isWishlistLoading}
              className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart 
                className={`text-white size-6 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryProduct;
