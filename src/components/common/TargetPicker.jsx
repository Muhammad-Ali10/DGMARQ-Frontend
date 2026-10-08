import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, FolderTree, Layers, Link2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { SearchableSelect } from '@components/ui/searchable-select';
import { SearchInput } from '@components/common/SearchInput';
import { subcategoryAPI, productAPI } from '@services/api';
import { fetchAllPages } from '@lib/apiList';
import { useActiveCategories } from '@features/catalog/hooks/useActiveCategories';
import { resolveTarget } from '@lib/resolveTarget';
import { useDebounce } from '@hooks/useDebounce';
import { cn } from '@lib/utils';

const TYPES = [
  { id: 'category', label: 'Category', icon: FolderTree },
  { id: 'subcategory', label: 'Subcategory', icon: Layers },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'url', label: 'Custom URL', icon: Link2 },
];

const TargetPicker = ({ value, onChange, label = 'Link target' }) => {
  const type = value?.type || 'category';
  const [searchText, setSearchText] = useState(type === 'search' ? value?.value || '' : '');
  const debouncedSearch = useDebounce(searchText, 500);

  const { data: categories = [], isLoading: loadingCategories } = useActiveCategories({
    enabled: type === 'category',
  });

  const { data: subcategories = [], isLoading: loadingSubcategories } = useQuery({
    queryKey: ['target-picker-subcategories'],
    queryFn: () => fetchAllPages(subcategoryAPI.getSubcategories, { isActive: true }),
    enabled: type === 'subcategory',
    staleTime: 300000,
  });

  const { data: matchCount, isFetching: countingMatches } = useQuery({
    queryKey: ['target-picker-search-count', debouncedSearch],
    queryFn: () =>
      productAPI
        .getProducts({ search: debouncedSearch, searchMode: 'prefix', limit: 1, page: 1 })
        .then((r) => r.data.data?.totalDocs ?? 0),
    enabled: type === 'search' && debouncedSearch.trim().length > 0,
    staleTime: 60000,
  });

  const setType = (nextType) => {
    if (nextType === type) return;
    setSearchText('');
    onChange({ type: nextType, value: '', slug: '' });
  };

  const subcategoryOptions = useMemo(
    () =>
      subcategories.map((sub) => ({
        ...sub,
        label: sub.parentCategory?.name ? `${sub.parentCategory.name} › ${sub.name}` : sub.name,
      })),
    [subcategories]
  );

  const resolvedPath = resolveTarget(value);

  return (
    <div className="space-y-3">
      <Label className="text-fg-muted">{label}</Label>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TYPES.map(({ id, label: typeLabel, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setType(id)}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              type === id
                ? 'border-accent bg-accent/15 text-accent-on-dark'
                : 'border-border text-fg-muted hover:border-accent/50 hover:text-fg'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {typeLabel}
          </button>
        ))}
      </div>

      {type === 'category' && (
        <SearchableSelect
          options={categories}
          loading={loadingCategories}
          value={value?.value || ''}
          onValueChange={(id) => {
            const picked = categories.find((c) => c._id === id);
            onChange({ type: 'category', value: id, slug: picked?.slug || '' });
          }}
          placeholder="Select a category…"
          searchPlaceholder="Search categories…"
          emptyMessage="No categories found"
          countNoun="categories"
        />
      )}

      {type === 'subcategory' && (
        <SearchableSelect
          options={subcategoryOptions}
          loading={loadingSubcategories}
          value={value?.value || ''}
          onValueChange={(id) => {
            const picked = subcategoryOptions.find((s) => s._id === id);
            const pair =
              picked?.parentCategory?.slug && picked?.slug
                ? `${picked.parentCategory.slug}/${picked.slug}`
                : '';
            onChange({ type: 'subcategory', value: id, slug: pair });
          }}
          getOptionLabel={(option) => option.label}
          placeholder="Select a subcategory…"
          searchPlaceholder="Search subcategories…"
          countNoun="subcategories"
          emptyMessage="No subcategories found"
        />
      )}

      {type === 'search' && (
        <div className="space-y-2">
          <SearchInput
            value={searchText}
            onChange={(next) => {
              setSearchText(next);
              onChange({ type: 'search', value: next.trim(), slug: '' });
            }}
            placeholder="e.g. xbox game pass"
          />
          {debouncedSearch.trim() && !countingMatches && matchCount !== undefined && (
            <p
              className={cn(
                'flex items-center gap-1.5 text-xs',
                matchCount > 0 ? 'text-success' : 'text-warning'
              )}
            >
              {matchCount > 0 ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {matchCount} product{matchCount === 1 ? '' : 's'} match this search
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  No products match — this link will open an empty page. Search is
                  prefix-matched, so try the start of the product name, or pick a
                  category instead.
                </>
              )}
            </p>
          )}
        </div>
      )}

      {type === 'url' && (
        <div className="space-y-2">
          <Input
            value={value?.value || ''}
            onChange={(e) => onChange({ type: 'url', value: e.target.value.trim(), slug: '' })}
            placeholder="/dgmarq-plus"
            className="bg-secondary border-border text-fg"
          />
          {value?.value && !resolvedPath && (
            <p className="flex items-center gap-1.5 text-xs text-warning">
              <AlertTriangle className="h-3.5 w-3.5" />
              Must be an in-app path that starts with a single “/” — other links are not allowed here.
            </p>
          )}
        </div>
      )}

      <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-fg-subtle">Opens</p>
          <p className={cn('text-sm font-mono break-all', resolvedPath ? 'text-fg' : 'text-fg-subtle')}>
            {resolvedPath || 'Nothing selected yet'}
          </p>
        </div>
        {value?.value && (
          <button
            type="button"
            onClick={() => {
              setSearchText('');
              onChange(null);
            }}
            className="shrink-0 text-xs font-medium text-fg-muted underline underline-offset-4 hover:text-fg"
          >
            Remove link
          </button>
        )}
      </div>
    </div>
  );
};

export default TargetPicker;
