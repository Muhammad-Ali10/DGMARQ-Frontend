import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Heart, ShoppingCart, User, UserPlus, X, LogIn, LogOut, LayoutDashboard, ShoppingBag, Key, Info } from 'lucide-react';
import { cartAPI, userAPI, productAPI, authAPI } from '../../services/api';
import { logout } from '../../store/slices/authSlice';
import { cn } from '../../lib/utils';
import { getGuestCartCount } from '../../utils/guestCart';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const MobileBottomBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { isAuthenticated, user, roles } = useSelector((state) => state.auth);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
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
    queryKey: ['search-suggestions', debouncedSearchQuery, 'all'],
    queryFn: async () => {
      if (!debouncedSearchQuery.trim()) return [];
      try {
        const params = {
          search: debouncedSearchQuery,
          limit: 10,
          status: 'active',
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
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
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
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [accountMenuOpen]);

  const { data: cartData } = useQuery({
    queryKey: ['cart-count'],
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

  const [guestCartCount, setGuestCartCount] = useState(() => (typeof getGuestCartCount === 'function' ? getGuestCartCount() : 0));
  useEffect(() => {
    if (!isAuthenticated && typeof getGuestCartCount === 'function') {
      setGuestCartCount(getGuestCartCount());
      const onGuestCartChange = () => setGuestCartCount(getGuestCartCount());
      window.addEventListener('guestCartChange', onGuestCartChange);
      return () => window.removeEventListener('guestCartChange', onGuestCartChange);
    }
  }, [isAuthenticated]);

  const cartCount = isAuthenticated ? (cartData?.count || 0) : guestCartCount;

  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist-count'],
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

  const getDashboardRoute = () => {
    const normalizedRoles = Array.isArray(roles) && roles.length > 0
      ? roles.map(r => String(r).toLowerCase())
      : [];
    
    if (normalizedRoles.includes('admin')) {
      return '/admin/dashboard';
    } else if (normalizedRoles.includes('seller')) {
      return '/seller/dashboard';
    } else {
      return '/user/dashboard';
    }
  };

  const logoutMutation = useMutation({
    mutationFn: () => authAPI.logout(),
    onSuccess: () => {
      dispatch(logout());
      queryClient.clear();
      setAccountMenuOpen(false);
      navigate('/');
    },
    onError: () => {
      dispatch(logout());
      queryClient.clear();
      setAccountMenuOpen(false);
      navigate('/');
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleGoogleLogin = () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    const baseUrl = apiBaseUrl.replace('/api/v1', '');
    window.location.href = `${baseUrl}/api/v1/user/auth/google`;
  };

  const getUserDisplay = () => {
    if (user?.profileImage) {
      return (
        <img
          src={user.profileImage}
          alt={user.name || 'User'}
          className="w-8 h-8 rounded-full object-cover border-2 border-accent/50"
        />
      );
    }
    
    const initials = user?.name
      ? user.name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'U';

    return (
      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-semibold border-2 border-accent/50">
        {initials}
      </div>
    );
  };

  const isActive = (path) => {
    if (path === '/search') {
      return location.pathname === '/search';
    }
    if (path === '/wishlist') {
      return location.pathname === '/wishlist';
    }
    if (path === '/cart') {
      return location.pathname === '/cart' || location.pathname === '/user/cart';
    }
    if (path === '/account') {
      return location.pathname.startsWith('/admin/') || 
             location.pathname.startsWith('/seller/') || 
             location.pathname.startsWith('/user/');
    }
    return false;
  };

  const handleSearchClick = () => {
    setSearchOpen(!searchOpen);
    setAccountMenuOpen(false);
    if (!searchOpen) {
      setTimeout(() => {
        const input = searchContainerRef.current?.querySelector('input');
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
    setSearchQuery('');
    setSearchOpen(false);
    navigate(`/product/${product._id}`);
  };

  const handleWishlist = () => {
    navigate('/wishlist');
  };

  const handleCart = () => {
    navigate('/cart');
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
          <div className="w-full max-w-md bg-[#041536] border-2 border-gray-600 rounded-lg shadow-2xl p-4 min-h-[400px] max-h-[85vh] flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-white font-semibold flex-1">Search Products</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                  setShowSearchSuggestions(false);
                }}
                className="text-white hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <form onSubmit={handleSearchSubmit} ref={searchContainerRef} className="flex-1 flex flex-col min-h-0">
              <div className="relative flex-1 flex flex-col min-h-0">
                <div className="flex items-center bg-gray-900/50 border border-accent rounded-lg overflow-hidden mb-3">
                  <Input
                    type="text"
                    placeholder="What are you looking for?"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="border-0 bg-transparent text-white placeholder:text-gray-400 focus-visible:ring-0 flex-1 h-12 text-base"
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
                  <div className="flex-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-y-auto z-50 min-h-[300px]">
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
                            className="w-full px-4 py-3 hover:bg-gray-800/50 flex items-center gap-3 text-left"
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
          </div>
        </div>
      )}

      {/* Account Menu Popup */}
      {accountMenuOpen && (
        <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm md:hidden flex items-center justify-center p-4">
          <div 
            ref={accountMenuRef}
            className="w-full max-w-sm bg-[#041536] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
              <h3 className="text-white font-semibold">
                {isAuthenticated ? 'Account' : 'Register'}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAccountMenuOpen(false)}
                className="text-white hover:bg-gray-800 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="py-2">
              {!isAuthenticated ? (
                <>
                  {/* Google Login */}
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors flex items-center gap-3 text-white"
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    </div>
                    <span className="font-medium">Continue with Google</span>
                  </button>

                  <div className="border-t border-gray-700 my-1"></div>

                  {/* Login Button */}
                  <button
                    onClick={() => {
                      setAccountMenuOpen(false);
                      navigate('/login');
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors flex items-center gap-3 text-white"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>Login</span>
                  </button>

                  {/* Register Button */}
                  <button
                    onClick={() => {
                      setAccountMenuOpen(false);
                      navigate('/register');
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors flex items-center gap-3 text-white"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>Register</span>
                  </button>

                  {/* Info Link */}
                  <button
                    onClick={() => {
                      setAccountMenuOpen(false);
                      navigate('/about');
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors flex items-center gap-3 text-gray-400 hover:text-white"
                  >
                    <Info className="w-5 h-5" />
                    <span>About / Info</span>
                  </button>
                </>
              ) : (
                <>
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                      {getUserDisplay()}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{user?.name || 'User'}</p>
                        <p className="text-gray-400 text-sm truncate">{user?.email || ''}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Link */}
                  <button
                    onClick={() => {
                      setAccountMenuOpen(false);
                      navigate(getDashboardRoute());
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors flex items-center gap-3 text-white"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Dashboard</span>
                  </button>

                  {/* Orders Link - Only show for customers */}
                  {!roles?.some(r => String(r).toLowerCase() === 'seller') && (
                    <>
                      <button
                        onClick={() => {
                          setAccountMenuOpen(false);
                          navigate('/user/orders');
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors flex items-center gap-3 text-white"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        <span>Orders</span>
                      </button>

                      {/* License Keys Link */}
                      <button
                        onClick={() => {
                          setAccountMenuOpen(false);
                          navigate('/user/license-keys');
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors flex items-center gap-3 text-white"
                      >
                        <Key className="w-5 h-5" />
                        <span>License Keys</span>
                      </button>
                    </>
                  )}

                  <div className="border-t border-gray-700 my-1"></div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="w-full px-4 py-3 text-left hover:bg-red-500/10 transition-colors flex items-center gap-3 text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>{logoutMutation.isPending ? 'Logging out...' : 'Logout'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-[100] bg-[#041536] border-t-2 border-gray-600 shadow-2xl md:hidden"
        style={{ 
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)',
          minHeight: '4rem',
          width: '100%',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div className="flex items-center justify-around w-full h-16 px-2">
          {/* Search Button */}
          <button
            onClick={handleSearchClick}
            className={cn(
              "flex flex-col items-center justify-center gap-1 min-w-[60px] h-full px-2 transition-colors",
              searchOpen || isActive('/search')
                ? "text-accent"
                : "text-gray-300 hover:text-white"
            )}
            aria-label="Search"
          >
            <Search className="h-5 w-5" strokeWidth={2} />
            <span className="text-xs font-medium">Search</span>
          </button>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className={cn(
            "relative flex flex-col items-center justify-center gap-1 min-w-[60px] h-full px-2 transition-colors",
            isActive('/wishlist')
              ? "text-accent"
              : "text-gray-300 hover:text-white"
          )}
          aria-label="Wishlist"
        >
          <Heart className="h-5 w-5" strokeWidth={2} />
          {wishlistCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
              {wishlistCount > 9 ? "9+" : wishlistCount}
            </span>
          )}
          <span className="text-xs font-medium">Wishlist</span>
        </button>

        {/* Cart Button */}
        <button
          onClick={handleCart}
          className={cn(
            "relative flex flex-col items-center justify-center gap-1 min-w-[60px] h-full px-2 transition-colors",
            isActive('/cart')
              ? "text-accent"
              : "text-gray-300 hover:text-white"
          )}
          aria-label="Cart"
        >
          <ShoppingCart className="h-5 w-5" strokeWidth={2} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
          <span className="text-xs font-medium">Cart</span>
        </button>

        {/* Register/Account Button */}
        <div className="relative">
          <button
            ref={accountButtonRef}
            onClick={handleAccountClick}
            className={cn(
              "flex flex-col items-center justify-center gap-1 min-w-[60px] h-full px-2 transition-colors",
              accountMenuOpen || isActive('/account')
                ? "text-accent"
                : "text-gray-300 hover:text-white"
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
      </div>
    </nav>
    </>
  );
};

export default MobileBottomBar;
