import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { subcategoryAPI } from '@services/api';
import { ProductListingLayout } from '@features/catalog';
import { Loading, ErrorMessage } from '@components/ui/loading';
import { useSEO } from '@hooks/useSEO';

const SubcategoryListing = () => {
  const {
    categorySlug,
    subcategorySlug,
    subcategoryId: legacySubcategoryParam,
  } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const subCategoryIdFromQuery = searchParams.get('subCategoryId');
  const categoryIdFromQuery = searchParams.get('categoryId');

  const routeSubcategoryParam = subcategorySlug || legacySubcategoryParam || null;

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
      if (!routeSubcategoryParam && !subCategoryIdFromQuery) return null;

      if (categorySlug && subcategorySlug) {
        const response = await subcategoryAPI.getSubcategoryBySlug(
          categorySlug,
          subcategorySlug
        );
        return response.data.data;
      }

      const idToUse = subCategoryIdFromQuery || routeSubcategoryParam;
      if (!idToUse) return null;

      try {
        const response = await subcategoryAPI.getSubcategoryById(idToUse);
        return response.data.data;
      } catch {
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
  });

  useEffect(() => {
    if (!subcategoryData) return;

    const parentCat = subcategoryData.parentCategory;
    const parentSlug = parentCat?.slug;
    const subSlug = subcategoryData.slug;

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

