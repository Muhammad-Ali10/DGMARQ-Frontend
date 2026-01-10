import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI, reviewAPI } from '../../services/api';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Star, Edit, Trash2, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { showSuccess, showApiError } from '../../utils/toast';

const UserReviews = () => {
  const { user } = useSelector((state) => state.auth);
  const [page, setPage] = useState(1);
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const queryClient = useQueryClient();

  const { data: reviewsData, isLoading } = useQuery({
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
      } catch (error) {
        console.error('Error fetching reviews:', error);
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
      queryClient.invalidateQueries(['user-reviews']);
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
      queryClient.invalidateQueries(['user-reviews']);
      showSuccess('Review deleted successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to delete review');
    },
  });

  const addPhotoMutation = useMutation({
    mutationFn: ({ reviewId, formData }) => reviewAPI.addReviewPhoto(reviewId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-reviews']);
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

  if (isLoading) return <Loading message="Loading reviews..." />;

  const reviews = reviewsData?.reviews || [];
  const pagination = reviewsData?.pagination || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">My Reviews</h1>
        <p className="text-gray-400 mt-1">Manage your product reviews</p>
      </div>

      {reviews.length === 0 ? (
        <Card className="bg-primary border-gray-700">
          <CardContent className="py-12 text-center">
            <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No reviews yet</p>
            <p className="text-gray-500 text-sm mt-2">Your reviews will appear here after you purchase and review products</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review._id} className="bg-primary border-gray-700">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-2">
                      {review.productId?.name || review.product?.name || 'Product'}
                    </h3>
                    <div className="flex items-center space-x-2 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
                          }`}
                        />
                      ))}
                      <span className="text-gray-400 text-sm ml-2">({review.rating}/5)</span>
                    </div>
                    <p className="text-gray-300 mb-3">{review.comment}</p>
                    {review.photos && review.photos.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {review.photos.map((photo, idx) => (
                          <img
                            key={idx}
                            src={photo}
                            alt={`Review photo ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                    {review.replies && review.replies.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <p className="text-sm text-gray-400 mb-2">Seller Reply:</p>
                        <p className="text-gray-300 text-sm">{review.replies[0].replyText}</p>
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
                          className="border-gray-700 text-gray-300"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-primary border-gray-700">
                        <DialogHeader>
                          <DialogTitle className="text-white">Edit Review</DialogTitle>
                          <DialogDescription className="text-gray-400">
                            Update your review rating and comment
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-gray-300">Rating</Label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                  key={rating}
                                  type="button"
                                  onClick={() => setEditRating(rating)}
                                  className={`p-2 rounded ${
                                    editRating >= rating
                                      ? 'text-yellow-400'
                                      : 'text-gray-600'
                                  }`}
                                >
                                  <Star
                                    className={`w-6 h-6 ${
                                      editRating >= rating ? 'fill-yellow-400' : ''
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editComment" className="text-gray-300">Comment</Label>
                            <textarea
                              id="editComment"
                              value={editComment}
                              onChange={(e) => setEditComment(e.target.value)}
                              className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
                              rows={4}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="reviewPhoto" className="text-gray-300">Add Photo</Label>
                            <Input
                              id="reviewPhoto"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) handleAddPhoto(review._id, file);
                              }}
                              className="bg-secondary border-gray-700 text-white"
                            />
                          </div>
                          <Button
                            onClick={handleSaveUpdate}
                            disabled={updateMutation.isPending}
                            className="w-full bg-accent hover:bg-blue-700"
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
          {pagination.totalPages > 1 && (
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
      )}
    </div>
  );
};

export default UserReviews;

