import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { supportAPI } from '@services/api';
import { Button } from '@components/ui/button';
import { Textarea } from '@components/ui/textarea';
import { showApiError } from '@utils/toast';

/**
 * Shown to the ticket owner once a ticket is resolved/closed and not yet rated.
 * 1-5 stars + optional feedback. Calls onRated() after a successful submit.
 */
const RatingPrompt = ({ chatId, alreadyRated = false, onRated }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [done, setDone] = useState(alreadyRated);

  const mutation = useMutation({
    mutationFn: () => supportAPI.rateSupportChat(chatId, { rating, feedback: feedback.trim() || undefined }),
    onSuccess: () => {
      setDone(true);
      onRated?.();
    },
    onError: (e) => showApiError(e, 'Failed to submit rating'),
  });

  if (done) {
    return (
      <div className="border-t border-gray-700 bg-gray-800 p-3 text-center text-sm text-green-400">
        Thanks for your feedback! 🙌
      </div>
    );
  }

  return (
    <div className="border-t border-gray-700 bg-gray-800 p-3 space-y-2">
      <p className="text-sm text-gray-300 text-center">How was your support experience?</p>
      <div className="flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className="p-0.5"
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                (hover || rating) >= n ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'
              }`}
            />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
            placeholder="Tell us more (optional)…"
            className="bg-gray-900 border-gray-700 text-white text-sm"
          />
          <Button className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Submitting…' : 'Submit feedback'}
          </Button>
        </>
      )}
    </div>
  );
};

export default RatingPrompt;
