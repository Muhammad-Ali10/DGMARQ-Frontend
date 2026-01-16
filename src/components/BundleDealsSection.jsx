import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bundleDealAPI, cartAPI } from '../services/api';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Loading } from './ui/loading';
import { ShoppingCart, Package, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Bundle Deals Section Component
 * Displays active bundle deals on the home page
 * Can be integrated into any user-facing page
 */
const BundleDealsSection = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const { data: bundleDeals, isLoading, isError } = useQuery({
    queryKey: ['active-bundle-deals'],
    queryFn: async () => {
      try {
        const response = await bundleDealAPI.getActiveBundleDeals();
        return response.data.data || [];
      } catch (err) {
        console.error('Bundle deals error:', err);
        return [];
      }
    },
    retry: 1,
  });

  const addBundleMutation = useMutation({
    mutationFn: (bundleDealId) => cartAPI.addBundle({ bundleDealId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      toast.success('Bundle added to cart successfully!');
    },
    onError: (err) => {
      if (err?.response?.status === 401) {
        toast.error('Please login to add items to cart');
        navigate('/login');
      } else {
        toast.error(err?.response?.data?.message || 'Failed to add bundle to cart');
      }
    },
  });

  const handleAddToCart = (bundleDeal) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    addBundleMutation.mutate(bundleDeal._id);
  };

  const calculateBundlePrice = (bundle) => {
    if (!bundle.products || bundle.products.length !== 2) return { original: 0, discount: 0, final: 0 };

    const totalPrice = bundle.products.reduce((sum, product) => {
      return sum + (product.price || 0);
    }, 0);

    let discountAmount = 0;
    if (bundle.discountType === 'percentage') {
      discountAmount = (totalPrice * bundle.discountValue) / 100;
    } else {
      discountAmount = bundle.discountValue;
    }

    const finalPrice = totalPrice - discountAmount;

    return {
      original: totalPrice,
      discount: discountAmount,
      final: finalPrice > 0 ? finalPrice : 0,
    };
  };

  if (isLoading) {
    return <Loading message="Loading bundle deals..." />;
  }

  if (isError || !bundleDeals || bundleDeals.length === 0) {
    return null; // Don't show section if no bundle deals
  }

  return (
    <section className="space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Exclusive Bundle Deals</h2>
          <p className="text-gray-400 mt-1">Add Some Funds In A Flash And Enjoy New Games, DLC, And More!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {bundleDeals.map((bundle) => {
          const priceInfo = calculateBundlePrice(bundle);
          const products = bundle.products?.slice(0, 2) || [];
          
          if (products.length !== 2) return null;

          return (
            <Card key={bundle._id} className="bg-[#07142E] border-gray-700 overflow-hidden hover:border-accent transition-colors">
              <CardContent className="p-6">
                {/* Bundle Layout: Product + Product = Price Card */}
                <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6">
                  {/* First Product Card */}
                  <div className="flex-shrink-0 w-full sm:w-auto">
                    <div className="bg-primary border border-gray-700 rounded-lg p-4 w-full sm:w-[280px]">
                      {products[0]?.images?.[0] ? (
                        <img
                          src={products[0].images[0]}
                          alt={products[0].name}
                          className="w-full h-48 object-cover rounded-lg mb-3"
                        />
                      ) : (
                        <div className="w-full h-48 bg-secondary/50 rounded-lg border border-gray-700 flex items-center justify-center mb-3">
                          <Package className="w-16 h-16 text-gray-500" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="font-medium text-white text-sm line-clamp-2">{products[0].name}</div>
                        <div className="text-xs text-gray-400">{products[0].platform?.name || 'Microsoft Store'}</div>
                        <div className="text-xs text-gray-400">Key GLOBAL</div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-white font-semibold">${products[0].price?.toFixed(2) || '0.00'}</span>
                          {products[0].price && products[0].originalPrice && products[0].originalPrice > products[0].price && (
                            <span className="text-gray-400 line-through text-xs">
                              ${products[0].originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {bundle.discountType === 'percentage' && bundle.discountValue && (
                          <Badge className="bg-blue-600 text-white text-xs mt-1">
                            -{bundle.discountValue}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Plus Sign */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                      <span className="text-black font-bold text-xl">+</span>
                    </div>
                  </div>

                  {/* Second Product Card */}
                  <div className="flex-shrink-0 w-full sm:w-auto">
                    <div className="bg-primary border border-gray-700 rounded-lg p-4 w-full sm:w-[280px]">
                      {products[1]?.images?.[0] ? (
                        <img
                          src={products[1].images[0]}
                          alt={products[1].name}
                          className="w-full h-48 object-cover rounded-lg mb-3"
                        />
                      ) : (
                        <div className="w-full h-48 bg-secondary/50 rounded-lg border border-gray-700 flex items-center justify-center mb-3">
                          <Package className="w-16 h-16 text-gray-500" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="font-medium text-white text-sm line-clamp-2">{products[1].name}</div>
                        <div className="text-xs text-gray-400">{products[1].platform?.name || 'Microsoft Store'}</div>
                        <div className="text-xs text-gray-400">Key GLOBAL</div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-white font-semibold">${products[1].price?.toFixed(2) || '0.00'}</span>
                          {products[1].price && products[1].originalPrice && products[1].originalPrice > products[1].price && (
                            <span className="text-gray-400 line-through text-xs">
                              ${products[1].originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {bundle.discountType === 'percentage' && bundle.discountValue && (
                          <Badge className="bg-blue-600 text-white text-xs mt-1">
                            -{bundle.discountValue}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Equals Sign */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                      <span className="text-black font-bold text-xl">=</span>
                    </div>
                  </div>

                  {/* Price Card */}
                  <div className="flex-shrink-0 w-full sm:w-auto">
                    <div className="bg-[#07142E] border-2 border-accent rounded-lg p-6 w-full sm:w-[280px] text-center">
                      <div className="text-gray-400 text-sm mb-2">Price</div>
                      <div className="text-white text-3xl font-bold mb-2">
                        ${priceInfo.final.toFixed(2)}
                      </div>
                      <div className="text-gray-400 text-sm mb-4">
                        You Save: ${priceInfo.discount.toFixed(2)}
                      </div>
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleAddToCart(bundle)}
                        disabled={addBundleMutation.isPending}
                      >
                        {addBundleMutation.isPending ? 'Adding...' : 'Add To Cart'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default BundleDealsSection;

