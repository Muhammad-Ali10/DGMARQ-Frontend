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
          <p className="text-gray-400 mt-1">Save more when you buy together</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bundleDeals.map((bundle) => {
          const priceInfo = calculateBundlePrice(bundle);

          return (
            <Card key={bundle._id} className="bg-primary border-gray-700 overflow-hidden hover:border-accent transition-colors">
              {/* Banner Image */}
              <div className="relative w-full h-48 bg-secondary/30">
                {bundle.bannerImage ? (
                  <img
                    src={bundle.bannerImage}
                    alt={bundle.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-500" />
                  </div>
                )}
                {/* Discount Badge */}
                <div className="absolute top-4 right-4">
                  <Badge variant="destructive" className="text-lg px-3 py-1">
                    {bundle.discountType === 'percentage' ? `${bundle.discountValue}% OFF` : `$${bundle.discountValue} OFF`}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6">
                {/* Bundle Title */}
                <h3 className="text-xl font-bold text-white mb-4">{bundle.title}</h3>

                {/* Products */}
                <div className="space-y-3 mb-4">
                  {bundle.products?.slice(0, 2).map((product) => (
                    <div key={product._id || product} className="flex items-center gap-3">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg border border-gray-700"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-secondary/50 rounded-lg border border-gray-700 flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-white text-sm">{product.name || product}</div>
                        <div className="text-sm text-gray-400">${product.price?.toFixed(2) || '0.00'}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="border-t border-gray-700 pt-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Original Price:</span>
                    <span className="text-gray-400 line-through">${priceInfo.original.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Discount:</span>
                    <span className="text-green-400 font-semibold">-${priceInfo.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">Final Price:</span>
                    <span className="text-white text-xl font-bold">${priceInfo.final.toFixed(2)}</span>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <Button
                  className="w-full"
                  onClick={() => handleAddToCart(bundle)}
                  disabled={addBundleMutation.isPending}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {addBundleMutation.isPending ? 'Adding...' : 'Add Bundle to Cart'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default BundleDealsSection;

