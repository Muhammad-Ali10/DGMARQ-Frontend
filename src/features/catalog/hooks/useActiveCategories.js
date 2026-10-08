import { useQuery } from '@tanstack/react-query';
import { categoryAPI } from '@services/api';

export const ACTIVE_CATEGORIES_KEY = ['categories', 'active'];

const fetchActiveCategories = () =>
  categoryAPI
    .getCategories({ isActive: true, limit: 100 })
    .then((response) => response.data.data?.docs || []);

export const useActiveCategories = (options = {}) =>
  useQuery({
    queryKey: ACTIVE_CATEGORIES_KEY,
    queryFn: fetchActiveCategories,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    ...options,
  });
