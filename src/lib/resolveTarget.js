// M15: turns an admin-authored link target into an in-app path.
//
// One resolver for every piece of admin-authored navigation — mega-menu links,
// homepage slider slides, and homepage heading sections all store the same
// `linkTarget` shape (see backend models/linkTarget.schema.js) and render
// through this function. New consumers reuse it; they do not build URLs by hand.
//
// Target shape: { type: 'search' | 'category' | 'subcategory' | 'url', value, slug }

// Subcategory pages only resolve two ways, and the difference matters:
//   /category/:categorySlug/:subcategorySlug → getSubcategoryBySlug (clean, SEO)
//   /subcategory/:id                         → getSubcategoryById  (always works)
// A bare slug on the second route does NOT resolve, so `slug` for a subcategory
// target holds the FULL "categorySlug/subcategorySlug" pair. When it is missing
// or a category was renamed, we fall back to the id route rather than emit a
// link that 404s.
const resolveSubcategory = ({ value, slug }) => {
  if (slug && slug.includes("/")) return `/category/${slug}`;
  return `/subcategory/${value}`;
};

export const resolveTarget = (target) => {
  if (!target || !target.type || !target.value) return null;

  switch (target.type) {
    case "search":
      return `/search?q=${encodeURIComponent(target.value)}`;

    // /category/:categoryId accepts a slug OR an id, so the id is a safe
    // fallback when the denormalised slug is stale or absent.
    case "category":
      return `/category/${target.slug || target.value}`;

    case "subcategory":
      return resolveSubcategory(target);

    // In-app paths only. An admin-entered absolute URL would send buyers off
    // the marketplace from inside our own nav, so it is rejected here rather
    // than rendered as a dead <Link>.
    case "url":
      return target.value.startsWith("/") ? target.value : null;

    default:
      return null;
  }
};

// Human-readable summary of a target, for admin lists and previews.
export const describeTarget = (target) => {
  if (!target || !target.type || !target.value) return "No link set";

  switch (target.type) {
    case "search":
      return `Search: "${target.value}"`;
    case "category":
      return `Category: ${target.slug || target.value}`;
    case "subcategory":
      return `Subcategory: ${target.slug || target.value}`;
    case "url":
      return `Link: ${target.value}`;
    default:
      return "No link set";
  }
};

export default resolveTarget;
