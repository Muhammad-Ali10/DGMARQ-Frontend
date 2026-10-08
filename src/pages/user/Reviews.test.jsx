import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/render';
import UserReviews from './Reviews';

vi.mock('@services/api', () => ({
  reviewAPI: {
    getMyReviews: vi.fn(),
    updateReview: vi.fn(),
    deleteReview: vi.fn(),
    addReviewPhoto: vi.fn(),
    deleteReviewPhoto: vi.fn(),
  },
}));

const { reviewAPI } = await import('@services/api');

const review = {
  _id: 'r1',
  rating: 4,
  comment: 'Key arrived instantly',
  createdAt: '2026-10-01T00:00:00.000Z',
  product: { name: 'Pixel Quest' },
  photos: [{ _id: 'p1', imageUrl: 'https://img.test/1.png' }],
  replies: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  reviewAPI.getMyReviews.mockResolvedValue({ data: { data: { docs: [review], totalPages: 1 } } });
  reviewAPI.deleteReview.mockResolvedValue({ data: { data: null } });
  reviewAPI.deleteReviewPhoto.mockResolvedValue({ data: { data: null } });
});

describe('my reviews', () => {
  it('asks before deleting a review', async () => {
    renderWithProviders(<UserReviews />, { route: '/user/reviews' });

    fireEvent.click(await screen.findByRole('button', { name: 'Delete review' }));
    expect(reviewAPI.deleteReview).not.toHaveBeenCalled();
    expect(screen.getByText('Delete this review?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(reviewAPI.deleteReview).toHaveBeenCalledWith('r1'));
  });

  it('lets the author remove a photo from the edit dialog', async () => {
    renderWithProviders(<UserReviews />, { route: '/user/reviews' });

    fireEvent.click(await screen.findByRole('button', { name: 'Edit review' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Remove photo 1' }));
    await waitFor(() => expect(reviewAPI.deleteReviewPhoto).toHaveBeenCalledWith('r1', 'p1'));
  });
});
