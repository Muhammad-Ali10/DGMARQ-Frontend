import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productAPI, platformAPI, categoryAPI, subcategoryAPI, regionAPI, deviceAPI, typeAPI, genreAPI, themeAPI, modeAPI } from '../../services/api';
import ProductCard from '../ProductCard';
import ProductVerticalCard from '../ProductVerticalCard';
import CategoryProduct from '../CategoryProduct';
import { Loading, ErrorMessage } from '../ui/loading';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Skeleton } from '../ui/skeleton';
import { Card } from '../ui/card';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X, Search, Lock } from 'lucide-react';

// useDebounce hook
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

const ProductListingLayout = ({ 
  lockedCategoryId = null, 
  lockedPlatformId = null,
  pageTitle = "Products",
  defaultCategoryId = null 
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter states from URL params
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [layout, setLayout] = useState(searchParams.get('layout') || 'listing');
  
  // Checkbox filters - if lockedCategoryId or defaultCategoryId exists, initialize with it (but don't lock)
  const [checkboxFilters, setCheckboxFilters] = useState(() => {
    const categoryId = lockedCategoryId 
      ? [lockedCategoryId] 
      : (searchParams.get('categoryId')?.split(',').filter(Boolean) || []);
    
    if (defaultCategoryId && !categoryId.length) {
      categoryId.push(defaultCategoryId);
    }

    return {
      categoryId,
      subCategoryId: searchParams.get('subCategoryId')?.split(',').filter(Boolean) || [],
      region: searchParams.get('region')?.split(',').filter(Boolean) || [],
      platform: lockedPlatformId 
        ? [lockedPlatformId]
        : (searchParams.get('platform')?.split(',').filter(Boolean) || []),
      device: searchParams.get('device')?.split(',').filter(Boolean) || [],
      type: searchParams.get('type')?.split(',').filter(Boolean) || [],
      genre: searchParams.get('genre')?.split(',').filter(Boolean) || [],
      theme: searchParams.get('theme')?.split(',').filter(Boolean) || [],
      mode: searchParams.get('mode')?.split(',').filter(Boolean) || [],
    };
  });

  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [inStock, setInStock] = useState(searchParams.get('inStock') === 'true');

  // Collapsible filter sections
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

  // Debounced search
  const debouncedSearch = useDebounce(search, 500);

  // Fetch category info if locked
  const { data: lockedCategoryData } = useQuery({
    queryKey: ['category', lockedCategoryId],
    queryFn: async () => {
      if (!lockedCategoryId) return null;
      const response = await categoryAPI.getCategoryById(lockedCategoryId);
      return response.data.data;
    },
    enabled: !!lockedCategoryId,
  });

  // Fetch all platforms
  const { data: platformsData } = useQuery({
    queryKey: ['platforms', 'all'],
    queryFn: async () => {
      const response = await platformAPI.getAllPlatforms({ isActive: true, limit: 100 });
      return response.data.data;
    },
  });

  // Fetch all categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async () => {
      const response = await categoryAPI.getCategories({ isActive: true, limit: 100 });
      return response.data.data;
    },
  });

  // Fetch subcategories for all selected categories
  const { data: subcategoriesData } = useQuery({
    queryKey: ['subcategories', lockedCategoryId || checkboxFilters.categoryId],
    queryFn: async () => {
      const categoryIds = lockedCategoryId 
        ? [lockedCategoryId] 
        : checkboxFilters.categoryId;
      
      if (!categoryIds.length) return { docs: [] };
      
      // Fetch subcategories for all selected categories
      const subcategoryPromises = categoryIds.map(categoryId =>
        subcategoryAPI.getSubcategoriesByCategoryId(categoryId, { limit: 100 })
          .then(res => res.data.data?.docs || [])
          .catch(() => [])
      );
      
      const allSubcategories = await Promise.all(subcategoryPromises);
      // Flatten and deduplicate subcategories
      const uniqueSubcategories = Array.from(
        new Map(
          allSubcategories.flat().map(sub => [sub._id, sub])
        ).values()
      );
      
      return { docs: uniqueSubcategories };
    },
    enabled: !!(lockedCategoryId || checkboxFilters.categoryId.length > 0),
  });

  // Fetch filter options
  const { data: regionsData } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const response = await regionAPI.getRegions({ limit: 100 });
      return response.data.data;
    },
  });

  const { data: devicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await deviceAPI.getDevices({ limit: 100, isActive: true });
      return response.data.data;
    },
  });

  const { data: typesData } = useQuery({
    queryKey: ['types'],
    queryFn: async () => {
      const response = await typeAPI.getAllTypes({ limit: 100 });
      return response.data.data;
    },
  });

  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      const response = await genreAPI.getGenres({ limit: 100 });
      return response.data.data;
    },
  });

  const { data: themesData } = useQuery({
    queryKey: ['themes'],
    queryFn: async () => {
      const response = await themeAPI.getThemes({ limit: 100 });
      return response.data.data;
    },
  });

  const { data: modesData } = useQuery({
    queryKey: ['modes'],
    queryFn: async () => {
      const response = await modeAPI.getModes({ limit: 100 });
      return response.data.data;
    },
  });

  // Prepare filter options
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

  const regions = useMemo(() => {
    if (!regionsData?.docs) return [];
    return regionsData.docs.map(region => ({
      _id: region._id,
      title: `For ${region.name} Currency Only`,
      count: null,
    }));
  }, [regionsData]);

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

  // Build query params for products
  const productQueryParams = useMemo(() => {
    const params = {
      page,
      limit: 12,
      status: 'active',
    };

    // Include all selected categories (multiple selection support)
    if (checkboxFilters.categoryId.length > 0) {
      params.categoryId = checkboxFilters.categoryId.join(',');
    } else if (lockedCategoryId) {
      // If lockedCategoryId exists but not in filters, use it (for initial load)
      params.categoryId = lockedCategoryId;
    }

    // Include locked platform if exists, otherwise use all selected platforms
    if (lockedPlatformId) {
      params.platform = lockedPlatformId;
    } else if (checkboxFilters.platform.length > 0) {
      params.platform = checkboxFilters.platform.join(',');
    }

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    if (minPrice) {
      params.minPrice = parseFloat(minPrice);
    }

    if (maxPrice) {
      params.maxPrice = parseFloat(maxPrice);
    }

    // Support multiple selections for all filters
    if (checkboxFilters.subCategoryId.length > 0) {
      params.subCategoryId = checkboxFilters.subCategoryId.join(',');
    }

    if (checkboxFilters.region.length > 0) {
      params.region = checkboxFilters.region.join(',');
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
    lockedCategoryId,
    lockedPlatformId,
    checkboxFilters,
    debouncedSearch,
    minPrice,
    maxPrice,
    inStock,
    sortBy,
  ]);

  // Fetch products
  const { data: productsData, isLoading, isError, error } = useQuery({
    queryKey: ['products-listing', productQueryParams],
    queryFn: async () => {
      const response = await productAPI.getProducts(productQueryParams);
      return response.data.data;
    },
    enabled: true,
  });

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (page > 1) params.set('page', page.toString());
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    
    // Add categoryId to URL params
    if (checkboxFilters.categoryId.length > 0) {
      params.set('categoryId', checkboxFilters.categoryId.join(','));
    }
    
    if (checkboxFilters.subCategoryId.length > 0) params.set('subCategoryId', checkboxFilters.subCategoryId.join(','));
    if (!lockedPlatformId && checkboxFilters.platform.length > 0) params.set('platform', checkboxFilters.platform.join(','));
    if (checkboxFilters.region.length > 0) params.set('region', checkboxFilters.region.join(','));
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
    checkboxFilters,
    sortBy,
    inStock,
    layout,
    lockedCategoryId,
    lockedPlatformId,
    setSearchParams,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, minPrice, maxPrice, checkboxFilters, inStock, sortBy]);

  const products = productsData?.docs || [];
  const totalPages = productsData?.totalPages || 0;
  const totalDocs = productsData?.totalDocs || 0;

  const handleCheckboxChange = (type, id) => {
    // Prevent changing locked platform filter only
    if (lockedPlatformId && type === 'platform') return;

    setCheckboxFilters(prev => {
      const current = prev[type] || [];
      const isChecked = current.includes(id);
      return {
        ...prev,
        [type]: isChecked
          ? current.filter(item => item !== id)
          : [...current, id],
      };
    });
  };

  const handleInputChange = (key, value) => {
    if (key === 'minPrice') setMinPrice(value);
    if (key === 'maxPrice') setMaxPrice(value);
  };

  const clearFilters = () => {
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
    setCheckboxFilters(prev => ({
      ...prev,
      // Keep locked platform filter only
      categoryId: [], // Category is not locked, so clear it
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
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSearch = (section, value) => {
    setSearchTerms(prev => ({
      ...prev,
      [section]: value,
    }));
  };

  const filterItems = (items, searchTerm) => {
    if (!searchTerm) return items;
    return items.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Filter sections component
  const FilterSection = ({ title, children, section, hasSearch = false, itemCount, totalItems = 0 }) => {
    const hasMoreItems = totalItems > 5;
    const isExpanded = expandedSections[section];
    
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
                value={searchTerms[section] || ''}
                onChange={(e) => handleSearch(section, e.target.value)}
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
                toggleSection(section);
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

  // Checkbox item component with lock support (only for platform)
  const CheckboxItem = ({ id, title, type, count, isLocked = false }) => {
    const isChecked = checkboxFilters[type]?.includes(id);
    return (
      <div
        className={`flex items-center justify-between py-3 px-2 cursor-pointer bg-[#052157] transition-all duration-200 group ${
          isChecked
            ? 'bg-[#06051C]/60 hover:bg-[#06051C]'
            : 'hover:bg-slate-700'
        } ${isLocked ? 'opacity-75' : ''}`}
        onClick={() => !isLocked && handleCheckboxChange(type, id)}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Checkbox
              id={id}
              checked={isChecked}
              onCheckedChange={() => !isLocked && handleCheckboxChange(type, id)}
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

  const filteredCategories = filterItems(categories, searchTerms.categories);
  const filteredSubcategories = filterItems(subcategories, searchTerms.subcategories);
  const filteredRegions = filterItems(regions, searchTerms.regions);
  const filteredPlatforms = filterItems(platforms, searchTerms.platforms);
  const filteredDevices = filterItems(devices, searchTerms.devices);
  const filteredTypes = filterItems(types, searchTerms.types);
  const filteredGenres = filterItems(genres, searchTerms.genres);
  const filteredThemes = filterItems(themes, searchTerms.themes);
  const filteredModes = filterItems(modes, searchTerms.modes);

  const displayedCategories = expandedSections.categories
    ? filteredCategories
    : filteredCategories.slice(0, 5);

  const displayedSubcategories = expandedSections.subcategories
    ? filteredSubcategories
    : filteredSubcategories.slice(0, 5);

  const displayedRegions = expandedSections.regions
    ? filteredRegions
    : filteredRegions.slice(0, 5);

  const displayedPlatforms = expandedSections.platforms
    ? filteredPlatforms
    : filteredPlatforms.slice(0, 5);

  const displayedDevices = expandedSections.devices
    ? filteredDevices
    : filteredDevices.slice(0, 5);

  const displayedTypes = expandedSections.types
    ? filteredTypes
    : filteredTypes.slice(0, 5);

  const displayedGenres = expandedSections.genres
    ? filteredGenres
    : filteredGenres.slice(0, 5);

  const displayedThemes = expandedSections.themes
    ? filteredThemes
    : filteredThemes.slice(0, 5);

  const displayedModes = expandedSections.modes
    ? filteredModes
    : filteredModes.slice(0, 5);

  const hasActiveFilters =
    search ||
    minPrice ||
    maxPrice ||
    checkboxFilters.categoryId.length > 0 ||
    checkboxFilters.subCategoryId.length > 0 ||
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
              itemCount={checkboxFilters.categoryId?.length || 0}
            >
              {displayedCategories.map(cat => (
                <CheckboxItem
                  key={cat._id}
                  id={cat._id}
                  title={cat.title}
                  type="categoryId"
                  count={cat.count}
                />
              ))}
            </FilterSection>

            {/* Subcategories */}
            {subcategories.length > 0 && (
              <FilterSection
                title="Subcategories"
                section="subcategories"
                hasSearch={subcategories.length > 10}
                itemCount={checkboxFilters.subCategoryId?.length || 0}
                totalItems={filteredSubcategories.length}
              >
                {displayedSubcategories.map(subcat => (
                  <CheckboxItem
                    key={subcat._id}
                    id={subcat._id}
                    title={subcat.title}
                    type="subCategoryId"
                    count={subcat.count}
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
                    onCheckedChange={(checked) => setInStock(checked)}
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
            >
              {displayedRegions.map(region => (
                <CheckboxItem
                  key={region._id}
                  id={region._id}
                  title={region.title}
                  type="region"
                  count={region.count}
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
            >
              {displayedDevices.map(device => (
                <CheckboxItem
                  key={device._id}
                  id={device._id}
                  title={device.title}
                  type="device"
                  count={device.count}
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
            >
              {displayedTypes.map(type => (
                <CheckboxItem
                  key={type._id}
                  id={type._id}
                  title={type.title}
                  type="type"
                  count={type.count}
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
              >
                {displayedGenres.map(genre => (
                  <CheckboxItem
                    key={genre._id}
                    id={genre._id}
                    title={genre.title}
                    type="genre"
                    count={genre.count}
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
              >
                {displayedThemes.map(theme => (
                  <CheckboxItem
                    key={theme._id}
                    id={theme._id}
                    title={theme.title}
                    type="theme"
                    count={theme.count}
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
              >
                {displayedModes.map(mode => (
                  <CheckboxItem
                    key={mode._id}
                    id={mode._id}
                    title={mode.title}
                    type="mode"
                    count={mode.count}
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
                itemCount={checkboxFilters.categoryId?.length || 0}
                totalItems={filteredCategories.length}
              >
                {displayedCategories.map(cat => (
                  <CheckboxItem
                    key={cat._id}
                    id={cat._id}
                    title={cat.title}
                    type="categoryId"
                    count={cat.count}
                  />
                ))}
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
                      onCheckedChange={(checked) => setInStock(checked)}
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
              >
                {displayedRegions.map(region => (
                  <CheckboxItem
                    key={region._id}
                    id={region._id}
                    title={region.title}
                    type="region"
                    count={region.count}
                  />
                ))}
              </FilterSection>

              <FilterSection
                title="Platform"
                section="platforms"
                hasSearch={platforms.length > 5}
                itemCount={checkboxFilters.platform?.length || 0}
                totalItems={filteredPlatforms.length}
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
                onChange={(e) => setSearch(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white flex-1 max-w-md"
              />
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
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
            {isLoading ? (
              <div className={layout === 'listing' ? 'space-y-4' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="p-4 space-y-3 bg-[#041536]">
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
                {layout === 'listing' ? (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <CategoryProduct key={product._id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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
