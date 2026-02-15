import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Default SEO values for the application
 */
const DEFAULT_SEO = {
  title: 'DG Marq - Digital Marketplace for Games & Software',
  description: 'DG Marq is a digital marketplace for games, software, and digital accounts with instant delivery, secure payments, and 24/7 support.',
};

/**
 * Updates or creates meta description in document head.
 */
function updateMetaDescription(content) {
  if (typeof content !== 'string' || !content.trim()) {
    return;
  }
  if (!document.head) {
    return;
  }
  let metaTag = document.querySelector('meta[name="description"]');
  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.setAttribute('name', 'description');
    document.head.insertBefore(metaTag, document.head.firstChild);
  }
  metaTag.setAttribute('content', content.trim());
}

/**
 * Manages SEO meta tags: document.title and meta description.
 */
export const useSEO = ({ title, description, useDefaults = true } = {}) => {
  const location = useLocation();
  const previousTitleRef = useRef(null);
  const previousDescriptionRef = useRef(null);

  useEffect(() => {
    const finalTitle = title || (useDefaults ? DEFAULT_SEO.title : null);
    const finalDescription = description || (useDefaults ? DEFAULT_SEO.description : null);
    const trimmedTitle = finalTitle ? finalTitle.trim() : null;
    const trimmedDescription = finalDescription ? finalDescription.trim() : null;
    if (trimmedTitle) {
      if (trimmedTitle !== previousTitleRef.current || previousTitleRef.current === null) {
        document.title = trimmedTitle;
        previousTitleRef.current = trimmedTitle;
      }
    }
    if (trimmedDescription) {
      if (trimmedDescription !== previousDescriptionRef.current || previousDescriptionRef.current === null) {
        updateMetaDescription(trimmedDescription);
        previousDescriptionRef.current = trimmedDescription;
      }
    }
  }, [title, description, useDefaults, location.pathname, location.search]);
};

/**
 * Generates product SEO title and description.
 */
export const generateProductSEO = (product) => {
  if (!product) {
    return {
      title: DEFAULT_SEO.title.trim(),
      description: DEFAULT_SEO.description.trim(),
    };
  }

  const categoryName = (product.categoryId?.name || product.category?.name || '').trim();
  const productName = (product.name || '').trim();
  let title = '';
  if (product.metaTitle && typeof product.metaTitle === 'string') {
    title = `${product.metaTitle.trim()} | DG Marq`;
  } else if (productName) {
    title = `${productName}${categoryName ? ` - ${categoryName}` : ''} | DG Marq`;
  } else {
    title = DEFAULT_SEO.title.trim();
  }
  let description = '';
  if (product.metaDescription && typeof product.metaDescription === 'string') {
    description = product.metaDescription.trim();
  } else if (product.description && typeof product.description === 'string') {
    const trimmed = product.description.trim();
    description = trimmed.length > 160 
      ? trimmed.substring(0, 157).trim() + '...'
      : trimmed;
  }
  if (!description) {
    if (productName) {
      description = `Buy ${productName}${categoryName ? ` in ${categoryName}` : ''} at DG Marq. Best prices and instant delivery.`;
    } else {
      description = DEFAULT_SEO.description.trim();
    }
  }
  return {
    title: title.trim() || DEFAULT_SEO.title.trim(),
    description: description.trim() || DEFAULT_SEO.description.trim(),
  };
};

export { DEFAULT_SEO };
