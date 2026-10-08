import { useState, useEffect, useRef } from "react";
import { useCartCount } from "@features/cart-checkout";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { calculateProductPrice, getProductPath, getPlatformName, getTypeName, getCardRegionOffer, useWishlist, useActiveCategories } from "@features/catalog";
import RegionBadges from "@features/catalog/components/RegionBadges";
import {
  Search,
  Heart,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  Gift,
  Boxes,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@components/ui/button";
import { menuAPI } from "@services/api";
import { cn } from "@lib/utils";
import { getMenuIcon } from "@lib/menuIcons";
import { resolveTarget } from "@lib/resolveTarget";
import SessionMenu from "./SessionMenu";
import SafeImage from "@components/ui/safe-image";
import { NotificationBell } from "@features/notifications";
import { useSearchSuggestions } from "@hooks/useSearchSuggestions";
import { useStorefrontConfig } from "@hooks/useStorefrontConfig";
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

const selectSearchWords = (config) => config?.searchWords || [];
const EMPTY = [];

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileQuery, setMobileQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [promoIdx, setPromoIdx] = useState(0);
  const [promoHidden, setPromoHidden] = useState(false);
  const { currency: currencyCode, format } = useCurrency();
  const { language } = useLanguage();
  const { country } = useBuyerCountry();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [spot, setSpot] = useState({ left: 0, width: 0, opacity: 0 });
  const [openMega, setOpenMega] = useState(null);
  const [expandedMenuId, setExpandedMenuId] = useState(null);
  const [searchWordIdx, setSearchWordIdx] = useState(0);

  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const cmdbarRef = useRef(null);
  const megaTimeout = useRef(null);

  const { data: categories = EMPTY } = useActiveCategories();
  const { data: searchWords = EMPTY } = useStorefrontConfig(selectSearchWords);

  const { data: adminMenu = [] } = useQuery({
    queryKey: ["header-menu"],
    queryFn: () => menuAPI.getMenu().then((r) => r.data.data || []),
    staleTime: 300000,
  });

  const cartCount = useCartCount();

  const { count: wishlistCount } = useWishlist();

  const { term: suggestionTerm, suggestions: searchSuggestions, isLoading: searchLoading } = useSearchSuggestions(
    searchQuery,
    { categoryId: selectedCategory },
  );

  const shouldShowSuggestions =
    showSearchSuggestions && suggestionTerm && (searchSuggestions.length > 0 || searchLoading);

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
      if (cmdbarRef.current && !cmdbarRef.current.contains(event.target)) {
        setOpenMega(null);
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

  useEffect(() => {
    if (searchWords.length <= 1 || searchQuery) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) return;
    const t = setInterval(() => setSearchWordIdx((i) => (i + 1) % searchWords.length), 3000);
    return () => clearInterval(t);
  }, [searchWords.length, searchQuery]);

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
  const handleMobileSearch = (e) => {
    e.preventDefault();
    if (!mobileQuery.trim()) return;
    setMobileMenuOpen(false);
    navigate(`/search?${new URLSearchParams({ q: mobileQuery }).toString()}`);
  };
  const handleSuggestionClick = (product) => {
    setShowSearchSuggestions(false);
    setSearchQuery("");
    navigate(getProductPath(product));
  };
  const moveSpot = (e) => {
    const el = e.currentTarget;
    setSpot({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
  };
  const hideSpot = () => setSpot((s) => ({ ...s, opacity: 0 }));

  const openMegaPanel = (id) => {
    if (megaTimeout.current) {
      clearTimeout(megaTimeout.current);
      megaTimeout.current = null;
    }
    setOpenMega(id);
  };
  const closeMegaDelayed = () => {
    megaTimeout.current = setTimeout(() => setOpenMega(null), 200);
  };
  useEffect(() => () => clearTimeout(megaTimeout.current), []);

  return (
    <div className="hdr-fx">
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

      <div className={cn("sticky top-0 z-50 transition-all duration-300", isScrolled ? "bg-[#060318] backdrop-blur-md shadow-lg" : "bg-transparent")}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4 py-2.5">
            <Link to="/" className="flex items-center gap-2 shrink-0" onClick={() => setMobileMenuOpen(false)}>
              <SafeImage
                src="https://res.cloudinary.com/dhuhvbzpj/image/upload/v1773483947/logo_gos33k.png"
                alt="logo"
                className="w-full h-10"
                loading="eager"
              />
            </Link>

            <div className="flex items-center gap-2 md:hidden shrink-0">
              <button
                type="button"
                onClick={() => { navigate("/wishlist"); setMobileMenuOpen(false); }}
                aria-label="Wishlist"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-accent text-fg transition-colors hover:bg-accent/10"
              >
                <Heart className="h-5 w-5" strokeWidth={2} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-fg">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </button>

              <Button
                variant="outline"
                size="icon"
                className="border-accent text-fg hover:bg-accent/10 rounded-lg"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>

            <div className="hidden md:flex flex-1 mx-4 relative" ref={searchContainerRef}>
              <form className="fx-search w-full" role="search" onSubmit={handleSearch}>
                <span className="fx-corner fx-corner-tl" /><span className="fx-corner fx-corner-tr" /><span className="fx-corner fx-corner-bl" /><span className="fx-corner fx-corner-br" />
                <div className="fx-search-row">
                  <span className="fx-search-lead" aria-hidden="true"><Search width={18} height={18} /></span>
                  <input
                    ref={searchInputRef}
                    className="fx-search-input"
                    placeholder={
                      searchWords.length > 0
                        ? `Search “${searchWords[searchWordIdx % searchWords.length]}”…`
                        : "Search games, software, gift cards…"
                    }
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

              {shouldShowSuggestions && (
                <div className="fx-search-panel" role="listbox" aria-label="Search results">
                  <div className="fx-sp-list">
                    {searchLoading ? (
                      <div className="fx-sp-empty">Searching…</div>
                    ) : searchSuggestions.length > 0 ? (
                      searchSuggestions.map((product) => {
                        const { discountPrice, discountPercentage, originalPrice } = calculateProductPrice(product);
                        const platformName = getPlatformName(product);
                        const typeName = getTypeName(product);
                        const offersCount = product.offersCount ?? 0;
                        const regionOffer = getCardRegionOffer(product);
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
                                  <del className="fx-sp-old">{format(originalPrice)}</del>
                                </span>
                              )}
                              {discountPrice != null && <span className="fx-sp-price">{format(discountPrice)}</span>}
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
                    ) : suggestionTerm ? (
                      <div className="fx-sp-empty">No products found. Try a different search.</div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden md:flex items-center gap-3 shrink-0">
              <button className="fx-curr-btn" onClick={() => setSettingsOpen(true)} type="button">
                <img src={`https://flagcdn.com/w20/${String(country || "us").toLowerCase()}.png`} width={22} height={16} alt={country || ""} style={{ borderRadius: 2, objectFit: "cover", flexShrink: 0 }} />
                <span className="fx-curr-label">{language}&nbsp;&nbsp;|&nbsp;&nbsp;{currencyCode}</span>
              </button>

              <SessionMenu />

              <button className="fx-iconbtn" onClick={() => navigate("/wishlist")} aria-label="Wishlist" type="button">
                <Heart className="h-5 w-5" strokeWidth={2} />
                {wishlistCount > 0 && <span className="fx-iconbtn-badge">{wishlistCount > 9 ? "9+" : wishlistCount}</span>}
              </button>

              <button className="fx-iconbtn" onClick={() => setCartOpen((o) => !o)} aria-label="Cart" type="button">
                <ShoppingCart className="h-5 w-5" strokeWidth={2} />
                {cartCount > 0 && <span className="fx-iconbtn-badge">{cartCount > 9 ? "9+" : cartCount}</span>}
              </button>

              {isAuthenticated && <NotificationBell />}
            </div>
          </div>
        </div>

        {adminMenu.length > 0 && (
        <div className="fx-cmdbar container mx-auto" ref={cmdbarRef}>
          <nav className="fx-cmd" aria-label="Browse the store">
            <div className="fx-cmd-track" role="presentation" onMouseLeave={hideSpot}>
              <span className="fx-cmd-spot" aria-hidden="true" style={{ left: spot.left, width: spot.width, opacity: spot.opacity }} />

              {adminMenu.map((item) => {
                const Icon = getMenuIcon(item.icon);
                const headings = item.children || [];
                const to = resolveTarget(item.target);

                if (headings.length === 0) {
                  return to ? (
                    <Link key={item._id} to={to} className="fx-cmd-item" onMouseEnter={moveSpot}>
                      <Icon /> <span className="fx-cmd-label">{item.label}</span>
                    </Link>
                  ) : null;
                }

                const isOpen = openMega === item._id;
                return (
                  <div
                    key={item._id}
                    role="presentation"
                    style={{ flex: "1 1 0", minWidth: 0 }}
                    onMouseEnter={() => openMegaPanel(item._id)}
                    onMouseLeave={closeMegaDelayed}
                    onKeyDown={(e) => e.key === "Escape" && setOpenMega(null)}
                  >
                    <button
                      type="button"
                      className={cn("fx-cmd-item", isOpen && "fx-mega-active")}
                      style={{ width: "100%" }}
                      aria-expanded={isOpen}
                      aria-haspopup="true"
                      onMouseEnter={moveSpot}
                      onFocus={() => openMegaPanel(item._id)}
                      onClick={() => (isOpen ? setOpenMega(null) : openMegaPanel(item._id))}
                    >
                      <Icon /> <span className="fx-cmd-label">{item.label}</span>
                      <ChevronDown className="fx-cmd-caret" />
                    </button>
                  </div>
                );
              })}
            </div>
          </nav>

          <button type="button" className="fx-plus" onClick={() => navigate("/dgmarq-plus")}>
            <span className="fx-plus-spark" aria-hidden="true"><Sparkles width={18} height={18} /></span>
            <span className="fx-plus-text">Save more with <strong>DGMARQ&nbsp;Plus</strong></span>
          </button>

          {adminMenu.map((item) => {
            const headings = item.children || [];
            if (headings.length === 0) return null;

            const isOpen = openMega === item._id;
            const viewAll = resolveTarget(item.viewAllTarget || item.target);

            return (
              <div
                key={item._id}
                className={cn("fx-mega", isOpen && "fx-open")}
                role="region"
                aria-label={item.label}
                onMouseEnter={() => openMegaPanel(item._id)}
                onMouseLeave={closeMegaDelayed}
              >
                <div className="fx-mega-inner">
                  <div className="fx-mega-panel fx-active">
                    {headings.map((heading) => {
                      const headingTo = resolveTarget(heading.target);
                      const HeadingIcon = heading.icon ? getMenuIcon(heading.icon) : null;

                      return (
                      <div key={heading._id} className="fx-mega-col">
                        {headingTo ? (
                          <Link className="fx-catgroup-head" to={headingTo} onClick={() => setOpenMega(null)}>
                            {heading.image ? (
                              <span className="fx-catgroup-ic">
                                <SafeImage src={heading.image} alt="" w={64} />
                              </span>
                            ) : HeadingIcon ? (
                              <span className="fx-catgroup-ic"><HeadingIcon /></span>
                            ) : null}
                            <span className="fx-catgroup-nm">{heading.label}</span>
                          </Link>
                        ) : (
                          <h4 className="fx-mega-heading">{heading.label}</h4>
                        )}
                        <ul className="fx-mega-list">
                          {(heading.children || []).map((link) => {
                            const href = resolveTarget(link.target);
                            if (!href) return null;
                            return (
                              <li key={link._id}>
                                <Link className="fx-mega-link" to={href} onClick={() => setOpenMega(null)}>
                                  {link.label}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      );
                    })}
                  </div>

                  {viewAll && (
                    <Link className="fx-mega-viewall" to={viewAll} onClick={() => setOpenMega(null)}>
                      View All {item.label}
                      <ArrowRight width={14} height={14} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border max-h-[calc(100vh-80px)] overflow-y-auto bg-[#060318]">
            <div className="p-4 space-y-4">
              <form onSubmit={handleMobileSearch} className="flex items-center gap-2">
                <input
                  type="search"
                  aria-label="Search products"
                  className="flex-1 bg-surface-sunken/60 border border-accent rounded-lg px-3 h-10 text-fg text-sm outline-none"
                  placeholder="Search…"
                  value={mobileQuery}
                  onChange={(e) => setMobileQuery(e.target.value)}
                />
                <Button type="submit" className="h-10 bg-gradient-to-r from-[#172AA4] to-[#0E9FE2]" aria-label="Search"><Search className="h-5 w-5" /></Button>
              </form>

              {adminMenu.map((item) => {
                const headings = item.children || [];
                const to = resolveTarget(item.target);
                const closeAll = () => { setMobileMenuOpen(false); setExpandedMenuId(null); };

                if (headings.length === 0) {
                  return to ? (
                    <Link key={item._id} to={to} className="block text-fg hover:text-accent-on-dark py-[10px] px-5 bg-[#07142E] rounded-lg w-full text-center" onClick={closeAll}>
                      {item.label}
                    </Link>
                  ) : null;
                }

                const isExpanded = expandedMenuId === item._id;
                return (
                  <div key={item._id} className="space-y-2">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between text-fg py-[10px] px-5 bg-[#07142E] rounded-lg"
                      onClick={() => setExpandedMenuId(isExpanded ? null : item._id)}
                      aria-expanded={isExpanded}
                    >
                      <span className="font-medium">{item.label}</span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                    </button>

                    {isExpanded && (
                      <div className="pl-4 space-y-3 border-l-2 border-border ml-2">
                        {headings.map((heading) => {
                          const headingTo = resolveTarget(heading.target);
                          return (
                          <div key={heading._id} className="space-y-1">
                            {headingTo ? (
                              <Link to={headingTo} onClick={closeAll} className="block text-xs font-semibold uppercase tracking-wide text-accent-on-dark">
                                {heading.label}
                              </Link>
                            ) : (
                              <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">{heading.label}</p>
                            )}
                            {(heading.children || []).map((link) => {
                              const href = resolveTarget(link.target);
                              if (!href) return null;
                              return (
                                <Link key={link._id} to={href} onClick={closeAll} className="block text-fg-muted hover:text-accent-on-dark py-1 text-sm">
                                  {link.label}
                                </Link>
                              );
                            })}
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              <Link
                to="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 text-fg hover:text-accent-on-dark py-[10px] px-5 bg-[#07142E] rounded-lg w-full"
              >
                <Heart className="h-4 w-4" aria-hidden="true" />
                <span>Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="ml-1 rounded-full bg-accent px-2 text-xs font-semibold text-fg">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Button onClick={() => { navigate("/dgmarq-plus"); setMobileMenuOpen(false); }} className="w-full bg-gradient-to-r from-[#172AA4] to-[#0E9FE2] text-fg">
                Save more with DGMARQ Plus
              </Button>

              <button type="button" onClick={() => { setSettingsOpen(true); setMobileMenuOpen(false); }} className="flex items-center justify-center gap-2.5 w-full py-[10px] px-5 bg-[#07142E] rounded-lg text-fg">
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
