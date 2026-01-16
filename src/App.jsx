import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useSEO } from "./hooks/useSEO";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import ForgotPassword from "./pages/public/ForgotPassword";
import ResetPassword from "./pages/public/ResetPassword";
import AuthCallback from "./pages/AuthCallback";

// Layouts
import AdminLayout from "./layouts/AdminLayout";
import SellerLayout from "./layouts/SellerLayout";
import UserLayout from "./layouts/UserLayout";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import SellersManagement from "./pages/admin/SellersManagement";
import SellerProfileView from "./pages/admin/SellerProfileView";
import ProductsManagement from "./pages/admin/ProductsManagement";
import ProductDetailView from "./pages/admin/ProductDetailView";
import OrdersManagement from "./pages/admin/OrdersManagement";
import PayoutsManagement from "./pages/admin/PayoutsManagement";
import UsersManagement from "./pages/admin/UsersManagement";
import SupportManagement from "./pages/admin/SupportManagement";
import Analytics from "./pages/admin/Analytics";
import Settings from "./pages/admin/Settings";
import CategoriesManagement from "./pages/admin/CategoriesManagement";
import SubcategoriesManagement from "./pages/admin/SubcategoriesManagement";
import PlatformsManagement from "./pages/admin/PlatformsManagement";
import DevicesManagement from "./pages/admin/DevicesManagement";
import RegionsManagement from "./pages/admin/RegionsManagement";
import GenresManagement from "./pages/admin/GenresManagement";
import ThemesManagement from "./pages/admin/ThemesManagement";
import ModesManagement from "./pages/admin/ModesManagement";
import TypesManagement from "./pages/admin/TypesManagement";
import FlashDealsManagement from "./pages/admin/FlashDealsManagement";
import HomepageSlidersManagement from "./pages/admin/HomepageSlidersManagement";
import TrendingCategoriesManagement from "./pages/admin/TrendingCategoriesManagement";
import TrendingOffersManagement from "./pages/admin/TrendingOffersManagement";
import UpcomingReleasesManagement from "./pages/admin/UpcomingReleasesManagement";
import UpcomingGamesManagement from "./pages/admin/UpcomingGamesManagement";
import CouponsManagement from "./pages/admin/CouponsManagement";
import DisputesManagement from "./pages/admin/DisputesManagement";
import ReturnRefundManagement from "./pages/admin/ReturnRefundManagement";
import SubscriptionsManagement from "./pages/admin/SubscriptionsManagement";
import PayoutAccountsManagement from "./pages/admin/PayoutAccountsManagement";
import BundleDeals from "./pages/admin/BundleDeals";
import AdminNotifications from "./pages/admin/Notifications";

// Seller Pages
import SellerDashboard from "./pages/seller/Dashboard";
import SellerOrders from "./pages/seller/Orders";
import SellerProducts from "./pages/seller/Products";
import SellerEarnings from "./pages/seller/Earnings";
import SellerPerformance from "./pages/seller/Performance";
import SellerSupport from "./pages/seller/Support";
import PayoutAccount from "./pages/seller/PayoutAccount";
import SellerChat from "./pages/seller/Chat";
import SellerNotifications from "./pages/seller/Notifications";
import SellerDisputes from "./pages/seller/Disputes";
import SellerReturnRefunds from "./pages/seller/ReturnRefunds";
import SellerSubscriptions from "./pages/seller/Subscriptions";
import SellerLicenseKeys from "./pages/seller/LicenseKeys";
import SellerProfile from "./pages/seller/Profile";
import SellerAnalytics from "./pages/seller/Analytics";
import SellerReviews from "./pages/seller/Reviews";
import ProductCreate from "./pages/seller/ProductCreate";
import ProductEdit from "./pages/seller/ProductEdit";

// User Pages
import UserDashboard from "./pages/user/Dashboard";
import UserOrders from "./pages/user/Orders";
import OrderDetail from "./pages/user/OrderDetail";
import UserWishlist from "./pages/user/Wishlist";
import UserReviews from "./pages/user/Reviews";
import UserProfile from "./pages/user/Profile";
import UserChat from "./pages/user/Chat";
import UserSupport from "./pages/user/Support";
import UserCart from "./pages/user/Cart";
import UserCheckout from "./pages/user/Checkout";
import LicenseKeys from "./pages/user/LicenseKeys";
import UserNotifications from "./pages/user/Notifications";
import UserSubscriptions from "./pages/user/Subscriptions";
import UserDisputes from "./pages/user/Disputes";
import UserReturnRefunds from "./pages/user/ReturnRefunds";
import BecomeSeller from "./pages/user/BecomeSeller";

// Public Pages
import PublicLayout from "./layouts/PublicLayout";
import Home from "./pages/public/Home";
import About from "./pages/public/About";
import ProductDetail from "./pages/public/ProductDetail";
import SearchResults from "./pages/public/SearchResults";
import BestSellers from "./pages/public/BestSellers";
import Cart from "./pages/public/Cart";
import Wishlist from "./pages/public/Wishlist";
import Checkout from "./pages/public/Checkout";
import DGMarketPlus from "./pages/public/DGMarketPlus";
import AboutCompany from "./pages/public/AboutCompany";
import Marketplace from "./pages/public/Marketplace";
import Security from "./pages/public/Security";
import ContactUs from "./pages/public/ContactUs";
import PublicSellerProfile from "./pages/public/SellerProfile";
import Software from "./pages/public/Software";
import RandomKeys from "./pages/public/RandomKeys";
import SteamGiftCard from "./pages/public/SteamGiftCard";
import GiftCards from "./pages/public/GiftCards";
import CategoryListing from "./pages/public/CategoryListing";


function App() {
  // Set default SEO globally for all routes
  // This ensures DEFAULT_SEO is always applied, even if page-specific SEO hasn't loaded yet
  useSEO();

  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/product/:identifier" element={<ProductDetail />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/bestsellers" element={<BestSellers />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/dgmarq-plus" element={<DGMarketPlus />} />
        <Route path="/about-company" element={<AboutCompany />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/security" element={<Security />} />
        <Route path="/contactus" element={<ContactUs />} />
        <Route path="/seller/:sellerId" element={<PublicSellerProfile />} />
        <Route path="/software" element={<Software />} />
        <Route path="/random-keys" element={<RandomKeys />} />
        <Route path="/steam-gift-card" element={<SteamGiftCard />} />
        <Route path="/steam-gift-cards" element={<SteamGiftCard />} />
        <Route path="/gift-cards" element={<GiftCards />} />
        <Route path="/category/:categoryId" element={<CategoryListing />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="sellers" element={<SellersManagement />} />
        <Route path="sellers/:sellerId" element={<SellerProfileView />} />
        <Route path="products" element={<ProductsManagement />} />
        <Route path="products/:productId" element={<ProductDetailView />} />
        <Route path="orders" element={<OrdersManagement />} />
        <Route path="payouts" element={<PayoutsManagement />} />
        <Route path="users" element={<UsersManagement />} />
        <Route path="support" element={<SupportManagement />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="categories" element={<CategoriesManagement />} />
        <Route path="subcategories" element={<SubcategoriesManagement />} />
        <Route path="platforms" element={<PlatformsManagement />} />
        <Route path="devices" element={<DevicesManagement />} />
        <Route path="regions" element={<RegionsManagement />} />
        <Route path="genres" element={<GenresManagement />} />
        <Route path="themes" element={<ThemesManagement />} />
        <Route path="modes" element={<ModesManagement />} />
        <Route path="types" element={<TypesManagement />} />
        <Route path="flash-deals" element={<FlashDealsManagement />} />
        <Route
          path="homepage-sliders"
          element={<HomepageSlidersManagement />}
        />
        <Route
          path="trending-categories"
          element={<TrendingCategoriesManagement />}
        />
        <Route path="trending-offers" element={<TrendingOffersManagement />} />
        <Route
          path="upcoming-releases"
          element={<UpcomingReleasesManagement />}
        />
        <Route
          path="upcoming-games"
          element={<UpcomingGamesManagement />}
        />
        <Route path="coupons" element={<CouponsManagement />} />
        <Route path="disputes" element={<DisputesManagement />} />
        <Route path="return-refund" element={<ReturnRefundManagement />} />
        <Route path="subscriptions" element={<SubscriptionsManagement />} />
        <Route path="payout-accounts" element={<PayoutAccountsManagement />} />
        <Route path="bundle-deals" element={<BundleDeals />} />
        <Route path="" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* Seller Routes */}
      <Route
        path="/seller"
        element={
          <ProtectedRoute allowedRoles={["seller"]}>
            <SellerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<SellerDashboard />} />
        <Route path="orders" element={<SellerOrders />} />
        <Route path="products" element={<SellerProducts />} />
        <Route path="earnings" element={<SellerEarnings />} />
        <Route path="payout-account" element={<PayoutAccount />} />
        <Route path="performance" element={<SellerPerformance />} />
        <Route path="support" element={<SellerSupport />} />
        <Route path="chat" element={<SellerChat />} />
        <Route path="notifications" element={<SellerNotifications />} />
        <Route path="disputes" element={<SellerDisputes />} />
        <Route path="return-refunds" element={<SellerReturnRefunds />} />
        <Route path="subscriptions" element={<SellerSubscriptions />} />
        <Route path="license-keys" element={<SellerLicenseKeys />} />
        <Route path="profile" element={<SellerProfile />} />
        <Route path="analytics" element={<SellerAnalytics />} />
        <Route path="reviews" element={<SellerReviews />} />
        <Route path="products/create" element={<ProductCreate />} />
        <Route path="products/:id/edit" element={<ProductEdit />} />
        <Route path="" element={<Navigate to="/seller/dashboard" replace />} />
      </Route>

      {/* User Routes */}
      {/* CRITICAL: Sellers are redirected away from /user routes by UserLayout
          Even though sellers have ['customer', 'seller'] roles, they should use /seller routes
          UserLayout will redirect sellers to /seller/dashboard */}
      <Route
        path="/user"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <UserLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<UserDashboard />} />
        <Route path="orders" element={<UserOrders />} />
        <Route path="orders/:orderId" element={<OrderDetail />} />
        <Route path="wishlist" element={<UserWishlist />} />
        <Route path="reviews" element={<UserReviews />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="become-seller" element={<BecomeSeller />} />
        <Route path="chat" element={<UserChat />} />
        <Route path="support" element={<UserSupport />} />
        <Route path="cart" element={<UserCart />} />
        <Route path="checkout/:checkoutId" element={<UserCheckout />} />
        <Route path="license-keys" element={<LicenseKeys />} />
        <Route path="notifications" element={<UserNotifications />} />
        <Route path="subscriptions" element={<UserSubscriptions />} />
        <Route path="disputes" element={<UserDisputes />} />
        <Route path="return-refunds" element={<UserReturnRefunds />} />
        <Route path="" element={<Navigate to="/user/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
