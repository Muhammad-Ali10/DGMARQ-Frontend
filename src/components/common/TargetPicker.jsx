import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, FolderTree, Layers, Link2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { SearchableSelect } from '@components/ui/searchable-select';
import { SearchInput } from '@components/common/SearchInput';
import { categoryAPI, subcategoryAPI, productAPI } from '@services/api';
import { resolveTarget } from '@lib/resolveTarget';
import { useDebounce } from '@hooks/useDebounce';
import { cn } from '@lib/utils';

/**
 * Admin control for "where should this link go?".
 *
 * Shared by every piece of admin-authored navigation — mega-menu links,
 * homepage slider slides, and homepage heading sections — so all three write
 * the same `linkTarget` shape and render through the same `resolveTarget`.
 *
 * Picking a category/subcategory is preferred over a raw search string: the
 * product search is prefix-matched (left-anchored), so a free-text query like
 * "netflix gift card" will NOT match a product named "Gift Card — Netflix".
 * The search mode therefore shows a live result count so an admin can see a
 * dead link before saving it.
 *
 * @param {{type: string, value: string, slug?: string}|null} value
 * @param {(next: {type: string, value: string, slug: string}|null) => void} onChange
 * @param {string} [label]
 */

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

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['target-picker-categories'],
    queryFn: () =>
      categoryAPI
        .getCategories({ isActive: true, limit: 100 })
        .then((r) => r.data.data?.docs || []),
    enabled: type === 'category',
    staleTime: 300000,
  });

  const { data: subcategories = [], isLoading: loadingSubcategories } = useQuery({
    queryKey: ['target-picker-subcategories'],
    // 100 is the server's hard cap (subcategory.controller.js clamps `limit`).
    // The dropdown filters this list client-side, which is fine at today's
    // taxonomy size; past 100 subcategories this needs SearchableSelect's
    // `serverSide` + `onSearchChange` mode instead of a bigger limit.
    queryFn: () =>
      subcategoryAPI
        .getSubcategories({ isActive: true, limit: 100 })
        .then((r) => r.data.data?.docs || []),
    enabled: type === 'subcategory',
    staleTime: 300000,
  });

  // Live "does this query find anything?" check. limit:1 because only the
  // total is needed — the rows themselves are never rendered.
  const { data: matchCount, isFetching: countingMatches } = useQuery({
    queryKey: ['target-picker-search-count', debouncedSearch],
    queryFn: () =>
      productAPI
        .getProducts({ search: debouncedSearch, limit: 1, page: 1 })
        .then((r) => r.data.data?.totalDocs ?? 0),
    enabled: type === 'search' && debouncedSearch.trim().length > 0,
    staleTime: 60000,
  });

  const setType = (nextType) => {
    if (nextType === type) return;
    // Values are not portable between types (an ObjectId is meaningless as a
    // search string), so switching clears the selection rather than carrying
    // a value that would resolve to a broken link.
    setSearchText('');
    onChange({ type: nextType, value: '', slug: '' });
  };

  const subcategoryOptions = useMemo(
    () =>
      subcategories.map((sub) => ({
        ...sub,
        // Shown in the dropdown so two same-named subcategories under
        // different parents stay distinguishable.
        label: sub.parentCategory?.name ? `${sub.parentCategory.name} › ${sub.name}` : sub.name,
      })),
    [subcategories]
  );

  const resolvedPath = resolveTarget(value);

  return (
    <div className="space-y-3">
      <Label className="text-fg-muted">{label}</Label>

      {/* Type selector */}
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
        />
      )}

      {type === 'subcategory' && (
        <SearchableSelect
          options={subcategoryOptions}
          loading={loadingSubcategories}
          value={value?.value || ''}
          onValueChange={(id) => {
            const picked = subcategoryOptions.find((s) => s._id === id);
            // resolveTarget needs "categorySlug/subcategorySlug" for the clean
            // SEO route; without both halves it falls back to /subcategory/:id.
            const pair =
              picked?.parentCategory?.slug && picked?.slug
                ? `${picked.parentCategory.slug}/${picked.slug}`
                : '';
            onChange({ type: 'subcategory', value: id, slug: pair });
          }}
          getOptionLabel={(option) => option.label}
          placeholder="Select a subcategory…"
          searchPlaceholder="Search subcategories…"
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
          {value?.value && !value.value.startsWith('/') && (
            <p className="flex items-center gap-1.5 text-xs text-warning">
              <AlertTriangle className="h-3.5 w-3.5" />
              Must start with “/” — only in-app paths are allowed here.
            </p>
          )}
        </div>
      )}

      {/* What the buyer will actually navigate to */}
      <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
        <p className="text-[11px] uppercase tracking-wide text-fg-subtle">Opens</p>
        <p className={cn('text-sm font-mono', resolvedPath ? 'text-fg' : 'text-fg-subtle')}>
          {resolvedPath || 'Nothing selected yet'}
        </p>
      </div>
    </div>
  );
};

export default TargetPicker;
