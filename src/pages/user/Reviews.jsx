import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI, reviewAPI } from '@services/api';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent } from '@components/ui/card';
import { EmptyState } from '@components/common/EmptyState';
import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Skeleton } from '@components/ui/skeleton';
import { Textarea } from '@components/ui/textarea';
import { ErrorState } from '@components/common/ErrorState';
import { Star, Edit, Trash2 } from 'lucide-react';
import { showSuccess, showApiError } from '@utils/toast';
import { Pagination } from '@components/common/Pagination';
import SafeImage from '@components/ui/safe-image';

const UserReviews = () => {
  const { user } = useSelector((state) => state.auth);
  const [page, setPage] = useState(1);
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const queryClient = useQueryClient();

  const { data: reviewsData, isLoading, isError } = useQuery({
    queryKey: ['user-reviews', page, user?._id],
    queryFn: async () => {
      try {
        const response = await reviewAPI.getReviews({ page, limit: 50 });
        const allReviews = response.data.data;
        // Handle different response structures
        const reviews = allReviews?.reviews || allReviews?.docs || allReviews || [];
        
        // Filter reviews by current user
        if (user?._id && Array.isArray(reviews)) {
          const userReviews = reviews.filter(review => {
            const reviewUserId = review.userId?._id || review.userId || review.user?._id;
            return reviewUserId?.toString() === user._id.toString();
          });
          
          return {
            reviews: userReviews,
            pagination: allReviews?.pagination || {
              page: 1,
              totalPages: 1,
              total: userReviews.length,
            },
          };
        }
        
        return {
          reviews: Array.isArray(reviews) ? reviews : [],
          pagination: allReviews?.pagination || {
            page: 1,
            totalPages: 1,
            total: 0,
          },
        };
      } catch {
        return {
          reviews: [],
          pagination: {
            page: 1,
            totalPages: 1,
            total: 0,
          },
        };
      }
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: ({ reviewId, data }) => userAPI.updateReview(reviewId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-reviews'] });
      setEditingReview(null);
      setEditRating(5);
      setEditComment('');
      showSuccess('Review updated successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to update review');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId) => userAPI.deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-reviews'] });
      showSuccess('Review deleted successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to delete review');
    },
  });

  const addPhotoMutation = useMutation({
    mutationFn: ({ reviewId, formData }) => reviewAPI.addReviewPhoto(reviewId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-reviews'] });
      showSuccess('Photo added successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to add photo');
    },
  });

  const handleUpdate = (review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const handleSaveUpdate = () => {
    if (editingReview) {
      updateMutation.mutate({
        reviewId: editingReview._id,
        data: { rating: editRating, comment: editComment },
      });
    }
  };

  const handleDelete = (reviewId) => {
      deleteMutation.mutate(reviewId);
  };

  const handleAddPhoto = (reviewId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    addPhotoMutation.mutate({ reviewId, formData });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }
  if (isError) {
    return (
      <ErrorState
        title="Couldn't load your reviews"
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['user-reviews'] })}
      />
    );
  }

  const reviews = reviewsData?.reviews || [];
  const pagination = reviewsData?.pagination || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-fg">My Reviews</h1>
        <p className="text-fg-muted mt-1">Manage your product reviews</p>
      </div>

      {reviews.length === 0 ? (
        <Card variant="hud">
          <CardContent className="text-center">
            <EmptyState
              icon={Star}
              title="No reviews yet"
              description="Your reviews will appear here after you purchase and review products"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review._id} variant="hud">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-fg font-semibold text-lg mb-2">
                      {review.productId?.name || review.product?.name || 'Product'}
                    </h3>
                    <div className="flex items-center space-x-2 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < review.rating ? 'text-warning fill-warning' : 'text-fg-subtle'
                          }`}
                        />
                      ))}
                      <span className="text-fg-muted text-sm ml-2">({review.rating}/5)</span>
                    </div>
                    <p className="text-fg-muted mb-3">{review.comment}</p>
                    {review.photos && review.photos.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {review.photos.map((photo, idx) => (
                          <SafeImage
                            key={idx}
                            src={photo}
                            alt={`Review photo ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-fg-subtle">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                    {review.replies && review.replies.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-brand-cyan/10">
                        <p className="text-sm text-fg-muted mb-2">Seller Reply:</p>
                        <p className="text-fg-muted text-sm">{review.replies[0].replyText}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdate(review)}
                          className="border-border text-fg-muted"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent size="sm" variant="hud">
                        <DialogHeader>
                          <DialogTitle className="text-fg">Edit Review</DialogTitle>
                          <DialogDescription className="text-fg-muted">
                            Update your review rating and comment
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <p className="text-sm text-fg-muted" id={`rating-label-${review._id}`}>
                              Rating
                            </p>
                            <div
                              className="flex gap-1"
                              role="radiogroup"
                              aria-labelledby={`rating-label-${review._id}`}
                            >
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                  key={rating}
                                  type="button"
                                  role="radio"
                                  aria-checked={editRating === rating}
                                  aria-label={`${rating} star${rating === 1 ? '' : 's'}`}
                                  onClick={() => setEditRating(rating)}
                                  className={`rounded p-2 outline-none transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring ${
                                    editRating >= rating ? 'text-warning' : 'text-fg-subtle'
                                  }`}
                                >
                                  <Star
                                    aria-hidden="true"
                                    className={`size-6 ${editRating >= rating ? 'fill-warning' : ''}`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editComment" className="text-fg-muted">Comment</Label>
                            <Textarea
                              id="editComment"
                              value={editComment}
                              onChange={(e) => setEditComment(e.target.value)}
                              rows={4}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="reviewPhoto" className="text-fg-muted">Add Photo</Label>
                            <Input
                              id="reviewPhoto"
                              type="file"
                              accept="image/*"
                              aria-label="Attach a photo to this review"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) handleAddPhoto(review._id, file);
                              }}
                              className="bg-secondary"
                            />
                          </div>
                          <Button
                            onClick={handleSaveUpdate}
                            disabled={updateMutation.isPending}
                            className="w-full "
                          >
                            {updateMutation.isPending ? 'Updating...' : 'Update Review'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(review._id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
};

export default UserReviews;

