/**
 * SEO Utility Functions
 * 
 * NOTE: For React components, use the useSEO hook instead.
 * These utilities are kept for backward compatibility and non-React usage.
 */

import { DEFAULT_SEO, generateProductSEO as generateProductSEOFromHook } from '../hooks/useSEO';

// Re-export for backward compatibility
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
    console.warn('[SEO] Document head not available');
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
