/**
 * SEO utilities. Prefer useSEO hook for React components.
 */
import { DEFAULT_SEO, generateProductSEO as generateProductSEOFromHook } from '../hooks/useSEO';

export { DEFAULT_SEO, generateProductSEOFromHook as generateProductSEO };

/**
 * @deprecated Use useSEO hook instead
 * Set SEO meta tags for a page (legacy function)
 */
export const setSEO = ({ title, description }) => {
  if (title) {
    document.title = title.trim();
  }
  
  if (description) {
    updateMetaDescription(description.trim());
  }
};

/**
 * Update or create meta description tag
 * @private
 */
const updateMetaDescription = (content) => {
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
};
