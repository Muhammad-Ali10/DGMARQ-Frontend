import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewAPI } from '@services/api';
import { useState } from 'react';
import { Card, CardContent } from '@components/ui/card';
import { EmptyState } from '@components/common/EmptyState';
import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Skeleton } from '@components/ui/skeleton';
import { Textarea } from '@components/ui/textarea';
import { ErrorState } from '@components/common/ErrorState';
import { ConfirmationModal } from '@components/common/ConfirmationModal';
import { Star, Edit, Trash2, X } from 'lucide-react';
import { showSuccess, showApiError } from '@utils/toast';
import { Pagination } from '@components/common/Pagination';
import SafeImage from '@components/ui/safe-image';

const MAX_REVIEW_PHOTOS = 5;

const UserReviews = () => {
  const [page, setPage] = useState(1);
  const [editingReview, setEditingReview] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const queryClient = useQueryClient();

  const { data: reviewsData, isLoading, isError } = useQuery({
    queryKey: ['my-reviews', page],
    queryFn: async () => (await reviewAPI.getMyReviews({ page, limit: 10 })).data.data,
  });

  const refreshAfterReviewChange = () => {
    queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
    queryClient.invalidateQueries({ queryKey: ['product-reviews'] });
    queryClient.invalidateQueries({ queryKey: ['product-detail'] });
  };

  const updateMutation = useMutation({
    mutationFn: ({ reviewId, data }) => reviewAPI.updateReview(reviewId, data),
    onSuccess: () => {
      refreshAfterReviewChange();
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
    mutationFn: (reviewId) => reviewAPI.deleteReview(reviewId),
    onSuccess: () => {
      refreshAfterReviewChange();
      showSuccess('Review deleted successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to delete review');
    },
  });

  const addPhotoMutation = useMutation({
    mutationFn: ({ reviewId, formData }) => reviewAPI.addReviewPhoto(reviewId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
      showSuccess('Photo added successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to add photo');
    },
  });

  const removePhotoMutation = useMutation({
    mutationFn: ({ reviewId, photoId }) => reviewAPI.deleteReviewPhoto(reviewId, photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
      showSuccess('Photo removed');
    },
    onError: (error) => {
      showApiError(error, 'Failed to remove photo');
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
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['my-reviews'] })}
      />
    );
  }

  const reviews = reviewsData?.docs || [];
  const closeEditor = (open) => {
    if (!open) setEditingReview(null);
  };

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
                      {review.product?.name || 'Product'}
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
                            key={photo._id}
                            src={photo.imageUrl}
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdate(review)}
                      className="border-border text-fg-muted"
                      aria-label="Edit review"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Dialog open={editingReview?._id === review._id} onOpenChange={closeEditor}>
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
                              minLength={10}
                              maxLength={1000}
                              required
                            />
                            <p className="text-xs text-fg-subtle">{editComment.trim().length}/1000 characters (min 10)</p>
                          </div>
                          {review.photos?.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {review.photos.map((photo, idx) => (
                                <div key={photo._id} className="relative">
                                  <SafeImage
                                    src={photo.imageUrl}
                                    alt={`Review photo ${idx + 1}`}
                                    className="w-16 h-16 object-cover rounded-lg"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removePhotoMutation.mutate({ reviewId: review._id, photoId: photo._id })}
                                    disabled={removePhotoMutation.isPending}
                                    aria-label={`Remove photo ${idx + 1}`}
                                    className="absolute -top-2 -right-2 rounded-full bg-danger p-1 text-white disabled:opacity-50"
                                  >
                                    <X className="size-3" aria-hidden="true" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          {(review.photos?.length || 0) < MAX_REVIEW_PHOTOS && (
                            <div className="space-y-2">
                              <Label htmlFor="reviewPhoto" className="text-fg-muted">Add Photo</Label>
                              <Input
                                id="reviewPhoto"
                                type="file"
                                accept="image/*"
                                aria-label="Attach a photo to this review"
                                disabled={addPhotoMutation.isPending}
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) handleAddPhoto(review._id, file);
                                  e.target.value = '';
                                }}
                                className="bg-secondary"
                              />
                            </div>
                          )}
                          <Button
                            onClick={handleSaveUpdate}
                            disabled={updateMutation.isPending || editComment.trim().length < 10}
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
                      onClick={() => setPendingDelete(review)}
                      disabled={deleteMutation.isPending}
                      aria-label="Delete review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Pagination page={page} totalPages={reviewsData?.totalPages || 1} onPageChange={setPage} />
        </div>
      )}
      <ConfirmationModal
        open={!!pendingDelete}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
        title="Delete this review?"
        description={`Your review of "${pendingDelete?.product?.name || 'this product'}" and its photos will be permanently deleted.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => deleteMutation.mutate(pendingDelete._id)}
      />
    </div>
  );
};

export default UserReviews;

