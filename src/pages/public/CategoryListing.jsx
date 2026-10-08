import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useEffect } from 'react';
import { categoryAPI } from '@services/api';
import { ProductListingLayout, useActiveCategories } from '@features/catalog';
import { Loading, ErrorMessage } from '@components/ui/loading';
import { useSEO } from '@hooks/useSEO';

const isValidObjectId = (str) => {
  return /^[0-9a-fA-F]{24}$/.test(str);
};

const CategoryListing = () => {
  const { categoryId: categoryParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const categoryIdFromQuery = searchParams.get('categoryId');

  const isObjectId = useMemo(() => {
    return categoryParam && isValidObjectId(categoryParam);
  }, [categoryParam]);

  const { data: allCategories, isLoading: categoriesLoading } = useActiveCategories({
    enabled: !isObjectId || !!categoryIdFromQuery,
  });

  const categoryBySlug = useMemo(() => {
    if (isObjectId || !allCategories) return null;
    return allCategories.find(
      cat => cat.slug?.toLowerCase() === categoryParam?.toLowerCase()
    );
  }, [allCategories, categoryParam, isObjectId]);

  const categoryById = useMemo(() => {
    if (!isObjectId || !allCategories) return null;
    return allCategories.find(
      cat => cat._id === categoryParam
    );
  }, [allCategories, categoryParam, isObjectId]);

  const categoryFromQuery = useMemo(() => {
    if (!categoryIdFromQuery || !allCategories) return null;
    return allCategories.find(
      cat => cat._id === categoryIdFromQuery
    );
  }, [allCategories, categoryIdFromQuery]);

  const actualCategory = categoryBySlug || categoryById || categoryFromQuery;
  const actualCategoryId = useMemo(() => {
    if (isObjectId && categoryById) return categoryParam;
    if (categoryBySlug) return categoryBySlug._id;
    if (categoryFromQuery) return categoryFromQuery._id;
    if (isObjectId) return categoryParam;
    if (categoryIdFromQuery) return categoryIdFromQuery;
    return null;
  }, [isObjectId, categoryById, categoryBySlug, categoryFromQuery, categoryParam, categoryIdFromQuery]);

  useEffect(() => {
    if (actualCategory && actualCategory.slug && categoryParam !== actualCategory.slug) {
      if (isObjectId && actualCategory.slug) {
        navigate(`/category/${actualCategory.slug}`, { replace: true });
      }
      else if (categoryIdFromQuery && actualCategory.slug) {
        navigate(`/category/${actualCategory.slug}`, { replace: true });
      }
    }
  }, [actualCategory, categoryParam, isObjectId, categoryIdFromQuery, navigate]);

  const needsSlugLookup = !actualCategoryId && !!categoryParam && !isObjectId && !!allCategories;

  const { data: categoryData, isLoading: categoryLoading, isError: categoryError } = useQuery({
    queryKey: actualCategoryId ? ['category', actualCategoryId] : ['category', 'slug', categoryParam],
    queryFn: async () => {
      if (actualCategory) return actualCategory;
      const response = actualCategoryId
        ? await categoryAPI.getCategoryById(actualCategoryId)
        : await categoryAPI.getCategoryBySlug(categoryParam);
      return response.data.data;
    },
    enabled: !!actualCategoryId || needsSlugLookup,
    initialData: actualCategory || undefined,
    retry: false,
  });

  const categorySlug = categoryData?.slug || categoryParam;

  useSEO({
    title: categoryData?.name
      ? `${categoryData.name} Listings | DGMARQ`
      : undefined,
    description: categoryData?.name
      ? `Browse all ${categoryData.name} listings on DGMARQ marketplace.`
      : undefined,
    canonical: categorySlug ? `/category/${categorySlug}` : undefined,
  });

  if (categoriesLoading || categoryLoading) {
    return <Loading message="Loading category..." />;
  }

  if (categoryError || !categoryData?._id) {
    return (
      <ErrorMessage
        message="Category not found"
      />
    );
  }

  return (
    <>
      <ProductListingLayout
        lockedCategoryId={categoryData._id}
        pageTitle={categoryData.name}
      />
    </>
  );
};

export default CategoryListing;
