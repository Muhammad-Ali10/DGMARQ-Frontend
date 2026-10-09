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
