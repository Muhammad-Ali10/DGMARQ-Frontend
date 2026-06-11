import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { reviewAPI, sellerAPI, productAPI } from '../../services/api';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Star, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { showSuccess, showApiError } from '../../utils/toast';

const SellerReviews = () => {
  const { user } = useSelector((state) => state.auth);
  const [page, setPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const queryClient = useQueryClient();

  // Get seller info to get seller ID
  const { data: sellerInfo, isLoading: sellerInfoLoading } = useQuery({
    queryKey: ['seller-info'],
    queryFn: () => sellerAPI.getSellerInfo().then(res => res.data.data),
  });

  // Server-paginated page of the SELLER'S OWN products. The public reviews
  // endpoint (/review/get-reviews) only filters by a single productId and has
  // no sellerId filter, so we paginate the seller's products server-side
  // (8 per page) and then pull each product's reviews server-side below.
  // This removes the previous limit:1000 product + limit:1000 review fetches.
  const PRODUCTS_PER_PAGE = 8;
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['seller-products-for-reviews', page],
    queryFn: async () => {
      const response = await productAPI.getProducts({
        mine: true,
        page,
        limit: PRODUCTS_PER_PAGE,
      });
      return response.data.data;
    },
    enabled: !!sellerInfo,
    placeholderData: keepPreviousData,
  });

  const pageProducts = productsData?.docs || productsData?.products || [];
  const productTotalPages = productsData?.totalPages || 0;

  // Fetch reviews server-side for just the products on the current page, then
  // flatten + enrich them with product info for display.
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['seller-reviews', page, sellerInfo?._id, pageProducts.map((p) => p._id)],
    queryFn: async () => {
      const productMap = new Map();
      pageProducts.forEach((product) => {
        if (product._id) productMap.set(product._id.toString(), product);
      });

      const perProductLimit = 100;
      const responses = await Promise.all(
        pageProducts.map((product) =>
          reviewAPI
            .getReviews({ productId: product._id, page: 1, limit: perProductLimit })
            .then((res) => res.data.data)
            .catch(() => null),
        ),
      );

      const enrichedReviews = [];
      responses.forEach((data) => {
        if (!data) return;
        const list = data.reviews || data.docs || [];
        list.forEach((review) => {
          let productId = null;
          if (review.productId) {
            if (typeof review.productId === 'object' && review.productId._id) {
              productId = review.productId._id.toString();
            } else if (typeof review.productId === 'object' && review.productId.toString) {
              productId = review.productId.toString();
            } else if (typeof review.productId === 'string') {
              productId = review.productId;
            }
          }
          const product = productId ? productMap.get(productId) : null;
          enrichedReviews.push({
            ...review,
            productId: productId
              ? { _id: productId, name: product?.name, slug: product?.slug, images: product?.images }
              : review.productId,
          });
        });
      });

      // Newest first across all products on this page.
      enrichedReviews.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );

      return {
        reviews: enrichedReviews,
        pagination: {
          page,
          total: enrichedReviews.length,
          totalPages: productTotalPages,
          hasNextPage: page < productTotalPages,
          hasPrevPage: page > 1,
        },
      };
    },
    enabled: !!sellerInfo && !!productsData,
    placeholderData: keepPreviousData,
  });

  const replyMutation = useMutation({
    mutationFn: ({ reviewId, data }) => reviewAPI.replyToReview(reviewId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-reviews'] });
      setReplyText('');
      setSelectedReview(null);
      showSuccess('Reply posted successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to post reply');
    },
  });

  const handleReply = (review) => {
    setSelectedReview(review);
    setReplyText('');
  };

  const handleSubmitReply = () => {
    if (!replyText.trim() || !selectedReview) return;
    replyMutation.mutate({
      reviewId: selectedReview._id,
      data: { replyText: replyText.trim() },
    });
  };

  if (isLoading || sellerInfoLoading || productsLoading || !sellerInfo || !productsData) {
    return <Loading message="Loading reviews..." />;
  }

  const reviews = reviewsData?.reviews || [];
  const pagination = reviewsData?.pagination || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Product Reviews</h1>
        <p className="text-gray-400 mt-1">Manage and reply to customer reviews</p>
      </div>

      {reviews.length === 0 ? (
        <Card className="bg-primary border-gray-700">
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No reviews yet</p>
            <p className="text-gray-500 text-sm mt-2">Customer reviews will appear here</p>
          </CardContent>
        </Card>
      ) : null}

      {reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review._id} className="bg-primary border-gray-700">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-semibold text-lg">
                        {review.productId?.name || review.product?.name || 'Product'}
                      </h3>
                      <Badge variant="outline" className="border-gray-700 text-gray-300">
                        {review.isVerifiedPurchase ? 'Verified Purchase' : 'Review'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
                          }`}
                        />
                      ))}
                      <span className="text-gray-400 text-sm ml-2">({review.rating}/5)</span>
                    </div>
                    <p className="text-gray-300 mb-3">{review.comment}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{review.userId?.name || 'Customer'}</span>
                      <span>•</span>
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    {review.replies && review.replies.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-sm text-gray-400 mb-2">Your Reply:</p>
                        <p className="text-gray-300 text-sm">{review.replies[0].replyText}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(review.replies[0].createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                  {(!review.replies || review.replies.length === 0) && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReply(review)}
                          className="border-gray-700 text-gray-300"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Reply
                        </Button>
                      </DialogTrigger>
                      <DialogContent size="sm" className="bg-primary border-gray-700">
                        <DialogHeader>
                          <DialogTitle className="text-white">Reply to Review</DialogTitle>
                          <DialogDescription className="text-gray-400">
                            Respond to this customer review
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="p-4 bg-secondary rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-gray-300 text-sm">{review.comment}</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="replyText" className="text-gray-300">Your Reply</Label>
                            <textarea
                              id="replyText"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
                              rows={4}
                              placeholder="Write your reply..."
                              required
                            />
                          </div>
                          <Button
                            onClick={handleSubmitReply}
                            disabled={replyMutation.isPending || !replyText.trim()}
                            className="w-full bg-accent hover:bg-blue-700"
                          >
                            {replyMutation.isPending ? 'Posting...' : 'Post Reply'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(pagination.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-400">
            Page {page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-gray-700 text-gray-300"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="border-gray-700 text-gray-300"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerReviews;

