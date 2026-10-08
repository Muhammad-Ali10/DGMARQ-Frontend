import { useQuery } from '@tanstack/react-query';
import { productAPI } from '@services/api';
import { useDebounce } from './useDebounce';

export const SEARCH_SUGGESTIONS_KEY = 'search-suggestions';

export const useSearchSuggestions = (query, { categoryId = 'all', enabled = true } = {}) => {
  const term = useDebounce(query, 300).trim();
  const scopedCategory = categoryId && categoryId !== 'all' ? categoryId : null;

  const { data, isLoading } = useQuery({
    queryKey: [SEARCH_SUGGESTIONS_KEY, term, scopedCategory],
    queryFn: () =>
      productAPI
        .suggestProducts(scopedCategory ? { q: term, categoryId: scopedCategory } : { q: term })
        .then((r) => r.data.data || []),
    enabled: enabled && term.length > 0,
    staleTime: 60000,
  });

  return { term, suggestions: data || [], isLoading };
};

export default useSearchSuggestions;
