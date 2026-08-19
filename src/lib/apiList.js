/**
 * Normalises the many shapes a list endpoint can return into a plain array.
 *
 * The backend is not uniform here: some routes answer with a bare array, some
 * with an `aggregatePaginate` envelope (`{ docs, totalDocs, ... }`), and some
 * with a named collection under a key the caller would otherwise have to know.
 * Rather than teach every screen those three shapes, normalise once.
 *
 * Previously this existed as two byte-identical private copies in
 * MasterCatalogManagement.jsx and MasterProductEdit.jsx, backing 9 call sites
 * each. Two copies of a shape-guess is exactly the thing that drifts silently:
 * a new response shape gets handled on one page and quietly returns an empty
 * list on the other.
 *
 * @param {object} res - an axios response
 * @returns {Array} the list, or [] when nothing array-shaped is present
 */
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
