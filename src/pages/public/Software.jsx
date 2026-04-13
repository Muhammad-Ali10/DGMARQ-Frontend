import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoryAPI } from '../../services/api';
import ProductListingLayout from '../../components/ProductListing/ProductListingLayout';
import { Helmet } from 'react-helmet-async';

const Software = () => {
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'Software'],
    queryFn: async () => {
      const response = await categoryAPI.getCategories({ isActive: true, limit: 100 });
      return response.data.data;
    },
  });

  const softwareCategory = useMemo(() => {
    if (!categoriesData?.docs) return null;
    return categoriesData.docs.find((c) =>
      c.name?.toLowerCase().includes('software') ||
      c.slug?.toLowerCase().includes('software') ||
      c.name?.toLowerCase() === 'software'
    );
  }, [categoriesData]);

  return (
    <>
      <Helmet>
        <title>All Products | DGMARQ</title>
        <meta
          name="description"
          content="Browse all products on DGMARQ marketplace. Find great deals on products and services."
        />
        <link rel="canonical" href="https://www.dgmarq.com/products" />
      </Helmet>
      <ProductListingLayout
        lockedCategoryId={softwareCategory?._id}
        pageTitle="Software"
      />
    </>
  );
};

export default Software;
