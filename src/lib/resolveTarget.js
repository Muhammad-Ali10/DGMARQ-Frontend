const SAME_SITE_PATH = /^\/(?![/\\])/;

const resolveSubcategory = ({ value, slug }) => {
  if (slug && slug.includes("/")) return `/category/${slug}`;
  return `/subcategory/${value}`;
};

export const resolveTarget = (target) => {
  if (!target || !target.type || !target.value) return null;

  switch (target.type) {
    case "search":
      return `/search?q=${encodeURIComponent(target.value)}`;

    case "category":
      return `/category/${target.slug || target.value}`;

    case "subcategory":
      return resolveSubcategory(target);

    case "url":
      return SAME_SITE_PATH.test(target.value) ? target.value : null;

    default:
      return null;
  }
};

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
