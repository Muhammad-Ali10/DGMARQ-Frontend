import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useEffect } from 'react';
import { categoryAPI } from '../../services/api';
import ProductListingLayout from '../../components/ProductListing/ProductListingLayout';
import { Loading, ErrorMessage } from '../../components/ui/loading';

// Helper to check if string is a valid MongoDB ObjectId
const isValidObjectId = (str) => {
  return /^[0-9a-fA-F]{24}$/.test(str);
};

const CategoryListing = () => {
  const { categoryId: categoryParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get categoryId from query params as fallback
  const categoryIdFromQuery = searchParams.get('categoryId');

  // Check if param is a valid ObjectId or a slug
  const isObjectId = useMemo(() => {
    return categoryParam && isValidObjectId(categoryParam);
  }, [categoryParam]);

  // Fetch all categories to find by slug if needed, or to get slug for ObjectId
  const { data: allCategoriesData } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async () => {
      const response = await categoryAPI.getCategories({ isActive: true, limit: 100 });
      return response.data.data;
    },
    enabled: !isObjectId || !!categoryIdFromQuery, // Fetch if not ObjectId or if query param exists
  });

  // Find category by slug if param is not an ObjectId
  const categoryBySlug = useMemo(() => {
    if (isObjectId || !allCategoriesData?.docs) return null;
    return allCategoriesData.docs.find(
      cat => cat.slug?.toLowerCase() === categoryParam?.toLowerCase()
    );
  }, [allCategoriesData, categoryParam, isObjectId]);

  // Find category by ObjectId if param is ObjectId
  const categoryById = useMemo(() => {
    if (!isObjectId || !allCategoriesData?.docs) return null;
    return allCategoriesData.docs.find(
      cat => cat._id === categoryParam
    );
  }, [allCategoriesData, categoryParam, isObjectId]);

  // Find category from query parameter
  const categoryFromQuery = useMemo(() => {
    if (!categoryIdFromQuery || !allCategoriesData?.docs) return null;
    return allCategoriesData.docs.find(
      cat => cat._id === categoryIdFromQuery
    );
  }, [allCategoriesData, categoryIdFromQuery]);

  // Determine the actual category to use (prioritize route param, then query param)
  const actualCategory = categoryBySlug || categoryById || categoryFromQuery;
  const actualCategoryId = useMemo(() => {
    if (isObjectId && categoryById) return categoryParam;
    if (categoryBySlug) return categoryBySlug._id;
    if (categoryFromQuery) return categoryFromQuery._id;
    if (isObjectId) return categoryParam;
    if (categoryIdFromQuery) return categoryIdFromQuery;
    return null;
  }, [isObjectId, categoryById, categoryBySlug, categoryFromQuery, categoryParam, categoryIdFromQuery]);

  // Redirect to clean URL with slug if we have ObjectId in route but category has slug
  useEffect(() => {
    if (actualCategory && actualCategory.slug && categoryParam !== actualCategory.slug) {
      // If route param is ObjectId but category has slug, redirect to slug URL
      if (isObjectId && actualCategory.slug) {
        navigate(`/category/${actualCategory.slug}`, { replace: true });
      }
      // If query param exists but we have slug, redirect to clean URL
      else if (categoryIdFromQuery && actualCategory.slug) {
        navigate(`/category/${actualCategory.slug}`, { replace: true });
      }
    }
  }, [actualCategory, categoryParam, isObjectId, categoryIdFromQuery, navigate]);

  // Fetch category details (use actualCategory if available, otherwise fetch by ID)
  const { data: categoryData, isLoading: categoryLoading, isError: categoryError } = useQuery({
    queryKey: ['category', actualCategoryId],
    queryFn: async () => {
      if (!actualCategoryId) return null;
      // If we already have category data from allCategories, use it
      if (actualCategory) return actualCategory;
      // Otherwise fetch by ID
      const response = await categoryAPI.getCategoryById(actualCategoryId);
      return response.data.data;
    },
    enabled: !!actualCategoryId,
    initialData: actualCategory || undefined, // Use cached data if available
  });

  if (categoryLoading) {
    return <Loading message="Loading category..." />;
  }

  if (categoryError || !categoryData || !actualCategoryId) {
    return (
      <ErrorMessage
        message="Category not found"
      />
    );
  }

  // Pass lockedCategoryId to ProductListingLayout
  return (
    <ProductListingLayout
      lockedCategoryId={actualCategoryId}
      pageTitle={categoryData.name}
    />
  );
};

export default CategoryListing;
