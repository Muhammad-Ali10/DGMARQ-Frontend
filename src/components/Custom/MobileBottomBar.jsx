import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Heart,
  ShoppingCart,
  User,
  UserPlus,
  X,
  LogOut,
  LayoutDashboard,
  ShoppingBag,
  Key,
} from "lucide-react";
import { calculateProductPrice, getProductPath, useWishlist } from "@features/catalog";
import { cartAPI, productAPI, authAPI } from "@services/api";
import { logout } from "@store/slices/authSlice";
import { cn } from "@lib/utils";
import { getGuestCartCount } from "@features/cart-checkout";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import SafeImage from "@components/ui/safe-image";
import RegisterPanel from "@components/common/RegisterPanel";

const MobileBottomBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { isAuthenticated, user, roles } = useSelector((state) => state.auth);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchContainerRef = useRef(null);
  const accountMenuRef = useRef(null);
  const accountButtonRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchSuggestions, isLoading: searchLoading } = useQuery({
    queryKey: ["search-suggestions", debouncedSearchQuery, "all"],
    queryFn: async () => {
      if (!debouncedSearchQuery.trim()) return [];
      try {
        const params = {
          search: debouncedSearchQuery,
          limit: 10,
          status: "active",
        };
        const response = await productAPI.getProducts(params);
        return response.data.data?.docs || [];
      } catch {
        return [];
      }
    },
    enabled: debouncedSearchQuery.trim().length > 0,
    staleTime: 60000,
  });

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
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        accountMenuRef.current &&
        accountButtonRef.current &&
        !accountMenuRef.current.contains(event.target) &&
        !accountButtonRef.current.contains(event.target)
      ) {
        setAccountMenuOpen(false);
      }
    };
    if (accountMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [accountMenuOpen]);

  // Shares the ONE ["cart"] query with the Header + mini-cart (react-query
  // dedupes identical keys), so the heavy cart endpoint is fetched once for the
  // whole app instead of once per nav component. Counts update on mutation via
  // the existing invalidateQueries({queryKey:["cart"]}) — never on a timer.
  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartAPI.getCart().then((r) => r.data.data),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const [guestCartCount, setGuestCartCount] = useState(() =>
    typeof getGuestCartCount === "function" ? getGuestCartCount() : 0,
  );
  useEffect(() => {
    if (!isAuthenticated && typeof getGuestCartCount === "function") {
      setGuestCartCount(getGuestCartCount());
      const onGuestCartChange = () => setGuestCartCount(getGuestCartCount());
      window.addEventListener("guestCartChange", onGuestCartChange);
      return () =>
        window.removeEventListener("guestCartChange", onGuestCartChange);
    }
  }, [isAuthenticated]);

  const cartCount = isAuthenticated ? cart?.items?.length || 0 : guestCartCount;

  // Same shared hook as the header and every heart — the ID-ONLY endpoint. This
  // component is mounted on every route too, and used to pull fully-populated
  // products purely to render a number.
  const { count: wishlistCount } = useWishlist();

  const getDashboardRoute = () => {
    const normalizedRoles =
      Array.isArray(roles) && roles.length > 0
        ? roles.map((r) => String(r).toLowerCase())
        : [];

    if (normalizedRoles.includes("admin")) {
      return "/admin/dashboard";
    } else if (normalizedRoles.includes("seller")) {
      return "/seller/dashboard";
    } else {
      return "/user/dashboard";
    }
  };

  const logoutMutation = useMutation({
    mutationFn: () => authAPI.logout(),
    onSuccess: () => {
      dispatch(logout());
      queryClient.clear();
      setAccountMenuOpen(false);
      navigate("/");
    },
    onError: () => {
      dispatch(logout());
      queryClient.clear();
      setAccountMenuOpen(false);
      navigate("/");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getUserDisplay = () => {
    if (user?.profileImage) {
      return (
        <SafeImage
          src={user.profileImage}
          alt={user.name || "User"}
          className="w-8 h-8 rounded-full object-cover border-2 border-accent/50"
        />
      );
    }

    const initials = user?.name
      ? user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "U";

    return (
      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-fg text-sm font-semibold border-2 border-accent/50">
        {initials}
      </div>
    );
  };

  const isActive = (path) => {
    if (path === "/search") {
      return location.pathname === "/search";
    }
    if (path === "/wishlist") {
      return location.pathname === "/wishlist";
    }
    if (path === "/cart") {
      return location.pathname === "/cart";
    }
    if (path === "/account") {
      return (
        location.pathname.startsWith("/admin/") ||
        location.pathname.startsWith("/seller/") ||
        location.pathname.startsWith("/user/")
      );
    }
    return false;
  };

  const handleSearchClick = () => {
    setSearchOpen(!searchOpen);
    setAccountMenuOpen(false);
    if (!searchOpen) {
      setTimeout(() => {
        const input = searchContainerRef.current?.querySelector("input");
        if (input) input.focus();
      }, 100);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchSuggestions(value.trim().length > 0);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const params = new URLSearchParams({ q: searchQuery });
    setShowSearchSuggestions(false);
    setSearchOpen(false);
    navigate(`/search?${params.toString()}`);
  };

  const handleSuggestionClick = (product) => {
    setShowSearchSuggestions(false);
    setSearchQuery("");
    setSearchOpen(false);
    navigate(getProductPath(product));
  };

  const handleWishlist = () => {
    navigate("/wishlist");
  };

  const handleCart = () => {
    navigate("/cart");
  };

  const handleAccountClick = () => {
    setAccountMenuOpen(!accountMenuOpen);
    setSearchOpen(false);
  };

  const shouldShowSuggestions =
    showSearchSuggestions &&
    debouncedSearchQuery.trim() &&
    (searchSuggestions?.length > 0 || searchLoading);

  return (
    <>
      {/* Search Popup */}
      {searchOpen && (
        <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm md:hidden flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#041536] border-2 border-border-interactive rounded-lg shadow-2xl p-4 min-h-[400px] max-h-[85vh] flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-fg font-semibold flex-1">
                Search Products
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                  setShowSearchSuggestions(false);
                }}
                className="text-fg hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <form
              onSubmit={handleSearchSubmit}
              ref={searchContainerRef}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="relative flex-1 flex flex-col min-h-0">
                <div className="flex items-center bg-surface-sunken/50 border border-accent rounded-lg overflow-hidden mb-3">
                  <Input
                    type="text"
                    placeholder="What are you looking for?"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="border-0 bg-transparent text-fg placeholder:text-gray-400 focus-visible:ring-0 flex-1 h-12 text-base"
                  />
                  <Button
                    type="submit"
                    className="bg-accent hover:bg-accent/90 rounded-none h-12 px-4"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </div>

                {/* Search Suggestions */}
                {shouldShowSuggestions && (
                  <div className="flex-1 bg-surface-sunken border border-border rounded-lg shadow-xl overflow-y-auto z-50 min-h-[300px]">
                    {searchLoading ? (
                      <div className="p-4 text-center text-fg-muted">
                        Searching...
                      </div>
                    ) : searchSuggestions && searchSuggestions.length > 0 ? (
                      <div className="py-2">
                        {searchSuggestions.map((product) => {
                          const {
                            discountPrice,
                            discountPercentage,
                            originalPrice,
                          } = calculateProductPrice(product);
                          return (
                            <button
                              key={product._id}
                              type="button"
                              onClick={() => handleSuggestionClick(product)}
                              className="w-full px-4 py-3 hover:bg-gray-800/50 flex items-center gap-3 text-left"
                            >
                              {product.images?.[0] && (
                                <SafeImage
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-fg font-medium truncate">
                                  {product.name}
                                </div>
                                {discountPrice && (
                                  <div className="text-accent-on-dark text-sm">
                                    ${discountPrice.toFixed(2)}
                                  </div>
                                )}
                                {discountPercentage > 0 && (
                                  <h3 className="text-xs md:text-sm font-semibold px-1 py-0.5 rounded-[6px] whitespace-nowrap bg-gradient-to-r from-[#172AA4] to-[#0E9FE2]">
                                    {`-${discountPercentage.toFixed(0)}%`}
                                  </h3>
                                )}
                                {discountPercentage > 0 && (
                                  <del className="text-xs md:text-sm font-normal uppercase">
                                    ${originalPrice.toFixed(2)}
                                  </del>
                                )}
                              </div>
                              {product.stock !== undefined && (
                                    <span
                                      className={`text-[11px] px-2 py-0.5 rounded ${
                                        product.stock > 0
                                          ? "bg-green-900/30 text-success"
                                          : "bg-red-900/30 text-danger"
                                      }`}
                                    >
                                      {product.stock > 0
                                        ? `${product.stock} in stock`
                                        : "Out of stock"}
                                    </span>
                                  )}
                            </button>
                          );
                        })}
                      </div>
                    ) : debouncedSearchQuery.trim() ? (
                      <div className="p-4 text-center text-fg-muted">
                        No products found
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Menu Popup */}
      {accountMenuOpen && (
        <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm md:hidden flex items-center justify-center p-4">
          <div
            ref={accountMenuRef}
            className="w-full max-w-sm bg-[#041536] border border-border rounded-lg shadow-xl z-50 overflow-hidden max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="text-fg font-semibold">
                {isAuthenticated ? "Account" : "Register"}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAccountMenuOpen(false)}
                className="text-fg hover:bg-gray-800 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="py-2">
              {!isAuthenticated ? (
                <>
                  <RegisterPanel onNavigate={() => setAccountMenuOpen(false)} className="px-4 pb-2" />
                </>
              ) : (
                <>
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-3">
                      {getUserDisplay()}
                      <div className="flex-1 min-w-0">
                        <p className="text-fg font-medium truncate">
                          {user?.name || "User"}
                        </p>
                        <p className="text-fg-muted text-sm truncate">
                          {user?.email || ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Link */}
                  <button
                    onClick={() => {
                      setAccountMenuOpen(false);
                      navigate(getDashboardRoute());
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors flex items-center gap-3 text-fg"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Dashboard</span>
                  </button>

                  {/* Orders Link - Only show for customers */}
                  {!roles?.some(
                    (r) => String(r).toLowerCase() === "seller",
                  ) && (
                    <>
                      <button
                        onClick={() => {
                          setAccountMenuOpen(false);
                          navigate("/user/orders");
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors flex items-center gap-3 text-fg"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        <span>Orders</span>
                      </button>

                      {/* License Keys Link */}
                      <button
                        onClick={() => {
                          setAccountMenuOpen(false);
                          navigate("/user/license-keys");
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors flex items-center gap-3 text-fg"
                      >
                        <Key className="w-5 h-5" />
                        <span>License Keys</span>
                      </button>
                    </>
                  )}

                  <div className="border-t border-border my-1"></div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="w-full px-4 py-3 text-left hover:bg-red-500/10 transition-colors flex items-center gap-3 text-danger hover:text-red-300 disabled:opacity-50"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>
                      {logoutMutation.isPending ? "Logging out..." : "Logout"}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[100] bg-[#041536] border-t-2 border-border-interactive shadow-2xl md:hidden"
    
        aria-label="Mobile navigation"
      >
        {/* Section 1 */}
        <div className="grid grid-cols-4 border-b border-border-interactive">
          <button
            type="button"
            onClick={handleSearchClick}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-colors py-2",
              searchOpen || isActive("/search")
                ? "text-accent-on-dark"
                : "text-fg-muted hover:text-white",
            )}
            aria-label="Search"
          >
            <Search className="h-5 w-5" strokeWidth={2} />
            <span className="text-xs font-medium">Search</span>
          </button>

          <button
            type="button"
            onClick={handleWishlist}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 border-l border-border-interactive transition-colors py-2",
              isActive("/wishlist")
                ? "text-accent-on-dark"
                : "text-fg-muted hover:text-white",
            )}
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" strokeWidth={2} />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-4 bg-accent text-fg text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                {wishlistCount > 9 ? "9+" : wishlistCount}
              </span>
            )}
            <span className="text-xs font-medium">Wishlist</span>
          </button>

          <button
            type="button"
            onClick={handleCart}
            className={cn(
              "relative flex flex-col items-center justify-center border-l border-border-interactive gap-1 transition-colors py-2",
              isActive("/cart")
                ? "text-accent-on-dark"
                : "text-fg-muted hover:text-white",
            )}
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" strokeWidth={2} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-4 bg-accent text-fg text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
            <span className="text-xs font-medium">Cart</span>
          </button>

          <button
            type="button"
            ref={accountButtonRef}
            onClick={handleAccountClick}
            className={cn(
              "flex flex-col items-center justify-center gap-1 border-l border-border-interactive transition-colors py-2",
              accountMenuOpen || isActive("/account")
                ? "text-accent-on-dark"
                : "text-fg-muted hover:text-white",
            )}
            aria-label={isAuthenticated ? "Account" : "Register"}
          >
            {isAuthenticated ? (
              <>
                <User className="h-5 w-5" strokeWidth={2} />
                <span className="text-xs font-medium">Account</span>
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" strokeWidth={2} />
                <span className="text-xs font-medium">Register</span>
              </>
            )}
          </button>
        </div>

      </nav>
    </>
  );
};

export default MobileBottomBar;
