// Helpers for the product page's infinite review list: react-query pages of
// `{ docs }` from GET /review/get-reviews, newest first.

/**
 * Every loaded review, in order. Skips repeats: a live prepend shifts the
 * server's page boundaries, so the next "Load More" page can start with a
 * review that is already on screen.
 */
export const flattenReviewPages = (data) => {
  const seen = new Set();
  const reviews = [];
  for (const page of data?.pages ?? []) {
    for (const review of page.docs) {
      if (seen.has(review._id)) continue;
      seen.add(review._id);
      reviews.push(review);
    }
  }
  return reviews;
};

/**
 * Applies one live `review_changed` push to the cached pages. A created review
 * goes to the top of the first page — unless it is already there (the author's
 * own refetch can land first), in which case it is treated as an edit. An edit
 * replaces the review where it is; a removal drops it. A review that is not on
 * screen is left alone.
 */
export const patchReviewPages = (data, { action, review, reviewId }) => {
  const id = review?._id ?? reviewId;
  const present = data.pages.some((page) => page.docs.some((r) => r._id === id));

  if (action === 'created' && !present) {
    const [first, ...rest] = data.pages;
    return { ...data, pages: [{ ...first, docs: [review, ...first.docs] }, ...rest] };
  }
  if (!present) return data;

  const mapDocs = (fn) => ({
    ...data,
    pages: data.pages.map((page) => ({ ...page, docs: fn(page.docs) })),
  });
  if (action === 'removed') return mapDocs((docs) => docs.filter((r) => r._id !== id));
  return mapDocs((docs) => docs.map((r) => (r._id === id ? { ...r, ...review } : r)));
};
