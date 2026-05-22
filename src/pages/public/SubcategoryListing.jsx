import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { subcategoryAPI } from '../../services/api';
import ProductListingLayout from '../../components/ProductListing/ProductListingLayout';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { useSEO } from '../../hooks/useSEO';

const SubcategoryListing = () => {
  const {
    categorySlug,
    subcategorySlug,
    subcategoryId: legacySubcategoryParam,
  } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Fallback subcategory/category IDs from query params (legacy URLs)
  const subCategoryIdFromQuery = searchParams.get('subCategoryId');
  const categoryIdFromQuery = searchParams.get('categoryId');

  // Unified "slug or ID" coming from route (prefer new slug param)
  const routeSubcategoryParam = subcategorySlug || legacySubcategoryParam || null;

  // Decide how to fetch subcategory:
  // - If we have both categorySlug and subcategorySlug, use the dedicated slug API
  // - Otherwise, fall back to ID-based or search-based lookup (legacy behavior)
  useEffect(() => {
    // If we are on legacy /subcategory/:id or have only query params, and we
    // discover the canonical categorySlug + subcategory slug from the API,
    // we'll redirect later after data is loaded. Nothing to do here yet.
  }, [categorySlug, subcategorySlug, legacySubcategoryParam]);

  const {
    data: subcategoryData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      'subcategory-public',
      categorySlug || null,
      routeSubcategoryParam || subCategoryIdFromQuery || categoryIdFromQuery,
    ],
    queryFn: async () => {
      // Need some kind of identifier
      if (!routeSubcategoryParam && !subCategoryIdFromQuery) return null;

      // Preferred: when we have categorySlug + subcategorySlug in the URL
      if (categorySlug && subcategorySlug) {
        const response = await subcategoryAPI.getSubcategoryBySlug(
          categorySlug,
          subcategorySlug
        );
        return response.data.data;
      }

      // Legacy: /subcategory/:id or ?subCategoryId=...
      // Prefer explicit subCategoryId from query when present, otherwise fall back
      // to the route param (which may be an ID).
      const idToUse = subCategoryIdFromQuery || routeSubcategoryParam;
      if (!idToUse) return null;

      // Try as direct ID lookup first
      try {
        const response = await subcategoryAPI.getSubcategoryById(idToUse);
        return response.data.data;
      } catch {
        // If ID lookup fails and we only had a slug-like value, we could
        // optionally fall back to a search, but that is not strictly needed
        // when we have proper slugs configured.
        return null;
      }
    },
    enabled: !!(routeSubcategoryParam || subCategoryIdFromQuery),
  });

  const subcategoryCanonical =
    categorySlug && subcategorySlug
      ? `/category/${categorySlug}/${subcategorySlug}`
      : undefined;

  useSEO({
    title: subcategoryData?.name
      ? `${subcategoryData.name} | DGMARQ`
      : undefined,
    description: subcategoryData?.name
      ? `Browse ${subcategoryData.name} products on DGMARQ marketplace.`
      : undefined,
    canonical: subcategoryCanonical,
    useDefaults: true,
  });

  // Once we know the real slugs from the API, redirect legacy URLs to the
  // canonical SEO-friendly form: /category/:categorySlug/:subcategorySlug
  useEffect(() => {
    if (!subcategoryData) return;

    const parentCat = subcategoryData.parentCategory;
    const parentSlug = parentCat?.slug;
    const subSlug = subcategoryData.slug;

    // Only redirect if we are NOT already on the canonical nested slug URL
    const onCanonicalNestedRoute = !!categorySlug && !!subcategorySlug;

    if (!onCanonicalNestedRoute && parentSlug && subSlug) {
      navigate(`/category/${parentSlug}/${subSlug}`, { replace: true });
    }
  }, [subcategoryData, categorySlug, subcategorySlug, navigate]);

  if (isLoading) {
    return <Loading message="Loading subcategory..." />;
  }

  if (isError || !subcategoryData) {
    return <ErrorMessage message="Subcategory not found" />;
  }

  const subcategoryId = subcategoryData._id;
  const parentCategoryId =
    subcategoryData.parentCategory?._id ||
    subcategoryData.parentCategory ||
    categoryIdFromQuery ||
    null;
  const pageTitle = subcategoryData.name || 'Subcategory';

  return (
    <ProductListingLayout
      defaultCategoryId={parentCategoryId}
      defaultSubCategoryId={subcategoryId}
      pageTitle={pageTitle}
    />
  );
};

export default SubcategoryListing;

