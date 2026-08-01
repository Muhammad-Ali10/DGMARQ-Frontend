import { useMemo } from 'react';
import { ProductListingLayout, useActiveCategories } from '@features/catalog';

const RandomKeys = () => {
  const { data: categoriesData } = useActiveCategories(['categories', 'random-key']);

  const randomKeysCategory = useMemo(() => {
    if (!categoriesData?.docs) return null;
    return categoriesData.docs.find((c) =>
      c.name?.toLowerCase().includes('random-key') ||
      c.slug?.toLowerCase().includes('random-key') ||
      c.name?.toLowerCase() === 'random keys'
    );
  }, [categoriesData]);

  return (
    <ProductListingLayout
      lockedCategoryId={randomKeysCategory?._id}
      pageTitle="Random Keys"
    />
  );
};

export default RandomKeys;
