import { useQuery } from '@tanstack/react-query';
import { categoryAPI } from '@services/api';

/**
 * Active category list backing the category-locked landing pages (Gift Cards,
 * Random Keys, Software, Steam Gift Card), each of which resolves one category
 * id out of it by name/slug.
 *
 * `queryKey` is a parameter rather than a constant because each page has always
 * cached under its own key. Passing it in keeps every page's cache identity
 * exactly what it was — see the note in the catalog barrel about collapsing
 * these onto one shared key.
 */
export const useActiveCategories = (queryKey) =>
  useQuery({
    queryKey,
    queryFn: async () => {
      const response = await categoryAPI.getCategories({ isActive: true, limit: 100 });
      return response.data.data;
    },
  });
