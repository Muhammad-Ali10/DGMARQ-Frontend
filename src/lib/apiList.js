export const extractList = (res) => {
  const d = res?.data?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.docs)) return d.docs;
  if (d && typeof d === 'object') {
    const arr = Object.values(d).find((v) => Array.isArray(v));
    if (arr) return arr;
  }
  return [];
};

export const MAX_PAGE_SIZE = 100;

export const fetchAllPages = async (fetchPage, params = {}) => {
  const items = [];
  for (let page = 1; ; page += 1) {
    const res = await fetchPage({ ...params, page, limit: MAX_PAGE_SIZE });
    items.push(...extractList(res));
    const meta = res?.data?.data;
    if (!meta?.hasNextPage || page >= (meta.totalPages || page)) return items;
  }
};
