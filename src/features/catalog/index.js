// Public surface of the catalog (product) feature. Import from '@features/catalog'.
export { default as ProductCard } from './components/ProductCard';
export { default as MicrosoftCard } from './components/MicrosoftCard';
export { default as CategoryProduct } from './components/CategoryProduct';
export { default as CategoryNavigation } from './components/CategoryNavigation';
export { default as Hero } from './components/Hero';
export { default as ProductListingLayout } from './components/ProductListingLayout';
export { default as PlatformTrustGrid } from './components/PlatformTrustGrid';
export { default as PlusPromoSection } from './components/PlusPromoSection';
export { default as CustomHomepageSections } from './components/CustomHomepageSections';
export { default as ProductRowSection } from './components/ProductRowSection';
export { default as SubcategoryRail } from './components/SubcategoryRail';
export { default as ProductTypeNotice, ProductTypeBadge } from './components/ProductTypeNotice';
export * from './utils/productUtils';
export { useActiveCategories } from './hooks/useActiveCategories';
export { useLiveProductReviews } from './hooks/useLiveProductReviews';
export { flattenReviewPages } from './utils/reviewPages';
export {
  default as useWishlist,
  WISHLIST_QUERY_KEY,
  WISHLIST_IDS_KEY,
  wishlistPageKey,
} from './hooks/useWishlist';
