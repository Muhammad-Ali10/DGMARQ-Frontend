import { useState, useEffect, useRef } from "react";
import { getGuestCartCount } from "../../utils/guestCart";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import {
  Search,
  Heart,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  Globe,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

const USFlag = () => (
  <svg
    width="20"
    height="15"
    viewBox="0 0 20 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    <rect width="20" height="15" fill="#B22234" />
    <path d="M0 0L20 15M20 0L0 15" stroke="#3C3B6E" strokeWidth="0.5" />
    <rect x="0" y="0" width="20" height="8" fill="#3C3B6E" />
    <circle cx="3" cy="2" r="0.5" fill="#FFFFFF" />
    <circle cx="5" cy="2" r="0.5" fill="#FFFFFF" />
    <circle cx="7" cy="2" r="0.5" fill="#FFFFFF" />
    <circle cx="9" cy="2" r="0.5" fill="#FFFFFF" />
    <circle cx="11" cy="2" r="0.5" fill="#FFFFFF" />
    <circle cx="13" cy="2" r="0.5" fill="#FFFFFF" />
    <circle cx="15" cy="2" r="0.5" fill="#FFFFFF" />
    <circle cx="17" cy="2" r="0.5" fill="#FFFFFF" />
    <circle cx="4" cy="4" r="0.5" fill="#FFFFFF" />
    <circle cx="6" cy="4" r="0.5" fill="#FFFFFF" />
    <circle cx="8" cy="4" r="0.5" fill="#FFFFFF" />
    <circle cx="10" cy="4" r="0.5" fill="#FFFFFF" />
    <circle cx="12" cy="4" r="0.5" fill="#FFFFFF" />
    <circle cx="14" cy="4" r="0.5" fill="#FFFFFF" />
    <circle cx="16" cy="4" r="0.5" fill="#FFFFFF" />
  </svg>
);
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  categoryAPI,
  subcategoryAPI,
  productAPI,
  cartAPI,
  userAPI,
} from "../../services/api";
import { cn } from "../../lib/utils";
import SessionMenu from "./SessionMenu";

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);
  const [mobileSubcategories, setMobileSubcategories] = useState({});
  const [categoriesDropdownTimeout, setCategoriesDropdownTimeout] =
    useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const categoriesDropdownRef = useRef(null);

  const { data: categoriesData } = useQuery({
    queryKey: ["header-categories"],
    queryFn: async () => {
      const response = await categoryAPI.getCategories({
        isActive: true,
        limit: 100,
      });
      return response.data.data?.docs || [];
    },
    staleTime: 300000,
  });

  const categories = categoriesData || [];

  const { data: subcategoriesData } = useQuery({
    queryKey: ["subcategories", hoveredCategory?._id],
    queryFn: async () => {
      if (!hoveredCategory?._id) return [];
      const response = await subcategoryAPI.getSubcategoriesByCategoryId(
        hoveredCategory._id,
        {
          isActive: true,
          limit: 50,
        }
      );
      return response.data.data?.docs || [];
    },
    enabled: !!hoveredCategory?._id,
  });

  const subcategories = subcategoriesData || [];

  const [categoriesWithSubcategories, setCategoriesWithSubcategories] =
    useState({});

  const checkCategoryHasSubcategories = async (categoryId) => {
    if (categoriesWithSubcategories[categoryId] !== undefined) {
      return categoriesWithSubcategories[categoryId];
    }
    try {
      const response = await subcategoryAPI.getSubcategoriesByCategoryId(
        categoryId,
        {
          isActive: true,
          limit: 1,
        }
      );
      const hasSubs = (response.data.data?.docs || []).length > 0;
      setCategoriesWithSubcategories((prev) => ({
        ...prev,
        [categoryId]: hasSubs,
      }));
      return hasSubs;
    } catch {
      setCategoriesWithSubcategories((prev) => ({
        ...prev,
        [categoryId]: false,
      }));
      return false;
    }
  };

  const { data: cartData } = useQuery({
    queryKey: ["cart-count"],
    queryFn: async () => {
      if (!isAuthenticated) return { count: 0 };
      try {
        const response = await cartAPI.getCart();
        return { count: response.data.data?.items?.length || 0 };
      } catch {
        return { count: 0 };
      }
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const [guestCartCount, setGuestCartCount] = useState(() => (typeof getGuestCartCount === "function" ? getGuestCartCount() : 0));
  useEffect(() => {
    if (!isAuthenticated && typeof getGuestCartCount === "function") {
      setGuestCartCount(getGuestCartCount());
      const onGuestCartChange = () => setGuestCartCount(getGuestCartCount());
      window.addEventListener("guestCartChange", onGuestCartChange);
      return () => window.removeEventListener("guestCartChange", onGuestCartChange);
    }
  }, [isAuthenticated]);

  const cartCount = isAuthenticated ? (cartData?.count || 0) : guestCartCount;

  const { data: wishlistData } = useQuery({
    queryKey: ["wishlist-count"],
    queryFn: async () => {
      if (!isAuthenticated) return { count: 0 };
      try {
        const response = await userAPI.getWishlist();
        const wishlist = response.data.data;
        if (Array.isArray(wishlist)) {
          return { count: wishlist.length };
        }
        return { count: wishlist?.products?.length || 0 };
      } catch {
        return { count: 0 };
      }
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const wishlistCount = wishlistData?.count || 0;

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchSuggestions, isLoading: searchLoading } = useQuery({
    queryKey: ["search-suggestions", debouncedSearchQuery, selectedCategory],
    queryFn: async () => {
      if (!debouncedSearchQuery.trim()) return [];
      try {
        const params = {
          search: debouncedSearchQuery,
          limit: 10,
          status: "active",
        };
        if (selectedCategory !== "all") {
          params.categoryId = selectedCategory;
        }
        const response = await productAPI.getProducts(params);
        return response.data.data?.docs || [];
      } catch {
        return [];
      }
    },
    enabled: debouncedSearchQuery.trim().length > 0,
    staleTime: 60000,
  });

  const shouldShowSuggestions =
    showSearchSuggestions &&
    debouncedSearchQuery.trim() &&
    (searchSuggestions?.length > 0 || searchLoading);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowSearchSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        categoriesDropdownRef.current &&
        !categoriesDropdownRef.current.contains(event.target)
      ) {
        setShowCategoriesDropdown(false);
        setHoveredCategory(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 10);
    };
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearchFocus = () => {
    if (searchQuery.trim()) {
      setShowSearchSuggestions(true);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchSuggestions(value.trim().length > 0);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const params = new URLSearchParams({ q: searchQuery });
    if (selectedCategory !== "all") {
      params.append("category", selectedCategory);
    }

    setShowSearchSuggestions(false);
    navigate(`/search?${params.toString()}`);
  };

  const handleSuggestionClick = (product) => {
    setShowSearchSuggestions(false);
    setSearchQuery("");
    navigate(`/product/${product._id}`);
  };

  const handleCategoryHover = async (category) => {
    setHoveredCategory(category);
    if (categoriesWithSubcategories[category._id] === undefined) {
      await checkCategoryHasSubcategories(category._id);
    }
  };

  return (
    <>
      {/* Main Header */}
      <div className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        isScrolled ? "bg-[#060318] backdrop-blur-md shadow-lg" : "bg-transparent"
      )}>
        <div className="container mx-auto px-4">
          {/* Main Header Row */}
          <div className="flex items-center justify-between gap-4 py-4">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 shrink-0"
              onClick={() => {
                setMobileMenuOpen(false);
              }}
            >
              <img
                src="https://res.cloudinary.com/dptwervy7/image/upload/v1754393665/logo_nojqxu.png"
                alt="logo"
                className="w-full h-10"
              />
            </Link>

            {/* Mobile Menu Toggle Button */}
            <Button
              variant="outline"
              size="icon"
              className="md:hidden border-accent text-white hover:bg-accent/10 rounded-lg shrink-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>

            {/* Search Bar - Desktop */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 w-full mx-4"
              ref={searchContainerRef}
            >
              <div className="relative w-full">
                <div className="flex items-center bg-gray-900/50 border border-accent rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-accent/50">
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="What are you looking for?"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    className="border-0 bg-transparent text-white placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
                  />
                  <div className="h-6 w-px bg-gray-700" />
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-transparent text-white text-sm px-3 py-2 border-0 outline-none cursor-pointer appearance-none pr-8"
                    >
                      <option className="text-white bg-primary" value="all">All Categories</option>
                      {categories.map((category) => (
                        <option className="text-white bg-primary" key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-accent to-blue-600 hover:from-accent/90 hover:to-blue-600/90 rounded-lg h-full px-4 shadow-lg"
                  >
                    <Search className="h-5 w-5 text-white" />
                  </Button>
                </div>

                {/* Search Suggestions Dropdown */}
                {shouldShowSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
                    {searchLoading ? (
                      <div className="p-4 text-center text-gray-400">
                        Searching...
                      </div>
                    ) : searchSuggestions && searchSuggestions.length > 0 ? (
                      <div className="py-2">
                        {searchSuggestions.map((product) => (
                          <button
                            key={product._id}
                            type="button"
                            onClick={() => handleSuggestionClick(product)}
                            className="w-full px-4 py-3 hover:bg-gray-800/50 flex items-center gap-3 text-left transition-colors"
                          >
                            {product.images?.[0] && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-medium truncate">
                                {product.name}
                              </div>
                              {product.price && (
                                <div className="text-accent text-sm">
                                  ${product.price.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : debouncedSearchQuery.trim() ? (
                      <div className="p-4 text-center text-gray-400">
                        No products found
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </form>


            {/* Right Side Actions - Desktop */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              {/* Language Selector */}
              <Button
                variant="outline"
                size="sm"
                className="border-accent text-white hover:bg-accent/10 rounded-lg"
              >
                <USFlag />
                <span className="ml-2">ENG</span>
              </Button>

              {/* Session Menu - Replaces Register Button */}
              <SessionMenu />

              {/* Wishlist */}
              <Button
                variant="outline"
                size="icon"
                className="border-accent text-white hover:bg-accent/10 relative rounded-lg"
                onClick={() => navigate("/wishlist")}
              >
                <Heart className="h-5 w-5" strokeWidth={2} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Button>

              {/* Cart */}
              <Button
                variant="outline"
                size="icon"
                className="border-accent text-white hover:bg-accent/10 relative rounded-lg"
                onClick={() => navigate("/cart")}
              >
                <ShoppingCart className="h-5 w-5" strokeWidth={2} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
        <div className={cn(
          "transition-all duration-300",
          isScrolled ? "bg-[#060318]/80 backdrop-blur-sm" : "bg-[#060318]/20"
        )}>
          {/* Secondary Navigation Row - Desktop */}
          <div className="hidden md:flex items-center justify-center gap-2 px-4 py-3 container mx-auto">
            <div className="flex items-center gap-2 flex-wrap w-full justify-between">
              {/* Categories with Mega Dropdown */}
              <div
                className="relative flex grow"
                ref={categoriesDropdownRef}
                onMouseEnter={() => {
                  if (categoriesDropdownTimeout) {
                    clearTimeout(categoriesDropdownTimeout);
                    setCategoriesDropdownTimeout(null);
                  }
                  setShowCategoriesDropdown(true);
                }}
                onMouseLeave={() => {
                  const timeout = setTimeout(() => {
                    setShowCategoriesDropdown(false);
                    setHoveredCategory(null);
                  }, 200);
                  setCategoriesDropdownTimeout(timeout);
                }}
              >
                <button
                  className="text-white hover:text-accent transition-colors min-h-[43px] px-5 py-[10px] bg-[#07142E] flex items-center justify-center font-medium gap-3 rounded-lg whitespace-nowrap grow"
                  type="button"
                >
                  <Menu className="h-6 w-6 shrink-0" />
                  Categories
                </button>

                {/* Mega Dropdown - 2 Column Layout (Categories + Subcategories) */}
                {showCategoriesDropdown && categories.length > 0 && (
                  <div
                    className="absolute top-full left-0 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50"
                    style={{
                      marginTop: "2px",
                      width:
                        hoveredCategory && subcategories.length > 0
                          ? "600px"
                          : "300px",
                      transition: "width 0.2s ease-in-out",
                    }}
                    onMouseEnter={() => {
                      if (categoriesDropdownTimeout) {
                        clearTimeout(categoriesDropdownTimeout);
                        setCategoriesDropdownTimeout(null);
                      }
                      setShowCategoriesDropdown(true);
                    }}
                    onMouseLeave={() => {
                      const timeout = setTimeout(() => {
                        setShowCategoriesDropdown(false);
                        setHoveredCategory(null);
                      }, 200);
                      setCategoriesDropdownTimeout(timeout);
                    }}
                  >
                    <div className="flex min-h-[300px]">
                      {/* Left Column - Main Categories */}
                      <div
                        className={cn(
                          "border-r border-gray-700 max-h-[500px] overflow-y-auto",
                          hoveredCategory && subcategories.length > 0
                            ? "w-2/5"
                            : "w-full"
                        )}
                      >
                        {categories.map((category) => {
                          const hasSubcategories =
                            categoriesWithSubcategories[category._id] || false;
                          return (
                            <button
                              key={category._id}
                              type="button"
                              onMouseEnter={() => handleCategoryHover(category)}
                              onClick={() => {
                                navigate(
                                  `/category/${category.slug || category._id}`
                                );
                                setShowCategoriesDropdown(false);
                              }}
                              className={cn(
                                "w-full px-4 py-3 text-left text-white hover:bg-gray-800/50 transition-colors flex items-center gap-3 border-b border-gray-800/30 last:border-b-0 ",
                                hoveredCategory?._id === category._id &&
                                  "bg-gray-800/50"
                              )}
                            >
                              {/* Category Image/Icon */}
                              {category.image ? (
                                <img
                                  src={category.image}
                                  alt={category.name}
                                  className="w-8 h-8 object-cover rounded shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-700 rounded shrink-0 flex items-center justify-center">
                                  <Menu className="h-4 w-4 text-gray-400" />
                                </div>
                              )}

                              {/* Category Name */}
                              <span className="flex-1 text-sm font-medium">
                                {category.name}
                              </span>

                              {/* Arrow Icon - Only if has subcategories */}
                              {hasSubcategories && (
                                <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Right Column - Subcategories Only (Show only if subcategories exist) */}
                      {hoveredCategory && subcategories.length > 0 && (
                        <div className="w-3/5 max-h-[500px] overflow-y-auto bg-gray-800/10">
                          <div className="py-2">
                            {subcategories.map((subcategory) => (
                              <Link
                                key={subcategory._id}
                                to={`/subcategory/${
                                  subcategory.slug || subcategory._id
                                }`}
                                onClick={() => setShowCategoriesDropdown(false)}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/50 transition-colors group border-b border-gray-800/20 last:border-b-0"
                              >
                                {/* Subcategory Icon */}
                                {subcategory.image ? (
                                  <img
                                    src={subcategory.image}
                                    alt={subcategory.name}
                                    className="w-8 h-8 object-cover rounded shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-gray-700 rounded shrink-0 flex items-center justify-center">
                                    <Menu className="h-4 w-4 text-gray-400" />
                                  </div>
                                )}

                                {/* Subcategory Name */}
                                <span className="text-white text-sm group-hover:text-accent flex-1">
                                  {subcategory.name}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Links */}
              <Link
                to="/bestsellers"
                className="text-white hover:text-accent transition-colors min-h-[43px] px-5 py-[10px] bg-[#07142E] flex items-center justify-center rounded-lg whitespace-nowrap grow"
              >
                Bestsellers
              </Link>
              <Link
                to="/gift-cards"
                className="text-white hover:text-accent transition-colors min-h-[43px] px-5 py-[10px] bg-[#07142E] flex items-center justify-center rounded-lg whitespace-nowrap grow"
              >
                Gift Cards
              </Link>
              <Link
                to="/random-keys"
                className="text-white hover:text-accent transition-colors min-h-[43px] px-5 py-[10px] bg-[#07142E] flex items-center justify-center rounded-lg whitespace-nowrap grow"
              >
                Random Keys
              </Link>
              <Link
                to="/software"
                className="text-white hover:text-accent transition-colors min-h-[43px] px-5 py-[10px] bg-[#07142E] flex items-center justify-center rounded-lg whitespace-nowrap grow"
              >
                Software
              </Link>

              
            {/* CTA Button */}
            <Button
              onClick={() => navigate("/dgmarq-plus")}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium shadow-lg"
            >
              Save more with DGMAQ Plus
            </Button>
            </div>
          </div>
        </div>



        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700 max-h-[calc(100vh-80px)] overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Categories with Subcategories */}
              <div className="space-y-2">
                <button
                  className="w-full flex items-center justify-between text-white py-2"
                  onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                >
                  <div className="flex items-center gap-2">
                    <Menu className="h-5 w-5" />
                    <span className="font-medium">Categories</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      mobileCategoriesOpen && "rotate-180"
                    )}
                  />
                </button>

                {/* Mobile Categories List with Subcategories */}
                {mobileCategoriesOpen && (
                  <div className="pl-6 space-y-2">
                    {categories.map((category) => {
                      const isExpanded = expandedCategoryId === category._id;
                      const subcategories = mobileSubcategories[category._id] || [];
                      
                      return (
                        <div key={category._id} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/category/${category.slug || category._id}`}
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setMobileCategoriesOpen(false);
                                setExpandedCategoryId(null);
                              }}
                              className="flex-1 text-gray-300 hover:text-accent py-1"
                            >
                              {category.name}
                            </Link>
                            <button
                              onClick={async () => {
                                if (!isExpanded) {
                                  const hasSubs = await checkCategoryHasSubcategories(category._id);
                                  if (hasSubs) {
                                    if (!mobileSubcategories[category._id]) {
                                      try {
                                        const response = await subcategoryAPI.getSubcategoriesByCategoryId(
                                          category._id,
                                          { isActive: true, limit: 50 }
                                        );
                                        setMobileSubcategories(prev => ({
                                          ...prev,
                                          [category._id]: response.data.data?.docs || []
                                        }));
                                      } catch {
                                        setMobileSubcategories(prev => ({
                                          ...prev,
                                          [category._id]: []
                                        }));
                                      }
                                    }
                                    setExpandedCategoryId(category._id);
                                  }
                                } else {
                                  setExpandedCategoryId(null);
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-accent"
                              aria-label={isExpanded ? "Collapse" : "Expand"}
                            >
                              <ChevronRight
                                className={cn(
                                  "h-4 w-4 transition-transform",
                                  isExpanded && "rotate-90"
                                )}
                              />
                            </button>
                          </div>
                          {/* Subcategories */}
                          {isExpanded && subcategories.length > 0 && (
                            <div className="pl-4 space-y-1 border-l-2 border-gray-700 ml-2">
                              {subcategories.map((subcategory) => (
                                <Link
                                  key={subcategory._id}
                                  to={`/subcategory/${subcategory.slug || subcategory._id}`}
                                  onClick={() => {
                                    setMobileMenuOpen(false);
                                    setMobileCategoriesOpen(false);
                                    setExpandedCategoryId(null);
                                  }}
                                  className="block text-gray-400 hover:text-accent py-1 text-sm"
                                >
                                  {subcategory.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Navigation Links */}
              <Link
                to="/bestsellers"
                className="block text-white hover:text-accent py-[10px] px-5 bg-[#07142E] rounded-lg w-full text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Bestsellers
              </Link>
              <Link
                to="/gift-cards"
                className="block text-white hover:text-accent py-[10px] px-5 bg-[#07142E] rounded-lg w-full text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Gift Cards
              </Link>
              <Link
                to="/random-keys"
                className="block text-white hover:text-accent py-[10px] px-5 bg-[#07142E] rounded-lg w-full text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Random Keys
              </Link>
              <Link
                to="/software"
                className="block text-white hover:text-accent py-[10px] px-5 bg-[#07142E] rounded-lg w-full text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Software
              </Link>

              {/* CTA Button */}
              <Button
                onClick={() => {
                  navigate("/dgmarq-plus");
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                Save more with DGMAQ Plus
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Header;
