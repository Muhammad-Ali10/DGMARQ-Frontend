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
 * Update or create meta description tag in document head
 * Direct DOM manipulation for React 19 compatibility
 * Function declaration to avoid TDZ issues (hoisted)
 * 
 * @param {string} content - Meta description content
 */
function updateMetaDescription(content) {
  if (typeof content !== 'string' || !content.trim()) {
    return;
  }

  // Ensure document head exists
  if (!document.head) {
    return;
  }

  // Find existing meta description tag
  let metaTag = document.querySelector('meta[name="description"]');

  if (!metaTag) {
    // Create meta tag if it doesn't exist
    metaTag = document.createElement('meta');
    metaTag.setAttribute('name', 'description');
    // Insert at the beginning of head for better SEO
    document.head.insertBefore(metaTag, document.head.firstChild);
  }

  // Update content
  metaTag.setAttribute('content', content.trim());
}

/**
 * Custom hook for managing SEO meta tags
 * Updates document.title and <meta name="description"> directly in the DOM
 * 
 * @param {Object} options - SEO configuration
 * @param {string} [options.title] - Page title (falls back to default if not provided)
 * @param {string} [options.description] - Meta description (falls back to default if not provided)
 * @param {boolean} [options.useDefaults=true] - Whether to use default values if not provided
 * 
 * @example
 * // Basic usage with defaults
 * useSEO();
 * 
 * @example
 * // Custom SEO
 * useSEO({
 *   title: 'Product Name - DG Marq',
 *   description: 'Buy Product Name at the best price...'
 * });
 * 
 * @example
 * // Dynamic SEO from API
 * const { data: seoSettings } = useQuery(...);
 * useSEO({
 *   title: seoSettings?.metaTitle,
 *   description: seoSettings?.metaDescription,
 * });
 */
export const useSEO = ({ title, description, useDefaults = true } = {}) => {
  const location = useLocation();
  const previousTitleRef = useRef(null);
  const previousDescriptionRef = useRef(null);

  useEffect(() => {
    // Determine final title and description
    const finalTitle = title || (useDefaults ? DEFAULT_SEO.title : null);
    const finalDescription = description || (useDefaults ? DEFAULT_SEO.description : null);

    // Trim values for comparison and storage
    const trimmedTitle = finalTitle ? finalTitle.trim() : null;
    const trimmedDescription = finalDescription ? finalDescription.trim() : null;

    // Always update title on mount and when it changes (override index.html and any other code)
    if (trimmedTitle) {
      // Force update even if ref matches (handles initial mount and route changes)
      if (trimmedTitle !== previousTitleRef.current || previousTitleRef.current === null) {
        document.title = trimmedTitle;
        previousTitleRef.current = trimmedTitle; // Store trimmed value in ref
      }
    }

    // Always update description on mount and when it changes (override any existing meta tag)
    if (trimmedDescription) {
      // Force update even if ref matches (handles initial mount and route changes)
      if (trimmedDescription !== previousDescriptionRef.current || previousDescriptionRef.current === null) {
        updateMetaDescription(trimmedDescription);
        previousDescriptionRef.current = trimmedDescription; // Store trimmed value in ref
      }
    }
  }, [title, description, useDefaults, location.pathname, location.search]); // Re-run on route and query string changes
};

/**
 * Utility function to generate product SEO
 * Can be used with useSEO hook
 * Always returns safe strings (trimmed) and never returns undefined
 * 
 * @param {Object} product - Product object
 * @returns {Object} SEO object with title and description (always strings)
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

  // Generate title: Use metaTitle if available, otherwise generate from product name
  let title = '';
  if (product.metaTitle && typeof product.metaTitle === 'string') {
    title = `${product.metaTitle.trim()} | DG Marq`;
  } else if (productName) {
    title = `${productName}${categoryName ? ` - ${categoryName}` : ''} | DG Marq`;
  } else {
    title = DEFAULT_SEO.title.trim();
  }

  // Generate description: Use metaDescription if available, otherwise generate
  let description = '';
  
  if (product.metaDescription && typeof product.metaDescription === 'string') {
    description = product.metaDescription.trim();
  } else if (product.description && typeof product.description === 'string') {
    // Truncate product description to 160 chars for SEO
    const trimmed = product.description.trim();
    description = trimmed.length > 160 
      ? trimmed.substring(0, 157).trim() + '...'
      : trimmed;
  }
  
  // Fallback description if none generated
  if (!description) {
    if (productName) {
      description = `Buy ${productName}${categoryName ? ` in ${categoryName}` : ''} at DG Marq. Best prices and instant delivery.`;
    } else {
      description = DEFAULT_SEO.description.trim();
    }
  }

  // Ensure both are always safe strings
  return {
    title: title.trim() || DEFAULT_SEO.title.trim(),
    description: description.trim() || DEFAULT_SEO.description.trim(),
  };
};

// Export default SEO for use in other components
export { DEFAULT_SEO };
