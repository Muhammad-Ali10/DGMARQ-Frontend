import { describe, it, expect } from 'vitest';
import { flattenReviewPages, patchReviewPages } from './reviewPages';

const r = (id, extra = {}) => ({ _id: id, rating: 5, comment: `review ${id}`, ...extra });
const pages = (...docsPerPage) => ({
  pages: docsPerPage.map((docs) => ({ docs })),
  pageParams: docsPerPage.map((_, i) => i + 1),
});

describe('flattenReviewPages', () => {
  it('returns every loaded review in page order', () => {
    expect(flattenReviewPages(pages([r('a'), r('b')], [r('c')])).map((x) => x._id)).toEqual(['a', 'b', 'c']);
  });

  it('drops the repeat a live prepend causes at the next page boundary', () => {
    expect(flattenReviewPages(pages([r('new'), r('a'), r('b')], [r('b'), r('c')])).map((x) => x._id))
      .toEqual(['new', 'a', 'b', 'c']);
  });

  it('is empty before anything has loaded', () => {
    expect(flattenReviewPages(undefined)).toEqual([]);
  });
});

describe('patchReviewPages', () => {
  it('puts a created review at the top of the first page', () => {
    const next = patchReviewPages(pages([r('a')], [r('b')]), { action: 'created', review: r('new') });
    expect(next.pages[0].docs.map((x) => x._id)).toEqual(['new', 'a']);
    expect(next.pages[1].docs.map((x) => x._id)).toEqual(['b']);
    expect(next.pageParams).toEqual([1, 2]);
  });

  it('treats a created review that is already on screen as an edit — no duplicate', () => {
    const next = patchReviewPages(pages([r('a', { rating: 3 })]), { action: 'created', review: r('a', { rating: 4 }) });
    expect(next.pages[0].docs).toHaveLength(1);
    expect(next.pages[0].docs[0].rating).toBe(4);
  });

  it('updates an edited review in place, keeping fields the push does not carry', () => {
    const next = patchReviewPages(
      pages([r('a')], [r('b', { helpfulCount: 7 })]),
      { action: 'updated', review: { _id: 'b', rating: 2, comment: 'changed' } },
    );
    expect(next.pages[1].docs[0]).toMatchObject({ _id: 'b', rating: 2, comment: 'changed', helpfulCount: 7 });
  });

  it('drops a removed review', () => {
    const next = patchReviewPages(pages([r('a'), r('b')]), { action: 'removed', reviewId: 'a' });
    expect(next.pages[0].docs.map((x) => x._id)).toEqual(['b']);
  });

  it('leaves the cache untouched when the changed review is not on screen', () => {
    const data = pages([r('a')]);
    expect(patchReviewPages(data, { action: 'updated', review: r('elsewhere') })).toBe(data);
    expect(patchReviewPages(data, { action: 'removed', reviewId: 'elsewhere' })).toBe(data);
  });
});
