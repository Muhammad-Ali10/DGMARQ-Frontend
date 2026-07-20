import { useState, useEffect, useRef } from "react";
import { getGuestCartCount } from "@features/cart-checkout";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { calculateProductPrice, getProductPath, getPlatformName, getTypeName } from "@features/catalog";
import RegionBadges from "@features/catalog/components/RegionBadges";
import {
  Search,
  Heart,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Star,
  Gift,
  Boxes,
  MonitorSmartphone,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@components/ui/button";
import {
  categoryAPI,
  subcategoryAPI,
  productAPI,
  cartAPI,
  userAPI,
} from "@services/api";
import { cn } from "@lib/utils";
import SessionMenu from "./SessionMenu";
import SafeImage from "@components/ui/safe-image";
import { NotificationBell } from "@features/notifications";
import useCurrency from "@hooks/useCurrency";
import useLanguage from "@hooks/useLanguage";
import useBuyerCountry from "@hooks/useBuyerCountry";
import CurrencyLanguageModal from "./CurrencyLanguageModal";
import CartDropdown from "./CartDropdown";
import "./Header.css";

const PROMO_MESSAGES = [
  { icon: <Zap width={16} height={16} />, node: (<>Instant delivery on <span className="fx-promo-em">game keys</span> &mdash; up to <span className="fx-promo-em">90% off</span></>) },
  { icon: <Search width={16} height={16} />, node: (<><span className="fx-promo-em">Escrow-protected</span> checkout on every single order</>) },
  { icon: <Gift width={16} height={16} />, node: (<>Gift cards, top-ups &amp; accounts &mdash; <span className="fx-promo-em">new deals daily</span></>) },
];

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
  const [categoriesDropdownTimeout, setCategoriesDropdownTimeout] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  // New futuristic-chrome state
  const [promoIdx, setPromoIdx] = useState(0);
  const [promoHidden, setPromoHidden] = useState(false);
  const { currency: currencyCode } = useCurrency();
  const { language } = useLanguage();
  const { country } = useBuyerCountry();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [spot, setSpot] = useState({ left: 0, width: 0, opacity: 0 });

  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const categoriesDropdownRef = useRef(null);

  const { data: categoriesData } = useQuery({
    queryKey: ["header-categories"],
    queryFn: async () => {
      const response = await categoryAPI.getCategories({ isActive: true, limit: 100 });
      return response.data.data?.docs || [];
    },
    staleTime: 300000,
  });
  const categories = categoriesData || [];

  const { data: subcategoriesData } = useQuery({
    queryKey: ["subcategories", hoveredCategory?._id],
    queryFn: async () => {
      if (!hoveredCategory?._id) return [];
      const response = await subcategoryAPI.getSubcategoriesByCategoryId(hoveredCategory._id, { isActive: true, limit: 50 });
      return response.data.data?.docs || [];
    },
    enabled: !!hoveredCategory?._id,
  });
  const subcategories = subcategoriesData || [];

  const [categoriesWithSubcategories, setCategoriesWithSubcategories] = useState({});

  const checkCategoryHasSubcategories = async (categoryId) => {
    if (categoriesWithSubcategories[categoryId] !== undefined) {
      return categoriesWithSubcategories[categoryId];
    }
    try {
      const response = await subcategoryAPI.getSubcategoriesByCategoryId(categoryId, { isActive: true, limit: 1 });
      const hasSubs = (response.data.data?.docs || []).length > 0;
      setCategoriesWithSubcategories((prev) => ({ ...prev, [categoryId]: hasSubs }));
      return hasSubs;
    } catch {
      setCategoriesWithSubcategories((prev) => ({ ...prev, [categoryId]: false }));
      return false;
    }
  };

  // ONE shared cart query for the whole app: the badge below and the mini-cart
  // flyout both read this cache, so the cart is fetched once (not once per
  // component) and any `invalidateQueries(['cart'])` updates both instantly.
  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartAPI.getCart().then((r) => r.data.data),
    enabled: isAuthenticated,
    staleTime: 30_000, // don't refetch a heavy cart on every window focus
  });

  const [guestCartCount, setGuestCartCount] = useState(() =>
    typeof getGuestCartCount === "function" ? getGuestCartCount() : 0,
  );
  useEffect(() => {
    if (!isAuthenticated && typeof getGuestCartCount === "function") {
      setGuestCartCount(getGuestCartCount());
      const onGuestCartChange = () => setGuestCartCount(getGuestCartCount());
      window.addEventListener("guestCartChange", onGuestCartChange);
      return () => window.removeEventListener("guestCartChange", onGuestCartChange);
    }
  }, [isAuthenticated]);

  const cartCount = isAuthenticated ? cart?.items?.length || 0 : guestCartCount;

  const { data: wishlistData } = useQuery({
    queryKey: ["wishlist", "count"],
    queryFn: async () => {
      if (!isAuthenticated) return { count: 0 };
      try {
        const response = await userAPI.getWishlist();
        const wishlist = response.data.data;
        if (Array.isArray(wishlist)) return { count: wishlist.length };
        return { count: wishlist?.products?.length || 0 };
      } catch {
        return { count: 0 };
      }
    },
    enabled: isAuthenticated,
  });
  const wishlistCount = wishlistData?.count || 0;

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchSuggestions, isLoading: searchLoading } = useQuery({
    queryKey: ["search-suggestions", debouncedSearchQuery, selectedCategory],
    queryFn: async () => {
      if (!debouncedSearchQuery.trim()) return [];
      try {
        const params = { search: debouncedSearchQuery, limit: 10, status: "active", searchMode: "prefix" };
        if (selectedCategory !== "all") params.categoryId = selectedCategory;
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
    showSearchSuggestions && debouncedSearchQuery.trim() && (searchSuggestions?.length > 0 || searchLoading);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoriesDropdownRef.current && !categoriesDropdownRef.current.contains(event.target)) {
        setShowCategoriesDropdown(false);
        setHoveredCategory(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Rotating promo banner.
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || PROMO_MESSAGES.length <= 1) return;
    const t = setInterval(() => setPromoIdx((i) => (i + 1) % PROMO_MESSAGES.length), 4000);
    return () => clearInterval(t);
  }, []);

  const handleSearchFocus = () => {
    if (searchQuery.trim()) setShowSearchSuggestions(true);
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
    if (selectedCategory !== "all") params.append("category", selectedCategory);
    setShowSearchSuggestions(false);
    navigate(`/search?${params.toString()}`);
  };
  const handleSuggestionClick = (product) => {
    setShowSearchSuggestions(false);
    setSearchQuery("");
    navigate(getProductPath(product));
  };
  const handleCategoryHover = async (category) => {
    setHoveredCategory(category);
    if (categoriesWithSubcategories[category._id] === undefined) {
      await checkCategoryHasSubcategories(category._id);
    }
  };

  const moveSpot = (e) => {
    const el = e.currentTarget;
    setSpot({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
  };
  const hideSpot = () => setSpot((s) => ({ ...s, opacity: 0 }));

  const openCategories = () => {
    if (categoriesDropdownTimeout) {
      clearTimeout(categoriesDropdownTimeout);
      setCategoriesDropdownTimeout(null);
    }
    setShowCategoriesDropdown(true);
  };
  const closeCategoriesDelayed = () => {
    const timeout = setTimeout(() => {
      setShowCategoriesDropdown(false);
      setHoveredCategory(null);
    }, 200);
    setCategoriesDropdownTimeout(timeout);
  };

  const navLinks = [
    { to: "/bestsellers", label: "Bestsellers", icon: <Star /> },
    { to: "/gift-cards", label: "Gift Cards", icon: <Gift /> },
    { to: "/random-keys", label: "Random Keys", icon: <Boxes /> },
    { to: "/software", label: "Software", icon: <MonitorSmartphone /> },
  ];

  return (
    <div className="hdr-fx">
      {/* Animated promo banner */}
      <div className={cn("fx-promo", promoHidden && "is-hidden")} role="region" aria-label="Promotions">
        <span className="fx-promo-beam" aria-hidden="true" />
        <div className="fx-promo-row">
          <span className="fx-promo-live"><span className="dot" />Live</span>
          <div className="fx-promo-track">
            {PROMO_MESSAGES.map((m, i) => (
              <div key={i} className={cn("fx-promo-msg", i === promoIdx && "is-live")} aria-hidden={i !== promoIdx}>
                <span className="fx-promo-ico">{m.icon}</span>
                <span>{m.node}</span>
              </div>
            ))}
          </div>
          <button type="button" className="fx-promo-cta" onClick={() => navigate("/bestsellers")}>
            Shop Now <ArrowRight width={14} height={14} />
          </button>
        </div>
        <button type="button" className="fx-promo-close" aria-label="Dismiss promotion" onClick={() => setPromoHidden(true)}>
          <X width={15} height={15} />
        </button>
      </div>

      {/* Main Header */}
      <div className={cn("sticky top-0 z-50 transition-all duration-300", isScrolled ? "bg-[#060318] backdrop-blur-md shadow-lg" : "bg-transparent")}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4 py-2.5">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0" onClick={() => setMobileMenuOpen(false)}>
              <SafeImage
                src="https://res.cloudinary.com/dhuhvbzpj/image/upload/v1773483947/logo_gos33k.png"
                alt="logo"
                className="w-full h-10"
                loading="eager"
              />
            </Link>

            {/* Mobile menu toggle */}
            <Button
              variant="outline"
              size="icon"
              className="md:hidden border-accent text-white hover:bg-accent/10 rounded-lg shrink-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            {/* Futuristic search bar — desktop */}
            <div className="hidden md:flex flex-1 mx-4 relative" ref={searchContainerRef}>
              <form className="fx-search w-full" role="search" onSubmit={handleSearch}>
                <span className="fx-corner fx-corner-tl" /><span className="fx-corner fx-corner-tr" /><span className="fx-corner fx-corner-bl" /><span className="fx-corner fx-corner-br" />
                <div className="fx-search-row">
                  <span className="fx-search-lead" aria-hidden="true"><Search width={18} height={18} /></span>
                  <input
                    ref={searchInputRef}
                    className="fx-search-input"
                    placeholder="Search games, software, gift cards…"
                    type="text"
                    aria-label="Search products"
                    autoComplete="off"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                  />
                  <span className="fx-search-divider" />
                  <select className="fx-search-select" aria-label="Search category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>{category.name}</option>
                    ))}
                  </select>
                  <button className="fx-search-btn" type="submit" aria-label="Search">
                    <Search width={16} height={16} stroke="#fff" />
                    <span className="fx-search-btn-label">Search</span>
                  </button>
                </div>
              </form>

              {/* Suggestions panel (real data) */}
              {shouldShowSuggestions && (
                <div className="fx-search-panel" role="listbox" aria-label="Search results">
                  <div className="fx-sp-list">
                    {searchLoading ? (
                      <div className="fx-sp-empty">Searching…</div>
                    ) : searchSuggestions && searchSuggestions.length > 0 ? (
                      searchSuggestions.map((product) => {
                        const { discountPrice, discountPercentage, originalPrice } = calculateProductPrice(product);
                        const platformName = getPlatformName(product);
                        const typeName = getTypeName(product);
                        const offersCount = product.offersCount ?? 0;
                        // Union of all offers' region codes (same shape the cards use) →
                        // "can activate" if ANY seller covers the buyer's region. Static +
                        // label-less so it drops cleanly into the clickable suggestion row.
                        const regionOffer = (product.offerRegionCodes !== undefined || product.bestOfferRegionCodes !== undefined)
                          ? {
                              regionCodes: product.offerRegionCodes || product.bestOfferRegionCodes || [],
                              countries: [],
                              excludedCountries: [],
                            }
                          : null;
                        return (
                          <button key={product._id} type="button" className="fx-sp-row" onClick={() => handleSuggestionClick(product)}>
                            <span className="fx-sp-icon">
                              {product.images?.[0] ? (
                                <SafeImage src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <Boxes width={20} height={20} stroke="#7BC5FF" />
                              )}
                            </span>
                            <span className="fx-sp-body">
                              <span className="fx-sp-title">{product.name}</span>
                              <span className="fx-sp-plat">{platformName}{typeName ? ` · ${typeName}` : ""}</span>
                              {regionOffer && (
                                <span className="fx-sp-region">
                                  <RegionBadges offer={regionOffer} compact showWarning interactive={false} showLabel={false} maxChips={3} />
                                </span>
                              )}
                            </span>
                            <span className="fx-sp-right">
                              {discountPercentage > 0 && (
                                <span className="fx-sp-oldline">
                                  <span className="fx-sp-disc">-{discountPercentage.toFixed(0)}%</span>
                                  <del className="fx-sp-old">${originalPrice.toFixed(2)}</del>
                                </span>
                              )}
                              {discountPrice != null && <span className="fx-sp-price">${discountPrice.toFixed(2)}</span>}
                              <span className="fx-sp-subrow">
                                {offersCount > 1 && <span className="fx-sp-offers">+{offersCount - 1} more offers</span>}
                                {product.stock !== undefined && (
                                  <span className={cn("fx-sp-stock", product.stock > 0 ? "in" : "out")}>
                                    <span className="fx-sp-dot" /> {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                                  </span>
                                )}
                              </span>
                            </span>
                          </button>
                        );
                      })
                    ) : debouncedSearchQuery.trim() ? (
                      <div className="fx-sp-empty">No products found. Try a different search.</div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {/* Right actions — desktop */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              {/* Region / language / currency — opens the settings modal */}
              <button className="fx-curr-btn" onClick={() => setSettingsOpen(true)} type="button">
                <img src={`https://flagcdn.com/w20/${String(country || "us").toLowerCase()}.png`} width={22} height={16} alt={country || ""} style={{ borderRadius: 2, objectFit: "cover", flexShrink: 0 }} />
                <span className="fx-curr-label">{language}&nbsp;&nbsp;|&nbsp;&nbsp;{currencyCode}</span>
              </button>

              {/* Session (login / register / account) */}
              <SessionMenu />

              {/* Wishlist */}
              <button className="fx-iconbtn" onClick={() => navigate("/wishlist")} aria-label="Wishlist" type="button">
                <Heart className="h-5 w-5" strokeWidth={2} />
                {wishlistCount > 0 && <span className="fx-iconbtn-badge">{wishlistCount > 9 ? "9+" : wishlistCount}</span>}
              </button>

              {/* Cart — opens the mini-cart flyout */}
              <button className="fx-iconbtn" onClick={() => setCartOpen((o) => !o)} aria-label="Cart" type="button">
                <ShoppingCart className="h-5 w-5" strokeWidth={2} />
                {cartCount > 0 && <span className="fx-iconbtn-badge">{cartCount > 9 ? "9+" : cartCount}</span>}
              </button>

              {isAuthenticated && <NotificationBell />}
            </div>
          </div>
        </div>

        {/* Command strip (sub-nav) — desktop */}
        <div className="fx-cmdbar container mx-auto" ref={categoriesDropdownRef}>
          <nav className="fx-cmd" aria-label="Browse the store" onMouseLeave={hideSpot}>
            <div className="fx-cmd-track">
              <span className="fx-cmd-spot" aria-hidden="true" style={{ left: spot.left, width: spot.width, opacity: spot.opacity }} />

              {/* Categories — opens mega dropdown */}
              <div
                className="relative"
                style={{ flex: "1 1 0", minWidth: 0 }}
                onMouseEnter={openCategories}
                onMouseLeave={closeCategoriesDelayed}
              >
                <button type="button" className="fx-cmd-item" style={{ width: "100%" }} onMouseEnter={moveSpot}>
                  <Menu /> <span className="fx-cmd-label">Categories</span>
                </button>

                {showCategoriesDropdown && categories.length > 0 && (
                  <div
                    className="absolute top-full left-0 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50"
                    style={{ marginTop: 2, width: hoveredCategory && subcategories.length > 0 ? 600 : 300, transition: "width 0.2s ease-in-out" }}
                    onMouseEnter={openCategories}
                    onMouseLeave={closeCategoriesDelayed}
                  >
                    <div className="flex min-h-[300px]">
                      <div className={cn("border-r border-gray-700 max-h-[500px] overflow-y-auto", hoveredCategory && subcategories.length > 0 ? "w-2/5" : "w-full")}>
                        {categories.map((category) => {
                          const hasSubcategories = categoriesWithSubcategories[category._id] || false;
                          return (
                            <button
                              key={category._id}
                              type="button"
                              onMouseEnter={() => handleCategoryHover(category)}
                              onClick={() => { navigate(`/category/${category.slug || category._id}`); setShowCategoriesDropdown(false); }}
                              className={cn("w-full px-4 py-3 text-left text-white hover:bg-gray-800/50 transition-colors flex items-center gap-3 border-b border-gray-800/30 last:border-b-0", hoveredCategory?._id === category._id && "bg-gray-800/50")}
                            >
                              {category.image ? (
                                <SafeImage src={category.image} alt={category.name} className="w-8 h-8 object-cover rounded shrink-0" />
                              ) : (
                                <div className="w-8 h-8 bg-gray-700 rounded shrink-0 flex items-center justify-center">
                                  <Menu className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                              <span className="flex-1 text-sm font-medium">{category.name}</span>
                              {hasSubcategories && <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                      {hoveredCategory && subcategories.length > 0 && (
                        <div className="w-3/5 max-h-[500px] overflow-y-auto bg-gray-800/10">
                          <div className="py-2">
                            {subcategories.map((subcategory) => (
                              <Link
                                key={subcategory._id}
                                to={`/subcategory/${subcategory.slug || subcategory._id}?subCategoryId=${subcategory._id}&categoryId=${hoveredCategory?._id || ""}`}
                                onClick={() => setShowCategoriesDropdown(false)}
                                className="flex items-center px-4 py-2.5 hover:bg-gray-800/50 transition-colors group border-b border-gray-800/20 last:border-b-0"
                              >
                                <span className="text-white text-sm group-hover:text-accent flex-1">{subcategory.name}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Other nav links */}
              {navLinks.map((l) => (
                <Link key={l.to} to={l.to} className="fx-cmd-item" onMouseEnter={moveSpot}>
                  {l.icon} <span className="fx-cmd-label">{l.label}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* Plus capsule */}
          <button type="button" className="fx-plus" onClick={() => navigate("/dgmarq-plus")}>
            <span className="fx-plus-spark" aria-hidden="true"><Sparkles width={18} height={18} /></span>
            <span className="fx-plus-text">Save more with <strong>DGMARQ&nbsp;Plus</strong></span>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700 max-h-[calc(100vh-80px)] overflow-y-auto bg-[#060318]">
            <div className="p-4 space-y-4">
              {/* Mobile search */}
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  className="flex-1 bg-gray-900/60 border border-accent rounded-lg px-3 h-10 text-white text-sm outline-none"
                  placeholder="Search…"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                <Button type="submit" className="h-10 bg-gradient-to-r from-[#172AA4] to-[#0E9FE2]" aria-label="Search"><Search className="h-5 w-5" /></Button>
              </form>

              <div className="space-y-2">
                <button className="w-full flex items-center justify-between text-white py-2" onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}>
                  <div className="flex items-center gap-2"><Menu className="h-5 w-5" /><span className="font-medium">Categories</span></div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", mobileCategoriesOpen && "rotate-180")} />
                </button>

                {mobileCategoriesOpen && (
                  <div className="pl-6 space-y-2">
                    {categories.map((category) => {
                      const isExpanded = expandedCategoryId === category._id;
                      const subs = mobileSubcategories[category._id] || [];
                      return (
                        <div key={category._id} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/category/${category.slug || category._id}`}
                              onClick={() => { setMobileMenuOpen(false); setMobileCategoriesOpen(false); setExpandedCategoryId(null); }}
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
                                        const response = await subcategoryAPI.getSubcategoriesByCategoryId(category._id, { isActive: true, limit: 50 });
                                        setMobileSubcategories((prev) => ({ ...prev, [category._id]: response.data.data?.docs || [] }));
                                      } catch {
                                        setMobileSubcategories((prev) => ({ ...prev, [category._id]: [] }));
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
                              <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
                            </button>
                          </div>
                          {isExpanded && subs.length > 0 && (
                            <div className="pl-4 space-y-1 border-l-2 border-gray-700 ml-2">
                              {subs.map((subcategory) => (
                                <Link
                                  key={subcategory._id}
                                  to={`/subcategory/${subcategory.slug || subcategory._id}?subCategoryId=${subcategory._id}&categoryId=${category._id}`}
                                  onClick={() => { setMobileMenuOpen(false); setMobileCategoriesOpen(false); setExpandedCategoryId(null); }}
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

              {navLinks.map((l) => (
                <Link key={l.to} to={l.to} className="block text-white hover:text-accent py-[10px] px-5 bg-[#07142E] rounded-lg w-full text-center" onClick={() => setMobileMenuOpen(false)}>
                  {l.label}
                </Link>
              ))}

              <Button onClick={() => { navigate("/dgmarq-plus"); setMobileMenuOpen(false); }} className="w-full bg-gradient-to-r from-[#172AA4] to-[#0E9FE2] text-white">
                Save more with DGMARQ Plus
              </Button>

              {/* Region / language / currency — opens the settings modal */}
              <button type="button" onClick={() => { setSettingsOpen(true); setMobileMenuOpen(false); }} className="flex items-center justify-center gap-2.5 w-full py-[10px] px-5 bg-[#07142E] rounded-lg text-white">
                <img src={`https://flagcdn.com/w20/${String(country || "us").toLowerCase()}.png`} width={22} height={16} alt={country || ""} style={{ borderRadius: 2, objectFit: "cover" }} />
                <span className="text-sm font-semibold">{language}&nbsp;&nbsp;|&nbsp;&nbsp;{currencyCode}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <CurrencyLanguageModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <CartDropdown open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
};

export default Header;
