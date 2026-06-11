import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { SearchableSelect } from '../ui/searchable-select';

/**
 * Async, searchable taxonomy dropdown for the seller product forms.
 *
 * Replaces the old native <select> elements that each loaded limit:1000 options
 * up front. Instead it:
 *  - loads a small first page (default limit 50),
 *  - debounces the typed query and re-queries the backend with a `search` param
 *    (server-side search) for endpoints that support it,
 *  - always keeps the currently-selected option present in the list so an
 *    existing value still displays its label when editing.
 *
 * For endpoints WITHOUT server search (e.g. platform), pass serverSearch={false}
 * and a higher limit; SearchableSelect's built-in client filter handles typing.
 */
const TaxonomySelect = ({
  value,
  onChange,
  queryKey,
  fetcher, // (params) => Promise resolving to the raw `data` object
  extractList = (data) => data?.docs || data?.list || [],
  selectedOption = null, // {_id, name} for the currently selected value (edit mode)
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  limit = 50,
  serverSearch = true,
  enabled = true,
  disabled = false,
}) => {
  const [rawQuery, setRawQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(rawQuery.trim()), 300);
    return () => clearTimeout(debounceRef.current);
  }, [rawQuery]);

  const { data, isFetching } = useQuery({
    queryKey: [...queryKey, serverSearch ? debouncedQuery : '', limit],
    queryFn: () => {
      const params = { page: 1, limit };
      if (serverSearch && debouncedQuery) params.search = debouncedQuery;
      return fetcher(params);
    },
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60000,
  });

  const options = useMemo(() => {
    const list = extractList(data) || [];
    // Ensure the selected option is always available so its label renders even
    // if it falls outside the current (searched/paged) result set.
    if (selectedOption && selectedOption._id) {
      const exists = list.some((o) => (o._id || o.id) === selectedOption._id);
      if (!exists) return [selectedOption, ...list];
    }
    return list;
  }, [data, extractList, selectedOption]);

  return (
    <SearchableSelect
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      options={options}
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      loading={isFetching}
      serverSide={serverSearch}
      onSearchChange={serverSearch ? setRawQuery : undefined}
      emptyMessage="No options found"
    />
  );
};

export default TaxonomySelect;
