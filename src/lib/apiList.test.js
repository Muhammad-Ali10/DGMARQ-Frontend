import { describe, it, expect, vi } from 'vitest';
import { fetchAllPages, MAX_PAGE_SIZE } from './apiList';

const page = (docs, pageNum, totalPages) => ({
  data: { data: { docs, page: pageNum, totalPages, hasNextPage: pageNum < totalPages } },
});

describe('fetchAllPages', () => {
  it('follows every page the capped endpoint reports', async () => {
    const fetchPage = vi.fn(({ page: p }) => Promise.resolve(page([{ _id: `c${p}` }], p, 3)));
    const items = await fetchAllPages(fetchPage, { isActive: true });
    expect(items.map((i) => i._id)).toEqual(['c1', 'c2', 'c3']);
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(fetchPage).toHaveBeenNthCalledWith(2, { isActive: true, page: 2, limit: MAX_PAGE_SIZE });
  });

  it('makes a single request when everything fits on one page', async () => {
    const fetchPage = vi.fn(() => Promise.resolve(page([{ _id: 'a' }, { _id: 'b' }], 1, 1)));
    expect(await fetchAllPages(fetchPage)).toHaveLength(2);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('stops on a plain array response with no paging metadata', async () => {
    const fetchPage = vi.fn(() => Promise.resolve({ data: { data: [{ _id: 'x' }] } }));
    expect(await fetchAllPages(fetchPage)).toEqual([{ _id: 'x' }]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
});
