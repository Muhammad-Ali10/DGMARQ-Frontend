import { DEFAULT_SEO, useSEO } from '@components/common/SEOProvider';
import { truncateMetaDescription } from '@utils/meta';

export { DEFAULT_SEO, useSEO };

export const generateProductSEO = (product) => {
  if (!product) {
    return {
      title: DEFAULT_SEO.title,
      description: DEFAULT_SEO.description,
    };
  }

  const categoryName = (product.categoryId?.name || product.category?.name || '').trim();
  const productName = (product.name || '').trim();

  let title = '';
  if (product.metaTitle && typeof product.metaTitle === 'string') {
    title = product.metaTitle.trim();
  } else if (productName) {
    title = `${productName}${categoryName ? ` - ${categoryName}` : ''} | DG Marq`;
  } else {
    title = DEFAULT_SEO.title;
  }

  let description = '';
  if (product.metaDescription && typeof product.metaDescription === 'string') {
    description = product.metaDescription.trim();
  } else if (product.description && typeof product.description === 'string') {
    description = product.description.trim();
  }

  if (!description && productName) {
    description = `Buy ${productName}${categoryName ? ` in ${categoryName}` : ''} at DG Marq. Best prices and instant delivery.`;
  }

  return {
    title: title.trim() || DEFAULT_SEO.title,
    description: truncateMetaDescription(description) || DEFAULT_SEO.description,
  };
};
