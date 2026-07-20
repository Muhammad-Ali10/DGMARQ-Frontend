 
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useSEO } from '@hooks/useSEO';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { productAPI, platformAPI, categoryAPI, subcategoryAPI, deviceAPI, typeAPI, genreAPI, themeAPI, modeAPI } from '@services/api';
import { REGION_PRESETS } from '@lib/regionPresets';
import ProductCard from './ProductCard';
import ProductVerticalCard from './ProductVerticalCard';
import CategoryProduct from './CategoryProduct';
import { Loading, ErrorMessage } from '@components/ui/loading';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Checkbox } from '@components/ui/checkbox';
import { Label } from '@components/ui/label';
import { Skeleton } from '@components/ui/skeleton';
import { Card } from '@components/ui/card';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X, Search, Lock } from 'lucide-react';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hoisted to module scope so they keep a stable component identity across the
// parent's renders (otherwise they remount every render -> filter inputs lose
// focus and the whole subtree needlessly reconciles). Everything they need is
// passed explicitly as props instead of being captured from the render closure.
const FilterSection = ({
  title,
  children,
  section,
  hasSearch = false,
  itemCount,
  totalItems = 0,
  isExpanded,
  searchValue,
  onSearchChange,
  onToggleSection,
}) => {
  const hasMoreItems = totalItems > 5;

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden mb-4 text-white">
      <div className="bg-[#043086] px-4 py-3 flex items-center justify-between">
        <h3 className="text-white font-medium text-sm uppercase tracking-wide">
          {title}
        </h3>
        {itemCount > 0 && (
          <span className="text-base text-white px-2 py-1 rounded">
            {itemCount}
          </span>
        )}
      </div>
      <div className="py-4 px-3 space-y-3 bg-[#052157]">
        {hasSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder={`Search for ${title}`}
              className="pl-10 bg-transparent text-white placeholder-white focus:border-blue-500"
              value={searchValue || ''}
              onChange={(e) => onSearchChange(section, e.target.value)}
            />
          </div>
        )}
        <div className="space-y-1">
          {children}
        </div>
        {section && hasMoreItems && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSection(section);
            }}
            className="w-full text-white hover:bg-slate-700"
          >
            {isExpanded ? (
              <>Show Less <ChevronUp className="ml-2 h-4 w-4" /></>
            ) : (
              <>Show More <ChevronDown className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

const CheckboxItem = ({ id, title, type, count, isLocked = false, isChecked, onToggle }) => {
  return (
    <div
      className={`flex items-center justify-between py-3 px-2 cursor-pointer bg-[#052157] transition-all duration-200 group ${
        isChecked
          ? 'bg-[#06051C]/60 hover:bg-[#06051C]'
          : 'hover:bg-slate-700'
      } ${isLocked ? 'opacity-75' : ''}`}
      onClick={() => !isLocked && onToggle(type, id)}
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Checkbox
            id={id}
            checked={isChecked}
            onCheckedChange={() => !isLocked && onToggle(type, id)}
            disabled={isLocked}
            className="h-4 w-4 border-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          {isLocked && (
            <Lock className="absolute -top-1 -right-1 h-3 w-3 text-blue-400" />
          )}
        </div>
        <Label
          htmlFor={id}
          className={`text-sm cursor-pointer transition-colors ${
            isChecked
              ? 'text-white font-medium'
              : 'text-slate-200 group-hover:text-white'
          } ${isLocked ? 'cursor-not-allowed' : ''}`}
        >
          {title}
          {isLocked && <span className="ml-2 text-xs text-blue-400">(Locked)</span>}
        </Label>
      </div>
      {count && (
        <span className={`text-xs px-2 py-1 rounded transition-colors ${
          isChecked
            ? 'text-red-100 bg-blue-500'
            : 'text-slate-400 bg-slate-700 group-hover:bg-slate-600'
        }`}>
          {count}
        </span>
      )}
    </div>
  );
};

const ProductListingLayout = ({ 
  lockedCategoryId = null, 
  lockedPlatformId = null,
  pageTitle = "Products",
  defaultCategoryId = null,
  defaultSubCategoryId = null,
}) => {
  const STATIC_FILTER_QUERY_OPTIONS = {
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  };
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [search, setSearch] = useState(searchParams.get('search') || searchParams.get('q') || '');

  const trimmedSearch = search.trim();
  useSEO({
    title: trimmedSearch
      ? `Search: ${trimmedSearch} | DGMARQ`
      : `${pageTitle} | DGMARQ`,
    description: trimmedSearch
      ? `Search results for "${trimmedSearch}" on DGMARQ marketplace.`
      : `Browse ${pageTitle} on DGMARQ marketplace. Find great deals with instant delivery.`,
    canonical: location.pathname,
    useDefaults: false,
  });
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [layout, setLayout] = useState(searchParams.get('layout') || 'listing');
  const [checkboxFilters, setCheckboxFilters] = useState(() => {
    const categoryFromUrl = searchParams.get('categoryId')?.split(',').filter(Boolean) ||
      (searchParams.get('category') ? [searchParams.get('category')] : []);
    const categoryId = lockedCategoryId 
      ? [lockedCategoryId] 
      : categoryFromUrl;
    
    if (defaultCategoryId && !categoryId.length && !lockedCategoryId) {
      categoryId.push(defaultCategoryId);
    }

    const initial = {
      categoryId,
      subCategoryId: searchParams.get('subCategoryId')?.split(',').filter(Boolean) || [],
      region: searchParams.get('regionCode')?.split(',').filter(Boolean) || [],
      platform: lockedPlatformId 
        ? [lockedPlatformId]
        : (searchParams.get('platform')?.split(',').filter(Boolean) || []),
      device: searchParams.get('device')?.split(',').filter(Boolean) || [],
      type: searchParams.get('type')?.split(',').filter(Boolean) || [],
      genre: searchParams.get('genre')?.split(',').filter(Boolean) || [],
      theme: searchParams.get('theme')?.split(',').filter(Boolean) || [],
      mode: searchParams.get('mode')?.split(',').filter(Boolean) || [],
    };

    if (defaultSubCategoryId && !initial.subCategoryId.includes(defaultSubCategoryId)) {
      initial.subCategoryId.push(defaultSubCategoryId);
    }

    return initial;
  });

  const effectiveCategoryIds = useMemo(() => {
    if (lockedCategoryId) return [lockedCategoryId];
    if (checkboxFilters.categoryId.length > 0) return checkboxFilters.categoryId;
    if (defaultCategoryId) return [defaultCategoryId];
    return [];
  }, [lockedCategoryId, checkboxFilters.categoryId, defaultCategoryId]);

  const effectiveSubCategoryIds = useMemo(() => {
    if (!defaultSubCategoryId) return checkboxFilters.subCategoryId;
    if (checkboxFilters.subCategoryId.includes(defaultSubCategoryId)) return checkboxFilters.subCategoryId;
    return [...checkboxFilters.subCategoryId, defaultSubCategoryId];
  }, [checkboxFilters.subCategoryId, defaultSubCategoryId]);

  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [inStock, setInStock] = useState(searchParams.get('inStock') === 'true');
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    subcategories: true,
    regions: true,
    platforms: true,
    devices: true,
    types: true,
    genres: true,
    themes: true,
    modes: true,
  });

  const [searchTerms, setSearchTerms] = useState({
    regions: '',
    categories: '',
    subcategories: '',
    platforms: '',
    devices: '',
    types: '',
    genres: '',
    themes: '',
    modes: '',
  });

  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 500);

  const { data: lockedCategoryData } = useQuery({
    queryKey: ['category', lockedCategoryId],
    queryFn: async () => {
      if (!lockedCategoryId) return null;
      const response = await categoryAPI.getCategoryById(lockedCategoryId);
      return response.data.data;
    },
    enabled: !!lockedCategoryId,
  });

  const { data: platformsData } = useQuery({
    queryKey: ['platforms', 'all'],
    queryFn: async () => {
      const response = await platformAPI.getAllPlatforms({ isActive: true, limit: 100 });
      return response.data.data;
    },
    ...STATIC_FILTER_QUERY_OPTIONS,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async () => {
      const response = await categoryAPI.getCategories({ isActive: true, limit: 100 });
      return response.data.data;
    },
    ...STATIC_FILTER_QUERY_OPTIONS,
  });

  const { data: subcategoriesData } = useQuery({
    queryKey: ['subcategories', lockedCategoryId || effectiveCategoryIds],
    queryFn: async () => {
      const categoryIds = lockedCategoryId
        ? [lockedCategoryId]
        : effectiveCategoryIds;
      
      if (!categoryIds.length) return { docs: [] };
      
      const subcategoryPromises = categoryIds.map(categoryId =>
        subcategoryAPI.getSubcategoriesByCategoryId(categoryId, { limit: 100 })
          .then(res => res.data.data?.docs || [])
          .catch(() => [])
      );
      
      const allSubcategories = await Promise.all(subcategoryPromises);
      const uniqueSubcategories = Array.from(
        new Map(
          allSubcategories.flat().map(sub => [sub._id, sub])
        ).values()
      );
      
      return { docs: uniqueSubcategories };
    },
    enabled: !!(lockedCategoryId || effectiveCategoryIds.length > 0),
  });

  const { data: devicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await deviceAPI.getDevices({ limit: 100, isActive: true });
      return response.data.data;
    },
    ...STATIC_FILTER_QUERY_OPTIONS,
  });

  const { data: typesData } = useQuery({
    queryKey: ['types'],
    queryFn: async () => {
      const response = await typeAPI.getAllTypes({ limit: 100 });
      return response.data.data;
    },
    ...STATIC_FILTER_QUERY_OPTIONS,
  });

  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      const response = await genreAPI.getGenres({ limit: 100 });
      return response.data.data;
    },
    ...STATIC_FILTER_QUERY_OPTIONS,
  });

  const { data: themesData } = useQuery({
    queryKey: ['themes'],
    queryFn: async () => {
      const response = await themeAPI.getThemes({ limit: 100 });
      return response.data.data;
    },
    ...STATIC_FILTER_QUERY_OPTIONS,
  });

  const { data: modesData } = useQuery({
    queryKey: ['modes'],
    queryFn: async () => {
      const response = await modeAPI.getModes({ limit: 100 });
      return response.data.data;
    },
    ...STATIC_FILTER_QUERY_OPTIONS,
  });

  const categories = useMemo(() => {
    if (!categoriesData?.docs) return [];
    return categoriesData.docs.map(cat => ({
      _id: cat._id,
      title: cat.name,
      count: null,
    }));
  }, [categoriesData]);

  const subcategories = useMemo(() => {
    if (!subcategoriesData?.docs) return [];
    return subcategoriesData.docs.map(subcat => ({
      _id: subcat._id,
      title: subcat.name,
      count: null,
    }));
  }, [subcategoriesData]);

  // Activation-region presets (Europe, Asia, Global, …) — a buyer filters to
  // products whose offers can be activated in that region. The `_id` is the
  // preset CODE the backend filters on (offerRegionCodes), not a Mongo id.
  const regions = useMemo(
    () => REGION_PRESETS.map((r) => ({ _id: r.code, title: r.name, count: null })),
    []
  );

  const platforms = useMemo(() => {
    if (!platformsData?.platforms) return [];
    return platformsData.platforms
      .filter(p => p.isActive !== false)
      .map(platform => ({
        _id: platform._id,
        title: platform.name,
        count: null,
      }));
  }, [platformsData]);

  const devices = useMemo(() => {
    if (!devicesData?.docs) return [];
    return devicesData.docs.map(device => ({
      _id: device._id,
      title: device.name,
      count: null,
    }));
  }, [devicesData]);

  const types = useMemo(() => {
    if (!typesData?.docs) return [];
    return typesData.docs.map(type => ({
      _id: type._id,
      title: type.name,
      count: null,
    }));
  }, [typesData]);

  const genres = useMemo(() => {
    if (!genresData?.docs) return [];
    return genresData.docs.map(genre => ({
      _id: genre._id,
      title: genre.name,
      count: null,
    }));
  }, [genresData]);

  const themes = useMemo(() => {
    if (!themesData?.docs) return [];
    return themesData.docs.map(theme => ({
      _id: theme._id,
      title: theme.name,
      count: null,
    }));
  }, [themesData]);

  const modes = useMemo(() => {
    if (!modesData?.docs) return [];
    return modesData.docs.map(mode => ({
      _id: mode._id,
      title: mode.name,
      count: null,
    }));
  }, [modesData]);

  const productQueryParams = useMemo(() => {
    const params = {
      page,
      limit: 12,
      status: 'active',
    };

    if (effectiveCategoryIds.length > 0) {
      params.categoryId = effectiveCategoryIds.join(',');
    }

    if (lockedPlatformId) {
      params.platform = lockedPlatformId;
    } else if (checkboxFilters.platform.length > 0) {
      params.platform = checkboxFilters.platform.join(',');
    }

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
      // Use the SAME index-backed prefix search the header typeahead uses, so
      // pressing Enter on "fortn" returns the same Fortnite results the
      // suggestions showed (no suggestions -> empty-results-page mismatch).
      params.searchMode = 'prefix';
    }

    if (minPrice) {
      params.minPrice = parseFloat(minPrice);
    }

    if (maxPrice) {
      params.maxPrice = parseFloat(maxPrice);
    }

    if (effectiveSubCategoryIds.length > 0) {
      params.subCategoryId = effectiveSubCategoryIds.join(',');
    }

    if (checkboxFilters.region.length > 0) {
      params.regionCode = checkboxFilters.region.join(',');
    }

    if (checkboxFilters.device.length > 0) {
      params.device = checkboxFilters.device.join(',');
    }

    if (checkboxFilters.type.length > 0) {
      params.type = checkboxFilters.type.join(',');
    }

    if (checkboxFilters.genre.length > 0) {
      params.genre = checkboxFilters.genre.join(',');
    }

    if (checkboxFilters.theme.length > 0) {
      params.theme = checkboxFilters.theme.join(',');
    }

    if (checkboxFilters.mode.length > 0) {
      params.mode = checkboxFilters.mode.join(',');
    }

    if (inStock) {
      params.inStock = 'true';
    }

    if (sortBy) {
      params.sort = sortBy;
    }

    return params;
  }, [
    page,
    lockedPlatformId,
    effectiveCategoryIds,
    effectiveSubCategoryIds,
    checkboxFilters.platform,
    checkboxFilters.region,
    checkboxFilters.device,
    checkboxFilters.type,
    checkboxFilters.genre,
    checkboxFilters.theme,
    checkboxFilters.mode,
    debouncedSearch,
    minPrice,
    maxPrice,
    inStock,
    sortBy,
  ]);

  const { data: productsData, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['products-listing', productQueryParams],
    queryFn: async () => {
      const response = await productAPI.getProducts(productQueryParams);
      return response.data.data;
    },
    enabled: true,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    const params = new URLSearchParams();
    
    if (page > 1) params.set('page', page.toString());
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    
    const categoryIds = effectiveCategoryIds;
    
    if (categoryIds.length > 0) {
      params.set('categoryId', categoryIds.join(','));
    }
    
    if (effectiveSubCategoryIds.length > 0) params.set('subCategoryId', effectiveSubCategoryIds.join(','));
    if (!lockedPlatformId && checkboxFilters.platform.length > 0) params.set('platform', checkboxFilters.platform.join(','));
    if (checkboxFilters.region.length > 0) params.set('regionCode', checkboxFilters.region.join(','));
    if (checkboxFilters.device.length > 0) params.set('device', checkboxFilters.device.join(','));
    if (checkboxFilters.type.length > 0) params.set('type', checkboxFilters.type.join(','));
    if (checkboxFilters.genre.length > 0) params.set('genre', checkboxFilters.genre.join(','));
    if (checkboxFilters.theme.length > 0) params.set('theme', checkboxFilters.theme.join(','));
    if (checkboxFilters.mode.length > 0) params.set('mode', checkboxFilters.mode.join(','));
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (inStock) params.set('inStock', 'true');
    if (layout !== 'listing') params.set('layout', layout);

    setSearchParams(params, { replace: true });
  }, [
    page,
    debouncedSearch,
    minPrice,
    maxPrice,
    effectiveCategoryIds,
    effectiveSubCategoryIds,
    checkboxFilters.platform,
    checkboxFilters.region,
    checkboxFilters.device,
    checkboxFilters.type,
    checkboxFilters.genre,
    checkboxFilters.theme,
    checkboxFilters.mode,
    sortBy,
    inStock,
    layout,
    lockedCategoryId,
    lockedPlatformId,
    setSearchParams,
  ]);

  const products = productsData?.docs || [];
  const totalPages = productsData?.totalPages || 0;
  const totalDocs = productsData?.totalDocs || 0;

  const handleCheckboxChange = useCallback((type, id) => {
    if (lockedPlatformId && type === 'platform') return;
    
    if (lockedCategoryId && type === 'categoryId' && id === lockedCategoryId) return;

    setCheckboxFilters(prev => {
      const current = prev[type] || [];
      const isChecked = current.includes(id);
      
      if (lockedCategoryId && type === 'categoryId' && isChecked && id === lockedCategoryId) {
        return prev;
      }
      
      return {
        ...prev,
        [type]: isChecked
          ? current.filter(item => item !== id)
          : [...current, id],
      };
    });
    setPage(1);
  }, [lockedPlatformId, lockedCategoryId]);

  const handleInputChange = useCallback((key, value) => {
    if (key === 'minPrice') setMinPrice(value);
    if (key === 'maxPrice') setMaxPrice(value);
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
    setCheckboxFilters(prev => ({
      ...prev,
      categoryId: lockedCategoryId ? [lockedCategoryId] : [],
      platform: lockedPlatformId ? [lockedPlatformId] : [],
      subCategoryId: [],
      region: [],
      device: [],
      type: [],
      genre: [],
      theme: [],
      mode: [],
    }));
    setSortBy('newest');
    setInStock(false);
    setPage(1);
  }, [lockedCategoryId, lockedPlatformId]);

  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handleSearch = useCallback((section, value) => {
    setSearchTerms(prev => ({
      ...prev,
      [section]: value,
    }));
  }, []);

  const filterItems = useCallback((items, searchTerm) => {
    if (!searchTerm) return items;
    return items.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, []);

  // Resolves the checked state for a given filter type/id so the hoisted
  // CheckboxItem stays presentational (no closure over parent state).
  const isItemChecked = useCallback((type, id) => {
    if (type === 'categoryId') return effectiveCategoryIds.includes(id);
    if (type === 'subCategoryId') return effectiveSubCategoryIds.includes(id);
    return checkboxFilters[type]?.includes(id) || false;
  }, [effectiveCategoryIds, effectiveSubCategoryIds, checkboxFilters]);

  const filteredCategories = useMemo(() => filterItems(categories, searchTerms.categories), [categories, searchTerms.categories, filterItems]);
  const filteredSubcategories = useMemo(() => filterItems(subcategories, searchTerms.subcategories), [subcategories, searchTerms.subcategories, filterItems]);
  const filteredRegions = useMemo(() => filterItems(regions, searchTerms.regions), [regions, searchTerms.regions, filterItems]);
  const filteredPlatforms = useMemo(() => filterItems(platforms, searchTerms.platforms), [platforms, searchTerms.platforms, filterItems]);
  const filteredDevices = useMemo(() => filterItems(devices, searchTerms.devices), [devices, searchTerms.devices, filterItems]);
  const filteredTypes = useMemo(() => filterItems(types, searchTerms.types), [types, searchTerms.types, filterItems]);
  const filteredGenres = useMemo(() => filterItems(genres, searchTerms.genres), [genres, searchTerms.genres, filterItems]);
  const filteredThemes = useMemo(() => filterItems(themes, searchTerms.themes), [themes, searchTerms.themes, filterItems]);
  const filteredModes = useMemo(() => filterItems(modes, searchTerms.modes), [modes, searchTerms.modes, filterItems]);

  const displayedCategories = useMemo(() => (
    expandedSections.categories ? filteredCategories : filteredCategories.slice(0, 5)
  ), [expandedSections.categories, filteredCategories]);

  const displayedSubcategories = useMemo(() => (
    expandedSections.subcategories ? filteredSubcategories : filteredSubcategories.slice(0, 5)
  ), [expandedSections.subcategories, filteredSubcategories]);

  const displayedRegions = useMemo(() => (
    expandedSections.regions ? filteredRegions : filteredRegions.slice(0, 5)
  ), [expandedSections.regions, filteredRegions]);

  const displayedPlatforms = useMemo(() => (
    expandedSections.platforms ? filteredPlatforms : filteredPlatforms.slice(0, 5)
  ), [expandedSections.platforms, filteredPlatforms]);

  const displayedDevices = useMemo(() => (
    expandedSections.devices ? filteredDevices : filteredDevices.slice(0, 5)
  ), [expandedSections.devices, filteredDevices]);

  const displayedTypes = useMemo(() => (
    expandedSections.types ? filteredTypes : filteredTypes.slice(0, 5)
  ), [expandedSections.types, filteredTypes]);

  const displayedGenres = useMemo(() => (
    expandedSections.genres ? filteredGenres : filteredGenres.slice(0, 5)
  ), [expandedSections.genres, filteredGenres]);

  const displayedThemes = useMemo(() => (
    expandedSections.themes ? filteredThemes : filteredThemes.slice(0, 5)
  ), [expandedSections.themes, filteredThemes]);

  const displayedModes = useMemo(() => (
    expandedSections.modes ? filteredModes : filteredModes.slice(0, 5)
  ), [expandedSections.modes, filteredModes]);
  const initialLoading = isLoading && !productsData;
  const skeletonKeys = [1, 2, 3, 4, 5, 6];

  const hasActiveFilters =
    search ||
    minPrice ||
    maxPrice ||
    (effectiveCategoryIds.length > 0 && !lockedCategoryId) ||
    effectiveSubCategoryIds.length > 0 ||
    (checkboxFilters.platform.length > 0 && !lockedPlatformId) ||
    checkboxFilters.region.length > 0 ||
    checkboxFilters.device.length > 0 ||
    checkboxFilters.type.length > 0 ||
    checkboxFilters.genre.length > 0 ||
    checkboxFilters.theme.length > 0 ||
    checkboxFilters.mode.length > 0 ||
    inStock ||
    sortBy !== 'newest';

  const displayTitle = lockedCategoryData?.name || pageTitle;
  const displayItemCount = totalDocs > 0 ? `${totalDocs} items` : '';

  return (
    <div className="min-h-screen bg-[#0E092C] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{displayTitle}</h1>
          {displayItemCount && (
            <p className="text-gray-400">{displayItemCount}</p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6 relative">
          {/* Mobile Filter Button */}
          <div className="md:hidden absolute -top-20 right-4 z-10">
            <Button onClick={() => setIsOpen(true)} className="bg-blue-600 text-white">
              Filters
            </Button>
          </div>

          {/* Left Sidebar - Filters (Desktop) */}
          <aside className="hidden md:block w-80 space-y-4">
            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full mb-4"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}

            {/* Categories */}
            <FilterSection
              title="Categories"
              section="categories"
              hasSearch={categories.length > 10}
              itemCount={effectiveCategoryIds.length || 0}
              isExpanded={expandedSections.categories}
              searchValue={searchTerms.categories}
              onSearchChange={handleSearch}
              onToggleSection={toggleSection}
            >
              {displayedCategories.map(cat => {
                const isLocked = lockedCategoryId === cat._id;
                return (
                  <CheckboxItem
                    key={cat._id}
                    id={cat._id}
                    title={cat.title}
                    type="categoryId"
                    count={cat.count}
                    isLocked={isLocked}
                    isChecked={isItemChecked('categoryId', cat._id)}
                    onToggle={handleCheckboxChange}
                  />
                );
              })}
            </FilterSection>

            {/* Subcategories */}
            {subcategories.length > 0 && (
              <FilterSection
                title="Subcategories"
                section="subcategories"
                hasSearch={subcategories.length > 10}
                itemCount={effectiveSubCategoryIds.length || 0}
                totalItems={filteredSubcategories.length}
                isExpanded={expandedSections.subcategories}
                searchValue={searchTerms.subcategories}
                onSearchChange={handleSearch}
                onToggleSection={toggleSection}
              >
                {displayedSubcategories.map(subcat => (
                  <CheckboxItem
                    key={subcat._id}
                    id={subcat._id}
                    title={subcat.title}
                    type="subCategoryId"
                    count={subcat.count}
                    isChecked={isItemChecked('subCategoryId', subcat._id)}
                    onToggle={handleCheckboxChange}
                  />
                ))}
              </FilterSection>
            )}

            {/* Price Range */}
            <div className="bg-slate-800 rounded-lg overflow-hidden mb-4">
              <div className="bg-[#043086] px-4 py-3">
                <h3 className="text-white font-medium text-sm uppercase tracking-wide">
                  Price (USD)
                </h3>
              </div>
              <div className="p-4 bg-[#06051C]/60">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="From"
                      value={minPrice || ''}
                      onChange={(e) => handleInputChange('minPrice', e.target.value)}
                      className="bg-transparent text-white placeholder-slate-400 focus:border-red-500"
                    />
                  </div>
                  <span className="text-slate-400">—</span>
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="To"
                      value={maxPrice || ''}
                      onChange={(e) => handleInputChange('maxPrice', e.target.value)}
                      className="bg-transparent border-slate-600 text-white placeholder-slate-400 focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="bg-slate-800 rounded-lg overflow-hidden mb-4">
              <div className="bg-[#043086] px-4 py-3">
                <h3 className="text-white font-medium text-sm uppercase tracking-wide">
                  Availability
                </h3>
              </div>
              <div className="p-4 bg-[#052157] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={inStock}
                    onCheckedChange={(checked) => {
                      setInStock(checked);
                      setPage(1);
                    }}
                  />
                  <Label className="text-sm text-slate-200 cursor-pointer">
                    Items In Stock ({totalDocs})
                  </Label>
                </label>
              </div>
            </div>

            {/* Platform */}
            <FilterSection
              title="Platform"
              section="platforms"
              hasSearch={platforms.length > 5}
              itemCount={checkboxFilters.platform?.length || 0}
              totalItems={filteredPlatforms.length}
              isExpanded={expandedSections.platforms}
              searchValue={searchTerms.platforms}
              onSearchChange={handleSearch}
              onToggleSection={toggleSection}
            >
              {displayedPlatforms.map(platform => {
                const isLocked = lockedPlatformId === platform._id;
                return (
                  <CheckboxItem
                    key={platform._id}
                    id={platform._id}
                    title={platform.title}
                    type="platform"
                    count={platform.count}
                    isLocked={isLocked}
                    isChecked={isItemChecked('platform', platform._id)}
                    onToggle={handleCheckboxChange}
                  />
                );
              })}
            </FilterSection>

            {/* Region */}
            <FilterSection
              title="Region"
              section="regions"
              hasSearch={regions.length > 5}
              itemCount={checkboxFilters.region?.length || 0}
              totalItems={filteredRegions.length}
              isExpanded={expandedSections.regions}
              searchValue={searchTerms.regions}
              onSearchChange={handleSearch}
              onToggleSection={toggleSection}
            >
              {displayedRegions.map(region => (
                <CheckboxItem
                  key={region._id}
                  id={region._id}
                  title={region.title}
                  type="region"
                  count={region.count}
                  isChecked={isItemChecked('region', region._id)}
                  onToggle={handleCheckboxChange}
                />
              ))}
            </FilterSection>

            {/* Device */}
            <FilterSection
              title="Device"
              section="devices"
              hasSearch={devices.length > 5}
              itemCount={checkboxFilters.device?.length || 0}
              totalItems={filteredDevices.length}
              isExpanded={expandedSections.devices}
              searchValue={searchTerms.devices}
              onSearchChange={handleSearch}
              onToggleSection={toggleSection}
            >
              {displayedDevices.map(device => (
                <CheckboxItem
                  key={device._id}
                  id={device._id}
                  title={device.title}
                  type="device"
                  count={device.count}
                  isChecked={isItemChecked('device', device._id)}
                  onToggle={handleCheckboxChange}
                />
              ))}
            </FilterSection>

            {/* Type */}
            <FilterSection
              title="Type"
              section="types"
              hasSearch={types.length > 5}
              itemCount={checkboxFilters.type?.length || 0}
              totalItems={filteredTypes.length}
              isExpanded={expandedSections.types}
              searchValue={searchTerms.types}
              onSearchChange={handleSearch}
              onToggleSection={toggleSection}
            >
              {displayedTypes.map(type => (
                <CheckboxItem
                  key={type._id}
                  id={type._id}
                  title={type.title}
                  type="type"
                  count={type.count}
                  isChecked={isItemChecked('type', type._id)}
                  onToggle={handleCheckboxChange}
                />
              ))}
            </FilterSection>

            {/* Genre */}
            {genres.length > 0 && (
              <FilterSection
                title="Genres"
                section="genres"
                hasSearch={genres.length > 5}
                itemCount={checkboxFilters.genre?.length || 0}
                totalItems={filteredGenres.length}
                isExpanded={expandedSections.genres}
                searchValue={searchTerms.genres}
                onSearchChange={handleSearch}
                onToggleSection={toggleSection}
              >
                {displayedGenres.map(genre => (
                  <CheckboxItem
                    key={genre._id}
                    id={genre._id}
                    title={genre.title}
                    type="genre"
                    count={genre.count}
                    isChecked={isItemChecked('genre', genre._id)}
                    onToggle={handleCheckboxChange}
                  />
                ))}
              </FilterSection>
            )}

            {/* Theme */}
            {themes.length > 0 && (
              <FilterSection
                title="Themes"
                section="themes"
                hasSearch={themes.length > 5}
                itemCount={checkboxFilters.theme?.length || 0}
                totalItems={filteredThemes.length}
                isExpanded={expandedSections.themes}
                searchValue={searchTerms.themes}
                onSearchChange={handleSearch}
                onToggleSection={toggleSection}
              >
                {displayedThemes.map(theme => (
                  <CheckboxItem
                    key={theme._id}
                    id={theme._id}
                    title={theme.title}
                    type="theme"
                    count={theme.count}
                    isChecked={isItemChecked('theme', theme._id)}
                    onToggle={handleCheckboxChange}
                  />
                ))}
              </FilterSection>
            )}

            {/* Mode */}
            {modes.length > 0 && (
              <FilterSection
                title="Modes"
                section="modes"
                hasSearch={modes.length > 5}
                itemCount={checkboxFilters.mode?.length || 0}
                totalItems={filteredModes.length}
                isExpanded={expandedSections.modes}
                searchValue={searchTerms.modes}
                onSearchChange={handleSearch}
                onToggleSection={toggleSection}
              >
                {displayedModes.map(mode => (
                  <CheckboxItem
                    key={mode._id}
                    id={mode._id}
                    title={mode.title}
                    type="mode"
                    count={mode.count}
                    isChecked={isItemChecked('mode', mode._id)}
                    onToggle={handleCheckboxChange}
                  />
                ))}
              </FilterSection>
            )}

            {/* Need More Filters */}
            <div className="pt-4">
              <p className="text-sm text-gray-400 text-center">
                Need More Filters? Let Us Know.
              </p>
            </div>
          </aside>

          {/* Mobile Slide-In Drawer */}
          <div
            className={`fixed top-0 right-0 h-full w-80 bg-slate-900 z-50 transform transition-transform duration-300 md:hidden ${
              isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex justify-between items-center p-4 bg-[#043086]">
              <h2 className="text-white font-bold">Filters</h2>
              <button onClick={() => setIsOpen(false)}>
                <X className="text-white" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 h-full">
              {/* Same filter sections as desktop - reuse components */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full mb-4"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}

              <FilterSection
                title="Categories"
                section="categories"
                hasSearch={categories.length > 10}
                itemCount={effectiveCategoryIds.length || 0}
                totalItems={filteredCategories.length}
                isExpanded={expandedSections.categories}
                searchValue={searchTerms.categories}
                onSearchChange={handleSearch}
                onToggleSection={toggleSection}
              >
                {displayedCategories.map(cat => {
                  const isLocked = lockedCategoryId === cat._id;
                  return (
                    <CheckboxItem
                      key={cat._id}
                      id={cat._id}
                      title={cat.title}
                      type="categoryId"
                      count={cat.count}
                      isLocked={isLocked}
                      isChecked={isItemChecked('categoryId', cat._id)}
                      onToggle={handleCheckboxChange}
                    />
                  );
                })}
              </FilterSection>

              {/* Price Range */}
              <div className="bg-slate-800 rounded-lg overflow-hidden mb-4">
                <div className="bg-[#043086] px-4 py-3">
                  <h3 className="text-white font-medium text-sm uppercase tracking-wide">
                    Price (USD)
                  </h3>
                </div>
                <div className="p-4 bg-[#06051C]/60">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="From"
                        value={minPrice || ''}
                        onChange={(e) => handleInputChange('minPrice', e.target.value)}
                        className="bg-transparent text-white placeholder-slate-400 focus:border-red-500"
                      />
                    </div>
                    <span className="text-slate-400">—</span>
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="To"
                        value={maxPrice || ''}
                        onChange={(e) => handleInputChange('maxPrice', e.target.value)}
                        className="bg-transparent border-slate-600 text-white placeholder-slate-400 focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="bg-slate-800 rounded-lg overflow-hidden mb-4">
                <div className="bg-[#043086] px-4 py-3">
                  <h3 className="text-white font-medium text-sm uppercase tracking-wide">
                    Availability
                  </h3>
                </div>
                <div className="p-4 bg-[#052157] space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={inStock}
                      onCheckedChange={(checked) => {
                        setInStock(checked);
                        setPage(1);
                      }}
                    />
                    <Label className="text-sm text-slate-200 cursor-pointer">
                      Items In Stock ({totalDocs})
                    </Label>
                  </label>
                </div>
              </div>

              <FilterSection
                title="Region"
                section="regions"
                hasSearch={regions.length > 5}
                itemCount={checkboxFilters.region?.length || 0}
                totalItems={filteredRegions.length}
                isExpanded={expandedSections.regions}
                searchValue={searchTerms.regions}
                onSearchChange={handleSearch}
                onToggleSection={toggleSection}
              >
                {displayedRegions.map(region => (
                  <CheckboxItem
                    key={region._id}
                    id={region._id}
                    title={region.title}
                    type="region"
                    count={region.count}
                    isChecked={isItemChecked('region', region._id)}
                    onToggle={handleCheckboxChange}
                  />
                ))}
              </FilterSection>

              <FilterSection
                title="Platform"
                section="platforms"
                hasSearch={platforms.length > 5}
                itemCount={checkboxFilters.platform?.length || 0}
                totalItems={filteredPlatforms.length}
                isExpanded={expandedSections.platforms}
                searchValue={searchTerms.platforms}
                onSearchChange={handleSearch}
                onToggleSection={toggleSection}
              >
                {displayedPlatforms.map(platform => {
                  const isLocked = lockedPlatformId === platform._id;
                  return (
                    <CheckboxItem
                      key={platform._id}
                      id={platform._id}
                      title={platform.title}
                      type="platform"
                      count={platform.count}
                      isLocked={isLocked}
                      isChecked={isItemChecked('platform', platform._id)}
                      onToggle={handleCheckboxChange}
                    />
                  );
                })}
              </FilterSection>

              {/* Other filters... */}
            </div>
          </div>

          {/* Right Section - Products */}
          <div className="flex-1">
            {/* Sort and Search Bar */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <Input
                type="text"
                placeholder="Search for products..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="bg-gray-800 border-gray-700 text-white flex-1 max-w-md"
              />
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="name_asc">Name: A to Z</option>
                  <option value="name_desc">Name: Z to A</option>
                </select>
                <div className="flex gap-1 border border-gray-700 rounded-lg overflow-hidden">
                  <Button
                    variant={layout === 'listing' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setLayout('listing')}
                    className="rounded-none"
                  >
                    List
                  </Button>
                  <Button
                    variant={layout === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setLayout('grid')}
                    className="rounded-none"
                  >
                    Grid
                  </Button>
                </div>
              </div>
            </div>

            {/* Products List */}
            {initialLoading ? (
              <div className={layout === 'listing' ? 'space-y-4' : 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6'}>
                {skeletonKeys.map((skeletonKey) => (
                  <Card key={skeletonKey} className="p-4 space-y-3 bg-[#041536]">
                    <Skeleton className="h-40 w-full rounded-md" />
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </Card>
                ))}
              </div>
            ) : isError ? (
              <ErrorMessage
                message={error?.response?.data?.message || 'Failed to load products'}
              />
            ) : products.length > 0 ? (
              <>
                {isFetching && (
                  <p className="mb-4 text-sm text-gray-400">Updating products...</p>
                )}
                {layout === 'listing' ? (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <CategoryProduct key={product._id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 items-stretch">
                    {products.map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-white px-4">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-400 text-lg mb-2">No products found</p>
                <p className="text-gray-500 text-sm">
                  Try adjusting your filters or search terms
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListingLayout;
